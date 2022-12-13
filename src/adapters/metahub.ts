import { AccountId, AssetType } from 'caip';
import { BigNumber, BigNumberish, BytesLike, ContractTransaction } from 'ethers';
import { Adapter } from '../adapter';
import { AddressTranslator } from '../address-translator';
import { ContractResolver } from '../contract-resolver';
import { Metahub } from '../contracts';
import {
  AccountBalance,
  Asset,
  BaseToken,
  Listing,
  RentalAgreement,
  RentalFees,
  RentalStatus,
  RentingEstimationParams,
  RentingParams,
} from '../types';
import { assetClassToNamespace } from '../utils';
import { ListingManagerAdapter } from './listing-manager';
import { RentingManagerAdapter } from './renting-manager';
import { CONTRACT_REGISTRY_KEYS } from '@iqprotocol/solidity-contracts-nft/src';

export class MetahubAdapter extends Adapter {
  private readonly contract: Metahub;
  private readonly rentingManager: RentingManagerAdapter;
  private readonly listingManager: ListingManagerAdapter;

  private constructor(
    metahub: Metahub,
    rentingManager: RentingManagerAdapter,
    listingManager: ListingManagerAdapter,
    contractResolver: ContractResolver,
    addressTranslator: AddressTranslator,
  ) {
    super(contractResolver, addressTranslator);
    this.contract = metahub;
    this.rentingManager = rentingManager;
    this.listingManager = listingManager;
  }

  static async create(
    accountId: AccountId,
    contractResolver: ContractResolver,
    addressTranslator: AddressTranslator,
  ): Promise<MetahubAdapter> {
    const metahub = contractResolver.resolveMetahub(accountId.address);

    const rentingManagerAddress = await metahub.getContract(CONTRACT_REGISTRY_KEYS.RENTING_MANAGER);
    const rentingManager = new RentingManagerAdapter(
      addressTranslator.addressToAccountId(rentingManagerAddress),
      contractResolver,
      addressTranslator,
    );

    const listingManagerAddress = await metahub.getContract(CONTRACT_REGISTRY_KEYS.LISTING_MANAGER);
    const listingManager = new ListingManagerAdapter(
      addressTranslator.addressToAccountId(listingManagerAddress),
      contractResolver,
      addressTranslator,
    );

    return new MetahubAdapter(metahub, rentingManager, listingManager, contractResolver, addressTranslator);
  }

  //#region Protocol Configuration

  /**
   * Returns the base token that's used for stable price denomination.
   */
  async baseToken(): Promise<BaseToken> {
    const type = this.addressToAssetType(await this.contract.baseToken(), 'erc20');
    const metadata = await this.erc20AssetMetadata(type);
    return { type, ...metadata };
  }

  //#endregion

  //#region Payment Management

  /**
   * Returns the amount of `token`, currently accumulated by the user.
   * @param account The account to query the balance for.
   * @param token The token in which the balance is nominated.
   * @return Balance of `token`.
   */
  async balance(account: AccountId, token: AssetType): Promise<BigNumber> {
    return this.contract.balance(this.accountIdToAddress(account), this.assetTypeToAddress(token));
  }

  /**
   * Returns the list of user balances in various tokens.
   * @param account The account to query the balance for.
   * @return List of balances.
   */
  async balances(account: AccountId): Promise<AccountBalance[]> {
    const balances = await this.contract.balances(this.accountIdToAddress(account));
    return balances.map(balance => ({
      amount: balance.amount,
      token: this.addressToAssetType(balance.token, 'erc20'),
    }));
  }

  /**
   * Returns the amount of `token`, currently accumulated by the universe.
   * @param universeId The universe ID.
   * @param token The token address.
   * @return Balance of `token`.
   */
  async universeBalance(universeId: BigNumberish, token: AssetType): Promise<BigNumber> {
    return this.contract.universeBalance(universeId, this.assetTypeToAddress(token));
  }

  /**
   * Returns the list of universe balances in various tokens.
   * @param universeId The universe ID.
   * @return List of balances.
   */
  async universeBalances(universeId: BigNumberish): Promise<AccountBalance[]> {
    const balances = await this.contract.universeBalances(universeId);
    return balances.map(balance => ({
      amount: balance.amount,
      token: this.addressToAssetType(balance.token, 'erc20'),
    }));
  }

