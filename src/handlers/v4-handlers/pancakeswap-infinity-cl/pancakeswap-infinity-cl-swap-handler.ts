import { PancakeSwapV4CLPoolManager } from "generated";
import { Id } from "../../../core/entity";
import { processV4Swap } from "../../../processors/v4-processors/v4-swap-processor";

PancakeSwapV4CLPoolManager.Swap.handler(async ({ event, context }) => {
  await processV4Swap({
    eventBlock: event.block,
    amount0: event.params.amount0,
    amount1: event.params.amount1,
    context: context,
    network: event.chainId,
    poolAddress: event.params.id,
    sqrtPriceX96: event.params.sqrtPriceX96,
    swapFee: Number(event.params.fee),
    tick: BigInt(event.params.tick),
  });
});
