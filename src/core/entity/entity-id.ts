import type { StatsTimeframe_t } from "generated/src/db/Enums.gen";
import { ONE_DAY_IN_SECONDS_BI, ONE_HOUR_IN_SECONDS_BI } from "../constants";
import { IndexerNetwork } from "../network/indexer-network";

export const EntityId = {
  fromAddress(network: IndexerNetwork, address: string): string {
    return network.toString() + "-" + address.toLowerCase();
  },

  buildHourlyDataId(secondsTimestamp: bigint, network: IndexerNetwork, address: string): string {
    const hourtimestampAtStart = secondsTimestamp - (secondsTimestamp % ONE_HOUR_IN_SECONDS_BI);
    const hourId = hourtimestampAtStart / ONE_HOUR_IN_SECONDS_BI;

    return EntityId.fromAddress(network, `${address}:hour:${hourId}`);
  },

  buildDailyDataId(secondsTimestamp: bigint, network: IndexerNetwork, address: string): string {
    const daytimestampAtStart = secondsTimestamp - (secondsTimestamp % ONE_DAY_IN_SECONDS_BI);
    const dayId = daytimestampAtStart / ONE_DAY_IN_SECONDS_BI;

    return EntityId.fromAddress(network, `${address}:day:${dayId}`);
  },

  build24hStatsId(network: IndexerNetwork, address: string): string {
    return EntityId.fromAddress(network, `${address}:24hStats`);
  },

  build7dStatsId(network: IndexerNetwork, address: string): string {
    return EntityId.fromAddress(network, `${address}:7dStats`);
  },

  build30dStatsId(network: IndexerNetwork, address: string): string {
    return EntityId.fromAddress(network, `${address}:30dStats`);
  },

  build90dStatsId(network: IndexerNetwork, address: string): string {
    return EntityId.fromAddress(network, `${address}:90dStats`);
  },

  buildAllTimeframedStatsIds(
    network: IndexerNetwork,
    address: string,
  ): {
    id: string;
    timeframe: StatsTimeframe_t;
  }[] {
    return [
      {
        id: EntityId.build24hStatsId(network, address),
        timeframe: "DAY",
      },
      {
        id: EntityId.build7dStatsId(network, address),
        timeframe: "WEEK",
      },
      {
        id: EntityId.build30dStatsId(network, address),
        timeframe: "MONTH",
      },
      {
        id: EntityId.build90dStatsId(network, address),
        timeframe: "QUARTER",
      },
    ];
  },
};
