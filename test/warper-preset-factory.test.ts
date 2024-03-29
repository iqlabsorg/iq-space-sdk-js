import { ERC721_WARPER_PRESET_IDS, makeERC721ConfigurablePresetInitData } from '@iqprotocol/iq-space-protocol';
import {
  ERC721ConfigurablePreset,
  ERC721Mock,
  IMetahub,
  IWarperPresetFactory,
} from '@iqprotocol/iq-space-protocol/typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AssetType } from 'caip';
import { expect } from 'chai';
import { ContractTransaction } from 'ethers';
import { deployments, ethers } from 'hardhat';
import { AddressTranslator, IQSpace, WarperPresetFactoryAdapter } from '../src';
import { grantSupervisorRole } from './helpers/acl';
import { setupUniverse } from './helpers/setup';
import { toAccountId } from './helpers/utils';
import { findWarperByDeploymentTransaction } from './helpers/warper';

/**
 * @group integration
 */
describe('WarperPresetFactoryAdapter', () => {
  /** Signers */
  let deployer: SignerWithAddress;
  let supervisor: SignerWithAddress;

  /** Contracts */
  let metahub: IMetahub;
  let warperPresetFactory: IWarperPresetFactory;
  let warperPreset: ERC721ConfigurablePreset;
  let collection: ERC721Mock;

  /** SDK */
  let warperPresetFactoryAdapter: WarperPresetFactoryAdapter;
  let supervisorWarperPresetFactoryAdapter: WarperPresetFactoryAdapter;

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');
    supervisor = await ethers.getNamedSigner('supervisor');

    metahub = await ethers.getContract('Metahub');
    warperPresetFactory = await ethers.getContract('WarperPresetFactory');
    warperPreset = await ethers.getContract('ERC721ConfigurablePreset');
    collection = await ethers.getContract('ERC721Mock');

    const iqspace = await IQSpace.init({ signer: deployer });
    const sIqspace = await IQSpace.init({ signer: supervisor });
    warperPresetFactoryAdapter = iqspace.warperPresetFactory(toAccountId(warperPresetFactory.address));
    supervisorWarperPresetFactoryAdapter = sIqspace.warperPresetFactory(toAccountId(warperPresetFactory.address));

    await setupUniverse();
    await grantSupervisorRole();
  });

  describe('deployPreset', () => {
    let tx: ContractTransaction;

    beforeEach(async () => {
      tx = await warperPresetFactoryAdapter.deployPreset(
        ERC721_WARPER_PRESET_IDS.ERC721_CONFIGURABLE_PRESET,
        makeERC721ConfigurablePresetInitData(collection.address, metahub.address),
      );
    });

    it('should deploy warper from a preset', async () => {
      const warper = await findWarperByDeploymentTransaction(tx.hash);
      expect(warper?.length).to.be.greaterThan(0);
    });

    describe('findWarperByDeploymentTransaction', () => {
      let reference: AssetType;

      beforeEach(async () => {
        const warper = await findWarperByDeploymentTransaction(tx.hash);
        reference = AddressTranslator.createAssetType(toAccountId(warper!), 'erc721');
      });

      it('should return warper reference from deployment transaction', async () => {
        const warperReference = await warperPresetFactoryAdapter.findWarperByDeploymentTransaction(tx.hash);
        expect(warperReference).to.be.deep.equal(reference);
      });
    });
  });

  describe('preset', () => {
    it('it should return warper preset info', async () => {
      const preset = await warperPresetFactoryAdapter.preset(ERC721_WARPER_PRESET_IDS.ERC721_CONFIGURABLE_PRESET);
      expect(preset.id).to.be.eq(ERC721_WARPER_PRESET_IDS.ERC721_CONFIGURABLE_PRESET);
      expect(preset.implementation.address).to.be.eq(warperPreset.address);
      expect(preset.enabled).to.be.eq(true);
    });
  });

  describe('presets', () => {
    it('it should return list of warper presets', async () => {
      const presets = await warperPresetFactoryAdapter.presets();
      const preset = presets[0];
      expect(preset.id).to.be.eq(ERC721_WARPER_PRESET_IDS.ERC721_CONFIGURABLE_PRESET);
      expect(preset.implementation.address).to.be.eq(warperPreset.address);
      expect(preset.enabled).to.be.eq(true);
    });
  });

  describe('enablePreset', () => {
    beforeEach(async () => {
      await warperPresetFactory.connect(supervisor).disablePreset(ERC721_WARPER_PRESET_IDS.ERC721_CONFIGURABLE_PRESET);
    });

    it('should enable the warper preset', async () => {
      await supervisorWarperPresetFactoryAdapter.enablePreset(ERC721_WARPER_PRESET_IDS.ERC721_CONFIGURABLE_PRESET);
      expect(await warperPresetFactory.presetEnabled(ERC721_WARPER_PRESET_IDS.ERC721_CONFIGURABLE_PRESET)).to.be.eq(
        true,
      );
    });
  });

  describe('disablePreset', () => {
    it('should disable the warper preset', async () => {
      await supervisorWarperPresetFactoryAdapter.disablePreset(ERC721_WARPER_PRESET_IDS.ERC721_CONFIGURABLE_PRESET);
      expect(await warperPresetFactory.presetEnabled(ERC721_WARPER_PRESET_IDS.ERC721_CONFIGURABLE_PRESET)).to.be.eq(
        false,
      );
    });
  });

  describe('presetEnabled', () => {
    describe('when disabled', () => {
      beforeEach(async () => {
        await warperPresetFactory
          .connect(supervisor)
          .disablePreset(ERC721_WARPER_PRESET_IDS.ERC721_CONFIGURABLE_PRESET);
      });

      it('should return false', async () => {
        const enabled = await warperPresetFactoryAdapter.presetEnabled(
          ERC721_WARPER_PRESET_IDS.ERC721_CONFIGURABLE_PRESET,
        );
        expect(enabled).to.be.eq(false);
      });
    });

    describe('when enabled', () => {
      it('should return true', async () => {
        const enabled = await warperPresetFactoryAdapter.presetEnabled(
          ERC721_WARPER_PRESET_IDS.ERC721_CONFIGURABLE_PRESET,
        );
        expect(enabled).to.be.eq(true);
      });
    });
  });

  describe('addPreset', () => {
    beforeEach(async () => {
      await warperPresetFactory.connect(supervisor).removePreset(ERC721_WARPER_PRESET_IDS.ERC721_CONFIGURABLE_PRESET);
    });

    it('should add preset', async () => {
      await supervisorWarperPresetFactoryAdapter.addPreset(
        ERC721_WARPER_PRESET_IDS.ERC721_CONFIGURABLE_PRESET,
        toAccountId(warperPreset.address),
      );
      const preset = await warperPresetFactory.preset(ERC721_WARPER_PRESET_IDS.ERC721_CONFIGURABLE_PRESET);
      expect(preset.implementation).to.be.eq(warperPreset.address);
    });
  });

  describe('removePreset', () => {
    it('should remove the preset', async () => {
      await supervisorWarperPresetFactoryAdapter.removePreset(ERC721_WARPER_PRESET_IDS.ERC721_CONFIGURABLE_PRESET);
      const presets = await warperPresetFactory.presets();
      expect(presets.length).to.be.eq(0);
    });
  });
});
