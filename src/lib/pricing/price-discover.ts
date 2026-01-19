import { BigDecimal, type Pool as PoolEntity, type Token as TokenEntity } from "generated";
import {
  MAX_TVL_IMBALANCE_PERCENTAGE,
  OUTLIER_TOKEN_PRICE_PERCENT_THRESHOLD,
  ZERO_BIG_DECIMAL,
} from "../../core/constants";
import { IndexerNetwork } from "../../core/network";
import {
  findNativeToken,
  findStableToken,
  findWrappedNative,
  isNativePool,
  isPoolTokenTrusted,
  isStableOnlyPool,
  isVariableWithStablePool,
  isWrappedNativePool,
} from "../../core/pool";
import type { PoolPrices } from "../../core/types";
import { isPercentageDifferenceWithinThreshold } from "../math/percentage-math";
import { calculateSwapTokenPrices } from "../math/swap-math";
import { TokenDecimalMath } from "../math/token/token-decimal-math";

export const PriceDiscover = {
  discoverTokenUsdMarketPrices,
  discoverUsdPricesFromPoolPrices,
};

export function discoverTokenUsdMarketPrices(params: {
  poolToken0Entity: TokenEntity;
  poolToken1Entity: TokenEntity;
  newPoolPrices: PoolPrices;
  rawSwapAmount0: bigint;
  rawSwapAmount1: bigint;
  network: IndexerNetwork;
  pool: PoolEntity;
}): {
  token0MarketUsdPrice: BigDecimal;
  token1MarketUsdPrice: BigDecimal;
  trackedToken0MarketUsdPrice: BigDecimal;
  trackedToken1MarketUsdPrice: BigDecimal;
} {
  const canPoolSetToken0Price = _canPoolDiscoverTokenPrice({
    poolEntity: params.pool,
    tokenEntity: params.poolToken0Entity,
  });

  const canPoolSetToken1Price = _canPoolDiscoverTokenPrice({
    poolEntity: params.pool,
    tokenEntity: params.poolToken1Entity,
  });

  if (!canPoolSetToken0Price && !canPoolSetToken1Price) {
    return {
      token0MarketUsdPrice: params.poolToken0Entity.usdPrice,
      token1MarketUsdPrice: params.poolToken1Entity.usdPrice,
      trackedToken0MarketUsdPrice: params.poolToken0Entity.trackedUsdPrice,
      trackedToken1MarketUsdPrice: params.poolToken1Entity.trackedUsdPrice,
    };
  }

  const amount0 = TokenDecimalMath.rawToDecimal(params.rawSwapAmount0, params.poolToken0Entity);
  const amount1 = TokenDecimalMath.rawToDecimal(params.rawSwapAmount1, params.poolToken1Entity);

  const [suggestedPrice0, suggestedPrice1] = discoverUsdPricesFromPoolPrices({
    network: params.network,
    poolPrices: params.newPoolPrices,
    poolToken0Entity: params.poolToken0Entity,
    poolToken1Entity: params.poolToken1Entity,
  });

  const { price0: token0MarketUsdPrice, price1: token1MarketUsdPrice } = calculateValidatedMarketPrices({
    network: params.network,
    swapAmount0: amount0,
    swapAmount1: amount1,
    token0: params.poolToken0Entity,
    token1: params.poolToken1Entity,
    suggestedPrice0,
    suggestedPrice1,
    currentPrice0: params.poolToken0Entity.usdPrice,
    currentPrice1: params.poolToken1Entity.usdPrice,
  });

  const trackedPrices = discoverTrackedTokenUsdPrices({
    network: params.network,
    newPoolPrices: params.newPoolPrices,
    poolToken0Entity: params.poolToken0Entity,
    poolToken1Entity: params.poolToken1Entity,
    pool: params.pool,
    swapAmount0: amount0,
    swapAmount1: amount1,
  });

  return {
    token0MarketUsdPrice: canPoolSetToken0Price ? token0MarketUsdPrice : params.poolToken0Entity.usdPrice,
    token1MarketUsdPrice: canPoolSetToken1Price ? token1MarketUsdPrice : params.poolToken1Entity.usdPrice,

    trackedToken0MarketUsdPrice: canPoolSetToken0Price
      ? trackedPrices.trackedToken0MarketUsdPrice
      : params.poolToken0Entity.trackedUsdPrice,
    trackedToken1MarketUsdPrice: canPoolSetToken1Price
      ? trackedPrices.trackedToken1MarketUsdPrice
      : params.poolToken1Entity.trackedUsdPrice,
  };
}

