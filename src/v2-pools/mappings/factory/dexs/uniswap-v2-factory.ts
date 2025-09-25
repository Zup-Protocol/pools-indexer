import { UniswapV2Factory } from "generated";
import { SupportedProtocol } from "../../../../common/enums/supported-protocol";
import { TokenService } from "../../../../common/services/token-service";
import { handleV2PoolCreated } from "../v2-factory";

UniswapV2Factory.PairCreated.contractRegister(({ event, context }) => {
  context.addUniswapV2Pool(event.params.pair);
});

UniswapV2Factory.PairCreated.handler(async ({ event, context }) => {
  await handleV2PoolCreated({
    context,
    chainId: event.chainId,
    eventTimestamp: BigInt(event.block.timestamp),
    token0Address: event.params.token0,
    token1Address: event.params.token1,
    poolAddress: event.params.pair,
    feeTier: 3000, // Uniswap v2 has a constant fee of 0.3%
    protocol: SupportedProtocol.UNISWAP_V2,
    tokenService: TokenService.shared,
  });
});
