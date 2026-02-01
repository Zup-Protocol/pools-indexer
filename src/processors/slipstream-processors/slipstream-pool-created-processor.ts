import type { Block_t, handlerContext, SlipstreamPoolData } from "generated";
import { Id } from "../../core/entity";
import { SupportedProtocol } from "../../core/protocol";
import { ConcentratedSqrtPriceMath } from "../../lib/math";
import { processNewPool } from "../new-pool-processor";
import { processPoolPricesUpdate } from "../pool-prices-update-processor";

export async function processSlipstreamPoolCreated(params: {
  context: handlerContext;
  poolAddress: string;
  token0Address: string;
  token1Address: string;
  tickSpacing: number;
  eventBlock: Block_t;
  chainId: number;
  protocol: SupportedProtocol;
}): Promise<void> {
  const slipstreamPoolData: SlipstreamPoolData = await params.context.SlipstreamPoolData.getOrThrow(
    Id.fromAddress(params.chainId, params.poolAddress),
  );

  params.context.SlipstreamPoolData.set({
    ...slipstreamPoolData,
    tickSpacing: params.tickSpacing,
  });

  const { token0Entity, token1Entity } = await processNewPool({
    context: params.context,
    eventBlock: params.eventBlock,
    rawFeeTier: 0,
    isDynamicFee: true,
    network: params.chainId,
    poolAddress: params.poolAddress,
    poolType: "SLIPSTREAM",
    protocol: params.protocol,
    token0Address: params.token0Address,
    token1Address: params.token1Address,
  });

  // we do this here because slipstream initialize is called before the pool is created
  await processPoolPricesUpdate({
    context: params.context,
    network: params.chainId,
    poolAddress: params.poolAddress,
    poolPrices: ConcentratedSqrtPriceMath.convertSqrtPriceX96ToPoolPrices({
      poolToken0: token0Entity,
      poolToken1: token1Entity,
      sqrtPriceX96: slipstreamPoolData.sqrtPriceX96,
    }),
  });
}
