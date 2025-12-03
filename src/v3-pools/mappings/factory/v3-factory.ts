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

export async function handleV3PoolCreated(params: {
  context: handlerContext;
  poolAddress: string;
  token0Address: string;
  token1Address: string;
  feeTier: number;
  tickSpacing: number;
  eventTimestamp: bigint;
  chainId: number;
  protocol: SupportedProtocol;
  tokenService: TokenService;
  algebraPoolData?: AlgebraPoolData;
}): Promise<void> {
  let [token0Entity, token1Entity, defiPoolData]: [TokenEntity, TokenEntity, DeFiPoolDataEntity] = await Promise.all([
    params.tokenService.getOrCreateTokenEntity(params.context, params.chainId, params.token0Address),
    params.tokenService.getOrCreateTokenEntity(params.context, params.chainId, params.token1Address),
    params.context.DeFiPoolData.getOrCreate(defaultDeFiPoolData(params.eventTimestamp)),
  ]);

  const poolId = IndexerNetwork.getEntityIdFromAddress(params.chainId, params.poolAddress);

  const v3PoolEntity: V3PoolDataEntity = {
    id: poolId,
    tickSpacing: params.tickSpacing,
    sqrtPriceX96: ZERO_BIG_INT,
    tick: ZERO_BIG_INT,
  };

  const poolEntity: PoolEntity = {
    id: poolId,
    poolAddress: params.poolAddress,
    positionManager: SupportedProtocol.getV3PositionManager(params.protocol, params.chainId),
    token0_id: token0Entity.id,
    token1_id: token1Entity.id,
    currentFeeTier: params.feeTier,
    initialFeeTier: params.feeTier,
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
    createdAtTimestamp: params.eventTimestamp,
    protocol_id: params.protocol,
    isStablePool: undefined,
    poolType: "V3",
    v2PoolData_id: undefined,
    v4PoolData_id: undefined,
    v3PoolData_id: v3PoolEntity.id,
    chainId: params.chainId,
    algebraPoolData_id: params.algebraPoolData?.id,
    dataPointTimestamp24h: params.eventTimestamp,
    dataPointTimestamp30d: params.eventTimestamp,
    dataPointTimestamp7d: params.eventTimestamp,
    dataPointTimestamp90d: params.eventTimestamp,
  };

  defiPoolData = {
    ...defiPoolData,
    poolsCount: defiPoolData.poolsCount + 1,
  };

  params.context.V3PoolData.set(v3PoolEntity);
  params.context.Pool.set(poolEntity);
  params.context.DeFiPoolData.set(defiPoolData);
  params.context.Token.set(token0Entity);
  params.context.Token.set(token1Entity);

  if (params.algebraPoolData) params.context.AlgebraPoolData.set(params.algebraPoolData);

  params.context.Protocol.set({
    id: params.protocol,
    name: SupportedProtocol.getName(params.protocol),
    logo: SupportedProtocol.getLogoUrl(params.protocol),
    url: SupportedProtocol.getUrl(params.protocol),
  });
}
