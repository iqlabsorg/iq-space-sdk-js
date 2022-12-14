import {
  ASSET_CLASS,
  LISTING_STRATEGIES,
  LISTING_STRATEGY_IDS,
  TAX_STRATEGIES,
  TAX_STRATEGY_IDS,
} from '@iqprotocol/solidity-contracts-nft';
import { RentalStatus, RentalStatusEnum, WarperPresetIds } from './types';
import { WARPER_PRESET_ERC721_IDS } from '@iqprotocol/solidity-contracts-nft';

// The `namespace` value must be a correct CAIP-19 asset type namespace.
export const assetClasses = {
  ERC721: { id: ASSET_CLASS.ERC721, namespace: 'erc721' },
  ERC20: { id: ASSET_CLASS.ERC20, namespace: 'erc20' },
} as const;

export const listingStrategies = {
  FIXED_RATE: { id: LISTING_STRATEGY_IDS.FIXED_RATE, name: LISTING_STRATEGIES.FIXED_RATE },
  FIXED_RATE_WITH_REWARD: {
    id: LISTING_STRATEGY_IDS.FIXED_RATE_WITH_REWARD,
    name: LISTING_STRATEGIES.FIXED_RATE_WITH_REWARD,
  },
} as const;

export const taxStrategies = {
  FIXED_RATE_TAX: { id: TAX_STRATEGY_IDS.FIXED_RATE_TAX, name: TAX_STRATEGIES.FIXED_RATE_TAX },
  FIXED_RATE_TAX_WITH_REWARD: {
    id: TAX_STRATEGY_IDS.FIXED_RATE_TAX_WITH_REWARD,
    name: TAX_STRATEGIES.FIXED_RATE_TAX_WITH_REWARD,
  },
} as const;

export const rentalStatusMap: Map<RentalStatusEnum, RentalStatus> = new Map([
  [RentalStatusEnum.NONE, 'none'],
  [RentalStatusEnum.AVAILABLE, 'available'],
  [RentalStatusEnum.RENTED, 'rented'],
]);

export const warperPresetMap: Map<WarperPresetIds, string> = new Map([
  ['ERC721ConfigurablePreset', WARPER_PRESET_ERC721_IDS.ERC721_CONFIGURABLE_PRESET],
]);
