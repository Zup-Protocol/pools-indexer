import type { BigDecimal, Pool as PoolEntity, SingleChainToken as SingleChainTokenEntity } from "generated";
import { ZERO_BIG_DECIMAL } from "../../core/constants";
import { PriceConverter } from "../pricing/price-converter";
import { isPercentageDifferenceWithinThreshold } from "./percentage-math";
import { TokenDecimalMath } from "./token/token-decimal-math";

export function calculateLiquidityFlow(params: {
  amount0AddedOrRemoved: bigint;
  amount1AddedOrRemoved: bigint;
  token0: SingleChainTokenEntity;
  token1: SingleChainTokenEntity;
  pool: PoolEntity;
}): {
  inflowToken0: BigDecimal;
  inflowToken1: BigDecimal;
  outflowToken0: BigDecimal;
  outflowToken1: BigDecimal;
  netInflowToken0: BigDecimal;
  netInflowToken1: BigDecimal;
  inflowUSD: BigDecimal;
  outflowUSD: BigDecimal;
  netInflowUSD: BigDecimal;
  trackedInflowUSD: BigDecimal;
  trackedOutflowUSD: BigDecimal;
  trackedNetInflowUSD: BigDecimal;
} {
  const amount0Formatted = TokenDecimalMath.rawToDecimal(params.amount0AddedOrRemoved, params.token0);
  const amount1Formatted = TokenDecimalMath.rawToDecimal(params.amount1AddedOrRemoved, params.token1);
  const isAmount0Positive = params.amount0AddedOrRemoved > 0;
  const isAmount1Positive = params.amount1AddedOrRemoved > 0;

  const inflowToken0 = isAmount0Positive ? amount0Formatted : ZERO_BIG_DECIMAL;
  const inflowToken1 = isAmount1Positive ? amount1Formatted : ZERO_BIG_DECIMAL;
  const outflowToken0 = isAmount0Positive ? ZERO_BIG_DECIMAL : amount0Formatted.abs();
  const outflowToken1 = isAmount1Positive ? ZERO_BIG_DECIMAL : amount1Formatted.abs();
  const netInflowToken0 = amount0Formatted;
  const netInflowToken1 = amount1Formatted;

  const inflowToken0USD = inflowToken0.times(params.token0.usdPrice);
  const trackedInflowToken0USD = PriceConverter.convertTokenAmountToTrackedUsd({
    amount: inflowToken0,
    token: params.token0,
    comparisonToken: params.token1,
    poolEntity: params.pool,
    fallbackUsdValue: ZERO_BIG_DECIMAL,
  });

  const inflowToken1USD = inflowToken1.times(params.token1.usdPrice);
  const trackedInflowToken1USD = PriceConverter.convertTokenAmountToTrackedUsd({
    amount: inflowToken1,
    token: params.token1,
    comparisonToken: params.token0,
    poolEntity: params.pool,
    fallbackUsdValue: ZERO_BIG_DECIMAL,
  });

  const outflowToken0USD = outflowToken0.times(params.token0.usdPrice);
  const trackedOutflowToken0USD = PriceConverter.convertTokenAmountToTrackedUsd({
    amount: outflowToken0,
    token: params.token0,
    comparisonToken: params.token1,
    poolEntity: params.pool,
    fallbackUsdValue: ZERO_BIG_DECIMAL,
  });

  const outflowToken1USD = outflowToken1.times(params.token1.usdPrice);
  const trackedOutflowToken1USD = PriceConverter.convertTokenAmountToTrackedUsd({
    amount: outflowToken1,
    token: params.token1,
    comparisonToken: params.token0,
    poolEntity: params.pool,
    fallbackUsdValue: ZERO_BIG_DECIMAL,
  });

  const inflowUSD = inflowToken0USD.plus(inflowToken1USD);
  const trackedInflowUSD = trackedInflowToken0USD.plus(trackedInflowToken1USD);

  const outflowUSD = outflowToken0USD.plus(outflowToken1USD);
  const trackedOutflowUSD = trackedOutflowToken0USD.plus(trackedOutflowToken1USD);

  const netInflowUSD = inflowUSD.minus(outflowUSD);
  const trackedNetInflowUSD = trackedInflowUSD.minus(trackedOutflowUSD);

  return {
    inflowToken0: inflowToken0,
    inflowToken1: inflowToken1,
    outflowToken0: outflowToken0,
    outflowToken1: outflowToken1,
    netInflowToken0: netInflowToken0,
    netInflowToken1: netInflowToken1,
    inflowUSD: inflowUSD,
    outflowUSD: outflowUSD,
    netInflowUSD: netInflowUSD,
    trackedInflowUSD: trackedInflowUSD,
    trackedOutflowUSD: trackedOutflowUSD,
    trackedNetInflowUSD: trackedNetInflowUSD,
  };
}

