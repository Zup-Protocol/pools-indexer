import assert from "assert";
import { IndexerNetwork } from "../../../src/common/enums/indexer-network";
import { V2PositionManagerAddress } from "../../../src/v2-pools/common/v2-position-manager-address";

describe("V2PositionManagerAddress", () => {
  it("should return the correct Uniswap V2 position manager address for base", () => {
    assert.equal(V2PositionManagerAddress.uniswap(IndexerNetwork.BASE), "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24");
  });

  it("should return the correct Uniswap V2 position manager address for ethereum", () => {
    assert.equal(
      V2PositionManagerAddress.uniswap(IndexerNetwork.ETHEREUM),
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
    );
  });

  it("should return the correct Uniswap V2 position manager address for unichain", () => {
    assert.equal(
      V2PositionManagerAddress.uniswap(IndexerNetwork.UNICHAIN),
      "0x284f11109359a7e1306c3e447ef14d38400063ff"
    );
  });

  it("should return the correct Uniswap V2 position manager address for unichain", () => {
    assert.equal(
      V2PositionManagerAddress.uniswap(IndexerNetwork.SEPOLIA),
      "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3"
    );
  });

  it("should throw when calling uniswap on scroll", () => {
    assert.throws(
      () => V2PositionManagerAddress.uniswap(IndexerNetwork.SCROLL),
      Error(`Uniswap V2 position manager is not available on Scroll`)
    );
  });

  it("should throw when calling uniswap on hyperEVM", () => {
    assert.throws(
      () => V2PositionManagerAddress.uniswap(IndexerNetwork.HYPER_EVM),
      Error(`Uniswap V2 position manager is not available on Hyper EVM`)
    );
  });

  it("should throw when calling uniswap on plasma", () => {
    assert.throws(
      () => V2PositionManagerAddress.uniswap(IndexerNetwork.PLASMA),
      Error(`Uniswap V2 position manager is not available on Plasma`)
    );
  });
});
