import { ListingManager__factory } from './contracts/factories/contracts/listing/ListingManager__factory';
import { ListingManager } from './contracts/contracts/listing/ListingManager';
import { RentingManager__factory } from './contracts/factories/contracts/renting/RentingManager__factory';
import { RentingManager } from './contracts/contracts/renting/RentingManager';
import { Signer } from 'ethers';
import { Address, ChainAware, ContractVersions } from './types';
import {
  ACL,
  ACL__factory,
  AssetClassRegistry,
  AssetClassRegistry__factory,
  IERC20,
  IERC20__factory,
  IERC20Metadata,
  IERC20Metadata__factory,
  IERC721,
  IERC721__factory,
  IERC721Metadata,
  IERC721Metadata__factory,
  IERC721Warper,
  IERC721Warper__factory,
  IWarper,
  IWarper__factory,
  ListingStrategyRegistry,
  ListingStrategyRegistry__factory,
  Metahub,
  Metahub__factory,
  UniverseRegistry,
  UniverseRegistry__factory,
  UniverseToken,
  UniverseToken__factory,
  WarperManager,
  WarperManager__factory,
  WarperPresetFactory,
  WarperPresetFactory__factory,
  ListingWizard,
  ListingWizard__factory,
  UniverseWizard,
  UniverseWizard__factory,
  WarperWizard,
  WarperWizard__factory,
} from './contracts';
import { ChainId } from 'caip';
import { listingWizardVersions, universeWizardVersions, warperWizardVersions } from './constants';

export class ContractResolver implements ChainAware {
  constructor(private readonly signer: Signer, private readonly versions: ContractVersions) {}

  async getChainId(): Promise<ChainId> {
    const reference = await this.signer.getChainId();
    return new ChainId({ namespace: 'eip155', reference: reference.toString() });
  }

  async signerAddress(): Promise<Address> {
    return this.signer.getAddress();
  }

  resolveACL(address: Address): ACL {
    return ACL__factory.connect(address, this.signer);
  }

  resolveAssetClassRegistry(address: Address): AssetClassRegistry {
    return AssetClassRegistry__factory.connect(address, this.signer);
  }

  resolveListingStrategyRegistry(address: Address): ListingStrategyRegistry {
    return ListingStrategyRegistry__factory.connect(address, this.signer);
  }

  resolveMetahub(address: Address): Metahub {
    return Metahub__factory.connect(address, this.signer);
  }

  resolveUniverseRegistry(address: Address): UniverseRegistry {
    return UniverseRegistry__factory.connect(address, this.signer);
  }

  resolveUniverseToken(address: Address): UniverseToken {
    return UniverseToken__factory.connect(address, this.signer);
  }

  resolveWarperPresetFactory(address: Address): WarperPresetFactory {
    return WarperPresetFactory__factory.connect(address, this.signer);
  }

  resolveListingManager(address: string): ListingManager {
    return ListingManager__factory.connect(address, this.signer);
  }

  resolveRentingManager(address: Address): RentingManager {
    return RentingManager__factory.connect(address, this.signer);
  }

  resolveWarperManager(address: Address): WarperManager {
    return WarperManager__factory.connect(address, this.signer);
  }

  resolveWarper(address: Address): IWarper {
    return IWarper__factory.connect(address, this.signer);
  }

  resolveERC721Warper(address: Address): IERC721Warper {
    return IERC721Warper__factory.connect(address, this.signer);
  }

  resolveERC721Asset(address: Address): IERC721 {
    return IERC721__factory.connect(address, this.signer);
  }

  resolveERC721Metadata(address: Address): IERC721Metadata {
    return IERC721Metadata__factory.connect(address, this.signer);
  }

  resolveERC20Asset(address: Address): IERC20 {
    return IERC20__factory.connect(address, this.signer);
  }

  resolveERC20Metadata(address: Address): IERC20Metadata {
    return IERC20Metadata__factory.connect(address, this.signer);
  }

  resolveUniverseWizard(address: Address): UniverseWizard {
    const factory = universeWizardVersions.get(this.versions.universeWizard.getCurrent());
    if (!factory) {
      throw new Error('Could not resolve UniverseWizard');
    }

    return factory.connect(address, this.signer);
  }

  resolveListingWizard(address: Address): ListingWizard {
    const factory = listingWizardVersions.get(this.versions.listingWizard.getCurrent());
    if (!factory) {
      throw new Error('Could not resolve ListingWizard');
    }

    return factory.connect(address, this.signer);
  }

  resolveWarperWizard(address: Address): WarperWizard {
    const factory = warperWizardVersions.get(this.versions.warperWizard.getCurrent());
    if (!factory) {
      throw new Error('Could not resolve WarperWizard');
    }

    return factory.connect(address, this.signer);
  }
}
