import { HandlerContext } from "generated/src/Types";
import { defaultAlgebraPoolData } from "../../../common/default-entities";

export async function handleAlgebraPoolPlugin(
  context: HandlerContext,
  poolId: string,
  newPluginAddress: string
): Promise<void> {
  let algebraPoolData = await context.AlgebraPoolData.getOrCreate(defaultAlgebraPoolData({ id: poolId }));

  algebraPoolData = {
    ...algebraPoolData,
    plugin: newPluginAddress,
  };

  context.AlgebraPoolData.set(algebraPoolData);
}
