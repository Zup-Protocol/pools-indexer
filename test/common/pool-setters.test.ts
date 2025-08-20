import assert from "assert";
import { BigDecimal, HandlerContext, Pool, PoolDailyData, Token } from "generated";
import { ONE_HOUR_IN_SECONDS, ZERO_BIG_DECIMAL } from "../../src/common/constants";
import { IndexerNetwork } from "../../src/common/enums/indexer-network";
import { getPoolDailyDataId } from "../../src/common/pool-commons";
import { PoolSetters } from "../../src/common/pool-setters";
import { sqrtPriceX96toPrice } from "../../src/v3-pools/common/v3-v4-pool-converters";
import { HandlerContextCustomMock } from "../mocks";

describe("PoolSetters", () => {
  let sut: PoolSetters;
  let context: HandlerContext;
  let network = IndexerNetwork.ETHEREUM;

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
    await sut.setPoolDailyDataTVL(BigInt(eventTimestamp + BigInt(ONE_HOUR_IN_SECONDS)), pool);

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
});
