import { RamsesV3Pool } from "generated";
import { Id } from "../../../../core/entity";
import { FeeMath } from "../../../../lib/math/fee-math";

RamsesV3Pool.FeeAdjustment.handler(async ({ event, context }) => {
  const poolId = Id.fromAddress(event.chainId, event.srcAddress);
  const poolEntity = await context.Pool.getOrThrow(poolId);
  const newRawFeeTier = Number(event.params.newFee);

  context.Pool.set({
    ...poolEntity,
    rawCurrentFeeTier: newRawFeeTier,
    currentFeeTierPercentage: FeeMath.convertRawSwapFeeToPercentage(newRawFeeTier),
  });
});
