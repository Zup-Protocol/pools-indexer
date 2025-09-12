import assert from "assert";
import { GLiquidAlgebraFactory_CustomPool_event, GLiquidAlgebraFactory_Pool_event } from "generated";
import { GLiquidAlgebraFactory, MockDb } from "generated/src/TestHelpers.gen";
import { ZERO_ADDRESS } from "../../../../../src/common/constants";
import { IndexerNetwork } from "../../../../../src/common/enums/indexer-network";
import { SupportedProtocol } from "../../../../../src/common/enums/supported-protocol";

describe("GLiquidAlgebraFactory", () => {
  const mockDb = MockDb.createMockDb();
  let network: IndexerNetwork = IndexerNetwork.HYPER_EVM;
  let poolEvent: GLiquidAlgebraFactory_Pool_event = GLiquidAlgebraFactory.Pool.createMockEvent({
    mockEventData: {
      chainId: network,
    },
    pool: "0x0000000000000000000000000000000000004221",
    token0: "0x0000000000000000000000000000000000000002",
    token1: "0x0000000000000000000000000000000000000003",
  });
  let customPoolEvent: GLiquidAlgebraFactory_CustomPool_event = GLiquidAlgebraFactory.CustomPool.createMockEvent({
    mockEventData: {
      chainId: network,
    },
    pool: "0x0000000000000000000000000000000000004221",
    token0: "0x0000000000000000000000000000000000000002",
    token1: "0x0000000000000000000000000000000000000003",
    deployer: "0x0000000000000000000000000001111111111111",
  });

  it("should pass the correct protocol when calling the pool created handler", async () => {
    const updatedMockDB = await mockDb.processEvents([poolEvent]);

    assert.equal(
      updatedMockDB.entities.Pool.get(IndexerNetwork.getEntityIdFromAddress(network, poolEvent.params.pool))!
        .protocol_id,
      SupportedProtocol.GLIQUID_ALGEBRA
    );
  });

  it("should pass the correct protocol when calling the custom pool created handler", async () => {
    const updatedMockDB = await mockDb.processEvents([customPoolEvent]);

    assert.equal(
      updatedMockDB.entities.Pool.get(IndexerNetwork.getEntityIdFromAddress(network, poolEvent.params.pool))!
        .protocol_id,
      SupportedProtocol.GLIQUID_ALGEBRA
    );
  });

  it("should pass the tick spacing and fee tier as zero when calling the custom pool created handler", async () => {
    const updatedMockDB = await mockDb.processEvents([customPoolEvent]);

    assert.equal(
      updatedMockDB.entities.V3PoolData.get(
        IndexerNetwork.getEntityIdFromAddress(network, customPoolEvent.params.pool)
      )!.tickSpacing,
      0,
      "tickSpacing should be zero"
    );

    assert.equal(
      updatedMockDB.entities.Pool.get(IndexerNetwork.getEntityIdFromAddress(network, customPoolEvent.params.pool))!
        .currentFeeTier,
      0,
      "feeTier should be zero"
    );
  });

  it("should pass the tick spacing and fee tier as zero when calling the pool created handler", async () => {
    const updatedMockDB = await mockDb.processEvents([poolEvent]);

    assert.equal(
      updatedMockDB.entities.V3PoolData.get(IndexerNetwork.getEntityIdFromAddress(network, poolEvent.params.pool))!
        .tickSpacing,
      0,
      "tickSpacing should be zero"
    );

    assert.equal(
      updatedMockDB.entities.Pool.get(IndexerNetwork.getEntityIdFromAddress(network, poolEvent.params.pool))!
        .currentFeeTier,
      0,
      "feeTier should be zero"
    );
  });

  it("should pass the deployer address zero if the pool created is not a custom pool", async () => {
    const updatedMockDB = await mockDb.processEvents([poolEvent]);

    assert.equal(
      updatedMockDB.entities.AlgebraPoolData.get(IndexerNetwork.getEntityIdFromAddress(network, poolEvent.params.pool))!
        .deployer,
      ZERO_ADDRESS
    );
  });

  it("should pass the deployer address from the event if the pool created is a custom pool", async () => {
    const updatedMockDB = await mockDb.processEvents([customPoolEvent]);

    assert.equal(
      updatedMockDB.entities.AlgebraPoolData.get(IndexerNetwork.getEntityIdFromAddress(network, poolEvent.params.pool))!
        .deployer,
      customPoolEvent.params.deployer
    );
  });

  it("should register the pool created in the dynamic contract registry", async () => {
    const updatedMockDB = await mockDb.processEvents([poolEvent]);
    const registeredContracts = updatedMockDB.dynamicContractRegistry.getAll();

    assert.equal(registeredContracts[0].contract_address, poolEvent.params.pool);
  });

  it("should register the custom pool created in the dynamic contract registry", async () => {
    const updatedMockDB = await mockDb.processEvents([customPoolEvent]);
    const registeredContracts = updatedMockDB.dynamicContractRegistry.getAll();

    assert.equal(registeredContracts[0].contract_address, customPoolEvent.params.pool);
  });
});
