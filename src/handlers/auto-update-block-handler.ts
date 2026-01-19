import { indexer, onBlock, type HandlerContext, type Pool as PoolEntity } from "generated";
import { maxUint256 } from "viem";
import { IndexerNetwork } from "../core/network";
import { processPoolTimeframedStatsUpdate } from "../processors/pool-timeframed-stats-update-processor";
import { DatabaseService } from "../services/database-service";

indexer.chainIds.forEach((chainId) => {
  onBlock(
    {
      name: "daily-pools-auto-update-block-handler",
      chain: chainId,
      interval: IndexerNetwork.oneDayInBlocks[chainId],
    },
    async ({ block, context }) => {
      const nowAsSecondsTimestamp = BigInt(Math.floor(Date.now() / 1000));

      const oneDayInBlocks = IndexerNetwork.oneDayInBlocks[chainId];
      const sevenDaysInBlocks = oneDayInBlocks * 7;
      const thirtyDaysInBlocks = oneDayInBlocks * 30;
      const ninetyDaysInBlocks = oneDayInBlocks * 90;
      const block24hAgo = BigInt(block.number - oneDayInBlocks);

      const inactivePoolsFor24h = await context.Pool.getWhere.lastActivityBlock.lt(block24hAgo);

      await Promise.all(
        inactivePoolsFor24h.map((pool) => {
          const inactiveBlocks = BigInt(block.number) - pool.lastActivityBlock;
          const activeBlocksSinceCreation = pool.lastActivityBlock - BigInt(pool.createdAtBlock);

          if (
            inactiveBlocks > BigInt(ninetyDaysInBlocks) ||
            (inactiveBlocks > BigInt(thirtyDaysInBlocks) && activeBlocksSinceCreation < BigInt(thirtyDaysInBlocks)) ||
            (inactiveBlocks > BigInt(sevenDaysInBlocks) && activeBlocksSinceCreation < BigInt(sevenDaysInBlocks)) ||
            (inactiveBlocks > BigInt(oneDayInBlocks) && activeBlocksSinceCreation < BigInt(oneDayInBlocks))
          ) {
            return killPoolDailyUpdate(context, pool);
          }

          return processPoolTimeframedStatsUpdate({
            context,
            eventTimestamp: nowAsSecondsTimestamp,
            poolEntity: pool,
          });
        }),
      );
    },
  );
});

function killPoolDailyUpdate(context: HandlerContext, pool: PoolEntity) {
  DatabaseService.resetAllPoolTimeframedStats(context, pool);

  context.Pool.set({
    ...pool,
    lastActivityBlock: maxUint256,
  });
}
