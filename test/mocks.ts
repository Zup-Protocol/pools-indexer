import { HandlerContext } from "generated";
import { PoolDailyData_t } from "generated/src/db/Entities.gen";

let handlerContextSaves: Record<string, any> = {};

export const HandlerContextMock = (): HandlerContext => {
  return {
    PoolDailyData: {
      getOrCreate: async (entity: PoolDailyData_t) => {
        if (!handlerContextSaves[entity.id]) {
          handlerContextSaves[entity.id] = entity;

          return entity;
        }

        return handlerContextSaves[entity.id];
      },
      get: async (id: string) => {
        return handlerContextSaves[id];
      },
      set: (entity: PoolDailyData_t) => {
        handlerContextSaves[entity.id] = entity;
      },
    },
  } as HandlerContext;
};
