import { ERC721AssetVault, ERC721WarperController, IAssetClassRegistry } from '@iqprotocol/iq-space-protocol/typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { deployments, ethers } from 'hardhat';
import { AssetClassRegistryAdapter, IQSpace } from '../src';
import { toAccountId } from './helpers/utils';

/**
 * @group integration
 */
describe('AssetClassRegistryAdapter', () => {
  /** Signers */
  let deployer: SignerWithAddress;

  /** Contracts */
  let assetClassRegistry: IAssetClassRegistry;
  let vault: ERC721AssetVault;
  let controller: ERC721WarperController;

  /** SDK */
  let assetClassRegistryAdapter: AssetClassRegistryAdapter;

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');

    assetClassRegistry = await ethers.getContract('AssetClassRegistry');
    vault = await ethers.getContract('ERC721AssetVault');
    controller = await ethers.getContract('ERC721WarperController');

    const iqSpace = await IQSpace.init({ signer: deployer });
    assetClassRegistryAdapter = iqSpace.assetClassRegistry(toAccountId(assetClassRegistry.address));
  });

  describe('assetClassConfig', () => {
    it('should return asset class config', async () => {
      const config = await assetClassRegistryAdapter.assetClassConfig('erc721');
      expect(config).to.eql({
        vault: toAccountId(vault.address),
        controller: toAccountId(controller.address),
      });
    });
  });

  describe('isRegisteredAssetClass', () => {
    describe('when not registered', () => {
      it('should return false', async () => {
        expect(await assetClassRegistryAdapter.isRegisteredAssetClass('erc20')).to.be.eq(false);
      });
    });

    describe('when is registered', () => {
      it('should return true', async () => {
        expect(await assetClassRegistryAdapter.isRegisteredAssetClass('erc721')).to.be.eq(true);
      });
    });
  });
});
