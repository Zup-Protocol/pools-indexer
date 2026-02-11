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
};

async function getOrCreatePoolTokenEntities(params: {
  context: HandlerContext;
  network: IndexerNetwork;
  token0Address: string;
  token1Address: string;
}): Promise<[SingleChainTokenEntity, SingleChainTokenEntity]> {
  const [token0, token1]: [SingleChainTokenEntity | undefined, SingleChainTokenEntity | undefined] = await Promise.all([
    params.context.SingleChainToken.get(Id.fromAddress(params.network, params.token0Address)),
    params.context.SingleChainToken.get(Id.fromAddress(params.network, params.token1Address)),
  ]);

  if (token0 && token1) return [token0, token1];

  if (token0 && !token1) {
    const createdToken1 = await _createTokenEntity({
      context: params.context,
      network: params.network,
      tokenAddress: params.token1Address,
    });

    return [token0, createdToken1];
  }

  if (!token0 && token1) {
    const createdToken0 = await _createTokenEntity({
      context: params.context,
      network: params.network,
      tokenAddress: params.token0Address,
    });

    return [createdToken0, token1];
  }

  return _createPoolTokenEntities({
    context: params.context,
    network: params.network,
    token0Address: params.token0Address,
    token1Address: params.token1Address,
  });
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

async function _createPoolTokenEntities(params: {
  context: HandlerContext;
  network: IndexerNetwork;
  token0Address: string;
  token1Address: string;
}): Promise<[SingleChainTokenEntity, SingleChainTokenEntity]> {
  const isToken0ZeroAddress = params.token0Address === ZERO_ADDRESS;
  const isToken1ZeroAddress = params.token1Address === ZERO_ADDRESS;

  // this means that only one fetch will be performed, so it's ok to call it separated
  if (isToken0ZeroAddress || isToken1ZeroAddress) {
    return [
      await _createTokenEntity({
        context: params.context,
        network: params.network,
        tokenAddress: params.token0Address,
      }),

      await _createTokenEntity({
        context: params.context,
        network: params.network,
        tokenAddress: params.token1Address,
      }),
    ];
  }

  const [token0Metadata, token1Metadata] = await params.context.effect(getMultiTokenMetadataEffect, {
    chainId: params.network,
    tokenAddresses: [params.token0Address, params.token1Address],
  });

  return [
    new InitialTokenEntity({
      decimals: token0Metadata!.decimals,
      name: token0Metadata!.name,
      symbol: token0Metadata!.symbol,
      network: params.network,
      tokenAddress: params.token0Address,
    }),

    new InitialTokenEntity({
      decimals: token1Metadata!.decimals,
      name: token1Metadata!.name,
      symbol: token1Metadata!.symbol,
      network: params.network,
      tokenAddress: params.token1Address,
    }),
  ];
}

async function _createTokenEntity(params: {
  context: HandlerContext;
  network: IndexerNetwork;
  tokenAddress: string;
}): Promise<SingleChainTokenEntity> {
  if (params.tokenAddress === ZERO_ADDRESS) {
    return new InitialTokenEntity({
      ...IndexerNetwork.nativeToken[params.network],
      network: params.network,
      tokenAddress: ZERO_ADDRESS,
    });
  }

  const tokenMetadata = await params.context.effect(getMultiTokenMetadataEffect, {
    chainId: params.network,
    tokenAddresses: [params.tokenAddress],
  });

  return new InitialTokenEntity({
    decimals: tokenMetadata[0]!.decimals,
    name: tokenMetadata[0]!.name,
    network: params.network,
    symbol: tokenMetadata[0]!.symbol,
    tokenAddress: params.tokenAddress,
  });
}
