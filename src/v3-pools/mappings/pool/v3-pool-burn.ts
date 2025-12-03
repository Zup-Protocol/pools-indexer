import { handlerContext, Pool as PoolEntity, Token as TokenEntity } from "generated";
import { DeFiPoolDataSetters } from "../../../common/defi-pool-data-setters";
import { PoolSetters } from "../../../common/pool-setters";
import { formatFromTokenAmount } from "../../../common/token-commons";

export async function handleV3PoolBurn(
  context: handlerContext,
  poolEntity: PoolEntity,
  token0Entity: TokenEntity,
  token1Entity: TokenEntity,
  amount0: bigint,
  amount1: bigint,
  eventTimestamp: bigint,
  v3PoolSetters: PoolSetters,
  defiPoolDataSetters: DeFiPoolDataSetters
) {
  // we do not update TVL and data related, because the collect handler already does.
  // This handler is only used to updated liquidity volume data
  const formattedToken0BurnedAmount = formatFromTokenAmount(amount0, token0Entity);
  const formattedToken1BurnedAmount = formatFromTokenAmount(amount1, token1Entity);

  const operationVolumeUSD = formattedToken0BurnedAmount
    .times(token0Entity.usdPrice)
    .plus(formattedToken1BurnedAmount.times(token1Entity.usdPrice));

  poolEntity = {
    ...poolEntity,
    liquidityVolumeToken0: poolEntity.liquidityVolumeToken0.plus(formattedToken0BurnedAmount),
    liquidityVolumeToken1: poolEntity.liquidityVolumeToken1.plus(formattedToken1BurnedAmount),
    liquidityVolumeUSD: poolEntity.liquidityVolumeUSD.plus(operationVolumeUSD),
  };

  token0Entity = {
    ...token0Entity,
    tokenLiquidityVolume: token0Entity.tokenLiquidityVolume.plus(formattedToken0BurnedAmount),
    liquidityVolumeUSD: token0Entity.liquidityVolumeUSD.plus(formattedToken0BurnedAmount.times(token0Entity.usdPrice)),
  };

  token1Entity = {
    ...token1Entity,
    tokenLiquidityVolume: token1Entity.tokenLiquidityVolume.plus(formattedToken1BurnedAmount),
    liquidityVolumeUSD: token1Entity.liquidityVolumeUSD.plus(formattedToken1BurnedAmount.times(token1Entity.usdPrice)),
  };

  await v3PoolSetters.setLiquidityIntervalData({
    amount0AddedOrRemoved: -amount0,
    amount1AddedOrRemoved: -amount1,
    eventTimestamp,
    poolEntity,
    token0: token0Entity,
    token1: token1Entity,
  });

  poolEntity = await v3PoolSetters.updatePoolAccumulatedYield(eventTimestamp, poolEntity);

  // TODO: Maybe implement -> Currently removed as is not needed and it makes the sync slower
  // if (isPoolSwapVolumeValid(poolEntity)) {
  //   await defiPoolDataSetters.setIntervalLiquidityData(
  //     eventTimestamp,
  //     defiPoolDataEntity,
  //     -amount0,
  //     -amount1,
  //     token0Entity,
  //     token1Entity
  //   );
  // }

  context.Pool.set(poolEntity);
  context.Token.set(token0Entity);
  context.Token.set(token1Entity);
}
