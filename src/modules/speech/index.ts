import type { SkyeModule } from "../../core/module.js";
import { speechEnvSchema } from "./env.js";
import { SpeechService } from "./service.js";

declare module "../../core/module.js" {
  interface SkyeServices {
    speech: SpeechService;
  }
}

export const speechModule: SkyeModule = {
  name: "speech",
  envSchema: speechEnvSchema,
  init(ctx) {
    const service = new SpeechService({
      ycApiKey: String(ctx.config.YC_API_KEY ?? ""),
      ycFolderId: String(ctx.config.YC_FOLDER_ID ?? ""),
      ttsVoice: String(ctx.config.YC_TTS_VOICE ?? "jane"),
      ttsEmotion: String(ctx.config.YC_TTS_EMOTION ?? "neutral"),
      ttsLang: String(ctx.config.YC_TTS_LANG ?? "ru-RU"),
      ttsSpeed: Number(ctx.config.YC_TTS_SPEED ?? 1.0),
    });
    return { service };
  },
};
