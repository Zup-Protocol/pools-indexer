import { IndexerNetwork } from "../../common/enums/indexer-network";

export class V3PositionManagerAddress {
  static aerodrome(network: IndexerNetwork): string {
    switch (network) {
      case IndexerNetwork.BASE:
        return "0x827922686190790b37229fd06084350E74485b72";
      default:
        throw Error(`Aerodrome is not supported on ${network}`);
    }
  }

  static uniswap(network: IndexerNetwork): string {
    switch (network) {
      case IndexerNetwork.BASE:
        return "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1";
      case IndexerNetwork.ETHEREUM:
        return "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
      case IndexerNetwork.UNICHAIN:
        return "0x943e6e07a7e8e791dafc44083e54041d743c46e9";
      case IndexerNetwork.SCROLL:
        return "0xB39002E4033b162fAc607fc3471E205FA2aE5967";
      case IndexerNetwork.SEPOLIA:
        return "0x1238536071E1c677A632429e3655c799b22cDA52";
      case IndexerNetwork.HYPER_EVM:
        throw Error(`Uniswap is not supported on HyperEVM`);
    }
  }

  static pancakeSwap(network: IndexerNetwork): string {
    switch (network) {
      case IndexerNetwork.BASE:
        return "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364";
      case IndexerNetwork.ETHEREUM:
        return "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364";
      case IndexerNetwork.UNICHAIN:
        throw Error(`PancakeSwap is not supported on Unichain`);
      case IndexerNetwork.SCROLL:
        return "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364";
      case IndexerNetwork.SEPOLIA:
        return "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364";
      case IndexerNetwork.HYPER_EVM:
        throw Error(`PancakeSwap is not supported on HyperEVM`);
    }
  }

  static sushiSwap(network: IndexerNetwork): string {
    switch (network) {
      case IndexerNetwork.BASE:
        return "0x80C7DD17B01855a6D2347444a0FCC36136a314de";
      case IndexerNetwork.ETHEREUM:
        return "0x2214A42d8e2A1d20635c2cb0664422c528B6A432";
      case IndexerNetwork.UNICHAIN:
        throw Error(`SushiSwap is not supported on Unichain`);
      case IndexerNetwork.SCROLL:
        return "0x0389879e0156033202C44BF784ac18fC02edeE4f";
      case IndexerNetwork.SEPOLIA:
        throw Error(`SushiSwap is not supported on Sepolia`);
      case IndexerNetwork.HYPER_EVM:
        throw Error(`SushiSwap is not supported on HyperEVM`);
    }
  }

  static zebra(network: IndexerNetwork): string {
    switch (network) {
      case IndexerNetwork.SCROLL:
        return "0x349B654dcbce53943C8e87F914F62ae9526C6681";
      default:
        throw Error(`Zebra is not supported on ${network}`);
    }
  }

  static baseSwap(network: IndexerNetwork): string {
    switch (network) {
      case IndexerNetwork.BASE:
        return "0xDe151D5c92BfAA288Db4B67c21CD55d5826bCc93";
      default:
        throw Error(`BaseSwap is not supported on ${network}`);
    }
  }

  static alienBase(network: IndexerNetwork): string {
    switch (network) {
      case IndexerNetwork.BASE:
        return "0xB7996D1ECD07fB227e8DcA8CD5214bDfb04534E5";
      default:
        throw Error(`AlienBase is not supported on ${network}`);
    }
  }

  static velodrome(network: IndexerNetwork): string {
    switch (network) {
      case IndexerNetwork.UNICHAIN:
        return "0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702";
      case IndexerNetwork.ETHEREUM:
        throw Error(`Velodrome is not supported on Mainnet`);
      case IndexerNetwork.BASE:
        throw Error(`Velodrome is not supported on Base`);
      case IndexerNetwork.SCROLL:
        throw Error(`Velodrome is not supported on Scroll`);
      case IndexerNetwork.SEPOLIA:
        throw Error(`Velodrome is not supported on Sepolia`);
      case IndexerNetwork.HYPER_EVM:
        throw Error(`Velodrome is not supported on HyperEVM`);
    }
  }
  static honeypop(network: IndexerNetwork): string {
    switch (network) {
      case IndexerNetwork.SCROLL:
        return "0xB6F8D24e28bF5b8AdD2e7510f84F3b9ef03B3435";
      default:
        throw Error(`Honeypop is not supported on ${network}`);
    }
  }

  static gliquid(network: IndexerNetwork): string {
    switch (network) {
      case IndexerNetwork.HYPER_EVM:
        return "0x69D57B9D705eaD73a5d2f2476C30c55bD755cc2F";
      default:
        throw Error(`Gliquid is not supported on ${network}`);
    }
  }

  static hyperSwap(network: IndexerNetwork): string {
    switch (network) {
      case IndexerNetwork.HYPER_EVM:
        return "0x6eDA206207c09e5428F281761DdC0D300851fBC8";
      default:
        throw Error(`HyperSwap is not supported on ${network}`);
    }
  }

  static projectX(network: IndexerNetwork): string {
    switch (network) {
      case IndexerNetwork.HYPER_EVM:
        return "0xeaD19AE861c29bBb2101E834922B2FEee69B9091";
      default:
        throw Error(`Project X is not supported on ${network}`);
    }
  }

  static hybra(network: IndexerNetwork): string {
    switch (network) {
      case IndexerNetwork.HYPER_EVM:
        return "0x934C4f47B2D3FfcA0156A45DEb3A436202aF1efa";
      default:
        throw Error(`Hybra is not supported on ${network}`);
    }
  }

  static kittenSwap(network: IndexerNetwork): string {
    switch (network) {
      case IndexerNetwork.HYPER_EVM:
        return "0x9ea4459c8DefBF561495d95414b9CF1E2242a3E2";
      default:
        throw Error(`KittenSwap is not supported on ${network}`);
    }
  }
}
