import assert from "assert";
import { IndexerNetwork } from "../../../src/common/enums/indexer-network";
import { V4PositionManagerAddress } from "../../../src/v4-pools/common/v4-position-manager-address";

describe("V4PositionManagerAddress", () => {
  it("uniswap returns correct address for sepolia", () => {
    assert.equal(
      V4PositionManagerAddress.uniswap(IndexerNetwork.SEPOLIA),
      "0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4"
    );
  });

  it("uniswap returns correct address for unichain", () => {
    assert.equal(
      V4PositionManagerAddress.uniswap(IndexerNetwork.UNICHAIN),
      "0x4529A01c7A0410167c5740C487A8DE60232617bf"
    );
  });

  it("uniswap returns correct address for mainnet", () => {
    assert.equal(
      V4PositionManagerAddress.uniswap(IndexerNetwork.ETHEREUM),
      "0xbD216513d74C8cf14cf4747E6AaA6420FF64ee9e"
    );
  });

  it("uniswap returns correct address for base", () => {
    assert.equal(V4PositionManagerAddress.uniswap(IndexerNetwork.BASE), "0x7c5f5a4bbd8fd63184577525326123b519429bdc");
  });

  it("uniswap throws for scroll", () => {
    assert.throws(() => V4PositionManagerAddress.uniswap(IndexerNetwork.SCROLL));
  });

  it("uniswap throws for hyperEVM", () => {
    assert.throws(() => V4PositionManagerAddress.uniswap(IndexerNetwork.HYPER_EVM));
  });

  it("pancakeSwap returns correct address for base", () => {
    assert.equal(
      V4PositionManagerAddress.pancakeSwap(IndexerNetwork.BASE),
      "0x55f4c8abA71A1e923edC303eb4fEfF14608cC226"
    );
  });

  it("pancakeSwap throws for mainnet", () => {
    assert.throws(() => V4PositionManagerAddress.pancakeSwap(IndexerNetwork.ETHEREUM));
  });

  it("pancakeSwap throws for scroll", () => {
    assert.throws(() => V4PositionManagerAddress.pancakeSwap(IndexerNetwork.SCROLL));
  });

  it("pancakeSwap throws for hyperEVM", () => {
    assert.throws(() => V4PositionManagerAddress.pancakeSwap(IndexerNetwork.HYPER_EVM));
  });

  it("pancakeSwap throws for Sepolia", () => {
    assert.throws(() => V4PositionManagerAddress.pancakeSwap(IndexerNetwork.SEPOLIA));
  });

  it("pancakeSwap throws for unichain", () => {
    assert.throws(() => V4PositionManagerAddress.pancakeSwap(IndexerNetwork.UNICHAIN));
  });
});
