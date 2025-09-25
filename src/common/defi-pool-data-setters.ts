import { DeFiPoolData as DeFiPoolDataEntity, handlerContext, Token as TokenEntity } from "generated";
import { defaultDeFiPoolDailyData, defaultDeFiPoolHourlyData } from "./constants";
import { getDeFiPoolDailyDataId, getDeFiPoolHourlyDataId } from "./defi-pool-data-commons";
import { getLiquidityInflowAndOutflowFromRawAmounts } from "./pool-commons";
import { formatFromTokenAmount } from "./token-commons";

export class DeFiPoolDataSetters {
  constructor(readonly context: handlerContext) {}

  async setIntervalLiquidityData(
    eventTimestamp: bigint,
    defiPoolDataEntity: DeFiPoolDataEntity,
    amount0AddedOrRemoved: bigint,
    amount1AddedOrRemoved: bigint,
    token0: TokenEntity,
    token1: TokenEntity
  ) {
    let defiPoolDailyData = await this.context.DeFiPoolDailyData.getOrCreate(
      defaultDeFiPoolDailyData({
        dayId: getDeFiPoolDailyDataId(eventTimestamp, defiPoolDataEntity),
        dayStartTimestamp: eventTimestamp,
      })
    );

    let defiPoolHourlyData = await this.context.DeFiPoolHourlyData.getOrCreate(
      defaultDeFiPoolHourlyData({
        hourId: getDeFiPoolHourlyDataId(eventTimestamp, defiPoolDataEntity),
        hourStartTimestamp: eventTimestamp,
      })
    );

    const liquidityInflowAndOutflows = getLiquidityInflowAndOutflowFromRawAmounts(
      amount0AddedOrRemoved,
      amount1AddedOrRemoved,
      token0,
      token1
    );

    const amount0VolumeUSD = formatFromTokenAmount(amount0AddedOrRemoved, token0).abs().times(token0.usdPrice);
    const amount1VolumeUSD = formatFromTokenAmount(amount1AddedOrRemoved, token1).abs().times(token1.usdPrice);
    const amountVolumeUSD = amount0VolumeUSD.plus(amount1VolumeUSD);

    defiPoolDailyData = {
      ...defiPoolDailyData,
      liquidityVolumeUSD: defiPoolDailyData.liquidityVolumeUSD.plus(amountVolumeUSD),
      liquidityNetInflowUSD: defiPoolDailyData.liquidityNetInflowUSD.plus(liquidityInflowAndOutflows.netInflowUSD),
      liquidityInflowUSD: defiPoolDailyData.liquidityInflowUSD.plus(liquidityInflowAndOutflows.inflowUSD),
      liquidityOutflowUSD: defiPoolDailyData.liquidityOutflowUSD.plus(liquidityInflowAndOutflows.outflowUSD),
    };

    defiPoolHourlyData = {
      ...defiPoolHourlyData,
      liquidityVolumeUSD: defiPoolHourlyData.liquidityVolumeUSD.plus(amountVolumeUSD),
      liquidityNetInflowUSD: defiPoolHourlyData.liquidityNetInflowUSD.plus(liquidityInflowAndOutflows.netInflowUSD),
      liquidityInflowUSD: defiPoolHourlyData.liquidityInflowUSD.plus(liquidityInflowAndOutflows.inflowUSD),
      liquidityOutflowUSD: defiPoolHourlyData.liquidityOutflowUSD.plus(liquidityInflowAndOutflows.outflowUSD),
    };

    this.context.DeFiPoolDailyData.set(defiPoolDailyData);
    this.context.DeFiPoolHourlyData.set(defiPoolHourlyData);
  }
}
