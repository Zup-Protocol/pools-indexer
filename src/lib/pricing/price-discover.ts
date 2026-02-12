import { BigDecimal, type Pool as PoolEntity, type SingleChainToken as SingleChainTokenEntity } from "generated";
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
  isPoolTokenWhitelisted,
  isStableOnlyPool,
  isVariableWithStablePool,
  isWrappedNativePool,
} from "../../core/pool";
import type { PoolPrices } from "../../core/types";
import { isPercentageDifferenceWithinThreshold } from "../math/percentage-math";
import { calculateSwapTokenPrices } from "../math/swap-math";
import { TokenDecimalMath } from "../math/token/token-decimal-math";

export const PriceDiscover = {
  discoverTokenUsdPrices,
  discoverUsdPricesFromPoolPrices,
};

export function discoverTokenUsdPrices(params: {
  poolToken0Entity: SingleChainTokenEntity;
  poolToken1Entity: SingleChainTokenEntity;
  newPoolPrices: PoolPrices;
  rawSwapAmount0: bigint;
  rawSwapAmount1: bigint;
  network: IndexerNetwork;
  pool: PoolEntity;
}): {
  token0UsdPrice: BigDecimal;
  token1UsdPrice: BigDecimal;
  trackedToken0UsdPrice: BigDecimal;
  trackedToken1UsdPrice: BigDecimal;
} {
  const amount0 = TokenDecimalMath.rawToDecimal(params.rawSwapAmount0, params.poolToken0Entity);
  const amount1 = TokenDecimalMath.rawToDecimal(params.rawSwapAmount1, params.poolToken1Entity);

  const [usdPrice0FromPoolPrices, usdPrice1FromPoolPrices] = discoverUsdPricesFromPoolPrices({
    network: params.network,
    poolPrices: params.newPoolPrices,
    poolToken0Entity: params.poolToken0Entity,
    poolToken1Entity: params.poolToken1Entity,
  });

  const [trackedUsdPrice0, trackedUsdPrice1] = discoverTrackedTokenUsdPrices({
    network: params.network,
    newPoolPrices: params.newPoolPrices,
    pool: params.pool,
    poolToken0Entity: params.poolToken0Entity,
    poolToken1Entity: params.poolToken1Entity,
    swapAmount0: amount0,
    swapAmount1: amount1,
  });

  return {
    token0UsdPrice: usdPrice0FromPoolPrices,
    token1UsdPrice: usdPrice1FromPoolPrices,
    trackedToken0UsdPrice: trackedUsdPrice0,
    trackedToken1UsdPrice: trackedUsdPrice1,
  };
}

function discoverTrackedTokenUsdPrices(params: {
  poolToken0Entity: SingleChainTokenEntity;
  poolToken1Entity: SingleChainTokenEntity;
  newPoolPrices: PoolPrices;
  swapAmount0: BigDecimal;
  swapAmount1: BigDecimal;
  network: IndexerNetwork;
  pool: PoolEntity;
}): [trackedUsdPrice0: BigDecimal, trackedUsdPrice1: BigDecimal] {
  const [trackedPoolUsdPrice0, trackedPoolUsdPrice1] = discoverUsdPricesFromPoolPrices({
    network: params.network,
    poolPrices: params.newPoolPrices,
    poolToken0Entity: params.poolToken0Entity,
    poolToken1Entity: params.poolToken1Entity,
    useTrackedPrices: true,
  });

  const [untrackedPoolUsdPrice0, untrackedPoolUsdPrice1] = discoverUsdPricesFromPoolPrices({
    network: params.network,
    poolPrices: params.newPoolPrices,
    poolToken0Entity: params.poolToken0Entity,
    poolToken1Entity: params.poolToken1Entity,
    useTrackedPrices: false,
  });

  const usdPrice0FromPoolPrices = trackedPoolUsdPrice0.eq(ZERO_BIG_DECIMAL)
    ? untrackedPoolUsdPrice0
    : trackedPoolUsdPrice0;

  const usdPrice1FromPoolPrices = trackedPoolUsdPrice1.eq(ZERO_BIG_DECIMAL)
    ? untrackedPoolUsdPrice1
    : trackedPoolUsdPrice1;

  const currentToken0Price: BigDecimal = (params.poolToken0Entity.trackedUsdPrice as BigDecimal).eq(ZERO_BIG_DECIMAL)
    ? usdPrice0FromPoolPrices
    : params.poolToken0Entity.trackedUsdPrice;

  const currentToken1Price: BigDecimal = (params.poolToken1Entity.trackedUsdPrice as BigDecimal).eq(ZERO_BIG_DECIMAL)
    ? usdPrice1FromPoolPrices
    : params.poolToken1Entity.trackedUsdPrice;

  const [swapPrice0, swapPrice1] = calculateSwapTokenPrices({
    network: params.network,
    swapAmount0: params.swapAmount0,
    swapAmount1: params.swapAmount1,
    currentToken0Price: currentToken0Price,
    currentToken1Price: currentToken1Price,
  });

  const isPoolUsdPrice0CloseToSwapPrice = isPercentageDifferenceWithinThreshold(
    usdPrice0FromPoolPrices,
    swapPrice0,
    OUTLIER_TOKEN_PRICE_PERCENT_THRESHOLD,
  );

  const isPoolUsdPrice1CloseToSwapPrice = isPercentageDifferenceWithinThreshold(
    usdPrice1FromPoolPrices,
    swapPrice1,
    OUTLIER_TOKEN_PRICE_PERCENT_THRESHOLD,
  );

  const safeTrackedPrices = _resolveTrackedPricesForNewPrices({
    pool: params.pool,
    token0: params.poolToken0Entity,
    token1: params.poolToken1Entity,
    poolPrices: params.newPoolPrices,
    suggestedPrice0: isPoolUsdPrice0CloseToSwapPrice ? usdPrice0FromPoolPrices : currentToken0Price,
    suggestedPrice1: isPoolUsdPrice1CloseToSwapPrice ? usdPrice1FromPoolPrices : currentToken1Price,
  });

  return [safeTrackedPrices.trackedToken0Price, safeTrackedPrices.trackedToken1Price];
}

