import {
  BigDecimal,
  handlerContext,
  PoolDailyData,
  Pool as PoolEntity,
  PoolHourlyData,
  Token as TokenEntity,
} from "generated";
import {
  defaultPoolDailyData,
  defaultPoolHourlyData,
  OUTLIER_POOL_TVL_PERCENT_THRESHOLD,
  OUTLIER_TOKEN_PRICE_PERCENT_THRESHOLD,
  ZERO_ADDRESS,
  ZERO_BIG_DECIMAL,
} from "./constants";
import { isSecondsTimestampMoreThanDaysAgo } from "./date-commons";
import { IndexerNetwork } from "./enums/indexer-network";
import { isPercentageDifferenceWithinThreshold } from "./math";
import {
  calculateDayYearlyYield,
  calculateHourYearlyYield,
  findNativeToken,
  findStableToken,
  findWrappedNative,
  getLiquidityInflowAndOutflowFromRawAmounts,
  getPoolDailyDataAgo,
  getPoolDailyDataId,
  getPoolHourlyDataAgo,
  getPoolHourlyDataId,
  getSwapFeesFromRawAmounts,
  getSwapVolumeFromAmounts,
  isNativePool,
  isStablePool,
  isVariableWithStablePool,
  isWrappedNativePool,
} from "./pool-commons";
import { formatFromTokenAmount, pickMostLiquidPoolForToken } from "./token-commons";
import { PoolPrices } from "./types";

export class PoolSetters {
  constructor(readonly context: handlerContext, readonly network: IndexerNetwork) {}

  async setIntervalDataTVL(eventTimestamp: bigint, poolEntity: PoolEntity): Promise<void> {
    let [poolDailyDataEntity, poolHourlyDataEntity]: [PoolDailyData, PoolHourlyData] = await Promise.all([
      this.context.PoolDailyData.getOrCreate(
        defaultPoolDailyData({
          dayDataId: getPoolDailyDataId(eventTimestamp, poolEntity),
          dayStartTimestamp: eventTimestamp,
          poolId: poolEntity.id,
        })
      ),

      this.context.PoolHourlyData.getOrCreate(
        defaultPoolHourlyData({
          hourlyDataId: getPoolHourlyDataId(eventTimestamp, poolEntity),
          hourStartTimestamp: eventTimestamp,
          poolId: poolEntity.id,
        })
      ),
    ]);

    poolDailyDataEntity = {
      ...poolDailyDataEntity,
      totalValueLockedToken0: poolEntity.totalValueLockedToken0,
      totalValueLockedToken1: poolEntity.totalValueLockedToken1,
      totalValueLockedUSD: poolEntity.totalValueLockedUSD,
    };

    poolHourlyDataEntity = {
      ...poolHourlyDataEntity,
      totalValueLockedToken0: poolEntity.totalValueLockedToken0,
      totalValueLockedToken1: poolEntity.totalValueLockedToken1,
      totalValueLockedUSD: poolEntity.totalValueLockedUSD,
    };

    this.context.PoolHourlyData.set(poolHourlyDataEntity);
    this.context.PoolDailyData.set(poolDailyDataEntity);
  }

  async updateTokenPricesFromPoolPrices(
    poolToken0Entity: TokenEntity,
    poolToken1Entity: TokenEntity,
    pool: PoolEntity,
    poolPrices: PoolPrices
  ): Promise<[token0: TokenEntity, token1: TokenEntity]> {
    const tokenPrices = this._deriveTokenPricesFromPoolPrices(poolToken0Entity, poolToken1Entity, poolPrices);

    const isNewPoolTvlUsdBalancedWithinThreshold = isPercentageDifferenceWithinThreshold(
      pool.totalValueLockedToken0.times(tokenPrices.token0UpdatedPrice),
      pool.totalValueLockedToken1.times(tokenPrices.token1UpdatedPrice),
      OUTLIER_POOL_TVL_PERCENT_THRESHOLD
    );

    return await Promise.all([
      await this._maybeUpdateTokenPrice(
        poolToken0Entity,
        tokenPrices.token0UpdatedPrice,
        pool,
        isNewPoolTvlUsdBalancedWithinThreshold
      ),

      await this._maybeUpdateTokenPrice(
        poolToken1Entity,
        tokenPrices.token1UpdatedPrice,
        pool,
        isNewPoolTvlUsdBalancedWithinThreshold
      ),
    ]);
  }

