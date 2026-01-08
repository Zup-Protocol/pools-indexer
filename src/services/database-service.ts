import type {
  Pool as PoolEntity,
  PoolHistoricalData as PoolHistoricalDataEntity,
  PoolTimeframedStats as PoolTimeframedStatsEntity,
  Token as TokenEntity,
} from "generated";
import type { HistoricalDataInterval_t } from "generated/src/db/Enums.gen";
import type { HandlerContext } from "generated/src/Types";
import { ZERO_ADDRESS } from "../core/constants";
import { getMultiTokenMetadataEffect } from "../core/effects/token-metadata-effect";
import { EntityId, InitialPoolHistoricalDataEntity, InitialPoolTimeframedStatsEntity } from "../core/entity";
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
}): Promise<[TokenEntity, TokenEntity]> {
  const dbEntities = await Promise.all([
    params.context.Token.get(EntityId.fromAddress(params.network, params.token0Address)),
    params.context.Token.get(EntityId.fromAddress(params.network, params.token1Address)),
  ]);

  if (dbEntities[0] && dbEntities[1]) return dbEntities as [TokenEntity, TokenEntity];

  const entitiesMap = new Map<string, TokenEntity>();
  const missingAddresses: string[] = [];

  [params.token0Address, params.token1Address].forEach((address, index) => {
    const existingEntity = dbEntities[index];

    if (existingEntity) entitiesMap.set(address, existingEntity);
    else if (address === ZERO_ADDRESS) {
      entitiesMap.set(
        ZERO_ADDRESS,
        new InitialTokenEntity({
          ...IndexerNetwork.nativeToken[params.network],
          network: params.network,
          tokenAddress: ZERO_ADDRESS,
        })
      );
    } else missingAddresses.push(address);
  });

  if (missingAddresses.length === 0) {
    return [entitiesMap.get(params.token0Address)!, entitiesMap.get(params.token1Address)!];
  }

  const metadatas = await params.context.effect(getMultiTokenMetadataEffect, {
    chainId: params.network,
    tokenAddresses: missingAddresses,
  });

  metadatas.forEach((metadata, index) => {
    entitiesMap.set(
      missingAddresses[index]!,
      new InitialTokenEntity({
        decimals: metadata.decimals,
        name: metadata.name,
        network: params.network,
        symbol: metadata.symbol,
        tokenAddress: missingAddresses[index]!,
      })
    );
  });

  const token0Entity = entitiesMap.get(params.token0Address)!;
  const token1Entity = entitiesMap.get(params.token1Address)!;

  return [token0Entity, token1Entity];
}

async function getOldestPoolHourlyDataAgo(
  hoursAgo: number,
  eventTimestamp: bigint,
  context: HandlerContext,
  pool: PoolEntity
): Promise<PoolHistoricalDataEntity | undefined> {
  if (pool.lastActivityTimestamp < subtractHoursFromSecondsTimestamp(eventTimestamp, hoursAgo)) return;

  for (let hour = hoursAgo; hour >= 0; hour--) {
    const timestamp = subtractHoursFromSecondsTimestamp(eventTimestamp, hour);
    if (timestamp < pool.createdAtTimestamp) continue;

    const data = await context.PoolHistoricalData.get(
      EntityId.buildHourlyDataId(timestamp, pool.chainId, pool.poolAddress)
    );

    if (data) return data;
  }
}

async function getOldestPoolDailyDataAgo(
  daysAgo: number,
  eventTimestamp: bigint,
  context: HandlerContext,
  pool: PoolEntity
): Promise<PoolHistoricalDataEntity | undefined> {
  if (pool.lastActivityTimestamp < subtractDaysFromSecondsTimestamp(eventTimestamp, daysAgo)) return;

  for (let day = daysAgo; day >= 0; day--) {
    const timestamp = subtractDaysFromSecondsTimestamp(eventTimestamp, day);
    if (timestamp < pool.createdAtTimestamp) continue;

    const data = await context.PoolHistoricalData.get(
      EntityId.buildDailyDataId(timestamp, pool.chainId, pool.poolAddress)
    );

    if (data) return data;
  }
}

async function getPoolHourlyDataAgo(
  hoursAgo: number,
  eventTimestamp: bigint,
  context: HandlerContext,
  pool: PoolEntity
): Promise<PoolHistoricalDataEntity | undefined> {
  const timestampAgo = subtractHoursFromSecondsTimestamp(eventTimestamp, hoursAgo);
  if (timestampAgo < pool.createdAtTimestamp || pool.lastActivityTimestamp < timestampAgo) return;

  return await context.PoolHistoricalData.get(EntityId.buildHourlyDataId(timestampAgo, pool.chainId, pool.poolAddress));
}

async function getPoolDailyDataAgo(
  daysAgo: number,
  eventTimestamp: bigint,
  context: HandlerContext,
  pool: PoolEntity
): Promise<PoolHistoricalDataEntity | undefined> {
  const timestampAgo = subtractDaysFromSecondsTimestamp(eventTimestamp, daysAgo);
  if (timestampAgo < pool.createdAtTimestamp || pool.lastActivityTimestamp < timestampAgo) return;

  return await context.PoolHistoricalData.get(EntityId.buildDailyDataId(timestampAgo, pool.chainId, pool.poolAddress));
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
        })
      )
    )
  );
}

async function getAllPooltimeframedStatsEntities(
  context: HandlerContext,
  pool: PoolEntity
): Promise<PoolTimeframedStatsEntity[]> {
  const statsToFetch = EntityId.buildAllTimeframedStatsIds(pool.chainId, pool.poolAddress);
  return Promise.all(statsToFetch.map((stat) => context.PoolTimeframedStats.getOrThrow(stat.id)));
}

async function resetAllPoolTimeframedStats(context: HandlerContext, pool: PoolEntity) {
  const statsToReset = EntityId.buildAllTimeframedStatsIds(pool.chainId, pool.poolAddress);

  statsToReset.forEach((stat) =>
    context.PoolTimeframedStats.set(
      new InitialPoolTimeframedStatsEntity({
        id: stat.id,
        timeframe: stat.timeframe,
        poolId: pool.id,
        dataPointTimestamp: BigInt(0),
      })
    )
  );
}
