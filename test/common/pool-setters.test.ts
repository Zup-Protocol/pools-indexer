import assert from "assert";
import { BigDecimal, handlerContext, Pool, PoolDailyData, PoolHourlyData, Token } from "generated";
import sinon from "sinon";
import { sqrtPriceX96toPrice } from "../../src/common/cl-pool-converters";
import {
  defaultPoolDailyData,
  defaultPoolHourlyData,
  ONE_DAY_IN_SECONDS,
  ONE_HOUR_IN_SECONDS,
  ZERO_ADDRESS,
  ZERO_BIG_DECIMAL,
} from "../../src/common/constants";
import { subtractDaysFromSecondsTimestamp, subtractHoursFromSecondsTimestamp } from "../../src/common/date-commons";
import { IndexerNetwork } from "../../src/common/enums/indexer-network";
import * as PoolCommons from "../../src/common/pool-commons";
import {
  calculateDayYearlyYield,
  calculateHourYearlyYield,
  getLiquidityInflowAndOutflowFromRawAmounts,
  getPoolDailyDataId,
  getPoolHourlyDataId,
  getSwapFeesFromRawAmounts,
} from "../../src/common/pool-commons";
import { PoolSetters } from "../../src/common/pool-setters";
import { formatFromTokenAmount } from "../../src/common/token-commons";
import {
  handlerContextCustomMock,
  PoolDailyDataMock,
  PoolHourlyDataMock,
  PoolMock,
  TokenMock,
  V4PoolDataMock,
} from "../mocks";

