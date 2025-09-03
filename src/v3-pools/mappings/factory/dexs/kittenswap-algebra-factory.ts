import { KittenSwapAlgebraFactory } from "generated";
import { ZERO_ADDRESS } from "../../../../common/constants";
import { IndexerNetwork } from "../../../../common/enums/indexer-network";
import { SupportedProtocol } from "../../../../common/enums/supported-protocol";
import { TokenService } from "../../../../common/services/token-service";
import { handleV3PoolCreated } from "../v3-factory";

let defaultFee = 500;
let defaultTickSpacing = 60;

KittenSwapAlgebraFactory.Pool.contractRegister(({ event, context }) => {
  context.addAlgebraPool_1_2_2(event.params.pool);
});

KittenSwapAlgebraFactory.CustomPool.contractRegister(({ event, context }) => {
  context.addAlgebraPool_1_2_2(event.params.pool);
});

KittenSwapAlgebraFactory.DefaultFee.handler(async ({ event }) => {
  defaultFee = Number.parseInt(event.params.newDefaultFee.toString());
});

KittenSwapAlgebraFactory.DefaultTickspacing.handler(async ({ event }) => {
  defaultTickSpacing = Number.parseInt(event.params.newDefaultTickspacing.toString());
});

KittenSwapAlgebraFactory.Pool.handler(async ({ event, context }) => {
  const algebraPoolData = await context.AlgebraPoolData.getOrCreate({
    id: IndexerNetwork.getEntityIdFromAddress(event.chainId, event.params.pool),
    deployer: ZERO_ADDRESS,
  });

  await handleV3PoolCreated(
    context,
    event.params.pool,
    event.params.token0,
    event.params.token1,
    defaultFee,
    defaultTickSpacing,
    BigInt(event.block.timestamp),
    event.chainId,
    SupportedProtocol.KITTENSWAP_ALGEBRA,
    TokenService.shared,
    algebraPoolData
  );
});

KittenSwapAlgebraFactory.CustomPool.handler(async ({ event, context }) => {
  const algebraPoolData = await context.AlgebraPoolData.getOrCreate({
    id: IndexerNetwork.getEntityIdFromAddress(event.chainId, event.params.pool),
    deployer: event.params.deployer.toLowerCase(),
  });

  await handleV3PoolCreated(
    context,
    event.params.pool,
    event.params.token0,
    event.params.token1,
    defaultFee,
    defaultTickSpacing,
    BigInt(event.block.timestamp),
    event.chainId,
    SupportedProtocol.KITTENSWAP_ALGEBRA,
    TokenService.shared,
    algebraPoolData
  );
});
