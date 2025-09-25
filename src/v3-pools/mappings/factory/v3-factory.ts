import { AlgebraPoolData, handlerContext, Pool as PoolEntity, V3PoolData as V3PoolDataEntity } from "generated";
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
  const token0Entity = await tokenService.getOrCreateTokenEntity(context, chainId, token0Address);
  const token1Entity = await tokenService.getOrCreateTokenEntity(context, chainId, token1Address);
  const poolId = IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress);
  let defiPoolData = await context.DeFiPoolData.getOrCreate(defaultDeFiPoolData(eventTimestamp));

  const v3PoolEntity: V3PoolDataEntity = {
    id: poolId,
    tickSpacing: tickSpacing,
    sqrtPriceX96: ZERO_BIG_INT,
    tick: ZERO_BIG_INT,
  };

  const poolEntity: PoolEntity = {
    id: poolId,
    poolAddress: poolAddress.toLowerCase(),
    positionManager: SupportedProtocol.getV3PositionManager(protocol, chainId),
    token0_id: token0Entity.id,
    token1_id: token1Entity.id,
    currentFeeTier: feeTier,
    initialFeeTier: feeTier,
    totalValueLockedUSD: ZERO_BIG_DECIMAL,
    totalValueLockedToken0: ZERO_BIG_DECIMAL,
    totalValueLockedToken1: ZERO_BIG_DECIMAL,
    liquidityVolumeToken0: ZERO_BIG_DECIMAL,
    liquidityVolumeToken1: ZERO_BIG_DECIMAL,
    liquidityVolumeUSD: ZERO_BIG_DECIMAL,
    swapVolumeToken0: ZERO_BIG_DECIMAL,
    swapVolumeToken1: ZERO_BIG_DECIMAL,
    swapVolumeUSD: ZERO_BIG_DECIMAL,
    createdAtTimestamp: eventTimestamp,
    protocol_id: protocol,
    isStablePool: undefined,
    poolType: "V3",
    v2PoolData_id: undefined,
    v4PoolData_id: undefined,
    v3PoolData_id: v3PoolEntity.id,
    chainId: chainId,
    algebraPoolData_id: algebraPoolData?.id,
  };

  defiPoolData = {
    ...defiPoolData,
    poolsCount: defiPoolData.poolsCount + 1,
  };

  context.V3PoolData.set(v3PoolEntity);
  context.Pool.set(poolEntity);
  context.Token.set(token0Entity);
  context.Token.set(token1Entity);
  context.DeFiPoolData.set(defiPoolData);

  await context.Protocol.getOrCreate({
    id: protocol,
    name: SupportedProtocol.getName(protocol),
    logo: SupportedProtocol.getLogoUrl(protocol),
    url: SupportedProtocol.getUrl(protocol),
  });
}
