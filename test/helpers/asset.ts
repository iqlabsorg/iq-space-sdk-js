import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { AssetType } from 'caip';
import { BigNumber, BigNumberish } from 'ethers';
import { BytesLike, defaultAbiCoder } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { Asset, ASSET_CLASS } from '../../src';
import { ERC721Mock } from '../../src/contracts';
import { Assets } from '../../src/contracts/contracts/listing/listing-manager/ListingManager';
import { getChainId, toAssetId } from './utils';

export const makeERC721AssetForSDK = (token: string, tokenId: number, value: BigNumberish = 1): Asset => {
  return {
    id: toAssetId(token, tokenId),
    value,
  };
};

export const makeERC721Asset = (token: string, tokenId: BigNumberish, value: BigNumberish = 1): Assets.AssetStruct => {
  return makeAsset(ASSET_CLASS.ERC721, defaultAbiCoder.encode(['address', 'uint256'], [token, tokenId]), value);
};

export const makeAsset = (assetClass: BytesLike, data: BytesLike, value: BigNumberish): Assets.AssetStruct => {
  return {
    id: { class: assetClass, data },
    value: BigNumber.from(value),
  };
};

export const createAssetReference = (namespace: 'erc721' | 'erc20', address: string): AssetType => {
  return new AssetType({
    chainId: getChainId(),
    assetName: { namespace, reference: address },
  });
};

export const mintAndApproveNFTs = async (
  collection: ERC721Mock,
  owner: SignerWithAddress,
  count = 1,
): Promise<void> => {
  const nftCreator = await ethers.getNamedSigner('nftCreator');
  const metahub = await ethers.getContract('Metahub');

  for (let i = 1; i <= count; i++) {
    await collection.connect(nftCreator).mint(owner.address, i);
  }

  await collection.connect(owner).setApprovalForAll(metahub.address, true);
};
