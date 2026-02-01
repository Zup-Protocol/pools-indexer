import type { HandlerContext } from "generated";
import { Id } from "../../core/entity";
import { IndexerNetwork } from "../../core/network";
import { ALGEBRA_POOL_DYNAMIC_FEE_FLAG } from "./utils/constants";

export async function processAlgebraPluginConfig(params: {
  context: HandlerContext;
  poolAddress: string;
  network: IndexerNetwork;
  newPluginConfig: number;
}): Promise<void> {
  const poolId = Id.fromAddress(params.network, params.poolAddress);

  let [algebraPoolData, poolEntity] = await Promise.all([
    params.context.AlgebraPoolData.getOrThrow(poolId),
    params.context.Pool.getOrThrow(poolId),
  ]);

  const isPluginDynamicFee = (params.newPluginConfig & ALGEBRA_POOL_DYNAMIC_FEE_FLAG) > 0;

  params.context.AlgebraPoolData.set({
    ...algebraPoolData,
    pluginConfig: params.newPluginConfig,
  });

  params.context.Pool.set({
    ...poolEntity,
    isDynamicFee: isPluginDynamicFee,
  });
}
