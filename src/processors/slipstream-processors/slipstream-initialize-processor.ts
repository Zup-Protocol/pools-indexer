import type { handlerContext } from "generated";
import { ZERO_BIG_INT } from "../../core/constants";
import { Id } from "../../core/entity";
import { IndexerNetwork } from "../../core/network";

export async function processSlipstreamInitialize(params: {
  context: handlerContext;
  sqrtPriceX96: bigint;
  tick: bigint;
  poolAddress: string;
  network: IndexerNetwork;
}): Promise<void> {
  // we don't update pool prices here because initialize event is emitted before the pool is created
  params.context.SlipstreamPoolData.set({
    id: Id.fromAddress(params.network, params.poolAddress),
    lastFeeAdjustmentTimestamp: ZERO_BIG_INT,
    tickSpacing: 0,
    sqrtPriceX96: params.sqrtPriceX96,
    tick: params.tick,
  });
}
