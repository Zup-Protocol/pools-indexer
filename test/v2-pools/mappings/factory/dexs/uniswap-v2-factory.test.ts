import assert from "assert";
import { UniswapV2Factory_PairCreated_event } from "generated";
import { MockDb, UniswapV2Factory } from "generated/src/TestHelpers.gen";
import sinon from "sinon";
import { IndexerNetwork } from "../../../../../src/common/enums/indexer-network";
import { SupportedProtocol } from "../../../../../src/common/enums/supported-protocol";
import * as factoryHandler from "../../../../../src/v2-pools/mappings/factory/v2-factory";

describe("UniswapV2Factory", () => {
  const mockDb = MockDb.createMockDb();
  let network: IndexerNetwork;
  let event: UniswapV2Factory_PairCreated_event;

  beforeEach(() => {
    network = IndexerNetwork.ETHEREUM;

    event = UniswapV2Factory.PairCreated.createMockEvent({
      mockEventData: {
        chainId: network,
      },
      pair: "0x0000000000000000000000000000000000000221",
      token0: "0x0000000000000000000000000000000000000002",
      token1: "0x0000000000000000000000000000000000000003",
      _3: 21752718n,
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should pass the correct protocol when calling the pool created handler", async () => {
    const updatedMockDB = await mockDb.processEvents([event]);

    assert.equal(
      updatedMockDB.entities.Pool.get(IndexerNetwork.getEntityIdFromAddress(network, event.params.pair))!.protocol_id,
      SupportedProtocol.UNISWAP_V2
    );
  });

  it("should register the pool create in the dynamic contract registry", async () => {
    const updatedMockDB = await mockDb.processEvents([event]);
    const registeredContracts = updatedMockDB.dynamicContractRegistry.getAll();

    assert.equal(registeredContracts[0].contract_address, event.params.pair);
  });

  it("should set the fee tier as 3000 in the pool", async () => {
    sinon.replace(factoryHandler, "handleV2PoolCreated", async (params) => {
      assert.equal(params.feeTier, 3000);
    });

    await mockDb.processEvents([event]);
  });
});
