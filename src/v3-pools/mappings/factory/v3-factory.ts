import {
  DeFiPoolData as DeFiPoolDataEntity,
  handlerContext,
  Pool as PoolEntity,
  Token as TokenEntity,
  V3PoolData,
} from "generated";
import { ZERO_BIG_DECIMAL, ZERO_BIG_INT } from "../../../common/constants";
import { defaultDeFiPoolData } from "../../../common/default-entities";
import { IndexerNetwork } from "../../../common/enums/indexer-network";
import { SupportedProtocol } from "../../../common/enums/supported-protocol";
import { TokenService } from "../../../common/services/token-service";

export async function handleV3PoolCreated(params: {
  context: handlerContext;
  poolAddress: string;
  token0Address: string;
  token1Address: string;
  feeTier?: number;
  tickSpacing: number;
  eventTimestamp: bigint;
  chainId: number;
  protocol: SupportedProtocol;
  tokenService: TokenService;
  isDynamicFee?: boolean;
}): Promise<void> {
  let [token0Entity, token1Entity, defiPoolData]: [TokenEntity, TokenEntity, DeFiPoolDataEntity] = await Promise.all([
    params.tokenService.getOrCreateTokenEntity(params.context, params.chainId, params.token0Address),
    params.tokenService.getOrCreateTokenEntity(params.context, params.chainId, params.token1Address),
    params.context.DeFiPoolData.getOrCreate(defaultDeFiPoolData(params.eventTimestamp)),
  ]);

  const poolId = IndexerNetwork.getEntityIdFromAddress(params.chainId, params.poolAddress);

  const v3PoolData: V3PoolData = {
    id: poolId,
    sqrtPriceX96: ZERO_BIG_INT,
    tick: ZERO_BIG_INT,
    tickSpacing: params.tickSpacing,
  };

  const poolEntity: PoolEntity = {
    id: poolId,
    poolAddress: params.poolAddress,
    positionManager: SupportedProtocol.getV3PositionManager(params.protocol, params.chainId),
    token0_id: token0Entity.id,
    token1_id: token1Entity.id,
    currentFeeTier: params.feeTier ?? 0,
    initialFeeTier: params.feeTier ?? 0,
    totalValueLockedToken0: ZERO_BIG_DECIMAL,
    totalValueLockedToken1: ZERO_BIG_DECIMAL,
    liquidityVolumeToken0: ZERO_BIG_DECIMAL,
    liquidityVolumeToken1: ZERO_BIG_DECIMAL,
    totalValueLockedUSD: ZERO_BIG_DECIMAL,
    liquidityVolumeUSD: ZERO_BIG_DECIMAL,
    swapVolumeToken0: ZERO_BIG_DECIMAL,
    swapVolumeToken1: ZERO_BIG_DECIMAL,
    swapVolumeUSD: ZERO_BIG_DECIMAL,
    accumulatedYield24h: ZERO_BIG_DECIMAL,
    accumulatedYield7d: ZERO_BIG_DECIMAL,
    accumulatedYield30d: ZERO_BIG_DECIMAL,
    accumulatedYield90d: ZERO_BIG_DECIMAL,
    totalAccumulatedYield: ZERO_BIG_DECIMAL,
    createdAtTimestamp: params.eventTimestamp,
    protocol_id: params.protocol,
    poolType: "V3",
    v4PoolData_id: undefined,
    algebraPoolData_id: undefined,
    v3PoolData_id: v3PoolData.id,
    chainId: params.chainId,
    lastAdjustTimestamp24h: undefined,
    lastAdjustTimestamp7d: undefined,
    lastAdjustTimestamp30d: undefined,
    lastAdjustTimestamp90d: undefined,
    totalAccumulatedYield24hAgo: ZERO_BIG_DECIMAL,
    totalAccumulatedYield30dAgo: ZERO_BIG_DECIMAL,
    totalAccumulatedYield7dAgo: ZERO_BIG_DECIMAL,
    totalAccumulatedYield90dAgo: ZERO_BIG_DECIMAL,
    yearlyYield24h: ZERO_BIG_DECIMAL,
    yearlyYield30d: ZERO_BIG_DECIMAL,
    yearlyYield7d: ZERO_BIG_DECIMAL,
    yearlyYield90d: ZERO_BIG_DECIMAL,
    dataPointTimestamp24hAgo: params.eventTimestamp,
    dataPointTimestamp7dAgo: params.eventTimestamp,
    dataPointTimestamp30dAgo: params.eventTimestamp,
    dataPointTimestamp90dAgo: params.eventTimestamp,
    isDynamicFee: params.isDynamicFee ?? false,
  };

  defiPoolData = {
    ...defiPoolData,
    poolsCount: defiPoolData.poolsCount + 1,
  };

  params.context.Pool.set(poolEntity);
  params.context.DeFiPoolData.set(defiPoolData);
  params.context.Token.set(token0Entity);
  params.context.Token.set(token1Entity);
  params.context.V3PoolData.set(v3PoolData);
  params.context.Protocol.set({
    id: params.protocol,
    name: SupportedProtocol.getName(params.protocol),
    logo: SupportedProtocol.getLogoUrl(params.protocol),
    url: SupportedProtocol.getUrl(params.protocol),
  });
}
