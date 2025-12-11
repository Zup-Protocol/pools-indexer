import { AlgebraPool_1_2_2 } from "generated";
import { IndexerNetwork } from "../../../../../common/enums/indexer-network";
import { handleAlgebraPoolPlugin } from "../../algebra-pool-plugin";

AlgebraPool_1_2_2.PluginEvent.handler(async ({ event, context }) => {
  const poolId = IndexerNetwork.getEntityIdFromAddress(event.chainId, event.srcAddress);

  await handleAlgebraPoolPlugin(context, poolId, event.params.newPluginAddress);
});
