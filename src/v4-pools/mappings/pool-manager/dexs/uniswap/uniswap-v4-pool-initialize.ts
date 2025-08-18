import { UniswapV4PoolManager } from "generated";
import { SupportedProtocol } from "../../../../../common/enums/supported-protocol";
import { PoolSetters } from "../../../../../common/pool-setters";
import { TokenService } from "../../../../../common/token-service";
import { handleV4PoolInitialize } from "../../v4-pool-initialize";

UniswapV4PoolManager.Initialize.handler(async ({ event, context }) => {
  await handleV4PoolInitialize(
    context,
    event.params.id,
    event.params.currency0,
    event.params.currency1,
    Number.parseInt(event.params.fee.toString()),
    Number.parseInt(event.params.tickSpacing.toString()),
    BigInt(event.params.tick),
    event.params.sqrtPriceX96,
    SupportedProtocol.UNISWAP_V4,
    event.params.hooks,
    BigInt(event.block.timestamp),
    event.chainId,
    event.srcAddress,
    new PoolSetters(context, event.chainId),
    new TokenService(context, event.chainId)
  );
});
