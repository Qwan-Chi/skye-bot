import { z } from "zod";

export const legalEnvSchema = z.object({
  LEGAL_TERMS_URL: z
    .string()
    .url()
    .default("https://shiftlinehq.craft.me/skye-terms"),
  LEGAL_PRIVACY_URL: z
    .string()
    .url()
    .default("https://shiftlinehq.craft.me/skye-privacy"),
  LEGAL_SUPPORT_USERNAME: z.string().default("@overwaven"),
  LEGAL_DEVELOPER_NAME: z.string().default("Sergey Gamuylo"),
  LEGAL_DEVELOPER_EMAIL: z.string().default("serg@skye-bot.com"),
});

export type LegalEnv = z.infer<typeof legalEnvSchema>;