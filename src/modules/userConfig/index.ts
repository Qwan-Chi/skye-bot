import type { SkyeModule } from "../../core/module.js";
import { migrations } from "./migrations.js";
import { buildRoutes } from "./routes.js";
import { userConfigService, type UserConfigService } from "./service.js";

declare module "../../core/module.js" {
  interface SkyeServices {
    userConfig: UserConfigService;
  }
}

export const userConfigModule: SkyeModule = {
  name: "userConfig",
  migrations,
  init(ctx) {
    // Service registered first so buildRoutes can resolve it via ctx.services.
    ctx.services.set("userConfig", userConfigService);
    return { service: userConfigService, panelRoutes: buildRoutes(ctx) };
  },
};
