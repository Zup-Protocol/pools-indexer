import { HxFinanceAlgebraFactory } from "generated";
import { ZERO_ADDRESS } from "../../../../common/constants";
import { IndexerNetwork } from "../../../../common/enums/indexer-network";
import { SupportedProtocol } from "../../../../common/enums/supported-protocol";
import { TokenService } from "../../../../common/services/token-service";
import { handleV3PoolCreated } from "../v3-factory";

HxFinanceAlgebraFactory.Pool.contractRegister(({ event, context }) => {
  context.addAlgebraPool_1_2_2(event.params.pool);
});

HxFinanceAlgebraFactory.CustomPool.contractRegister(({ event, context }) => {
  context.addAlgebraPool_1_2_2(event.params.pool);
});

HxFinanceAlgebraFactory.Pool.handler(async ({ event, context }) => {
  const algebraPoolData = await context.AlgebraPoolData.getOrCreate({
    id: IndexerNetwork.getEntityIdFromAddress(event.chainId, event.params.pool),
    deployer: ZERO_ADDRESS,
    communityFee: 0,
  });

  await handleV3PoolCreated(
    context,
    event.params.pool,
    event.params.token0,
    event.params.token1,
    0,
    0,
    BigInt(event.block.timestamp),
    event.chainId,
    SupportedProtocol.HX_FINANCE_ALGEBRA,
    TokenService.shared,
    algebraPoolData
  );
});

HxFinanceAlgebraFactory.CustomPool.handler(async ({ event, context }) => {
  const algebraPoolData = await context.AlgebraPoolData.getOrCreate({
    id: IndexerNetwork.getEntityIdFromAddress(event.chainId, event.params.pool),
    deployer: event.params.deployer.toLowerCase(),
    communityFee: 0,
  });

  await handleV3PoolCreated(
    context,
    event.params.pool,
    event.params.token0,
    event.params.token1,
    0,
    0,
    BigInt(event.block.timestamp),
    event.chainId,
    SupportedProtocol.HX_FINANCE_ALGEBRA,
    TokenService.shared,
    algebraPoolData
  );
});
