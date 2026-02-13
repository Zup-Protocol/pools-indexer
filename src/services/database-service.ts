import type {
  Pool as PoolEntity,
  PoolHistoricalData as PoolHistoricalDataEntity,
  PoolTimeframedStats as PoolTimeframedStatsEntity,
  SingleChainToken as SingleChainTokenEntity,
} from "generated";
import type { HistoricalDataInterval_t } from "generated/src/db/Enums.gen";
import type { HandlerContext } from "generated/src/Types";
import { ZERO_ADDRESS, ZERO_BIG_INT } from "../core/constants";
import { getMultiTokenMetadataEffect } from "../core/effects/token-metadata-effect";
import { Id, InitialPoolHistoricalDataEntity, InitialPoolTimeframedStatsEntity } from "../core/entity";
import { InitialTokenEntity } from "../core/entity/initial-token-entity";
import { IndexerNetwork } from "../core/network";
import { String } from "../lib/string-utils";
import { subtractDaysFromSecondsTimestamp, subtractHoursFromSecondsTimestamp } from "../lib/timestamp";

export const DatabaseService = {
  getOrCreatePoolTokenEntities,
  getOldestPoolHourlyDataAgo,
  getOldestPoolDailyDataAgo,
  getPoolHourlyDataAgo,
  getPoolDailyDataAgo,
  getOrCreateHistoricalPoolDataEntities,
  getAllPooltimeframedStatsEntities,
  resetAllPoolTimeframedStats,
  setTokenWithNativeCompatibility,
};

async function setTokenWithNativeCompatibility(context: HandlerContext, tokenToSet: SingleChainTokenEntity) {
  context.SingleChainToken.set(tokenToSet);

  const network = tokenToSet.chainId as IndexerNetwork;
  const wrappedNativeAddress = IndexerNetwork.wrappedNativeAddress[network];
  const isNative = tokenToSet.tokenAddress === ZERO_ADDRESS;
  const isWrappedNative = String.lowercasedEquals(tokenToSet.tokenAddress, wrappedNativeAddress);

  if (!isNative && !isWrappedNative) return;

  const compatibleAddress = isNative ? wrappedNativeAddress : ZERO_ADDRESS;
  const compatibleToken = await context.SingleChainToken.get(Id.fromAddress(network, compatibleAddress));

  if (compatibleToken) {
    const updatedCompatibleToken: SingleChainTokenEntity = {
      // Keep Identity/Metadata from the target token
      id: compatibleToken.id,
      tokenAddress: compatibleToken.tokenAddress,
      symbol: compatibleToken.symbol,
      name: compatibleToken.name,
      normalizedSymbol: compatibleToken.normalizedSymbol,
      normalizedName: compatibleToken.normalizedName,
      decimals: compatibleToken.decimals,
      chainId: compatibleToken.chainId,

      // Synchronize Stats from the source token
      usdPrice: tokenToSet.usdPrice,
      trackedUsdPrice: tokenToSet.trackedUsdPrice,
      priceDiscoveryTokenAmount: tokenToSet.priceDiscoveryTokenAmount,
      totalValuePooledUsd: tokenToSet.totalValuePooledUsd,
      trackedTotalValuePooledUsd: tokenToSet.trackedTotalValuePooledUsd,
      tokenTotalValuePooled: tokenToSet.tokenTotalValuePooled,
      swapVolumeUsd: tokenToSet.swapVolumeUsd,
      trackedSwapVolumeUsd: tokenToSet.trackedSwapVolumeUsd,
      tokenSwapVolume: tokenToSet.tokenSwapVolume,
      liquidityVolumeUsd: tokenToSet.liquidityVolumeUsd,
      trackedLiquidityVolumeUsd: tokenToSet.trackedLiquidityVolumeUsd,
      tokenLiquidityVolume: tokenToSet.tokenLiquidityVolume,
      tokenFees: tokenToSet.tokenFees,
      feesUsd: tokenToSet.feesUsd,
      trackedFeesUsd: tokenToSet.trackedFeesUsd,
      poolsCount: tokenToSet.poolsCount,
      swapsCount: tokenToSet.swapsCount,
      swapsInCount: tokenToSet.swapsInCount,
      swapsOutCount: tokenToSet.swapsOutCount,
    };

    context.SingleChainToken.set(updatedCompatibleToken);
  } else if (isWrappedNative) {
    const nativeMetadata = IndexerNetwork.nativeToken[network];
    const initialNative = new InitialTokenEntity({
      ...nativeMetadata,
      network,
      tokenAddress: ZERO_ADDRESS,
    });

    const newNativeToken: SingleChainTokenEntity = {
      // Identity from static metadata
      id: initialNative.id,
      tokenAddress: initialNative.tokenAddress,
      symbol: initialNative.symbol,
      name: initialNative.name,
      normalizedSymbol: initialNative.normalizedSymbol,
      normalizedName: initialNative.normalizedName,
      decimals: initialNative.decimals,
      chainId: initialNative.chainId,

      // Stats from the wrapped token we just processed
      usdPrice: tokenToSet.usdPrice,
      trackedUsdPrice: tokenToSet.trackedUsdPrice,
      priceDiscoveryTokenAmount: tokenToSet.priceDiscoveryTokenAmount,
      totalValuePooledUsd: tokenToSet.totalValuePooledUsd,
      trackedTotalValuePooledUsd: tokenToSet.trackedTotalValuePooledUsd,
      tokenTotalValuePooled: tokenToSet.tokenTotalValuePooled,
      swapVolumeUsd: tokenToSet.swapVolumeUsd,
      trackedSwapVolumeUsd: tokenToSet.trackedSwapVolumeUsd,
      tokenSwapVolume: tokenToSet.tokenSwapVolume,
      liquidityVolumeUsd: tokenToSet.liquidityVolumeUsd,
      trackedLiquidityVolumeUsd: tokenToSet.trackedLiquidityVolumeUsd,
      tokenLiquidityVolume: tokenToSet.tokenLiquidityVolume,
      tokenFees: tokenToSet.tokenFees,
      feesUsd: tokenToSet.feesUsd,
      trackedFeesUsd: tokenToSet.trackedFeesUsd,
      poolsCount: tokenToSet.poolsCount,
      swapsCount: tokenToSet.swapsCount,
      swapsInCount: tokenToSet.swapsInCount,
      swapsOutCount: tokenToSet.swapsOutCount,
    };

    context.SingleChainToken.set(newNativeToken);
  }
}

