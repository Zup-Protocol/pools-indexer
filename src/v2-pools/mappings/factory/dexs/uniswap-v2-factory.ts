import { UniswapV2Factory } from "generated";
import { SupportedProtocol } from "../../../../common/enums/supported-protocol";
import { TokenService } from "../../../../common/services/token-service";
import { handleV2PoolCreated } from "../v2-factory";

UniswapV2Factory.PairCreated.contractRegister(({ event, context }) => {
  context.addUniswapV2Pool(event.params.pair);
});

UniswapV2Factory.PairCreated.handler(async ({ event, context }) => {
  await handleV2PoolCreated(
    context,
    event.chainId,
    BigInt(event.block.timestamp),
    event.params.token0,
    event.params.token1,
    event.params.pair,
    3000,
    SupportedProtocol.UNISWAP_V2,
    TokenService.shared
  );
});
