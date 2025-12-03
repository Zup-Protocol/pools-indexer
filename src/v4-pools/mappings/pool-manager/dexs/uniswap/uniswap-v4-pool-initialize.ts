import { UniswapV4PoolManager } from "generated";
import { SupportedProtocol } from "../../../../../common/enums/supported-protocol";
import { TokenService } from "../../../../../common/services/token-service";
import { handleV4PoolInitialize } from "../../v4-pool-initialize";

UniswapV4PoolManager.Initialize.handler(async ({ event, context }) => {
  await handleV4PoolInitialize({
    context,
    poolAddress: event.params.id,
    token0Address: event.params.currency0,
    token1Address: event.params.currency1,
    feeTier: Number.parseInt(event.params.fee.toString()),
    tickSpacing: Number.parseInt(event.params.tickSpacing.toString()),
    tick: BigInt(event.params.tick),
    sqrtPriceX96: event.params.sqrtPriceX96,
    protocol: SupportedProtocol.UNISWAP_V4,
    hooks: event.params.hooks,
    eventTimestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    poolManagerAddress: event.srcAddress,
    tokenService: TokenService.shared,
  });
});
