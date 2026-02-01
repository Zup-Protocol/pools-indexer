import { UniswapV4PoolManager } from "generated";
import { Id } from "../../../core/entity";
import { processV4ModifyLiquidity } from "../../../processors/v4-processors/v4-modify-liquidity-processor";

UniswapV4PoolManager.ModifyLiquidity.handler(async ({ event, context }) => {
  await processV4ModifyLiquidity({
    context: context,
    eventBlock: event.block,
    liqudityDelta: event.params.liquidityDelta,
    network: event.chainId,
    poolAddress: event.params.id,
    tickLower: Number(event.params.tickLower.toString()),
    tickUpper: Number(event.params.tickUpper.toString()),
  });
});
