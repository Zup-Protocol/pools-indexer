import { Client, createPublicClient, http } from "viem";
import { IndexerNetwork } from "../enums/indexer-network";

export class ViemService {
  private static _instance: ViemService;

  static get shared() {
    if (!this._instance) {
      this._instance = new ViemService();
    }

    return this._instance;
  }

  private clients: Record<IndexerNetwork, Client> = {} as Record<IndexerNetwork, Client>;

  getClient(forNetwork: IndexerNetwork): Client {
    let client = this.clients[forNetwork];

    if (client) return client;

    client = createPublicClient({
      batch: {
        multicall: true,
      },
      transport: http(IndexerNetwork.getRpcUrl(forNetwork), { batch: true }),
    });

    this.clients[forNetwork] = client;
    return client;
  }
}