  /**
   * Transfers the specific `amount` of `token` from a user balance to an arbitrary address.
   * @param token The balance token.
   * @param amount The amount to be withdrawn.
   * @param to The payee account.
   */
  async withdrawFunds(token: AssetType, amount: BigNumberish, to: AccountId): Promise<ContractTransaction> {
    return this.contract.withdrawFunds(this.assetTypeToAddress(token), amount, this.accountIdToAddress(to));
  }

  /**
   * Transfers the specific `amount` of `token` from a universe balance to an arbitrary address.
   * @param universeId The universe ID.
   * @param token The balance token.
   * @param amount The amount to be withdrawn.
   * @param to The payee account.
   */
  async withdrawUniverseFunds(
    universeId: BigNumberish,
    token: AssetType,
    amount: BigNumberish,
    to: AccountId,
  ): Promise<ContractTransaction> {
    return this.contract.withdrawUniverseFunds(
      universeId,
      this.assetTypeToAddress(token),
      amount,
      this.accountIdToAddress(to),
    );
  }

  //#endregion

  //#region Asset Management

  /**
   * Returns the number of currently supported assets.
   * @return Asset count.
   */
  async supportedAssetCount(): Promise<BigNumber> {
    return this.contract.supportedAssetCount();
  }

  /**
   * Returns the list of all supported assets.
   * @param offset Starting index.
   * @param limit Max number of items.
   */
  async supportedAssets(offset: BigNumberish, limit: BigNumberish): Promise<AssetType[]> {
    const [addresses, assetConfigs] = await this.contract.supportedAssets(offset, limit);
    return assetConfigs.map((assetConfig, i) =>
      this.addressToAssetType(addresses[i], assetClassToNamespace(assetConfig.assetClass)),
    );
  }

  //#endregion

  //#region Listing Management

  /**
   * Sets payment token allowance. Allows Metahub to spend specified tokens to cover rental fees.
   * @param paymentToken ERC20 payment token.
   * @param amount Allowance amount.
   */
  async approveForRentalPayment(paymentToken: AssetType, amount: BigNumberish): Promise<ContractTransaction> {
    AddressTranslator.assertTypeERC20(paymentToken);
    return this.contractResolver
      .resolveERC20Asset(this.assetTypeToAddress(paymentToken))
      .approve(this.contract.address, amount);
  }

  /**
   * Returns current Metahub allowance in specified payment tokens for specific payer account.
   * @param paymentToken ERC20 payment token.
   * @param payer Payer account ID.
   */
  async paymentTokenAllowance(paymentToken: AssetType, payer: AccountId): Promise<BigNumber> {
    AddressTranslator.assertTypeERC20(paymentToken);
    return this.contractResolver
      .resolveERC20Asset(this.assetTypeToAddress(paymentToken))
      .allowance(this.accountIdToAddress(payer), this.contract.address);
  }

  /**
   * Approves Metahub to take an asset from lister account during listing process.
   * @param asset
   */
  async approveForListing(asset: Asset): Promise<ContractTransaction> {
    AddressTranslator.assertTypeERC721(asset.id);
    return this.contractResolver
      .resolveERC721Asset(this.assetIdToAddress(asset.id))
      .approve(this.contract.address, asset.id.tokenId);
  }

  /**
   * Checks whether the asset is approved for listing by the owner.
   * Returns `true` if the asset can be listed, and `false` if the required approval is missing.
   * @param asset
   */
  async isApprovedForListing(asset: Asset): Promise<boolean> {
    AddressTranslator.assertTypeERC721(asset.id);

    // Check particular token allowance.
    const assetContract = this.contractResolver.resolveERC721Asset(this.assetIdToAddress(asset.id));
    //eslint-disable-next-line no-extra-parens
    if ((await assetContract.getApproved(asset.id.tokenId)) === this.contract.address) {
      return true;
    }

    // Check operator.
    const assumedOwner = await this.signerAddress();
    return assetContract.isApprovedForAll(assumedOwner, this.contract.address);
  }

  /**
   * Marks the asset as being delisted. This operation in irreversible.
   * After delisting, the asset can only be withdrawn when it has no active rentals.
   * @param listingId Listing ID.
   */
  async disableListing(listingId: BigNumberish): Promise<ContractTransaction> {
    return this.listingManager.disableListing(listingId);
  }

  /**
   * Returns the asset back to the lister.
   * @param listingId Listing ID.
   */
  async withdrawListingAssets(listingId: BigNumberish): Promise<ContractTransaction> {
    return this.listingManager.withdrawListingAssets(listingId);
  }

