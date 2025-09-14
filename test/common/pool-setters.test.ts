import assert from "assert";
import { BigDecimal, HandlerContext, Pool, PoolDailyData, Token } from "generated";
import { sqrtPriceX96toPrice } from "../../src/common/cl-pool-converters";
import { ONE_HOUR_IN_SECONDS, ZERO_ADDRESS, ZERO_BIG_DECIMAL } from "../../src/common/constants";
import { IndexerNetwork } from "../../src/common/enums/indexer-network";
import { getPoolDailyDataId, getPoolHourlyDataId } from "../../src/common/pool-commons";
import { PoolSetters } from "../../src/common/pool-setters";
import { formatFromTokenAmount } from "../../src/common/token-commons";
import {
  HandlerContextCustomMock,
  PoolDailyDataMock,
  PoolHourlyDataMock,
  PoolMock,
  TokenMock,
  V4PoolDataMock,
} from "../mocks";

describe("PoolSetters", () => {
  let sut: PoolSetters;
  let context: HandlerContext;
  let network = IndexerNetwork.ETHEREUM;
  let eventTimestamp = BigInt(Math.floor(Date.now() / 1000));

  beforeEach(() => {
    context = HandlerContextCustomMock();
    sut = new PoolSetters(context, network);
  });

  it(`When calling 'setPoolDailyDataTVL' and a PoolDailyData entity
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
    await sut.setPoolDailyDataTVL(BigInt(eventTimestamp + BigInt(ONE_HOUR_IN_SECONDS * 2)), pool);

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

  it(`When calling 'setPoolDailyDataTVL' and a PoolDailyData entity
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
    await sut.setPoolDailyDataTVL(todayEventTimestamp, pool);

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

  it(`When calling 'getPricesForPoolWhitelistedTokens' with a pool of
      token0 stable and token1 non-stable it should return the new token1
      and the token0 price`, async () => {
    let sqrtPriceX96 = BigInt("132117387656662503710917528654277782");
    let stableToken: Token = {
      id: IndexerNetwork.getEntityIdFromAddress(network, IndexerNetwork.stablecoinsAddresses(network)[0]),
      tokenAddress: IndexerNetwork.stablecoinsAddresses(network)[0],
      decimals: 6,
    } as Token;

    let nonStableToken: Token = {
      id: "0xB528edBef013aff855ac3c50b381f253aF13b997",
      tokenAddress: "0xB528edBef013aff855ac3c50b381f253aF13b997",
      decimals: 18,
    } as Token;

    let prices = sut.getPricesForPoolWhitelistedTokens(
      stableToken,
      nonStableToken,
      sqrtPriceX96toPrice(sqrtPriceX96, stableToken, nonStableToken)
    );

    assert.equal(prices.token1UpdatedPrice.toString(), "0.359616170342539443");
    assert.equal(prices.token0UpdatedPrice.toString(), "1");
  });

  it(`When calling 'getPricesForPoolWhitelistedTokens' with a pool of
      token0 non-stable and token1 stable it should correctly return the
      new token0 and token1 price`, () => {
    const token0: Token = {
      id: "toko-0",
      tokenAddress: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      decimals: 8,
    } as Token;

    const token1: Token = {
      id: "toko-1",
      tokenAddress: IndexerNetwork.stablecoinsAddresses(network)[0],
      decimals: 6,
    } as Token;

    const sqrtPriceX96 = BigInt("2422644741646880465971970308851");

    const newPrices = sut.getPricesForPoolWhitelistedTokens(
      token0,
      token1,
      sqrtPriceX96toPrice(sqrtPriceX96, token0, token1)
    );

    assert.equal(newPrices.token0UpdatedPrice.toString(), "93501.87063469");
    assert.equal(newPrices.token1UpdatedPrice.toString(), "1");
  });

  it(`When calling 'getPricesForPoolWhitelistedTokens' with a pool of
      token0 wrapped native and token1 non-wrapped native it should correctly 
      return the token1 price based on the wrapped native price.
      The wrapped native token should remain unchanged`, () => {
    let sqrtPriceX96 = BigInt("2448752485024712708594653706276");
    const network = IndexerNetwork.ETHEREUM;
    let token0Price = BigDecimal("3340.53");
    const token0: Token = {
      id: "toko-0",
      tokenAddress: IndexerNetwork.wrappedNativeAddress(network),
      decimals: 18,
      usdPrice: token0Price,
    } as Token;

    const token1: Token = {
      id: "toko-1",
      tokenAddress: "0xec53bF9167f50cDEB3Ae105f56099aaaB9061F83",
      decimals: 18,
    } as Token;

    let tokenPrices = sut.getPricesForPoolWhitelistedTokens(
      token0,
      token1,
      sqrtPriceX96toPrice(sqrtPriceX96, token0, token1)
    );

    assert.equal(tokenPrices.token1UpdatedPrice.toString(), "3.4969124908482705");
    assert.equal(tokenPrices.token0UpdatedPrice.toString(), token0Price.toString());
  });

  it(`When calling 'getPricesForPoolWhitelistedTokens' with a pool of
      token0 native and token1 non-native it should correctly 
      return the token1 price based on the native price.
      The native token should remain unchanged`, () => {
    let sqrtPriceX96 = BigInt("2448752485024712708594653706276");
    let token0Price = BigDecimal("3340.53");

    const token0: Token = {
      id: "toko-0",
      tokenAddress: ZERO_ADDRESS,
      decimals: 18,
      usdPrice: token0Price,
    } as Token;

    const token1: Token = {
      id: "toko-1",
      tokenAddress: "0xec53bF9167f50cDEB3Ae105f56099aaaB9061F83",
      decimals: 18,
    } as Token;

    let tokenPrices = sut.getPricesForPoolWhitelistedTokens(
      token0,
      token1,
      sqrtPriceX96toPrice(sqrtPriceX96, token0, token1)
    );

    assert.equal(tokenPrices.token1UpdatedPrice.toString(), "3.4969124908482705");
    assert.equal(tokenPrices.token0UpdatedPrice.toString(), token0Price.toString());
  });

  it(`When calling 'getPricesForPoolWhitelistedTokens' with a pool of
      token1 native and token0 non-native it should correctly 
      return the token0 price based on the native price.
      The native token should remain unchanged`, () => {
    let sqrtPriceX96 = BigInt("2448752485024712708594653706276");
    let token1Price = BigDecimal("3340.53");

    const token1: Token = {
      id: "toko-1",
      tokenAddress: ZERO_ADDRESS,
      decimals: 18,
      usdPrice: token1Price,
    } as Token;

    const token0: Token = {
      id: "toko-0",
      tokenAddress: "0xec53bF9167f50cDEB3Ae105f56099aaaB9061F83",
      decimals: 18,
    } as Token;

    let tokenPrices = sut.getPricesForPoolWhitelistedTokens(
      token0,
      token1,
      sqrtPriceX96toPrice(sqrtPriceX96, token0, token1)
    );

    assert.equal(tokenPrices.token1UpdatedPrice.toString(), token1Price.toString());
    assert.equal(tokenPrices.token0UpdatedPrice.toString(), "3191140.95937615219643823");
  });

  it(`When calling 'getPricesForPoolWhitelistedTokens' with a pool of
      token1 wrapped native and token0 non-wrapped native it should correctly
      return the token0 price based on the wrapped native price.
      The token 1 price should remain unchanged`, async () => {
    const sqrtPriceX96 = BigInt("41900264649575989012484016231357126");
    const token1USDPrice = BigDecimal("3340.53");

    const token0: Token = {
      id: "toko-0",
      tokenAddress: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      decimals: 8,
    } as Token;

    const token1: Token = {
      id: "toko-1",
      tokenAddress: IndexerNetwork.wrappedNativeAddress(network),
      decimals: 18,
      usdPrice: token1USDPrice,
    } as Token;

    const newPrices = sut.getPricesForPoolWhitelistedTokens(
      token0,
      token1,
      sqrtPriceX96toPrice(sqrtPriceX96, token0, token1)
    );

    assert.equal(newPrices.token0UpdatedPrice.toString(), "93430.72975104");
    assert.equal(newPrices.token1UpdatedPrice.toString(), token1USDPrice.toString());
  });

  it(`when calling 'getPricesForPoolWhitelistedTokens' with a pool of token0
      stable and token1 stable it should correctly
      retutn the new token0 and token1 price`, async () => {
    const sqrtPriceX96 = BigInt("79308353598837787813110990092");
    const token0: Token = {
      tokenAddress: IndexerNetwork.stablecoinsAddresses(network)[0],
      decimals: 6,
    } as Token;

    const token1: Token = {
      tokenAddress: IndexerNetwork.stablecoinsAddresses(network)[1],
      decimals: 6,
    } as Token;

    let newPrices = sut.getPricesForPoolWhitelistedTokens(
      token0,
      token1,
      sqrtPriceX96toPrice(sqrtPriceX96, token0, token1)
    );

    assert.equal(newPrices.token0UpdatedPrice.toString(), "1.002025");
    assert.equal(newPrices.token1UpdatedPrice.toString(), "0.997979");
  });

  it(`When calling 'getPricesForPoolWhitelistedTokens' with a pool of token0
    that is not mapped, and a token1 that is not mapped, but the token0 has its usd
    price set by some reason, the token1 usd price should be returned based on the token0 price.
    While the token0 usd price should remain unchanged`, () => {
    const token0UsdPrice = BigDecimal("113848.2042535");
    const sqrtPriceX96 = BigInt("79489222257038229567344314831");

    const token0: Token = {
      id: "toko-0",
      tokenAddress: "0x0000000000000000000000000000000000000001",
      decimals: 8,
      usdPrice: token0UsdPrice,
    } as Token;

    const token1: Token = {
      id: "toko-1",
      tokenAddress: "0x0000000000000000000000000000000000000002",
      decimals: 8,
      usdPrice: BigDecimal(0),
    } as Token;

    const newPrices = sut.getPricesForPoolWhitelistedTokens(
      token0,
      token1,
      sqrtPriceX96toPrice(sqrtPriceX96, token0, token1)
    );

    assert.equal(newPrices.token0UpdatedPrice.toString(), token0UsdPrice.toString());
    assert.equal(newPrices.token1UpdatedPrice.toString(), "113101.6281344");
  });

  it(`When calling 'getPricesForPoolWhitelistedTokens' with a pool of token0
    that is not mapped, and a token1 that is not mapped, but the token1 has its usd
    price set by some reason, the token0 usd price should be return
    based on the token1 price. While the token1 usd price should remain unchanged`, () => {
    const token1UsdPrice = BigDecimal("1.002");
    const sqrtPriceX96 = BigInt("58252955171373273082115870408");

    const token0: Token = {
      id: "toko-0",
      tokenAddress: "0x0000000000000000000000000000000000000001",
      decimals: 18,
    } as Token;

    const token1: Token = {
      id: "toko-1",
      tokenAddress: "0x0000000000000000000000000000000000000002",
      decimals: 18,
      usdPrice: token1UsdPrice,
    } as Token;

    const newPrices = sut.getPricesForPoolWhitelistedTokens(
      token0,
      token1,
      sqrtPriceX96toPrice(sqrtPriceX96, token0, token1)
    );

    assert.equal(newPrices.token1UpdatedPrice.toString(), token1UsdPrice.toString());
    assert.equal(newPrices.token0UpdatedPrice.toString(), "0.541682092007859127");
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

    await sut.setHourlyData(eventTimestamp, context, token0, token1, pool, amount0, amount1, swapFee);

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

    await sut.setHourlyData(eventTimestamp, context, token0, token1, pool, amount0, amount1, swapFee);

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

    await sut.setHourlyData(eventTimestamp, context, token0, token1, pool, amount0, amount1, swapFee);

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

    await sut.setHourlyData(eventTimestamp, context, token0, token1, pool, amount0, amount1, swapFee);

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
      await sut.setHourlyData(eventTimestamp, context, token0, token1, pool, amount0, amount1, swapFee);
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
      await sut.setHourlyData(eventTimestamp, context, token0, token1, pool, amount0, amount1, swapFee);
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

      await sut.setHourlyData(eventTimestamp, context, token0, token1, pool, amount0, amount1, swapFee);
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

      await sut.setHourlyData(eventTimestamp, context, token0, token1, pool, amount0, amount1, swapFee);
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

    await sut.setDailyData(eventTimestamp, context, pool, token0, token1, amount0, amount1);
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

      await sut.setDailyData(eventTimestamp, context, pool, token0, token1, amount0, amount1);
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

      await sut.setDailyData(eventTimestamp, context, pool, token0, token1, amount0, amount1);
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

      await sut.setDailyData(eventTimestamp, context, pool, token0, token1, amount0, amount1);
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

      await sut.setDailyData(eventTimestamp, context, pool, token0, token1, amount0, amount1);
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

    await sut.setHourlyData(eventTimestamp, context, token0, token1, pool, amount0, amount1, swapFee);
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

    await sut.setHourlyData(eventTimestamp, context, token0, token1, pool, amount0, amount1, swapFee);
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

    await sut.setDailyData(eventTimestamp, context, pool, token0, token1, amount0, amount1, swapFee);
    const updatedPoolDailyData = await context.PoolDailyData.getOrThrow(getPoolDailyDataId(eventTimestamp, pool));
    const expectedToken1Fees = currentFees.plus(
      formatFromTokenAmount((amount1 * BigInt(swapFee)) / BigInt(1000000n), token1)
    );

    assert.deepEqual(updatedPoolDailyData.feesToken1, expectedToken1Fees);
  });
});
