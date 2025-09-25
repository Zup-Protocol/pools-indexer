import assert from "assert";
import { getRawFeeFromTokenAmount } from "../../../../../../src/common/pool-commons";
import { formatFromTokenAmount } from "../../../../../../src/common/token-commons";
import { getPoolDeductingAlgebraNonLPFees } from "../../../../../../src/v3-pools/mappings/pool/algebra/common/algebra-pool-common";
import { ALGEBRA_COMMUNITY_FEE_DENOMINATOR } from "../../../../../../src/v3-pools/mappings/pool/algebra/common/constants";
import { PoolMock, TokenMock } from "../../../../../mocks";

describe("AlgebraPoolCommon", () => {
  beforeEach(() => {});

  it(`should deduct the community fee plus the plugin fee from the token1 TVL,
    when the token 1 amount is positive, and token0 amount negative`, () => {
    let amount0SwapAmount = BigInt(-100);
    let amount1SwapAmount = BigInt(12000000);
    let communityFee = 39;
    let pluginFee = 321;
    let swapFee = 3000;
    let currentPoolEntity = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    currentPoolEntity = {
      ...currentPoolEntity,
      currentFeeTier: swapFee,
    };

    let returnedPool = getPoolDeductingAlgebraNonLPFees({
      amount0SwapAmount,
      amount1SwapAmount,
      communityFee,
      currentPoolEntity,
      pluginFee,
      token0,
      token1,
    });

    const swapFeeForAmount1 = getRawFeeFromTokenAmount(amount1SwapAmount, swapFee);
    const pluginFeeForAmount1 = getRawFeeFromTokenAmount(amount1SwapAmount, pluginFee);
    const communityFeeForAmount1 = (swapFeeForAmount1 * BigInt(communityFee)) / ALGEBRA_COMMUNITY_FEE_DENOMINATOR;
    const expectedDeductedValue = formatFromTokenAmount(pluginFeeForAmount1 + communityFeeForAmount1, token1);

    assert.deepEqual(
      returnedPool.totalValueLockedToken1,
      currentPoolEntity.totalValueLockedToken1.minus(expectedDeductedValue)
    );
  });

  it(`should deduct the community fee plus the plugin fee from the token1 TVL,
    when the token 1 amount is positive, and token0 amount negative. If 
    the swap override is set, it should consider it on the math for the
    deduction`, () => {
    let amount0SwapAmount = BigInt(-100);
    let amount1SwapAmount = BigInt(12000000);
    let communityFee = 39;
    let pluginFee = 321;
    let poolSwapFee = 3000;
    let overrideSwapFee = 9000;
    let currentPoolEntity = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    currentPoolEntity = {
      ...currentPoolEntity,
      currentFeeTier: poolSwapFee,
    };

    let returnedPool = getPoolDeductingAlgebraNonLPFees({
      amount0SwapAmount,
      amount1SwapAmount,
      communityFee,
      currentPoolEntity,
      pluginFee,
      token0,
      token1,
      overrideSwapFee,
    });

    const swapFeeForAmount1 = getRawFeeFromTokenAmount(amount1SwapAmount, overrideSwapFee);
    const pluginFeeForAmount1 = getRawFeeFromTokenAmount(amount1SwapAmount, pluginFee);
    const communityFeeForAmount1 = (swapFeeForAmount1 * BigInt(communityFee)) / ALGEBRA_COMMUNITY_FEE_DENOMINATOR;
    const expectedDeductedValue = formatFromTokenAmount(pluginFeeForAmount1 + communityFeeForAmount1, token1);

    assert.deepEqual(
      returnedPool.totalValueLockedToken1,
      currentPoolEntity.totalValueLockedToken1.minus(expectedDeductedValue)
    );
  });

  it(`should deduct the community fee plus the plugin fee from the token0 TVL,
    when the token 0 amount is positive, and token1 amount negative`, () => {
    let amount0SwapAmount = BigInt(100);
    let amount1SwapAmount = BigInt(-12000000);
    let communityFee = 39;
    let pluginFee = 321;
    let swapFee = 3000;
    let currentPoolEntity = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    currentPoolEntity = {
      ...currentPoolEntity,
      currentFeeTier: swapFee,
    };

    let returnedPool = getPoolDeductingAlgebraNonLPFees({
      amount0SwapAmount,
      amount1SwapAmount,
      communityFee,
      currentPoolEntity,
      pluginFee,
      token0,
      token1,
    });

    const swapFeeForAmount0 = getRawFeeFromTokenAmount(amount0SwapAmount, swapFee);
    const pluginFeeForAmount0 = getRawFeeFromTokenAmount(amount0SwapAmount, pluginFee);
    const communityFeeForAmount0 = (swapFeeForAmount0 * BigInt(communityFee)) / ALGEBRA_COMMUNITY_FEE_DENOMINATOR;
    const expectedDeductedValue = formatFromTokenAmount(pluginFeeForAmount0 + communityFeeForAmount0, token0);

    assert.deepEqual(
      returnedPool.totalValueLockedToken0,
      currentPoolEntity.totalValueLockedToken0.minus(expectedDeductedValue)
    );
  });

  it(`should deduct the community fee plus the plugin fee from the token0 TVL,
    when the token 0 amount is positive, and token1 amount negative. If 
    the swap override is set, it should consider it on the math for the
    deduction`, () => {
    let amount0SwapAmount = BigInt(12000000);
    let amount1SwapAmount = BigInt(-100);
    let communityFee = 39;
    let pluginFee = 321;
    let poolSwapFee = 3000;
    let overrideSwapFee = 9000;
    let currentPoolEntity = new PoolMock();
    let token0 = new TokenMock();
    let token1 = new TokenMock();

    currentPoolEntity = {
      ...currentPoolEntity,
      currentFeeTier: poolSwapFee,
    };

    let returnedPool = getPoolDeductingAlgebraNonLPFees({
      amount0SwapAmount,
      amount1SwapAmount,
      communityFee,
      currentPoolEntity,
      pluginFee,
      token0,
      token1,
      overrideSwapFee,
    });

    const swapFeeForAmount0 = getRawFeeFromTokenAmount(amount0SwapAmount, overrideSwapFee);
    const pluginFeeForAmount0 = getRawFeeFromTokenAmount(amount0SwapAmount, pluginFee);
    const communityFeeForAmount0 = (swapFeeForAmount0 * BigInt(communityFee)) / ALGEBRA_COMMUNITY_FEE_DENOMINATOR;
    const expectedDeductedValue = formatFromTokenAmount(pluginFeeForAmount0 + communityFeeForAmount0, token0);

    assert.deepEqual(
      returnedPool.totalValueLockedToken0,
      currentPoolEntity.totalValueLockedToken0.minus(expectedDeductedValue)
    );
  });
});
