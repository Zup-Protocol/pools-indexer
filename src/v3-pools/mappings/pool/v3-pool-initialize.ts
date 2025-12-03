import { handlerContext, V3PoolData as V3PoolDataEntity } from "generated";

export async function handleV3PoolInitialize(
  context: handlerContext,
  v3PoolData: V3PoolDataEntity,
  sqrtPriceX96: bigint,
  tick: bigint
): Promise<void> {
  v3PoolData = {
    ...v3PoolData,
    sqrtPriceX96: sqrtPriceX96,
    tick: tick,
  };

  context.V3PoolData.set(v3PoolData);
}
