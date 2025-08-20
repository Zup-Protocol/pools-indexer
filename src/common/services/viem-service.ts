import * as viem from "viem";
import { IndexerNetwork } from "../enums/indexer-network";

export class ViemService {
  constructor(readonly viemModule: typeof viem) {}
  private static _instance: ViemService;

  static get shared() {
    if (!this._instance) {
      this._instance = new ViemService(viem);
    }

    return this._instance;
  }

  private clients: Record<IndexerNetwork, viem.Client> = {} as Record<IndexerNetwork, viem.Client>;

  getClient(forNetwork: IndexerNetwork): viem.Client {
    let client = this.clients[forNetwork];

    if (client) return client;

    client = this.viemModule.createPublicClient({
      batch: {
        multicall: true,
      },
      transport: this.viemModule.http(IndexerNetwork.getRpcUrl(forNetwork), { batch: true }),
    });

    this.clients[forNetwork] = client;
    return client;
  }
}