function discoverTrackedTokenUsdPrices(params: {
  poolToken0Entity: TokenEntity;
  poolToken1Entity: TokenEntity;
  newPoolPrices: PoolPrices;
  swapAmount0: BigDecimal;
  swapAmount1: BigDecimal;
  network: IndexerNetwork;
  pool: PoolEntity;
}): {
  trackedToken0MarketUsdPrice: BigDecimal;
  trackedToken1MarketUsdPrice: BigDecimal;
} {
  const [suggestedPrice0, suggestedPrice1] = discoverUsdPricesFromPoolPrices({
    network: params.network,
    poolPrices: params.newPoolPrices,
    poolToken0Entity: params.poolToken0Entity,
    poolToken1Entity: params.poolToken1Entity,
    useTrackedPrices: true,
  });

  const { price0, price1 } = calculateValidatedMarketPrices({
    network: params.network,
    swapAmount0: params.swapAmount0,
    swapAmount1: params.swapAmount1,
    token0: params.poolToken0Entity,
    token1: params.poolToken1Entity,
    suggestedPrice0,
    suggestedPrice1,
    currentPrice0: params.poolToken0Entity.trackedUsdPrice,
    currentPrice1: params.poolToken1Entity.trackedUsdPrice,
  });

  const safeTrackedPrices = _resolveTrackedPricesForNewPrices({
    pool: params.pool,
    token0: params.poolToken0Entity,
    token1: params.poolToken1Entity,
    poolPrices: params.newPoolPrices,
    suggestedPrice0: price0,
    suggestedPrice1: price1,
  });

  return {
    trackedToken0MarketUsdPrice: safeTrackedPrices.trackedToken0Price,
    trackedToken1MarketUsdPrice: safeTrackedPrices.trackedToken1Price,
  };
}

function calculateValidatedMarketPrices(params: {
  network: IndexerNetwork;
  swapAmount0: BigDecimal;
  swapAmount1: BigDecimal;
  token0: TokenEntity;
  token1: TokenEntity;
  suggestedPrice0: BigDecimal;
  suggestedPrice1: BigDecimal;
  currentPrice0: BigDecimal;
  currentPrice1: BigDecimal;
}): { price0: BigDecimal; price1: BigDecimal } {
  const { network, swapAmount0, swapAmount1, suggestedPrice0, suggestedPrice1, currentPrice0, currentPrice1 } = params;

  const anchorPrice0 = currentPrice0.eq(ZERO_BIG_DECIMAL) ? suggestedPrice0 : currentPrice0;
  const anchorPrice1 = currentPrice1.eq(ZERO_BIG_DECIMAL) ? suggestedPrice1 : currentPrice1;

  const [swapPrice0, swapPrice1] = calculateSwapTokenPrices({
    network,
    swapAmount0,
    swapAmount1,
    currentToken0Price: anchorPrice0,
    currentToken1Price: anchorPrice1,
  });

  const isSuggestedPrice0CloseToSwapPrice = isPercentageDifferenceWithinThreshold(
    suggestedPrice0,
    swapPrice0,
    OUTLIER_TOKEN_PRICE_PERCENT_THRESHOLD,
  );

  const isSuggestedPrice1CloseToSwapPrice = isPercentageDifferenceWithinThreshold(
    suggestedPrice1,
    swapPrice1,
    OUTLIER_TOKEN_PRICE_PERCENT_THRESHOLD,
  );

  return {
    price0: isSuggestedPrice0CloseToSwapPrice ? suggestedPrice0.decimalPlaces(params.token0.decimals) : currentPrice0,
    price1: isSuggestedPrice1CloseToSwapPrice ? suggestedPrice1.decimalPlaces(params.token1.decimals) : currentPrice1,
  };
}

