export const algebraPool1_2_1FactoryAbi = [
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
] as const;

export const ERC20_ABI = [
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
