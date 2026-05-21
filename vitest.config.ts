import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    env: {
      BOT_TOKEN: "test-token",
      OPENAI_KEY: "test-key",
      BASE_URL: "https://openrouter.ai/api/v1",
    },
  },
});
