import { PancakeSwapV4CLPoolManager } from "generated";
import { SupportedProtocol } from "../../../../../common/enums/supported-protocol";
import { TokenService } from "../../../../../common/services/token-service";
import { handleV4PoolInitialize } from "../../v4-pool-initialize";
import { getPoolTickSpacingFromParameters } from "./pancakeswap-v4-cl-utils";

PancakeSwapV4CLPoolManager.Initialize.handler(async ({ event, context }) => {
  await handleV4PoolInitialize({
    context,
    poolAddress: event.params.id,
    token0Address: event.params.currency0,
    token1Address: event.params.currency1,
    feeTier: Number.parseInt(event.params.fee.toString()),
    tickSpacing: getPoolTickSpacingFromParameters(event.params.parameters as `0x${string}`),
    tick: BigInt(event.params.tick),
    sqrtPriceX96: event.params.sqrtPriceX96,
    protocol: SupportedProtocol.PANCAKESWAP_INFINITY_CL,
    hooks: event.params.hooks,
    eventTimestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    poolManagerAddress: event.srcAddress,
    tokenService: TokenService.shared,
  });
});
