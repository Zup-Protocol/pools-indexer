import assert from "assert";
import { UniswapV4PoolManager_Initialize_event } from "generated";
import { MockDb, UniswapV4PoolManager } from "generated/src/TestHelpers.gen";
import sinon from "sinon";
import { IndexerNetwork } from "../../../../../../src/common/enums/indexer-network";
import { SupportedProtocol } from "../../../../../../src/common/enums/supported-protocol";
import * as poolInitHandler from "../../../../../../src/v4-pools/mappings/pool-manager/v4-pool-initialize";

describe("UniswapV4PoolInitialize", () => {
  const mockDb = MockDb.createMockDb();
  let network: IndexerNetwork;
  let event: UniswapV4PoolManager_Initialize_event;

  beforeEach(() => {
    sinon.stub(poolInitHandler, "handleV4PoolInitialize").resolves();

    network = IndexerNetwork.UNICHAIN;

    event = UniswapV4PoolManager.Initialize.createMockEvent({
      currency0: "0x0000000000000000000000000000000000000001",
      currency1: "0x0000000000000000000000000000000000000002",
      fee: 500n,
      hooks: "0x0000000000000000000000000000000000000023",
      id: "0x819",
      tickSpacing: 62n,
      mockEventData: {
        chainId: network,
      },
      sqrtPriceX96: 287152761n,
      tick: 989756545n,
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("Should pass the correct protocol when calling the handler", async () => {
    let passedProtocol: SupportedProtocol | undefined;

    sinon.restore();
    sinon.stub(poolInitHandler, "handleV4PoolInitialize").callsFake(async (params) => {
      passedProtocol = params.protocol;
      return Promise.resolve();
    });

    await mockDb.processEvents([event]);

    assert.equal(passedProtocol, SupportedProtocol.UNISWAP_V4);
  });
});
