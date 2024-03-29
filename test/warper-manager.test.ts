import { ERC721Mock, ERC721WarperController, IMetahub, IWarperManager } from '@iqprotocol/iq-space-protocol/typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AssetType } from 'caip';
import { expect } from 'chai';
import hre, { deployments, ethers } from 'hardhat';
import { AddressTranslator, IQSpace, WarperManagerAdapter } from '../src';
import { setupUniverseAndRegisteredWarper } from './helpers/setup';
import { COMMON_ID, toAccountId } from './helpers/utils';

/**
 * @group integration
 */
describe('WarperManagerAdapter', () => {
  /** Signers */
  let deployer: SignerWithAddress;
  let random: SignerWithAddress;

  /** Contracts */
  let warperManager: IWarperManager;
  let warperController: ERC721WarperController;
  let collection: ERC721Mock;
  let metahub: IMetahub;

  /** SDK */
  let iqspace: IQSpace;
  let warperManagerAdapter: WarperManagerAdapter;

  /** Data Structs */
  let warperReference: AssetType;
  let warperName: string;

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');
    [random] = await ethers.getUnnamedSigners();

    warperManager = await ethers.getContract('WarperManager');
    warperController = await ethers.getContract('ERC721WarperController');
    collection = await ethers.getContract('ERC721Mock');
    metahub = await ethers.getContract('Metahub');

    iqspace = await IQSpace.init({ signer: deployer });
    warperManagerAdapter = iqspace.warperManager(toAccountId(warperManager.address));

    const { warperData } = await setupUniverseAndRegisteredWarper();
    warperName = warperData.warperName;
    warperReference = warperData.warperReference;
  });

  describe('pauseWarper', () => {
    beforeEach(async () => {
      await warperManagerAdapter.pauseWarper(warperReference);
    });

    it('should pause the warper', async () => {
      const info = await warperManager.warperInfo(warperReference.assetName.reference);
      expect(info.paused).to.be.eq(true);
    });

    describe('unpauseWarper', () => {
      it('should unpause the warper', async () => {
        await warperManagerAdapter.unpauseWarper(warperReference);
        const info = await warperManager.warperInfo(warperReference.assetName.reference);
        expect(info.paused).to.be.eq(false);
      });
    });
  });

  describe('universeWarperCount', () => {
    it('should return number of warpers registered in the universe', async () => {
      const count = await warperManagerAdapter.universeWarperCount(COMMON_ID);
      expect(count.toBigInt()).to.be.eq(1n);
    });
  });

  describe('universeWarpers', () => {
    it('should return a list of warpers registered in the universe', async () => {
      const warpers = await warperManagerAdapter.universeWarpers(COMMON_ID, 0, 1);
      expect(warpers.length).to.be.greaterThan(0);
      expect(warpers[0].name).to.be.eq(warperName);
      expect(warpers[0].self).to.be.deep.equal(warperReference);
    });
  });

  describe('universeAssetWarperCount', () => {
    describe('when asset does not have a warper', () => {
      it('should return 0', async () => {
        const count = await warperManagerAdapter.universeAssetWarperCount(
          COMMON_ID,
          AddressTranslator.createAssetType(toAccountId(random.address), 'erc721'),
        );
        expect(count.toBigInt()).to.be.eq(0n);
      });
    });

    describe('when asset has a warper', () => {
      it('should return warper count', async () => {
        const count = await warperManagerAdapter.universeAssetWarperCount(
          COMMON_ID,
          AddressTranslator.createAssetType(toAccountId(collection.address), 'erc721'),
        );
        expect(count.toBigInt()).to.be.eq(1n);
      });
    });
  });

  describe('universeAssetWarpers', () => {
    it('should return asset warpers', async () => {
      const warpers = await warperManagerAdapter.universeAssetWarpers(
        COMMON_ID,
        AddressTranslator.createAssetType(toAccountId(collection.address), 'erc721'),
        0,
        1,
      );
      expect(warpers.length).to.be.greaterThan(0);
      expect(warpers[0].name).to.be.eq(warperName);
      expect(warpers[0].self).to.be.deep.equal(warperReference);
    });
  });

  describe('isWarperAdmin', () => {
    it('should return false if account is not warper admin', async () => {
      const isAdmin = await warperManagerAdapter.isWarperAdmin(warperReference, toAccountId(random.address));
      expect(isAdmin).to.be.eq(false);
    });

    it('should return true if account is warper admin', async () => {
      const isAdmin = await warperManagerAdapter.isWarperAdmin(warperReference, toAccountId(deployer.address));
      expect(isAdmin).to.be.eq(true);
    });
  });

  describe('warper', () => {
    it('should return info about warper', async () => {
      const warper = await warperManagerAdapter.warper(warperReference);
      expect(warper.name).to.be.eq(warperName);
      expect(warper.self).to.be.deep.equal(warperReference);
    });
  });

  describe('metahub', () => {
    it('should return metahub account id', async () => {
      const metahubAccountId = await warperManagerAdapter.metahub();
      expect(metahubAccountId.address).to.be.eq(metahub.address);
    });
  });

  describe('warperController', () => {
    it('should return warper controller account id', async () => {
      const warprControllerAccountId = await warperManagerAdapter.warperController(warperReference);
      expect(warprControllerAccountId.address).to.be.eq(warperController.address);
    });
  });

  describe('setWarperController', () => {
    let newController: ERC721WarperController;

    beforeEach(async () => {
      newController = (await hre.run('deploy:asset:warper:controller:erc721:v1', {
        unsafe: true,
        ignoreCache: true,
        isSerialDeployment: true,
      })) as ERC721WarperController;
      await warperManagerAdapter.setWarperController([warperReference], toAccountId(newController.address));
    });

    it('should set new controller for given warpers', async () => {
      const warprControllerAccountId = await warperManagerAdapter.warperController(warperReference);
      expect(warprControllerAccountId.address).to.be.eq(newController.address);
    });
  });
});
