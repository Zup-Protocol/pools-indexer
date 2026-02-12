import { BigDecimal } from "generated";

export const PriceFormatter = {
  formatUsdValue: (value: BigDecimal): BigDecimal => {
    return value.decimalPlaces(4);
  },
  formatUsdPrice: (value: BigDecimal): BigDecimal => {
    return value.decimalPlaces(30);
  },
};
