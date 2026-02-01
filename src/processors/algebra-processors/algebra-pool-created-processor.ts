import type { Block_t, handlerContext } from "generated";
import { AlgebraVersion } from "../../core/algebra/algebra-version";
import { ZERO_ADDRESS } from "../../core/constants";
import { Id } from "../../core/entity";
import { SupportedProtocol } from "../../core/protocol";
import { processNewPool } from "../new-pool-processor";

export async function processAlgebraPoolCreated(params: {
  context: handlerContext;
  poolAddress: string;
  token0Address: string;
  token1Address: string;
  eventBlock: Block_t;
  chainId: number;
  protocol: SupportedProtocol;
  deployer: string;
  version: AlgebraVersion;
}): Promise<void> {
  const poolId = Id.fromAddress(params.chainId, params.poolAddress);

  // we use get or create because it can be created before the factory at algebra-plugin-handler
  let algebraPoolData = await params.context.AlgebraPoolData.getOrCreate({
    id: poolId,
    rawCommunityFee: 0,
    communityFeePercentage: 0,
    pluginConfig: 0,
    sqrtPriceX96: 0n,
    tick: 0n,
    tickSpacing: 0,
    plugin: ZERO_ADDRESS,
    deployer: ZERO_ADDRESS,
    version: ZERO_ADDRESS,
  });

  algebraPoolData = {
    ...algebraPoolData,
    version: params.version,
    deployer: params.deployer,
  };

  params.context.AlgebraPoolData.set(algebraPoolData);

  await processNewPool({
    context: params.context,
    eventBlock: params.eventBlock,
    rawFeeTier: 0,
    isDynamicFee: false,
    network: params.chainId,
    poolAddress: params.poolAddress,
    poolType: "ALGEBRA",
    protocol: params.protocol,
    token0Address: params.token0Address,
    token1Address: params.token1Address,
  });
}
