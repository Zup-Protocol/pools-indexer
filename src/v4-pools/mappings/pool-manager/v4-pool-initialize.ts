import { HandlerContext, Pool as PoolEntity, V4PoolData as V4PoolEntity } from "generated";
import { sqrtPriceX96toPrice } from "../../../common/cl-pool-converters";
import { ZERO_BIG_DECIMAL } from "../../../common/constants";
import { IndexerNetwork } from "../../../common/enums/indexer-network";
import { SupportedProtocol } from "../../../common/enums/supported-protocol";
import { PoolSetters } from "../../../common/pool-setters";
import { TokenService } from "../../../common/services/token-service";

export async function handleV4PoolInitialize(
  context: HandlerContext,
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
  v4PoolSetters: PoolSetters,
  tokenService: TokenService
): Promise<void> {
  let token0Entity = await tokenService.getOrCreateTokenEntity(context, chainId, token0Address);
  let token1Entity = await tokenService.getOrCreateTokenEntity(context, chainId, token1Address);
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
    v2PoolData_id: undefined,
    v3PoolData_id: undefined,
    v4PoolData_id: v4PoolEntity.id,
    chainId: chainId,
  };

  const newPrices = v4PoolSetters.getPricesForPoolWhitelistedTokens(
    token0Entity,
    token1Entity,
    sqrtPriceX96toPrice(sqrtPriceX96, token0Entity, token1Entity)
  );

  token0Entity = {
    ...token0Entity,
    usdPrice: newPrices.token0UpdatedPrice,
  };

  token1Entity = {
    ...token1Entity,
    usdPrice: newPrices.token1UpdatedPrice,
  };

  context.Token.set(token0Entity);
  context.Token.set(token1Entity);
  context.Pool.set(poolEntity);
  context.V4PoolData.set(v4PoolEntity);

  await context.Protocol.getOrCreate({
    id: protocol,
    name: SupportedProtocol.getName(protocol),
    logo: SupportedProtocol.getLogoUrl(protocol),
    url: SupportedProtocol.getUrl(protocol),
  });
}
