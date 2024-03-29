import { calculateBaseRateInBaseTokenEthers } from '@iqprotocol/iq-space-protocol';
import { AccountId, AssetId, ChainId } from 'caip';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';

export const toAccountId = (address: string): AccountId => {
  return new AccountId({ chainId: getChainId(), address });
};

export const toAssetId = (collectionAddress: string, tokenId: number): AssetId => {
  return new AssetId(`eip155:31337/erc721:${collectionAddress}/${tokenId}`);
};

export const getChainId = (): ChainId => {
  return new ChainId({ namespace: 'eip155', reference: '31337' });
};

export const mineBlock = async (timestamp = 0): Promise<unknown> => {
  return ethers.provider.send('evm_mine', timestamp > 0 ? [timestamp] : []);
};

export const latestBlockTimestamp = async (): Promise<number> => {
  return (await ethers.provider.getBlock('latest')).timestamp;
};

export const waitBlockchainTime = async (seconds: number): Promise<void> => {
  const time = await latestBlockTimestamp();
  await mineBlock(time + seconds);
};

export const createRandomInteger = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const SECONDS_IN_DAY = 86400;
export const SECONDS_IN_HOUR = 3600;

export const TEST_BASE_TOKEN_DECIMALS = 18;
export const COMMON_ID = BigNumber.from(1);
export const COMMON_PRICE = '10';
export const COMMON_TAX_RATE = '2.25';
export const COMMON_REWARD_RATE = '0.5';
export const COMMON_BASE_RATE = calculateBaseRateInBaseTokenEthers(
  COMMON_PRICE,
  SECONDS_IN_DAY,
  TEST_BASE_TOKEN_DECIMALS,
);
