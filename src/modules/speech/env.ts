import { z } from "zod";

export const speechEnvSchema = z.object({
  // Yandex Cloud SpeechKit — used for both STT and TTS.
  YC_API_KEY: z.string().default(""),
  YC_FOLDER_ID: z.string().default(""),
  // TTS voice and emotion. Defaults pick a neutral Russian female voice.
  // Voice catalogue: https://aistudio.yandex.ru/docs/ru/speechkit/tts/voices.html
  YC_TTS_VOICE: z.string().default("jane"),
  YC_TTS_EMOTION: z.string().default("neutral"),
  YC_TTS_LANG: z.string().default("ru-RU"),
  YC_TTS_SPEED: z.coerce.number().min(0.1).max(3.0).default(1.0),
});

export type SpeechEnv = z.infer<typeof speechEnvSchema>;
