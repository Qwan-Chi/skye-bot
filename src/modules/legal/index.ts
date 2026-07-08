import type { SkyeModule } from "../../core/module.js";
import { legalEnvSchema, type LegalEnv } from "./env.js";
import { legalService, type LegalService } from "./service.js";
import { buildLegalCommands, buildLegalHandlers } from "./tele.js";

declare module "../../core/module.js" {
  interface SkyeServices {
    legal: LegalService;
  }
}

export const legalModule: SkyeModule = {
  name: "legal",
  envSchema: legalEnvSchema,
  init(ctx) {
    const cfg = ctx.config as LegalEnv;
    ctx.services.set("legal", legalService);

    const { commands, handlers } = {
      commands: buildLegalCommands({ legal: legalService, cfg }),
      handlers: buildLegalHandlers({ legal: legalService, cfg }),
    };

    return {
      service: legalService,
      commands,
      telegramHandlers: handlers,
    };
  },
};