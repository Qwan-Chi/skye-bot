import type { SkyeModule } from "../../core/module.js";
import { mcpEnvSchema } from "./env.js";
import { McpService } from "./service.js";

declare module "../../core/module.js" {
  interface SkyeServices {
    mcp: McpService;
  }
}

let serviceRef: McpService | null = null;

export const mcpModule: SkyeModule = {
  name: "mcp",
  envSchema: mcpEnvSchema,
  async init(ctx) {
    const service = new McpService({
      configPath: String(ctx.config.MCP_CONFIG_PATH ?? ""),
      userConfig: ctx.services.get("userConfig"),
    });
    serviceRef = service;
    // Connect global + user MCP servers asynchronously, but await so the
    // telegram start() phase sees a populated tool catalogue.
    await service.init();
    return { service };
  },
  async shutdown() {
    if (serviceRef) await serviceRef.shutdown();
  },
};
