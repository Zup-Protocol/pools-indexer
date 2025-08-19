import { AerodromeV3Factory } from "generated";
import { SupportedProtocol } from "../../../../common/enums/supported-protocol";
import { TokenService } from "../../../../common/services/token-service";
import { handleV3PoolCreated } from "../v3-factory";

AerodromeV3Factory.PoolCreated.contractRegister(({ event, context }) => {
  context.addAerodromeV3Pool(event.params.pool);
});

AerodromeV3Factory.PoolCreated.handler(async ({ event, context }) => {
  await handleV3PoolCreated(
    context,
    event.params.pool,
    event.params.token0,
    event.params.token1,
    0,
    Number.parseInt(event.params.tickSpacing.toString()),
    BigInt(event.block.timestamp),
    event.chainId,
    SupportedProtocol.AERODROME_V3,
    TokenService.shared
  );
});
