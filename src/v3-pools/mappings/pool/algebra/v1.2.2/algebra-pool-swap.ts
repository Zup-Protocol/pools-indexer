import {
  AlgebraPool_1_2_2,
  AlgebraPoolData as AlgebraPoolDataEntity,
  Pool as PoolEntity,
  Token as TokenEntity,
  V3PoolData as V3PoolDataEntity,
} from "generated";
import { IndexerNetwork } from "../../../../../common/enums/indexer-network";
import { PoolSetters } from "../../../../../common/pool-setters";
import { handleV3PoolSwap } from "../../v3-pool-swap";
import { getPoolDeductingAlgebraNonLPFees } from "../common/algebra-pool-common";

let overrideSwapFee: number | undefined = undefined;
let pluginFee: number = 0;

AlgebraPool_1_2_2.SwapFee.handler(async ({ event }) => {
  overrideSwapFee = event.params.overrideFee != 0n ? Number.parseInt(event.params.overrideFee.toString()) : undefined;
  pluginFee = Number.parseInt(event.params.pluginFee.toString());
});

AlgebraPool_1_2_2.Swap.handler(async ({ event, context }) => {
  const poolId = IndexerNetwork.getEntityIdFromAddress(event.chainId, event.srcAddress);

  let [poolEntity, algebraPoolData, v3PoolData]: [PoolEntity, AlgebraPoolDataEntity, V3PoolDataEntity] =
    await Promise.all([
      context.Pool.getOrThrow(poolId),
      context.AlgebraPoolData.getOrThrow(poolId),
      context.V3PoolData.getOrThrow(poolId),
    ]);

  const [token0Entity, token1Entity]: [TokenEntity, TokenEntity] = await Promise.all([
    context.Token.getOrThrow(poolEntity.token0_id),
    context.Token.getOrThrow(poolEntity.token1_id),
  ]);

  poolEntity = getPoolDeductingAlgebraNonLPFees({
    amount0SwapAmount: event.params.amount0,
    amount1SwapAmount: event.params.amount1,
    communityFee: algebraPoolData.communityFee,
    currentPoolEntity: poolEntity,
    pluginFee: pluginFee,
    token0: token0Entity,
    token1: token1Entity,
    overrideSwapFee: overrideSwapFee,
  });

  await handleV3PoolSwap({
    context,
    poolEntity,
    v3PoolEntity: v3PoolData,
    token0Entity,
    token1Entity,
    swapAmount0: event.params.amount0,
    swapAmount1: event.params.amount1,
    sqrtPriceX96: event.params.price,
    tick: BigInt(event.params.tick),
    eventTimestamp: BigInt(event.block.timestamp),
    v3PoolSetters: new PoolSetters(context, event.chainId),
    overrideSingleSwapFee: overrideSwapFee,
  });
});
