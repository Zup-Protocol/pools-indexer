import { HandlerContext } from "generated";
import { PoolDailyData_t, Token_t } from "generated/src/db/Entities.gen";

export const HandlerContextCustomMock = (): HandlerContext => {
  let handlerContextSaves: Record<string, any> = {};

  function getOrCreateEntity<T>(entity: T): T {
    if (!handlerContextSaves[(entity as any).id]) {
      handlerContextSaves[(entity as any).id] = entity;

      return entity;
    }

    return handlerContextSaves[(entity as any).id];
  }

  return {
    Token: {
      getOrCreate: getOrCreateEntity,
      get: async (id: string) => handlerContextSaves[id],
      set: (entity: Token_t) => {
        handlerContextSaves[entity.id] = entity;
      },
    },
    PoolDailyData: {
      getOrCreate: getOrCreateEntity,
      get: async (id: string) => handlerContextSaves[id],
      set: (entity: PoolDailyData_t) => {
        handlerContextSaves[entity.id] = entity;
      },
    },
  } as HandlerContext;
};
