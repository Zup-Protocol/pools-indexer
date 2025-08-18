import assert from "assert";
import { algebraPool1_2_1FactoryAbi, ERC20_ABI } from "../../src/common/abis";

describe("ABIs", () => {
  it("Should return the correct abi for algebra 1.2.1 pool", () => {
    const expectedAbi = [
      {
        inputs: [],
        name: "defaultConfigurationForPool",
        outputs: [
          {
            internalType: "uint16",
            name: "communityFee",
            type: "uint16",
          },
          {
            internalType: "int24",
            name: "tickSpacing",
            type: "int24",
          },
          {
            internalType: "uint16",
            name: "fee",
            type: "uint16",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ];

    assert.deepEqual(expectedAbi, algebraPool1_2_1FactoryAbi);
  });

  it("Should return the correct abi when calling ERC20_ABI", () => {
    const expectedAbi = [
      {
        inputs: [],
        name: "name",
        outputs: [{ type: "string" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "NAME",
        outputs: [{ type: "bytes32" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "symbol",
        outputs: [{ type: "string" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "SYMBOL",
        outputs: [{ type: "bytes32" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "decimals",
        outputs: [{ type: "uint8" }],
        stateMutability: "view",
        type: "function",
      },
    ] as const;

    assert.deepEqual(ERC20_ABI, expectedAbi);
  });
});
