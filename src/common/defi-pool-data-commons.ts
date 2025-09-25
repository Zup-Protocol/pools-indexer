import { createHash } from "crypto";
import { DeFiPoolData as DeFiPoolDataEntity } from "generated";
import { DEFI_POOL_DATA_ID, ONE_HOUR_IN_SECONDS } from "./constants";

export function getDeFiPoolDailyDataId(blockTimestamp: bigint, defiPoolDataEntity: DeFiPoolDataEntity): string {
  const secondsPerDay = 86_400;
  const dayId = (blockTimestamp - defiPoolDataEntity.startedAtTimestamp) / BigInt(secondsPerDay);

  const dayIdAddress = createHash("sha256").update(dayId.toString()).digest("hex");
  const id = `${DEFI_POOL_DATA_ID}-${dayIdAddress}`;

  return id;
}

export function getDeFiPoolHourlyDataId(blockTimestamp: bigint, defiPoolDataEntity: DeFiPoolDataEntity): string {
  const secondsPerHour = ONE_HOUR_IN_SECONDS;
  const hourId = (blockTimestamp - defiPoolDataEntity.startedAtTimestamp) / BigInt(secondsPerHour);

  const hourIdAddress = createHash("sha256").update(hourId.toString()).digest("hex");
  const id = `${DEFI_POOL_DATA_ID}-${hourIdAddress}`;

  return id;
}
