import assert from "assert";
import { Pool, Token } from "generated";
import { ZERO_ADDRESS } from "../../src/common/constants";
import { IndexerNetwork } from "../../src/common/enums/indexer-network";
import {
  findNativeToken,
  findStableToken,
  findWrappedNative,
  getPoolDailyDataId,
  getPoolHourlyDataId,
  isNativePool,
  isStablePool,
  isVariableWithStablePool,
  isWrappedNativePool,
} from "../../src/common/pool-commons";

describe("PoolCommons", () => {
  it(`When a pool has the token 0 as stablecoin,
        and token 1 as not-stablecoin,
        'isVariableWithStablePool' should return true
        `, () => {
    const network = IndexerNetwork.ETHEREUM;

    const token0: Token = {
      tokenAddress: IndexerNetwork.stablecoinsAddresses(network)[0],
    } as Token;

    const token1: Token = {
      tokenAddress: "0x0000000000000000000000000000000000000001",
    } as Token;

    assert(isVariableWithStablePool(token0, token1, network));
  });

  it(`When a pool has the token 0 as non-stablecoin,
        and token 1 as stablecoin,
        'isVariableWithStablePool' should return true
        `, () => {
    const network = IndexerNetwork.ETHEREUM;

    const token1: Token = {
      tokenAddress: IndexerNetwork.stablecoinsAddresses(network)[0],
    } as Token;

    const token0: Token = {
      tokenAddress: "0x0000000000000000000000000000000000000001",
    } as Token;

    assert(isVariableWithStablePool(token0, token1, network));
  });

  it(`When a pool has the token 0 as non-stablecoin,
        and token 1 as non-stablecoin,
        'isVariableWithStablePool' should return false
        `, () => {
    const network = IndexerNetwork.ETHEREUM;

    const token0: Token = {
      tokenAddress: "0x0000000000000000000000000000000000000002",
    } as Token;

    const token1: Token = {
      tokenAddress: "0x0000000000000000000000000000000000000001",
    } as Token;

    assert(!isVariableWithStablePool(token0, token1, network));
  });

  it(`When a pool has the token 0 as stablecoin,
        and token 1 as stablecoin,
        'isVariableWithStablePool' should return false
        `, () => {
    const network = IndexerNetwork.ETHEREUM;

    const token0: Token = {
      tokenAddress: IndexerNetwork.stablecoinsAddresses(network)[0],
    } as Token;

    const token1: Token = {
      tokenAddress: IndexerNetwork.stablecoinsAddresses(network)[1],
    } as Token;
    assert(!isVariableWithStablePool(token0, token1, network));
  });

  it(`when a pool has the token 0 as stablecoin and token 1 as stablecoin,
        'isStablePool' should return true
        `, () => {
    const network = IndexerNetwork.ETHEREUM;

    const token0: Token = {
      tokenAddress: IndexerNetwork.stablecoinsAddresses(network)[0],
    } as Token;

    const token1: Token = {
      tokenAddress: IndexerNetwork.stablecoinsAddresses(network)[1],
    } as Token;

    assert(isStablePool(token0, token1, network));
  });

  it(`when a pool has the token 0 as stablecoin and token 1 as non-stablecoin,
        'isStablePool' should return false
        `, () => {
    const network = IndexerNetwork.ETHEREUM;

    const token0: Token = {
      tokenAddress: IndexerNetwork.stablecoinsAddresses(network)[0],
    } as Token;

    const token1: Token = {
      tokenAddress: "0x0000000000000000000000000000000000000001",
    } as Token;

    assert(!isStablePool(token0, token1, network));
  });

  it(`when a pool has the token 0 as non-stablecoin and token 1 as stablecoin,
        'isStablePool' should return false
        `, () => {
    const network = IndexerNetwork.ETHEREUM;

    const token0: Token = {
      tokenAddress: "0x0000000000000000000000000000000000000002",
    } as Token;

    const token1: Token = {
      tokenAddress: IndexerNetwork.stablecoinsAddresses(network)[1],
    } as Token;

    assert(!isStablePool(token0, token1, network));
  });

  it(`when a pool has the token 0 as non-stablecoin and token 1 as non-stablecoin,
        'isStablePool' should return false
        `, () => {
    const network = IndexerNetwork.ETHEREUM;

    const token0: Token = {
      tokenAddress: "0x0000000000000000000000000000000000000002",
    } as Token;

    const token1: Token = {
      tokenAddress: "0x0000000000000000000000000000000000000001",
    } as Token;

    assert(!isStablePool(token0, token1, network));
  });

  it(`when a pool has the token 0 as wrapped native,
        'isWrappedNativePool' should return true
        `, () => {
    const network = IndexerNetwork.ETHEREUM;

    const token0: Token = {
      tokenAddress: IndexerNetwork.wrappedNativeAddress(network),
    } as Token;

    const token1: Token = {
      tokenAddress: IndexerNetwork.stablecoinsAddresses(network)[1],
    } as Token;

    assert(isWrappedNativePool(token0, token1, network));
  });

  it(`when a pool has the token 1 as wrapped native,
        'isWrappedNativePool' should return true
        `, () => {
    const network = IndexerNetwork.ETHEREUM;

    const token1: Token = {
      tokenAddress: IndexerNetwork.wrappedNativeAddress(network),
    } as Token;

    const token0: Token = {
      tokenAddress: IndexerNetwork.stablecoinsAddresses(network)[1],
    } as Token;

    assert(isWrappedNativePool(token0, token1, network));
  });

  it(`when a pool has the token 0 as non-wrapped native,
        and token 1 as non-wrapped native,
        'isWrappedNativePool' should return true
        `, () => {
    const network = IndexerNetwork.ETHEREUM;

    const token0: Token = {
      tokenAddress: "0x0000000000000000000000000000000000000002",
    } as Token;

    const token1: Token = {
      tokenAddress: "0x0000000000000000000000000000000000000003",
    } as Token;

    assert(!isWrappedNativePool(token0, token1, network));
  });

  it(`when a pool has the token 1 as stablecoin,
        and 'findStableToken' is called, it should
        return the token 1`, () => {
    const network = IndexerNetwork.ETHEREUM;

    const token0: Token = {
      id: "toko-0",
      tokenAddress: "0x0000000000000000000000000000000000000002",
    } as Token;

    const token1: Token = {
      id: "toko-1",
      tokenAddress: IndexerNetwork.stablecoinsAddresses(network)[1],
    } as Token;

    assert.equal(findStableToken(token0, token1, network).id, token1.id);
  });

  it(`when a pool has the token 0 as stablecoin,
        and 'findStableToken' is called, it should
        return the token 0`, () => {
    const network = IndexerNetwork.ETHEREUM;

    const token1: Token = {
      id: "toko-1",
      tokenAddress: "0x0000000000000000000000000000000000000002",
    } as Token;

    const token0: Token = {
      id: "toko-0",
      tokenAddress: IndexerNetwork.stablecoinsAddresses(network)[1],
    } as Token;

    assert.equal(findStableToken(token0, token1, network).id, token0.id);
  });

  it(`when a pool has the token 0 as non-stablecoin,
        and token 1 also as non-stablecoin, 'findStableToken' should
        throw an error`, () => {
    const network = IndexerNetwork.ETHEREUM;

    const token0: Token = {
      tokenAddress: "0x0000000000000000000000000000000000000002",
    } as Token;

    const token1: Token = {
      tokenAddress: "0x0000000000000000000000000000000000000003",
    } as Token;

    assert.throws(
      () => findStableToken(token0, token1, network),
      Error("Pool does not have a stable asset, no stable token can be found")
    );
  });

  it(`When a pool has the token0 as wrapped native, 
        'findWrappedNative' should return the token 0
        `, () => {
    const network = IndexerNetwork.ETHEREUM;

    const token0: Token = {
      id: "toko-0",
      tokenAddress: IndexerNetwork.wrappedNativeAddress(network),
    } as Token;

    const token1: Token = {
      id: "toko-1",
      tokenAddress: "0x0000000000000000000000000000000000000003",
    } as Token;

    assert.equal(findWrappedNative(token0, token1, network).id, token0.id);
  });

  it(`When a pool has the token1 as wrapped native, 
        'findWrappedNative' should return the token 1
        `, () => {
    const network = IndexerNetwork.ETHEREUM;

    const token0: Token = {
      id: "toko-0",
      tokenAddress: "0x0000000000000000000000000000000000000002",
    } as Token;

    const token1: Token = {
      id: "toko-1",
      tokenAddress: IndexerNetwork.wrappedNativeAddress(network),
    } as Token;

    assert.equal(findWrappedNative(token0, token1, network).id, token1.id);
  });

  it(`when a pool has the token 0 as non-wrapped native,
        and token 1 as non-wrapped native,
        'findWrappedNative' should throw an error
        `, () => {
    const network = IndexerNetwork.ETHEREUM;

    const token0: Token = {
      id: "toko-0",
      tokenAddress: "0x0000000000000000000000000000000000000002",
    } as Token;

    const token1: Token = {
      id: "toko-1",
      tokenAddress: "0x0000000000000000000000000000000000000003",
    } as Token;

    assert.throws(
      () => findWrappedNative(token0, token1, network),
      Error("Pool does not have a wrapped native asset, no wrapped native token can be found")
    );
  });

  it(`'getPoolHourlyDataId' should return the same id for passed timestamps that is less than 1 hour of each other`, () => {
    let pool: Pool = {
      createdAtTimestamp: BigInt(1735139990),
      poolAddress: "0x0000000000000000000000000000000000000001",
    } as Pool;

    let timestamp1 = BigInt(1735139990); // Wednesday, December 25, 2024 3:19:50 PM
    let timestamp2 = BigInt(1735143350); // Wednesday, December 25, 2024 4:15:50 PM
    let timestamp3 = BigInt(1735142150); // Wednesday, December 25, 2024 3:55:50 PM;
    let timestamp4 = BigInt(1735142612); // Wednesday, December 25, 2024 4:03:32 PM

    let id1 = getPoolHourlyDataId(timestamp1, pool);
    let id2 = getPoolHourlyDataId(timestamp2, pool);
    let id3 = getPoolHourlyDataId(timestamp3, pool);
    let id4 = getPoolHourlyDataId(timestamp4, pool);

    assert.equal(id1, id2, "id1 and id2 should be equal");
    assert.equal(id3, id4, "id3 and id4 should be equal");
    assert.equal(id1, id3, "id1 and id3 should be equal");
    assert.equal(id1, id4, "id1 and id4 should be equal");
    assert.equal(id2, id4, "id2 and id4 should be equal");
  });

  it(`'getPoolHourlyDataId' should return different ids for passed timestamps more than 1 hour of each other`, () => {
    let pool: Pool = {
      createdAtTimestamp: BigInt(1735139990),
      poolAddress: "0x0000000000000000000000000000000000000001",
    } as Pool;

    let timestamp1 = BigInt(1735140521); // Wednesday, December 25, 2024 3:28:41 PM
    let timestamp2 = BigInt(1735147241); // Wednesday, December 25, 2024 5:20:41 PM

    let id1 = getPoolHourlyDataId(timestamp1, pool);
    let id2 = getPoolHourlyDataId(timestamp2, pool);

    assert(!(id1 == id2), "id1 and id2 should be different");
  });

  it(`'getPoolDailyDataId' should return the same id for passed timestamps within 1 day (24h) of each other`, () => {
    let pool: Pool = {
      createdAtTimestamp: BigInt(1735139990),
      poolAddress: "0x0000000000000000000000000000000000000001",
    } as Pool;

    let timestamp1 = BigInt(1735141628); // Wednesday, December 25, 2024 3:47:08 PM
    let timestamp2 = BigInt(1735224367); // Thursday, December 26, 2024 2:46:07 PM
    let timestamp3 = BigInt(1735180957); // Thursday, December 26, 2024 2:42:37 AM
    let timestamp4 = BigInt(1735152157); // Wednesday, December 25, 2024 6:42:37 PM

    let id1 = getPoolDailyDataId(timestamp1, pool);
    let id2 = getPoolDailyDataId(timestamp2, pool);
    let id3 = getPoolDailyDataId(timestamp3, pool);
    let id4 = getPoolDailyDataId(timestamp4, pool);

    assert.equal(id1, id2, "id1 and id2 should be equal");
    assert.equal(id3, id4, "id3 and id4 should be equal");
    assert.equal(id1, id3, "id1 and id3 should be equal");
    assert.equal(id1, id4, "id1 and id4 should be equal");
    assert.equal(id2, id4, "id2 and id4 should be equal");
  });

  it(`'getPoolDailyDataId' should return different ids for passed timestamps more than 1 day of each other`, () => {
    let pool: Pool = {
      createdAtTimestamp: BigInt(1735139990),
      poolAddress: "0x0000000000000000000000000000000000000001",
    } as Pool;

    let timestamp1 = BigInt(1735224367); // Thursday, December 26, 2024 2:46:07 PM
    let timestamp2 = BigInt(1735310887); // Friday, December 27, 2024 2:48:07 PM

    let id1 = getPoolDailyDataId(timestamp1, pool);
    let id2 = getPoolDailyDataId(timestamp2, pool);

    assert(!(id1 == id2), "id1 and id2 should be different");
  });

  it("When calling 'isNativePool' and the pool token 0 is native(has zero address), it should return true", () => {
    let token0: Token = {
      tokenAddress: ZERO_ADDRESS,
    } as Token;

    let token1: Token = {
      tokenAddress: "0x0000000000000000000000000000000000000021",
    } as Token;

    let result = isNativePool(token0, token1);

    assert(result);
  });

  it("When calling 'isNativePool' and the pool token 1 is native(has zero address), it should return true", () => {
    let token0: Token = {
      tokenAddress: "0x0000000000000000000000000000000000000021",
    } as Token;

    let token1: Token = {
      tokenAddress: ZERO_ADDRESS,
    } as Token;

    let result = isNativePool(token0, token1);

    assert(result);
  });

  it("When calling 'isNativePool' and none of the tokens in the pool are native(has zero address), it should return false", () => {
    let token0: Token = {
      tokenAddress: "0x0000000000000000000000000000000000000021",
    } as Token;

    let token1: Token = {
      tokenAddress: "0x0000000000000000000000000000000000000022",
    } as Token;

    let result = isNativePool(token0, token1);

    assert(!result, "isNativePool should return false");
  });

  it("When calling 'findNativeToken' and the token 1 is the native token(has zero address), it should return it", () => {
    let token0: Token = {
      id: "toko-0",
      tokenAddress: "0x0000000000000000000000000000000000000021",
    } as Token;

    let token1: Token = {
      id: "toko-1",
      tokenAddress: ZERO_ADDRESS,
    } as Token;

    let result = findNativeToken(token0, token1);

    assert.equal(result.id, token1.id);
  });

  it("When calling 'findNativeToken' and the token 0 is the native token(has zero address), it should return it", () => {
    let token0: Token = {
      id: "toko-0",
      tokenAddress: ZERO_ADDRESS,
    } as Token;

    let token1: Token = {
      id: "toko-1",
      tokenAddress: "0x0000000000000000000000000000000000000022",
    } as Token;

    let result = findNativeToken(token0, token1);

    assert.equal(result.id, token0.id);
  });

  it("When calling `findNativeToken` but there are no native tokens in the pool, it should assert", () => {
    let token0: Token = {
      id: "toko-0",
      tokenAddress: "0x0000000000000000000000000000000000000021",
    } as Token;

    let token1: Token = {
      id: "toko-1",
      tokenAddress: "0x0000000000000000000000000000000000000022",
    } as Token;

    assert.throws(
      () => findNativeToken(token0, token1),
      Error("Pool does not have a native asset, no native token can be found")
    );
  });
});
