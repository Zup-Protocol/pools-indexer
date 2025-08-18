import assert from "assert";
import { BigDecimal, HandlerContext, Pool, PoolDailyData, Token } from "generated";
import { ONE_HOUR_IN_SECONDS, ZERO_BIG_DECIMAL } from "../../src/common/constants";
import { IndexerNetwork } from "../../src/common/enums/indexer-network";
import { getPoolDailyDataId } from "../../src/common/pool-commons";
import { PoolSetters } from "../../src/common/pool-setters";
import { sqrtPriceX96toPrice } from "../../src/v3-pools/common/v3-v4-pool-converters";
import { HandlerContextMock } from "../mocks";

describe("PoolSetters", () => {
  let sut: PoolSetters;
  let context: HandlerContext;
  let network = IndexerNetwork.ETHEREUM;

  beforeEach(() => {
    context = HandlerContextMock();
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

  //   it(`When calling 'setPricesForV3PoolWhitelistedTokens' with a pool of
  //     token0 wrapped native and token1 non-wrapped native it should correctly set the
  //     token1 price based on the wrapped native price`, () => {
  //     let sqrtPriceX96 = BigInt.fromString("2448752485024712708594653706276");

  //     let wrappedNative = new TokenMock(Address.fromString(CurrentNetwork.wrappedNativeAddress));
  //     wrappedNative.decimals = 18;
  //     wrappedNative.usdPrice = BigDecimal.fromString("3340.53");
  //     wrappedNative.save();

  //     let nonWrappedNative = new TokenMock(Address.fromString("0xec53bF9167f50cDEB3Ae105f56099aaaB9061F83"));
  //     nonWrappedNative.decimals = 18;
  //     nonWrappedNative.save();

  //     let pool = new PoolMock();

  //     pool.token0 = wrappedNative.id;
  //     pool.token1 = nonWrappedNative.id;
  //     pool.save();

  //     new PoolSettersMock().setPricesForPoolWhitelistedTokens(
  //       pool,
  //       wrappedNative,
  //       nonWrappedNative,
  //       sqrtPriceX96toPrice(sqrtPriceX96, wrappedNative, nonWrappedNative)
  //     );

  //     assert.fieldEquals("Token", nonWrappedNative.id.toHexString(), "usdPrice", "3.496912490848270512206851599806777");
  //   });

  //   it(`When calling 'setPricesForV3PoolWhitelistedTokens' with a pool of
  //     token1 wrapped native and token0 non-wrapped native it should correctly set the
  //     token0 price based on the wrapped native price`, () => {
  //     let sqrtPriceX96 = BigInt.fromString("41900264649575989012484016231357126");

  //     let wrappedNative = new TokenMock(Address.fromString(CurrentNetwork.wrappedNativeAddress));
  //     wrappedNative.decimals = 18;
  //     wrappedNative.usdPrice = BigDecimal.fromString("3340.53");
  //     wrappedNative.save();

  //     let nonWrappedNative = new TokenMock(Address.fromString("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"));
  //     nonWrappedNative.decimals = 8;
  //     nonWrappedNative.save();

  //     let pool = new PoolMock();

  //     pool.token0 = nonWrappedNative.id;
  //     pool.token1 = wrappedNative.id;
  //     pool.save();

  //     new PoolSettersMock().setPricesForPoolWhitelistedTokens(
  //       pool,
  //       nonWrappedNative,
  //       wrappedNative,
  //       sqrtPriceX96toPrice(sqrtPriceX96, nonWrappedNative, wrappedNative)
  //     );

  //     assert.fieldEquals("Token", nonWrappedNative.id.toHexString(), "usdPrice", "93430.72975104423786494759603164283");
  //   });

  //   it(`when calling 'setPricesForV3PoolWhitelistedTokens' with a pool of token0
  //     stable and token1 wrapped native it should correctly set the token0 and token1 price`, () => {
  //     let sqrtPriceX96 = BigInt.fromString("79308353598837787813110990092");
  //     let token0 = new TokenMock(Address.fromString(CurrentNetwork.stablecoinsAddresses[0]));
  //     token0.decimals = 6;
  //     token0.save();

  //     let token1 = new TokenMock(Address.fromString(CurrentNetwork.stablecoinsAddresses[1]));
  //     token1.decimals = 6;
  //     token1.save();

  //     let pool = new PoolMock();

  //     pool.token0 = token0.id;
  //     pool.token1 = token1.id;
  //     pool.save();

  //     new PoolSettersMock().setPricesForPoolWhitelistedTokens(
  //       pool,
  //       token0,
  //       token1,
  //       sqrtPriceX96toPrice(sqrtPriceX96, token0, token1)
  //     );

  //     assert.fieldEquals("Token", token0.id.toHexString(), "usdPrice", "1.00202533202543717719096334135079");
  //     assert.fieldEquals("Token", token1.id.toHexString(), "usdPrice", "0.9979787616533174007690719676506302");
  //   });

  //   it(`When calling 'setPricesForV3PoolWhitelistedTokens' with a pool of token0
  //   that is not mapped, and a token1 that is not mapped, but the token0 has its usd
  //   price set by some reason, the token1 usd price should be set based on the token0 price.
  //   While the token0 usd price should remain unchanged`, () => {
  //     let token0UsdPrice = BigDecimal.fromString("103017.8940225187751271430272797843");
  //     let sqrtPriceX96 = BigInt.fromString("79141063853680822898128351609");
  //     let token0 = new TokenMock(Address.fromString("0x0000000000000000000000000000000000000001"));
  //     token0.decimals = 8;
  //     token0.usdPrice = token0UsdPrice;
  //     token0.save();

  //     let token1 = new TokenMock(Address.fromString("0x0000000000000000000000000000000000000002"));
  //     token1.decimals = 8;
  //     token1.save();

  //     let pool = new PoolMock();

  //     pool.token0 = token0.id;
  //     pool.token1 = token1.id;
  //     pool.save();

  //     new PoolSettersMock().setPricesForPoolWhitelistedTokens(
  //       pool,
  //       token0,
  //       token1,
  //       sqrtPriceX96toPrice(sqrtPriceX96, token0, token1)
  //     );

  //     assert.fieldEquals("Token", token0.id.toHexString(), "usdPrice", token0UsdPrice.toString());
  //     assert.fieldEquals("Token", token1.id.toHexString(), "usdPrice", "103244.7713883273314787832311543079");
  //   });

  //   it(`When calling 'setPricesForV3PoolWhitelistedTokens' with a pool of token0
  //   that is not mapped, and a token1 that is not mapped, but the token1 has its usd
  //   price set by some reason, the token0 usd price should be set based on the token1 price.
  //   While the token1 usd price should remain unchanged`, () => {
  //     let token1UsdPrice = BigDecimal.fromString("1.002");
  //     let sqrtPriceX96 = BigInt.fromString("58252955171373273082115870408");
  //     let token0 = new TokenMock(Address.fromString("0x0000000000000000000000000000000000000001"));
  //     token0.decimals = 18;

  //     token0.save();

  //     let token1 = new TokenMock(Address.fromString("0x0000000000000000000000000000000000000002"));
  //     token1.decimals = 18;
  //     token1.usdPrice = token1UsdPrice;
  //     token1.save();

  //     let pool = new PoolMock();

  //     pool.token0 = token0.id;
  //     pool.token1 = token1.id;
  //     pool.save();

  //     new PoolSettersMock().setPricesForPoolWhitelistedTokens(
  //       pool,
  //       token0,
  //       token1,
  //       sqrtPriceX96toPrice(sqrtPriceX96, token0, token1)
  //     );

  //     assert.fieldEquals("Token", token0.id.toHexString(), "usdPrice", "0.5416820920078591274742823691740816");
  //     assert.fieldEquals("Token", token1.id.toHexString(), "usdPrice", token1UsdPrice.toString());
  //   });
});
