import { indexer, onBlock, type HandlerContext, type Pool as PoolEntity } from "generated";
import { maxUint256 } from "viem";
import { Id } from "../core/entity";
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

      const oneDayInBlocksBI = BigInt(oneDayInBlocks);
      const sevenDaysInBlocksBI = BigInt(sevenDaysInBlocks);
      const thirtyDaysInBlocksBI = BigInt(thirtyDaysInBlocks);
      const ninetyDaysInBlocksBI = BigInt(ninetyDaysInBlocks);

      const currentBlockBI = BigInt(block.number);

      const chainConfig = indexer.chains[chainId];
      const startBlock = BigInt(chainConfig.startBlock);
      const startDayId = Math.floor(Number(startBlock) / oneDayInBlocks);

      let daysAgo = 1;

      while (true) {
        const targetBlock = currentBlockBI - oneDayInBlocksBI * BigInt(daysAgo);

        const targetDayId = Math.floor(Number(targetBlock) / oneDayInBlocks);
        if (targetDayId < startDayId || targetBlock < 0n) break;

        const poolsInDay = await context.Pool.getWhere.lastActivityDayId.eq(
          Id.buildLastActivityDayId(targetBlock, chainId),
        );

        if (poolsInDay.length > 0) {
          await Promise.all(
            poolsInDay.map((pool) => {
              const inactiveBlocks = currentBlockBI - pool.lastActivityBlock;
              const activeBlocksSinceCreation = pool.lastActivityBlock - pool.createdAtBlock;

              if (
                inactiveBlocks > ninetyDaysInBlocksBI ||
                (inactiveBlocks > thirtyDaysInBlocksBI && activeBlocksSinceCreation < thirtyDaysInBlocksBI) ||
                (inactiveBlocks > sevenDaysInBlocksBI && activeBlocksSinceCreation < sevenDaysInBlocksBI) ||
                (inactiveBlocks > oneDayInBlocksBI && activeBlocksSinceCreation < oneDayInBlocksBI)
              ) {
                return killPoolDailyUpdate(context, pool);
              }

              if (context.chain.isLive) {
                return processPoolTimeframedStatsUpdate({
                  context,
                  eventTimestamp: nowAsSecondsTimestamp,
                  poolEntity: pool,
                  isAutoUpdate: true,
                });
              }
            }),
          );
        }

        daysAgo++;
      }
    },
  );
});

function killPoolDailyUpdate(context: HandlerContext, pool: PoolEntity) {
  DatabaseService.resetAllPoolTimeframedStats(context, pool);

  context.Pool.set({
    ...pool,
    lastActivityBlock: maxUint256,
    lastActivityDayId: Id.buildLastActivityDayId(maxUint256, pool.chainId),
  });
}
