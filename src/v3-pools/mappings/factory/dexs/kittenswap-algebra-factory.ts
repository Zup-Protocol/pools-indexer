import { AlgebraPoolData, KittenSwapAlgebraFactory } from "generated";
import { ZERO_ADDRESS } from "../../../../common/constants";
import { IndexerNetwork } from "../../../../common/enums/indexer-network";
import { SupportedProtocol } from "../../../../common/enums/supported-protocol";
import { TokenService } from "../../../../common/services/token-service";
import { handleV3PoolCreated } from "../v3-factory";

KittenSwapAlgebraFactory.Pool.contractRegister(({ event, context }) => {
  context.addAlgebraPool_1_2_2(event.params.pool);
});

KittenSwapAlgebraFactory.CustomPool.contractRegister(({ event, context }) => {
  context.addAlgebraPool_1_2_2(event.params.pool);
});

KittenSwapAlgebraFactory.Pool.handler(async ({ event, context }) => {
  const algebraPoolData: AlgebraPoolData = {
    id: IndexerNetwork.getEntityIdFromAddress(event.chainId, event.params.pool),
    deployer: ZERO_ADDRESS,
    communityFee: 0,
  };

  await handleV3PoolCreated({
    context,
    poolAddress: event.params.pool,
    token0Address: event.params.token0,
    token1Address: event.params.token1,
    feeTier: 0,
    tickSpacing: 0,
    eventTimestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    protocol: SupportedProtocol.KITTENSWAP_ALGEBRA,
    tokenService: TokenService.shared,
    algebraPoolData,
  });
});

KittenSwapAlgebraFactory.CustomPool.handler(async ({ event, context }) => {
  const algebraPoolData: AlgebraPoolData = {
    id: IndexerNetwork.getEntityIdFromAddress(event.chainId, event.params.pool),
    deployer: event.params.deployer,
    communityFee: 0,
  };

  await handleV3PoolCreated({
    context,
    poolAddress: event.params.pool,
    token0Address: event.params.token0,
    token1Address: event.params.token1,
    feeTier: 0,
    tickSpacing: 0,
    eventTimestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    protocol: SupportedProtocol.KITTENSWAP_ALGEBRA,
    tokenService: TokenService.shared,
    algebraPoolData,
  });
});