describe("PoolSetters", () => {
  let sut: PoolSetters;
  let context: handlerContext;
  let network = IndexerNetwork.ETHEREUM;
  let eventTimestamp = BigInt(Math.floor(Date.now() / 1000));

  beforeEach(() => {
    context = handlerContextCustomMock();
    sut = new PoolSetters(context, network);
  });

  afterEach(() => {
    sinon.restore();
  });

  it(`When calling 'setIntervalDataTVL' and a PoolDailyData entity
      has already been created in the same day, the TVL should be updated
      to the pool's current one`, async () => {
    let poolTotalValueLockedUSD = BigDecimal("100.298");
    let poolTotalValueLockedToken0 = BigDecimal("1.121");
    let poolTotalValueLockedToken1 = BigDecimal("9872.2");
    let eventTimestamp = BigInt(1656105600);
    let pool: Pool = {
      totalValueLockedUSD: poolTotalValueLockedUSD,
      totalValueLockedToken0: poolTotalValueLockedToken0,
      totalValueLockedToken1: poolTotalValueLockedToken1,
      createdAtTimestamp: eventTimestamp,
    } as Pool;
    let oldPoolDailyData: PoolDailyData = {
      id: getPoolDailyDataId(eventTimestamp, pool),
      totalValueLockedUSD: ZERO_BIG_DECIMAL,
      totalValueLockedToken0: ZERO_BIG_DECIMAL,
      totalValueLockedToken1: ZERO_BIG_DECIMAL,
      pool_id: pool.id,
    } as PoolDailyData;

    context.PoolDailyData.set(oldPoolDailyData);
    await sut.setIntervalDataTVL(BigInt(eventTimestamp + BigInt(ONE_HOUR_IN_SECONDS * 2)), pool);

    let updatedDailyData = await context.PoolDailyData.get(oldPoolDailyData.id);

    assert.equal(
      updatedDailyData!.totalValueLockedUSD,
      poolTotalValueLockedUSD,
      "totalValueLockedUSD have not been updated"
    );

    assert.equal(
      updatedDailyData!.totalValueLockedToken0,
      poolTotalValueLockedToken0,
      "totalValueLockedToken0 have not been updated"
    );

    assert.equal(
      updatedDailyData!.totalValueLockedToken1,
      poolTotalValueLockedToken1,
      "totalValueLockedToken1 have not been updated"
    );
  });

  it(`When calling 'setIntervalDataTVL' and a PoolHourlyData entity
      has already been created in the same hour, the TVL should be updated
      to the pool's current one`, async () => {
    let poolTotalValueLockedUSD = BigDecimal("100.298");
    let poolTotalValueLockedToken0 = BigDecimal("1.121");
    let poolTotalValueLockedToken1 = BigDecimal("9872.2");
    let eventTimestamp = BigInt(1656105600);
    let pool: Pool = {
      totalValueLockedUSD: poolTotalValueLockedUSD,
      totalValueLockedToken0: poolTotalValueLockedToken0,
      totalValueLockedToken1: poolTotalValueLockedToken1,
      createdAtTimestamp: eventTimestamp,
    } as Pool;
    let oldPoolHourlyData: PoolHourlyData = {
      id: getPoolHourlyDataId(eventTimestamp, pool),
      totalValueLockedUSD: ZERO_BIG_DECIMAL,
      totalValueLockedToken0: ZERO_BIG_DECIMAL,
      totalValueLockedToken1: ZERO_BIG_DECIMAL,
      pool_id: pool.id,
    } as PoolHourlyData;

    context.PoolHourlyData.set(oldPoolHourlyData);
    await sut.setIntervalDataTVL(BigInt(eventTimestamp + BigInt(ONE_HOUR_IN_SECONDS / 2)), pool);

    let updatedHourlyData = await context.PoolHourlyData.get(oldPoolHourlyData.id);

    assert.equal(
      updatedHourlyData!.totalValueLockedUSD,
      poolTotalValueLockedUSD,
      "totalValueLockedUSD have not been updated"
    );

    assert.equal(
      updatedHourlyData!.totalValueLockedToken0,
      poolTotalValueLockedToken0,
      "totalValueLockedToken0 have not been updated"
    );

    assert.equal(
      updatedHourlyData!.totalValueLockedToken1,
      poolTotalValueLockedToken1,
      "totalValueLockedToken1 have not been updated"
    );
  });

  it(`When calling 'setIntervalDataTVL' and there is not a PoolHourlyData entity
      created in the same hour, a new one should be created and updated.`, async () => {
    let poolTotalValueLockedUSD = BigDecimal("100.298");
    let poolTotalValueLockedToken0 = BigDecimal("1.121");
    let poolTotalValueLockedToken1 = BigDecimal("9872.2");
    let oldEventTimestamp = BigInt(1656105600);
    let newEventTimestamp = BigInt(1656105600) + BigInt(ONE_HOUR_IN_SECONDS * 2);
    let pool: Pool = {
      totalValueLockedUSD: poolTotalValueLockedUSD,
      totalValueLockedToken0: poolTotalValueLockedToken0,
      totalValueLockedToken1: poolTotalValueLockedToken1,
      createdAtTimestamp: oldEventTimestamp,
    } as Pool;
    let oldPoolHourlyData: PoolHourlyData = {
      id: getPoolHourlyDataId(oldEventTimestamp, pool),
      totalValueLockedUSD: BigDecimal("129861892618291"),
      totalValueLockedToken0: BigDecimal("129861892618291"),
      totalValueLockedToken1: BigDecimal("129861892618291"),
      pool_id: pool.id,
    } as PoolHourlyData;

    context.PoolHourlyData.set(oldPoolHourlyData);

    await sut.setIntervalDataTVL(BigInt(newEventTimestamp), pool);

    let updatedHourlyData = await context.PoolHourlyData.get(getPoolHourlyDataId(newEventTimestamp, pool));

    assert.equal(
      updatedHourlyData!.totalValueLockedUSD,
      poolTotalValueLockedUSD,
      "totalValueLockedUSD have not been updated"
    );

    assert.equal(
      updatedHourlyData!.totalValueLockedToken0,
      poolTotalValueLockedToken0,
      "totalValueLockedToken0 have not been updated"
    );

    assert.equal(
      updatedHourlyData!.totalValueLockedToken1,
      poolTotalValueLockedToken1,
      "totalValueLockedToken1 have not been updated"
    );
  });

  it(`When calling 'setIntervalDataTVL' and a PoolDailyData entity
      has not been created in the same day, a new one should be created
      and the TVL should be set to the pool's current one
      `, async () => {
    let todayEventTimestamp = BigInt(1656105600);
    let yesterdayEventTimestamp = todayEventTimestamp - BigInt(ONE_HOUR_IN_SECONDS * 25);
    let poolTotalValueLockedUSD = BigDecimal("100.298");
    let poolTotalValueLockedToken0 = BigDecimal("1.121");
    let poolTotalValueLockedToken1 = BigDecimal("9872.2");
    let pool: Pool = {
      totalValueLockedUSD: poolTotalValueLockedUSD,
      totalValueLockedToken0: poolTotalValueLockedToken0,
      totalValueLockedToken1: poolTotalValueLockedToken1,
      createdAtTimestamp: yesterdayEventTimestamp,
    } as Pool;

    let oldDailyPoolDataYesterday: PoolDailyData = {
      id: getPoolDailyDataId(yesterdayEventTimestamp, pool),
      totalValueLockedUSD: BigDecimal(1233),
      totalValueLockedToken0: BigDecimal(2636256735726),
      totalValueLockedToken1: BigDecimal(372837),
      pool_id: pool.id,
    } as PoolDailyData;

    context.PoolDailyData.set(oldDailyPoolDataYesterday);
    await sut.setIntervalDataTVL(todayEventTimestamp, pool);

    let updatedDailyPoolDataToday = await context.PoolDailyData.get(getPoolDailyDataId(todayEventTimestamp, pool));
    let updatedDailyPoolDataYesterday = await context.PoolDailyData.get(oldDailyPoolDataYesterday.id);

    assert.equal(
      updatedDailyPoolDataYesterday!.totalValueLockedUSD.toString(),
      oldDailyPoolDataYesterday.totalValueLockedUSD.toString(),
      "Daily Pool data yesterday should remain unchanged"
    );

    assert.equal(
      updatedDailyPoolDataYesterday!.totalValueLockedToken0.toString(),
      oldDailyPoolDataYesterday.totalValueLockedToken0,
      "Daily Pool data yesterday should remain unchanged"
    );

    assert.equal(
      updatedDailyPoolDataYesterday!.totalValueLockedToken1,
      oldDailyPoolDataYesterday.totalValueLockedToken1,
      "Daily Pool data yesterday should remain unchanged"
    );

    assert.equal(
      updatedDailyPoolDataToday!.totalValueLockedUSD,
      poolTotalValueLockedUSD,
      "totalValueLockedUSD have not been updated in today's PoolDailyData"
    );

    assert.equal(
      updatedDailyPoolDataToday!.totalValueLockedToken0,
      poolTotalValueLockedToken0,
      "totalValueLockedToken0 have not been updated in today's PoolDailyData"
    );

    assert.equal(
      updatedDailyPoolDataToday!.totalValueLockedToken1,
      poolTotalValueLockedToken1,
      "totalValueLockedToken1 have not been updated in today's PoolDailyData"
    );
  });

  it(`When calling 'updateTokenPricesFromPoolPrices' with a pool of
    token0 stable and token1 non-stable it should return the new token1
    and the token0 price`, async () => {
    let pool = new PoolMock();

    pool = {
      ...pool,
      totalValueLockedToken0: BigDecimal("1200.121"),
      totalValueLockedToken1: BigDecimal("9872.2"),
    };

    const sqrtPriceX96 = BigInt("132117387656662503710917528654277782");
    const stableToken: Token = {
      ...new TokenMock(),
      id: IndexerNetwork.getEntityIdFromAddress(network, IndexerNetwork.stablecoinsAddresses(network)[0]),
      tokenAddress: IndexerNetwork.stablecoinsAddresses(network)[0],
      decimals: 6,
    } as Token;

    const nonStableToken: Token = {
      ...new TokenMock(),
      id: "0xB528edBef013aff855ac3c50b381f253aF13b997",
      tokenAddress: "0xB528edBef013aff855ac3c50b381f253aF13b997",
      decimals: 18,
    } as Token;

    const prices = await sut.updateTokenPricesFromPoolPrices(
      stableToken,
      nonStableToken,
      pool,
      sqrtPriceX96toPrice(sqrtPriceX96, stableToken, nonStableToken)
    );

    assert.equal(prices[1].usdPrice.toString(), "0.359616170342539443");
    assert.equal(prices[0].usdPrice.toString(), "1");
  });

  it(`When calling 'updateTokenPricesFromPoolPrices' with a pool of
      token0 non-stable and token1 stable it should correctly return the
      new token0 and token1 price`, async () => {
    let pool = new PoolMock();

    pool = {
      ...pool,
      totalValueLockedToken0: BigDecimal("538.121"),
      totalValueLockedToken1: BigDecimal("59000000.2"),
    };

    const token0: Token = {
      ...new TokenMock(),
      id: "toko-0",
      tokenAddress: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      decimals: 8,
    } as Token;

    const token1: Token = {
      ...new TokenMock(),
      id: "toko-1",
      tokenAddress: IndexerNetwork.stablecoinsAddresses(network)[0],
      decimals: 6,
    } as Token;

    const sqrtPriceX96 = BigInt("2422644741646880465971970308851");

    const newPrices = await sut.updateTokenPricesFromPoolPrices(
      token0,
      token1,
      pool,
      sqrtPriceX96toPrice(sqrtPriceX96, token0, token1)
    );

    assert.equal(newPrices[0].usdPrice.toString(), "93501.87063469");
    assert.equal(newPrices[1].usdPrice.toString(), "1");
  });

  it(`When calling 'updateTokenPricesFromPoolPrices' with a pool of
      token0 wrapped native and token1 non-wrapped native it should correctly
      return the token1 price based on the wrapped native price.
      The wrapped native token should remain unchanged`, async () => {
    let pool = new PoolMock();

    pool = {
      ...pool,
      totalValueLockedToken0: BigDecimal("932.121"),
      totalValueLockedToken1: BigDecimal("10223.2"),
    };

    const sqrtPriceX96 = BigInt("10933698353486636695658558");
    const network = IndexerNetwork.ETHEREUM;
    const token0Price = BigDecimal("3340.53");
    const token0: Token = {
      ...new TokenMock(),
      id: "toko-0",
      tokenAddress: IndexerNetwork.wrappedNativeAddress(network),
      decimals: 18,
      usdPrice: token0Price,
    } as Token;

    const token1: Token = {
      ...new TokenMock(),
      id: "toko-1",
      tokenAddress: "0xec53bF9167f50cDEB3Ae105f56099aaaB9061F83",
      decimals: 9,
    } as Token;

    let tokenPrices = await sut.updateTokenPricesFromPoolPrices(
      token0,
      token1,
      pool,
      sqrtPriceX96toPrice(sqrtPriceX96, token0, token1)
    );

    assert.equal(tokenPrices[1].usdPrice.toString(), "175.40435324");
    assert.equal(tokenPrices[0].usdPrice.toString(), token0Price.toString());
  });

  it(`When calling 'updateTokenPricesFromPoolPrices' with a pool of
      token0 native and token1 non-native it should correctly
      return the token1 price based on the native price.
      The native token should remain unchanged`, async () => {
    let pool = new PoolMock();

    pool = {
      ...pool,
      totalValueLockedToken0: BigDecimal("932.121"),
      totalValueLockedToken1: BigDecimal("102239.2"),
    };

    const sqrtPriceX96 = BigInt("2448752485024712708594653706276");
    const token0Price = BigDecimal("3340.53");

    const token0: Token = {
      ...new TokenMock(),
      id: "toko-0",
      tokenAddress: ZERO_ADDRESS,
      decimals: 18,
      usdPrice: token0Price,
    } as Token;

    const token1: Token = {
      ...new TokenMock(),
      id: "toko-1",
      tokenAddress: "0xec53bF9167f50cDEB3Ae105f56099aaaB9061F83",
      decimals: 18,
    } as Token;

    const tokenPrices = await sut.updateTokenPricesFromPoolPrices(
      token0,
      token1,
      pool,
      sqrtPriceX96toPrice(sqrtPriceX96, token0, token1)
    );

    assert.equal(tokenPrices[1].usdPrice.toString(), "3.4969124908482705");
    assert.equal(tokenPrices[0].usdPrice.toString(), token0Price.toString());
  });
  it(`When calling 'updateTokenPricesFromPoolPrices' with a pool of
        token1 native and token0 non-native it should correctly
        return the token0 price based on the native price.
        The native token should remain unchanged`, async () => {
    let pool = new PoolMock();

    pool = {
      ...pool,
      totalValueLockedToken0: BigDecimal("9678414.121"),
      totalValueLockedToken1: BigDecimal("1784.2"),
    };

    const sqrtPriceX96 = BigInt("2707030685633932925819314982");
    const token1Price = BigDecimal("4189.53");

    const token1: Token = {
      ...new TokenMock(),
      id: "toko-1",
      tokenAddress: ZERO_ADDRESS,
      decimals: 18,
      usdPrice: token1Price,
    } as Token;

    const token0: Token = {
      ...new TokenMock(),
      id: "toko-0",
      tokenAddress: "0xec53bF9167f50cDEB3Ae105f56099aaaB9061F83",
      decimals: 18,
    } as Token;

    const tokenPrices = await sut.updateTokenPricesFromPoolPrices(
      token0,
      token1,
      pool,
      sqrtPriceX96toPrice(sqrtPriceX96, token0, token1)
    );

    assert.equal(tokenPrices[1].usdPrice.toString(), token1Price.toString());
    assert.equal(tokenPrices[0].usdPrice.toString(), "4.890941796742165595");
  });

  it(`When calling 'updateTokenPricesFromPoolPrices' with a pool of
      token1 wrapped native and token0 non-wrapped native it should correctly
      return the token0 price based on the wrapped native price.
      The token 1 price should remain unchanged`, async () => {
    const pool = new PoolMock();

    const sqrtPriceX96 = BigInt("41900264649575989012484016231357126");
    const token1USDPrice = BigDecimal("3340.53");

    const token0: Token = {
      ...new TokenMock(),
      id: "toko-0",
      tokenAddress: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      decimals: 8,
    } as Token;

    const token1: Token = {
      ...new TokenMock(),
      id: "toko-1",
      tokenAddress: IndexerNetwork.wrappedNativeAddress(network),
      decimals: 18,
      usdPrice: token1USDPrice,
    } as Token;

    const newPrices = await sut.updateTokenPricesFromPoolPrices(
      token0,
      token1,
      pool,
      sqrtPriceX96toPrice(sqrtPriceX96, token0, token1)
    );

    assert.equal(newPrices[0].usdPrice.toString(), "93430.72975104");
    assert.equal(newPrices[1].usdPrice.toString(), token1USDPrice.toString());
  });

  it(`when calling 'updateTokenPricesFromPoolPrices' with a pool of token0
      stable and token1 stable it should correctly
      retutn the new token0 and token1 price`, async () => {
    const pool = new PoolMock();
    const sqrtPriceX96 = BigInt("79308353598837787813110990092");
    const token0: Token = {
      ...new TokenMock(),
      tokenAddress: IndexerNetwork.stablecoinsAddresses(network)[0],
      decimals: 6,
    } as Token;

    const token1: Token = {
      ...new TokenMock(),
      tokenAddress: IndexerNetwork.stablecoinsAddresses(network)[1],
      decimals: 6,
    } as Token;

    const newPrices = await sut.updateTokenPricesFromPoolPrices(
      token0,
      token1,
      pool,
      sqrtPriceX96toPrice(sqrtPriceX96, token0, token1)
    );

    assert.equal(newPrices[0].usdPrice.toString(), "1.002025");
    assert.equal(newPrices[1].usdPrice.toString(), "0.997979");
  });

  it(`When calling 'updateTokenPricesFromPoolPrices' with a pool of token0
    that is not mapped, and a token1 that is not mapped, but the token0 has its usd
    price set by some reason, the token1 usd price should be returned based on the token0 price.
    While the token0 usd price should remain unchanged`, async () => {
    let pool = new PoolMock();
    const token0UsdPrice = BigDecimal("113848.2042535");
    const sqrtPriceX96 = BigInt("2659594470916659425799358867195");

    pool = {
      ...pool,
      totalValueLockedToken0: BigDecimal("1126.3223"),
      totalValueLockedToken1: BigDecimal("11267186.3223"),
    };

    const token0: Token = {
      ...new TokenMock(),
      id: "toko-0",
      tokenAddress: "0x0000000000000000000000000000000000000001",
      decimals: 8,
      usdPrice: token0UsdPrice,
    } as Token;

    const token1: Token = {
      ...new TokenMock(),
      id: "toko-1",
      tokenAddress: "0x0000000000000000000000000000000000000002",
      decimals: 6,
      usdPrice: BigDecimal(0),
    } as Token;

    const newPrices = await sut.updateTokenPricesFromPoolPrices(
      token0,
      token1,
      pool,
      sqrtPriceX96toPrice(sqrtPriceX96, token0, token1)
    );

    assert.equal(newPrices[0].usdPrice.toString(), token0UsdPrice.toString());
    assert.equal(newPrices[1].usdPrice.toString(), "1.01031");
  });

  it(`When calling 'updateTokenPricesFromPoolPrices' with a pool of token1
    that is not mapped, and a token0 that is not mapped, but the token1 has its usd
    price set by some reason, the token0 usd price should be returned based on the token1 price.
    While the token1 usd price should remain unchanged`, async () => {
    let pool = new PoolMock();
    const token1UsdPrice = BigDecimal("113848.204254");
    const sqrtPriceX96 = BigInt("2659594470916659425799358867195");

    pool = {
      ...pool,
      totalValueLockedToken0: BigDecimal("1126.3223"),
      totalValueLockedToken1: BigDecimal("11267186.3223"),
    };

    const token0: Token = {
      ...new TokenMock(),
      id: "toko-0",
      tokenAddress: "0x0000000000000000000000000000000000000001",
      decimals: 8,
      usdPrice: BigDecimal(0),
    } as Token;

    const token1: Token = {
      ...new TokenMock(),
      usdPrice: token1UsdPrice,
      id: "toko-1",
      tokenAddress: "0x0000000000000000000000000000000000000002",
      decimals: 6,
    } as Token;

    const newPrices = await sut.updateTokenPricesFromPoolPrices(
      token0,
      token1,
      pool,
      sqrtPriceX96toPrice(sqrtPriceX96, token0, token1)
    );

    assert.equal(newPrices[1].usdPrice.toString(), token1UsdPrice.toString());
    assert.equal(newPrices[0].usdPrice.toString(), "12829149325.56340982");
  });

  it(`When calling 'updateTokenPricesFromPoolPrices' with a pool of token0
    that is not mapped, and a token1 that is not mapped, and both tokens
    have their usd price set, the token0 usd price should be return
    based on the old token1 price, and set the token1 usd price based on the old
    token0 usd price`, async () => {
    const pool = new PoolMock();

    const token0UsdPrice = BigDecimal("2618.2042535");
    const token1UsdPrice = BigDecimal("3000.1213");
    const sqrtPriceX96 = BigInt("58252955171373273082115870408");

    const token0: Token = {
      ...new TokenMock(),
      id: "toko-0",
      tokenAddress: "0x0000000000000000000000000000000000000001",
      decimals: 18,
      usdPrice: token0UsdPrice,
    } as Token;

    const token1: Token = {
      ...new TokenMock(),
      id: "toko-1",
      tokenAddress: "0x0000000000000000000000000000000000000002",
      decimals: 18,
      usdPrice: token1UsdPrice,
    } as Token;

    const newPrices = await sut.updateTokenPricesFromPoolPrices(
      token0,
      token1,
      pool,
      sqrtPriceX96toPrice(sqrtPriceX96, token0, token1)
    );

    console.log(`${newPrices[1].usdPrice.toString()}`);
    console.log(`${newPrices[0].usdPrice.toString()}`);
    console.log(`${sqrtPriceX96toPrice(sqrtPriceX96, token0, token1).token0PerToken1.toString()}`);

    assert.equal(newPrices[1].usdPrice.toString(), "4843.137147625949516837");
    assert.equal(newPrices[0].usdPrice.toString(), "1621.868245570197540664");
  });

  it(`When calling set hourly data, with the amount0 negative
    annd amount 1 positive, the feesToken1 field should be updated,
    suming up the swap fee`, async () => {
    let token0Id = "0x0000000000000000000000000000000000000012";
    let token1Id = "0x0000000000000000000000000000000000000002";
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    let amount1 = BigInt(21785) * BigInt(10) ** BigInt(token1.decimals);
    let amount0 = BigInt(199) * BigInt(10) ** BigInt(token0.decimals) * -1n;
    let swapFee = 100;
    let currentFees = BigDecimal("1832.3");
    let poolHourlyData = new PoolHourlyDataMock();

    pool = {
      ...pool,
      currentFeeTier: swapFee,
      token0_id: token0Id,
      token1_id: token1Id,
    };

    poolHourlyData = {
      ...poolHourlyData,
      id: getPoolHourlyDataId(eventTimestamp, pool),
      feesToken1: currentFees,
    };

    context.Pool.set(pool);
    context.PoolHourlyData.set(poolHourlyData);
    context.Token.set(token0);
    context.Token.set(token1);

    await sut.setIntervalSwapData(eventTimestamp, context, pool, token0, token1, amount0, amount1, swapFee);

    const updatedPoolHourlyData = await context.PoolHourlyData.getOrThrow(getPoolHourlyDataId(eventTimestamp, pool));
    const expectedNewFees = currentFees.plus(formatFromTokenAmount((amount1 * BigInt(swapFee)) / 1000000n, token1));

    assert.deepEqual(updatedPoolHourlyData.feesToken1, expectedNewFees);
  });

  it(`When calling set hourly data, with the amount0 positive
    annd amount 1 negative, the feesToken0 field should be updated,
    suming up the swap fee`, async () => {
    let token0Id = "0x0000000000000000000000000000000000000012";
    let token1Id = "0x0000000000000000000000000000000000000002";
    let pool = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();
    let amount0 = BigInt(199) * BigInt(10) ** BigInt(token0.decimals);
    let amount1 = BigInt(21785) * BigInt(10) ** BigInt(token1.decimals) * -1n;
    let swapFee = 1000;
    let currentFees = BigDecimal("9798798.3");
    let poolHourlyData = new PoolHourlyDataMock();

    pool = {
      ...pool,
      currentFeeTier: swapFee,
      token0_id: token0Id,
      token1_id: token1Id,
    };

    poolHourlyData = {
      ...poolHourlyData,
      id: getPoolHourlyDataId(eventTimestamp, pool),
      feesToken0: currentFees,
    };

    token0 = {
      ...token0,
      id: token0Id,
      decimals: 6,
    };

    token1 = {
      ...token1,
      id: token1Id,
      decimals: 18,
    };

    context.Pool.set(pool);
    context.PoolHourlyData.set(poolHourlyData);
    context.Token.set(token0);
    context.Token.set(token1);

    await sut.setIntervalSwapData(eventTimestamp, context, pool, token0, token1, amount0, amount1, swapFee);

    const updatedPoolHourlyData = await context.PoolHourlyData.getOrThrow(getPoolHourlyDataId(eventTimestamp, pool));
    const expectedNewFees = currentFees.plus(formatFromTokenAmount((amount0 * BigInt(swapFee)) / 1000000n, token0));

    assert.deepEqual(updatedPoolHourlyData.feesToken0, expectedNewFees);
  });

  it(`When calling set hourly data with the amount1 negative
    and amount0 positive, the feesUSD field should be updated
    suming up the swap fee`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock("0x0000000000000000000000000000000000000012");
    let token1 = new TokenMock("0x0000000000000000000000000000000000000002");
    let swapFee = 1000;
    let poolHourlyData = new PoolHourlyDataMock();
    let currentFeesToken0 = BigDecimal("2112.3");
    let currentFeesToken1 = BigDecimal("2.3");

    token0 = {
      ...token0,
      decimals: 18,
      usdPrice: BigDecimal("18.32"),
    };

    token1 = {
      ...token1,
      decimals: 18,
      usdPrice: BigDecimal("18271.97"),
    };

    let amount0 = BigInt(190) * BigInt(10) ** BigInt(token0.decimals);
    let amount1 = BigInt(2) * BigInt(10) ** BigInt(token1.decimals) * -1n;
    let currentUSDFees = currentFeesToken0.times(token0.usdPrice).plus(currentFeesToken1.times(token1.usdPrice));

    pool = {
      ...pool,
      currentFeeTier: swapFee,
      token0_id: token0.id,
      token1_id: token1.id,
    };

    poolHourlyData = {
      ...poolHourlyData,
      id: getPoolHourlyDataId(eventTimestamp, pool),
      feesToken0: currentFeesToken0,
      feesToken1: currentFeesToken1,
      feesUSD: currentUSDFees,
    };

    context.Pool.set(pool);
    context.PoolHourlyData.set(poolHourlyData);
    context.Token.set(token0);
    context.Token.set(token1);

    await sut.setIntervalSwapData(eventTimestamp, context, pool, token0, token1, amount0, amount1, swapFee);

    const updatedPoolHourlyData = await context.PoolHourlyData.getOrThrow(getPoolHourlyDataId(eventTimestamp, pool));
    const token0ExpectedSwapFee = formatFromTokenAmount((amount0 * BigInt(swapFee)) / 1000000n, token0);
    const expectedUpdatedFeeUsd = currentFeesToken0
      .plus(token0ExpectedSwapFee)
      .times(token0.usdPrice)
      .plus(currentFeesToken1.times(token1.usdPrice));

    assert.deepEqual(updatedPoolHourlyData.feesUSD, expectedUpdatedFeeUsd);
  });

  it(`When calling set hourly data with the amount1 positive
    and amount0 negative, the feesUSD field should be updated
    suming up the swap fee`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock("0x0000000000000000000000000000000000000012");
    let token1 = new TokenMock("0x0000000000000000000000000000000000000002");
    let swapFee = 1000;
    let poolHourlyData = new PoolHourlyDataMock();
    let currentFeesToken0 = BigDecimal("2112.3");
    let currentFeesToken1 = BigDecimal("2.3");

    token0 = {
      ...token0,
      decimals: 18,
      usdPrice: BigDecimal("18.32"),
    };

    token1 = {
      ...token1,
      decimals: 18,
      usdPrice: BigDecimal("18271.97"),
    };

    let amount0 = BigInt(190) * BigInt(10) ** BigInt(token0.decimals) * -1n;
    let amount1 = BigInt(2) * BigInt(10) ** BigInt(token1.decimals);
    let currentUSDFees = currentFeesToken0.times(token0.usdPrice).plus(currentFeesToken1.times(token1.usdPrice));

    pool = {
      ...pool,
      currentFeeTier: swapFee,
      token0_id: token0.id,
      token1_id: token1.id,
    };

    poolHourlyData = {
      ...poolHourlyData,
      id: getPoolHourlyDataId(eventTimestamp, pool),
      feesToken0: currentFeesToken0,
      feesToken1: currentFeesToken1,
      feesUSD: currentUSDFees,
    };

    context.Pool.set(pool);
    context.PoolHourlyData.set(poolHourlyData);
    context.Token.set(token0);
    context.Token.set(token1);

    await sut.setIntervalSwapData(eventTimestamp, context, pool, token0, token1, amount0, amount1, swapFee);

    const updatedPoolHourlyData = await context.PoolHourlyData.getOrThrow(getPoolHourlyDataId(eventTimestamp, pool));
    const token1ExpectedSwapFee = formatFromTokenAmount((amount1 * BigInt(swapFee)) / 1000000n, token1);
    const expectedUpdatedFeeUsd = currentFeesToken1
      .plus(token1ExpectedSwapFee)
      .times(token1.usdPrice)
      .plus(currentFeesToken0.times(token0.usdPrice));

    assert.deepEqual(updatedPoolHourlyData.feesUSD, expectedUpdatedFeeUsd);
  });

  it(`When calling set hourly data, with the amount0 negative and amount1 positive,
    multiple times, in less than 1 hour, it should update the same pool hourly data,
    just suming up the swap fee`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock("0x0000000000000000000000000000000000000012");
    let token1 = new TokenMock("0x0000000000000000000000000000000000000002");
    let v4PoolData = new V4PoolDataMock(pool.id);

    token0 = {
      ...token0,
      usdPrice: BigDecimal("0.022"),
    };

    token1 = {
      ...token1,
      usdPrice: BigDecimal("1.21"),
    };

    let amount0 = BigInt(189269) * BigInt(10) ** BigInt(token0.decimals) * -1n;
    let amount1 = BigInt(198621) * BigInt(10) ** BigInt(token1.decimals);
    let poolHourlyData = new PoolHourlyDataMock();
    let currentFeesToken0 = BigDecimal("21023896.3");
    let currentFeesToken1 = BigDecimal("32987.3");
    let currentUSDFees = currentFeesToken0.times(token0.usdPrice).plus(currentFeesToken1.times(token1.usdPrice));
    let currentHourlyId = getPoolHourlyDataId(eventTimestamp, pool);
    let callTimes = 4;
    let swapFee = 500;

    pool = {
      ...pool,
      currentFeeTier: swapFee,
      token0_id: token0.id,
      token1_id: token1.id,
    };

    poolHourlyData = {
      ...poolHourlyData,
      id: currentHourlyId,
      feesToken0: currentFeesToken0,
      feesToken1: currentFeesToken1,
      feesUSD: currentUSDFees,
    };

    let token1ExpectedSwapFee = formatFromTokenAmount((amount1 * BigInt(pool.currentFeeTier)) / 1000000n, token1);

    context.Pool.set(pool);
    context.PoolHourlyData.set(poolHourlyData);
    context.Token.set(token0);
    context.Token.set(token1);
    context.V4PoolData.set(v4PoolData);

    for (let i = 0; i < callTimes; i++) {
      await sut.setIntervalSwapData(eventTimestamp, context, pool, token0, token1, amount0, amount1, swapFee);
    }

    const updatedPoolHourlyData = await context.PoolHourlyData.getOrThrow(currentHourlyId);
    const expectedFeesToken1 = currentFeesToken1.plus(
      formatFromTokenAmount((amount1 * BigInt(pool.currentFeeTier)) / BigInt(1000000), token1).times(
        BigDecimal(callTimes)
      )
    );
    const expectedFeesUsd = currentFeesToken0
      .times(token0.usdPrice)
      .plus(currentFeesToken1.plus(token1ExpectedSwapFee.times(BigDecimal(callTimes))).times(token1.usdPrice));

    assert.deepEqual(updatedPoolHourlyData.feesToken1, expectedFeesToken1, "feesToken1 should be correctly updated");
    assert.deepEqual(updatedPoolHourlyData.feesUSD, expectedFeesUsd, "feesUSD should be correctly updated");
  });

  it(`When calling set hourly data, with the amount0 positive and amount1 negative,
    multiple times, in less than 1 hour, it should update the same pool hourly data,
    just suming up the swap fee`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock("0x0000000000000000000000000000000000000012");
    let token1 = new TokenMock("0x0000000000000000000000000000000000000002");
    let v4PoolData = new V4PoolDataMock(pool.id);

    token0 = {
      ...token0,
      usdPrice: BigDecimal("0.022"),
    };

    token1 = {
      ...token1,
      usdPrice: BigDecimal("1.21"),
    };

    let amount0 = BigInt(189269) * BigInt(10) ** BigInt(token0.decimals);
    let amount1 = BigInt(198621) * BigInt(10) ** BigInt(token1.decimals) * -1n;
    let poolHourlyData = new PoolHourlyDataMock();
    let currentFeesToken0 = BigDecimal("21023896.3");
    let currentFeesToken1 = BigDecimal("32987.3");
    let currentUSDFees = currentFeesToken0.times(token0.usdPrice).plus(currentFeesToken1.times(token1.usdPrice));
    let currentHourlyId = getPoolHourlyDataId(eventTimestamp, pool);
    let callTimes = 4;
    let swapFee = 500;

    pool = {
      ...pool,
      currentFeeTier: swapFee,
      token0_id: token0.id,
      token1_id: token1.id,
    };

    poolHourlyData = {
      ...poolHourlyData,
      id: currentHourlyId,
      feesToken0: currentFeesToken0,
      feesToken1: currentFeesToken1,
      feesUSD: currentUSDFees,
    };

    let token0ExpectedSwapFee = formatFromTokenAmount((amount0 * BigInt(pool.currentFeeTier)) / 1000000n, token0);

    context.Pool.set(pool);
    context.PoolHourlyData.set(poolHourlyData);
    context.Token.set(token0);
    context.Token.set(token1);
    context.V4PoolData.set(v4PoolData);

    for (let i = 0; i < callTimes; i++) {
      await sut.setIntervalSwapData(eventTimestamp, context, pool, token0, token1, amount0, amount1, swapFee);
    }

    const updatedPoolHourlyData = await context.PoolHourlyData.getOrThrow(currentHourlyId);
    const expectedFeesToken0 = currentFeesToken0.plus(
      formatFromTokenAmount((amount0 * BigInt(pool.currentFeeTier)) / BigInt(1000000), token0).times(
        BigDecimal(callTimes)
      )
    );
    const expectedFeesUsd = currentFeesToken1
      .times(token1.usdPrice)
      .plus(currentFeesToken0.plus(token0ExpectedSwapFee.times(BigDecimal(callTimes))).times(token0.usdPrice));

    assert.deepEqual(updatedPoolHourlyData.feesToken0, expectedFeesToken0, "feesToken0 should be correctly updated");
    assert.deepEqual(updatedPoolHourlyData.feesUSD, expectedFeesUsd, "feesUSD should be correctly updated");
  });

  it(`When calling set hourly data with the amount0 positive and amount1 negative
    multiple times, with more than 1 hour from each other,it should update differents
    pool hourly data entities(as it is a new hour, it should create a new entity for each
    hour and update it)`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock("0x0000000000000000000000000000000000000012");
    let token1 = new TokenMock("0x0000000000000000000000000000000000000002");

    token0 = {
      ...token0,
      usdPrice: BigDecimal("0.022"),
    };

    token1 = {
      ...token1,
      usdPrice: BigDecimal("1.21"),
    };

    let amount0 = BigInt(1765) * BigInt(10) ** BigInt(token0.decimals);
    let amount1 = BigInt(12) * BigInt(10) ** BigInt(token1.decimals) * -1n;

    let hourIds: string[] = [];
    let callTimes = 5;
    let swapFee = 500;

    pool = {
      ...pool,
      currentFeeTier: swapFee,
      token0_id: token0.id,
      token1_id: token1.id,
    };

    for (let i = 0; i < callTimes; i++) {
      eventTimestamp = eventTimestamp + BigInt(ONE_HOUR_IN_SECONDS);
      let currentHourlyId = getPoolHourlyDataId(eventTimestamp, pool);

      assert(!hourIds.includes(currentHourlyId), "Hour Id should be different for every hour");

      hourIds.push(currentHourlyId);

      await sut.setIntervalSwapData(eventTimestamp, context, pool, token0, token1, amount0, amount1, swapFee);
      const updatedPoolHourlyData = await context.PoolHourlyData.getOrThrow(currentHourlyId);

      assert.deepEqual(
        updatedPoolHourlyData.feesToken0,
        formatFromTokenAmount((amount0 * BigInt(pool.currentFeeTier)) / 1000000n, token0)
      );
    }
  });

  it(`When calling set hourly data with the amount0 negative and amount1 positive
    multiple times, with more than 1 hour from each other,it should update differents
    pool hourly data entities(as it is a new hour, it should create a new entity for each
    hour and update it)`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock("0x0000000000000000000000000000000000000012");
    let token1 = new TokenMock("0x0000000000000000000000000000000000000002");

    token0 = {
      ...token0,
      usdPrice: BigDecimal("0.022"),
    };

    token1 = {
      ...token1,
      usdPrice: BigDecimal("1.21"),
    };

    let amount0 = BigInt(1765) * BigInt(10) ** BigInt(token0.decimals) * -1n;
    let amount1 = BigInt(12) * BigInt(10) ** BigInt(token1.decimals);

    let hourIds: string[] = [];
    let callTimes = 5;
    let swapFee = 500;

    pool = {
      ...pool,
      currentFeeTier: swapFee,
      token0_id: token0.id,
      token1_id: token1.id,
    };

    for (let i = 0; i < callTimes; i++) {
      eventTimestamp = eventTimestamp + BigInt(ONE_HOUR_IN_SECONDS);
      let currentHourlyId = getPoolHourlyDataId(eventTimestamp, pool);

      assert(!hourIds.includes(currentHourlyId), "Hour Id should be different for every hour");

      hourIds.push(currentHourlyId);

      await sut.setIntervalSwapData(eventTimestamp, context, pool, token0, token1, amount0, amount1, swapFee);
      const updatedPoolHourlyData = await context.PoolHourlyData.getOrThrow(currentHourlyId);

      assert.deepEqual(
        updatedPoolHourlyData.feesToken1,
        formatFromTokenAmount((amount1 * BigInt(pool.currentFeeTier)) / 1000000n, token1)
      );
    }
  });

  it(`should set the pool daily data TVL when calling set daily data`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock("0x0000000000000000000000000000000000000012");
    let token1 = new TokenMock("0x0000000000000000000000000000000000000002");
    let amount0 = BigInt(200);
    let amount1 = BigInt(100);
    let currentTotalValueLockedToken0 = BigDecimal("21092789");
    let currentTotalValueLockedToken1 = BigDecimal("91787289798271");
    let currentTotalValueLockedUSD = BigDecimal("917872826258287289798271.7635267");

    pool = {
      ...pool,
      token0_id: token0.id,
      token1_id: token1.id,
      totalValueLockedToken0: currentTotalValueLockedToken0,
      totalValueLockedToken1: currentTotalValueLockedToken1,
      totalValueLockedUSD: currentTotalValueLockedUSD,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    await sut.setIntervalSwapData(eventTimestamp, context, pool, token0, token1, amount0, amount1);
    const poolDailyDataUpdated = await context.PoolDailyData.getOrThrow(getPoolDailyDataId(eventTimestamp, pool));

    assert.deepEqual(poolDailyDataUpdated.totalValueLockedToken0, pool.totalValueLockedToken0);
    assert.deepEqual(poolDailyDataUpdated.totalValueLockedToken1, pool.totalValueLockedToken1);
    assert.deepEqual(poolDailyDataUpdated.totalValueLockedUSD, pool.totalValueLockedUSD);
  });

  it(`When calling set daily data with the amount0 positive and amount1 negative,
    multiple times, with less than 1 day from each other,
    it should correctly update the fees for the same pool daily data entity`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock("0x0000000000000000000000000000000000000012");
    let token1 = new TokenMock("0x0000000000000000000000000000000000000002");

    token0 = {
      ...token0,
      usdPrice: BigDecimal("0.022"),
    };

    token1 = {
      ...token1,
      usdPrice: BigDecimal("1.21"),
    };

    let amount0 = BigInt(1765) * BigInt(10) ** BigInt(token0.decimals);
    let amount1 = BigInt(12) * BigInt(10) ** BigInt(token1.decimals) * -1n;

    let poolDailyData = new PoolDailyDataMock();
    let currentFeesToken0 = BigDecimal("1898.3");
    let currentFeesToken1 = BigDecimal("1.3");
    let currentUSDFees = currentFeesToken0.times(token0.usdPrice).plus(currentFeesToken1.times(token1.usdPrice));
    let currentDailyId = getPoolDailyDataId(eventTimestamp, pool);
    let callTimes = 8;
    let swapFee = 500;

    pool = {
      ...pool,
      currentFeeTier: swapFee,
      token0_id: token0.id,
      token1_id: token1.id,
    };

    poolDailyData = {
      ...poolDailyData,
      id: currentDailyId,
      feesToken0: currentFeesToken0,
      feesToken1: currentFeesToken1,
      feesUSD: currentUSDFees,
    };

    let token0ExpectedSwapFee = formatFromTokenAmount(
      (amount0 * BigInt(pool.currentFeeTier)) / BigInt(1000000),
      token0
    );

    context.Pool.set(pool);
    context.PoolDailyData.set(poolDailyData);
    context.Token.set(token0);
    context.Token.set(token1);

    for (let i = 0; i < callTimes; i++) {
      eventTimestamp = eventTimestamp + BigInt(ONE_HOUR_IN_SECONDS);

      await sut.setIntervalSwapData(eventTimestamp, context, pool, token0, token1, amount0, amount1);
    }

    const updatedPoolDailyData = await context.PoolDailyData.getOrThrow(currentDailyId);
    const expectedToken0Fees = currentFeesToken0.plus(
      formatFromTokenAmount((amount0 * BigInt(pool.currentFeeTier)) / BigInt(1000000), token0).times(
        BigDecimal(callTimes.toString())
      )
    );
    const expectedTokenFeesUSD = currentFeesToken1
      .times(token1.usdPrice)
      .plus(
        currentFeesToken0.plus(token0ExpectedSwapFee.times(BigDecimal(callTimes.toString()))).times(token0.usdPrice)
      );

    assert.deepEqual(updatedPoolDailyData.feesToken0, expectedToken0Fees, "feesToken0 should be correctly updated");
    assert.deepEqual(updatedPoolDailyData.feesUSD, expectedTokenFeesUSD, "feesUSD should be correctly updated");
  });

  it(`When calling set daily data with the amount0 negative and amount1 positive,
    multiple times, with less than 1 day from each other,
    it should correctly update fees for the same pool daily data entity`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock("0x0000000000000000000000000000000000000012");
    let token1 = new TokenMock("0x0000000000000000000000000000000000000002");

    token0 = {
      ...token0,
      usdPrice: BigDecimal("0.022"),
    };

    token1 = {
      ...token1,
      usdPrice: BigDecimal("1.21"),
    };

    let amount0 = BigInt(1765) * BigInt(10) ** BigInt(token0.decimals) * -1n;
    let amount1 = BigInt(12) * BigInt(10) ** BigInt(token1.decimals);

    let poolDailyData = new PoolDailyDataMock();
    let currentFeesToken0 = BigDecimal("1898.3");
    let currentFeesToken1 = BigDecimal("1.3");
    let currentUSDFees = currentFeesToken0.times(token0.usdPrice).plus(currentFeesToken1.times(token1.usdPrice));
    let currentDailyId = getPoolDailyDataId(eventTimestamp, pool);
    let callTimes = 8;
    let swapFee = 500;

    pool = {
      ...pool,
      currentFeeTier: swapFee,
      token0_id: token0.id,
      token1_id: token1.id,
      createdAtTimestamp: eventTimestamp,
    };

    poolDailyData = {
      ...poolDailyData,
      id: currentDailyId,
      feesToken0: currentFeesToken0,
      feesToken1: currentFeesToken1,
      feesUSD: currentUSDFees,
    };

    let token1ExpectedSwapFee = formatFromTokenAmount(
      (amount1 * BigInt(pool.currentFeeTier)) / BigInt(1000000),
      token1
    );

    context.Pool.set(pool);
    context.PoolDailyData.set(poolDailyData);
    context.Token.set(token0);
    context.Token.set(token1);

    for (let i = 0; i < callTimes; i++) {
      eventTimestamp = eventTimestamp + BigInt(ONE_HOUR_IN_SECONDS * 2);

      await sut.setIntervalSwapData(eventTimestamp, context, pool, token0, token1, amount0, amount1);
    }

    const updatedPoolDailyData = await context.PoolDailyData.getOrThrow(currentDailyId);
    const expectedToken1Fees = currentFeesToken1.plus(
      formatFromTokenAmount((amount1 * BigInt(pool.currentFeeTier)) / BigInt(1000000), token1).times(
        BigDecimal(callTimes.toString())
      )
    );
    const expectedTokenFeesUSD = currentFeesToken0
      .times(token0.usdPrice)
      .plus(
        currentFeesToken1.plus(token1ExpectedSwapFee.times(BigDecimal(callTimes.toString()))).times(token1.usdPrice)
      );

    assert.deepEqual(updatedPoolDailyData.feesToken1, expectedToken1Fees, "feesToken1 should be correctly updated");
    assert.deepEqual(updatedPoolDailyData.feesUSD, expectedTokenFeesUSD, "feesUSD should be correctly updated");
  });

  it(`Whe calling set daily data with the amount0 positive and amount1 negative,
    multiple times, with more than 1 day from each other,
    it should correctly update fees for multiple pool daily data entity, one for
    each new day`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock("0x0000000000000000000000000000000000000012");
    let token1 = new TokenMock("0x0000000000000000000000000000000000000002");

    token0 = {
      ...token0,
      usdPrice: BigDecimal("0.022"),
    };

    token1 = {
      ...token1,
      usdPrice: BigDecimal("1.21"),
    };

    let amount0 = BigInt(1765) * BigInt(10) ** BigInt(token0.decimals);
    let amount1 = BigInt(12) * BigInt(10) ** BigInt(token1.decimals) * -1n;

    let dayIds: string[] = [];
    let callTimes = 5;

    let swapFee = 500;

    pool = {
      ...pool,
      currentFeeTier: swapFee,
      token0_id: token0.id,
      token1_id: token1.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    for (let i = 0; i < callTimes; i++) {
      eventTimestamp = eventTimestamp + BigInt(ONE_HOUR_IN_SECONDS * 24);
      let currentDayId = getPoolDailyDataId(eventTimestamp, pool);

      assert(!dayIds.includes(currentDayId), "Day Id should be different for every hour");

      dayIds.push(currentDayId);

      await sut.setIntervalSwapData(eventTimestamp, context, pool, token0, token1, amount0, amount1);
      const updatedPoolDailyData = await context.PoolDailyData.getOrThrow(currentDayId);
      const expectedToken0Fees = formatFromTokenAmount(
        (amount0 * BigInt(pool.currentFeeTier)) / BigInt(1000000),
        token0
      );

      assert.deepEqual(updatedPoolDailyData.feesToken0, expectedToken0Fees, "feesToken0 should be correctly updated");
      assert.deepEqual(
        updatedPoolDailyData.feesUSD,
        expectedToken0Fees.times(token0.usdPrice),
        "feesUSD should be correctly updated"
      );
    }
  });

  it(`Whe calling set daily data with the amount0 negative and amount1 positive,
    multiple times, with more than 1 day from each other,
    it should correctly update fees for multiple pool daily data entity, one for
    each new day`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock("0x0000000000000000000000000000000000000012");
    let token1 = new TokenMock("0x0000000000000000000000000000000000000002");

    token0 = {
      ...token0,
      usdPrice: BigDecimal("0.022"),
    };

    token1 = {
      ...token1,
      usdPrice: BigDecimal("1.21"),
    };

    let amount0 = BigInt(1765) * BigInt(10) ** BigInt(token0.decimals) * -1n;
    let amount1 = BigInt(12) * BigInt(10) ** BigInt(token1.decimals);

    let dayIds: string[] = [];
    let callTimes = 5;

    let swapFee = 500;

    pool = {
      ...pool,
      currentFeeTier: swapFee,
      token0_id: token0.id,
      token1_id: token1.id,
    };

    context.Pool.set(pool);
    context.Token.set(token0);
    context.Token.set(token1);

    for (let i = 0; i < callTimes; i++) {
      eventTimestamp = eventTimestamp + BigInt(ONE_HOUR_IN_SECONDS * 24);
      let currentDayId = getPoolDailyDataId(eventTimestamp, pool);

      assert(!dayIds.includes(currentDayId), "Day Id should be different for every hour");

      dayIds.push(currentDayId);

      await sut.setIntervalSwapData(eventTimestamp, context, pool, token0, token1, amount0, amount1);
      const updatedPoolDailyData = await context.PoolDailyData.getOrThrow(currentDayId);
      const expectedToken1Fees = formatFromTokenAmount(
        (amount1 * BigInt(pool.currentFeeTier)) / BigInt(1000000),
        token1
      );

      assert.deepEqual(updatedPoolDailyData.feesToken1, expectedToken1Fees, "feesToken1 should be correctly updated");
      assert.deepEqual(
        updatedPoolDailyData.feesUSD,
        expectedToken1Fees.times(token1.usdPrice),
        "feesUSD should be correctly updated"
      );
    }
  });

  it(`When calling to set hourly data, with the amount0 positive and amount1 negative,
    and the pool has a different swap fee than the pool fee tier,
    the feesToken0 field in the pool hourly data should be updated,
    suming up the swap fee (got from the event)`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock("0x0000000000000000000000000000000000000012");
    let token1 = new TokenMock("0x0000000000000000000000000000000000000002");
    let amount0 = BigInt(32) * BigInt(10) ** BigInt(token0.decimals);
    let amount1 = BigInt(199) * BigInt(10) ** BigInt(token1.decimals) * -1n;
    let poolHourlyData = new PoolHourlyDataMock();
    let currentFees = BigDecimal("12.3");
    let swapFee = 500;
    let poolFeeTier = 198;

    pool = {
      ...pool,
      currentFeeTier: poolFeeTier,
      token0_id: token0.id,
      token1_id: token1.id,
    };

    poolHourlyData = {
      ...poolHourlyData,
      id: getPoolHourlyDataId(eventTimestamp, pool),
      feesToken0: currentFees,
    };

    context.Pool.set(pool);
    context.PoolHourlyData.set(poolHourlyData);
    context.Token.set(token0);
    context.Token.set(token1);

    await sut.setIntervalSwapData(eventTimestamp, context, pool, token0, token1, amount0, amount1, swapFee);
    const updatedPoolHourlyData = await context.PoolHourlyData.getOrThrow(getPoolHourlyDataId(eventTimestamp, pool));
    const exepectedFeesToken0 = currentFees.plus(
      formatFromTokenAmount((amount0 * BigInt(swapFee)) / BigInt(1000000n), token0)
    );

    assert.deepEqual(updatedPoolHourlyData.feesToken0, exepectedFeesToken0);
  });

  it(`When calling to set hourly data, with the amount0 negative and amount1 positive,
    and the pool has a different swap fee than the pool fee tier,
    the feesToken0 field in the pool hourly data should be updated,
    suming up the swap fee (got from the event)`, async () => {
    let pool = new PoolMock();
    let token0 = new TokenMock("0x0000000000000000000000000000000000000012");
    let token1 = new TokenMock("0x0000000000000000000000000000000000000002");
    let amount0 = BigInt(32) * BigInt(10) ** BigInt(token0.decimals) * -1n;
    let amount1 = BigInt(199) * BigInt(10) ** BigInt(token1.decimals);
    let poolHourlyData = new PoolHourlyDataMock();
    let currentFees = BigDecimal("12.3");
    let swapFee = 500;
    let poolFeeTier = 1000;

    pool = {
      ...pool,
      currentFeeTier: poolFeeTier,
      token0_id: token0.id,
      token1_id: token1.id,
    };

    poolHourlyData = {
      ...poolHourlyData,
      id: getPoolHourlyDataId(eventTimestamp, pool),
      feesToken1: currentFees,
    };

    context.Pool.set(pool);
    context.PoolHourlyData.set(poolHourlyData);
    context.Token.set(token0);
    context.Token.set(token1);

    await sut.setIntervalSwapData(eventTimestamp, context, pool, token0, token1, amount0, amount1, swapFee);
    const updatedPoolHourlyData = await context.PoolHourlyData.getOrThrow(getPoolHourlyDataId(eventTimestamp, pool));
    const expectedToken1Fees = currentFees.plus(
      formatFromTokenAmount((amount1 * BigInt(swapFee)) / BigInt(1000000n), token1)
    );

    assert.deepEqual(updatedPoolHourlyData.feesToken1, expectedToken1Fees);
  });

  it(`When calling to set daily data, with the amount0 negative and amount1 positive,
    and the pool has a different swap fee than the pool fee tier,
    the feesToken0 field in the pool daily data should be updated,
    suming up the swap fee (got from the event)`, async () => {
    eventTimestamp = BigInt(1);
    let pool = new PoolMock();
    let token0 = new TokenMock("0x0000000000000000000000000000000000000012");
    let token1 = new TokenMock("0x0000000000000000000000000000000000000002");
    let amount0 = BigInt(32) * BigInt(10) ** BigInt(token0.decimals) * -1n;
    let amount1 = BigInt(199) * BigInt(10) ** BigInt(token1.decimals);
    let poolDailyData = new PoolDailyDataMock();
    let currentFees = BigDecimal("12.3");
    let swapFee = 500;
    let poolFeeTier = 1000;

    pool = {
      ...pool,
      currentFeeTier: poolFeeTier,
      token0_id: token0.id,
      token1_id: token1.id,
    };

    poolDailyData = {
      ...poolDailyData,
      id: getPoolDailyDataId(eventTimestamp, pool),
      feesToken1: currentFees,
    };

    context.Pool.set(pool);
    context.PoolDailyData.set(poolDailyData);
    context.Token.set(token0);
    context.Token.set(token1);

    await sut.setIntervalSwapData(eventTimestamp, context, pool, token0, token1, amount0, amount1, swapFee);
    const updatedPoolDailyData = await context.PoolDailyData.getOrThrow(getPoolDailyDataId(eventTimestamp, pool));
    const expectedToken1Fees = currentFees.plus(
      formatFromTokenAmount((amount1 * BigInt(swapFee)) / BigInt(1000000n), token1)
    );

    assert.deepEqual(updatedPoolDailyData.feesToken1, expectedToken1Fees);
  });

  it(`should update the token0 price, if calling 'updateTokenPricesFromPoolPrices'
    from a pool that is not the current most liquid, but the new price, is within
    the outlier price threshold compared to the current price. The most liquid pool
    should remain the same`, async () => {
    const currentSqrtPriceX96 = BigInt("79224040650647629793123337304");
    const token0MostLiquidPool = new PoolMock("0xM05ST_LIQUID_POOL_ID_0");
    const token1MostLiquidPool = new PoolMock("0xM05ST_LIQUID_POOL_ID_1");
    const currentPool = new PoolMock("0xNOT_MOST_LIQUID_POOL_ID");

    const token0: Token = {
      ...new TokenMock("0x0000000000000000000000000000000000000012"),
      mostLiquidPool_id: token0MostLiquidPool.id,
      usdPrice: BigDecimal("113800"),
      decimals: 8,
    };

    const token1: Token = {
      ...new TokenMock("0x0000000000000000000000000000000000000002"),
      mostLiquidPool_id: token1MostLiquidPool.id,
      usdPrice: BigDecimal("111555"),
      decimals: 8,
    };

    const pool: Pool = {
      ...currentPool,
      token0_id: token0.id,
      token1_id: token1.id,
    };

    const poolPrices = sqrtPriceX96toPrice(currentSqrtPriceX96, token0, token1);

    const result = await sut.updateTokenPricesFromPoolPrices(token0, token1, pool, poolPrices);

    assert.deepEqual(result[0].usdPrice, BigDecimal("111543.3929522"), "price is not updated correctly");
    assert.deepEqual(result[0].mostLiquidPool_id, token0MostLiquidPool.id, "the most liquid pool should not change");
  });

  it(`should update the token1 price, if calling 'updateTokenPricesFromPoolPrices'
    from a pool that is not the current most liquid, but the new price, is within
    the outlier price threshold compared to the current price.
    The most liquid pool should remain the same`, async () => {
    const currentSqrtPriceX96 = BigInt("5111988562125188534995516");
    const token0MostLiquidPool = new PoolMock("0xM05ST_LIQUID_POOL_ID_0");
    const token1MostLiquidPool = new PoolMock("0xM05ST_LIQUID_POOL_ID_1");
    const currentPool = new PoolMock("0xNOT_MOST_LIQUID_POOL_ID");
    const token0Address = IndexerNetwork.wrappedNativeAddress(network);
    const token1Address = IndexerNetwork.stablecoinsAddresses(network)[0];

    const token0: Token = {
      ...new TokenMock(token0Address),
      tokenAddress: token0Address,
      mostLiquidPool_id: token0MostLiquidPool.id,
      usdPrice: BigDecimal("4300"),
      decimals: 18,
    };

    const token1: Token = {
      ...new TokenMock(token1Address),
      tokenAddress: token1Address,
      mostLiquidPool_id: token1MostLiquidPool.id,
      usdPrice: BigDecimal("0.8"),
      decimals: 6,
    };

    const pool: Pool = {
      ...currentPool,
      token0_id: token0.id,
      token1_id: token1.id,
    };

    const poolPrices = sqrtPriceX96toPrice(currentSqrtPriceX96, token0, token1);

    const result = await sut.updateTokenPricesFromPoolPrices(token0, token1, pool, poolPrices);

    assert.deepEqual(result[1].usdPrice.toString(), BigDecimal("1").toString(), "price is not updated correctly");
    assert.deepEqual(result[1].mostLiquidPool_id, token1MostLiquidPool.id, "the most liquid pool should not change");
  });

  it(`should not update the token0 price, if calling 'updateTokenPricesFromPoolPrices'
    from a pool that is not the current most liquid, and the new price is
    not within the outlier price threshold compared to the current price`, async () => {
    const currentSqrtPriceX96 = BigInt("79224040650647629793123337304");
    const token0Id = "0x0000000000000000000000000000000000000012";
    const token1Id = "0x0000000000000000000000000000000000000002";

    const token0MostLiquidPool: Pool = {
      ...new PoolMock("0xM05ST_LIQUID_POOL_ID_0"),
      totalValueLockedToken0: BigDecimal("92168725178257164265142651452"),
      token0_id: token0Id,
    };

    const token1MostLiquidPool: Pool = {
      ...new PoolMock("0xM05ST_LIQUID_POOL_ID_1"),
      totalValueLockedToken0: BigDecimal("92168725178257164265142651452"),
      token1_id: token1Id,
    };

    const token0: Token = {
      ...new TokenMock(token0Id),
      mostLiquidPool_id: token0MostLiquidPool.id,
      usdPrice: BigDecimal("21"),
      decimals: 8,
    };

    const token1: Token = {
      ...new TokenMock(token1Id),
      mostLiquidPool_id: token1MostLiquidPool.id,
      usdPrice: BigDecimal("111555"),
      decimals: 8,
    };

    const pool: Pool = {
      ...new PoolMock("0xNOT_MOST_LIQUID_POOL_ID"),
      totalValueLockedToken0: BigDecimal("1"),
      totalValueLockedToken1: BigDecimal("1"),
      token0_id: token0.id,
      token1_id: token1.id,
    };

    context.Pool.set(pool);
    context.Pool.set(token0MostLiquidPool);
    context.Pool.set(token1MostLiquidPool);
    context.Token.set(token0);
    context.Token.set(token1);

    const poolPrices = sqrtPriceX96toPrice(currentSqrtPriceX96, token0, token1);

    const result = await sut.updateTokenPricesFromPoolPrices(token0, token1, pool, poolPrices);

    assert.deepEqual(result[0].usdPrice, token0.usdPrice);
  });

  it(`should not update the token1 price, if calling 'updateTokenPricesFromPoolPrices'
    from a pool that is not the current most liquid, and the new price is
    not within the outlier price threshold compared to the current price`, async () => {
    const currentSqrtPriceX96 = BigInt("5111988562125188534995516");
    const token0Address = IndexerNetwork.wrappedNativeAddress(network);
    const token1Address = IndexerNetwork.stablecoinsAddresses(network)[0];

    const token0MostLiquidPool: Pool = {
      ...new PoolMock("0xM05ST_LIQUID_POOL_ID_0"),
      totalValueLockedToken0: BigDecimal("92168725178257164265142651452"),
      token0_id: token0Address,
    };

    const token1MostLiquidPool: Pool = {
      ...new PoolMock("0xM05ST_LIQUID_POOL_ID_1"),
      totalValueLockedToken0: BigDecimal("92168725178257164265142651452"),
      token1_id: token1Address,
    };

    const token0: Token = {
      ...new TokenMock(token0Address),
      tokenAddress: token0Address,
      mostLiquidPool_id: token0MostLiquidPool.id,
      usdPrice: BigDecimal("4300"),
      decimals: 8,
    };

    const token1: Token = {
      ...new TokenMock(token1Address),
      tokenAddress: token1Address,
      mostLiquidPool_id: token1MostLiquidPool.id,
      usdPrice: BigDecimal("0.002"),
      decimals: 8,
    };

    const pool: Pool = {
      ...new PoolMock("0xNOT_MOST_LIQUID_POOL_ID"),
      totalValueLockedToken0: BigDecimal("1"),
      totalValueLockedToken1: BigDecimal("4300"),
      token0_id: token0.id,
      token1_id: token1.id,
    };

    context.Pool.set(pool);
    context.Pool.set(token0MostLiquidPool);
    context.Pool.set(token1MostLiquidPool);
    context.Token.set(token0);
    context.Token.set(token1);

    const poolPrices = sqrtPriceX96toPrice(currentSqrtPriceX96, token0, token1);

    const result = await sut.updateTokenPricesFromPoolPrices(token0, token1, pool, poolPrices);

    assert.deepEqual(result[1].usdPrice.toString(), token1.usdPrice.toString());
  });

  it(`should not update the token0 price when calling 'updateTokenPricesFromPoolPrices'
    if the new price is outside the threshold, the pool TVL is unbalanced with the new
    prices, and the price has broken the threshold going up`, async () => {
    const currentSqrtPriceX96 = BigInt("79224040650647629793123337304");
    const token0Id = "0x0000000000000000000000000000000000000012";
    const token1Id = "0x0000000000000000000000000000000000000002";

    const token0: Token = {
      ...new TokenMock(token0Id),
      usdPrice: BigDecimal("1.23"),
      decimals: 8,
    };

    const token1: Token = {
      ...new TokenMock(token1Id),
      usdPrice: BigDecimal("111555"),
      decimals: 8,
    };

    const pool: Pool = {
      ...new PoolMock("0xNOT_MOST_LIQUID_POOL_ID"),
      totalValueLockedToken0: BigDecimal("516752167"),
      totalValueLockedToken1: BigDecimal("1"),
      token0_id: token0.id,
      token1_id: token1.id,
    };

    const poolPrices = sqrtPriceX96toPrice(currentSqrtPriceX96, token0, token1);

    const result = await sut.updateTokenPricesFromPoolPrices(token0, token1, pool, poolPrices);

    assert.deepEqual(result[0].usdPrice, token0.usdPrice);
  });

  it(`should not update the token1 price when calling 'updateTokenPricesFromPoolPrices'
    if the new price is outside the threshold, the pool TVL is unbalanced with the new
    prices, and the price has broken the threshold going up`, async () => {
    const currentSqrtPriceX96 = BigInt("5111988562125188534995516");
    const token0Address = IndexerNetwork.wrappedNativeAddress(network);
    const token1Address = IndexerNetwork.stablecoinsAddresses(network)[0];

    const token0: Token = {
      ...new TokenMock(token0Address),
      tokenAddress: token0Address,
      usdPrice: BigDecimal("4300"),
      decimals: 8,
    };

    const token1: Token = {
      ...new TokenMock(token1Address),
      tokenAddress: token1Address,
      usdPrice: BigDecimal("0.002"),
      decimals: 8,
    };

    const pool: Pool = {
      ...new PoolMock("0xNOT_MOST_LIQUID_POOL_ID"),
      totalValueLockedToken0: BigDecimal("1"),
      totalValueLockedToken1: BigDecimal("2891628916281219826918"),
      token0_id: token0.id,
      token1_id: token1.id,
    };

    const poolPrices = sqrtPriceX96toPrice(currentSqrtPriceX96, token0, token1);

    const result = await sut.updateTokenPricesFromPoolPrices(token0, token1, pool, poolPrices);

    assert.deepEqual(result[1].usdPrice.toString(), token1.usdPrice.toString());
  });

  it(`should set the token0 price if the old price is zero,
    the most liquid pool is not set yet, and the token 1
    and token0 tvl usd is balanced`, async () => {
    const currentSqrtPriceX96 = BigInt("79224040650647629793123337304");
    const token0Id = "0x0000000000000000000000000000000000000012";
    const token1Id = "0x0000000000000000000000000000000000000002";

    const token0: Token = {
      ...new TokenMock(token0Id),
      usdPrice: ZERO_BIG_DECIMAL,
      decimals: 8,
    };

    const token1: Token = {
      ...new TokenMock(token1Id),
      usdPrice: BigDecimal("111555"),
      decimals: 8,
    };

    const pool: Pool = {
      ...new PoolMock(),
      totalValueLockedToken0: BigDecimal("1"),
      totalValueLockedToken1: BigDecimal("1"),
      token0_id: token0.id,
      token1_id: token1.id,
    };

    const poolPrices = sqrtPriceX96toPrice(currentSqrtPriceX96, token0, token1);

    const result = await sut.updateTokenPricesFromPoolPrices(token0, token1, pool, poolPrices);

    assert.deepEqual(result[0].usdPrice.toString(), "111543.3929522");
  });

  it(`should set the token0 most liquid pool as the current
    one if the, the most liquid pool is not set yet, and the token 1
    and token0 tvl usd is balanced`, async () => {
    const currentSqrtPriceX96 = BigInt("79224040650647629793123337304");
    const token0Id = "0x0000000000000000000000000000000000000012";
    const token1Id = "0x0000000000000000000000000000000000000002";

    const token0: Token = {
      ...new TokenMock(token0Id),
      usdPrice: ZERO_BIG_DECIMAL,
      mostLiquidPool_id: ZERO_ADDRESS,
      decimals: 8,
    };

    const token1: Token = {
      ...new TokenMock(token1Id),
      usdPrice: BigDecimal("111555"),
      mostLiquidPool_id: ZERO_ADDRESS,
      decimals: 8,
    };

    const pool: Pool = {
      ...new PoolMock(),
      totalValueLockedToken0: BigDecimal("1"),
      totalValueLockedToken1: BigDecimal("1"),
      token0_id: token0.id,
      token1_id: token1.id,
    };

    const poolPrices = sqrtPriceX96toPrice(currentSqrtPriceX96, token0, token1);

    const result = await sut.updateTokenPricesFromPoolPrices(token0, token1, pool, poolPrices);

    assert.deepEqual(result[0].mostLiquidPool_id, pool.id);
  });

  it(`should set the token1 price if the old price is zero,
    the most liquid pool is not set yet, and the token 1
    and token0 tvl usd is balanced`, async () => {
    const currentSqrtPriceX96 = BigInt("79224040650647629793123337304");
    const token0Id = "0x0000000000000000000000000000000000000012";
    const token1Id = "0x0000000000000000000000000000000000000002";

    const token0: Token = {
      ...new TokenMock(token0Id),
      usdPrice: BigDecimal("19500"),
      decimals: 8,
    };

    const token1: Token = {
      ...new TokenMock(token1Id),
      usdPrice: ZERO_BIG_DECIMAL,
      decimals: 8,
    };

    const pool: Pool = {
      ...new PoolMock(),
      totalValueLockedToken0: BigDecimal("1"),
      totalValueLockedToken1: BigDecimal("1"),
      token0_id: token0.id,
      token1_id: token1.id,
    };

    const poolPrices = sqrtPriceX96toPrice(currentSqrtPriceX96, token0, token1);

    const result = await sut.updateTokenPricesFromPoolPrices(token0, token1, pool, poolPrices);

    assert.deepEqual(result[1].usdPrice.toString(), "19502.02914244");
  });

  it(`should set the token1 most liquid pool as the current,
    if the most liquid pool is not set yet, and the token 1
    and token0 tvl usd is balanced`, async () => {
    const currentSqrtPriceX96 = BigInt("79224040650647629793123337304");
    const token0Id = "0x0000000000000000000000000000000000000012";
    const token1Id = "0x0000000000000000000000000000000000000002";

    const token0: Token = {
      ...new TokenMock(token0Id),
      usdPrice: BigDecimal("19500"),
      mostLiquidPool_id: ZERO_ADDRESS,
      decimals: 8,
    };

    const token1: Token = {
      ...new TokenMock(token1Id),
      usdPrice: ZERO_BIG_DECIMAL,
      mostLiquidPool_id: ZERO_ADDRESS,
      decimals: 8,
    };

    const pool: Pool = {
      ...new PoolMock(),
      totalValueLockedToken0: BigDecimal("1"),
      totalValueLockedToken1: BigDecimal("1"),
      token0_id: token0.id,
      token1_id: token1.id,
    };

    const poolPrices = sqrtPriceX96toPrice(currentSqrtPriceX96, token0, token1);

    const result = await sut.updateTokenPricesFromPoolPrices(token0, token1, pool, poolPrices);

    assert.deepEqual(result[1].mostLiquidPool_id, pool.id);
  });

  it(`should not set the token1 price if the token 1
    and token0 tvl usd with the new prices is not
    balanced even if the old price is zero,
    and the most liquid pool is not set yet, `, async () => {
    const currentSqrtPriceX96 = BigInt("79224040650647629793123337304");
    const token0Id = "0x0000000000000000000000000000000000000012";
    const token1Id = "0x0000000000000000000000000000000000000002";

    const token0: Token = {
      ...new TokenMock(token0Id),
      usdPrice: BigDecimal("19500"),
      decimals: 8,
    };

    const token1: Token = {
      ...new TokenMock(token1Id),
      usdPrice: ZERO_BIG_DECIMAL,
      decimals: 8,
    };

    const pool: Pool = {
      ...new PoolMock(),
      totalValueLockedToken0: BigDecimal("1"),
      totalValueLockedToken1: BigDecimal("12896178251752176"),
      token0_id: token0.id,
      token1_id: token1.id,
    };

    const poolPrices = sqrtPriceX96toPrice(currentSqrtPriceX96, token0, token1);

    const result = await sut.updateTokenPricesFromPoolPrices(token0, token1, pool, poolPrices);

    assert.deepEqual(result[1].usdPrice.toString(), "0");
  });

  it(`should not set the token0 price if the token 1
    and token0 tvl usd with the new prices is not
    balanced even if the old price is zero,
    and the most liquid pool is not set yet, `, async () => {
    const currentSqrtPriceX96 = BigInt("79224040650647629793123337304");
    const token0Id = "0x0000000000000000000000000000000000000012";
    const token1Id = "0x0000000000000000000000000000000000000002";

    const token0: Token = {
      ...new TokenMock(token0Id),
      usdPrice: ZERO_BIG_DECIMAL,
      decimals: 8,
    };

    const token1: Token = {
      ...new TokenMock(token1Id),
      usdPrice: BigDecimal("232"),
      decimals: 8,
    };

    const pool: Pool = {
      ...new PoolMock(),
      totalValueLockedToken0: BigDecimal("86398232981"),
      totalValueLockedToken1: BigDecimal("1"),
      token0_id: token0.id,
      token1_id: token1.id,
    };

    const poolPrices = sqrtPriceX96toPrice(currentSqrtPriceX96, token0, token1);

    const result = await sut.updateTokenPricesFromPoolPrices(token0, token1, pool, poolPrices);

    assert.deepEqual(result[0].usdPrice.toString(), "0");
  });

  it(`should set the token0 usd price if the new price is outside
    the threshold going down with unbalanced TVL, but the pool setting the price,
    is the current most liquid`, async () => {
    const currentSqrtPriceX96 = BigInt("5111988562125188534995516");
    const currentPool = new PoolMock("0xNOT_MOST_LIQUID_POOL_ID");
    const token0Address = IndexerNetwork.wrappedNativeAddress(network);
    const token1Address = IndexerNetwork.stablecoinsAddresses(network)[0];
    const token0MostLiquidPool = new PoolMock(currentPool.id);
    const token1MostLiquidPool: Pool = {
      ...new PoolMock("0xM05ST_LIQUID_POOL_ID_1"),
      token0_id: "xbas",
      token1_id: token1Address,
    };

    const token0: Token = {
      ...new TokenMock(token0Address),
      tokenAddress: token0Address,
      mostLiquidPool_id: token0MostLiquidPool.id,
      usdPrice: BigDecimal("1289162891628916289162891"),
      decimals: 18,
    };

    const token1: Token = {
      ...new TokenMock(token1Address),
      tokenAddress: token1Address,
      mostLiquidPool_id: token1MostLiquidPool.id,
      usdPrice: BigDecimal("23500"),
      decimals: 6,
    };

    context.Pool.set(token1MostLiquidPool);
    context.Token.set(token0);
    context.Token.set(token1);

    const pool: Pool = {
      ...currentPool,
      token0_id: token0.id,
      token1_id: token1.id,
      totalValueLockedToken0: BigDecimal("2961826782516725167"),
      totalValueLockedToken1: BigDecimal("1"),
    };

    const poolPrices = sqrtPriceX96toPrice(currentSqrtPriceX96, token0, token1);

    const result = await sut.updateTokenPricesFromPoolPrices(token0, token1, pool, poolPrices);

    assert.deepEqual(result[0].usdPrice.toString(), "4163.13581664");
  });

  it(`should set the token1 usd price if the new price is outside
    the threshold going down with unbalanced TVL, but the pool
    setting the price, is the current most liquid`, async () => {
    const currentSqrtPriceX96 = BigInt("5111988562125188534995516");
    const token0Address = IndexerNetwork.wrappedNativeAddress(network);
    const token1Address = IndexerNetwork.stablecoinsAddresses(network)[0];
    const currentPool = new PoolMock("0xNOT_MOST_LIQUID_POOL_ID");
    const token0MostLiquidPool = new PoolMock("0xM05ST_LIQUID_POOL_ID_0");
    const token1MostLiquidPool = new PoolMock(currentPool.id);

    const token0: Token = {
      ...new TokenMock(token0Address),
      tokenAddress: token0Address,
      mostLiquidPool_id: token0MostLiquidPool.id,
      usdPrice: BigDecimal("13.21"),
      decimals: 18,
    };

    const token1: Token = {
      ...new TokenMock(token1Address),
      tokenAddress: token1Address,
      mostLiquidPool_id: token1MostLiquidPool.id,
      usdPrice: BigDecimal("1289162891628916289162891"),
      decimals: 6,
    };

    const pool: Pool = {
      ...currentPool,
      token0_id: token0.id,
      token1_id: token1.id,
      totalValueLockedToken0: BigDecimal("1"),
      totalValueLockedToken1: BigDecimal("2961826782516725167"),
    };

    const poolPrices = sqrtPriceX96toPrice(currentSqrtPriceX96, token0, token1);

    const result = await sut.updateTokenPricesFromPoolPrices(token0, token1, pool, poolPrices);

    assert.deepEqual(result[1].usdPrice.toString(), "1");
  });

  it(`should set the token0 usd price if the pool setting the price
    is more liquid than the saved one. Even if the price is outside
    the threshold`, async () => {
    const currentSqrtPriceX96 = BigInt("79224040650647629793123337304");
    const token0Id = "0x0000000000000000000000000000000000000012";
    const token1Id = "0x0000000000000000000000000000000000000002";

    const token0MostLiquidPoolSaved: Pool = {
      ...new PoolMock("0xM05ST_LIQUID_POOL_ID_0_SAVED"),
      totalValueLockedToken0: BigDecimal("0.05"),
      token0_id: token0Id,
    };

    const token1MostLiquidPoolSaved: Pool = {
      ...new PoolMock("0xM05ST_LIQUID_POOL_ID_1_SAVED"),
      totalValueLockedToken0: BigDecimal("10"),
      token1_id: token1Id,
    };

    const token0: Token = {
      ...new TokenMock(token0Id),
      mostLiquidPool_id: token0MostLiquidPoolSaved.id,
      usdPrice: BigDecimal("21"),
      decimals: 8,
    };

    const token1: Token = {
      ...new TokenMock(token1Id),
      mostLiquidPool_id: token1MostLiquidPoolSaved.id,
      usdPrice: BigDecimal("111555"),
      decimals: 8,
    };

    const pool: Pool = {
      ...new PoolMock("0xMOST_REAL_LIQUID_POOL_ID"),
      totalValueLockedToken0: BigDecimal("1"),
      totalValueLockedToken1: BigDecimal("4000"),
      token0_id: token0.id,
      token1_id: token1.id,
    };

    context.Pool.set(pool);
    context.Pool.set(token0MostLiquidPoolSaved);
    context.Pool.set(token1MostLiquidPoolSaved);
    context.Token.set(token0);
    context.Token.set(token1);

    const poolPrices = sqrtPriceX96toPrice(currentSqrtPriceX96, token0, token1);

    const result = await sut.updateTokenPricesFromPoolPrices(token0, token1, pool, poolPrices);

    assert.deepEqual(result[0].usdPrice.toString(), "111543.3929522");
  });

  it(`should set the token0 most liquid pool as the current one if
    is more liquid than the saved one. Even if the price is outside
    the threshold`, async () => {
    const currentSqrtPriceX96 = BigInt("79224040650647629793123337304");
    const token0Id = "0x0000000000000000000000000000000000000012";
    const token1Id = "0x0000000000000000000000000000000000000002";

    const token0MostLiquidPoolSaved: Pool = {
      ...new PoolMock("0xM05ST_LIQUID_POOL_ID_0_SAVED"),
      totalValueLockedToken0: BigDecimal("0.01"),
      token0_id: token0Id,
    };

    const token1MostLiquidPoolSaved: Pool = {
      ...new PoolMock("0xM05ST_LIQUID_POOL_ID_1_SAVED"),
      totalValueLockedToken0: BigDecimal("10"),
      token1_id: token1Id,
    };

    const token0: Token = {
      ...new TokenMock(token0Id),
      mostLiquidPool_id: token0MostLiquidPoolSaved.id,
      usdPrice: BigDecimal("21"),
      decimals: 8,
    };

    const token1: Token = {
      ...new TokenMock(token1Id),
      mostLiquidPool_id: token1MostLiquidPoolSaved.id,
      usdPrice: BigDecimal("111555"),
      decimals: 8,
    };

    const pool: Pool = {
      ...new PoolMock("0xMOST_REAL_LIQUID_POOL_ID"),
      totalValueLockedToken0: BigDecimal("1"),
      totalValueLockedToken1: BigDecimal("4000"),
      token0_id: token0.id,
      token1_id: token1.id,
    };

    context.Pool.set(pool);
    context.Pool.set(token0MostLiquidPoolSaved);
    context.Pool.set(token1MostLiquidPoolSaved);
    context.Token.set(token0);
    context.Token.set(token1);

    const poolPrices = sqrtPriceX96toPrice(currentSqrtPriceX96, token0, token1);

    const result = await sut.updateTokenPricesFromPoolPrices(token0, token1, pool, poolPrices);

    assert.deepEqual(result[0].mostLiquidPool_id, pool.id);
  });

  it(`should not set the token0 usd price if the pool setting the price
    is more liquid than the saved one if the tvl usd with the new
    prices are not balanced`, async () => {
    const currentSqrtPriceX96 = BigInt("79224040650647629793123337304");
    const token0Id = "0x0000000000000000000000000000000000000012";
    const token1Id = "0x0000000000000000000000000000000000000002";

    const token0MostLiquidPoolSaved: Pool = {
      ...new PoolMock("0xM05ST_LIQUID_POOL_ID_0_SAVED"),
      totalValueLockedToken0: BigDecimal("112"),
      token0_id: token0Id,
    };

    const token1MostLiquidPoolSaved: Pool = {
      ...new PoolMock("0xM05ST_LIQUID_POOL_ID_1_SAVED"),
      totalValueLockedToken0: BigDecimal("10"),
      token1_id: token1Id,
    };

    const token0: Token = {
      ...new TokenMock(token0Id),
      mostLiquidPool_id: token0MostLiquidPoolSaved.id,
      usdPrice: BigDecimal("21"),
      decimals: 8,
    };

    const token1: Token = {
      ...new TokenMock(token1Id),
      mostLiquidPool_id: token1MostLiquidPoolSaved.id,
      usdPrice: BigDecimal("111555"),
      decimals: 8,
    };

    const pool: Pool = {
      ...new PoolMock("0xMOST_REAL_LIQUID_POOL_ID"),
      totalValueLockedToken0: BigDecimal("912619826189251872517"),
      totalValueLockedToken1: BigDecimal("400"),
      token0_id: token0.id,
      token1_id: token1.id,
    };

    context.Pool.set(pool);
    context.Pool.set(token0MostLiquidPoolSaved);
    context.Pool.set(token1MostLiquidPoolSaved);
    context.Token.set(token0);
    context.Token.set(token1);

    const poolPrices = sqrtPriceX96toPrice(currentSqrtPriceX96, token0, token1);

    const result = await sut.updateTokenPricesFromPoolPrices(token0, token1, pool, poolPrices);

    assert.deepEqual(result[0].usdPrice.toString(), token0.usdPrice.toString());
  });

  it(`should set the token1 usd price if the pool setting the price
    is more liquid than the saved one. Even if the price is outside
    the threshold`, async () => {
    const currentSqrtPriceX96 = BigInt("5111988562125188534995516");
    const token0Address = IndexerNetwork.wrappedNativeAddress(network);
    const token1Address = IndexerNetwork.stablecoinsAddresses(network)[0];

    const token0MostLiquidPoolSaved: Pool = {
      ...new PoolMock("0xM05ST_LIQUID_POOL_ID_0_SAVED"),
      totalValueLockedToken0: BigDecimal("112"),
      token0_id: token0Address,
    };

    const token1MostLiquidPoolSaved: Pool = {
      ...new PoolMock("0xM05ST_LIQUID_POOL_ID_1_SAVED"),
      totalValueLockedToken1: BigDecimal("10"),
      token1_id: token1Address,
    };

    const token0: Token = {
      ...new TokenMock(token0Address),
      tokenAddress: token0Address,
      mostLiquidPool_id: token0MostLiquidPoolSaved.id,
      usdPrice: BigDecimal("2100"),
      decimals: 18,
    };

    const token1: Token = {
      ...new TokenMock(token1Address),
      tokenAddress: token1Address,
      mostLiquidPool_id: token1MostLiquidPoolSaved.id,
      usdPrice: BigDecimal("25"),
      decimals: 6,
    };

    const pool: Pool = {
      ...new PoolMock("0xMOST_REAL_LIQUID_POOL_ID"),
      totalValueLockedToken0: BigDecimal("1"),
      totalValueLockedToken1: BigDecimal("900"),
      token0_id: token0.id,
      token1_id: token1.id,
    };

    context.Pool.set(pool);
    context.Pool.set(token0MostLiquidPoolSaved);
    context.Pool.set(token1MostLiquidPoolSaved);
    context.Token.set(token0);
    context.Token.set(token1);

    const poolPrices = sqrtPriceX96toPrice(currentSqrtPriceX96, token0, token1);

    const result = await sut.updateTokenPricesFromPoolPrices(token0, token1, pool, poolPrices);

    assert.deepEqual(result[1].usdPrice.toString(), "1");
  });

  it(`should set the token1 most liquid pool asn the current one if
    is more liquid than the saved one. Even if the price is outside
    the threshold`, async () => {
    const currentSqrtPriceX96 = BigInt("5111988562125188534995516");
    const token0Address = IndexerNetwork.wrappedNativeAddress(network);
    const token1Address = IndexerNetwork.stablecoinsAddresses(network)[0];

    const token0MostLiquidPoolSaved: Pool = {
      ...new PoolMock("0xM05ST_LIQUID_POOL_ID_0_SAVED"),
      totalValueLockedToken0: BigDecimal("112"),
      token0_id: token0Address,
    };

    const token1MostLiquidPoolSaved: Pool = {
      ...new PoolMock("0xM05ST_LIQUID_POOL_ID_1_SAVED"),
      totalValueLockedToken1: BigDecimal("10"),
      token1_id: token1Address,
    };

    const token0: Token = {
      ...new TokenMock(token0Address),
      tokenAddress: token0Address,
      mostLiquidPool_id: token0MostLiquidPoolSaved.id,
      usdPrice: BigDecimal("2100"),
      decimals: 18,
    };

    const token1: Token = {
      ...new TokenMock(token1Address),
      tokenAddress: token1Address,
      mostLiquidPool_id: token1MostLiquidPoolSaved.id,
      usdPrice: BigDecimal("25"),
      decimals: 6,
    };

    const pool: Pool = {
      ...new PoolMock("0xMOST_REAL_LIQUID_POOL_ID"),
      totalValueLockedToken0: BigDecimal("1"),
      totalValueLockedToken1: BigDecimal("900"),
      token0_id: token0.id,
      token1_id: token1.id,
    };

    context.Pool.set(pool);
    context.Pool.set(token0MostLiquidPoolSaved);
    context.Pool.set(token1MostLiquidPoolSaved);
    context.Token.set(token0);
    context.Token.set(token1);

    const poolPrices = sqrtPriceX96toPrice(currentSqrtPriceX96, token0, token1);

    const result = await sut.updateTokenPricesFromPoolPrices(token0, token1, pool, poolPrices);

    assert.deepEqual(result[1].mostLiquidPool_id, pool.id);
  });

  it(`should not set the token1 usd price if the pool setting the price
    is more liquid than the saved one, but the tvl usd with the new prices
    are not balanced`, async () => {
    const currentSqrtPriceX96 = BigInt("5111988562125188534995516");
    const token0Address = IndexerNetwork.wrappedNativeAddress(network);
    const token1Address = IndexerNetwork.stablecoinsAddresses(network)[0];

    const token0MostLiquidPoolSaved: Pool = {
      ...new PoolMock("0xM05ST_LIQUID_POOL_ID_0_SAVED"),
      totalValueLockedToken0: BigDecimal("112"),
      token0_id: token0Address,
    };

    const token1MostLiquidPoolSaved: Pool = {
      ...new PoolMock("0xM05ST_LIQUID_POOL_ID_1_SAVED"),
      totalValueLockedToken1: BigDecimal("10"),
      token1_id: token1Address,
    };

    const token0: Token = {
      ...new TokenMock(token0Address),
      tokenAddress: token0Address,
      mostLiquidPool_id: token0MostLiquidPoolSaved.id,
      usdPrice: BigDecimal("2100"),
      decimals: 18,
    };

    const token1: Token = {
      ...new TokenMock(token1Address),
      tokenAddress: token1Address,
      mostLiquidPool_id: token1MostLiquidPoolSaved.id,
      usdPrice: BigDecimal("25"),
      decimals: 6,
    };

    const pool: Pool = {
      ...new PoolMock("0xMOST_REAL_LIQUID_POOL_ID"),
      totalValueLockedToken0: BigDecimal("500"),
      totalValueLockedToken1: BigDecimal("900"),
      token0_id: token0.id,
      token1_id: token1.id,
    };

    context.Pool.set(pool);
    context.Pool.set(token0MostLiquidPoolSaved);
    context.Pool.set(token1MostLiquidPoolSaved);
    context.Token.set(token0);
    context.Token.set(token1);

    const poolPrices = sqrtPriceX96toPrice(currentSqrtPriceX96, token0, token1);

    const result = await sut.updateTokenPricesFromPoolPrices(token0, token1, pool, poolPrices);

    assert.deepEqual(result[1].usdPrice.toString(), token1.usdPrice.toString());
  });

  it(`should use the current created pool daily data to
    update the daily liquidity data, if there's already
    one created in the same day as the event timestamp,
    when calling 'setLiquidityIntervalData' multiple
    times adding liquidity`, async () => {
    const token0 = new TokenMock();
    const token1 = new TokenMock();
    const pool = new PoolMock();
    const amount0Added = 200n * 10n ** 18n;
    const amount1Added = 100n * 10n ** 6n;
    const amount0AddedFormatted = formatFromTokenAmount(amount0Added, token0);
    const amount1AddedFormatted = formatFromTokenAmount(amount1Added, token1);
    const eventTimestamp = 1640995200n;
    const timesCalled = 6;
    const currentPoolDailyData: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(eventTimestamp, pool),
      dayStartTimestamp: eventTimestamp,
      liquidityInflowToken0: BigDecimal("21"),
      liquidityInflowToken1: BigDecimal("12701"),
      liquidityInflowUSD: BigDecimal("29179201"),
      liquidityNetInflowToken0: BigDecimal("-1221"),
      liquidityNetInflowToken1: BigDecimal("-9999"),
      liquidityNetInflowUSD: BigDecimal("1271902198"),
      liquidityOutflowToken0: BigDecimal("127819"),
      liquidityOutflowToken1: BigDecimal("9999"),
      liquidityOutflowUSD: BigDecimal("112213"),
      liquidityVolumeToken0: BigDecimal("21895218921"),
      liquidityVolumeToken1: BigDecimal("291862981"),
      liquidityVolumeUSD: BigDecimal("281902810921"),
    };

    context.PoolDailyData.set(currentPoolDailyData);

    const liquidityInflowsAndOutflows = getLiquidityInflowAndOutflowFromRawAmounts(
      amount0Added,
      amount1Added,
      token0,
      token1
    );

    for (let i = 0; i < timesCalled; i++) {
      await sut.setLiquidityIntervalData({
        amount0AddedOrRemoved: amount0Added,
        amount1AddedOrRemoved: amount1Added,
        eventTimestamp: eventTimestamp,
        poolEntity: pool,
        token0: token0,
        token1: token1,
      });
    }

    const expectedNewPoolDailyData: PoolDailyData = {
      ...currentPoolDailyData,
      liquidityInflowToken0: currentPoolDailyData.liquidityInflowToken0.plus(
        liquidityInflowsAndOutflows.inflowToken0.times(timesCalled)
      ),
      liquidityInflowToken1: currentPoolDailyData.liquidityInflowToken1.plus(
        liquidityInflowsAndOutflows.inflowToken1.times(timesCalled)
      ),
      liquidityInflowUSD: currentPoolDailyData.liquidityInflowUSD.plus(
        liquidityInflowsAndOutflows.inflowUSD.times(timesCalled)
      ),
      liquidityNetInflowToken0: currentPoolDailyData.liquidityNetInflowToken0.plus(
        liquidityInflowsAndOutflows.netInflowToken0.times(timesCalled)
      ),
      liquidityNetInflowToken1: currentPoolDailyData.liquidityNetInflowToken1.plus(
        liquidityInflowsAndOutflows.netInflowToken1.times(timesCalled)
      ),
      liquidityNetInflowUSD: currentPoolDailyData.liquidityNetInflowUSD.plus(
        liquidityInflowsAndOutflows.netInflowUSD.times(timesCalled)
      ),
      liquidityOutflowToken0: currentPoolDailyData.liquidityOutflowToken0.plus(
        liquidityInflowsAndOutflows.outflowToken0.times(timesCalled)
      ),
      liquidityOutflowToken1: currentPoolDailyData.liquidityOutflowToken1.plus(
        liquidityInflowsAndOutflows.outflowToken1.times(timesCalled)
      ),
      liquidityOutflowUSD: currentPoolDailyData.liquidityOutflowUSD.plus(
        liquidityInflowsAndOutflows.outflowUSD.times(timesCalled)
      ),
      liquidityVolumeToken0: currentPoolDailyData.liquidityVolumeToken0.plus(
        amount0AddedFormatted.abs().times(timesCalled)
      ),
      liquidityVolumeToken1: currentPoolDailyData.liquidityVolumeToken1.plus(
        amount1AddedFormatted.abs().times(timesCalled)
      ),
      liquidityVolumeUSD: currentPoolDailyData.liquidityVolumeUSD.plus(
        amount0AddedFormatted
          .abs()
          .times(token0.usdPrice)
          .plus(amount1AddedFormatted.abs().times(token1.usdPrice))
          .times(timesCalled)
      ),
    };

    const actualUpdatedDailyData = await context.PoolDailyData.getOrThrow(getPoolDailyDataId(eventTimestamp, pool));

    assert.deepEqual(actualUpdatedDailyData, expectedNewPoolDailyData);
  });

  it(`should use the current created pool daily data to
    update the daily liquidity data, if there's already
    one created in the same day as the event timestamp,
    when calling 'setLiquidityIntervalData' multiple
    times removing liquidity`, async () => {
    const token0 = new TokenMock();
    const token1 = new TokenMock();
    const pool = new PoolMock();
    const amount0Removed = 2719826198n * 10n ** 18n * -1n;
    const amount1Removed = 98891211n * 10n ** 6n * -1n;
    const amount0AddedFormatted = formatFromTokenAmount(amount0Removed, token0);
    const amount1AddedFormatted = formatFromTokenAmount(amount1Removed, token1);
    const eventTimestamp = 1640995200n;
    const timesCalled = 6;
    const currentPoolDailyData: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(eventTimestamp, pool),
      dayStartTimestamp: eventTimestamp,
      liquidityInflowToken0: BigDecimal("0"),
      liquidityInflowToken1: BigDecimal("12701"),
      liquidityInflowUSD: BigDecimal("29179201"),
      liquidityNetInflowToken0: BigDecimal("1221"),
      liquidityNetInflowToken1: BigDecimal("9999"),
      liquidityNetInflowUSD: BigDecimal("1271902198"),
      liquidityOutflowToken0: BigDecimal("1"),
      liquidityOutflowToken1: BigDecimal("9911199"),
      liquidityOutflowUSD: BigDecimal("1826189628121"),
      liquidityVolumeToken0: BigDecimal("21895218921"),
      liquidityVolumeToken1: BigDecimal("291862981"),
      liquidityVolumeUSD: BigDecimal("281902810921"),
    };

    context.PoolDailyData.set(currentPoolDailyData);

    const liquidityInflowsAndOutflows = getLiquidityInflowAndOutflowFromRawAmounts(
      amount0Removed,
      amount1Removed,
      token0,
      token1
    );

    for (let i = 0; i < timesCalled; i++) {
      await sut.setLiquidityIntervalData({
        amount0AddedOrRemoved: amount0Removed,
        amount1AddedOrRemoved: amount1Removed,

        eventTimestamp: eventTimestamp,
        poolEntity: pool,
        token0: token0,
        token1: token1,
      });
    }

    const expectedNewPoolDailyData: PoolDailyData = {
      ...currentPoolDailyData,
      liquidityInflowToken0: currentPoolDailyData.liquidityInflowToken0.plus(
        liquidityInflowsAndOutflows.inflowToken0.times(timesCalled)
      ),
      liquidityInflowToken1: currentPoolDailyData.liquidityInflowToken1.plus(
        liquidityInflowsAndOutflows.inflowToken1.times(timesCalled)
      ),
      liquidityInflowUSD: currentPoolDailyData.liquidityInflowUSD.plus(
        liquidityInflowsAndOutflows.inflowUSD.times(timesCalled)
      ),
      liquidityNetInflowToken0: currentPoolDailyData.liquidityNetInflowToken0.plus(
        liquidityInflowsAndOutflows.netInflowToken0.times(timesCalled)
      ),
      liquidityNetInflowToken1: currentPoolDailyData.liquidityNetInflowToken1.plus(
        liquidityInflowsAndOutflows.netInflowToken1.times(timesCalled)
      ),
      liquidityNetInflowUSD: currentPoolDailyData.liquidityNetInflowUSD.plus(
        liquidityInflowsAndOutflows.netInflowUSD.times(timesCalled)
      ),
      liquidityOutflowToken0: currentPoolDailyData.liquidityOutflowToken0.plus(
        liquidityInflowsAndOutflows.outflowToken0.times(timesCalled)
      ),
      liquidityOutflowToken1: currentPoolDailyData.liquidityOutflowToken1.plus(
        liquidityInflowsAndOutflows.outflowToken1.times(timesCalled)
      ),
      liquidityOutflowUSD: currentPoolDailyData.liquidityOutflowUSD.plus(
        liquidityInflowsAndOutflows.outflowUSD.times(timesCalled)
      ),
      liquidityVolumeToken0: currentPoolDailyData.liquidityVolumeToken0.plus(
        amount0AddedFormatted.abs().times(timesCalled)
      ),
      liquidityVolumeToken1: currentPoolDailyData.liquidityVolumeToken1.plus(
        amount1AddedFormatted.abs().times(timesCalled)
      ),
      liquidityVolumeUSD: currentPoolDailyData.liquidityVolumeUSD.plus(
        amount0AddedFormatted
          .abs()
          .times(token0.usdPrice)
          .plus(amount1AddedFormatted.abs().times(token1.usdPrice))
          .times(timesCalled)
      ),
    };

    const actualUpdatedDailyData = await context.PoolDailyData.getOrThrow(getPoolDailyDataId(eventTimestamp, pool));

    assert.deepEqual(actualUpdatedDailyData, expectedNewPoolDailyData);
  });

  it(`should create another pool daily entity data to update the
    pool daily liquidity data if the current created pool daily data
    is more than a day away from the event timestamp when calling
    'setLiquidityIntervalData' multiple times removing liquidity`, async () => {
    let eventTimestamp = 1640995200n;
    const token0 = new TokenMock();
    const token1 = new TokenMock();
    const pool = new PoolMock();
    const amount0Removed = 331n * 10n ** 18n * -1n;
    const amount1Removed = 12121n * 10n ** 6n * -1n;
    const amount0AddedFormatted = formatFromTokenAmount(amount0Removed, token0);
    const amount1AddedFormatted = formatFromTokenAmount(amount1Removed, token1);
    const timesCalled = 6;
    const existingPoolDailyData: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(eventTimestamp - BigInt(ONE_HOUR_IN_SECONDS) * 25n, pool),
      dayStartTimestamp: eventTimestamp - BigInt(ONE_HOUR_IN_SECONDS) * 25n,
      liquidityInflowToken0: BigDecimal("0"),
      liquidityInflowToken1: BigDecimal("12701"),
      liquidityInflowUSD: BigDecimal("29179201"),
      liquidityNetInflowToken0: BigDecimal("1221"),
      liquidityNetInflowToken1: BigDecimal("9999"),
      liquidityNetInflowUSD: BigDecimal("1271902198"),
      liquidityOutflowToken0: BigDecimal("1"),
      liquidityOutflowToken1: BigDecimal("9911199"),
      liquidityOutflowUSD: BigDecimal("1826189628121"),
      liquidityVolumeToken0: BigDecimal("21895218921"),
      liquidityVolumeToken1: BigDecimal("291862981"),
      liquidityVolumeUSD: BigDecimal("281902810921"),
    };

    context.PoolDailyData.set(existingPoolDailyData);

    const liquidityInflowsAndOutflows = getLiquidityInflowAndOutflowFromRawAmounts(
      amount0Removed,
      amount1Removed,
      token0,
      token1
    );

    for (let i = 0; i < timesCalled; i++) {
      eventTimestamp = eventTimestamp + BigInt(ONE_HOUR_IN_SECONDS) * 24n;

      await sut.setLiquidityIntervalData({
        amount0AddedOrRemoved: amount0Removed,
        amount1AddedOrRemoved: amount1Removed,

        eventTimestamp,
        poolEntity: pool,
        token0: token0,
        token1: token1,
      });

      const expectedNewPoolDailyData: PoolDailyData = {
        ...defaultPoolDailyData({
          dayDataId: getPoolDailyDataId(eventTimestamp, pool),
          dayStartTimestamp: eventTimestamp,
          poolId: pool.id,
        }),
        liquidityInflowToken0: liquidityInflowsAndOutflows.inflowToken0,
        liquidityInflowToken1: liquidityInflowsAndOutflows.inflowToken1,
        liquidityInflowUSD: liquidityInflowsAndOutflows.inflowUSD,
        liquidityNetInflowToken0: liquidityInflowsAndOutflows.netInflowToken0,
        liquidityNetInflowToken1: liquidityInflowsAndOutflows.netInflowToken1,
        liquidityNetInflowUSD: liquidityInflowsAndOutflows.netInflowUSD,
        liquidityOutflowToken0: liquidityInflowsAndOutflows.outflowToken0,
        liquidityOutflowToken1: liquidityInflowsAndOutflows.outflowToken1,
        liquidityOutflowUSD: liquidityInflowsAndOutflows.outflowUSD,
        liquidityVolumeToken0: amount0AddedFormatted.abs(),
        liquidityVolumeToken1: amount1AddedFormatted.abs(),
        liquidityVolumeUSD: amount0AddedFormatted
          .abs()
          .times(token0.usdPrice)
          .plus(amount1AddedFormatted.abs().times(token1.usdPrice)),
      };

      const actualUpdatedDailyData = await context.PoolDailyData.getOrThrow(getPoolDailyDataId(eventTimestamp, pool));
      assert.deepEqual(actualUpdatedDailyData, expectedNewPoolDailyData);
    }
  });

  it(`should create another pool daily entity data to update the
    pool daily liquidity data if the current created pool daily data
    is more than a day away from the event timestamp when calling
    'setLiquidityIntervalData' multiple times adding liquidity`, async () => {
    let eventTimestamp = 1640995200n;

    const token0 = new TokenMock();
    const token1 = new TokenMock();
    const pool = new PoolMock();
    const amount0Added = 309263892n * 10n ** 18n;
    const amount1Added = 1111n * 10n ** 6n;
    const amount0AddedFormatted = formatFromTokenAmount(amount0Added, token0);
    const amount1AddedFormatted = formatFromTokenAmount(amount1Added, token1);
    const timesCalled = 6;
    const existingPoolDailyData: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(eventTimestamp - BigInt(ONE_HOUR_IN_SECONDS) * 25n, pool),
      dayStartTimestamp: eventTimestamp - BigInt(ONE_HOUR_IN_SECONDS) * 25n,
      liquidityInflowToken0: BigDecimal("0"),
      liquidityInflowToken1: BigDecimal("12701"),
      liquidityInflowUSD: BigDecimal("29179201"),
      liquidityNetInflowToken0: BigDecimal("1221"),
      liquidityNetInflowToken1: BigDecimal("9999"),
      liquidityNetInflowUSD: BigDecimal("1271902198"),
      liquidityOutflowToken0: BigDecimal("1"),
      liquidityOutflowToken1: BigDecimal("9911199"),
      liquidityOutflowUSD: BigDecimal("1826189628121"),
      liquidityVolumeToken0: BigDecimal("21895218921"),
      liquidityVolumeToken1: BigDecimal("291862981"),
      liquidityVolumeUSD: BigDecimal("281902810921"),
    };

    context.PoolDailyData.set(existingPoolDailyData);

    const liquidityInflowsAndOutflows = getLiquidityInflowAndOutflowFromRawAmounts(
      amount0Added,
      amount1Added,
      token0,
      token1
    );

    for (let i = 0; i < timesCalled; i++) {
      eventTimestamp = eventTimestamp + BigInt(ONE_HOUR_IN_SECONDS) * 72n;

      await sut.setLiquidityIntervalData({
        amount0AddedOrRemoved: amount0Added,
        amount1AddedOrRemoved: amount1Added,

        eventTimestamp,
        poolEntity: pool,
        token0: token0,
        token1: token1,
      });

      const expectedNewPoolDailyData: PoolDailyData = {
        ...defaultPoolDailyData({
          dayDataId: getPoolDailyDataId(eventTimestamp, pool),
          dayStartTimestamp: eventTimestamp,
          poolId: pool.id,
        }),
        liquidityInflowToken0: liquidityInflowsAndOutflows.inflowToken0,
        liquidityInflowToken1: liquidityInflowsAndOutflows.inflowToken1,
        liquidityInflowUSD: liquidityInflowsAndOutflows.inflowUSD,
        liquidityNetInflowToken0: liquidityInflowsAndOutflows.netInflowToken0,
        liquidityNetInflowToken1: liquidityInflowsAndOutflows.netInflowToken1,
        liquidityNetInflowUSD: liquidityInflowsAndOutflows.netInflowUSD,
        liquidityOutflowToken0: liquidityInflowsAndOutflows.outflowToken0,
        liquidityOutflowToken1: liquidityInflowsAndOutflows.outflowToken1,
        liquidityOutflowUSD: liquidityInflowsAndOutflows.outflowUSD,
        liquidityVolumeToken0: amount0AddedFormatted.abs(),
        liquidityVolumeToken1: amount1AddedFormatted.abs(),
        liquidityVolumeUSD: amount0AddedFormatted
          .abs()
          .times(token0.usdPrice)
          .plus(amount1AddedFormatted.abs().times(token1.usdPrice)),
      };

      const actualUpdatedDailyData = await context.PoolDailyData.getOrThrow(getPoolDailyDataId(eventTimestamp, pool));
      assert.deepEqual(actualUpdatedDailyData, expectedNewPoolDailyData);
    }
  });

  it(`should create another pool hourly entity data to update the
    pool hourly liquidity data if the current created pool hourly data
    is more than a hour away from the event timestamp when calling
    'setLiquidityIntervalData' multiple times adding liquidity`, async () => {
    let eventTimestamp = 1640995200n;

    const token0 = new TokenMock();
    const token1 = new TokenMock();
    const pool = new PoolMock();
    const amount0Added = 309262n * 10n ** 18n;
    const amount1Added = 1111n * 10n ** 6n;
    const amount0AddedFormatted = formatFromTokenAmount(amount0Added, token0);
    const amount1AddedFormatted = formatFromTokenAmount(amount1Added, token1);
    const timesCalled = 10;
    const existingPoolHourlyData: PoolHourlyData = {
      ...new PoolHourlyDataMock(),
      id: getPoolHourlyDataId(eventTimestamp - BigInt(ONE_HOUR_IN_SECONDS) * 2n, pool),
      hourStartTimestamp: eventTimestamp - BigInt(ONE_HOUR_IN_SECONDS) * 2n,
      liquidityInflowToken0: BigDecimal("0"),
      liquidityInflowToken1: BigDecimal("12701"),
      liquidityInflowUSD: BigDecimal("29179201"),
      liquidityNetInflowToken0: BigDecimal("1221"),
      liquidityNetInflowToken1: BigDecimal("9999"),
      liquidityNetInflowUSD: BigDecimal("1271902198"),
      liquidityOutflowToken0: BigDecimal("1"),
      liquidityOutflowToken1: BigDecimal("9911199"),
      liquidityOutflowUSD: BigDecimal("1826189628121"),
      liquidityVolumeToken0: BigDecimal("21895218921"),
      liquidityVolumeToken1: BigDecimal("291862981"),
      liquidityVolumeUSD: BigDecimal("281902810921"),
    };

    context.PoolHourlyData.set(existingPoolHourlyData);

    const liquidityInflowsAndOutflows = getLiquidityInflowAndOutflowFromRawAmounts(
      amount0Added,
      amount1Added,
      token0,
      token1
    );

    for (let i = 0; i < timesCalled; i++) {
      eventTimestamp = eventTimestamp + BigInt(ONE_HOUR_IN_SECONDS) * 2n;

      await sut.setLiquidityIntervalData({
        amount0AddedOrRemoved: amount0Added,
        amount1AddedOrRemoved: amount1Added,

        eventTimestamp,
        poolEntity: pool,
        token0: token0,
        token1: token1,
      });

      const expectedNewPoolHourlyData: PoolHourlyData = {
        ...defaultPoolHourlyData({
          hourlyDataId: getPoolHourlyDataId(eventTimestamp, pool),
          hourStartTimestamp: eventTimestamp,
          poolId: pool.id,
        }),
        liquidityInflowToken0: liquidityInflowsAndOutflows.inflowToken0,
        liquidityInflowToken1: liquidityInflowsAndOutflows.inflowToken1,
        liquidityInflowUSD: liquidityInflowsAndOutflows.inflowUSD,
        liquidityNetInflowToken0: liquidityInflowsAndOutflows.netInflowToken0,
        liquidityNetInflowToken1: liquidityInflowsAndOutflows.netInflowToken1,
        liquidityNetInflowUSD: liquidityInflowsAndOutflows.netInflowUSD,
        liquidityOutflowToken0: liquidityInflowsAndOutflows.outflowToken0,
        liquidityOutflowToken1: liquidityInflowsAndOutflows.outflowToken1,
        liquidityOutflowUSD: liquidityInflowsAndOutflows.outflowUSD,
        liquidityVolumeToken0: amount0AddedFormatted.abs(),
        liquidityVolumeToken1: amount1AddedFormatted.abs(),
        liquidityVolumeUSD: amount0AddedFormatted
          .abs()
          .times(token0.usdPrice)
          .plus(amount1AddedFormatted.abs().times(token1.usdPrice)),
      };

      const actualUpdatedHourlyData = await context.PoolHourlyData.getOrThrow(
        getPoolHourlyDataId(eventTimestamp, pool)
      );
      assert.deepEqual(actualUpdatedHourlyData, expectedNewPoolHourlyData);
    }
  });

  it(`should modify the existing pool hourly entity data to update the
    pool hourly liquidity data if the current created pool hourly data
    is within a hout from the event timestamp when calling 'setLiquidityIntervalData'
    multiple times adding liquidity`, async () => {
    const token0 = new TokenMock();
    const eventTimestamp = 1640995200n;
    const token1 = new TokenMock();
    const pool = new PoolMock();
    const amount0Added = 309262n * 10n ** 18n;
    const amount1Added = 1111n * 10n ** 6n;
    const amount0AddedFormatted = formatFromTokenAmount(amount0Added, token0);
    const amount1AddedFormatted = formatFromTokenAmount(amount1Added, token1);
    const timesCalled = 10;
    const existingPoolHourlyData: PoolHourlyData = {
      ...new PoolHourlyDataMock(),
      id: getPoolHourlyDataId(eventTimestamp, pool),
      hourStartTimestamp: eventTimestamp,
      liquidityInflowToken0: BigDecimal("0"),
      liquidityInflowToken1: BigDecimal("12701"),
      liquidityInflowUSD: BigDecimal("29179201"),
      liquidityNetInflowToken0: BigDecimal("1221"),
      liquidityNetInflowToken1: BigDecimal("9999"),
      liquidityNetInflowUSD: BigDecimal("1271902198"),
      liquidityOutflowToken0: BigDecimal("1"),
      liquidityOutflowToken1: BigDecimal("9911199"),
      liquidityOutflowUSD: BigDecimal("1826189628121"),
      liquidityVolumeToken0: BigDecimal("21895218921"),
      liquidityVolumeToken1: BigDecimal("291862981"),
      liquidityVolumeUSD: BigDecimal("281902810921"),
    };

    context.PoolHourlyData.set(existingPoolHourlyData);

    const liquidityInflowsAndOutflows = getLiquidityInflowAndOutflowFromRawAmounts(
      amount0Added,
      amount1Added,
      token0,
      token1
    );

    for (let i = 0; i < timesCalled; i++) {
      await sut.setLiquidityIntervalData({
        amount0AddedOrRemoved: amount0Added,
        amount1AddedOrRemoved: amount1Added,

        eventTimestamp: eventTimestamp,
        poolEntity: pool,
        token0: token0,
        token1: token1,
      });
    }

    const expectedNewPoolHourlyData: PoolHourlyData = {
      ...existingPoolHourlyData,
      liquidityInflowToken0: existingPoolHourlyData.liquidityInflowToken0.plus(
        liquidityInflowsAndOutflows.inflowToken0.times(timesCalled)
      ),
      liquidityInflowToken1: existingPoolHourlyData.liquidityInflowToken1.plus(
        liquidityInflowsAndOutflows.inflowToken1.times(timesCalled)
      ),
      liquidityInflowUSD: existingPoolHourlyData.liquidityInflowUSD.plus(
        liquidityInflowsAndOutflows.inflowUSD.times(timesCalled)
      ),
      liquidityNetInflowToken0: existingPoolHourlyData.liquidityNetInflowToken0.plus(
        liquidityInflowsAndOutflows.netInflowToken0.times(timesCalled)
      ),
      liquidityNetInflowToken1: existingPoolHourlyData.liquidityNetInflowToken1.plus(
        liquidityInflowsAndOutflows.netInflowToken1.times(timesCalled)
      ),
      liquidityNetInflowUSD: existingPoolHourlyData.liquidityNetInflowUSD.plus(
        liquidityInflowsAndOutflows.netInflowUSD.times(timesCalled)
      ),
      liquidityOutflowToken0: existingPoolHourlyData.liquidityOutflowToken0.plus(
        liquidityInflowsAndOutflows.outflowToken0.times(timesCalled)
      ),
      liquidityOutflowToken1: existingPoolHourlyData.liquidityOutflowToken1.plus(
        liquidityInflowsAndOutflows.outflowToken1.times(timesCalled)
      ),
      liquidityOutflowUSD: existingPoolHourlyData.liquidityOutflowUSD.plus(
        liquidityInflowsAndOutflows.outflowUSD.times(timesCalled)
      ),
      liquidityVolumeToken0: existingPoolHourlyData.liquidityVolumeToken0.plus(
        amount0AddedFormatted.abs().times(timesCalled)
      ),
      liquidityVolumeToken1: existingPoolHourlyData.liquidityVolumeToken1.plus(
        amount1AddedFormatted.abs().times(timesCalled)
      ),
      liquidityVolumeUSD: existingPoolHourlyData.liquidityVolumeUSD.plus(
        amount0AddedFormatted
          .abs()
          .times(token0.usdPrice)
          .plus(amount1AddedFormatted.abs().times(token1.usdPrice))
          .times(timesCalled)
      ),
    };

    const actualUpdatedHourlyData = await context.PoolHourlyData.getOrThrow(getPoolHourlyDataId(eventTimestamp, pool));
    assert.deepEqual(actualUpdatedHourlyData, expectedNewPoolHourlyData);
  });

  it(`should modify the existing pool hourly entity data to update the
    pool hourly liquidity data if the current created pool hourly data
    is within a hout from the event timestamp when calling 'setLiquidityIntervalData'
    multiple times removing liquidity`, async () => {
    let eventTimestamp = 1640995200n;
    const token0 = new TokenMock();
    const token1 = new TokenMock();
    const pool = new PoolMock();
    const amount0Removed = 27102710927190n * 10n ** 18n;
    const amount1Removed = 281907219021n * 10n ** 6n;
    const amount0RemovedFormatted = formatFromTokenAmount(amount0Removed, token0);
    const amount1RemovedFormatted = formatFromTokenAmount(amount1Removed, token1);
    const timesCalled = 10;
    const existingPoolHourlyData: PoolHourlyData = {
      ...new PoolHourlyDataMock(),
      id: getPoolHourlyDataId(eventTimestamp, pool),
      hourStartTimestamp: eventTimestamp,
      liquidityInflowToken0: BigDecimal("0"),
      liquidityInflowToken1: BigDecimal("12701"),
      liquidityInflowUSD: BigDecimal("29179201"),
      liquidityNetInflowToken0: BigDecimal("1221"),
      liquidityNetInflowToken1: BigDecimal("9999"),
      liquidityNetInflowUSD: BigDecimal("1271902198"),
      liquidityOutflowToken0: BigDecimal("1"),
      liquidityOutflowToken1: BigDecimal("9911199"),
      liquidityOutflowUSD: BigDecimal("1826189628121"),
      liquidityVolumeToken0: BigDecimal("21895218921"),
      liquidityVolumeToken1: BigDecimal("291862981"),
      liquidityVolumeUSD: BigDecimal("281902810921"),
    };

    context.PoolHourlyData.set(existingPoolHourlyData);

    const liquidityInflowsAndOutflows = getLiquidityInflowAndOutflowFromRawAmounts(
      amount0Removed,
      amount1Removed,
      token0,
      token1
    );

    for (let i = 0; i < timesCalled; i++) {
      await sut.setLiquidityIntervalData({
        amount0AddedOrRemoved: amount0Removed,
        amount1AddedOrRemoved: amount1Removed,

        eventTimestamp: eventTimestamp,
        poolEntity: pool,
        token0: token0,
        token1: token1,
      });
    }

    const expectedNewPoolHourlyData: PoolHourlyData = {
      ...existingPoolHourlyData,
      liquidityInflowToken0: existingPoolHourlyData.liquidityInflowToken0.plus(
        liquidityInflowsAndOutflows.inflowToken0.times(timesCalled)
      ),
      liquidityInflowToken1: existingPoolHourlyData.liquidityInflowToken1.plus(
        liquidityInflowsAndOutflows.inflowToken1.times(timesCalled)
      ),
      liquidityInflowUSD: existingPoolHourlyData.liquidityInflowUSD.plus(
        liquidityInflowsAndOutflows.inflowUSD.times(timesCalled)
      ),
      liquidityNetInflowToken0: existingPoolHourlyData.liquidityNetInflowToken0.plus(
        liquidityInflowsAndOutflows.netInflowToken0.times(timesCalled)
      ),
      liquidityNetInflowToken1: existingPoolHourlyData.liquidityNetInflowToken1.plus(
        liquidityInflowsAndOutflows.netInflowToken1.times(timesCalled)
      ),
      liquidityNetInflowUSD: existingPoolHourlyData.liquidityNetInflowUSD.plus(
        liquidityInflowsAndOutflows.netInflowUSD.times(timesCalled)
      ),
      liquidityOutflowToken0: existingPoolHourlyData.liquidityOutflowToken0.plus(
        liquidityInflowsAndOutflows.outflowToken0.times(timesCalled)
      ),
      liquidityOutflowToken1: existingPoolHourlyData.liquidityOutflowToken1.plus(
        liquidityInflowsAndOutflows.outflowToken1.times(timesCalled)
      ),
      liquidityOutflowUSD: existingPoolHourlyData.liquidityOutflowUSD.plus(
        liquidityInflowsAndOutflows.outflowUSD.times(timesCalled)
      ),
      liquidityVolumeToken0: existingPoolHourlyData.liquidityVolumeToken0.plus(
        amount0RemovedFormatted.abs().times(timesCalled)
      ),
      liquidityVolumeToken1: existingPoolHourlyData.liquidityVolumeToken1.plus(
        amount1RemovedFormatted.abs().times(timesCalled)
      ),
      liquidityVolumeUSD: existingPoolHourlyData.liquidityVolumeUSD.plus(
        amount0RemovedFormatted
          .abs()
          .times(token0.usdPrice)
          .plus(amount1RemovedFormatted.abs().times(token1.usdPrice))
          .times(timesCalled)
      ),
    };

    const actualUpdatedHourlyData = await context.PoolHourlyData.getOrThrow(getPoolHourlyDataId(eventTimestamp, pool));
    assert.deepEqual(actualUpdatedHourlyData, expectedNewPoolHourlyData);
  });

  it(`should create another pool hourly entity data to update the
    pool hourly liquidity data if the current created pool hourly data
    is more than a hour away from the event timestamp when calling
    'setLiquidityIntervalData' multiple times removing liquidity`, async () => {
    let eventTimestamp = 1640995200n;

    const token0 = new TokenMock();
    const token1 = new TokenMock();
    const pool = new PoolMock();
    const amount0Removed = 309262n * 10n ** 18n * -1n;
    const amount1Removed = 1111n * 10n ** 6n * -1n;
    const amount0AddedFormatted = formatFromTokenAmount(amount0Removed, token0);
    const amount1AddedFormatted = formatFromTokenAmount(amount1Removed, token1);
    const timesCalled = 10;
    const existingPoolHourlyData: PoolHourlyData = {
      ...new PoolHourlyDataMock(),
      id: getPoolDailyDataId(eventTimestamp - BigInt(ONE_HOUR_IN_SECONDS) * 2n, pool),
      hourStartTimestamp: eventTimestamp - BigInt(ONE_HOUR_IN_SECONDS) * 2n,
      liquidityInflowToken0: BigDecimal("0"),
      liquidityInflowToken1: BigDecimal("12701"),
      liquidityInflowUSD: BigDecimal("29179201"),
      liquidityNetInflowToken0: BigDecimal("1221"),
      liquidityNetInflowToken1: BigDecimal("9999"),
      liquidityNetInflowUSD: BigDecimal("1271902198"),
      liquidityOutflowToken0: BigDecimal("1"),
      liquidityOutflowToken1: BigDecimal("9911199"),
      liquidityOutflowUSD: BigDecimal("1826189628121"),
      liquidityVolumeToken0: BigDecimal("21895218921"),
      liquidityVolumeToken1: BigDecimal("291862981"),
      liquidityVolumeUSD: BigDecimal("281902810921"),
    };

    context.PoolHourlyData.set(existingPoolHourlyData);

    const liquidityInflowsAndOutflows = getLiquidityInflowAndOutflowFromRawAmounts(
      amount0Removed,
      amount1Removed,
      token0,
      token1
    );

    for (let i = 0; i < timesCalled; i++) {
      eventTimestamp = eventTimestamp + BigInt(ONE_HOUR_IN_SECONDS) * 2n;

      await sut.setLiquidityIntervalData({
        amount0AddedOrRemoved: amount0Removed,
        amount1AddedOrRemoved: amount1Removed,
        eventTimestamp,
        poolEntity: pool,
        token0: token0,
        token1: token1,
      });

      const expectedNewPoolHourlyData: PoolHourlyData = {
        ...defaultPoolHourlyData({
          hourlyDataId: getPoolHourlyDataId(eventTimestamp, pool),
          hourStartTimestamp: eventTimestamp,
          poolId: pool.id,
        }),
        liquidityInflowToken0: liquidityInflowsAndOutflows.inflowToken0,
        liquidityInflowToken1: liquidityInflowsAndOutflows.inflowToken1,
        liquidityInflowUSD: liquidityInflowsAndOutflows.inflowUSD,
        liquidityNetInflowToken0: liquidityInflowsAndOutflows.netInflowToken0,
        liquidityNetInflowToken1: liquidityInflowsAndOutflows.netInflowToken1,
        liquidityNetInflowUSD: liquidityInflowsAndOutflows.netInflowUSD,
        liquidityOutflowToken0: liquidityInflowsAndOutflows.outflowToken0,
        liquidityOutflowToken1: liquidityInflowsAndOutflows.outflowToken1,
        liquidityOutflowUSD: liquidityInflowsAndOutflows.outflowUSD,
        liquidityVolumeToken0: amount0AddedFormatted.abs(),
        liquidityVolumeToken1: amount1AddedFormatted.abs(),
        liquidityVolumeUSD: amount0AddedFormatted
          .abs()
          .times(token0.usdPrice)
          .plus(amount1AddedFormatted.abs().times(token1.usdPrice)),
      };

      const actualUpdatedHourlyData = await context.PoolHourlyData.getOrThrow(
        getPoolHourlyDataId(eventTimestamp, pool)
      );
      assert.deepEqual(actualUpdatedHourlyData, expectedNewPoolHourlyData);
    }
  });

  it(`should sum up the volume data for the hourly data
    based on the amount 1 when calling 'setIntervalSwapData'
    and the amount 1 is positive and amount 0 is negative`, async () => {
    const eventTimestamp = 1640995200n;
    const pool = new PoolMock();
    const token0 = new TokenMock();
    const token1 = new TokenMock();
    const amount0 = -309262n * 10n ** 18n;
    const amount1 = 1111n * 10n ** 6n;

    const currentPoolHourlyData: PoolHourlyData = {
      ...new PoolHourlyDataMock(),
      id: getPoolHourlyDataId(eventTimestamp, pool),
      swapVolumeToken0: BigDecimal("819628912"),
      swapVolumeToken1: BigDecimal("121762"),
      swapVolumeUSD: BigDecimal("12128"),
    };

    context.PoolHourlyData.set(currentPoolHourlyData);

    await sut.setIntervalSwapData(eventTimestamp, context, pool, token0, token1, amount0, amount1);
    const actualUpdatedHourlyData = await context.PoolHourlyData.getOrThrow(getPoolHourlyDataId(eventTimestamp, pool));

    const expectedNewPoolHourlyData: PoolHourlyData = {
      ...actualUpdatedHourlyData,
      swapVolumeToken0: currentPoolHourlyData.swapVolumeToken0,
      swapVolumeToken1: currentPoolHourlyData.swapVolumeToken1.plus(formatFromTokenAmount(amount1, token1)),
      swapVolumeUSD: currentPoolHourlyData.swapVolumeUSD.plus(
        formatFromTokenAmount(amount1, token0).times(token1.usdPrice)
      ),
    };

    assert.deepEqual(actualUpdatedHourlyData, expectedNewPoolHourlyData);
  });

  it(`should sum up the volume data for the daily data
    based on the amount 1 when calling 'setIntervalSwapData'
    and the amount 1 is positive and amount 0 is negative`, async () => {
    const eventTimestamp = 1640995200n;
    const pool = new PoolMock();
    const token0 = new TokenMock();
    const token1 = new TokenMock();
    const amount0 = -29191919222n * 10n ** 18n;
    const amount1 = 12619821n * 10n ** 6n;

    const currentPoolDailyData: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(eventTimestamp, pool),
      swapVolumeToken0: BigDecimal("819628912"),
      swapVolumeToken1: BigDecimal("121762"),
      swapVolumeUSD: BigDecimal("12128"),
    };

    context.PoolDailyData.set(currentPoolDailyData);

    await sut.setIntervalSwapData(eventTimestamp, context, pool, token0, token1, amount0, amount1);
    const actualUpdatedDailyData = await context.PoolDailyData.getOrThrow(getPoolDailyDataId(eventTimestamp, pool));

    const expectedNewPoolDailyData: PoolDailyData = {
      ...actualUpdatedDailyData,
      swapVolumeToken0: currentPoolDailyData.swapVolumeToken0,
      swapVolumeToken1: currentPoolDailyData.swapVolumeToken1.plus(formatFromTokenAmount(amount1, token1)),
      swapVolumeUSD: currentPoolDailyData.swapVolumeUSD.plus(
        formatFromTokenAmount(amount1, token0).times(token1.usdPrice)
      ),
    };

    assert.deepEqual(actualUpdatedDailyData, expectedNewPoolDailyData);
  });

  it(`should sum up the volume data for the daily data
    based on the amount 0 when calling 'setIntervalSwapData'
    and the amount 0 is positive and amount 1 is negative`, async () => {
    const eventTimestamp = 1640995200n;
    const pool = new PoolMock();
    const token0 = new TokenMock();
    const token1 = new TokenMock();
    const amount0 = 1082198621n * 10n ** 6n;
    const amount1 = -7555555n * 10n ** 18n;

    const currentPoolDailyData: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(eventTimestamp, pool),
      swapVolumeToken0: BigDecimal("111"),
      swapVolumeToken1: BigDecimal("91290"),
      swapVolumeUSD: BigDecimal("2101911919"),
    };

    context.PoolDailyData.set(currentPoolDailyData);

    await sut.setIntervalSwapData(eventTimestamp, context, pool, token0, token1, amount0, amount1);
    const actualUpdatedDailyData = await context.PoolDailyData.getOrThrow(getPoolDailyDataId(eventTimestamp, pool));

    const expectedNewPoolDailyData: PoolDailyData = {
      ...actualUpdatedDailyData,
      swapVolumeToken0: currentPoolDailyData.swapVolumeToken0.plus(formatFromTokenAmount(amount0, token0)),
      swapVolumeToken1: currentPoolDailyData.swapVolumeToken1,
      swapVolumeUSD: currentPoolDailyData.swapVolumeUSD.plus(
        formatFromTokenAmount(amount0, token0).times(token0.usdPrice)
      ),
    };

    assert.deepEqual(actualUpdatedDailyData, expectedNewPoolDailyData);
  });

  it(`should sum up the volume data for the hourly data
    based on the amount 0 when calling 'setIntervalSwapData'
    and the amount 0 is positive and amount 1 is negative`, async () => {
    const eventTimestamp = 1640995200n;
    const pool = new PoolMock();
    const token0 = new TokenMock();
    const token1 = new TokenMock();
    const amount0 = 309262n * 10n ** 18n;
    const amount1 = -1111n * 10n ** 6n;

    const currentPoolHourlyData: PoolHourlyData = {
      ...new PoolHourlyDataMock(),
      id: getPoolHourlyDataId(eventTimestamp, pool),
      swapVolumeToken0: BigDecimal("819628912"),
      swapVolumeToken1: BigDecimal("121762"),
      swapVolumeUSD: BigDecimal("12128"),
    };

    context.PoolHourlyData.set(currentPoolHourlyData);

    await sut.setIntervalSwapData(eventTimestamp, context, pool, token0, token1, amount0, amount1);
    const actualUpdatedHourlyData = await context.PoolHourlyData.getOrThrow(getPoolHourlyDataId(eventTimestamp, pool));

    const expectedNewPoolHourlyData: PoolHourlyData = {
      ...actualUpdatedHourlyData,
      swapVolumeToken0: currentPoolHourlyData.swapVolumeToken0.plus(formatFromTokenAmount(amount0, token0)),
      swapVolumeToken1: currentPoolHourlyData.swapVolumeToken1,
      swapVolumeUSD: currentPoolHourlyData.swapVolumeUSD.plus(
        formatFromTokenAmount(amount0, token0).times(token0.usdPrice)
      ),
    };

    assert.deepEqual(actualUpdatedHourlyData, expectedNewPoolHourlyData);
  });

  it(`should calculate the yearly yield from the day fees and tvl then set it
    to the daily data entity when calling 'setIntervalSwapData'`, async () => {
    const eventTimestamp = 1640995200n;
    const pool = new PoolMock();
    const token0 = new TokenMock();
    const token1 = new TokenMock();
    const amount0 = 1082198621n * 10n ** 6n;
    const amount1 = -7555555n * 10n ** 18n;
    const swapFees = getSwapFeesFromRawAmounts(amount0, amount1, pool.currentFeeTier, token0, token1);

    const currentPoolDailyData: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(eventTimestamp, pool),
      feesUSD: BigDecimal("100"),
      totalValueLockedUSD: BigDecimal("1000"),
      yearlyYield: BigDecimal("0"),
    };

    context.PoolDailyData.set(currentPoolDailyData);

    await sut.setIntervalSwapData(eventTimestamp, context, pool, token0, token1, amount0, amount1);
    const actualUpdatedDailyData = await context.PoolDailyData.getOrThrow(getPoolDailyDataId(eventTimestamp, pool));

    const expectedNewPoolDailyData: PoolDailyData = {
      ...actualUpdatedDailyData,
      feesUSD: swapFees.feesUSD.plus(currentPoolDailyData.feesUSD),
      yearlyYield: calculateDayYearlyYield(
        actualUpdatedDailyData.totalValueLockedUSD,
        currentPoolDailyData.feesUSD.plus(swapFees.feesUSD)
      ),
    };

    assert.deepEqual(actualUpdatedDailyData, expectedNewPoolDailyData);
  });

  it(`should calculate the yearly yield from the hour fees and tvl then set it
    to the hourly data entity when calling 'setIntervalSwapData'`, async () => {
    const eventTimestamp = 1640995200n;
    const pool = new PoolMock();
    const token0 = new TokenMock();
    const token1 = new TokenMock();
    const amount0 = 1082198621n * 10n ** 6n;
    const amount1 = -7555555n * 10n ** 18n;
    const swapFees = getSwapFeesFromRawAmounts(amount0, amount1, pool.currentFeeTier, token0, token1);

    const currentPoolHourlyData: PoolHourlyData = {
      ...new PoolHourlyDataMock(),
      id: getPoolHourlyDataId(eventTimestamp, pool),
      feesUSD: BigDecimal("1213"),
      totalValueLockedUSD: BigDecimal("82169821"),
      yearlyYield: BigDecimal("22"),
    };

    context.PoolHourlyData.set(currentPoolHourlyData);

    await sut.setIntervalSwapData(eventTimestamp, context, pool, token0, token1, amount0, amount1);
    const actualUpdatedHourlyData = await context.PoolHourlyData.getOrThrow(getPoolHourlyDataId(eventTimestamp, pool));

    const expectedNewPoolHourlyData: PoolHourlyData = {
      ...actualUpdatedHourlyData,
      feesUSD: swapFees.feesUSD.plus(currentPoolHourlyData.feesUSD),
      yearlyYield: calculateHourYearlyYield(
        actualUpdatedHourlyData.totalValueLockedUSD,
        currentPoolHourlyData.feesUSD.plus(swapFees.feesUSD)
      ),
    };

    assert.deepEqual(actualUpdatedHourlyData, expectedNewPoolHourlyData);
  });

  it(`should set the current pool accumulated yield in the current pool daily data when
      calling 'setIntervalSwapData'`, async () => {
    const eventTimestamp = 1640995200n;
    const token0 = new TokenMock();
    const token1 = new TokenMock();
    const amount0 = 1082198621n * 10n ** 6n;
    const amount1 = -7555555n * 10n ** 18n;
    const poolTotalAccumulatedYield = BigDecimal("5000");

    const pool: Pool = { ...new PoolMock(), totalAccumulatedYield: poolTotalAccumulatedYield };
    const currentPoolDailyData: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(eventTimestamp, pool),
      totalAccumulatedYield: BigDecimal("26108261892618921"),
    };

    context.PoolDailyData.set(currentPoolDailyData);

    await sut.setIntervalSwapData(eventTimestamp, context, pool, token0, token1, amount0, amount1);
    const actualUpdatedDailyData = await context.PoolDailyData.getOrThrow(getPoolDailyDataId(eventTimestamp, pool));

    assert.deepEqual(actualUpdatedDailyData.totalAccumulatedYield, poolTotalAccumulatedYield);
  });

  it(`should set the current pool accumulated yield in the current pool hourly data when
      calling 'setIntervalSwapData'`, async () => {
    const eventTimestamp = 1640995200n;
    const token0 = new TokenMock();
    const token1 = new TokenMock();
    const amount0 = 1082198621n * 10n ** 6n;
    const amount1 = -7555555n * 10n ** 18n;
    const poolTotalAccumulatedYield = BigDecimal("10201211111");

    const pool: Pool = { ...new PoolMock(), totalAccumulatedYield: poolTotalAccumulatedYield };
    const currentPoolHourlyData: PoolHourlyData = {
      ...new PoolHourlyDataMock(),
      id: getPoolHourlyDataId(eventTimestamp, pool),
      totalAccumulatedYield: BigDecimal("11111111"),
    };

    context.PoolHourlyData.set(currentPoolHourlyData);

    await sut.setIntervalSwapData(eventTimestamp, context, pool, token0, token1, amount0, amount1);
    const actualUpdatedHourlyData = await context.PoolHourlyData.getOrThrow(getPoolHourlyDataId(eventTimestamp, pool));

    assert.deepEqual(actualUpdatedHourlyData.totalAccumulatedYield, poolTotalAccumulatedYield);
  });

  it(`should not change the passed pool entity if the passed event timestamp
    is more than 100 days ago from the current date time when calling 'updatePoolAccumulatedYield'`, async () => {
    const todaySecondsTimestamp = BigInt(Math.floor(Date.now() / 1000));
    const eventTimestamp = todaySecondsTimestamp - BigInt(ONE_DAY_IN_SECONDS * 200);
    const currentPool = new PoolMock();

    const resultPool = await sut.updatePoolAccumulatedYield(eventTimestamp, currentPool);

    assert.deepEqual(resultPool, currentPool);
  });

  it(`should not change the passed pool entity if the current daily data and hourly data
    entity hasn't been created in the same event timestamp when calling 'updatePoolAccumulatedYield'`, async () => {
    const todaySecondsTimestamp = BigInt(Math.floor(Date.now() / 1000));
    const eventTimestamp = todaySecondsTimestamp - BigInt(ONE_DAY_IN_SECONDS * 200);
    const currentPool = new PoolMock();

    const resultPool = await sut.updatePoolAccumulatedYield(eventTimestamp, currentPool);

    assert.deepEqual(resultPool, currentPool);
  });

  it(`should update pool 24h accumulated yield with current yield minus 24h-ago yield,
    and set datapoint timestamp to 24h-ago hourly data timestamp when calling
    'updatePoolAccumulatedYield' and the current pool hourly data is a new one`, async () => {
    const todaySecondsTimestamp = BigInt(Math.floor(Date.now() / 1000));
    const eventTimestamp = todaySecondsTimestamp;
    const currentTotalAccumulatedYield = BigDecimal("8000");
    const totalAccumulatedYield24hAgo = BigDecimal("5000");

    const currentPool: Pool = { ...new PoolMock(), totalAccumulatedYield: currentTotalAccumulatedYield };

    const currentPoolDailyData: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(eventTimestamp, currentPool),
      dayStartTimestamp: eventTimestamp - BigInt(ONE_DAY_IN_SECONDS),
    };

    const currentPoolHourlyData: PoolHourlyData = {
      ...new PoolHourlyDataMock(),
      id: getPoolHourlyDataId(eventTimestamp, currentPool),
      totalAccumulatedYield: currentTotalAccumulatedYield,
      hourStartTimestamp: eventTimestamp,
    };

    const poolHourlyData24hAgo: PoolHourlyData = {
      ...new PoolHourlyDataMock(),
      id: getPoolHourlyDataId(subtractHoursFromSecondsTimestamp(eventTimestamp, 24), currentPool),
      totalAccumulatedYield: totalAccumulatedYield24hAgo,
      hourStartTimestamp: subtractHoursFromSecondsTimestamp(eventTimestamp, 24),
    };

    context.PoolHourlyData.set(currentPoolHourlyData);
    context.PoolDailyData.set(currentPoolDailyData);

    sinon.stub(PoolCommons, "getPoolHourlyDataAgo").resolves(poolHourlyData24hAgo);

    const resultPool = await sut.updatePoolAccumulatedYield(eventTimestamp, currentPool);

    const expectedResultPool: Pool = {
      ...resultPool,
      accumulated24hYield: currentTotalAccumulatedYield.minus(totalAccumulatedYield24hAgo),
      dataPointTimestamp24h: poolHourlyData24hAgo.hourStartTimestamp,
    };

    assert.deepEqual(resultPool, expectedResultPool);
  });

  it(`should not update the pool entity when calling 'updatePoolAccumulatedYield' and the current
    pool hourly data is a new one, but the 24h-ago hourly data is not found`, async () => {
    const todaySecondsTimestamp = BigInt(Math.floor(Date.now() / 1000));
    const eventTimestamp = todaySecondsTimestamp;

    const currentPool: Pool = {
      ...new PoolMock(),
    };

    const currentPoolDailyData: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(eventTimestamp, currentPool),
      dayStartTimestamp: eventTimestamp - BigInt(ONE_DAY_IN_SECONDS),
    };

    const currentPoolHourlyData: PoolHourlyData = {
      ...new PoolHourlyDataMock(),
      id: getPoolHourlyDataId(eventTimestamp, currentPool),
      hourStartTimestamp: eventTimestamp,
    };

    context.PoolHourlyData.set(currentPoolHourlyData);
    context.PoolDailyData.set(currentPoolDailyData);

    sinon.stub(PoolCommons, "getPoolHourlyDataAgo").withArgs(24).resolves(null);

    const resultPool = await sut.updatePoolAccumulatedYield(eventTimestamp, currentPool);
    assert.deepEqual(resultPool, currentPool);
  });

  it(`should update pool 7d accumulated yield with current yield minus 7d ago yield,
    and set datapoint timestamp to 7d ago daily data timestamp when calling
    'updatePoolAccumulatedYield' and the current pool daily data is a new one`, async () => {
    const todaySecondsTimestamp = BigInt(Math.floor(Date.now() / 1000));
    const eventTimestamp = todaySecondsTimestamp;
    const currentTotalAccumulatedYield = BigDecimal("10000");
    const totalAccumulatedYield7dAgo = BigDecimal("9000");

    const currentPool: Pool = { ...new PoolMock(), totalAccumulatedYield: currentTotalAccumulatedYield };

    const currentPoolDailyData: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(eventTimestamp, currentPool),
      dayStartTimestamp: eventTimestamp,
      totalAccumulatedYield: currentTotalAccumulatedYield,
    };

    const currentPoolHourlyData: PoolHourlyData = {
      ...new PoolHourlyDataMock(),
      id: getPoolHourlyDataId(eventTimestamp, currentPool),
    };

    const poolDailyData7dAgo: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(subtractDaysFromSecondsTimestamp(eventTimestamp, 7), currentPool),
      totalAccumulatedYield: totalAccumulatedYield7dAgo,
      dayStartTimestamp: subtractDaysFromSecondsTimestamp(eventTimestamp, 7),
    };

    context.PoolHourlyData.set(currentPoolHourlyData);
    context.PoolDailyData.set(currentPoolDailyData);

    sinon.stub(PoolCommons, "getPoolDailyDataAgo").resolves(poolDailyData7dAgo);

    const resultPool = await sut.updatePoolAccumulatedYield(eventTimestamp, currentPool);

    const expectedResultPool: Pool = {
      ...resultPool,
      accumulated7dYield: currentTotalAccumulatedYield.minus(totalAccumulatedYield7dAgo),
      dataPointTimestamp7d: poolDailyData7dAgo.dayStartTimestamp,
    };

    assert.deepEqual(resultPool, expectedResultPool);
  });

  it(`should update pool 30d accumulated yield with current yield minus 30d ago yield,
    and set datapoint timestamp to 30d ago daily data timestamp when calling
    'updatePoolAccumulatedYield' and the current pool daily data is a new one`, async () => {
    const todaySecondsTimestamp = BigInt(Math.floor(Date.now() / 1000));
    const eventTimestamp = todaySecondsTimestamp;
    const currentTotalAccumulatedYield = BigDecimal("10000");
    const totalAccumulatedYield30dAgo = BigDecimal("2000");

    const currentPool: Pool = { ...new PoolMock(), totalAccumulatedYield: currentTotalAccumulatedYield };

    const currentPoolDailyData: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(eventTimestamp, currentPool),
      dayStartTimestamp: eventTimestamp,
      totalAccumulatedYield: currentTotalAccumulatedYield,
    };

    const currentPoolHourlyData: PoolHourlyData = {
      ...new PoolHourlyDataMock(),
      id: getPoolHourlyDataId(eventTimestamp, currentPool),
    };

    const poolDailyData30dAgo: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(subtractDaysFromSecondsTimestamp(eventTimestamp, 30), currentPool),
      totalAccumulatedYield: totalAccumulatedYield30dAgo,
      dayStartTimestamp: subtractDaysFromSecondsTimestamp(eventTimestamp, 30),
    };

    context.PoolHourlyData.set(currentPoolHourlyData);
    context.PoolDailyData.set(currentPoolDailyData);

    sinon.stub(PoolCommons, "getPoolDailyDataAgo").resolves(poolDailyData30dAgo);

    const resultPool = await sut.updatePoolAccumulatedYield(eventTimestamp, currentPool);

    const expectedResultPool: Pool = {
      ...resultPool,
      accumulated30dYield: currentTotalAccumulatedYield.minus(totalAccumulatedYield30dAgo),
      dataPointTimestamp30d: poolDailyData30dAgo.dayStartTimestamp,
    };

    assert.deepEqual(resultPool, expectedResultPool);
  });

  it(`should update pool 90d accumulated yield with current yield minus 90d ago yield,
    and set datapoint timestamp to 90d ago daily data timestamp when calling
    'updatePoolAccumulatedYield' and the current pool daily data is a new one`, async () => {
    const todaySecondsTimestamp = BigInt(Math.floor(Date.now() / 1000));
    const eventTimestamp = todaySecondsTimestamp;
    const currentTotalAccumulatedYield = BigDecimal("10000");
    const totalAccumulatedYield90dAgo = BigDecimal("100");

    const currentPool: Pool = { ...new PoolMock(), totalAccumulatedYield: currentTotalAccumulatedYield };

    const currentPoolDailyData: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(eventTimestamp, currentPool),
      dayStartTimestamp: eventTimestamp,
      totalAccumulatedYield: currentTotalAccumulatedYield,
    };

    const currentPoolHourlyData: PoolHourlyData = {
      ...new PoolHourlyDataMock(),
      id: getPoolHourlyDataId(eventTimestamp, currentPool),
    };

    const poolDailyData90dAgo: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(subtractDaysFromSecondsTimestamp(eventTimestamp, 90), currentPool),
      totalAccumulatedYield: totalAccumulatedYield90dAgo,
      dayStartTimestamp: subtractDaysFromSecondsTimestamp(eventTimestamp, 90),
    };

    context.PoolHourlyData.set(currentPoolHourlyData);
    context.PoolDailyData.set(currentPoolDailyData);

    sinon.stub(PoolCommons, "getPoolDailyDataAgo").resolves(poolDailyData90dAgo);

    const resultPool = await sut.updatePoolAccumulatedYield(eventTimestamp, currentPool);

    const expectedResultPool: Pool = {
      ...resultPool,
      accumulated90dYield: currentTotalAccumulatedYield.minus(totalAccumulatedYield90dAgo),
      dataPointTimestamp90d: poolDailyData90dAgo.dayStartTimestamp,
    };

    assert.deepEqual(resultPool, expectedResultPool);
  });

  it(`should not update the pool entity when calling 'updatePoolAccumulatedYield' and the current
    pool daily data is a new one, but the 7d, 30d and 90d ago datas are not found`, async () => {
    const todaySecondsTimestamp = BigInt(Math.floor(Date.now() / 1000));
    const eventTimestamp = todaySecondsTimestamp;
    const currentTotalAccumulatedYield = BigDecimal("10000");

    const currentPool: Pool = { ...new PoolMock(), totalAccumulatedYield: currentTotalAccumulatedYield };

    const currentPoolDailyData: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(eventTimestamp, currentPool),
      dayStartTimestamp: eventTimestamp,
      totalAccumulatedYield: currentTotalAccumulatedYield,
    };

    const currentPoolHourlyData: PoolHourlyData = {
      ...new PoolHourlyDataMock(),
      id: getPoolHourlyDataId(eventTimestamp, currentPool),
    };

    context.PoolHourlyData.set(currentPoolHourlyData);
    context.PoolDailyData.set(currentPoolDailyData);

    sinon.stub(PoolCommons, "getPoolDailyDataAgo").resolves(null);

    const resultPool = await sut.updatePoolAccumulatedYield(eventTimestamp, currentPool);

    assert.deepEqual(resultPool, currentPool);
  });

  it(`should update pool 7d and 30d accumulated yield, but not 90d when calling 'updatePoolAccumulatedYield'
    if 7d and 30d data are found but 90d data is not found`, async () => {
    const todaySecondsTimestamp = BigInt(Math.floor(Date.now() / 1000));
    const eventTimestamp = todaySecondsTimestamp;
    const currentTotalAccumulatedYield = BigDecimal("10000");
    const totalAccumulatedYield7dAgo = BigDecimal("9000");
    const totalAccumulatedYield30dAgo = BigDecimal("2000");

    const currentPool: Pool = { ...new PoolMock(), totalAccumulatedYield: currentTotalAccumulatedYield };

    const currentPoolDailyData: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(eventTimestamp, currentPool),
      dayStartTimestamp: eventTimestamp,
      totalAccumulatedYield: currentTotalAccumulatedYield,
    };

    const currentPoolHourlyData: PoolHourlyData = {
      ...new PoolHourlyDataMock(),
      id: getPoolHourlyDataId(eventTimestamp, currentPool),
    };

    const poolDailyData7dAgo: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(subtractDaysFromSecondsTimestamp(eventTimestamp, 7), currentPool),
      totalAccumulatedYield: totalAccumulatedYield7dAgo,
      dayStartTimestamp: subtractDaysFromSecondsTimestamp(eventTimestamp, 7),
    };

    const poolDailyData30dAgo: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(subtractDaysFromSecondsTimestamp(eventTimestamp, 30), currentPool),
      totalAccumulatedYield: totalAccumulatedYield30dAgo,
      dayStartTimestamp: subtractDaysFromSecondsTimestamp(eventTimestamp, 30),
    };

    context.PoolHourlyData.set(currentPoolHourlyData);
    context.PoolDailyData.set(currentPoolDailyData);

    const getPoolDailyDataAgoStub = sinon.stub(PoolCommons, "getPoolDailyDataAgo");
    getPoolDailyDataAgoStub.withArgs(7).resolves(poolDailyData7dAgo);
    getPoolDailyDataAgoStub.withArgs(30).resolves(poolDailyData30dAgo);
    getPoolDailyDataAgoStub.withArgs(90).resolves(null);

    const resultPool = await sut.updatePoolAccumulatedYield(eventTimestamp, currentPool);

    const expectedResultPool: Pool = {
      ...currentPool,
      accumulated7dYield: currentTotalAccumulatedYield.minus(totalAccumulatedYield7dAgo),
      dataPointTimestamp7d: poolDailyData7dAgo.dayStartTimestamp,
      accumulated30dYield: currentTotalAccumulatedYield.minus(totalAccumulatedYield30dAgo),
      dataPointTimestamp30d: poolDailyData30dAgo.dayStartTimestamp,
    };

    assert.deepEqual(resultPool, expectedResultPool);
  });

  it(`should update pool 7d accumulated yield, but not 30d and 90d when calling 'updatePoolAccumulatedYield'
    if 7d data is found but 30d and 90d data are not found`, async () => {
    const todaySecondsTimestamp = BigInt(Math.floor(Date.now() / 1000));
    const eventTimestamp = todaySecondsTimestamp;
    const currentTotalAccumulatedYield = BigDecimal("10000");
    const totalAccumulatedYield7dAgo = BigDecimal("9000");

    const currentPool: Pool = { ...new PoolMock(), totalAccumulatedYield: currentTotalAccumulatedYield };

    const currentPoolDailyData: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(eventTimestamp, currentPool),
      dayStartTimestamp: eventTimestamp,
      totalAccumulatedYield: currentTotalAccumulatedYield,
    };

    const currentPoolHourlyData: PoolHourlyData = {
      ...new PoolHourlyDataMock(),
      id: getPoolHourlyDataId(eventTimestamp, currentPool),
    };

    const poolDailyData7dAgo: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(subtractDaysFromSecondsTimestamp(eventTimestamp, 7), currentPool),
      totalAccumulatedYield: totalAccumulatedYield7dAgo,
      dayStartTimestamp: subtractDaysFromSecondsTimestamp(eventTimestamp, 7),
    };

    context.PoolHourlyData.set(currentPoolHourlyData);
    context.PoolDailyData.set(currentPoolDailyData);

    const getPoolDailyDataAgoStub = sinon.stub(PoolCommons, "getPoolDailyDataAgo");
    getPoolDailyDataAgoStub.withArgs(7).resolves(poolDailyData7dAgo);
    getPoolDailyDataAgoStub.withArgs(30).resolves(null);
    getPoolDailyDataAgoStub.withArgs(90).resolves(null);

    const resultPool = await sut.updatePoolAccumulatedYield(eventTimestamp, currentPool);

    const expectedResultPool: Pool = {
      ...currentPool,
      accumulated7dYield: currentTotalAccumulatedYield.minus(totalAccumulatedYield7dAgo),
      dataPointTimestamp7d: poolDailyData7dAgo.dayStartTimestamp,
    };

    assert.deepEqual(resultPool, expectedResultPool);
  });

  it(`should update pool 30d and 90d accumulated yield, but not 7d when calling 'updatePoolAccumulatedYield'
    if 30d and 90d data are found but 7d data is not found`, async () => {
    const todaySecondsTimestamp = BigInt(Math.floor(Date.now() / 1000));
    const eventTimestamp = todaySecondsTimestamp;
    const currentTotalAccumulatedYield = BigDecimal("10000");
    const totalAccumulatedYield30dAgo = BigDecimal("2000");
    const totalAccumulatedYield90dAgo = BigDecimal("100");

    const currentPool: Pool = { ...new PoolMock(), totalAccumulatedYield: currentTotalAccumulatedYield };

    const currentPoolDailyData: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(eventTimestamp, currentPool),
      dayStartTimestamp: eventTimestamp,
      totalAccumulatedYield: currentTotalAccumulatedYield,
    };

    const currentPoolHourlyData: PoolHourlyData = {
      ...new PoolHourlyDataMock(),
      id: getPoolHourlyDataId(eventTimestamp, currentPool),
    };

    const poolDailyData30dAgo: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(subtractDaysFromSecondsTimestamp(eventTimestamp, 30), currentPool),
      totalAccumulatedYield: totalAccumulatedYield30dAgo,
      dayStartTimestamp: subtractDaysFromSecondsTimestamp(eventTimestamp, 30),
    };

    const poolDailyData90dAgo: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(subtractDaysFromSecondsTimestamp(eventTimestamp, 90), currentPool),
      totalAccumulatedYield: totalAccumulatedYield90dAgo,
      dayStartTimestamp: subtractDaysFromSecondsTimestamp(eventTimestamp, 90),
    };

    context.PoolHourlyData.set(currentPoolHourlyData);
    context.PoolDailyData.set(currentPoolDailyData);

    const getPoolDailyDataAgoStub = sinon.stub(PoolCommons, "getPoolDailyDataAgo");
    getPoolDailyDataAgoStub.withArgs(7).resolves(null);
    getPoolDailyDataAgoStub.withArgs(30).resolves(poolDailyData30dAgo);
    getPoolDailyDataAgoStub.withArgs(90).resolves(poolDailyData90dAgo);

    const resultPool = await sut.updatePoolAccumulatedYield(eventTimestamp, currentPool);

    const expectedResultPool: Pool = {
      ...currentPool,
      accumulated30dYield: currentTotalAccumulatedYield.minus(totalAccumulatedYield30dAgo),
      dataPointTimestamp30d: poolDailyData30dAgo.dayStartTimestamp,
      accumulated90dYield: currentTotalAccumulatedYield.minus(totalAccumulatedYield90dAgo),
      dataPointTimestamp90d: poolDailyData90dAgo.dayStartTimestamp,
    };

    assert.deepEqual(resultPool, expectedResultPool);
  });

  it(`should update pool 90d accumulated yield, but not 7d and 30d when calling 'updatePoolAccumulatedYield'
    if 90d data is found but 7d and 30d data are not found`, async () => {
    const todaySecondsTimestamp = BigInt(Math.floor(Date.now() / 1000));
    const eventTimestamp = todaySecondsTimestamp;
    const currentTotalAccumulatedYield = BigDecimal("10000");
    const totalAccumulatedYield90dAgo = BigDecimal("100");

    const currentPool: Pool = { ...new PoolMock(), totalAccumulatedYield: currentTotalAccumulatedYield };

    const currentPoolDailyData: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(eventTimestamp, currentPool),
      dayStartTimestamp: eventTimestamp,
      totalAccumulatedYield: currentTotalAccumulatedYield,
    };

    const currentPoolHourlyData: PoolHourlyData = {
      ...new PoolHourlyDataMock(),
      id: getPoolHourlyDataId(eventTimestamp, currentPool),
    };

    const poolDailyData90dAgo: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(subtractDaysFromSecondsTimestamp(eventTimestamp, 90), currentPool),
      totalAccumulatedYield: totalAccumulatedYield90dAgo,
      dayStartTimestamp: subtractDaysFromSecondsTimestamp(eventTimestamp, 90),
    };

    context.PoolHourlyData.set(currentPoolHourlyData);
    context.PoolDailyData.set(currentPoolDailyData);

    const getPoolDailyDataAgoStub = sinon.stub(PoolCommons, "getPoolDailyDataAgo");
    getPoolDailyDataAgoStub.withArgs(7).resolves(null);
    getPoolDailyDataAgoStub.withArgs(30).resolves(null);
    getPoolDailyDataAgoStub.withArgs(90).resolves(poolDailyData90dAgo);

    const resultPool = await sut.updatePoolAccumulatedYield(eventTimestamp, currentPool);

    const expectedResultPool: Pool = {
      ...currentPool,
      accumulated90dYield: currentTotalAccumulatedYield.minus(totalAccumulatedYield90dAgo),
      dataPointTimestamp90d: poolDailyData90dAgo.dayStartTimestamp,
    };

    assert.deepEqual(resultPool, expectedResultPool);
  });

  it(`should update pool 24h and 7d accumulated yield, but not 30d and 90d when calling 'updatePoolAccumulatedYield'
    if hourly 24h data and daily 7d data are found but 30d and 90d are not found`, async () => {
    const todaySecondsTimestamp = BigInt(Math.floor(Date.now() / 1000));
    const eventTimestamp = todaySecondsTimestamp;
    const currentTotalAccumulatedYield = BigDecimal("10000");
    const totalAccumulatedYield24hAgo = BigDecimal("6000");
    const totalAccumulatedYield7dAgo = BigDecimal("9000");

    const currentPool: Pool = { ...new PoolMock(), totalAccumulatedYield: currentTotalAccumulatedYield };

    const currentPoolDailyData: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(eventTimestamp, currentPool),
      dayStartTimestamp: eventTimestamp,
      totalAccumulatedYield: currentTotalAccumulatedYield,
    };

    const currentPoolHourlyData: PoolHourlyData = {
      ...new PoolHourlyDataMock(),
      id: getPoolHourlyDataId(eventTimestamp, currentPool),
      totalAccumulatedYield: currentTotalAccumulatedYield,
      hourStartTimestamp: eventTimestamp,
    };

    const poolHourlyData24hAgo: PoolHourlyData = {
      ...new PoolHourlyDataMock(),
      id: getPoolHourlyDataId(subtractHoursFromSecondsTimestamp(eventTimestamp, 24), currentPool),
      totalAccumulatedYield: totalAccumulatedYield24hAgo,
      hourStartTimestamp: subtractHoursFromSecondsTimestamp(eventTimestamp, 24),
    };

    const poolDailyData7dAgo: PoolDailyData = {
      ...new PoolDailyDataMock(),
      id: getPoolDailyDataId(subtractDaysFromSecondsTimestamp(eventTimestamp, 7), currentPool),
      totalAccumulatedYield: totalAccumulatedYield7dAgo,
      dayStartTimestamp: subtractDaysFromSecondsTimestamp(eventTimestamp, 7),
    };

    context.PoolHourlyData.set(currentPoolHourlyData);
    context.PoolDailyData.set(currentPoolDailyData);

    sinon.stub(PoolCommons, "getPoolHourlyDataAgo").resolves(poolHourlyData24hAgo);

    const getPoolDailyDataAgoStub = sinon.stub(PoolCommons, "getPoolDailyDataAgo");
    getPoolDailyDataAgoStub.withArgs(7).resolves(poolDailyData7dAgo);
    getPoolDailyDataAgoStub.withArgs(30).resolves(null);
    getPoolDailyDataAgoStub.withArgs(90).resolves(null);

    const resultPool = await sut.updatePoolAccumulatedYield(eventTimestamp, currentPool);

    const expectedResultPool: Pool = {
      ...currentPool,
      accumulated24hYield: currentTotalAccumulatedYield.minus(totalAccumulatedYield24hAgo),
      dataPointTimestamp24h: poolHourlyData24hAgo.hourStartTimestamp,
      accumulated7dYield: currentTotalAccumulatedYield.minus(totalAccumulatedYield7dAgo),
      dataPointTimestamp7d: poolDailyData7dAgo.dayStartTimestamp,
    };

    assert.deepEqual(resultPool, expectedResultPool);
  });
});
