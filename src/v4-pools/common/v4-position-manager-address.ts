import { IndexerNetwork } from "../../common/enums/indexer-network";

export class V4PositionManagerAddress {
  static uniswap(network: IndexerNetwork): string {
    switch (network) {
      case IndexerNetwork.ETHEREUM:
        return "0xbD216513d74C8cf14cf4747E6AaA6420FF64ee9e";
      case IndexerNetwork.BASE:
        return "0x7c5f5a4bbd8fd63184577525326123b519429bdc";
      case IndexerNetwork.UNICHAIN:
        return "0x4529A01c7A0410167c5740C487A8DE60232617bf";
      case IndexerNetwork.SCROLL:
        throw Error(`Uniswap V4 position manager is not implemented on Scroll`);
      case IndexerNetwork.SEPOLIA:
        return "0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4";
      case IndexerNetwork.HYPER_EVM:
        throw Error(`Uniswap V4 position manager is not implemented on HyperEVM`);
      case IndexerNetwork.PLASMA:
        throw Error(`Uniswap V4 position manager is not implemented on Plasma`);
    }
  }

  static pancakeSwap(network: IndexerNetwork): string {
    switch (network) {
      case IndexerNetwork.BASE:
        return "0x55f4c8abA71A1e923edC303eb4fEfF14608cC226";
      case IndexerNetwork.ETHEREUM:
        throw Error(`PancakeSwap V4 position manager is not implemented on Mainnet`);
      case IndexerNetwork.UNICHAIN:
        throw Error(`PancakeSwap V4 position manager is not implemented on Unichain`);
      case IndexerNetwork.SCROLL:
        throw Error(`PancakeSwap V4 position manager is not implemented on Scroll`);
      case IndexerNetwork.SEPOLIA:
        throw Error(`PancakeSwap V4 position manager is not implemented on Sepolia`);
      case IndexerNetwork.HYPER_EVM:
        throw Error(`PancakeSwap V4 position manager is not implemented on HyperEVM`);
      case IndexerNetwork.PLASMA:
        throw Error(`PancakeSwap V4 position manager is not implemented on Plasma`);
    }
  }
}
