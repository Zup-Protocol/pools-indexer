import { IndexerNetwork } from "./enums/indexer-network";

export class Permit2Address {
  static uniswap(network: IndexerNetwork): string {
    switch (network) {
      case IndexerNetwork.ETHEREUM:
        return "0x000000000022D473030F116dDEE9F6B43aC78BA3";
      case IndexerNetwork.BASE:
        return "0x000000000022D473030F116dDEE9F6B43aC78BA3";
      case IndexerNetwork.UNICHAIN:
        return "0x000000000022D473030F116dDEE9F6B43aC78BA3";
      case IndexerNetwork.SCROLL:
        return "0xFcf5986450E4A014fFE7ad4Ae24921B589D039b5";
      case IndexerNetwork.SEPOLIA:
        return "0x000000000022D473030F116dDEE9F6B43aC78BA3";
      case IndexerNetwork.HYPER_EVM:
        throw Error(`Uniswap is not supported on HyperEVM`);
      case IndexerNetwork.PLASMA:
        throw Error(`Uniswap is not supported on Plasma`);
    }
  }

  static pancakeSwap(network: IndexerNetwork): string {
    switch (network) {
      case IndexerNetwork.BASE:
        return "0x31c2F6fcFf4F8759b3Bd5Bf0e1084A055615c768";
      case IndexerNetwork.ETHEREUM:
        throw Error(`PancakeSwap is not supported on Mainnet`);
      case IndexerNetwork.UNICHAIN:
        throw Error(`PancakeSwap is not supported on Unichain`);
      case IndexerNetwork.SCROLL:
        throw Error(`PancakeSwap is not supported on Scroll`);
      case IndexerNetwork.SEPOLIA:
        throw Error(`PancakeSwap is not supported on Sepolia`);
      case IndexerNetwork.HYPER_EVM:
        throw Error(`PancakeSwap is not supported on HyperEVM`);
      case IndexerNetwork.PLASMA:
        throw Error(`PancakeSwap is not supported on Plasma`);
    }
  }
}
