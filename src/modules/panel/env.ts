import { z } from "zod";

export const panelEnvSchema = z.object({
  WEBAPP_URL: z.string().url().default("http://localhost:3001"),
  WEBAPP_PORT: z.coerce.number().positive().default(3001),
});
