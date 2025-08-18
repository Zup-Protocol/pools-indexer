import { VelodromeV3Factory } from "generated";
import { SupportedProtocol } from "../../../../common/enums/supported-protocol";
import { TokenService } from "../../../../common/token-service";
import { handleV3PoolCreated } from "../v3-factory";

VelodromeV3Factory.PoolCreated.contractRegister(async ({ event, context }) => {
  context.addAerodromeV3Pool(event.params.pool);
});

VelodromeV3Factory.PoolCreated.handler(async ({ event, context }) => {
  await handleV3PoolCreated(
    context,
    event.params.pool,
    event.params.token0,
    event.params.token1,
    0,
    Number.parseInt(event.params.tickSpacing.toString()),
    BigInt(event.block.timestamp),
    event.chainId,
    SupportedProtocol.VELODROME_V3,
    new TokenService(context, event.chainId)
  );
});
