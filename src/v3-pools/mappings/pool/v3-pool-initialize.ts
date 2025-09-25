import { handlerContext, Pool as PoolEntity } from "generated";

export async function handleV3PoolInitialize(
  context: handlerContext,
  poolEntity: PoolEntity,
  sqrtPriceX96: bigint,
  tick: bigint
): Promise<void> {
  let v3PoolEntity = await context.V3PoolData.getOrThrow(poolEntity.id);

  v3PoolEntity = {
    ...v3PoolEntity,
    sqrtPriceX96: sqrtPriceX96,
    tick: tick,
  };

  context.V3PoolData.set(v3PoolEntity);
}
