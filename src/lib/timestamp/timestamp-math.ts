import { ONE_DAY_IN_SECONDS, ONE_DAY_IN_SECONDS_BI, ONE_HOUR_IN_SECONDS_BI } from "../../core/constants";

export function subtractHoursFromSecondsTimestamp(timestamp: bigint, hours: number): bigint {
  return timestamp - ONE_HOUR_IN_SECONDS_BI * BigInt(hours);
}

export function subtractDaysFromSecondsTimestamp(timestamp: bigint, days: number): bigint {
  return timestamp - ONE_DAY_IN_SECONDS_BI * BigInt(days);
}

export function daysBetweenSecondsTimestamps(timestamp1: bigint, timestamp2: bigint): number {
  const timestampDifference = Number(timestamp1 - timestamp2);

  return Math.abs(timestampDifference) / ONE_DAY_IN_SECONDS;
}
