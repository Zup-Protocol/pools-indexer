import { OkuV3Factory } from "generated";
import { SupportedProtocol } from "../../../../common/enums/supported-protocol";
import { TokenService } from "../../../../common/services/token-service";
import { handleV3PoolCreated } from "../v3-factory";

OkuV3Factory.PoolCreated.contractRegister(({ event, context }) => {
  context.addUniswapV3Pool(event.params.pool);
});

OkuV3Factory.PoolCreated.handler(async ({ event, context }) => {
  await handleV3PoolCreated(
    context,
    event.params.pool,
    event.params.token0,
    event.params.token1,
    Number.parseInt(event.params.fee.toString()),
    Number.parseInt(event.params.tickSpacing.toString()),
    BigInt(event.block.timestamp),
    event.chainId,
    SupportedProtocol.OKU_TRADE_V3,
    TokenService.shared
  );
});
