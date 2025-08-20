import assert from "assert";
import { BigDecimal, HandlerContext, Token } from "generated";
import sinon from "sinon";
import { encodeFunctionResult } from "viem";
import { ERC20_ABI } from "../../../src/common/abis";
import { ZERO_BIG_DECIMAL } from "../../../src/common/constants";
import { IndexerNetwork } from "../../../src/common/enums/indexer-network";
import { NetworkToken } from "../../../src/common/enums/network-token";
import { TokenService } from "../../../src/common/services/token-service";
import { ViemService } from "../../../src/common/services/viem-service";
import { HandlerContextCustomMock, mockReturnEffectCall as mockNextReturnEffectCall } from "../../mocks";

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

  it(`should call the effect to get the token metadata passing
    the token address and network (if the token does not exist
    and is not 0 Address) and return the token with the metadata`, async () => {
    let tokenMetadata = {
      decimals: 18,
      symbol: "ETH",
      name: "Ethereum",
      tokenAddress: "0xAaA0aa0a000000000000000000000000000000021",
    };

    mockNextReturnEffectCall(tokenMetadata);

    const tokenReturned = await sut.getOrCreateTokenEntity(context, network, tokenMetadata.tokenAddress);

    const expectedToken: Token = {
      id: IndexerNetwork.getEntityIdFromAddress(network, tokenMetadata.tokenAddress),
      decimals: tokenMetadata.decimals,
      symbol: tokenMetadata.symbol,
      name: tokenMetadata.name,
      tokenAddress: tokenMetadata.tokenAddress.toLowerCase(),
      totalTokenPooledAmount: ZERO_BIG_DECIMAL,
      totalValuePooledUsd: ZERO_BIG_DECIMAL,
      usdPrice: ZERO_BIG_DECIMAL,
    };

    assert.deepEqual(tokenReturned, expectedToken);
  });

  it("should get the token metadata from the address and network passed and return it", async () => {
    const symbol = "MTK";
    const name = "MaToke";
    const decimals = 21;

    const encodedName = encodeFunctionResult({
      functionName: "name",
      result: name,
      abi: ERC20_ABI,
    });

    const encodedSymbol = encodeFunctionResult({
      functionName: "symbol",
      result: symbol,
      abi: ERC20_ABI,
    });

    const encodedDecimals = encodeFunctionResult({
      functionName: "decimals",
      result: decimals,
      abi: ERC20_ABI,
    });

    viemService.getClient.returns({
      request: ({ params }: any) => {
        const call = params[0];
        const selector = call.data;

        switch (selector) {
          case "0x06fdde03": // name()
            return encodedName;
          case "0x95d89b41": // symbol()
            return encodedSymbol;
          case "0x313ce567": // decimals()
            return encodedDecimals;
          default:
            throw new Error("Unknown selector: " + selector);
        }
      },
    } as any);

    const tokenAddress = "0x0000000000000000000000000000000000000000";

    const result = await sut.getRemoteTokenMetadata(tokenAddress, network);

    assert.deepEqual(result, { decimals, symbol, name });
  });

  it("should return zero as decimals when calling 'getRemoteTokenMetadata' and the decimals are greater than 255", async () => {
    const encodedDecimals = encodeFunctionResult({
      functionName: "decimals",
      result: 998,
      abi: [
        ...ERC20_ABI.filter((item) => item.name !== "decimals"),
        {
          inputs: [],
          name: "decimals",
          outputs: [{ type: "uint24" }],
          stateMutability: "view",
          type: "function",
        },
      ],
    });

    viemService.getClient.returns({
      request: ({ params }: any) => {
        const call = params[0];
        const selector = call.data;

        switch (selector) {
          case "0x313ce567":
            return encodedDecimals;
          default:
            return;
        }
      },
    } as any);

    const tokenAddress = "0x0000000000000000000000000000000000000000";

    const result = await sut.getRemoteTokenMetadata(tokenAddress, network);

    assert.equal(result.decimals, 0);
  });

  it("should return a default token metadata when calling 'getRemoteTokenMetadata' and there is an error", async () => {
    viemService.getClient.returns({
      request: ({ params }: any) => {
        throw new Error("error");
      },
    } as any);

    const tokenAddress = "0x0000000000000000000000000000000000000000";

    const result = await sut.getRemoteTokenMetadata(tokenAddress, network);

    assert.deepEqual(result, { decimals: 18, symbol: "", name: "" });
  });

  it("should sanitize the symbol and the name after getting the token metadata when calling 'getRemoteTokenMetadata'", async () => {
    let invalidChars =
      "ABC ↑’👍™!@#$%^&*()-_=+[]{}|;:,./<>?\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\t\n\u000b\u000c\r\u000e\u000f\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f";

    const invalidCharsEncoded = encodeFunctionResult({
      functionName: "name",
      result: invalidChars,
      abi: ERC20_ABI,
    });

    viemService.getClient.returns({
      request: ({ params }: any) => {
        const call = params[0];
        const selector = call.data;

        switch (selector) {
          case "0x06fdde03": // name()
            return invalidCharsEncoded;
          case "0x95d89b41": // symbol()
            return invalidCharsEncoded;
          default:
            throw new Error("Unknown selector: " + selector);
        }
      },
    } as any);

    const tokenAddress = "0x0000000000000000000000000000000000000000";

    const result = await sut.getRemoteTokenMetadata(tokenAddress, network);
    console.log(result);

    assert.deepEqual(result, {
      decimals: 18,
      symbol: "ABC ↑’👍™!@#$%^&*()-_=+[]{}|;:,./<>?",
      name: "ABC ↑’👍™!@#$%^&*()-_=+[]{}|;:,./<>?",
    });
  });
});
