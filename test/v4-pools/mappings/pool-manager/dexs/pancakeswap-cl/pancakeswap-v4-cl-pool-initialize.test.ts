import assert from "assert";
import { PancakeSwapV4CLPoolManager_Initialize_event } from "generated";
import { MockDb, PancakeSwapV4CLPoolManager } from "generated/src/TestHelpers.gen";
import sinon from "sinon";
import { IndexerNetwork } from "../../../../../../src/common/enums/indexer-network";
import { SupportedProtocol } from "../../../../../../src/common/enums/supported-protocol";
import { getPoolTickSpacingFromParameters } from "../../../../../../src/v4-pools/mappings/pool-manager/dexs/pancakeswap-cl/pancakeswap-v4-cl-utils";
import * as poolInitHandler from "../../../../../../src/v4-pools/mappings/pool-manager/v4-pool-initialize";

describe("pancakeswap-v4-cl-pool-initialize", () => {
  const mockDb = MockDb.createMockDb();
  let network: IndexerNetwork;
  let event: PancakeSwapV4CLPoolManager_Initialize_event;

  beforeEach(() => {
    sinon.stub(poolInitHandler, "handleV4PoolInitialize").resolves();

    network = IndexerNetwork.BASE;
    event = PancakeSwapV4CLPoolManager.Initialize.createMockEvent({
      currency0: "0x0000000000000000000000000000000000000001",
      currency1: "0x0000000000000000000000000000000000000002",
      fee: 0n,
      hooks: "0x0000000000000000000000000000000000000023",
      id: "0x",
      parameters: "0x00000000000000000000000000000000000000000000000000000000000100c2",
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

  it("When calling the handler, it should correctly pass the pool tick spacing, converting from the event parameters param", async () => {
    let poolId = "0x819";
    let passedTickSpacing: number | undefined;

    event = PancakeSwapV4CLPoolManager.Initialize.createMockEvent({
      currency0: "0x0000000000000000000000000000000000000001",
      currency1: "0x0000000000000000000000000000000000000002",
      fee: 500n,
      hooks: "0x0000000000000000000000000000000000000023",
      id: poolId,
      parameters: "0x00000000000000000000000000000000000000000000000000000000000100c2",
      mockEventData: {
        chainId: network,
      },
      sqrtPriceX96: 287152761n,
      tick: 989756545n,
    });

    sinon.restore();
    sinon.stub(poolInitHandler, "handleV4PoolInitialize").callsFake(async (params) => {
      passedTickSpacing = params.tickSpacing;
      return Promise.resolve();
    });

    await mockDb.processEvents([event]);

    assert.equal(
      passedTickSpacing,
      getPoolTickSpacingFromParameters(event.params.parameters as `0x${string}`),
      "tickSpacing should match the parameters"
    );
  });

  it("Should pass the pancakeSwapV4CL protocol when calling the handler", async () => {
    let passedProtocol: SupportedProtocol | undefined;

    sinon.restore();
    sinon.stub(poolInitHandler, "handleV4PoolInitialize").callsFake(async (params) => {
      passedProtocol = params.protocol;
      return Promise.resolve();
    });

    await mockDb.processEvents([event]);

    assert.equal(passedProtocol, SupportedProtocol.PANCAKESWAP_INFINITY_CL);
  });
});
