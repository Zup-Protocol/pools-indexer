import { ONE_DAY_IN_SECONDS, ONE_HOUR_IN_SECONDS } from "./constants";

export function subtractHoursFromSecondsTimestamp(currentTimestamp: bigint, hours: number): bigint {
  return currentTimestamp - BigInt(ONE_HOUR_IN_SECONDS * hours);
}

export function subtractDaysFromSecondsTimestamp(currentTimestamp: bigint, days: number): bigint {
  return currentTimestamp - BigInt(ONE_DAY_IN_SECONDS * days);
}

export function isSecondsTimestampMoreThanDaysAgo(timestamp: bigint, days: number): boolean {
  return timestamp < subtractDaysFromSecondsTimestamp(BigInt(Math.floor(Date.now() / 1000)), days);
}
