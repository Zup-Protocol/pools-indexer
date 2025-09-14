import { BigDecimal, HandlerContext, Pool as PoolEntity, Token as TokenEntity } from "generated";
import { ZERO_BIG_DECIMAL, ZERO_BIG_INT } from "./constants";
import { IndexerNetwork } from "./enums/indexer-network";
import {
  findNativeToken,
  findStableToken,
  findWrappedNative,
  getPoolDailyDataId,
  getPoolHourlyDataId,
  getRawFeeFromTokenAmount,
  isNativePool,
  isStablePool,
  isVariableWithStablePool,
  isWrappedNativePool,
} from "./pool-commons";
import { formatFromTokenAmount } from "./token-commons";
import { PoolPrices } from "./types";

export class PoolSetters {
  constructor(readonly context: HandlerContext, readonly network: IndexerNetwork) {}

  async setPoolDailyDataTVL(eventTimestamp: bigint, poolEntity: PoolEntity): Promise<void> {
    const poolDailyDataId = getPoolDailyDataId(eventTimestamp, poolEntity);

    let poolDailyDataEntity = await this.context.PoolDailyData.getOrCreate({
      id: poolDailyDataId,
      pool_id: poolEntity.id,
      dayStartTimestamp: eventTimestamp,
      totalValueLockedToken0: ZERO_BIG_DECIMAL,
      totalValueLockedToken1: ZERO_BIG_DECIMAL,
      totalValueLockedUSD: ZERO_BIG_DECIMAL,
      feesToken0: ZERO_BIG_DECIMAL,
      feesToken1: ZERO_BIG_DECIMAL,
      feesUSD: ZERO_BIG_DECIMAL,
    });

    poolDailyDataEntity = {
      ...poolDailyDataEntity,
      totalValueLockedToken0: poolEntity.totalValueLockedToken0,
      totalValueLockedToken1: poolEntity.totalValueLockedToken1,
      totalValueLockedUSD: poolEntity.totalValueLockedUSD,
    };

    this.context.PoolDailyData.set(poolDailyDataEntity);
  }

  getPricesForPoolWhitelistedTokens(
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

    let newToken0Price = poolToken0Entity.usdPrice;
    let newToken1Price = poolToken1Entity.usdPrice;

    if (!newToken1Price.eq(ZERO_BIG_DECIMAL)) {
      newToken0Price = poolPrices.token1PerToken0.times(newToken1Price);
    }

    if (!newToken0Price.eq(ZERO_BIG_DECIMAL)) {
      newToken1Price = poolPrices.token0PerToken1.times(newToken0Price);
    }

    return {
      token0UpdatedPrice: newToken0Price.decimalPlaces(poolToken0Entity.decimals),
      token1UpdatedPrice: newToken1Price.decimalPlaces(poolToken1Entity.decimals),
    };
  }

  async setDailyData(
    eventTimestamp: bigint,
    context: HandlerContext,
    pool: PoolEntity,
    token0: TokenEntity,
    token1: TokenEntity,
    amount0: bigint,
    amount1: bigint,
    customFee: number = pool.currentFeeTier
  ): Promise<void> {
    await this.setPoolDailyDataTVL(eventTimestamp, pool);

    const dailyPoolDataId = getPoolDailyDataId(eventTimestamp, pool);
    let poolDailyDataEntity = (await context.PoolDailyData.get(dailyPoolDataId.toLowerCase()))!;

    const userInputToken = this._findUserInputToken(amount0, token0, token1);

    if (userInputToken.id == pool.token0_id) {
      const feeAmountToken0 = getRawFeeFromTokenAmount(
        amount0,
        customFee == pool.currentFeeTier ? pool.currentFeeTier : customFee
      );

      const feesToken0 = poolDailyDataEntity.feesToken0.plus(formatFromTokenAmount(feeAmountToken0, userInputToken));

      poolDailyDataEntity = {
        ...poolDailyDataEntity,
        feesToken0: feesToken0,
      };
    } else {
      const feeAmountToken1 = getRawFeeFromTokenAmount(
        amount1,
        customFee == pool.currentFeeTier ? pool.currentFeeTier : customFee
      );

      const feesToken1 = poolDailyDataEntity.feesToken1.plus(formatFromTokenAmount(feeAmountToken1, userInputToken));

      poolDailyDataEntity = {
        ...poolDailyDataEntity,
        feesToken1: feesToken1,
      };
    }

    const feesUSD = poolDailyDataEntity.feesToken0
      .times(token0.usdPrice)
      .plus(poolDailyDataEntity.feesToken1.times(token1.usdPrice));

    poolDailyDataEntity = {
      ...poolDailyDataEntity,
      feesUSD,
    };

    context.PoolDailyData.set(poolDailyDataEntity);
  }

  async setHourlyData(
    eventTimestamp: bigint,
    context: HandlerContext,
    token0: TokenEntity,
    token1: TokenEntity,
    pool: PoolEntity,
    amount0: bigint,
    amount1: bigint,
    customFee: number = pool.currentFeeTier
  ): Promise<void> {
    let hourlyPoolDataId = getPoolHourlyDataId(eventTimestamp, pool);

    let userInputToken = this._findUserInputToken(amount0, token0, token1);
    let poolHourlyDataEntity = (await context.PoolHourlyData.getOrCreate({
      id: hourlyPoolDataId,
      feesToken0: ZERO_BIG_DECIMAL,
      feesToken1: ZERO_BIG_DECIMAL,
      feesUSD: ZERO_BIG_DECIMAL,
      hourStartTimestamp: eventTimestamp,
      pool_id: pool.id,
    }))!;

    if (userInputToken.id == pool.token0_id) {
      let feeAmountToken0 = getRawFeeFromTokenAmount(
        amount0,
        customFee != pool.currentFeeTier ? customFee : pool.currentFeeTier
      );

      const feesToken0 = poolHourlyDataEntity.feesToken0.plus(formatFromTokenAmount(feeAmountToken0, userInputToken));

      poolHourlyDataEntity = {
        ...poolHourlyDataEntity,
        feesToken0: feesToken0,
      };
    } else {
      let feeAmountToken1 = getRawFeeFromTokenAmount(
        amount1,
        customFee != pool.currentFeeTier ? customFee : pool.currentFeeTier
      );

      const feesToken1 = poolHourlyDataEntity.feesToken1.plus(formatFromTokenAmount(feeAmountToken1, userInputToken));

      poolHourlyDataEntity = {
        ...poolHourlyDataEntity,
        feesToken1: feesToken1,
      };
    }

    const feesUSD = poolHourlyDataEntity.feesToken0
      .times(token0.usdPrice)
      .plus(poolHourlyDataEntity.feesToken1.times(token1.usdPrice));

    poolHourlyDataEntity = {
      ...poolHourlyDataEntity,
      feesUSD,
    };

    context.PoolHourlyData.set(poolHourlyDataEntity);
  }

  private _findUserInputToken(amount0: bigint, token0: TokenEntity, token1: TokenEntity): TokenEntity {
    if (amount0 < ZERO_BIG_INT) return token1;

    return token0;
  }
}