export function discoverUsdPricesFromPoolPrices(params: {
  poolToken0Entity: SingleChainTokenEntity;
  poolToken1Entity: SingleChainTokenEntity;
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

  let p0: BigDecimal = params.useTrackedPrices
    ? params.poolToken0Entity.trackedUsdPrice
    : params.poolToken0Entity.usdPrice;

  let p1: BigDecimal = params.useTrackedPrices
    ? params.poolToken1Entity.trackedUsdPrice
    : params.poolToken1Entity.usdPrice;

  const isToken0Priced = params.useTrackedPrices
    ? !params.poolToken0Entity.trackedUsdPrice.eq(ZERO_BIG_DECIMAL)
    : !params.poolToken0Entity.usdPrice.eq(ZERO_BIG_DECIMAL);

  const isToken1Priced = params.useTrackedPrices
    ? !params.poolToken1Entity.trackedUsdPrice.eq(ZERO_BIG_DECIMAL)
    : !params.poolToken1Entity.usdPrice.eq(ZERO_BIG_DECIMAL);

  if (isToken1Priced) {
    const token1Price = params.useTrackedPrices
      ? params.poolToken1Entity.trackedUsdPrice
      : params.poolToken1Entity.usdPrice;

    p0 = params.poolPrices.tokens1PerToken0.times(token1Price);
  }

  if (isToken0Priced) {
    const token0Price = params.useTrackedPrices
      ? params.poolToken0Entity.trackedUsdPrice
      : params.poolToken0Entity.usdPrice;

    p1 = params.poolPrices.tokens0PerToken1.times(token0Price);
  }

  return [p0, p1];
}

function _resolveTrackedPricesForNewPrices(params: {
  pool: PoolEntity;
  token0: SingleChainTokenEntity;
  token1: SingleChainTokenEntity;
  suggestedPrice0: BigDecimal;
  suggestedPrice1: BigDecimal;
  poolPrices: PoolPrices;
}): {
  trackedToken0Price: BigDecimal;
  trackedToken1Price: BigDecimal;
} {
  const canPoolDiscoverToken0Price = _canPoolDiscoverTokenPrice({
    poolEntity: params.pool,
    tokenEntity: params.token0,
  });
  const canPoolDiscoverToken1Price = _canPoolDiscoverTokenPrice({
    poolEntity: params.pool,
    tokenEntity: params.token1,
  });

  if (!canPoolDiscoverToken0Price && !canPoolDiscoverToken1Price) {
    return {
      trackedToken0Price: params.token0.trackedUsdPrice,
      trackedToken1Price: params.token1.trackedUsdPrice,
    };
  }

  if (params.suggestedPrice0.isZero() && params.suggestedPrice1.isZero()) {
    return {
      trackedToken0Price: ZERO_BIG_DECIMAL,
      trackedToken1Price: ZERO_BIG_DECIMAL,
    };
  }

  const suggestedPoolTvl0Usd = params.pool.totalValueLockedToken0.times(params.suggestedPrice0);
  const suggestedPoolTvl1Usd = params.pool.totalValueLockedToken1.times(params.suggestedPrice1);

  const isToken0Whitelisted = isPoolTokenWhitelisted(params.token0, params.pool.chainId);
  const isToken1Whitelisted = isPoolTokenWhitelisted(params.token1, params.pool.chainId);

  const isToken0Trustable =
    params.token0.priceDiscoveryTokenAmount.gt(params.pool.totalValueLockedToken0) || isToken1Whitelisted;

  const isToken1Trustable =
    params.token1.priceDiscoveryTokenAmount.gt(params.pool.totalValueLockedToken1) || isToken0Whitelisted;

  const isPoolBalanced = isPercentageDifferenceWithinThreshold(
    suggestedPoolTvl0Usd,
    suggestedPoolTvl1Usd,
    MAX_TVL_IMBALANCE_PERCENTAGE,
  );

  if (isPoolBalanced && (isToken0Trustable || isToken1Trustable)) {
    return {
      trackedToken0Price: canPoolDiscoverToken0Price ? params.suggestedPrice0 : params.token0.trackedUsdPrice,
      trackedToken1Price: canPoolDiscoverToken1Price ? params.suggestedPrice1 : params.token1.trackedUsdPrice,
    };
  }

  return {
    trackedToken0Price: params.token0.trackedUsdPrice,
    trackedToken1Price: params.token1.trackedUsdPrice,
  };
}

function _canPoolDiscoverTokenPrice(params: { poolEntity: PoolEntity; tokenEntity: SingleChainTokenEntity }): boolean {
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
