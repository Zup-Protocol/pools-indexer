import { IndexerNetwork } from "../../common/enums/indexer-network";

export class V2PositionManagerAddress {
  static uniswap(network: IndexerNetwork): string {
    switch (network) {
      case IndexerNetwork.BASE:
        return "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24";
      case IndexerNetwork.ETHEREUM:
        return "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
      case IndexerNetwork.UNICHAIN:
        return "0x284f11109359a7e1306c3e447ef14d38400063ff";
      case IndexerNetwork.SEPOLIA:
        return "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";
      case IndexerNetwork.SCROLL:
        throw Error(`Uniswap V2 position manager is not available on Scroll`);
      case IndexerNetwork.HYPER_EVM:
        throw Error(`Uniswap V2 position manager is not available on Hyper EVM`);
    }
  }
}
