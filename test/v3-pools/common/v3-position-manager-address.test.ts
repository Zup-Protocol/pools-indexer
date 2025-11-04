import assert from "assert";
import { IndexerNetwork } from "../../../src/common/enums/indexer-network";
import { V3PositionManagerAddress } from "../../../src/v3-pools/common/v3-position-manager-address";

describe("V3PositionManagerAddress", () => {
  it("should return the correct address for aerodrome on base", async () => {
    assert.equal(V3PositionManagerAddress.aerodrome(IndexerNetwork.BASE), "0x827922686190790b37229fd06084350E74485b72");
  });

  it("should throw when calling aerodrome on a not supported network", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.aerodrome(IndexerNetwork.ETHEREUM);
    }, Error(`Aerodrome is not supported on ${IndexerNetwork.ETHEREUM}`));
  });

  it("should return the correct address for uniswap on base", async () => {
    assert.equal(V3PositionManagerAddress.uniswap(IndexerNetwork.BASE), "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1");
  });

  it("should return the correct address for uniswap on ethereum", async () => {
    assert.equal(
      V3PositionManagerAddress.uniswap(IndexerNetwork.ETHEREUM),
      "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"
    );
  });

  it("should return the correct address for uniswap on unichain", async () => {
    assert.equal(
      V3PositionManagerAddress.uniswap(IndexerNetwork.UNICHAIN),
      "0x943e6e07a7e8e791dafc44083e54041d743c46e9"
    );
  });

  it("should return the correct address for uniswap on scroll", async () => {
    assert.equal(V3PositionManagerAddress.uniswap(IndexerNetwork.SCROLL), "0xB39002E4033b162fAc607fc3471E205FA2aE5967");
  });

  it("should return the correct address for uniswap on sepolia", async () => {
    assert.equal(
      V3PositionManagerAddress.uniswap(IndexerNetwork.SEPOLIA),
      "0x1238536071E1c677A632429e3655c799b22cDA52"
    );
  });

  it("should return the correct address for uniswap on plasma", async () => {
    assert.equal(V3PositionManagerAddress.uniswap(IndexerNetwork.PLASMA), "0x743E03cceB4af2efA3CC76838f6E8B50B63F184c");
  });

  it("should throw when calling uniswap on hyper_evm", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.uniswap(IndexerNetwork.HYPER_EVM);
    }, Error("Uniswap is not supported on HyperEVM"));
  });

  it("should return the correct address for pancakeSwap on base", async () => {
    assert.equal(
      V3PositionManagerAddress.pancakeSwap(IndexerNetwork.BASE),
      "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364"
    );
  });

  it("should return the correct address for pancakeSwap on ethereum", async () => {
    assert.equal(
      V3PositionManagerAddress.pancakeSwap(IndexerNetwork.ETHEREUM),
      "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364"
    );
  });

  it("should throw when calling pancakeSwap on unichain", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.pancakeSwap(IndexerNetwork.UNICHAIN);
    }, Error("PancakeSwap is not supported on Unichain"));
  });

  it("should return the correct address for pancakeSwap on scroll", async () => {
    assert.equal(
      V3PositionManagerAddress.pancakeSwap(IndexerNetwork.SCROLL),
      "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364"
    );
  });

  it("should return the correct address for pancakeSwap on sepolia", async () => {
    assert.equal(
      V3PositionManagerAddress.pancakeSwap(IndexerNetwork.SEPOLIA),
      "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364"
    );
  });

  it("should throw when calling pancakeSwap on hyper_evm", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.pancakeSwap(IndexerNetwork.HYPER_EVM);
    }, Error("PancakeSwap is not supported on HyperEVM"));
  });

  it("should throw when calling pancakeSwap on plasma", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.pancakeSwap(IndexerNetwork.PLASMA);
    }, Error("PancakeSwap is not supported on Plasma"));
  });

  it("should return the correct address for sushiSwap on base", async () => {
    assert.equal(V3PositionManagerAddress.sushiSwap(IndexerNetwork.BASE), "0x80C7DD17B01855a6D2347444a0FCC36136a314de");
  });

  it("should return the correct address for sushiSwap on ethereum", async () => {
    assert.equal(
      V3PositionManagerAddress.sushiSwap(IndexerNetwork.ETHEREUM),
      "0x2214A42d8e2A1d20635c2cb0664422c528B6A432"
    );
  });

  it("should throw when calling sushiSwap on unichain", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.sushiSwap(IndexerNetwork.UNICHAIN);
    }, Error("SushiSwap is not supported on Unichain"));
  });

  it("should throw when calling sushiSwap on plasma", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.sushiSwap(IndexerNetwork.PLASMA);
    }, Error("SushiSwap is not supported on Plasma"));
  });

  it("should return the correct address for sushiSwap on scroll", async () => {
    assert.equal(
      V3PositionManagerAddress.sushiSwap(IndexerNetwork.SCROLL),
      "0x0389879e0156033202C44BF784ac18fC02edeE4f"
    );
  });

  it("should throw when calling sushiSwap on sepolia", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.sushiSwap(IndexerNetwork.SEPOLIA);
    }, Error("SushiSwap is not supported on Sepolia"));
  });

  it("should throw when calling sushiSwap on hyper_evm", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.sushiSwap(IndexerNetwork.HYPER_EVM);
    }, Error("SushiSwap is not supported on HyperEVM"));
  });

  it("should return the correct address for zebra on scroll", async () => {
    assert.equal(V3PositionManagerAddress.zebra(IndexerNetwork.SCROLL), "0x349B654dcbce53943C8e87F914F62ae9526C6681");
  });

  it("should throw when calling zebra on unsupported network", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.zebra(IndexerNetwork.BASE);
    }, Error(`Zebra is not supported on ${IndexerNetwork.BASE}`));
  });

  it("should return the correct address for baseSwap on base", async () => {
    assert.equal(V3PositionManagerAddress.baseSwap(IndexerNetwork.BASE), "0xDe151D5c92BfAA288Db4B67c21CD55d5826bCc93");
  });

  it("should throw when calling baseSwap on unsupported network", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.baseSwap(IndexerNetwork.ETHEREUM);
    }, Error(`BaseSwap is not supported on ${IndexerNetwork.ETHEREUM}`));
  });

  it("should return the correct address for alienBase on base", async () => {
    assert.equal(V3PositionManagerAddress.alienBase(IndexerNetwork.BASE), "0xB7996D1ECD07fB227e8DcA8CD5214bDfb04534E5");
  });

  it("should throw when calling alienBase on unsupported network", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.alienBase(IndexerNetwork.ETHEREUM);
    }, Error(`AlienBase is not supported on ${IndexerNetwork.ETHEREUM}`));
  });

  it("should return the correct address for velodrome on unichain", async () => {
    assert.equal(
      V3PositionManagerAddress.velodrome(IndexerNetwork.UNICHAIN),
      "0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702"
    );
  });

  it("should throw when calling velodrome on ethereum", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.velodrome(IndexerNetwork.ETHEREUM);
    }, Error(`Velodrome is not supported on Mainnet`));
  });

  it("should throw when calling velodrome on plasma", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.velodrome(IndexerNetwork.PLASMA);
    }, Error(`Velodrome is not supported on Plasma`));
  });

  it("should throw when calling velodrome on base", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.velodrome(IndexerNetwork.BASE);
    }, Error(`Velodrome is not supported on Base`));
  });

  it("should throw when calling velodrome on scroll", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.velodrome(IndexerNetwork.SCROLL);
    }, Error(`Velodrome is not supported on Scroll`));
  });

  it("should throw when calling velodrome on Sepolia", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.velodrome(IndexerNetwork.SEPOLIA);
    }, Error(`Velodrome is not supported on Sepolia`));
  });

  it("should throw when calling velodrome on HyperEVM", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.velodrome(IndexerNetwork.HYPER_EVM);
    }, Error(`Velodrome is not supported on HyperEVM`));
  });

  it("should return the correct address for honeypop on scroll", async () => {
    assert.equal(
      V3PositionManagerAddress.honeypop(IndexerNetwork.SCROLL),
      "0xB6F8D24e28bF5b8AdD2e7510f84F3b9ef03B3435"
    );
  });

  it("should throw when calling honeypop on unsupported network", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.honeypop(IndexerNetwork.BASE);
    }, Error(`Honeypop is not supported on ${IndexerNetwork.BASE}`));
  });

  it("should return the correct address for gliquid on hyper_evm", async () => {
    assert.equal(
      V3PositionManagerAddress.gliquid(IndexerNetwork.HYPER_EVM),
      "0x69D57B9D705eaD73a5d2f2476C30c55bD755cc2F"
    );
  });

  it("should throw when calling gliquid on unsupported network", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.gliquid(IndexerNetwork.BASE);
    }, Error(`Gliquid is not supported on ${IndexerNetwork.BASE}`));
  });

  it("should return the correct address for hyperSwap on hyper_evm", async () => {
    assert.equal(
      V3PositionManagerAddress.hyperSwap(IndexerNetwork.HYPER_EVM),
      "0x6eDA206207c09e5428F281761DdC0D300851fBC8"
    );
  });

  it("should throw when calling hyperSwap on unsupported network", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.hyperSwap(IndexerNetwork.BASE);
    }, Error(`HyperSwap is not supported on ${IndexerNetwork.BASE}`));
  });

  it("should return the correct address for projectX on hyper_evm", async () => {
    assert.equal(
      V3PositionManagerAddress.projectX(IndexerNetwork.HYPER_EVM),
      "0xeaD19AE861c29bBb2101E834922B2FEee69B9091"
    );
  });

  it("should throw when calling projectX on unsupported network", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.projectX(IndexerNetwork.BASE);
    }, Error(`Project X is not supported on ${IndexerNetwork.BASE}`));
  });

  it("should return the correct address for hybra on hyper_evm", async () => {
    assert.equal(
      V3PositionManagerAddress.hybra(IndexerNetwork.HYPER_EVM),
      "0x934C4f47B2D3FfcA0156A45DEb3A436202aF1efa"
    );
  });

  it("should throw when calling hybra on unsupported network", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.hybra(IndexerNetwork.BASE);
    }, Error(`Hybra is not supported on ${IndexerNetwork.BASE}`));
  });

  it("should return the correct address for kittenSwap on hyper_evm", async () => {
    assert.equal(
      V3PositionManagerAddress.kittenSwap(IndexerNetwork.HYPER_EVM),
      "0x9ea4459c8DefBF561495d95414b9CF1E2242a3E2"
    );
  });

  it("should throw when calling kittenSwap on unsupported network", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.kittenSwap(IndexerNetwork.BASE);
    }, Error(`KittenSwap is not supported on ${IndexerNetwork.BASE}`));
  });

  it("should throw when calling ultraSolid on unsupported network", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.ultraSolid(IndexerNetwork.BASE);
    }, Error(`UltraSolid is not supported on ${IndexerNetwork.BASE}`));
  });

  it("should return the correct address for ultraSolid on hyper_evm", async () => {
    assert.equal(
      V3PositionManagerAddress.ultraSolid(IndexerNetwork.HYPER_EVM),
      "0xE7ffA0ee20Deb1613489556062Fa8cec690C3c02"
    );
  });

  it("should throw when calling upheaval on unsupported network", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.upheaval(IndexerNetwork.BASE);
    }, Error(`Upheaval is not supported on ${IndexerNetwork.BASE}`));
  });

  it("should return the correct address for upheaval on hyper_evm", async () => {
    assert.equal(
      V3PositionManagerAddress.upheaval(IndexerNetwork.HYPER_EVM),
      "0xC8352A2EbA29F4d9BD4221c07D3461BaCc779088"
    );
  });

  it("should throw when calling hxFinance on unsupported network", async () => {
    assert.throws(() => {
      V3PositionManagerAddress.hxFinance(IndexerNetwork.BASE);
    }, Error(`HX Finance is not supported on ${IndexerNetwork.BASE}`));
  });

  it("should return the correct address for hxFinance on hyper_evm", async () => {
    assert.equal(
      V3PositionManagerAddress.hxFinance(IndexerNetwork.HYPER_EVM),
      "0x578D8A2D07B60b12993559f1DDF90EB2af3eA496"
    );
  });
});