  /**
   * Puts the listing on pause.
   * @param listingId Listing ID.
   */
  async pauseListing(listingId: BigNumberish): Promise<ContractTransaction> {
    return this.listingManager.pauseListing(listingId);
  }

  /**
   * Lifts the listing pause.
   * @param listingId Listing ID.
   */
  async unpauseListing(listingId: BigNumberish): Promise<ContractTransaction> {
    return this.listingManager.unpauseListing(listingId);
  }

  /**
   * Returns the listing details by the listing ID.
   * @param listingId Listing ID.
   * @return Listing details.
   */
  async listing(listingId: BigNumberish): Promise<Listing> {
    return this.listingManager.listing(listingId);
  }

  /**
   * Returns the number of currently registered listings.
   * @return Listing count.
   */
  async listingCount(): Promise<BigNumber> {
    return this.listingManager.listingCount();
  }

  /**
   * Returns the paginated list of currently registered listings.
   * @param offset Starting index.
   * @param limit Max number of items.
   */
  async listings(offset: BigNumberish, limit: BigNumberish): Promise<Listing[]> {
    return this.listingManager.listings(offset, limit);
  }

  /**
   * Returns the number of currently registered listings for the particular lister account.
   * @param lister Lister account ID.
   * @return Listing count.
   */
  async userListingCount(lister: AccountId): Promise<BigNumber> {
    return this.listingManager.userListingCount(lister);
  }

  /**
   * Returns the paginated list of currently registered listings for the particular lister account.
   * @param lister Lister account ID.
   * @param offset Starting index.
   * @param limit Max number of items.
   */
  async userListings(lister: AccountId, offset: BigNumberish, limit: BigNumberish): Promise<Listing[]> {
    return this.listingManager.userListings(lister, offset, limit);
  }

  /**
   * Returns the number of currently registered listings for the particular original asset.
   * @param asset Original asset reference.
   * @return Listing count.
   */
  async assetListingCount(asset: AssetType): Promise<BigNumber> {
    return this.listingManager.assetListingCount(asset);
  }

  /**
   * Returns the paginated list of currently registered listings for the particular original asset.
   * @param asset Original asset reference.
   * @param offset Starting index.
   * @param limit Max number of items.
   */
  async assetListings(asset: AssetType, offset: BigNumberish, limit: BigNumberish): Promise<Listing[]> {
    return this.listingManager.assetListings(asset, offset, limit);
  }

  //#endregion

  //#region Renting Management

  /**
   * Evaluates renting params and returns rental fee breakdown.
   * @param params
   */
  async estimateRent(params: RentingEstimationParams): Promise<RentalFees> {
    return this.rentingManager.estimateRent(params);
  }

  /**
   * Performs renting operation.
   * @param params Renting parameters.
   */
  async rent(params: RentingParams): Promise<ContractTransaction> {
    return this.rentingManager.rent(params);
  }

  /**
   * Returns the rental agreement details.
   * @param rentalId Rental agreement ID.
   * @return Rental agreement details.
   */
  async rentalAgreement(rentalId: BigNumberish): Promise<RentalAgreement> {
    return this.rentingManager.rentalAgreement(rentalId);
  }

  /**
   * Returns the number of currently registered rental agreements for particular renter account.
   * @param renter Renter account ID.
   * @return Rental agreement count.
   */
  async userRentalCount(renter: AccountId): Promise<BigNumber> {
    return this.rentingManager.userRentalCount(renter);
  }

  /**
   * Returns the paginated list of currently registered rental agreements for particular renter account.
   * @param renter Renter account ID.
   * @param offset Starting index.
   * @param limit Max number of items.
   */
  async userRentalAgreements(renter: AccountId, offset: BigNumberish, limit: BigNumberish): Promise<RentalAgreement[]> {
    return this.rentingManager.userRentalAgreements(renter, offset, limit);
  }

  /**
   * Returns token amount from specific collection rented by particular account.
   * @param warpedCollectionId Warped collection ID.
   * @param renter Renter account ID.
   */
  async collectionRentedValue(warpedCollectionId: BytesLike, renter: AccountId): Promise<BigNumberish> {
    return this.rentingManager.collectionRentedValue(warpedCollectionId, renter);
  }

  /**
   * Returns the rental status of a given warped asset.
   * @param asset Asset reference.
   */
  async assetRentalStatus(asset: Asset): Promise<RentalStatus> {
    return this.rentingManager.assetRentalStatus(asset);
  }
  //#endregion
}
