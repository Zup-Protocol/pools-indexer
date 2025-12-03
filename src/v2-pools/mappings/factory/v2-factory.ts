import {
  DeFiPoolData as DeFiPoolDataEntity,
  handlerContext,
  Pool as PoolEntity,
  Token as TokenEntity,
  V2PoolData as V2PoolDataEntity,
} from "generated";

import { defaultDeFiPoolData, ZERO_BIG_DECIMAL } from "../../../common/constants";
import { IndexerNetwork } from "../../../common/enums/indexer-network";
import { SupportedProtocol } from "../../../common/enums/supported-protocol";
import { TokenService } from "../../../common/services/token-service";

export async function handleV2PoolCreated(params: {
  context: handlerContext;
  chainId: number;
  eventTimestamp: bigint;
  token0Address: string;
  token1Address: string;
  poolAddress: string;
  feeTier: number;
  protocol: SupportedProtocol;
  tokenService: TokenService;
}): Promise<void> {
  let [token0Entity, token1Entity, defiPoolData]: [TokenEntity, TokenEntity, DeFiPoolDataEntity] = await Promise.all([
    params.tokenService.getOrCreateTokenEntity(params.context, params.chainId, params.token0Address),
    params.tokenService.getOrCreateTokenEntity(params.context, params.chainId, params.token1Address),
    params.context.DeFiPoolData.getOrCreate(defaultDeFiPoolData(params.eventTimestamp)),
  ]);

  const poolId = IndexerNetwork.getEntityIdFromAddress(params.chainId, params.poolAddress);

  const v2PoolEntity: V2PoolDataEntity = {
    id: poolId,
  };

  const poolEntity: PoolEntity = {
    id: poolId,
    positionManager: SupportedProtocol.getV2PositionManager(params.protocol, params.chainId),
    createdAtTimestamp: params.eventTimestamp,
    currentFeeTier: params.feeTier,
    initialFeeTier: params.feeTier,
    totalValueLockedToken0: ZERO_BIG_DECIMAL,
    poolType: "V2",
    protocol_id: params.protocol,
    token0_id: token0Entity.id,
    token1_id: token1Entity.id,
    accumulated24hYield: ZERO_BIG_DECIMAL,
    accumulated30dYield: ZERO_BIG_DECIMAL,
    accumulated7dYield: ZERO_BIG_DECIMAL,
    accumulated90dYield: ZERO_BIG_DECIMAL,
    totalAccumulatedYield: ZERO_BIG_DECIMAL,
    totalValueLockedToken1: ZERO_BIG_DECIMAL,
    totalValueLockedUSD: ZERO_BIG_DECIMAL,
    liquidityVolumeToken0: ZERO_BIG_DECIMAL,
    liquidityVolumeToken1: ZERO_BIG_DECIMAL,
    liquidityVolumeUSD: ZERO_BIG_DECIMAL,
    swapVolumeToken0: ZERO_BIG_DECIMAL,
    swapVolumeToken1: ZERO_BIG_DECIMAL,
    swapVolumeUSD: ZERO_BIG_DECIMAL,
    isStablePool: undefined,
    v2PoolData_id: v2PoolEntity.id,
    v3PoolData_id: undefined,
    v4PoolData_id: undefined,
    algebraPoolData_id: undefined,
    chainId: params.chainId,
    poolAddress: params.poolAddress,
    dataPointTimestamp24h: undefined,
    dataPointTimestamp30d: undefined,
    dataPointTimestamp7d: undefined,
    dataPointTimestamp90d: undefined,
  };

  defiPoolData = {
    ...defiPoolData,
    poolsCount: defiPoolData.poolsCount + 1,
  };

  params.context.Token.set(token0Entity);
  params.context.Token.set(token1Entity);
  params.context.Pool.set(poolEntity);
  params.context.V2PoolData.set(v2PoolEntity);
  params.context.DeFiPoolData.set(defiPoolData);

  params.context.Protocol.set({
    id: params.protocol,
    name: SupportedProtocol.getName(params.protocol),
    logo: SupportedProtocol.getLogoUrl(params.protocol),
    url: SupportedProtocol.getUrl(params.protocol),
  });
}
