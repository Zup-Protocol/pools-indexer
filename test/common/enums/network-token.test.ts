import assert from "assert";
import { NetworkToken } from "../../../src/common/enums/network-token";

describe("NetworkToken", () => {
  it("should return the correct metadata for ETH", () => {
    const metadata = NetworkToken.metadata(NetworkToken.ETH);
    assert.deepEqual(metadata, {
      decimals: 18,
      name: "Ether",
      symbol: "ETH",
    });
  });

  it("should return the correct metadata for HYPE", () => {
    const metadata = NetworkToken.metadata(NetworkToken.HYPE);
    assert.deepEqual(metadata, {
      decimals: 18,
      name: "Hyperliquid",
      symbol: "HYPE",
    });
  });

  it("should return the correct metadata for Plasma", () => {
    const metadata = NetworkToken.metadata(NetworkToken.XPL);
    assert.deepEqual(metadata, {
      decimals: 18,
      name: "Plasma",
      symbol: "XPL",
    });
  });
});
