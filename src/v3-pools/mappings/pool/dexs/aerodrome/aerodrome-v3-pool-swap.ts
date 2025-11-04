import { experimental_createEffect, S } from "envio";
import { AerodromeV3Pool } from "generated";
import { getContract } from "viem";
import { IndexerNetwork } from "../../../../../common/enums/indexer-network";
import { PoolSetters } from "../../../../../common/pool-setters";
import { ViemService } from "../../../../../common/services/viem-service";
import { handleV3PoolSwap } from "../../v3-pool-swap";

AerodromeV3Pool.Swap.handler(async ({ event, context }) => {
  const poolId = IndexerNetwork.getEntityIdFromAddress(event.chainId, event.srcAddress);
  const poolEntity = await context.Pool.getOrThrow(poolId);
  const token0Entity = await context.Token.getOrThrow(poolEntity.token0_id);
  const token1Entity = await context.Token.getOrThrow(poolEntity.token1_id);

  const swapFee = await context.effect(swapFeeEffect, { chainId: event.chainId, poolAddress: event.srcAddress });

  await handleV3PoolSwap({
    context,
    poolEntity,
    token0Entity,
    token1Entity,
    swapAmount0: event.params.amount0,
    swapAmount1: event.params.amount1,
    sqrtPriceX96: event.params.sqrtPriceX96,
    tick: BigInt(event.params.tick),
    eventTimestamp: BigInt(event.block.timestamp),
    v3PoolSetters: new PoolSetters(context, event.chainId),
    newFeeTier: swapFee,
  });
});

const SwapFeeSchemaInput = S.tuple((t) => ({
  poolAddress: t.item(0, S.string),
  chainId: t.item(1, S.number),
}));

const SwapFeeSchemaOutput = S.number;

type SwapFeeSchemaOutput = S.Output<typeof SwapFeeSchemaOutput>;
type SwapFeeSchemaInput = S.Input<typeof SwapFeeSchemaInput>;

const swapFeeEffect = experimental_createEffect(
  {
    name: "aerodrome-v3-pool-swap-fee",
    input: SwapFeeSchemaInput,
    output: SwapFeeSchemaOutput,
    cache: true, // setting true as hotfix for rpc pricing -> we shouldn’t cache it since the fee can change, and it’s too complex and error-prone to calculate every time, so we don’t
  },
  async ({ input }) => {
    return await _getPoolSwapFee(input.chainId, input.poolAddress);
  }
);

async function _getPoolSwapFee(network: IndexerNetwork, poolAddress: string): Promise<number> {
  const client = ViemService.shared.getClient(network);

  const contract = getContract({
    abi: aerodromeV3PoolSwapFeeAbi,
    client,
    address: poolAddress as `0x${string}`,
  });

  const swapFee = await contract.read.fee();
  return swapFee;
}

const aerodromeV3PoolSwapFeeAbi = [
  {
    inputs: [],
    name: "fee",
    outputs: [
      {
        internalType: "uint24",
        name: "",
        type: "uint24",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
