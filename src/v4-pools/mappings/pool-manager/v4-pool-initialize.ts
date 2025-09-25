import { handlerContext, Pool as PoolEntity, V4PoolData as V4PoolEntity } from "generated";
import { defaultDeFiPoolData, ZERO_BIG_DECIMAL } from "../../../common/constants";
import { IndexerNetwork } from "../../../common/enums/indexer-network";
import { SupportedProtocol } from "../../../common/enums/supported-protocol";
import { TokenService } from "../../../common/services/token-service";

export async function handleV4PoolInitialize(
  context: handlerContext,
  poolAddress: string,
  token0Address: string,
  token1Address: string,
  feeTier: number,
  tickSpacing: number,
  tick: bigint,
  sqrtPriceX96: bigint,
  protocol: SupportedProtocol,
  hooks: string,
  eventTimestamp: bigint,
  chainId: number,
  poolManagerAddress: string,
  tokenService: TokenService
): Promise<void> {
  let token0Entity = await tokenService.getOrCreateTokenEntity(context, chainId, token0Address);
  let token1Entity = await tokenService.getOrCreateTokenEntity(context, chainId, token1Address);
  let defiPoolDataEntity = await context.DeFiPoolData.getOrCreate(defaultDeFiPoolData(eventTimestamp));

  const poolId = IndexerNetwork.getEntityIdFromAddress(chainId, poolAddress);

  const v4PoolEntity: V4PoolEntity = {
    id: poolId,
    permit2: SupportedProtocol.getPermit2Address(protocol, chainId),
    poolManager: poolManagerAddress,
    stateView: SupportedProtocol.getV4StateView(protocol, chainId),
    hooks: hooks,
    sqrtPriceX96: sqrtPriceX96,
    tickSpacing: tickSpacing,
    tick: tick,
  };

  const poolEntity: PoolEntity = {
    id: poolId,
    positionManager: SupportedProtocol.getV4PositionManager(protocol, chainId),
    poolAddress: poolAddress.toLowerCase(),
    createdAtTimestamp: eventTimestamp,
    currentFeeTier: feeTier,
    initialFeeTier: feeTier,
    isStablePool: undefined,
    poolType: "V4",
    protocol_id: protocol,
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
    v2PoolData_id: undefined,
    v3PoolData_id: undefined,
    v4PoolData_id: v4PoolEntity.id,
    chainId: chainId,
  };

  defiPoolDataEntity = {
    ...defiPoolDataEntity,
    poolsCount: defiPoolDataEntity.poolsCount + 1,
  };

  context.Token.set(token0Entity);
  context.Token.set(token1Entity);
  context.Pool.set(poolEntity);
  context.V4PoolData.set(v4PoolEntity);
  context.DeFiPoolData.set(defiPoolDataEntity);

  await context.Protocol.getOrCreate({
    id: protocol,
    name: SupportedProtocol.getName(protocol),
    logo: SupportedProtocol.getLogoUrl(protocol),
    url: SupportedProtocol.getUrl(protocol),
  });
}
