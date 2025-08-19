import {
  AlgebraPoolData,
  BigDecimal,
  HandlerContext,
  Pool,
  Protocol,
  Token,
  V2PoolData,
  V3PoolData,
  V4PoolData,
} from "generated";
import {
  Pool_t,
  PoolDailyData_t,
  Token_t,
  V2PoolData_t,
  V3PoolData_t,
  V4PoolData_t,
} from "generated/src/db/Entities.gen";
import { PoolType_t } from "generated/src/db/Enums.gen";

let lastMockReturnEffectCall: any;

export function mockReturnEffectCall(value: any) {
  lastMockReturnEffectCall = value;
}

export const HandlerContextCustomMock = (): HandlerContext => {
  let tokenSaves: Record<string, any> = {};
  let poolSaves: Record<string, any> = {};
  let v4PoolDataSaves: Record<string, any> = {};
  let v3PoolDataSaves: Record<string, any> = {};
  let v2PoolDataSaves: Record<string, any> = {};
  let poolDailyDataSaves: Record<string, any> = {};
  let poolhourlyDataSaves: Record<string, any> = {};
  let protocolSaves: Record<string, any> = {};

  function getOrCreateEntity<T>(entity: T, datasource: Record<string, any>): T {
    if (!datasource[(entity as any).id]) {
      datasource[(entity as any).id] = entity;

      return entity;
    }

    return datasource[(entity as any).id];
  }

  function getOrThrow(id: string, datasource: Record<string, any>) {
    if (!datasource[id]) {
      throw new Error("Entity not found");
    }

    return datasource[id];
  }

  return {
    effect: (effect: any, args: any[]) => {
      return lastMockReturnEffectCall;
    },
    V3PoolData: {
      getOrCreate: async (entity: V3PoolData_t) => getOrCreateEntity(entity, v3PoolDataSaves),
      get: async (id: string) => v3PoolDataSaves[id],
      set: (entity: V3PoolData) => {
        v3PoolDataSaves[entity.id] = entity;
      },
    },
    V2PoolData: {
      getOrCreate: async (entity: V2PoolData_t) => getOrCreateEntity(entity, v2PoolDataSaves),
      get: async (id: string) => v2PoolDataSaves[id],
      set: (entity: V2PoolData) => {
        v2PoolDataSaves[entity.id] = entity;
      },
    },
    V4PoolData: {
      getOrThrow: (id: string) => getOrThrow(id, v4PoolDataSaves),
      getOrCreate: async (entity: V4PoolData_t) => getOrCreateEntity(entity, v4PoolDataSaves),
      get: async (id: string) => v4PoolDataSaves[id],
      set: (entity: V4PoolData) => {
        v4PoolDataSaves[entity.id] = entity;
      },
    },
    Pool: {
      getOrThrow: (id: string) => getOrThrow(id, poolSaves),
      getOrCreate: async (entity: Pool_t) => getOrCreateEntity(entity, poolSaves),
      get: async (id: string) => poolSaves[id],
      set: (entity: Pool) => {
        poolSaves[entity.id] = entity;
      },
    },
    Token: {
      getOrCreate: async (entity: Token_t) => getOrCreateEntity(entity, tokenSaves),
      get: async (id: string) => tokenSaves[id],
      set: (entity: Token_t) => {
        tokenSaves[entity.id] = entity;
      },
    },
    PoolDailyData: {
      getOrCreate: async (entity: PoolDailyData_t) => getOrCreateEntity(entity, poolDailyDataSaves),
      get: async (id: string) => poolDailyDataSaves[id],
      set: (entity: PoolDailyData_t) => {
        poolDailyDataSaves[entity.id] = entity;
      },
    },
  } as HandlerContext;
};

export class ProtocolMock implements Protocol {
  id: string = "mock-protocol-id";
  logo: string = "https://example.com/logo.png";
  name: string = "Mock Protocol";
  url: string = "https://example.com";
}

export class TokenMock implements Token {
  decimals: number = 18;
  id: string = "mock-token-id";
  name: string = "Mock Token";
  symbol: string = "MTK";
  tokenAddress: string = "0x0000000000000000000000000000000000000001";
  totalTokenPooledAmount: BigDecimal = BigDecimal("11267186.3223");
  totalValuePooledUsd: BigDecimal = BigDecimal("32323.3223");
  usdPrice: BigDecimal = BigDecimal("1");
}

export class AlgebraPoolDataMock implements AlgebraPoolData {
  deployer: string = "0x0000000000000000000000000000000000000001";
  id: string = "mock-algebra-pool-data-id";
}

export class V2PoolDataMock implements V2PoolData {
  id: string = "mock-v2-pool-data-id";
}

export class V3PoolDataMock implements V3PoolData {
  id: string = "mock-v3-pool-data-id";
  sqrtPriceX96: bigint = BigInt("4024415889252221097743020");
  tick: bigint = BigInt("-197765");
  tickSpacing: number = 100;
}

export class V4PoolDataMock implements V4PoolData {
  poolManager: string = "0x0000000000000000000000000000000000000001";
  stateView: string | undefined = "0x0000000000000000000000000000000000000001";
  id: string = "mock-v4-pool-data-id";
  sqrtPriceX96: bigint = BigInt("4024415889252221097743020");
  tick: bigint = BigInt("-197765");
  tickSpacing: number = 100;
  hooks: string = "0x0000000000000000000000000000000000000001";
  permit2: string = "0x0000000000000000000000000000000000000001";
}

export class PoolMock implements Pool {
  algebraPoolData_id: string | undefined = new AlgebraPoolDataMock().id;
  chainId: number = 1;
  createdAtTimestamp: bigint = BigInt((Date.now() / 1000).toFixed(0));
  currentFeeTier: number = 500;
  initialFeeTier: number = 500;
  id: string = "mock-pool-id";
  isStablePool: boolean = false;
  poolAddress: string = "0x0000000000000000000000000000000000000001";
  poolType: PoolType_t = "V3";
  positionManager: string = "0x0000000000000000000000000000000000000001";
  protocol_id: string = new ProtocolMock().id;
  token0_id: string = new TokenMock().id;
  token1_id: string = new TokenMock().id;
  totalValueLockedToken0: BigDecimal = BigDecimal("11267186.3223");
  totalValueLockedToken1: BigDecimal = BigDecimal("32323.3223");
  totalValueLockedUSD: BigDecimal = BigDecimal("1927182781.3223");
  v2PoolData_id: string | undefined = new V2PoolDataMock().id;
  v3PoolData_id: string | undefined = new V3PoolDataMock().id;
  v4PoolData_id: string | undefined = new V4PoolDataMock().id;
}
