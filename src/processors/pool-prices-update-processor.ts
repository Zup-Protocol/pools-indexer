import type { HandlerContext } from "generated/src/Types";
import { Id } from "../core/entity";
import { IndexerNetwork } from "../core/network";
import type { PoolPrices } from "../core/types";

export async function processPoolPricesUpdate(params: {
  context: HandlerContext;
  poolAddress: string;
  poolPrices: PoolPrices;
  network: IndexerNetwork;
}) {
  const poolId = Id.fromAddress(params.network, params.poolAddress);

  const poolEntity = await params.context.Pool.getOrThrow(poolId);

  params.context.Pool.set({
    ...poolEntity,
    tokens0PerToken1: params.poolPrices.tokens0PerToken1,
    tokens1PerToken0: params.poolPrices.tokens1PerToken0,
  });
}