  async setLiquidityIntervalData(params: {
    eventTimestamp: bigint;
    amount0AddedOrRemoved: bigint;
    amount1AddedOrRemoved: bigint;
    poolEntity: PoolEntity;
    token0: TokenEntity;
    token1: TokenEntity;
  }): Promise<void> {
    let [poolDailyData, poolHourlyData]: [PoolDailyData, PoolHourlyData] = await Promise.all([
      this.context.PoolDailyData.getOrCreate(
        defaultPoolDailyData({
          dayDataId: getPoolDailyDataId(params.eventTimestamp, params.poolEntity),
          dayStartTimestamp: params.eventTimestamp,
          poolId: params.poolEntity.id,
        })
      ),

      this.context.PoolHourlyData.getOrCreate(
        defaultPoolHourlyData({
          hourlyDataId: getPoolHourlyDataId(params.eventTimestamp, params.poolEntity),
          hourStartTimestamp: params.eventTimestamp,
          poolId: params.poolEntity.id,
        })
      ),
    ]);

    const amountInflowsAndOuflows = getLiquidityInflowAndOutflowFromRawAmounts(
      params.amount0AddedOrRemoved,
      params.amount1AddedOrRemoved,
      params.token0,
      params.token1
    );

    const amount0Volume = formatFromTokenAmount(params.amount0AddedOrRemoved, params.token0).abs();
    const amount1Volume = formatFromTokenAmount(params.amount1AddedOrRemoved, params.token1).abs();
    const liquidityVolumeUSD = amount0Volume
      .times(params.token0.usdPrice)
      .plus(amount1Volume.times(params.token1.usdPrice));

    poolDailyData = {
      ...poolDailyData,
      liquidityVolumeToken0: poolDailyData.liquidityVolumeToken0.plus(amount0Volume),
      liquidityVolumeToken1: poolDailyData.liquidityVolumeToken1.plus(amount1Volume),
      liquidityVolumeUSD: poolDailyData.liquidityVolumeUSD.plus(liquidityVolumeUSD),
      liquidityNetInflowToken0: poolDailyData.liquidityNetInflowToken0.plus(amountInflowsAndOuflows.netInflowToken0),
      liquidityNetInflowToken1: poolDailyData.liquidityNetInflowToken1.plus(amountInflowsAndOuflows.netInflowToken1),
      liquidityNetInflowUSD: poolDailyData.liquidityNetInflowUSD.plus(amountInflowsAndOuflows.netInflowUSD),
      liquidityInflowToken0: poolDailyData.liquidityInflowToken0.plus(amountInflowsAndOuflows.inflowToken0),
      liquidityInflowToken1: poolDailyData.liquidityInflowToken1.plus(amountInflowsAndOuflows.inflowToken1),
      liquidityOutflowToken0: poolDailyData.liquidityOutflowToken0.plus(amountInflowsAndOuflows.outflowToken0),
      liquidityOutflowToken1: poolDailyData.liquidityOutflowToken1.plus(amountInflowsAndOuflows.outflowToken1),
      liquidityInflowUSD: poolDailyData.liquidityInflowUSD.plus(amountInflowsAndOuflows.inflowUSD),
      liquidityOutflowUSD: poolDailyData.liquidityOutflowUSD.plus(amountInflowsAndOuflows.outflowUSD),
    };

    poolHourlyData = {
      ...poolHourlyData,
      liquidityVolumeToken0: poolHourlyData.liquidityVolumeToken0.plus(amount0Volume),
      liquidityVolumeToken1: poolHourlyData.liquidityVolumeToken1.plus(amount1Volume),
      liquidityVolumeUSD: poolHourlyData.liquidityVolumeUSD.plus(liquidityVolumeUSD),
      liquidityNetInflowToken0: poolHourlyData.liquidityNetInflowToken0.plus(amountInflowsAndOuflows.netInflowToken0),
      liquidityNetInflowToken1: poolHourlyData.liquidityNetInflowToken1.plus(amountInflowsAndOuflows.netInflowToken1),
      liquidityNetInflowUSD: poolHourlyData.liquidityNetInflowUSD.plus(amountInflowsAndOuflows.netInflowUSD),
      liquidityInflowToken0: poolHourlyData.liquidityInflowToken0.plus(amountInflowsAndOuflows.inflowToken0),
      liquidityInflowToken1: poolHourlyData.liquidityInflowToken1.plus(amountInflowsAndOuflows.inflowToken1),
      liquidityOutflowToken0: poolHourlyData.liquidityOutflowToken0.plus(amountInflowsAndOuflows.outflowToken0),
      liquidityOutflowToken1: poolHourlyData.liquidityOutflowToken1.plus(amountInflowsAndOuflows.outflowToken1),
      liquidityInflowUSD: poolHourlyData.liquidityInflowUSD.plus(amountInflowsAndOuflows.inflowUSD),
      liquidityOutflowUSD: poolHourlyData.liquidityOutflowUSD.plus(amountInflowsAndOuflows.outflowUSD),
    };

    this.context.PoolDailyData.set(poolDailyData);
    this.context.PoolHourlyData.set(poolHourlyData);
  }

