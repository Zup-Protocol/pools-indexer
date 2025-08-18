import { experimental_createEffect, S } from "envio";
import { GLiquidAlgebraFactory } from "generated";
import { getContract } from "viem";
import { algebraPool1_2_1FactoryAbi } from "../../../../common/abis";
import { ZERO_ADDRESS } from "../../../../common/constants";
import { IndexerNetwork } from "../../../../common/enums/indexer-network";
import { SupportedProtocol } from "../../../../common/enums/supported-protocol";
import { TokenService } from "../../../../common/token-service";
import { ViemService } from "../../../../common/viem-service";
import { handleV3PoolCreated } from "../v3-factory";

GLiquidAlgebraFactory.Pool.contractRegister(({ event, context }) => {
  context.addAlgebraPool_1_2_1(event.params.pool);
});

GLiquidAlgebraFactory.CustomPool.contractRegister(({ event, context }) => {
  context.addAlgebraPool_1_2_1(event.params.pool);
});

GLiquidAlgebraFactory.Pool.handler(async ({ event, context }) => {
  const algebraPoolData = await context.AlgebraPoolData.getOrCreate({
    id: IndexerNetwork.getEntityIdFromAddress(event.chainId, event.params.pool),
    deployer: ZERO_ADDRESS,
  });

  const defaultPoolConfig = await context.effect(defaultPoolConfigEffect, {
    factoryAddress: event.srcAddress,
    chainId: event.chainId,
  });

  await handleV3PoolCreated(
    context,
    event.params.pool,
    event.params.token0,
    event.params.token1,
    defaultPoolConfig.defaultFee,
    defaultPoolConfig.defaultTickSpacing,
    BigInt(event.block.timestamp),
    event.chainId,
    SupportedProtocol.GLIQUID_V3,
    new TokenService(context, event.chainId),
    algebraPoolData
  );
});

GLiquidAlgebraFactory.CustomPool.handler(async ({ event, context }) => {
  const algebraPoolData = await context.AlgebraPoolData.getOrCreate({
    id: IndexerNetwork.getEntityIdFromAddress(event.chainId, event.params.pool),
    deployer: event.params.deployer.toLowerCase(),
  });

  const defaultPoolConfig = await context.effect(defaultPoolConfigEffect, {
    factoryAddress: event.srcAddress,
    chainId: event.chainId,
  });

  await handleV3PoolCreated(
    context,
    event.params.pool,
    event.params.token0,
    event.params.token1,
    defaultPoolConfig.defaultFee,
    defaultPoolConfig.defaultTickSpacing,
    BigInt(event.block.timestamp),
    event.chainId,
    SupportedProtocol.GLIQUID_V3,
    new TokenService(context, event.chainId),
    algebraPoolData
  );

  context.AlgebraPoolData;
});

const defaultPoolConfigEffect = experimental_createEffect(
  {
    name: "default-pool-config",
    cache: true,
    input: S.tuple((t) => ({
      factoryAddress: t.item(0, S.string),
      chainId: t.item(1, S.number),
    })),
    output: S.schema({
      defaultFee: S.number,
      defaultTickSpacing: S.number,
    }),
  },
  async ({ context, input }) => {
    try {
      const factoryContract = getContract({
        abi: algebraPool1_2_1FactoryAbi,
        address: input.factoryAddress as `0x${string}`,
        client: ViemService.shared.getClient(input.chainId),
      });

      const [_, defaultTickSpacing, defaultFee] = await factoryContract.read.defaultConfigurationForPool();

      return {
        defaultFee: defaultFee,
        defaultTickSpacing: defaultTickSpacing,
      };
    } catch (error) {
      context.log.error(
        `Failed to fetch defaultpool config for ${input.factoryAddress} on chain ${input.chainId}, using hardcoded values`
      );

      return {
        defaultFee: 100,
        defaultTickSpacing: 60,
      };
    }
  }
);
