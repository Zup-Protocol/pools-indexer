import {
  DeFiPoolData as DeFiPoolDataEntity,
  handlerContext,
  Pool as PoolEntity,
  Token as TokenEntity,
  V4PoolData as V4PoolEntity,
} from "generated";
import { defaultDeFiPoolData, ZERO_BIG_DECIMAL } from "../../../common/constants";
import { IndexerNetwork } from "../../../common/enums/indexer-network";
import { SupportedProtocol } from "../../../common/enums/supported-protocol";
import { TokenService } from "../../../common/services/token-service";

export async function handleV4PoolInitialize(params: {
  context: handlerContext;
  poolAddress: string;
  token0Address: string;
  token1Address: string;
  feeTier: number;
  tickSpacing: number;
  tick: bigint;
  sqrtPriceX96: bigint;
  protocol: SupportedProtocol;
  hooks: string;
  eventTimestamp: bigint;
  chainId: number;
  poolManagerAddress: string;
  tokenService: TokenService;
}): Promise<void> {
  let [token0Entity, token1Entity, defiPoolDataEntity]: [TokenEntity, TokenEntity, DeFiPoolDataEntity] =
    await Promise.all([
      params.tokenService.getOrCreateTokenEntity(params.context, params.chainId, params.token0Address),
      params.tokenService.getOrCreateTokenEntity(params.context, params.chainId, params.token1Address),
      params.context.DeFiPoolData.getOrCreate(defaultDeFiPoolData(params.eventTimestamp)),
    ]);

  const poolId = IndexerNetwork.getEntityIdFromAddress(params.chainId, params.poolAddress);

  const v4PoolEntity: V4PoolEntity = {
    id: poolId,
    permit2: SupportedProtocol.getPermit2Address(params.protocol, params.chainId),
    poolManager: params.poolManagerAddress,
    stateView: SupportedProtocol.getV4StateView(params.protocol, params.chainId),
    hooks: params.hooks,
    sqrtPriceX96: params.sqrtPriceX96,
    tickSpacing: params.tickSpacing,
    tick: params.tick,
  };

  const poolEntity: PoolEntity = {
    id: poolId,
    positionManager: SupportedProtocol.getV4PositionManager(params.protocol, params.chainId),
    poolAddress: params.poolAddress,
    createdAtTimestamp: params.eventTimestamp,
    currentFeeTier: params.feeTier,
    initialFeeTier: params.feeTier,
    isStablePool: undefined,
    poolType: "V4",
    protocol_id: params.protocol,
    token0_id: token0Entity.id,
    token1_id: token1Entity.id,
    algebraPoolData_id: undefined,
    totalValueLockedToken0: ZERO_BIG_DECIMAL,
    totalValueLockedToken1: ZERO_BIG_DECIMAL,
    totalValueLockedUSD: ZERO_BIG_DECIMAL,
    liquidityVolumeToken0: ZERO_BIG_DECIMAL,
    liquidityVolumeToken1: ZERO_BIG_DECIMAL,
    liquidityVolumeUSD: ZERO_BIG_DECIMAL,
    swapVolumeToken0: ZERO_BIG_DECIMAL,
    swapVolumeToken1: ZERO_BIG_DECIMAL,
    swapVolumeUSD: ZERO_BIG_DECIMAL,
    accumulated24hYield: ZERO_BIG_DECIMAL,
    accumulated30dYield: ZERO_BIG_DECIMAL,
    accumulated7dYield: ZERO_BIG_DECIMAL,
    accumulated90dYield: ZERO_BIG_DECIMAL,
    totalAccumulatedYield: ZERO_BIG_DECIMAL,
    v2PoolData_id: undefined,
    v3PoolData_id: undefined,
    v4PoolData_id: v4PoolEntity.id,
    chainId: params.chainId,
    dataPointTimestamp24h: params.eventTimestamp,
    dataPointTimestamp30d: params.eventTimestamp,
    dataPointTimestamp7d: params.eventTimestamp,
    dataPointTimestamp90d: params.eventTimestamp,
  };

  defiPoolDataEntity = {
    ...defiPoolDataEntity,
    poolsCount: defiPoolDataEntity.poolsCount + 1,
  };

  params.context.Token.set(token0Entity);
  params.context.Token.set(token1Entity);
  params.context.Pool.set(poolEntity);
  params.context.V4PoolData.set(v4PoolEntity);
  params.context.DeFiPoolData.set(defiPoolDataEntity);
  params.context.Protocol.set({
    id: params.protocol,
    name: SupportedProtocol.getName(params.protocol),
    logo: SupportedProtocol.getLogoUrl(params.protocol),
    url: SupportedProtocol.getUrl(params.protocol),
  });
}
