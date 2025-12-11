import assert from "assert";
import { AlgebraPoolData } from "generated";
import { HandlerContext } from "generated/src/Types";
import { handleAlgebraPoolPlugin } from "../../../../src/algebra-style-pools/mappings/pool/algebra-pool-plugin";
import { defaultAlgebraPoolData } from "../../../../src/common/default-entities";
import { AlgebraPoolDataMock, handlerContextCustomMock } from "../../../mocks";

describe("AlgebraPoolPlugin", () => {
  let context: HandlerContext;
  let poolId: string;

  beforeEach(() => {
    context = handlerContextCustomMock();
    poolId = "999-xabasPoola";
  });

  it("should create a new default algebra entity with the pool id if it doesn't exist, and set the plugin address", async () => {
    const newPluginAddress = "xabasPluginAddress";

    await handleAlgebraPoolPlugin(context, poolId, newPluginAddress);
    const updatedAlgebraPoolData = await context.AlgebraPoolData.getOrThrow(poolId);

    const expectedAlgebraPoolData: AlgebraPoolData = {
      ...defaultAlgebraPoolData({ id: poolId }),
      plugin: newPluginAddress,
    };

    assert.deepEqual(updatedAlgebraPoolData, expectedAlgebraPoolData);
  });

  it("should set the new plugin address in algebra pool data and don't modify other fields if the entity exists", async () => {
    const newPluginAddress = "0x1234567890123456789012345678901234567890";
    const algebraPoolData = new AlgebraPoolDataMock(poolId);
    context.AlgebraPoolData.set(algebraPoolData);

    await handleAlgebraPoolPlugin(context, poolId, newPluginAddress);
    const updatedAlgebraPoolData = await context.AlgebraPoolData.getOrThrow(algebraPoolData.id);
    const expectedAlgebraPoolData: AlgebraPoolData = { ...algebraPoolData, plugin: newPluginAddress };

    assert.deepEqual(updatedAlgebraPoolData, expectedAlgebraPoolData);
  });

  it("should update plugin address from one address to another when already set", async () => {
    const oldPluginAddress = "0x0000000000000000000000000000000000000001";
    const newPluginAddress = "0x0000000000000000000000000000000000000002";
    const algebraPoolData: AlgebraPoolData = { ...new AlgebraPoolDataMock(poolId), plugin: oldPluginAddress };

    context.AlgebraPoolData.set(algebraPoolData);

    await handleAlgebraPoolPlugin(context, poolId, newPluginAddress);
    const updatedAlgebraPoolData = await context.AlgebraPoolData.getOrThrow(algebraPoolData.id);

    assert.equal(updatedAlgebraPoolData.plugin, newPluginAddress, "plugin should be updated to new address");
    assert.notEqual(updatedAlgebraPoolData.plugin, oldPluginAddress, "plugin should no longer be the old address");
  });
});
