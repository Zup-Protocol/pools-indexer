import type { Block_t, handlerContext } from "generated";
import { ZERO_BIG_INT } from "../../core/constants";
import { Id } from "../../core/entity";
import { SupportedProtocol } from "../../core/protocol";
import { processNewPool } from "../new-pool-processor";

export async function processV3PoolCreated(params: {
  context: handlerContext;
  poolAddress: string;
  token0Address: string;
  token1Address: string;
  feeTier?: number;
  tickSpacing: number;
  eventBlock: Block_t;
  chainId: number;
  protocol: SupportedProtocol;
}): Promise<void> {
  params.context.V3PoolData.set({
    id: Id.fromAddress(params.chainId, params.poolAddress),
    sqrtPriceX96: ZERO_BIG_INT,
    tick: ZERO_BIG_INT,
    tickSpacing: params.tickSpacing,
  });

  await processNewPool({
    context: params.context,
    eventBlock: params.eventBlock,
    rawFeeTier: params.feeTier ?? 0,
    isDynamicFee: false,
    network: params.chainId,
    poolAddress: params.poolAddress,
    poolType: "V3",
    protocol: params.protocol,
    token0Address: params.token0Address,
    token1Address: params.token1Address,
  });
}