async function getOrCreatePoolTokenEntities(params: {
  context: HandlerContext;
  network: IndexerNetwork;
  token0Address: string;
  token1Address: string;
}): Promise<[SingleChainTokenEntity, SingleChainTokenEntity]> {
  const [token0DB, token1DB] = await Promise.all([
    params.context.SingleChainToken.get(Id.fromAddress(params.network, params.token0Address)),
    params.context.SingleChainToken.get(Id.fromAddress(params.network, params.token1Address)),
  ]);

  if (token0DB && token1DB) return [token0DB, token1DB];

  const token0PromiseKey = _getMetadataPromisesCacheKey(params.network, params.token0Address);
  const token1PromiseKey = _getMetadataPromisesCacheKey(params.network, params.token1Address);

  let token0Promise: Promise<SingleChainTokenEntity> | undefined = token0DB
    ? Promise.resolve(token0DB)
    : _tokenMetadataPromises.get(token0PromiseKey);

  let token1Promise: Promise<SingleChainTokenEntity> | undefined = token1DB
    ? Promise.resolve(token1DB)
    : _tokenMetadataPromises.get(token1PromiseKey);

  const addressesNeedingMetadata: string[] = [];

  if (params.token0Address !== ZERO_ADDRESS && !token0Promise) addressesNeedingMetadata.push(params.token0Address);
  if (params.token1Address !== ZERO_ADDRESS && !token1Promise) addressesNeedingMetadata.push(params.token1Address);

  if (addressesNeedingMetadata.length > 0) {
    const fetchMetadataPromise = params.context
      .effect(getMultiTokenMetadataEffect, {
        chainId: params.network,
        tokenAddresses: addressesNeedingMetadata,
      })
      .then((metadatas) => {
        return metadatas.map((metadata, index) => {
          return new InitialTokenEntity({
            decimals: metadata.decimals,
            name: metadata.name,
            symbol: metadata.symbol,
            network: params.network,
            tokenAddress: addressesNeedingMetadata[index]!,
          });
        });
      });

    addressesNeedingMetadata.forEach((address, index) => {
      const tokenMetadataPromise = fetchMetadataPromise.then((entities) => entities[index] as SingleChainTokenEntity);
      _tokenMetadataPromises.set(_getMetadataPromisesCacheKey(params.network, address), tokenMetadataPromise);

      if (address === params.token0Address) token0Promise = tokenMetadataPromise;
      if (address === params.token1Address) token1Promise = tokenMetadataPromise;
    });
  }

  if (!token0Promise && params.token0Address === ZERO_ADDRESS) {
    token0Promise = Promise.resolve(
      new InitialTokenEntity({
        ...IndexerNetwork.nativeToken[params.network],
        network: params.network,
        tokenAddress: ZERO_ADDRESS,
      }),
    );

    _tokenMetadataPromises.set(token0PromiseKey, token0Promise);
  }

  if (!token1Promise && params.token1Address === ZERO_ADDRESS) {
    token1Promise = Promise.resolve(
      new InitialTokenEntity({
        ...IndexerNetwork.nativeToken[params.network],
        network: params.network,
        tokenAddress: ZERO_ADDRESS,
      }),
    );

    _tokenMetadataPromises.set(token1PromiseKey, token1Promise);
  }

  return Promise.all([token0Promise!, token1Promise!]);
}

