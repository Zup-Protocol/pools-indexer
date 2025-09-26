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

  it("uniswap throws for hyperEVM", () => {
    assert.throws(
      () => Permit2Address.uniswap(IndexerNetwork.HYPER_EVM),
      Error(`Uniswap is not supported on HyperEVM`)
    );
  });

  it("uniswap throws for plasma", () => {
    assert.throws(() => Permit2Address.uniswap(IndexerNetwork.HYPER_EVM), Error(`Uniswap is not supported on Plasma`));
  });

  it("pancakeSwap returns correct address for base", () => {
    assert.equal(Permit2Address.pancakeSwap(IndexerNetwork.BASE), "0x31c2F6fcFf4F8759b3Bd5Bf0e1084A055615c768");
  });

  it("pancakeSwap throws for Ethereum", () => {
    assert.throws(
      () => Permit2Address.pancakeSwap(IndexerNetwork.ETHEREUM),
      Error(`PancakeSwap is not supported on Mainnet`)
    );
  });

  it("pancakeSwap throws for Unichain", () => {
    assert.throws(
      () => Permit2Address.pancakeSwap(IndexerNetwork.UNICHAIN),
      Error(`PancakeSwap is not supported on Unichain`)
    );
  });

  it("pancakeSwap throws for Scroll", () => {
    assert.throws(
      () => Permit2Address.pancakeSwap(IndexerNetwork.SCROLL),
      Error(`PancakeSwap is not supported on Scroll`)
    );
  });

  it("pancakeSwap throws for Sepolia", () => {
    assert.throws(
      () => Permit2Address.pancakeSwap(IndexerNetwork.SEPOLIA),
      Error(`PancakeSwap is not supported on Sepolia`)
    );
  });

  it("pancakeSwap throws for HyperEVM", () => {
    assert.throws(
      () => Permit2Address.pancakeSwap(IndexerNetwork.HYPER_EVM),
      Error(`PancakeSwap is not supported on HyperEVM`)
    );
  });

  it("pancakeSwap throws for Plasma", () => {
    assert.throws(
      () => Permit2Address.pancakeSwap(IndexerNetwork.HYPER_EVM),
      Error(`PancakeSwap is not supported on Plasma`)
    );
  });
});
