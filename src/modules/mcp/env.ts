import { z } from "zod";

export const mcpEnvSchema = z.object({
  MCP_CONFIG_PATH: z.string().default(""),
});
