import {
  IListingConfiguratorPresetFactory,
  ListingConfiguratorPresetFactory,
} from '@iqprotocol/iq-space-protocol-light/typechain';
import { AccountId } from 'caip';
import { BytesLike, ContractTransaction } from 'ethers';
import { Adapter } from '../../adapter';
import { AddressTranslator } from '../../address-translator';
import { ContractResolver } from '../../contract-resolver';
import { ListingConfiguratorPreset } from '../../types';

export class ListingConfiguratorPresetFactoryAdapter extends Adapter {
  private readonly contract: ListingConfiguratorPresetFactory;

  constructor(accountId: AccountId, contractResolver: ContractResolver, addressTranslator: AddressTranslator) {
    super(contractResolver, addressTranslator);
    this.contract = contractResolver.resolveListingConfiguratorPresetFactory(accountId.address);
  }

  /**
   * Adds new preset.
   * @param presetId Preset ID.
   * @param implementation Implementation account ID.
   */
  async addPreset(presetId: BytesLike, implementation: AccountId): Promise<ContractTransaction> {
    return this.contract.addPreset(presetId, this.accountIdToAddress(implementation));
  }

  /**
   * Removes preset.
   * @param presetId Preset ID.
   */
  async removePreset(presetId: BytesLike): Promise<ContractTransaction> {
    return this.contract.removePreset(presetId);
  }

  /**
   * Enables preset, which makes it deployable.
   * @param presetId Preset ID.
   */
  async enablePreset(presetId: BytesLike): Promise<ContractTransaction> {
    return this.contract.enablePreset(presetId);
  }

  /**
   * Disable preset, which makes it non-deployable.
   * @param presetId Preset ID.
   */
  async disablePreset(presetId: BytesLike): Promise<ContractTransaction> {
    return this.contract.disablePreset(presetId);
  }

  /**
   * Deploys a new listing configurator from the given preset.
   * @param presetId Preset ID (to deploy from).
   * @param initData Initialization payload.
   */
  async deployPreset(presetId: BytesLike, initData: BytesLike): Promise<ContractTransaction> {
    return this.contract.deployPreset(presetId, initData);
  }

  /**
   * Checks whether preset is enabled and available for deployment.
   * @param presetId Preset ID.
   */
  async presetEnabled(presetId: BytesLike): Promise<boolean> {
    return this.contract.presetEnabled(presetId);
  }

  /**
   * Returns the list of all registered presets.
   */
  async presets(): Promise<ListingConfiguratorPreset[]> {
    const presets = await this.contract.presets();
    return presets.map(preset => this.normalizePreset(preset));
  }

  /**
   * Returns the preset details.
   * @param presetId Preset ID.
   */
  async preset(presetId: BytesLike): Promise<ListingConfiguratorPreset> {
    const preset = await this.contract.preset(presetId);
    return this.normalizePreset(preset);
  }

  /**
   * Retrieves the listing configurator account ID from deployment transaction.
   * @param transactionHash Deployment transaction hash.
   */
  async findListingConfiguratorByDeploymentTransaction(transactionHash: string): Promise<AccountId | undefined> {
    const tx = await this.contract.provider.getTransaction(transactionHash);
    if (!tx.blockHash) {
      return undefined;
    }

    const event = (
      await this.contract.queryFilter(this.contract.filters.ListingConfiguratorPresetDeployed(), tx.blockHash)
    ).find(event => event.transactionHash === transactionHash);

    if (!event) {
      return undefined;
    }

    return this.addressToAccountId(event.args.listingConfigurator);
  }

  private normalizePreset(
    preset: IListingConfiguratorPresetFactory.ListingConfiguratorPresetStructOutput,
  ): ListingConfiguratorPreset {
    return {
      id: preset.id,
      implementation: this.addressToAccountId(preset.implementation),
      enabled: preset.enabled,
    };
  }
}
