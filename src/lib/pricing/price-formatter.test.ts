import { BigDecimal } from "generated";
import { describe, expect, it } from "vitest";
import { PriceFormatter } from "./price-formatter";

describe("PriceFormatter", () => {
  describe("formatUsdValue", () => {
    it("should format a USD value with more than 4 decimals to exactly 4", () => {
      const value = new BigDecimal("123.456789");
      const formatted = PriceFormatter.formatUsdValue(value);
      expect(formatted.toString()).toBe("123.4568"); // Rounds by default in most BigDecimal impls
    });

    it("should not change a USD value with fewer than 4 decimals", () => {
      const value = new BigDecimal("123.45");
      const formatted = PriceFormatter.formatUsdValue(value);
      expect(formatted.toString()).toBe("123.45");
    });

    it("should handle integer values correctly", () => {
      const value = new BigDecimal("123");
      const formatted = PriceFormatter.formatUsdValue(value);
      expect(formatted.toString()).toBe("123");
    });
  });

  describe("formatUsdPrice", () => {
    it("should format a price with more than 30 decimals to exactly 30", () => {
      const longDecimal = "0." + "1".repeat(40);
      const expected = "0." + "1".repeat(30);
      const value = new BigDecimal(longDecimal);
      const formatted = PriceFormatter.formatUsdPrice(value);
      expect(formatted.toString()).toBe(expected);
    });

    it("should handle scientific notation for small prices", () => {
      const value = new BigDecimal("0.0000000000123");
      const formatted = PriceFormatter.formatUsdPrice(value);
      // BigNumber.js uses scientific notation for numbers with > 6 leading zeros in toString() by default
      expect(formatted.toString()).toBe("1.23e-11");
    });

    it("should handle very small prices correctly by rounding to zero if below 30 decimals", () => {
      const value = new BigDecimal("0.00000000000000000000000000000012345");
      const formatted = PriceFormatter.formatUsdPrice(value);
      // It rounds to 30 decimals. Since 31st digit is 1, it rounds down to 0.
      expect(formatted.toString()).toBe("0");
    });
  });
});