export function calculateNewLockedAmountsUSD(params: {
  poolEntity: PoolEntity;
  token0: SingleChainTokenEntity;
  token1: SingleChainTokenEntity;
}): {
  newPoolTotalValueLockedToken0USD: BigDecimal;
  newPoolTotalValueLockedToken1USD: BigDecimal;
  newPoolTotalValueLockedUSD: BigDecimal;
  newToken0TotalPooledAmountUSD: BigDecimal;
  newToken1TotalPooledAmountUSD: BigDecimal;
  newTrackedPoolTotalValueLockedToken0USD: BigDecimal;
  newTrackedPoolTotalValueLockedToken1USD: BigDecimal;
  newTrackedPoolTotalValueLockedUSD: BigDecimal;
  newTrackedToken0TotalPooledAmountUSD: BigDecimal;
  newTrackedToken1TotalPooledAmountUSD: BigDecimal;
} {
  const updatedPoolTotalValueLockedToken0 = params.poolEntity.totalValueLockedToken0;
  const updatedPoolTotalValueLockedToken1 = params.poolEntity.totalValueLockedToken1;

  const updatedPoolTotalValueLockedToken0USD = updatedPoolTotalValueLockedToken0.times(params.token0.usdPrice);
  const updatedTrackedPoolTotalValueLockedToken0USD = PriceConverter.convertTokenAmountToTrackedUsd({
    amount: updatedPoolTotalValueLockedToken0,
    token: params.token0,
    comparisonToken: params.token1,
    poolEntity: params.poolEntity,
    fallbackUsdValue: ZERO_BIG_DECIMAL,
  });

  const updatedPoolTotalValueLockedToken1USD = updatedPoolTotalValueLockedToken1.times(params.token1.usdPrice);
  const updatedTrackedPoolTotalValueLockedToken1USD = PriceConverter.convertTokenAmountToTrackedUsd({
    amount: updatedPoolTotalValueLockedToken1,
    token: params.token1,
    poolEntity: params.poolEntity,
    comparisonToken: params.token0,
    fallbackUsdValue: ZERO_BIG_DECIMAL,
  });

  const updatedPoolTotalValueLockedUSD = updatedPoolTotalValueLockedToken0USD.plus(
    updatedPoolTotalValueLockedToken1USD,
  );

  const updatedTrackedPoolTotalValueLockedUSD = updatedTrackedPoolTotalValueLockedToken0USD.plus(
    updatedTrackedPoolTotalValueLockedToken1USD,
  );

  const updatedToken0TotalPooledAmount = params.token0.tokenTotalValuePooled;
  const updatedToken0TotalPooledAmountUSD = updatedToken0TotalPooledAmount.times(params.token0.usdPrice);
  const updatedTrackedToken0TotalPooledAmountUSD = params.token0.trackedTotalValuePooledUsd
    .minus(params.poolEntity.trackedTotalValueLockedToken0Usd)
    .plus(updatedTrackedPoolTotalValueLockedToken0USD);

  const updatedToken1TotalPooledAmount = params.token1.tokenTotalValuePooled;
  const updatedToken1TotalPooledAmountUSD = updatedToken1TotalPooledAmount.times(params.token1.usdPrice);
  const updatedTrackedToken1TotalPooledAmountUSD = params.token1.trackedTotalValuePooledUsd
    .minus(params.poolEntity.trackedTotalValueLockedToken1Usd)
    .plus(updatedTrackedPoolTotalValueLockedToken1USD);

  const isNewTrackedTvlCloseToRealTVL = isPercentageDifferenceWithinThreshold(
    updatedTrackedPoolTotalValueLockedUSD,
    updatedPoolTotalValueLockedUSD,
    50,
  );

  return {
    newPoolTotalValueLockedToken0USD: updatedPoolTotalValueLockedToken0USD,
    newPoolTotalValueLockedToken1USD: updatedPoolTotalValueLockedToken1USD,
    newPoolTotalValueLockedUSD: updatedPoolTotalValueLockedUSD,
    newToken0TotalPooledAmountUSD: updatedToken0TotalPooledAmountUSD,
    newToken1TotalPooledAmountUSD: updatedToken1TotalPooledAmountUSD,
    ...(isNewTrackedTvlCloseToRealTVL
      ? {
          newTrackedPoolTotalValueLockedToken0USD: updatedTrackedPoolTotalValueLockedToken0USD,
          newTrackedPoolTotalValueLockedToken1USD: updatedTrackedPoolTotalValueLockedToken1USD,
          newTrackedPoolTotalValueLockedUSD: updatedTrackedPoolTotalValueLockedUSD,
          newTrackedToken0TotalPooledAmountUSD: updatedTrackedToken0TotalPooledAmountUSD,
          newTrackedToken1TotalPooledAmountUSD: updatedTrackedToken1TotalPooledAmountUSD,
        }
      : {
          newTrackedPoolTotalValueLockedToken0USD: ZERO_BIG_DECIMAL,
          newTrackedPoolTotalValueLockedToken1USD: ZERO_BIG_DECIMAL,
          newTrackedPoolTotalValueLockedUSD: ZERO_BIG_DECIMAL,
          newTrackedToken0TotalPooledAmountUSD: params.token0.trackedTotalValuePooledUsd.minus(
            params.poolEntity.trackedTotalValueLockedToken0Usd,
          ),
          newTrackedToken1TotalPooledAmountUSD: params.token1.trackedTotalValuePooledUsd.minus(
            params.poolEntity.trackedTotalValueLockedToken1Usd,
          ),
        }),
  };
}
