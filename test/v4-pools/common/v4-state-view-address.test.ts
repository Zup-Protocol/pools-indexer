import assert from "assert";
import { IndexerNetwork } from "../../../src/common/enums/indexer-network";
import { V4StateViewAddress } from "../../../src/v4-pools/common/v4-state-view-address";

describe("V4StateViewAddress", () => {
  it("uniswap returns correct address for mainnet", () => {
    assert.equal(V4StateViewAddress.uniswap(IndexerNetwork.ETHEREUM), "0x7ffe42c4a5deea5b0fec41c94c136cf115597227");
  });

  it("uniswap returns correct address for sepolia", () => {
    assert.equal(V4StateViewAddress.uniswap(IndexerNetwork.SEPOLIA), "0xe1dd9c3fa50edb962e442f60dfbc432e24537e4c");
  });

  it("uniswap returns correct address for base", () => {
    assert.equal(V4StateViewAddress.uniswap(IndexerNetwork.BASE), "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71");
  });

  it("uniswap returns correct address for unichain", () => {
    assert.equal(V4StateViewAddress.uniswap(IndexerNetwork.UNICHAIN), "0x86e8631a016f9068c3f085faf484ee3f5fdee8f2");
  });

  it("uniswap throws  for scroll", () => {
    assert.throws(() => V4StateViewAddress.uniswap(IndexerNetwork.SCROLL));
  });

  it("uniswap throws  for hyperEVM", () => {
    assert.throws(() => V4StateViewAddress.uniswap(IndexerNetwork.HYPER_EVM));
  });
});
