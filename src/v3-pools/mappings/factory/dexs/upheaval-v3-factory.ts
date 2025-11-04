import { UpheavalV3Factory } from "generated";
import { SupportedProtocol } from "../../../../common/enums/supported-protocol";
import { TokenService } from "../../../../common/services/token-service";
import { handleV3PoolCreated } from "../v3-factory";

UpheavalV3Factory.PoolCreated.contractRegister(({ event, context }) => {
  context.addPancakeSwapV3Pool(event.params.pool);
});

UpheavalV3Factory.PoolCreated.handler(async ({ event, context }) => {
  await handleV3PoolCreated(
    context,
    event.params.pool,
    event.params.token0,
    event.params.token1,
    Number.parseInt(event.params.fee.toString()),
    Number.parseInt(event.params.tickSpacing.toString()),
    BigInt(event.block.timestamp),
    event.chainId,
    SupportedProtocol.UPHEAVAL_V3,
    TokenService.shared
  );
});
