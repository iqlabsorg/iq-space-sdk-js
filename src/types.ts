import { BigNumberish } from '@ethersproject/bignumber';
import { AccountId, AssetId, AssetType, ChainId } from 'caip';
import { BigNumber, BytesLike, Overrides as BaseOverrides, Signer } from 'ethers';
import { listingStrategies, taxStrategies } from './constants';
import { Accounts, ITokenQuote, Listings, Rentings } from './contracts/contracts/metahub/core/IMetahub';
import { Warpers } from './contracts/contracts/warper/IWarperController';

export type Address = string;

export type Overrides = BaseOverrides & { from?: string | Promise<string> };

export type IQSpaceParams = {
  signer: Signer;
};

export interface ChainAware {
  // https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md
  getChainId(): Promise<ChainId>;
}

export type ListingTerms = FixedPriceListingTerms | FixedPriceWithRewardListingTerms;

export type ListingParams = {
  lister: AccountId;
  configurator: AccountId;
};

export type ListingTermsInfo = ListingTerms & {
  id: BigNumber;
};

export type ListingTermsQueryParams = {
  listingId: BigNumberish;
  universeId: BigNumberish;
  warper: AssetType;
};

export type ListingTermsInfoWithParams = ListingTermsInfo & ListingTermsQueryParams;

export type FixedPriceListingTerms = {
  name: typeof listingStrategies.FIXED_RATE.name;
  data: {
    pricePerSecondInEthers: BigNumberish;
  };
};

export type FixedPriceWithRewardListingTerms = {
  name: typeof listingStrategies.FIXED_RATE_WITH_REWARD.name;
  data: {
    pricePerSecondInEthers: BigNumberish;
    rewardRatePercent: string;
  };
};

export type FixedRateTaxTerms = {
  name: typeof taxStrategies.FIXED_RATE_TAX.name;
  data: {
    ratePercent: string;
  };
};

export type FixedRateWithRewardTaxTerms = {
  name: typeof taxStrategies.FIXED_RATE_TAX_WITH_REWARD.name;
  data: {
    ratePercent: string;
    rewardRatePercent: string;
  };
};

export type TaxTerms = FixedRateTaxTerms | FixedRateWithRewardTaxTerms;

export type TaxTermsStrategyIdName =
  | typeof taxStrategies.FIXED_RATE_TAX.name
  | typeof taxStrategies.FIXED_RATE_TAX_WITH_REWARD.name;

export type TaxTermsQueryParams = {
  taxStrategyIdName: TaxTermsStrategyIdName;
  universeId: BigNumberish;
  warper: AssetType;
};

export type AssetListingParams = {
  assets: Asset[];
  params: ListingParams;
  maxLockPeriod: BigNumberish;
  immediatePayout: boolean;
};

export type Listing = Pick<
  Listings.ListingStructOutput,
  'maxLockPeriod' | 'lockedTill' | 'immediatePayout' | 'enabled' | 'paused'
> & {
  id: BigNumber;
  assets: Asset[];
  configurator: AccountId;
  beneficiary: AccountId;
  lister: AccountId;
};

export type AssetNamespace = 'erc20' | 'erc721' | 'erc1155';

export type Asset = {
  id: AssetId;
  value: BigNumberish;
};

export type RegisteredWarper = Pick<Warpers.WarperStructOutput, 'name' | 'universeId' | 'paused'> & {
  self: AssetType;
  original: AssetType;
};

export type RentingEstimationParams = Pick<Rentings.ParamsStruct, 'listingId' | 'rentalPeriod' | 'listingTermsId'> & {
  warper: AssetType;
  renter: AccountId;
  paymentToken: AssetType;
  selectedConfiguratorListingTerms?: ListingTerms;
};

export type TokenQuoteDataEncoded = { tokenQuote: BytesLike; tokenQuoteSignature: BytesLike };

export type RentingParams = RentingEstimationParams & {
  maxPaymentAmount: BigNumberish;
  tokenQuoteDataEncoded?: TokenQuoteDataEncoded;
};

export type RentalFees = Pick<
  Rentings.RentalFeesStructOutput,
  'total' | 'protocolFee' | 'listerBaseFee' | 'listerPremium' | 'universeBaseFee' | 'universePremium'
>;

export type RentalAgreement = Pick<
  Rentings.AgreementStructOutput,
  'universeId' | 'collectionId' | 'listingId' | 'startTime' | 'endTime'
> & {
  id: BigNumber;
  warpedAssets: Asset[];
  renter: AccountId;
  agreementTerms: AgreementTerms;
};

export enum RentalStatusEnum {
  NONE,
  AVAILABLE,
  RENTED,
}

export type RentalStatus = 'none' | 'available' | 'rented';

export type PaymentTokenData = Pick<ITokenQuote.PaymentTokenDataStruct, 'paymentTokenQuote'> & {
  paymentToken: AccountId;
};

export type AgreementTerms = Pick<
  Rentings.AgreementTermsStruct,
  'listingTerms' | 'universeTaxTerms' | 'protocolTaxTerms'
> & {
  paymentTokenData: PaymentTokenData;
};

export type AccountBalance = Pick<Accounts.BalanceStructOutput, 'amount'> & {
  token: AssetType;
};

export type BaseToken = {
  type: AssetType;
  name: string;
  symbol: string;
  decimals: number;
};

export type WarperRentingConstraints = {
  availabilityPeriod?: {
    start: number;
    end: number;
  };
  rentalPeriod?: {
    min: number;
    max: number;
  };
};

export type WarperRegistrationParams = {
  name: string;
  universeId: BigNumberish;
  paused: boolean;
};

export type UniverseParams = {
  name: string;
  paymentTokens: AccountId[];
};

export type UniverseInfo = {
  id: BigNumber;
  name: string;
  paymentTokens: AccountId[];
};

export type WarperPresetIds = 'ERC721ConfigurablePreset';

export type WarperPresetInitData = {
  metahub: AccountId;
  original: AssetType;
};
