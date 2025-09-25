import assert from "assert";
import { BigDecimal, Pool, Token } from "generated";
import { ZERO_ADDRESS, ZERO_BIG_DECIMAL } from "../../src/common/constants";
import { IndexerNetwork } from "../../src/common/enums/indexer-network";
import {
  findNativeToken,
  findStableToken,
  findWrappedNative,
  getLiquidityInflowAndOutflowFromRawAmounts,
  getPoolDailyDataId,
  getPoolHourlyDataId,
  getRawFeeFromTokenAmount,
  getSwapFeesFromRawAmounts,
  getSwapVolumeFromAmounts,
  getTokenAmountInPool,
  isNativePool,
  isPoolSwapVolumeValid,
  isStablePool,
  isVariableWithStablePool,
  isWrappedNativePool,
} from "../../src/common/pool-commons";
import { formatFromTokenAmount } from "../../src/common/token-commons";
import { PoolMock, TokenMock } from "../mocks";

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

  it("when the pool swap volume is zero, it should return false for `isPoolSwapVolumeValid`", () => {
    let pool = new PoolMock();

    pool = {
      ...pool,
      swapVolumeUSD: ZERO_BIG_DECIMAL,
    };

    assert.equal(isPoolSwapVolumeValid(pool), false);
  });

  it("when the pool swap volume is not zero, it should return true for `isPoolSwapVolumeValid`", () => {
    let pool = new PoolMock();

    pool = {
      ...pool,
      swapVolumeUSD: BigDecimal("21"),
    };

    assert.equal(isPoolSwapVolumeValid(pool), true);
  });

  it(`should return the amount0 inflow when passing a positive amount`, () => {
    const token0 = new TokenMock();
    const token1 = new TokenMock();
    const amount0 = 2121n;
    const amount1 = 97219182n;

    const result = getLiquidityInflowAndOutflowFromRawAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.inflowToken0, formatFromTokenAmount(amount0, token0));
  });

  it(`should return zero as inflow for token 0 when passing a negative amount`, () => {
    const token0 = new TokenMock();
    const token1 = new TokenMock();
    const amount0 = -2121n;
    const amount1 = 97219182n;

    const result = getLiquidityInflowAndOutflowFromRawAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.inflowToken0, ZERO_BIG_DECIMAL);
  });

  it(`should correctly calculate the token1 inflow when passing a positive
    amount to 'getLiquidityInflowAndOutflowFromRawAmounts'`, () => {
    const token0 = new TokenMock();
    const token1 = new TokenMock();
    const amount0 = 2121n;
    const amount1 = 97219182n;

    const result = getLiquidityInflowAndOutflowFromRawAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.inflowToken1, formatFromTokenAmount(amount1, token1));
  });

  it(`should return zero as inflow for token 1 when passing a negative amount`, () => {
    const token0 = new TokenMock();
    const token1 = new TokenMock();
    const amount0 = 2121n;
    const amount1 = -97219182n;

    const result = getLiquidityInflowAndOutflowFromRawAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.inflowToken1, ZERO_BIG_DECIMAL);
  });

  it(`should sum the inflow from token0 and token1 then multiply by its prices
   to return the total inflow USD when passing a positive amount`, () => {
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const token0USDPrice = BigDecimal("1200");
    const token1USDPrice = BigDecimal("5");
    const amount0 = 2121n;
    const amount1 = 97219182n;
    const expectedInflowUSD = formatFromTokenAmount(amount0, token0)
      .times(token0USDPrice)
      .plus(formatFromTokenAmount(amount1, token1).times(token1USDPrice));

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    const result = getLiquidityInflowAndOutflowFromRawAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.inflowUSD, expectedInflowUSD);
  });

  it(`should return zero as inflow usd when both amount0 and amount1 are negative`, () => {
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const token0USDPrice = BigDecimal("1200");
    const token1USDPrice = BigDecimal("5");
    const amount0 = -2121n;
    const amount1 = -97219182n;
    const expectedInflowUSD = ZERO_BIG_DECIMAL;

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    const result = getLiquidityInflowAndOutflowFromRawAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.inflowUSD, expectedInflowUSD);
  });

  it(`should return only return the inflow usd from token0 when
    amount1 is negative but amount0 is positive`, () => {
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const token0USDPrice = BigDecimal("1200");
    const token1USDPrice = BigDecimal("5");
    const amount0 = 2121n;
    const amount1 = -97219182n;
    const expectedInflowUSD = formatFromTokenAmount(amount0, token0).times(token0USDPrice);

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    const result = getLiquidityInflowAndOutflowFromRawAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.inflowUSD, expectedInflowUSD);
  });

  it(`should return only return the inflow usd from token1 when
    amount0 is negative but amount1 is positive`, () => {
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const token0USDPrice = BigDecimal("1200");
    const token1USDPrice = BigDecimal("5");
    const amount0 = -2121n;
    const amount1 = 97219182n;
    const expectedInflowUSD = formatFromTokenAmount(amount1, token1).times(token1USDPrice);

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    const result = getLiquidityInflowAndOutflowFromRawAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.inflowUSD, expectedInflowUSD);
  });

  it(`should return the amount zero negative for net inflow token0 if the amount0 is negative`, () => {
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const token0USDPrice = BigDecimal("1200");
    const token1USDPrice = BigDecimal("5");
    const amount0 = -2121n;
    const amount1 = 97219182n;

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    const result = getLiquidityInflowAndOutflowFromRawAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.netInflowToken0, formatFromTokenAmount(amount0, token0));
  });

  it(`should return the amount zero positive for net inflow token0 if the amount0 is positive`, () => {
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const token0USDPrice = BigDecimal("1200");
    const token1USDPrice = BigDecimal("5");
    const amount0 = 2121n;
    const amount1 = 97219182n;

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    const result = getLiquidityInflowAndOutflowFromRawAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.netInflowToken0, formatFromTokenAmount(amount0, token0));
  });

  it(`should return the amount one negative for net inflow token1 if the amount1 is negative`, () => {
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const token0USDPrice = BigDecimal("1200");
    const token1USDPrice = BigDecimal("5");
    const amount0 = 2121n;
    const amount1 = -97219182n;

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    const result = getLiquidityInflowAndOutflowFromRawAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.netInflowToken1, formatFromTokenAmount(amount1, token1));
  });

  it(`should return the amount one positive for net inflow token1 if the amount1 is positive`, () => {
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const token0USDPrice = BigDecimal("1200");
    const token1USDPrice = BigDecimal("5");
    const amount0 = 2121n;
    const amount1 = 97219182n;

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    const result = getLiquidityInflowAndOutflowFromRawAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.netInflowToken1, formatFromTokenAmount(amount1, token1));
  });

  it(`should return the amount 1 summed with amount 0 and multiplied by its prices for net inflow USD
    if the amount0 and amount1 are positive, the result should also be positive`, () => {
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const token0USDPrice = BigDecimal("1200");
    const token1USDPrice = BigDecimal("5");
    const amount0 = 2121n;
    const amount1 = 9090n;
    const expectedNetInflowUSD = formatFromTokenAmount(amount0, token0)
      .times(token0USDPrice)
      .plus(formatFromTokenAmount(amount1, token1).times(token1USDPrice));

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    const result = getLiquidityInflowAndOutflowFromRawAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.netInflowUSD, expectedNetInflowUSD);
  });

  it(`should return the amount 1 summed with amount 0 and multiplied by its prices for net inflow USD
    if the amount0 and amount1 are negative, the result should also be negative`, () => {
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const token0USDPrice = BigDecimal("1200");
    const token1USDPrice = BigDecimal("5");
    const amount0 = -2121n;
    const amount1 = -9090n;
    const expectedNetInflowUSD = formatFromTokenAmount(amount0, token0)
      .times(token0USDPrice)
      .plus(formatFromTokenAmount(amount1, token1).times(token1USDPrice));

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    const result = getLiquidityInflowAndOutflowFromRawAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.netInflowUSD, expectedNetInflowUSD);
  });

  it(`should return the amount 0 minus amount 1 and multiplied by its prices for net inflow USD
    if the amount0 is negative and amount1 is positive`, () => {
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const token0USDPrice = BigDecimal("1200");
    const token1USDPrice = BigDecimal("5");
    const amount0 = -2121n;
    const amount1 = 9090n;
    const expectedNetInflowUSD = formatFromTokenAmount(amount0, token0)
      .times(token0USDPrice)
      .plus(formatFromTokenAmount(amount1, token1).times(token1USDPrice));

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    const result = getLiquidityInflowAndOutflowFromRawAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.netInflowUSD, expectedNetInflowUSD);
  });

  it(`should return the amount 1 minus amount 0 and multiplied by its prices for net inflow USD
    if the amount1 is negative and amount0 is positive`, () => {
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const token0USDPrice = BigDecimal("1200");
    const token1USDPrice = BigDecimal("5");
    const amount0 = 2121n;
    const amount1 = -9090n;
    const expectedNetInflowUSD = formatFromTokenAmount(amount0, token0)
      .times(token0USDPrice)
      .plus(formatFromTokenAmount(amount1, token1).times(token1USDPrice));

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    const result = getLiquidityInflowAndOutflowFromRawAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.netInflowUSD, expectedNetInflowUSD);
  });

  it(`should return zero for token0 outflow if the amount0 is positive`, () => {
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const amount0 = 2121n;
    const amount1 = -9090n;

    const result = getLiquidityInflowAndOutflowFromRawAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.outflowToken0, ZERO_BIG_DECIMAL);
  });

  it(`should return the amount0 abs for token0 outflow if the amount0 is negative`, () => {
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const amount0 = -2121n;
    const amount1 = -9090n;

    const result = getLiquidityInflowAndOutflowFromRawAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.outflowToken0, formatFromTokenAmount(amount0, token0).abs());
  });

  it(`should return the amount1 abs for token1 outflow if the amount1 is negative`, () => {
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const amount0 = -2121n;
    const amount1 = -9090n;

    const result = getLiquidityInflowAndOutflowFromRawAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.outflowToken1, formatFromTokenAmount(amount1, token1).abs());
  });

  it(`should return zero for token1 outflow if the amount1 is positive`, () => {
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const amount0 = -2121n;
    const amount1 = 9090n;

    const result = getLiquidityInflowAndOutflowFromRawAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.outflowToken1, ZERO_BIG_DECIMAL);
  });

  it("should return the amount0 abs plus amount1 usd for outflowUSD if amount0 and amount1 are negative", () => {
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const token0USDPrice = BigDecimal("1111");
    const token1USDPrice = BigDecimal("7777");
    const amount0 = -2121n;
    const amount1 = -9090n;
    const expectedOutflowUSD = formatFromTokenAmount(amount0, token0)
      .abs()
      .times(token0USDPrice)
      .plus(formatFromTokenAmount(amount1, token1).abs().times(token1USDPrice));

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    const result = getLiquidityInflowAndOutflowFromRawAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.outflowUSD, expectedOutflowUSD);
  });

  it("should return only the amount0 usd for outflowUSD if amount1 is positive and amount0 is negative", () => {
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const token0USDPrice = BigDecimal("192891");
    const token1USDPrice = BigDecimal("12");
    const amount0 = -120917n;
    const amount1 = 191919191n;
    const expectedOutflowUSD = formatFromTokenAmount(amount0, token0).abs().times(token0USDPrice);

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    const result = getLiquidityInflowAndOutflowFromRawAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.outflowUSD, expectedOutflowUSD);
  });

  it("should return only the amount1 usd for outflowUSD if amount1 is negative and amount0 is positive", () => {
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const token0USDPrice = BigDecimal("192891");
    const token1USDPrice = BigDecimal("12");
    const amount0 = 120917n;
    const amount1 = -191919191n;
    const expectedOutflowUSD = formatFromTokenAmount(amount1, token1).abs().times(token1USDPrice);

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    const result = getLiquidityInflowAndOutflowFromRawAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.outflowUSD, expectedOutflowUSD);
  });

  it("should return zero for the outflow usd if both amount0 and amount1 are positive", () => {
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    const token0USDPrice = BigDecimal("192891");
    const token1USDPrice = BigDecimal("12");
    const amount0 = 120917n;
    const amount1 = 191919191n;

    token0 = {
      ...token0,
      usdPrice: token0USDPrice,
    };

    token1 = {
      ...token1,
      usdPrice: token1USDPrice,
    };

    const result = getLiquidityInflowAndOutflowFromRawAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.outflowUSD, ZERO_BIG_DECIMAL);
  });

  it("should return the amount0 as volume0 if the amount0 is positive and amount1 is negative", () => {
    const amount0 = BigDecimal(2121);
    const amount1 = BigDecimal(-9090);
    const token0USDPrice = BigDecimal("192891");
    const token1USDPrice = BigDecimal("12");
    let token0: Token = {
      ...new TokenMock(),
      usdPrice: token0USDPrice,
    };

    let token1: Token = {
      ...new TokenMock(),
      usdPrice: token1USDPrice,
    };

    const result = getSwapVolumeFromAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.volumeToken0, amount0);
  });

  it("should return zero as volume0 if the amount0 is negative and amount1 is positive", () => {
    const amount0 = BigDecimal(-2121);
    const amount1 = BigDecimal(9090);
    const token0USDPrice = BigDecimal("192891");
    const token1USDPrice = BigDecimal("12");
    const token0: Token = {
      ...new TokenMock(),
      usdPrice: token0USDPrice,
    };

    const token1: Token = {
      ...new TokenMock(),
      usdPrice: token1USDPrice,
    };

    const result = getSwapVolumeFromAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.volumeToken0, ZERO_BIG_DECIMAL);
  });

  it("should return the amount1 as volume1 if the amount1 is positive and amount0 is negative", () => {
    const amount0 = BigDecimal(-2121);
    const amount1 = BigDecimal(9090);
    const token0USDPrice = BigDecimal("192891");
    const token1USDPrice = BigDecimal("12");
    const token0: Token = {
      ...new TokenMock(),
      usdPrice: token0USDPrice,
    };

    const token1: Token = {
      ...new TokenMock(),
      usdPrice: token1USDPrice,
    };

    const result = getSwapVolumeFromAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.volumeToken1, amount1);
  });

  it("should return zero as volume1 if the amount1 is negative and amount0 is positive", () => {
    const amount0 = BigDecimal(2121);
    const amount1 = BigDecimal(-9090);
    const token0USDPrice = BigDecimal("192891");
    const token1USDPrice = BigDecimal("12");
    const token0: Token = {
      ...new TokenMock(),
      usdPrice: token0USDPrice,
    };

    const token1: Token = {
      ...new TokenMock(),
      usdPrice: token1USDPrice,
    };

    const result = getSwapVolumeFromAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.volumeToken1, ZERO_BIG_DECIMAL);
  });

  it(`should return the amount0 times token0 usd price as
    volume0 usd if the amount0 is positive and amount1 is
    negative`, () => {
    const amount0 = BigDecimal(2121);
    const amount1 = BigDecimal(-9090);
    const token0USDPrice = BigDecimal("192891");
    const token1USDPrice = BigDecimal("12");
    const token0: Token = {
      ...new TokenMock(),
      usdPrice: token0USDPrice,
    };

    const token1: Token = {
      ...new TokenMock(),
      usdPrice: token1USDPrice,
    };

    const result = getSwapVolumeFromAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.volumeToken0USD, amount0.times(token0USDPrice));
  });

  it(`should return zero as volume0 usd if the
    amount0 is negative and amount1 is positive`, () => {
    const amount0 = BigDecimal(-2121);
    const amount1 = BigDecimal(9090);
    const token0USDPrice = BigDecimal("192891");
    const token1USDPrice = BigDecimal("12");
    const token0: Token = {
      ...new TokenMock(),
      usdPrice: token0USDPrice,
    };

    const token1: Token = {
      ...new TokenMock(),
      usdPrice: token1USDPrice,
    };

    const result = getSwapVolumeFromAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.volumeToken0USD, ZERO_BIG_DECIMAL);
  });

  it(`should return the amount1 times token1 usd price as
    volume1 usd if the amount1 is positive and amount0 is
    negative`, () => {
    const amount0 = BigDecimal(-2121);
    const amount1 = BigDecimal(9090);
    const token0USDPrice = BigDecimal("192891");
    const token1USDPrice = BigDecimal("12");
    const token0: Token = {
      ...new TokenMock(),
      usdPrice: token0USDPrice,
    };

    const token1: Token = {
      ...new TokenMock(),
      usdPrice: token1USDPrice,
    };

    const result = getSwapVolumeFromAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.volumeToken1USD, amount1.times(token1USDPrice));
  });

  it(`should return zero as volume1 usd if the amount1
    is negative and amount0 is positive`, () => {
    const amount0 = BigDecimal(2121);
    const amount1 = BigDecimal(-9090);
    const token0USDPrice = BigDecimal("192891");
    const token1USDPrice = BigDecimal("12");
    const token0: Token = {
      ...new TokenMock(),
      usdPrice: token0USDPrice,
    };

    const token1: Token = {
      ...new TokenMock(),
      usdPrice: token1USDPrice,
    };

    const result = getSwapVolumeFromAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.volumeToken1USD, ZERO_BIG_DECIMAL);
  });

  it(`should return the amount 1 times token 1 usd price if the amount0 is
    negative, and amount1 is positive`, () => {
    const amount0 = BigDecimal(-2121);
    const amount1 = BigDecimal(9090);
    const token0USDPrice = BigDecimal("192891");
    const token1USDPrice = BigDecimal("12");
    const token0: Token = {
      ...new TokenMock(),
      usdPrice: token0USDPrice,
    };

    const token1: Token = {
      ...new TokenMock(),
      usdPrice: token1USDPrice,
    };

    const result = getSwapVolumeFromAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.volumeUSD, amount1.times(token1USDPrice));
  });

  it(`should return the amount 0 times token 0 usd price if the amount1 is
    negative, and amount0 is positive`, () => {
    const amount0 = BigDecimal(2121);
    const amount1 = BigDecimal(-9090);
    const token0USDPrice = BigDecimal("192891");
    const token1USDPrice = BigDecimal("12");
    const token0: Token = {
      ...new TokenMock(),
      usdPrice: token0USDPrice,
    };

    const token1: Token = {
      ...new TokenMock(),
      usdPrice: token1USDPrice,
    };

    const result = getSwapVolumeFromAmounts(amount0, amount1, token0, token1);

    assert.deepEqual(result.volumeUSD, amount0.times(token0USDPrice));
  });

  it(`should return zero as swap fees for token0 if amount 1
    is positive and amount 0 is negative`, () => {
    const amount0 = -2121n;
    const amount1 = 9090n;
    const swapFee = 500;
    const token0: Token = {
      ...new TokenMock(),
      usdPrice: BigDecimal("192891"),
    };

    const token1: Token = {
      ...new TokenMock(),
      usdPrice: BigDecimal("12"),
    };

    const result = getSwapFeesFromRawAmounts(amount0, amount1, swapFee, token0, token1);

    assert.deepEqual(result.feeToken0, ZERO_BIG_DECIMAL);
  });

  it(`should correctly calculate the swap fees for amount0
    if amount0 is positive and amount1 is negative`, () => {
    const amount0 = 2121n;
    const amount1 = -9090n;
    const swapFee = 5000;
    const token0: Token = {
      ...new TokenMock(),
      usdPrice: BigDecimal("192891"),
    };

    const token1: Token = {
      ...new TokenMock(),
      usdPrice: BigDecimal("12"),
    };
    const expectedToken0Fees = formatFromTokenAmount(getRawFeeFromTokenAmount(amount0, swapFee), token0);

    const result = getSwapFeesFromRawAmounts(amount0, amount1, swapFee, token0, token1);

    assert.deepEqual(result.feeToken0, expectedToken0Fees);
  });

  it(`should return the amount0 swap fee times token0 usd price
    for the feesUSD if amount0 is positive and amount1 is negative`, () => {
    const amount0 = 2121n;
    const amount1 = -9090n;
    const swapFee = 5000;
    const token0: Token = {
      ...new TokenMock(),
      usdPrice: BigDecimal("192891"),
    };

    const token1: Token = {
      ...new TokenMock(),
      usdPrice: BigDecimal("12"),
    };
    const expectedToken0Fees = formatFromTokenAmount(getRawFeeFromTokenAmount(amount0, swapFee), token0);

    const result = getSwapFeesFromRawAmounts(amount0, amount1, swapFee, token0, token1);

    assert.deepEqual(result.feesUSD, expectedToken0Fees.times(token0.usdPrice));
  });

  it(`should return the amount1 swap fee times token1 usd price
    for the feesUSD if amount1 is positive and amount0 is negative`, () => {
    const amount0 = -2121n;
    const amount1 = 9090n;
    const swapFee = 1000;
    const token0: Token = {
      ...new TokenMock(),
      usdPrice: BigDecimal("192891"),
    };

    const token1: Token = {
      ...new TokenMock(),
      usdPrice: BigDecimal("12"),
    };
    const expectedToken1Fees = formatFromTokenAmount(getRawFeeFromTokenAmount(amount1, swapFee), token1);

    const result = getSwapFeesFromRawAmounts(amount0, amount1, swapFee, token0, token1);

    assert.deepEqual(result.feesUSD, expectedToken1Fees.times(token1.usdPrice));
  });

  it(`should correctly calculate the swap fees for amount1
    if amount1 is positive and amount0 is negative`, () => {
    const amount0 = -2121n;
    const amount1 = 9090n;
    const swapFee = 100;
    const token0: Token = {
      ...new TokenMock(),
      usdPrice: BigDecimal("192891"),
    };

    const token1: Token = {
      ...new TokenMock(),
      usdPrice: BigDecimal("12"),
    };
    const expectedToken1Fees = formatFromTokenAmount(getRawFeeFromTokenAmount(amount1, swapFee), token1);

    const result = getSwapFeesFromRawAmounts(amount0, amount1, swapFee, token0, token1);

    assert.deepEqual(result.feeToken1, expectedToken1Fees);
  });

  it(`should return zero as swap fees for token1 if amount 0
    is positive and amount 1 is negative`, () => {
    const amount0 = 2121n;
    const amount1 = -9090n;
    const swapFee = 500;
    const token0: Token = {
      ...new TokenMock(),
      usdPrice: BigDecimal("192891"),
    };

    const token1: Token = {
      ...new TokenMock(),
      usdPrice: BigDecimal("12"),
    };

    const result = getSwapFeesFromRawAmounts(amount0, amount1, swapFee, token0, token1);

    assert.deepEqual(result.feeToken1, ZERO_BIG_DECIMAL);
  });

  it("should return the fees in raw token amount based in the swap fee passed, and amount", () => {
    const rawFee = 10000;
    const rawAmount = 10000n;
    let result = getRawFeeFromTokenAmount(rawAmount, rawFee);

    assert.deepEqual(result, 100n);
  });

  it(`should return the token0 amount when calling 'getTokenAmountInPool'
    with a pool that the token 0 is the same as the passed token`, () => {
    let pool = new PoolMock();
    let token0 = new TokenMock("0x0000000000000000000000000000000000000021");
    let token1 = new TokenMock("0x0000000000000000000000000000000000000031");
    let token0AmountPooled = BigDecimal("391862871");

    pool = {
      ...pool,
      token0_id: token0.id,
      token1_id: token1.id,
      totalValueLockedToken0: token0AmountPooled,
    };

    assert.deepEqual(getTokenAmountInPool(pool, token0), token0AmountPooled);
  });

  it(`should return the token1 amount when calling 'getTokenAmountInPool'
    with a pool that the token 1 is the same as the passed token`, () => {
    let pool = new PoolMock();
    let token0 = new TokenMock("0x0000000000000000000000000000000000000021");
    let token1 = new TokenMock("0x0000000000000000000000000000000000000031");
    let token1AmountPooled = BigDecimal("12314523451");

    pool = {
      ...pool,
      token0_id: token0.id,
      token1_id: token1.id,
      totalValueLockedToken1: token1AmountPooled,
    };

    assert.deepEqual(getTokenAmountInPool(pool, token1), token1AmountPooled);
  });

  it(`should throw if calling 'getTokenAmountInPool' with a pool that neither token0
    or token1 is the same as the passed token`, () => {
    let pool = new PoolMock();
    let token0 = new TokenMock("0x0000000000000000000000000000000000000021");

    pool = {
      ...pool,
      token0_id: "0x0000000000000000000000000000000000000041",
      token1_id: "0x0000000000000000000000000000000000000051",
    };

    assert.throws(
      () => getTokenAmountInPool(pool, token0),
      Error("The passed token doesn't match any token in the passed pool")
    );
  });
});
