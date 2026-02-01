import type { Block_t, Pool as PoolEntity, SingleChainToken as SingleChainTokenEntity } from "generated";
import type { PoolType_t } from "generated/src/db/Enums.gen";
import type { HandlerContext } from "generated/src/Types";
import { POSITION_MANAGER_ADDRESS } from "../core/address/position-manager-address";
import { Id, InitialPoolEntity, InitialPoolTimeframedStatsEntity } from "../core/entity";
import { IndexerNetwork } from "../core/network";
import { SupportedProtocol } from "../core/protocol";
import { DatabaseService } from "../services/database-service";

export async function processNewPool(params: {
  context: HandlerContext;
  poolAddress: string;
  token0Address: string;
  token1Address: string;
  rawFeeTier: number;
  network: IndexerNetwork;
  protocol: SupportedProtocol;
  isDynamicFee: boolean;
  eventBlock: Block_t;
  poolType: PoolType_t;
}): Promise<{
  poolEntity: PoolEntity;
  token0Entity: SingleChainTokenEntity;
  token1Entity: SingleChainTokenEntity;
}> {
  const protocolMetadata = SupportedProtocol.metadata[params.protocol];

  let [token0Entity, token1Entity] = await DatabaseService.getOrCreatePoolTokenEntities({
    context: params.context,
    network: params.network,
    token0Address: params.token0Address,
    token1Address: params.token1Address,
  });

  const poolEntity: PoolEntity = new InitialPoolEntity({
    chainId: params.network,
    createdAtTimestamp: BigInt(params.eventBlock.timestamp),
    rawInitialFeeTier: params.rawFeeTier,
    isDynamicFee: params.isDynamicFee,
    poolAddress: params.poolAddress,
    poolType: params.poolType,
    positionManager: POSITION_MANAGER_ADDRESS[params.protocol][params.network]!,
    protocol_id: params.protocol,
    token0_id: token0Entity.id,
    token1_id: token1Entity.id,
    createdAtBlock: BigInt(params.eventBlock.number),
  });

  token0Entity = {
    ...token0Entity,
    poolsCount: token0Entity.poolsCount + 1n,
  };

  token1Entity = {
    ...token1Entity,
    poolsCount: token1Entity.poolsCount + 1n,
  };

  params.context.Pool.set(poolEntity);
  params.context.SingleChainToken.set(token0Entity);
  params.context.SingleChainToken.set(token1Entity);

  params.context.Protocol.set({
    id: params.protocol,
    logo: protocolMetadata.logoUrl,
    name: protocolMetadata.name,
    url: protocolMetadata.url,
  });

  Id.buildAllTimeframedStatsIds(params.network, params.poolAddress).forEach((id) => {
    params.context.PoolTimeframedStats.set(
      new InitialPoolTimeframedStatsEntity({
        id: id.id,
        dataPointTimestamp: BigInt(params.eventBlock.timestamp),
        poolId: poolEntity.id,
        timeframe: id.timeframe,
      }),
    );
  });

  return {
    poolEntity,
    token0Entity,
    token1Entity,
  };
}