async function getOldestPoolHourlyDataAgo(
  hoursAgo: number,
  eventTimestamp: bigint,
  context: HandlerContext,
  pool: PoolEntity,
): Promise<PoolHistoricalDataEntity | undefined> {
  if (pool.lastActivityTimestamp < subtractHoursFromSecondsTimestamp(eventTimestamp, hoursAgo)) return;

  for (let hour = hoursAgo; hour >= 0; hour--) {
    const timestamp = subtractHoursFromSecondsTimestamp(eventTimestamp, hour);
    if (timestamp < pool.createdAtTimestamp) continue;

    const data = await context.PoolHistoricalData.get(Id.buildHourlyDataId(timestamp, pool.chainId, pool.poolAddress));

    if (data) return data;
  }
}

async function getOldestPoolDailyDataAgo(
  daysAgo: number,
  eventTimestamp: bigint,
  context: HandlerContext,
  pool: PoolEntity,
): Promise<PoolHistoricalDataEntity | undefined> {
  if (pool.lastActivityTimestamp < subtractDaysFromSecondsTimestamp(eventTimestamp, daysAgo)) return;

  for (let day = daysAgo; day >= 0; day--) {
    const timestamp = subtractDaysFromSecondsTimestamp(eventTimestamp, day);
    if (timestamp < pool.createdAtTimestamp) continue;

    const data = await context.PoolHistoricalData.get(Id.buildDailyDataId(timestamp, pool.chainId, pool.poolAddress));

    if (data) return data;
  }
}

async function getPoolHourlyDataAgo(
  hoursAgo: number,
  eventTimestamp: bigint,
  context: HandlerContext,
  pool: PoolEntity,
): Promise<PoolHistoricalDataEntity | undefined> {
  const timestampAgo = subtractHoursFromSecondsTimestamp(eventTimestamp, hoursAgo);
  if (timestampAgo < pool.createdAtTimestamp || pool.lastActivityTimestamp < timestampAgo) return;

  return await context.PoolHistoricalData.get(Id.buildHourlyDataId(timestampAgo, pool.chainId, pool.poolAddress));
}

async function getPoolDailyDataAgo(
  daysAgo: number,
  eventTimestamp: bigint,
  context: HandlerContext,
  pool: PoolEntity,
): Promise<PoolHistoricalDataEntity | undefined> {
  const timestampAgo = subtractDaysFromSecondsTimestamp(eventTimestamp, daysAgo);
  if (timestampAgo < pool.createdAtTimestamp || pool.lastActivityTimestamp < timestampAgo) return;

  return await context.PoolHistoricalData.get(Id.buildDailyDataId(timestampAgo, pool.chainId, pool.poolAddress));
}

async function getOrCreateHistoricalPoolDataEntities(params: {
  context: HandlerContext;
  pool: PoolEntity;
  eventTimestamp: bigint;
}): Promise<PoolHistoricalDataEntity[]> {
  const intervalsToFetch: HistoricalDataInterval_t[] = ["DAILY", "HOURLY"];

  return Promise.all(
    intervalsToFetch.map((interval) =>
      params.context.PoolHistoricalData.getOrCreate(
        new InitialPoolHistoricalDataEntity({
          poolEntity: params.pool,
          eventTimestamp: params.eventTimestamp,
          interval: interval,
        }),
      ),
    ),
  );
}

async function getAllPooltimeframedStatsEntities(
  context: HandlerContext,
  pool: PoolEntity,
): Promise<PoolTimeframedStatsEntity[]> {
  const statsToFetch = Id.buildAllTimeframedStatsIds(pool.chainId, pool.poolAddress);
  return Promise.all(statsToFetch.map((stat) => context.PoolTimeframedStats.getOrThrow(stat.id)));
}

async function resetAllPoolTimeframedStats(context: HandlerContext, pool: PoolEntity) {
  const statsToReset = Id.buildAllTimeframedStatsIds(pool.chainId, pool.poolAddress);

  statsToReset.forEach((stat) =>
    context.PoolTimeframedStats.set(
      new InitialPoolTimeframedStatsEntity({
        id: stat.id,
        timeframe: stat.timeframe,
        poolId: pool.id,
        dataPointTimestamp: ZERO_BIG_INT,
      }),
    ),
  );
}

const _tokenMetadataPromises = new Map<string, Promise<SingleChainTokenEntity>>();

function _getMetadataPromisesCacheKey(network: IndexerNetwork, address: string): string {
  return `${network}:${address}`;
}
