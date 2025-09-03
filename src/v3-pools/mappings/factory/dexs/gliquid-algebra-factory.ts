import { GLiquidAlgebraFactory } from "generated";
import { ZERO_ADDRESS } from "../../../../common/constants";
import { IndexerNetwork } from "../../../../common/enums/indexer-network";
import { SupportedProtocol } from "../../../../common/enums/supported-protocol";
import { TokenService } from "../../../../common/services/token-service";
import { handleV3PoolCreated } from "../v3-factory";

let defaultFee = 500;
let defaultTickSpacing = 60;

GLiquidAlgebraFactory.Pool.contractRegister(({ event, context }) => {
  context.addAlgebraPool_1_2_1(event.params.pool);
});

GLiquidAlgebraFactory.CustomPool.contractRegister(({ event, context }) => {
  context.addAlgebraPool_1_2_1(event.params.pool);
});

GLiquidAlgebraFactory.DefaultFee.handler(async ({ event }) => {
  defaultFee = Number.parseInt(event.params.newDefaultFee.toString());
});

GLiquidAlgebraFactory.DefaultTickspacing.handler(async ({ event }) => {
  defaultTickSpacing = Number.parseInt(event.params.newDefaultTickspacing.toString());
});

GLiquidAlgebraFactory.Pool.handler(async ({ event, context }) => {
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
    SupportedProtocol.GLIQUID_ALGEBRA,
    TokenService.shared,
    algebraPoolData
  );
});

GLiquidAlgebraFactory.CustomPool.handler(async ({ event, context }) => {
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
    SupportedProtocol.GLIQUID_ALGEBRA,
    TokenService.shared,
    algebraPoolData
  );
});