  async setIntervalSwapData(
    eventTimestamp: bigint,
    context: handlerContext,
    pool: PoolEntity,
    token0: TokenEntity,
    token1: TokenEntity,
    amount0: bigint,
    amount1: bigint,
    swapFee: number = pool.currentFeeTier
  ): Promise<void> {
    await this.setIntervalDataTVL(eventTimestamp, pool);

    let [poolDailyDataEntity, poolHourlyDataEntity]: [PoolDailyData, PoolHourlyData] = await Promise.all([
      context.PoolDailyData.getOrThrow(getPoolDailyDataId(eventTimestamp, pool)),
      context.PoolHourlyData.getOrThrow(getPoolHourlyDataId(eventTimestamp, pool)),
    ]);

    const swapVolume = getSwapVolumeFromAmounts(
      formatFromTokenAmount(amount0, token0),
      formatFromTokenAmount(amount1, token1),
      token0,
      token1
    );

    const swapFees = getSwapFeesFromRawAmounts(amount0, amount1, swapFee, token0, token1);
    const totalDayFeesUSD = poolDailyDataEntity.feesUSD.plus(swapFees.feesUSD);
    const totalHourFeesUSD = poolHourlyDataEntity.feesUSD.plus(swapFees.feesUSD);

    const dayYearlyYield = calculateDayYearlyYield(poolDailyDataEntity.totalValueLockedUSD, totalDayFeesUSD);
    const hourYearlyYield = calculateHourYearlyYield(poolHourlyDataEntity.totalValueLockedUSD, totalHourFeesUSD);

    poolDailyDataEntity = {
      ...poolDailyDataEntity,
      swapVolumeToken0: poolDailyDataEntity.swapVolumeToken0.plus(swapVolume.volumeToken0),
      swapVolumeToken1: poolDailyDataEntity.swapVolumeToken1.plus(swapVolume.volumeToken1),
      swapVolumeUSD: poolDailyDataEntity.swapVolumeUSD.plus(swapVolume.volumeUSD),
      feesToken0: poolDailyDataEntity.feesToken0.plus(swapFees.feeToken0),
      feesToken1: poolDailyDataEntity.feesToken1.plus(swapFees.feeToken1),
      feesUSD: totalDayFeesUSD,
      yearlyYield: dayYearlyYield,
      totalAccumulatedYield: pool.totalAccumulatedYield,
    };

    poolHourlyDataEntity = {
      ...poolHourlyDataEntity,
      swapVolumeToken0: poolHourlyDataEntity.swapVolumeToken0.plus(swapVolume.volumeToken0),
      swapVolumeToken1: poolHourlyDataEntity.swapVolumeToken1.plus(swapVolume.volumeToken1),
      swapVolumeUSD: poolHourlyDataEntity.swapVolumeUSD.plus(swapVolume.volumeUSD),
      feesToken0: poolHourlyDataEntity.feesToken0.plus(swapFees.feeToken0),
      feesToken1: poolHourlyDataEntity.feesToken1.plus(swapFees.feeToken1),
      feesUSD: totalHourFeesUSD,
      yearlyYield: hourYearlyYield,
      totalAccumulatedYield: pool.totalAccumulatedYield,
    };

    context.PoolDailyData.set(poolDailyDataEntity);
    context.PoolHourlyData.set(poolHourlyDataEntity);
  }

