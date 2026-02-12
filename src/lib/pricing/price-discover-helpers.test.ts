import { BigDecimal } from "generated";
import { describe, expect, it, vi } from "vitest";
import { ZERO_BIG_DECIMAL } from "../../core/constants";
import { isPoolTokenWhitelisted } from "../../core/pool";
import { PriceDiscover } from "./price-discover";

vi.mock("../../core/pool");

describe("PriceDiscover - Discovery Amount Logic", () => {
  const CHAIN_ID = 1;
  const TOKEN0_ID = "token0";
  const TOKEN1_ID = "token1";

  describe("isTokenDiscoveryEligible", () => {
    const POOL = {
      chainId: CHAIN_ID,
      token0_id: TOKEN0_ID,
      token1_id: TOKEN1_ID,
      totalValueLockedToken0: new BigDecimal("100"),
      totalValueLockedToken1: new BigDecimal("100"),
    } as any;

    it("should return true if token is whitelisted", () => {
      vi.mocked(isPoolTokenWhitelisted).mockReturnValue(true);
      const token = { id: TOKEN0_ID, priceDiscoveryTokenAmount: ZERO_BIG_DECIMAL } as any;
      expect(PriceDiscover.isTokenDiscoveryEligible(token, POOL)).toBe(true);
    });

    it("should return true if priceDiscoveryTokenAmount > tvlInPool", () => {
      vi.mocked(isPoolTokenWhitelisted).mockReturnValue(false);
      const token = { id: TOKEN0_ID, priceDiscoveryTokenAmount: new BigDecimal("150") } as any;
      expect(PriceDiscover.isTokenDiscoveryEligible(token, POOL)).toBe(true);
    });

    it("should return false if neither whitelisted nor sufficiently discovered", () => {
      vi.mocked(isPoolTokenWhitelisted).mockReturnValue(false);
      const token = { id: TOKEN0_ID, priceDiscoveryTokenAmount: new BigDecimal("50") } as any;
      expect(PriceDiscover.isTokenDiscoveryEligible(token, POOL)).toBe(false);
    });
  });

  describe("calculateDiscoveryAmountFromOtherToken", () => {
    it("should multiply amount other by ratio", () => {
      const amountOther = new BigDecimal("10");
      const ratio = new BigDecimal("2.5");
      const result = PriceDiscover.calculateDiscoveryAmountFromOtherToken(amountOther, ratio);
      expect(result.toString()).toBe("25");
    });
  });
});
