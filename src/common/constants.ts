import { BigDecimal } from "generated";
import { hexToBigInt } from "./math";

export const ZERO_BIG_DECIMAL = BigDecimal(0);

export const ZERO_BIG_INT = BigInt(0);

export const MAX_UINT256 = hexToBigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const ONE_BIG_INT = BigInt(1);

export const Q96 = BigInt(2) ** BigInt(96);

export const ONE_HOUR_IN_SECONDS = 3_600;