  async updatePoolAccumulatedYield(eventTimestamp: bigint, poolEntity: PoolEntity): Promise<PoolEntity> {
    if (isSecondsTimestampMoreThanDaysAgo(eventTimestamp, 100)) return poolEntity;

    let [currentPoolDailyData, currentPoolHourlyData]: [PoolDailyData, PoolHourlyData] = await Promise.all([
      this.context.PoolDailyData.getOrThrow(getPoolDailyDataId(eventTimestamp, poolEntity)),
      this.context.PoolHourlyData.getOrThrow(getPoolHourlyDataId(eventTimestamp, poolEntity)),
    ]);

    const isEventSettingNewDay = currentPoolDailyData.dayStartTimestamp == eventTimestamp;
    const isEventSettingNewHour = currentPoolHourlyData.hourStartTimestamp == eventTimestamp;

    if (isEventSettingNewHour) {
      const data24hAgo = await getPoolHourlyDataAgo(24, eventTimestamp, this.context, poolEntity);

      if (data24hAgo) {
        poolEntity = {
          ...poolEntity,
          accumulated24hYield: poolEntity.totalAccumulatedYield.minus(data24hAgo?.totalAccumulatedYield ?? 0),
          dataPointTimestamp24h: data24hAgo?.hourStartTimestamp ?? poolEntity.dataPointTimestamp24h,
        };
      }
    }

    if (isEventSettingNewDay) {
      const [data7dAgo, data30dAgo, data90dAgo]: [
        PoolDailyData | null | undefined,
        PoolDailyData | null | undefined,
        PoolDailyData | null | undefined
      ] = await Promise.all([
        getPoolDailyDataAgo(7, eventTimestamp, this.context, poolEntity),
        getPoolDailyDataAgo(30, eventTimestamp, this.context, poolEntity),
        getPoolDailyDataAgo(90, eventTimestamp, this.context, poolEntity),
      ]);

      if (data7dAgo) {
        poolEntity = {
          ...poolEntity,
          accumulated7dYield: poolEntity.totalAccumulatedYield.minus(data7dAgo?.totalAccumulatedYield ?? 0),
          dataPointTimestamp7d: data7dAgo?.dayStartTimestamp ?? poolEntity.dataPointTimestamp7d,
        };
      }

      if (data30dAgo) {
        poolEntity = {
          ...poolEntity,
          accumulated30dYield: poolEntity.totalAccumulatedYield.minus(data30dAgo?.totalAccumulatedYield ?? 0),
          dataPointTimestamp30d: data30dAgo?.dayStartTimestamp ?? poolEntity.dataPointTimestamp30d,
        };
      }

      if (data90dAgo) {
        poolEntity = {
          ...poolEntity,
          accumulated90dYield: poolEntity.totalAccumulatedYield.minus(data90dAgo?.totalAccumulatedYield ?? 0),
          dataPointTimestamp90d: data90dAgo?.dayStartTimestamp ?? poolEntity.dataPointTimestamp90d,
        };
      }
    }

    return poolEntity;
  }

  private async _maybeUpdateTokenPrice(
    forToken: TokenEntity,
    newPrice: BigDecimal,
    fromPool: PoolEntity,
    isNewPoolTvlBalanced: boolean
  ): Promise<TokenEntity> {
    const isNewPriceWithinThreshold = isPercentageDifferenceWithinThreshold(
      forToken.usdPrice,
      newPrice,
      OUTLIER_TOKEN_PRICE_PERCENT_THRESHOLD
    );

    if (isNewPriceWithinThreshold) {
      return {
        ...forToken,
        usdPrice: newPrice,
      };
    }

    const isMostLiquidPoolUnset = forToken.mostLiquidPool_id.lowercasedEquals(ZERO_ADDRESS);
    const isPriceUpdateFromCurrentMostLiquidPool = forToken.mostLiquidPool_id.lowercasedEquals(fromPool.id);
    const isSettingPriceUp = newPrice.gt(forToken.usdPrice);

    if (!isNewPoolTvlBalanced && isSettingPriceUp) return forToken;

    if (isMostLiquidPoolUnset || isPriceUpdateFromCurrentMostLiquidPool) {
      return {
        ...forToken,
        usdPrice: newPrice,
        mostLiquidPool_id: fromPool.id,
      };
    }

    const mostLiquidPoolEntity = await this.context.Pool.getOrThrow(forToken.mostLiquidPool_id);
    const isPriceFromMoreLiquidPool = pickMostLiquidPoolForToken(
      forToken,
      fromPool,
      mostLiquidPoolEntity
    ).id.lowercasedEquals(fromPool.id);

    if (isPriceFromMoreLiquidPool && isNewPoolTvlBalanced) {
      return (forToken = {
        ...forToken,
        usdPrice: newPrice,
        mostLiquidPool_id: fromPool.id,
      });
    }

    return forToken;
  }

