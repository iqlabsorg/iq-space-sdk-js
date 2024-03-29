import {
  makeFixedRateListingTermsFromUnconverted,
  makeFixedRateWithRewardListingTermsFromUnconverted,
} from '@iqprotocol/iq-space-protocol';
import { IListingTermsRegistry } from '@iqprotocol/iq-space-protocol/typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumberish } from 'ethers';
import { deployments, ethers } from 'hardhat';
import { AddressTranslator, AssetType, IQSpace, ListingTermsInfo, ListingTermsRegistryAdapter } from '../src';
import { findListingTermsIdByTransaction } from './helpers/listing-renting';
import { createListing, setupForRenting, setupUniverseAndRegisteredWarper } from './helpers/setup';
import {
  COMMON_BASE_RATE,
  COMMON_ID,
  COMMON_REWARD_RATE,
  TEST_BASE_TOKEN_DECIMALS,
  toAccountId,
} from './helpers/utils';

/**
 * @group integration
 */
describe('ListingTermsRegistryAdapter', () => {
  /** Signers */
  let deployer: SignerWithAddress;
  let lister: SignerWithAddress;

  /** Contracts */
  let listingTermsRegistry: IListingTermsRegistry;

  /** SDK */
  let listingTermsRegistryAdapter: ListingTermsRegistryAdapter;
  let deployerListingTermsRegistryAdapter: ListingTermsRegistryAdapter;

  /** Data Structs */
  let listingCreationTxHash: string;
  let warperReference: AssetType;

  /** Constants */
  const fixedTerms = makeFixedRateListingTermsFromUnconverted(COMMON_BASE_RATE, TEST_BASE_TOKEN_DECIMALS);
  const fixedTermsInfo: ListingTermsInfo = {
    id: COMMON_ID,
    ...fixedTerms,
  };
  const fixedTermsWithRewardInfo: ListingTermsInfo = {
    id: COMMON_ID,
    ...makeFixedRateWithRewardListingTermsFromUnconverted(
      COMMON_BASE_RATE,
      COMMON_REWARD_RATE,
      TEST_BASE_TOKEN_DECIMALS,
    ),
  };

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');
    lister = await ethers.getNamedSigner('assetOwner');

    listingTermsRegistry = await ethers.getContract('ListingTermsRegistry');

    const iqspace = await IQSpace.init({ signer: lister });
    const deployerIqspace = await IQSpace.init({ signer: deployer });
    listingTermsRegistryAdapter = iqspace.listingTermsRegistry(toAccountId(listingTermsRegistry.address));
    deployerListingTermsRegistryAdapter = deployerIqspace.listingTermsRegistry(
      toAccountId(listingTermsRegistry.address),
    );
  });

  describe('listingTerms', () => {
    describe('with fixed rate tax', () => {
      beforeEach(async () => {
        await setupForRenting();
      });

      it('should return listing terms with fixed rate tax', async () => {
        const terms = await listingTermsRegistryAdapter.listingTerms(COMMON_ID);

        expect(terms).to.be.deep.equal(fixedTermsInfo);
      });
    });

    describe('with fixed rate and reward tax', () => {
      beforeEach(async () => {
        await setupForRenting(true);
      });

      it('should return listing terms with fixed rate and reward tax', async () => {
        const terms = await listingTermsRegistryAdapter.listingTerms(COMMON_ID);
        expect(terms).to.be.deep.equal(fixedTermsWithRewardInfo);
      });
    });
  });

  describe('when universe, warper and listing is setup', () => {
    beforeEach(async () => {
      ({ listingCreationTxHash, warperReference } = await setupForRenting());
    });

    describe('allListingTerms', () => {
      it('should return all terms for a given listing', async () => {
        const infos = await listingTermsRegistryAdapter.allListingTerms(
          { listingId: COMMON_ID, universeId: COMMON_ID, warper: warperReference },
          0,
          5,
        );
        expect(infos.length).to.be.greaterThan(0);
        expect(infos[0]).to.be.deep.equal(fixedTermsInfo);
      });
    });

    describe('listingTermsWithParams', () => {
      it('should return listing terms with additional parameters', async () => {
        const termsWithParams = await listingTermsRegistryAdapter.listingTermsWithParams(COMMON_ID);

        expect(termsWithParams).to.include(fixedTermsInfo);
        expect(termsWithParams.universeId).to.be.eq(COMMON_ID);
        expect(termsWithParams.listingId).to.be.eq(COMMON_ID);
      });
    });

    describe('findListingTermsIdByCreationTransaction', () => {
      it('should return created listing id from transaction hash', async () => {
        const termsId = await listingTermsRegistryAdapter.findListingTermsIdByCreationTransaction(
          listingCreationTxHash,
        );
        expect(termsId).to.be.eq(COMMON_ID);
      });
    });

    describe('findListingTermsByCreationTransaction', () => {
      it('should return created listing info from transaction hash', async () => {
        const terms = await listingTermsRegistryAdapter.findListingTermsByCreationTransaction(listingCreationTxHash);
        expect(terms).to.be.deep.equal(fixedTermsInfo);
      });
    });
  });

  describe('terms management', () => {
    let listingTermsId: BigNumberish;

    beforeEach(async () => {
      const { warperData } = await setupUniverseAndRegisteredWarper();
      warperReference = warperData.warperReference;
      await createListing();
    });

    describe('global terms', () => {
      beforeEach(async () => {
        const tx = await deployerListingTermsRegistryAdapter.registerGlobalListingTerms(COMMON_ID, fixedTerms);
        listingTermsId = (await findListingTermsIdByTransaction(tx.hash, 'global'))!;
      });

      describe('registerGlobalListingTerms', () => {
        it('should register global listing terms', async () => {
          expect(await listingTermsRegistry.areRegisteredListingTerms(listingTermsId)).to.be.eq(true);
        });
      });

      describe('removeGlobalListingTerms', () => {
        it('should remove global listing terms', async () => {
          await deployerListingTermsRegistryAdapter.removeGlobalListingTerms(COMMON_ID, listingTermsId);
          expect(await listingTermsRegistry.areRegisteredListingTerms(listingTermsId)).to.be.eq(false);
        });
      });
    });

    describe('universe terms', () => {
      beforeEach(async () => {
        const tx = await deployerListingTermsRegistryAdapter.registerUniverseListingTerms(
          COMMON_ID,
          COMMON_ID,
          fixedTerms,
        );
        listingTermsId = (await findListingTermsIdByTransaction(tx.hash, 'universe'))!;
      });

      describe('registerUniverseListingTerms', () => {
        it('should register universe listing terms', async () => {
          expect(await listingTermsRegistry.areRegisteredListingTerms(listingTermsId)).to.be.eq(true);
        });
      });

      describe('removeGlobalListingTerms', () => {
        it('should remove universe listing terms', async () => {
          await deployerListingTermsRegistryAdapter.removeUniverseListingTerms(COMMON_ID, COMMON_ID, listingTermsId);
          expect(await listingTermsRegistry.areRegisteredListingTerms(listingTermsId)).to.be.eq(false);
        });
      });
    });

    describe('warper terms', () => {
      beforeEach(async () => {
        const tx = await deployerListingTermsRegistryAdapter.registerWarperListingTerms(
          COMMON_ID,
          warperReference,
          fixedTerms,
        );
        listingTermsId = (await findListingTermsIdByTransaction(tx.hash, 'warper'))!;
      });

      describe('registerWarperListingTerms', () => {
        it('should register warper listing terms', async () => {
          expect(await listingTermsRegistry.areRegisteredListingTerms(listingTermsId)).to.be.eq(true);
        });
      });

      describe('removeWarperListingTerms', () => {
        it('should remove warper listing terms', async () => {
          await deployerListingTermsRegistryAdapter.removeWarperListingTerms(
            COMMON_ID,
            warperReference,
            listingTermsId,
          );
          expect(await listingTermsRegistry.areRegisteredListingTerms(listingTermsId)).to.be.eq(false);
        });
      });
    });
  });

  describe('areRegisteredListingTerms', () => {
    describe('when not registered', () => {
      it('should return false', async () => {
        expect(await listingTermsRegistryAdapter.areRegisteredListingTerms(99)).to.be.eq(false);
      });
    });

    describe('when registered', () => {
      beforeEach(async () => {
        await setupForRenting();
      });

      it('should return true', async () => {
        expect(await listingTermsRegistryAdapter.areRegisteredListingTerms(COMMON_ID)).to.be.eq(true);
      });
    });
  });

  describe('areRegisteredListingTermsWithParams', () => {
    describe('when not registered', () => {
      it('should return false', async () => {
        expect(
          await listingTermsRegistryAdapter.areRegisteredListingTermsWithParams(99, {
            listingId: COMMON_ID,
            universeId: COMMON_ID,
            warper: AddressTranslator.createAssetType(toAccountId(ethers.constants.AddressZero), 'erc721'),
          }),
        ).to.be.eq(false);
      });
    });

    describe('when registered', () => {
      beforeEach(async () => {
        ({ warperReference } = await setupForRenting());
      });

      it('should return true', async () => {
        expect(
          await listingTermsRegistryAdapter.areRegisteredListingTermsWithParams(COMMON_ID, {
            listingId: COMMON_ID,
            universeId: COMMON_ID,
            warper: warperReference,
          }),
        ).to.be.eq(true);
      });
    });
  });
});
