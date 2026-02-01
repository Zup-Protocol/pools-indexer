import type { HandlerContext } from "generated";
import { Id } from "../../core/entity";
import { IndexerNetwork } from "../../core/network";
import { FeeMath } from "../../lib/math/fee-math";

export async function processAlgebraCommunityFee(params: {
  context: HandlerContext;
  poolAddress: string;
  network: IndexerNetwork;
  newCommunityFee: number;
}): Promise<void> {
  const algebraPoolData = await params.context.AlgebraPoolData.getOrThrow(
    Id.fromAddress(params.network, params.poolAddress),
  );

  params.context.AlgebraPoolData.set({
    ...algebraPoolData,
    rawCommunityFee: params.newCommunityFee,
    communityFeePercentage: FeeMath.convertRawAlgebraCommunityFeeToPercentage(params.newCommunityFee),
  });
}