export function discoverUsdPricesFromPoolPrices(params: {
  poolToken0Entity: TokenEntity;
  poolToken1Entity: TokenEntity;
  poolPrices: PoolPrices;
  network: IndexerNetwork;
  useTrackedPrices?: boolean;
}): [token0Price: BigDecimal, token1Price: BigDecimal] {
  if (isVariableWithStablePool(params.poolToken0Entity, params.poolToken1Entity, params.network)) {
    const stableToken = findStableToken(params.poolToken0Entity, params.poolToken1Entity, params.network);

    if (stableToken.id == params.poolToken0Entity.id) {
      const price1 = params.poolPrices.tokens0PerToken1;
      const price0 = params.poolPrices.tokens1PerToken0.times(price1);
      return [price0, price1];
    } else {
      const price0 = params.poolPrices.tokens1PerToken0;
      const price1 = params.poolPrices.tokens0PerToken1.times(price0);
      return [price0, price1];
    }
  }

  if (isNativePool(params.poolToken0Entity, params.poolToken1Entity)) {
    const nativeToken = findNativeToken(params.poolToken0Entity, params.poolToken1Entity);

    if (nativeToken.id == params.poolToken0Entity.id) {
      const token0Price = params.useTrackedPrices
        ? params.poolToken0Entity.trackedUsdPrice
        : params.poolToken0Entity.usdPrice;

      return [token0Price, params.poolPrices.tokens0PerToken1.times(token0Price)];
    } else {
      const token1Price = params.useTrackedPrices
        ? params.poolToken1Entity.trackedUsdPrice
        : params.poolToken1Entity.usdPrice;

      return [params.poolPrices.tokens1PerToken0.times(token1Price), token1Price];
    }
  }

  if (isWrappedNativePool(params.poolToken0Entity, params.poolToken1Entity, params.network)) {
    const wrappedNativeToken = findWrappedNative(params.poolToken0Entity, params.poolToken1Entity, params.network);

    if (wrappedNativeToken.id == params.poolToken0Entity.id) {
      const token0Price = params.useTrackedPrices
        ? params.poolToken0Entity.trackedUsdPrice
        : params.poolToken0Entity.usdPrice;

      return [token0Price, params.poolPrices.tokens0PerToken1.times(token0Price)];
    } else {
      const token1Price = params.useTrackedPrices
        ? params.poolToken1Entity.trackedUsdPrice
        : params.poolToken1Entity.usdPrice;

      return [params.poolPrices.tokens1PerToken0.times(token1Price), token1Price];
    }
  }

  if (isStableOnlyPool(params.poolToken0Entity, params.poolToken1Entity, params.network)) {
    return [params.poolPrices.tokens1PerToken0, params.poolPrices.tokens0PerToken1];
  }

  let p0 = params.useTrackedPrices ? params.poolToken0Entity.trackedUsdPrice : params.poolToken0Entity.usdPrice;
  let p1 = params.useTrackedPrices ? params.poolToken1Entity.trackedUsdPrice : params.poolToken1Entity.usdPrice;

  const isToken0Priced = params.useTrackedPrices
    ? !params.poolToken0Entity.trackedUsdPrice.eq(ZERO_BIG_DECIMAL)
    : !params.poolToken0Entity.usdPrice.eq(ZERO_BIG_DECIMAL);

  const isToken1Priced = params.useTrackedPrices
    ? !params.poolToken1Entity.trackedUsdPrice.eq(ZERO_BIG_DECIMAL)
    : !params.poolToken1Entity.usdPrice.eq(ZERO_BIG_DECIMAL);

  if (!isToken0Priced) {
    const token1Price = params.useTrackedPrices
      ? params.poolToken1Entity.trackedUsdPrice
      : params.poolToken1Entity.usdPrice;

    p0 = params.poolPrices.tokens1PerToken0.times(token1Price);
  }

  if (!isToken1Priced) {
    const token0Price = params.useTrackedPrices
      ? params.poolToken0Entity.trackedUsdPrice
      : params.poolToken0Entity.usdPrice;

    p1 = params.poolPrices.tokens0PerToken1.times(token0Price);
  }

  return [p0, p1];
}

