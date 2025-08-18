import assert from "assert";
import { IndexerNetwork } from "../../src/common/enums/indexer-network";
import { NetworkToken } from "../../src/common/enums/network-token";

describe("IndexerNetworkTests", () => {
  const envioRpcKey = "random-api-key";

  beforeEach(() => {
    process.env.ENVIO_RPC_KEY = envioRpcKey;
  });

  it("should return the correct chain id for ethereum", () => {
    assert.equal(IndexerNetwork.ETHEREUM, 1);
  });

  it("should return the correct chain id for base", () => {
    assert.equal(IndexerNetwork.BASE, 8453);
  });

  it("should return the correct chain id for scroll", () => {
    assert.equal(IndexerNetwork.SCROLL, 534352);
  });

  it("should return the correct chain id for unichain", () => {
    assert.equal(IndexerNetwork.UNICHAIN, 130);
  });

  it("should return the correct chain id for sepolia", () => {
    assert.equal(IndexerNetwork.SEPOLIA, 11155111);
  });

  it("should return the correct rpc url for ethereum", () => {
    assert.equal(
      IndexerNetwork.getRpcUrl(IndexerNetwork.ETHEREUM),
      `https://eth-mainnet.g.alchemy.com/v2/${envioRpcKey}`
    );
  });

  it("should return the correct rpc url for base", () => {
    assert.equal(IndexerNetwork.getRpcUrl(IndexerNetwork.BASE), `https://base-mainnet.g.alchemy.com/v2/${envioRpcKey}`);
  });

  it("should return the correct rpc url for scroll", () => {
    assert.equal(
      IndexerNetwork.getRpcUrl(IndexerNetwork.SCROLL),
      `https://scroll-mainnet.g.alchemy.com/v2/${envioRpcKey}`
    );
  });

  it("should return the correct rpc url for unichain", () => {
    assert.equal(
      IndexerNetwork.getRpcUrl(IndexerNetwork.UNICHAIN),
      `https://unichain-mainnet.g.alchemy.com/v2/${envioRpcKey}`
    );
  });

  it("should return the correct rpc url for sepolia", () => {
    assert.equal(
      IndexerNetwork.getRpcUrl(IndexerNetwork.SEPOLIA),
      `https://eth-sepolia.g.alchemy.com/v2/${envioRpcKey}`
    );
  });

  it(`should return the right entity id for the given address,
    based on the network in the format $network-$address`, () => {
    Object.values(IndexerNetwork)
      .filter((network) => typeof network === "number")
      .forEach((network) => {
        assert.equal(IndexerNetwork.getEntityIdFromAddress(network as number, "0x123"), `${network}-0x123`);
      });
  });

  it("should return the correct native token object for ethereum", () => {
    assert.deepEqual(IndexerNetwork.nativeToken(IndexerNetwork.ETHEREUM), NetworkToken.metadata(NetworkToken.ETH));
  });

  it("should return the correct native token object for base", () => {
    assert.deepEqual(IndexerNetwork.nativeToken(IndexerNetwork.BASE), NetworkToken.metadata(NetworkToken.ETH));
  });

  it("should return the correct native token object for scroll", () => {
    assert.deepEqual(IndexerNetwork.nativeToken(IndexerNetwork.SCROLL), NetworkToken.metadata(NetworkToken.ETH));
  });

  it("should return the correct native token object for unichain", () => {
    assert.deepEqual(IndexerNetwork.nativeToken(IndexerNetwork.UNICHAIN), NetworkToken.metadata(NetworkToken.ETH));
  });

  it("should return the correct native token object for sepolia", () => {
    assert.deepEqual(IndexerNetwork.nativeToken(IndexerNetwork.SEPOLIA), NetworkToken.metadata(NetworkToken.ETH));
  });

  it("should return the correct stablecoin addresses defined for ethereum", () => {
    assert.deepEqual(IndexerNetwork.stablecoinsAddresses(IndexerNetwork.ETHEREUM), [
      "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
      "0xdC035D45d973E3EC169d2276DDab16f1e407384F", // USDS
      "0x4c9edd5852cd905f086c759e8383e09bff1e68b3", // USDE
      "0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409", // FDUSD
      "0x6c3ea9036406852006290770bedfcaba0e23a0e8", // PYUSD
    ]);
  });

  it("should return the correct stablecoin addresses defined for base", () => {
    assert.deepEqual(IndexerNetwork.stablecoinsAddresses(IndexerNetwork.BASE), [
      "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC
      "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", // USDT
      "0x820c137fa70c8691f0e44dc420a5e53c168921dc", // USDS
      "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA", // USDbC
    ]);
  });

  it("should return the correct stablecoin addresses defined for scroll", () => {
    assert.deepEqual(IndexerNetwork.stablecoinsAddresses(IndexerNetwork.SCROLL), [
      "0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df", // USDT
      "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4", // USDC
    ]);
  });

  it("should return the correct stablecoin addresses defined for unichain", () => {
    assert.deepEqual(IndexerNetwork.stablecoinsAddresses(IndexerNetwork.UNICHAIN), [
      "0x078D782b760474a361dDA0AF3839290b0EF57AD6", // USDC
      "0x9151434b16b9763660705744891fA906F660EcC5", // USDT0
    ]);
  });

  it("should return the correct stablecoin addresses defined for sepolia", () => {
    assert.deepEqual(IndexerNetwork.stablecoinsAddresses(IndexerNetwork.SEPOLIA), [
      "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // USDC
    ]);
  });

  it("should return the correct wrapped native address for ethereum", () => {
    assert.equal(
      IndexerNetwork.wrappedNativeAddress(IndexerNetwork.ETHEREUM),
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
    );
  });

  it("should return the correct wrapped native address for base", () => {
    assert.equal(
      IndexerNetwork.wrappedNativeAddress(IndexerNetwork.BASE),
      "0x4200000000000000000000000000000000000006"
    );
  });

  it("should return the correct wrapped native address for scroll", () => {
    assert.equal(
      IndexerNetwork.wrappedNativeAddress(IndexerNetwork.SCROLL),
      "0x5300000000000000000000000000000000000004"
    );
  });

  it("should return the correct wrapped native address for unichain", () => {
    assert.equal(
      IndexerNetwork.wrappedNativeAddress(IndexerNetwork.UNICHAIN),
      "0x4200000000000000000000000000000000000006"
    );
  });

  it("should return the correct wrapped native address for sepolia", () => {
    assert.equal(
      IndexerNetwork.wrappedNativeAddress(IndexerNetwork.SEPOLIA),
      "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"
    );
  });
});
