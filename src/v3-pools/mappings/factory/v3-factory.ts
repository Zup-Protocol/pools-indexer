import {
  AlgebraPoolData,
  DeFiPoolData as DeFiPoolDataEntity,
  handlerContext,
  Pool as PoolEntity,
  Token as TokenEntity,
  V3PoolData as V3PoolDataEntity,
} from "generated";
import { defaultDeFiPoolData, ZERO_BIG_DECIMAL, ZERO_BIG_INT } from "../../../common/constants";
import { IndexerNetwork } from "../../../common/enums/indexer-network";
import { SupportedProtocol } from "../../../common/enums/supported-protocol";
import { TokenService } from "../../../common/services/token-service";

export async function handleV3PoolCreated(
  context: handlerContext,
  poolAddress: string,
  token0Address: string,
  token1Address: string,
  feeTier: number,
  tickSpacing: number,
  eventTimestamp: bigint,
  chainId: number,
  protocol: SupportedProtocol,
  tokenService: TokenService,
  algebraPoolData?: AlgebraPoolData
): Promise<void> {
  let [token0Entity, token1Entity, defiPoolData]: [TokenEntity, TokenEntity, DeFiPoolDataEntity] = await Promise.all([
    tokenService.getOrCreateTokenEntity(context, chainId, token0Address),
    tokenService.getOrCreateTokenEntity(context, chainId, token1Address),
    context.DeFiPoolData.getOrCreate(defaultDeFiPoolData(eventTimestamp)),
  ]);

  const poolId = IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress);

  const v3PoolEntity: V3PoolDataEntity = {
    id: poolId,
    tickSpacing: tickSpacing,
    sqrtPriceX96: ZERO_BIG_INT,
    tick: ZERO_BIG_INT,
  };

  const poolEntity: PoolEntity = {
    id: poolId,
    poolAddress: poolAddress,
    positionManager: SupportedProtocol.getV3PositionManager(protocol, chainId),
    token0_id: token0Entity.id,
    token1_id: token1Entity.id,
    currentFeeTier: feeTier,
    initialFeeTier: feeTier,
    totalValueLockedToken0: ZERO_BIG_DECIMAL,
    totalValueLockedToken1: ZERO_BIG_DECIMAL,
    liquidityVolumeToken0: ZERO_BIG_DECIMAL,
    liquidityVolumeToken1: ZERO_BIG_DECIMAL,
    totalValueLockedUSD: ZERO_BIG_DECIMAL,
    liquidityVolumeUSD: ZERO_BIG_DECIMAL,
    swapVolumeToken0: ZERO_BIG_DECIMAL,
    swapVolumeToken1: ZERO_BIG_DECIMAL,
    swapVolumeUSD: ZERO_BIG_DECIMAL,
    accumulated24hYield: ZERO_BIG_DECIMAL,
    accumulated30dYield: ZERO_BIG_DECIMAL,
    accumulated7dYield: ZERO_BIG_DECIMAL,
    accumulated90dYield: ZERO_BIG_DECIMAL,
    totalAccumulatedYield: ZERO_BIG_DECIMAL,
    createdAtTimestamp: eventTimestamp,
    protocol_id: protocol,
    isStablePool: undefined,
    poolType: "V3",
    v2PoolData_id: undefined,
    v4PoolData_id: undefined,
    v3PoolData_id: v3PoolEntity.id,
    chainId: chainId,
    algebraPoolData_id: algebraPoolData?.id,
    dataPointTimestamp24h: undefined,
    dataPointTimestamp30d: undefined,
    dataPointTimestamp7d: undefined,
    dataPointTimestamp90d: undefined,
  };

  defiPoolData = {
    ...defiPoolData,
    poolsCount: defiPoolData.poolsCount + 1,
  };

  context.V3PoolData.set(v3PoolEntity);
  context.Pool.set(poolEntity);
  context.DeFiPoolData.set(defiPoolData);
  context.Token.set(token0Entity);
  context.Token.set(token1Entity);

  if (algebraPoolData) context.AlgebraPoolData.set(algebraPoolData);

  context.Protocol.set({
    id: protocol,
    name: SupportedProtocol.getName(protocol),
    logo: SupportedProtocol.getLogoUrl(protocol),
    url: SupportedProtocol.getUrl(protocol),
  });
}
