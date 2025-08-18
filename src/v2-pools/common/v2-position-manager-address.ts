import { IndexerNetwork } from "../../common/enums/indexer-network";

export class V2PositionManagerAddress {
  static uniswap(network: IndexerNetwork): string {
    throw Error(`Uniswap V2 position manager is not implemented.`);
    // switch (network) {
    //   case IndexerNetwork.ARBITRUM:
    //     return "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24";
    // }
  }
}
