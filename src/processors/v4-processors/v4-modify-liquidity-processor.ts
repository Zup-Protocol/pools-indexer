import type { Block_t, handlerContext } from "generated";
import { Id } from "../../core/entity";
import { IndexerNetwork } from "../../core/network";
import { ConcentratedLiquidityMath } from "../../lib/math";
import { processLiquidityChange } from "../liquidity-change-processor";

export async function processV4ModifyLiquidity(params: {
  context: handlerContext;
  poolAddress: string;
  network: IndexerNetwork;
  eventBlock: Block_t;
  liqudityDelta: bigint;
  tickLower: number;
  tickUpper: number;
}): Promise<void> {
  const v4PoolEntity = await params.context.V4PoolData.getOrThrow(Id.fromAddress(params.network, params.poolAddress));

  const amount0 = ConcentratedLiquidityMath.calculateAmount0ForDelta(
    params.tickLower,
    params.tickUpper,
    v4PoolEntity.tick,
    params.liqudityDelta,
    v4PoolEntity.sqrtPriceX96,
  );

  const amount1 = ConcentratedLiquidityMath.calculateAmount1ForDelta(
    params.tickLower,
    params.tickUpper,
    v4PoolEntity.tick,
    params.liqudityDelta,
    v4PoolEntity.sqrtPriceX96,
  );

  await processLiquidityChange({
    amount0AddedOrRemoved: amount0,
    amount1AddedOrRemoved: amount1,
    context: params.context,
    eventBlock: params.eventBlock,
    network: params.network,
    poolAddress: params.poolAddress,
    updateMetrics: true,
  });
}