  private _deriveTokenPricesFromPoolPrices(
    poolToken0Entity: TokenEntity,
    poolToken1Entity: TokenEntity,
    poolPrices: PoolPrices
  ): { token0UpdatedPrice: BigDecimal; token1UpdatedPrice: BigDecimal } {
    if (isVariableWithStablePool(poolToken0Entity, poolToken1Entity, this.network)) {
      let stableToken = findStableToken(poolToken0Entity, poolToken1Entity, this.network);

      if (stableToken.id == poolToken0Entity.id) {
        const newToken1Price = poolPrices.token0PerToken1;
        const newToken0Price = poolPrices.token1PerToken0.times(newToken1Price);

        return {
          token0UpdatedPrice: newToken0Price.decimalPlaces(poolToken0Entity.decimals),
          token1UpdatedPrice: newToken1Price.decimalPlaces(poolToken1Entity.decimals),
        };
      }

      const newToken0Price = poolPrices.token1PerToken0;
      const newToken1Price = poolPrices.token0PerToken1.times(newToken0Price);

      return {
        token0UpdatedPrice: newToken0Price.decimalPlaces(poolToken0Entity.decimals),
        token1UpdatedPrice: newToken1Price.decimalPlaces(poolToken1Entity.decimals),
      };
    }

    if (isWrappedNativePool(poolToken0Entity, poolToken1Entity, this.network)) {
      if (findWrappedNative(poolToken0Entity, poolToken1Entity, this.network).id == poolToken0Entity.id) {
        const newToken1Price = poolPrices.token0PerToken1.times(poolToken0Entity.usdPrice);

        return {
          token0UpdatedPrice: poolToken0Entity.usdPrice,
          token1UpdatedPrice: newToken1Price.decimalPlaces(poolToken1Entity.decimals),
        };
      }

      const newToken0Price = poolPrices.token1PerToken0.times(poolToken1Entity.usdPrice);

      return {
        token0UpdatedPrice: newToken0Price.decimalPlaces(poolToken0Entity.decimals),
        token1UpdatedPrice: poolToken1Entity.usdPrice,
      };
    }

    if (isNativePool(poolToken0Entity, poolToken1Entity)) {
      if (findNativeToken(poolToken0Entity, poolToken1Entity).id == poolToken0Entity.id) {
        const newToken1Price = poolPrices.token0PerToken1.times(poolToken0Entity.usdPrice);

        return {
          token0UpdatedPrice: poolToken0Entity.usdPrice,
          token1UpdatedPrice: newToken1Price.decimalPlaces(poolToken1Entity.decimals),
        };
      }

      const newToken0Price = poolPrices.token1PerToken0.times(poolToken1Entity.usdPrice);

      return {
        token0UpdatedPrice: newToken0Price.decimalPlaces(poolToken0Entity.decimals),
        token1UpdatedPrice: poolToken1Entity.usdPrice,
      };
    }

    if (isStablePool(poolToken0Entity, poolToken1Entity, this.network)) {
      const newToken1Price = poolPrices.token0PerToken1;
      const newToken0Price = poolPrices.token1PerToken0;

      return {
        token0UpdatedPrice: newToken0Price.decimalPlaces(poolToken0Entity.decimals),
        token1UpdatedPrice: newToken1Price.decimalPlaces(poolToken1Entity.decimals),
      };
    }

    let token0Price = poolToken0Entity.usdPrice;
    let token1Price = poolToken1Entity.usdPrice;

    if (!poolToken1Entity.usdPrice.eq(ZERO_BIG_DECIMAL)) {
      token0Price = poolPrices.token1PerToken0.times(poolToken1Entity.usdPrice);
    }

    if (!poolToken0Entity.usdPrice.eq(ZERO_BIG_DECIMAL)) {
      token1Price = poolPrices.token0PerToken1.times(poolToken0Entity.usdPrice);
    }

    return {
      token0UpdatedPrice: token0Price.decimalPlaces(poolToken0Entity.decimals),
      token1UpdatedPrice: token1Price.decimalPlaces(poolToken1Entity.decimals),
    };
  }
}
