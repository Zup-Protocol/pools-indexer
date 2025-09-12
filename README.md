# Zup Dexs Indexer

This is the primary indexer used by the Zup Protocol to calculate yields. It aggregates data from all protocols supported by Zup across different networks.

### Table of Contents

- [Dependencies](#dependencies)
- [Installation](#installation)
- [Running tests](#running-tests)
- [Running the indexer locally](#running-the-indexer-locally)
- [Adding a new network](#adding-a-new-network)
- [Adding new DEXs](#adding-new-dexs)
  - [Adding a new V2 DEX](#adding-a-new-v2-dex)
  - [Adding a new V3 DEX](#adding-a-new-v3-dex)
  - [Adding a new V4 DEX](#adding-a-new-v4-dex)

## Dependencies

- **Node.js**

  - To know if Node.js is installed, run `node --version` you should see a response like `vX.X.X`.
  - If Node.js is not installed, head over to [How to install Node.js](https://nodejs.org/en/learn/getting-started/how-to-install-nodejs)

- **Docker (required only if you want to run the indexer locally)**

  - To know if Docker is installed, run `docker --version` you should see a response like `Docker version X.X.X`.
  - If Docker is not installed, head over to [How to install Docker](https://docs.docker.com/get-docker/)

- **pnpm**
  - To know if pnpm is installed, run `pnpm --version` you should see a response like `x.x.x`.
  - If pnpm is not installed, head over to [pnpm installation](https://pnpm.io/installation)

## Installation

1. Clone the repository
2. run `pnpm install`
3. if you are using alchemy RPCs, set the env file with your alchemy api key (example at [.env_example](./.env_example)). If you are not using alchemy, you can change the paid rpc url used by the indexer at [indexer-network.ts](./src/common/enums/indexer-network.ts) in the function `getPaidRPCUrl`.

## Running tests

To run all the tests, just open your terminal and type:

```bash
pnpm test
```

## Running the indexer locally

To run the indexer locally, ensure you have Docker running and run:

```bash
pnpm dev
```

Envio will immediately start syncing the indexer locally and will print the logs in the terminal.

## Adding a new network

To add a new network to the indexer, you need to do a few things:

1. Head over to the end of the [config.yaml](./config.yaml) file, at the `networks` section, and add a new entry for the new network, specifying the `id`, `start_block`, `confirmed_block_threshold`, and the contracts that you want to index in this new network.
   - The `id` field should be exactly the same as the chain id for the network. _Don't know the chain id? head over to [Chainlist](https://chainlist.org/) and look for the chain id._
   - The `start_block` should be the block number where the oldest contract was deployed.
   - The `confirmed_block_threshold` is the number of blocks that you want to consider as confirmed, usually 3 minutes (Block number may vary for different networks).
2. Add a new entry in the `IndexerNetwork` enum at [indexer-network.ts](./src/common/enums/indexer-network.ts) for the new network. The enum value should be the exact one defined in the `id` field in the [config.yaml](./config.yaml). Which should be the chain id of the network
3. Add a new entry for every function in `IndexerNetwork` namespace, that needs to be configured per network, at [indexer-network.ts](./src/common/enums/indexer-network.ts). Things such RPC urls, stablecoins addresses, wrapped native addresses, etc.
4. Modify all the files that are using the `IndexerNetwork` networks to specify addresses or params per network, and if applicable add a new entry specifying the address for the new network, in case it's not applicable, should throw an error.

   - [V2 Position Manager Address](./src/v2-pools/common/v2-position-manager-address.ts)
   - [V3 Position Manager Address](./src/v3-pools/common/v3-position-manager-address.ts)
   - [V4 Position Manager Address](./src/v4-pools/common/v4-position-manager-address.ts)
   - [Permit2 Address](./src/common/permit2-address.ts)
   - [V4 State View Address](./src/v4-pools/common/v4-state-view-address.ts)

## Adding new DEXs

### Adding a new V2 DEX

1. Modify the config file for the indexer [config.yaml](./config.yaml) to include the new DEX:

   - You should add the factory contract of the DEX in the `contracts` section, following the same pattern as the other DEXs.
   - In case that this new DEX pool events are different from the original UniswapV2, some additional things are required:
     - You should add its ABI in the [abis](./abis/) folder. For the Pair and the Factory.
     - A new contract for this DEX pool must be added in the config file, with the correct events and handlers.
     - You should create personalized handlers for this new DEXs, to handle events emitted by this personalized template, following the pattern of the other ones at [v2-pools/mappings/pool/dexs](./src/v2-pools/mappings/pool/dexs/)

2. Create a factory handler specific for the new DEX in [v2-pools/mappings/factory/dexs](./src/v2-pools/mappings/factory/dexs), following the pattern of the other ones.

   - You should not forget to register the pool dynamic contract in this file, for example:

   ```ts
   UniswapV2Factory.PairCreated.contractRegister(({ event, context }) => {
     context.addUniswapV2Pool(event.params.pair);
   });
   ```

   In case that the new DEX events are not compatible with the UniswapV2 events, you should then instead of registering an UniswapV2Pool, register the new DEX pool contract created, at the previous step. if the new DEX events are compatible with the UniswapV2 events, you can just copy and paste the one above.

3. Create a new function in [v2-position-manager-address.ts](./src/v2-pools/common/v2-position-manager-address.ts) to return the address of the position
   manager for this new DEX for each network.

4. Create a new entry in the `SupportedProtocol` enum at [supported-protocol.ts](./src/common/enums/supported-protocol.ts) for the new DEX, and add all needed returns (e.g., logo url, name, etc...) for the new DEX in the enum namespace at the same file, below the enum itself.

### Adding a new V3 DEX

1. Modify the config file for the indexer [config.yaml](./config.yaml) to include the new DEX:

   - You should add the factory contract of the DEX in the `contracts` section, following the same pattern as the other DEXs.
   - In case that this new DEX pool events are different from the original UniswapV3, some additional things are required:
     - You should add its ABI in the [abis](./abis/) folder. For the Pair and the Factory.
     - A new contract for this DEX pool must be added in the config file, with the correct events and handlers.
     - You should create peronsalized handlers for this new DEXs, to handle events emitted by this personalized template, following the pattern of the other ones at [v3-pools/mappings/factory/dexs](./src/v3-pools/mappings/pool/dexs/)

2. Create a factory handler specific for the new DEX in [v3-pools/mappings/factory/dexs](./src/v3-pools/mappings/factory/dexs), following the pattern of the other ones.

   - You should not forget to register the pool dynamic contract in this file, for example:

   ```ts
   UniswapV3Factory.PoolCreated.contractRegister(({ event, context }) => {
     context.addUniswapV3Pool(event.params.pool);
   });
   ```

   In case that the new DEX events are not compatible with the UniswapV3 events, you should then instead of registering an UniswapV3Pool, register the new DEX pool contract created, at the previous step. if the new DEX events are compatible with the UniswapV3 events, you can just copy and paste the one above.

3. Create a new function in [v3-position-manager-address.ts](./src/v3-pools/common/v3-position-manager-address.ts) to return the address of the position
   manager for this new DEX.

4. Create a new entry in the `SupportedProtocol` enum at [supported-protocol.ts](./src/common/enums/supported-protocol.ts) for the new DEX, and add all needed returns (e.g logo url, name, etc...) for the new DEX in the enum namespace at the same file, below the enum itself.

### Adding a new V4 DEX

1. Add the DEX V4 Pool manager and its handlers in the `contracts` section in the [config.yaml](./config.yaml) for the new DEX

2. Create handlers for this new DEX in [v4-pools/mappings/pool-manager/dexs](./src/v4-pools/mappings/pool-manager/dexs), following the pattern of the other ones

3. Create a new function in [v4-position-manager-address.ts](./src/v4-pools/common/v4-position-manager-address.ts) to return the address of the position manager for this new DEX.

4. Create a new function in [v4-state-view-address.ts](./src/v4-pools/common/v4-state-view-address.ts) to return the address of the V4 State view for this new DEX, if applicable for this new DEX.

5. Add the permit2 address for the new DEX in [permit2-address.ts](./src/common/permit2-address.ts)

6. Create a new entry in the `SupportedProtocol` enum at [supported-protocol.ts](./src/common/enums/supported-protocol.ts) for the new DEX, and add all needed returns (e.g logo url, name, etc...) for the new DEX in the enum namespace at the same file, below the enum itself.
