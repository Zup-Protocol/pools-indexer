import type { Block_t, Pool as PoolEntity, Token as TokenEntity } from "generated";
import type { PoolType_t } from "generated/src/db/Enums.gen";
import type { HandlerContext } from "generated/src/Types";
import { POSITION_MANAGER_ADDRESS } from "../core/address/position-manager-address";
import { EntityId, InitialPoolEntity, InitialPoolTimeframedStatsEntity } from "../core/entity";
import { IndexerNetwork } from "../core/network";
import { SupportedProtocol } from "../core/protocol";
import { DatabaseService } from "../services/database-service";

export async function processNewPool(params: {
  context: HandlerContext;
  poolAddress: string;
  token0Address: string;
  token1Address: string;
  feeTier: number;
  network: IndexerNetwork;
  protocol: SupportedProtocol;
  isDynamicFee: boolean;
  eventBlock: Block_t;
  poolType: PoolType_t;
}): Promise<{
  poolEntity: PoolEntity;
  token0Entity: TokenEntity;
  token1Entity: TokenEntity;
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
    initialFeeTier: params.feeTier,
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
    poolsCount: token0Entity.poolsCount + 1,
  };

  token1Entity = {
    ...token1Entity,
    poolsCount: token1Entity.poolsCount + 1,
  };

  params.context.Pool.set(poolEntity);
  params.context.Token.set(token0Entity);
  params.context.Token.set(token1Entity);

  params.context.Protocol.set({
    id: params.protocol,
    logo: protocolMetadata.logoUrl,
    name: protocolMetadata.name,
    url: protocolMetadata.url,
  });

  EntityId.buildAllTimeframedStatsIds(params.network, params.poolAddress).forEach((id) => {
    params.context.PoolTimeframedStats.set(
      new InitialPoolTimeframedStatsEntity({
        id: id.id,
        dataPointTimestamp: BigInt(params.eventBlock.timestamp),
        poolId: poolEntity.id,
        timeframe: id.timeframe,
      })
    );
  });

  return {
    poolEntity,
    token0Entity,
    token1Entity,
  };
}
