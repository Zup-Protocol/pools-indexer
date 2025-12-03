import { UpheavalV3Factory } from "generated";
import { SupportedProtocol } from "../../../../common/enums/supported-protocol";
import { TokenService } from "../../../../common/services/token-service";
import { handleV3PoolCreated } from "../v3-factory";

UpheavalV3Factory.PoolCreated.contractRegister(({ event, context }) => {
  context.addPancakeSwapV3Pool(event.params.pool);
});

UpheavalV3Factory.PoolCreated.handler(async ({ event, context }) => {
  await handleV3PoolCreated({
    context,
    poolAddress: event.params.pool,
    token0Address: event.params.token0,
    token1Address: event.params.token1,
    feeTier: Number.parseInt(event.params.fee.toString()),
    tickSpacing: Number.parseInt(event.params.tickSpacing.toString()),
    eventTimestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    protocol: SupportedProtocol.UPHEAVAL_V3,
    tokenService: TokenService.shared,
  });
});
