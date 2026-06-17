import type { SkyeModule } from "../../core/module.js";
import { LlmClient } from "./client.js";
import { llmEnvSchema } from "./env.js";

declare module "../../core/module.js" {
  interface SkyeServices {
    llm: LlmClient;
  }
}

export const llmModule: SkyeModule = {
  name: "llm",
  envSchema: llmEnvSchema,
  init(ctx) {
    const client = new LlmClient({
      apiKey: String(ctx.config.OPENAI_KEY),
      baseUrl: String(ctx.config.BASE_URL),
      model: String(ctx.config.MODEL),
      maxCompletionTokens: Number(ctx.config.MAX_COMPLETION_TOKENS),
      useChatCompletions: Boolean(ctx.config.USE_CHAT_COMPLETIONS),
      imageApiKey: String(ctx.config.IMAGE_API_KEY ?? ""),
      imageBaseUrl: String(ctx.config.IMAGE_BASE_URL ?? ""),
      imageModel: String(ctx.config.IMAGE_MODEL ?? ""),
    });
    return { service: client };
  },
};
