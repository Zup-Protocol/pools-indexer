import type { HandlerContext } from "generated";
import { Id } from "../../core/entity";
import { IndexerNetwork } from "../../core/network";
import { FeeMath } from "../../lib/math/fee-math";

export async function processAlgebraFee(params: {
  context: HandlerContext;
  poolAddress: string;
  network: IndexerNetwork;
  newFeeTier: number;
}): Promise<void> {
  const poolEntity = await params.context.Pool.getOrThrow(Id.fromAddress(params.network, params.poolAddress));

  params.context.Pool.set({
    ...poolEntity,
    rawCurrentFeeTier: params.newFeeTier,
    currentFeeTierPercentage: FeeMath.convertRawSwapFeeToPercentage(params.newFeeTier),
  });
}
