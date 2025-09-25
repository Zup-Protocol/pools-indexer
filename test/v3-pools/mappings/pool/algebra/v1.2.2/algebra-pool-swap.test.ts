import assert from "assert";
import { AlgebraPool_1_2_2_Swap_event, AlgebraPool_1_2_2_SwapFee_event, AlgebraPoolData, Pool } from "generated";
import { AlgebraPool_1_2_2, MockDb } from "generated/src/TestHelpers.gen";
import sinon from "sinon";
import { IndexerNetwork } from "../../../../../../src/common/enums/indexer-network";
import * as getPoolDeductingAlgebraNonLPFees from "../../../../../../src/v3-pools/mappings/pool/algebra/common/algebra-pool-common";
import * as handleSwap from "../../../../../../src/v3-pools/mappings/pool/v3-pool-swap";

import { AlgebraPoolDataMock, PoolMock, TokenMock, V3PoolDataMock } from "../../../../../mocks";

describe("AlgebraPoolSwap", () => {
  let mockDb = MockDb.createMockDb();
  let swapEvent: AlgebraPool_1_2_2_Swap_event;
  let swapFeeEvent: AlgebraPool_1_2_2_SwapFee_event;
  let eventChainId: IndexerNetwork;
  let eventSrcAddress: string = "0x123";
  let eventAmount0 = BigInt(-100);
  let eventAmount1 = BigInt(200);
  let eventLiquidity = BigInt(9273982);
  let eventPrice = 12916289162781n;
  let eventRecipient = "0x1235";
  let eventSender = eventRecipient;
  let eventTick = 0n;
  let eventPluginFee = 0n;
  let eventOverrideFee = 0n;
  let poolId: string;
  let poolEntity: Pool;

  beforeEach(() => {
    eventChainId = IndexerNetwork.HYPER_EVM;
    poolId = IndexerNetwork.getEntityIdFromAddress(eventChainId, eventSrcAddress);
    poolEntity = new PoolMock(poolId);

    swapEvent = AlgebraPool_1_2_2.Swap.createMockEvent({
      amount0: eventAmount0,
      amount1: eventAmount1,
      liquidity: eventLiquidity,
      price: eventPrice,
      recipient: eventRecipient,
      sender: eventSender,
      tick: eventTick,
      mockEventData: {
        chainId: eventChainId,
        srcAddress: eventSrcAddress,
      },
    });

    swapFeeEvent = AlgebraPool_1_2_2.SwapFee.createMockEvent({
      overrideFee: eventOverrideFee,
      pluginFee: eventPluginFee,
      mockEventData: {
        chainId: eventChainId,
        srcAddress: eventSrcAddress,
      },
    });

    mockDb = mockDb.entities.AlgebraPoolData.set(new AlgebraPoolDataMock(poolId));
    mockDb = mockDb.entities.Pool.set(poolEntity);
    mockDb = mockDb.entities.V3PoolData.set(new V3PoolDataMock(poolId));
    mockDb = mockDb.entities.Token.set(new TokenMock(poolEntity.token0_id));
    mockDb = mockDb.entities.Token.set(new TokenMock(poolEntity.token1_id));
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should pass override single swap fee to the v3 pool handler when emmiting SwapFee event before with overrideSwapFee > 0", async () => {
    let expectedOverrideFee = 126126178n;
    let actualOverrideFee = 0;

    sinon.replace(handleSwap, "handleV3PoolSwap", async (params) => {
      actualOverrideFee = params.overrideSingleSwapFee!;
    });

    swapEvent = AlgebraPool_1_2_2.Swap.createMockEvent({
      amount0: eventAmount0,
      amount1: eventAmount1,
      liquidity: eventLiquidity,

      price: eventPrice,
      recipient: eventRecipient,
      sender: eventSender,
      tick: eventTick,
      mockEventData: {
        chainId: eventChainId,
        srcAddress: eventSrcAddress,
      },
    });

    swapFeeEvent = AlgebraPool_1_2_2.SwapFee.createMockEvent({
      overrideFee: expectedOverrideFee,
      pluginFee: 0n,
      mockEventData: {
        chainId: eventChainId,
        srcAddress: eventSrcAddress,
      },
    });

    await mockDb.processEvents([swapFeeEvent, swapEvent]);

    assert.equal(actualOverrideFee, expectedOverrideFee);
  });

  it("should not pass override single swap fee to the v3 pool handler when emmiting SwapFee event before with overrideSwapFee 0", async () => {
    let actualOverrideFee: number | undefined = 0;

    sinon.replace(handleSwap, "handleV3PoolSwap", async (params) => {
      actualOverrideFee = params.overrideSingleSwapFee;
    });

    swapEvent = AlgebraPool_1_2_2.Swap.createMockEvent({
      amount0: eventAmount0,
      amount1: eventAmount1,
      liquidity: eventLiquidity,
      price: eventPrice,
      recipient: eventRecipient,
      sender: eventSender,
      tick: eventTick,
      mockEventData: {
        chainId: eventChainId,
        srcAddress: eventSrcAddress,
      },
    });

    swapFeeEvent = AlgebraPool_1_2_2.SwapFee.createMockEvent({
      overrideFee: 0n,
      pluginFee: 0n,
      mockEventData: {
        chainId: eventChainId,
        srcAddress: eventSrcAddress,
      },
    });

    await mockDb.processEvents([swapFeeEvent, swapEvent]);

    assert.equal(actualOverrideFee, undefined);
  });

  it("should pass the pool entity got from 'getPoolDeductingAlgebraNonLPFees' to the v3 pool handler", async () => {
    let expectedPoolEntity = new PoolMock("Xablau");
    let actualPoolEntity: Pool | undefined = undefined;

    sinon.replace(getPoolDeductingAlgebraNonLPFees, "getPoolDeductingAlgebraNonLPFees", (params) => {
      return expectedPoolEntity;
    });

    sinon.replace(handleSwap, "handleV3PoolSwap", async (params) => {
      actualPoolEntity = params.poolEntity;
    });

    swapEvent = AlgebraPool_1_2_2.Swap.createMockEvent({
      amount0: eventAmount0,
      amount1: eventAmount1,
      liquidity: eventLiquidity,
      price: eventPrice,
      recipient: eventRecipient,
      sender: eventSender,
      tick: eventTick,
      mockEventData: {
        chainId: eventChainId,
        srcAddress: eventSrcAddress,
      },
    });

    await mockDb.processEvents([swapEvent]);

    assert.equal(actualPoolEntity, expectedPoolEntity);
  });

  it("should pass the correct params to 'getPoolDeductingAlgebraNonLPFees', got from the event", async () => {
    let pluginFee = 215271n;
    let overrideFee = 182618721n;
    let communityFee = 1213n;
    let algebraPoolDataWithNewCommunityFee: AlgebraPoolData = {
      ...new AlgebraPoolDataMock(poolId),
      communityFee: Number.parseInt(communityFee.toString()),
    };

    mockDb = mockDb.entities.AlgebraPoolData.set(algebraPoolDataWithNewCommunityFee);

    sinon.replace(getPoolDeductingAlgebraNonLPFees, "getPoolDeductingAlgebraNonLPFees", (params) => {
      assert.equal(params.amount0SwapAmount, eventAmount0, "amount0SwapAmount should be equal to eventAmount0");
      assert.equal(params.amount1SwapAmount, eventAmount1, "amount1SwapAmount should be equal to eventAmount1");
      assert.equal(params.token0.id, poolEntity.token0_id, "token0.id should be equal to poolEntity.token0_id");
      assert.equal(params.token1.id, poolEntity.token1_id, "token1.id should be equal to poolEntity.token1_id");
      assert.equal(params.pluginFee, pluginFee, "pluginFee should be equal to pluginFee");
      assert.equal(params.overrideSwapFee, overrideFee, "overrideSwapFee should be equal to overrideFee");
      assert.equal(
        params.communityFee,
        communityFee,
        "communityFee passed should be equal to communityFee from the algebra pool data object"
      );

      return poolEntity;
    });

    swapEvent = AlgebraPool_1_2_2.Swap.createMockEvent({
      amount0: eventAmount0,
      amount1: eventAmount1,
      liquidity: eventLiquidity,
      price: eventPrice,
      recipient: eventRecipient,
      sender: eventSender,
      tick: eventTick,
      mockEventData: {
        chainId: eventChainId,
        srcAddress: eventSrcAddress,
      },
    });

    swapFeeEvent = AlgebraPool_1_2_2.SwapFee.createMockEvent({
      overrideFee: overrideFee,
      pluginFee: pluginFee,
      mockEventData: {
        chainId: eventChainId,
        srcAddress: eventSrcAddress,
      },
    });

    await mockDb.processEvents([swapFeeEvent, swapEvent]);
  });

  it("should not pass override swap fee to 'getPoolDeductingAlgebraNonLPFees', if it's zero", async () => {
    sinon.replace(getPoolDeductingAlgebraNonLPFees, "getPoolDeductingAlgebraNonLPFees", (params) => {
      assert.equal(params.overrideSwapFee, undefined, "overrideSwapFee should be undefined");

      return poolEntity;
    });

    swapEvent = AlgebraPool_1_2_2.Swap.createMockEvent({
      amount0: eventAmount0,
      amount1: eventAmount1,
      liquidity: eventLiquidity,
      price: eventPrice,
      recipient: eventRecipient,
      sender: eventSender,
      tick: eventTick,
      mockEventData: {
        chainId: eventChainId,
        srcAddress: eventSrcAddress,
      },
    });

    swapFeeEvent = AlgebraPool_1_2_2.SwapFee.createMockEvent({
      overrideFee: 0n,
      pluginFee: 0n,
      mockEventData: {
        chainId: eventChainId,
        srcAddress: eventSrcAddress,
      },
    });

    await mockDb.processEvents([swapFeeEvent, swapEvent]);
  });
});