function _resolveTrackedPricesForNewPrices(params: {
  pool: PoolEntity;
  token0: TokenEntity;
  token1: TokenEntity;
  suggestedPrice0: BigDecimal;
  suggestedPrice1: BigDecimal;
  poolPrices: PoolPrices;
}): {
  trackedToken0Price: BigDecimal;
  trackedToken1Price: BigDecimal;
} {
  const { pool, token0, token1, suggestedPrice0, suggestedPrice1 } = params;

  if (suggestedPrice0.isZero() && suggestedPrice1.isZero()) {
    return {
      trackedToken0Price: ZERO_BIG_DECIMAL,
      trackedToken1Price: ZERO_BIG_DECIMAL,
    };
  }

  const tvl0Usd = pool.totalValueLockedToken0.times(suggestedPrice0);
  const tvl1Usd = pool.totalValueLockedToken1.times(suggestedPrice1);

  const isToken0Trusted = isPoolTokenTrusted(token0, pool.chainId);
  const isToken1Trusted = isPoolTokenTrusted(token1, pool.chainId);

  const isToken0Trustable = token0.trackedPriceDiscoveryCapitalUsd.gt(tvl0Usd) || isToken1Trusted;
  const isToken1Trustable = token1.trackedPriceDiscoveryCapitalUsd.gt(tvl1Usd) || isToken0Trusted;

  const isPoolBalanced = isPercentageDifferenceWithinThreshold(tvl0Usd, tvl1Usd, MAX_TVL_IMBALANCE_PERCENTAGE);

  if (isPoolBalanced && (isToken0Trustable || isToken1Trustable)) {
    return { trackedToken0Price: suggestedPrice0, trackedToken1Price: suggestedPrice1 };
  }

  if (!isToken0Trustable && !isToken1Trustable) {
    return {
      trackedToken0Price: token0.trackedUsdPrice,
      trackedToken1Price: token1.trackedUsdPrice,
    };
  }

  const isToken0Dominant = tvl0Usd.gt(tvl1Usd);
  const isToken0Corrupted = isToken0Dominant && !isToken0Trusted;
  const isToken1Corrupted = !isToken0Dominant && !isToken1Trusted;

  if (isToken0Corrupted || isToken1Corrupted) {
    /** * ENGINEERING DECISION: State Reset.
     * If a token is detected as corrupted, we force it to ZERO to allow
     * the price discovery to re-derive from the Trusted Asset.
     */
    return {
      trackedToken0Price: isToken0Corrupted ? ZERO_BIG_DECIMAL : suggestedPrice0,
      trackedToken1Price: isToken1Corrupted ? ZERO_BIG_DECIMAL : suggestedPrice1,
    };
  }

  return {
    trackedToken0Price: suggestedPrice0,
    trackedToken1Price: suggestedPrice1,
  };
}

function _canPoolDiscoverTokenPrice(params: { poolEntity: PoolEntity; tokenEntity: TokenEntity }): boolean {
  if (params.tokenEntity.poolsCount === 1n) return true;

  const averageLiquidityPerPool = params.tokenEntity.tokenTotalValuePooled.div(
    BigDecimal(params.tokenEntity.poolsCount.toString()),
  );
  const amountInPool =
    params.poolEntity.token0_id === params.tokenEntity.id
      ? params.poolEntity.totalValueLockedToken0
      : params.poolEntity.totalValueLockedToken1;

  return amountInPool.gte(averageLiquidityPerPool);
}
