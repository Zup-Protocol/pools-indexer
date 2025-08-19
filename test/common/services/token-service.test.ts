import assert from "assert";
import { BigDecimal, HandlerContext, Token } from "generated";
import sinon from "sinon";
import { ZERO_BIG_DECIMAL } from "../../../src/common/constants";
import { IndexerNetwork } from "../../../src/common/enums/indexer-network";
import { NetworkToken } from "../../../src/common/enums/network-token";
import { TokenService } from "../../../src/common/services/token-service";
import { ViemService } from "../../../src/common/services/viem-service";
import { HandlerContextCustomMock } from "../../mocks";

describe("TokenService", () => {
  let sut: TokenService;
  let context: HandlerContext;
  let viemService: sinon.SinonStubbedInstance<ViemService>;
  let network: IndexerNetwork;

  beforeEach(() => {
    context = HandlerContextCustomMock();
    viemService = sinon.createStubInstance(ViemService);
    network = IndexerNetwork.ETHEREUM;

    sut = new TokenService(viemService);
  });

  afterEach(() => {
    sinon.restore();
    context;
  });

  it(`should return the current existing entity
    if calling 'getOrCreateTokenEntity' with an id that already exists`, async () => {
    const tokenAddress = "0x0000000000000000000000000000000000000000";
    const tokenSetBefore: Token = {
      id: IndexerNetwork.getEntityIdFromAddress(network, tokenAddress),
      decimals: 18,
      symbol: "ETH",
      name: "Ethereum",
      tokenAddress: tokenAddress,
      totalTokenPooledAmount: BigDecimal("937289.0"),
      totalValuePooledUsd: BigDecimal("798765.122"),
      usdPrice: BigDecimal("121.1"),
    };

    context.Token.set(tokenSetBefore);

    const tokenReturned = await sut.getOrCreateTokenEntity(context, network, tokenAddress);
    assert.deepEqual(tokenReturned, tokenSetBefore);
  });

  it(`should create the hyperliquid native token if calling 'getOrCreateTokenEntity'
      with zero address, the network hyper evm, and it does not exist yet`, async () => {
    network = IndexerNetwork.HYPER_EVM;
    const tokenAddress = "0x0000000000000000000000000000000000000000";

    const tokenReturned = await sut.getOrCreateTokenEntity(context, network, tokenAddress);
    const expectedToken: Token = {
      ...NetworkToken.metadata(NetworkToken.HYPE),
      id: IndexerNetwork.getEntityIdFromAddress(network, tokenAddress),
      tokenAddress: tokenAddress,
      totalTokenPooledAmount: ZERO_BIG_DECIMAL,
      usdPrice: ZERO_BIG_DECIMAL,
      totalValuePooledUsd: ZERO_BIG_DECIMAL,
    };

    assert.deepEqual(tokenReturned, expectedToken);
  });

  it(`should create the eth native token if calling 'getOrCreateTokenEntity'
      with zero address, the network ethereum, and it does not exist yet`, async () => {
    network = IndexerNetwork.ETHEREUM;
    const tokenAddress = "0x0000000000000000000000000000000000000000";

    const tokenReturned = await sut.getOrCreateTokenEntity(context, network, tokenAddress);
    const expectedToken: Token = {
      ...NetworkToken.metadata(NetworkToken.ETH),
      id: IndexerNetwork.getEntityIdFromAddress(network, tokenAddress),
      tokenAddress: tokenAddress,
      totalTokenPooledAmount: ZERO_BIG_DECIMAL,
      usdPrice: ZERO_BIG_DECIMAL,
      totalValuePooledUsd: ZERO_BIG_DECIMAL,
    };

    assert.deepEqual(tokenReturned, expectedToken);
  });
});
