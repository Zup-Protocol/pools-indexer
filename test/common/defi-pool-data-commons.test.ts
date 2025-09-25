import assert from "assert";
import { DeFiPoolData } from "generated";
import { DEFI_POOL_DATA_ID, ONE_HOUR_IN_SECONDS } from "../../src/common/constants";
import { getDeFiPoolDailyDataId, getDeFiPoolHourlyDataId } from "../../src/common/defi-pool-data-commons";

describe("DefiPoolDataCommons", () => {
  it(`should return the same id if passing block timestamps
    that has been created in the same day as the defi pool
    data entity`, () => {
    const startedblockTimestamp = BigInt(1758580919);
    const blockTimestamp1 = startedblockTimestamp + BigInt(ONE_HOUR_IN_SECONDS) * 5n;
    const blockTimestamp2 = startedblockTimestamp + BigInt(ONE_HOUR_IN_SECONDS) * 20n;

    const defiPoolDataEntity: DeFiPoolData = {
      id: DEFI_POOL_DATA_ID,
      startedAtTimestamp: startedblockTimestamp,
      poolsCount: 0,
    };

    assert.equal(
      getDeFiPoolDailyDataId(blockTimestamp1, defiPoolDataEntity),
      getDeFiPoolDailyDataId(blockTimestamp2, defiPoolDataEntity)
    );
  });

  it(`should return the same id if passing block timestamps
    that are within 24h of each other`, () => {
    const blockTimestamp1 = BigInt(1758580919) + BigInt(ONE_HOUR_IN_SECONDS) * 50n;
    const blockTimestamp2 = BigInt(1758580919) + BigInt(ONE_HOUR_IN_SECONDS) * 70n;

    const defiPoolDataEntity: DeFiPoolData = {
      id: DEFI_POOL_DATA_ID,
      startedAtTimestamp: 0n,
      poolsCount: 0,
    };

    assert.equal(
      getDeFiPoolDailyDataId(blockTimestamp1, defiPoolDataEntity),
      getDeFiPoolDailyDataId(blockTimestamp2, defiPoolDataEntity)
    );
  });

  it(`should return different ids if passing block timestamps
    that are not within 24h of each other`, () => {
    const blockTimestamp1 = BigInt(1758580919) + BigInt(ONE_HOUR_IN_SECONDS) * 10n;
    const blockTimestamp2 = BigInt(1758580919) + BigInt(ONE_HOUR_IN_SECONDS) * 50n;

    const defiPoolDataEntity: DeFiPoolData = {
      id: DEFI_POOL_DATA_ID,
      startedAtTimestamp: 0n,
      poolsCount: 0,
    };

    assert.notEqual(
      getDeFiPoolDailyDataId(blockTimestamp1, defiPoolDataEntity),
      getDeFiPoolDailyDataId(blockTimestamp2, defiPoolDataEntity)
    );
  });

  it(`'getDeFiPoolHourlyDataId' should return the same id for passed timestamps that is less than 1 hour of each other`, () => {
    const defiPoolDataEntity: DeFiPoolData = {
      id: DEFI_POOL_DATA_ID,
      startedAtTimestamp: 1735139990n,
      poolsCount: 0,
    };
    let timestamp1 = BigInt(1735139990); // Wednesday, December 25, 2024 3:19:50 PM
    let timestamp2 = BigInt(1735143350); // Wednesday, December 25, 2024 4:15:50 PM
    let timestamp3 = BigInt(1735142150); // Wednesday, December 25, 2024 3:55:50 PM;
    let timestamp4 = BigInt(1735142612); // Wednesday, December 25, 2024 4:03:32 PM

    let id1 = getDeFiPoolHourlyDataId(timestamp1, defiPoolDataEntity);
    let id2 = getDeFiPoolHourlyDataId(timestamp2, defiPoolDataEntity);
    let id3 = getDeFiPoolHourlyDataId(timestamp3, defiPoolDataEntity);
    let id4 = getDeFiPoolHourlyDataId(timestamp4, defiPoolDataEntity);

    assert.equal(id1, id2, "id1 and id2 should be equal");
    assert.equal(id3, id4, "id3 and id4 should be equal");
    assert.equal(id1, id3, "id1 and id3 should be equal");
    assert.equal(id1, id4, "id1 and id4 should be equal");
    assert.equal(id2, id4, "id2 and id4 should be equal");
  });

  it(`'getPoolHourlyDataId' should return different ids for passed timestamps more than 1 hour of each other`, () => {
    const defiPoolDataEntity: DeFiPoolData = {
      id: DEFI_POOL_DATA_ID,
      startedAtTimestamp: 1735139990n,
      poolsCount: 0,
    };

    let timestamp1 = BigInt(1735140521); // Wednesday, December 25, 2024 3:28:41 PM
    let timestamp2 = BigInt(1735147241); // Wednesday, December 25, 2024 5:20:41 PM

    let id1 = getDeFiPoolHourlyDataId(timestamp1, defiPoolDataEntity);
    let id2 = getDeFiPoolHourlyDataId(timestamp2, defiPoolDataEntity);

    assert.notEqual(id1, id2, "id1 and id2 should be different");
  });
});
