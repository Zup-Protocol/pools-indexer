import assert from "assert";
import { IndexerNetwork } from "../../src/common/enums/indexer-network";
import { Permit2Address } from "../../src/common/permit2-address";

describe("Permit2Address", () => {
  it("uniswap returns correct address for mainnet", () => {
    assert.equal(Permit2Address.uniswap(IndexerNetwork.ETHEREUM), "0x000000000022D473030F116dDEE9F6B43aC78BA3");
  });

  it("uniswap returns correct address for sepolia", () => {
    assert.equal(Permit2Address.uniswap(IndexerNetwork.SEPOLIA), "0x000000000022D473030F116dDEE9F6B43aC78BA3");
  });

  it("uniswap returns correct address for scroll", () => {
    assert.equal(Permit2Address.uniswap(IndexerNetwork.SCROLL), "0xFcf5986450E4A014fFE7ad4Ae24921B589D039b5");
  });

  it("uniswap returns correct address for base", () => {
    assert.equal(Permit2Address.uniswap(IndexerNetwork.BASE), "0x000000000022D473030F116dDEE9F6B43aC78BA3");
  });

  it("uniswap returns correct address for unichain", () => {
    assert.equal(Permit2Address.uniswap(IndexerNetwork.UNICHAIN), "0x000000000022D473030F116dDEE9F6B43aC78BA3");
  });

  it("pancakeSWap returns correct address for base", () => {
    assert.equal(Permit2Address.pancakeSwap(IndexerNetwork.BASE), "0x31c2F6fcFf4F8759b3Bd5Bf0e1084A055615c768");
  });
});
