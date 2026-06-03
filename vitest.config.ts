import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    setupFiles: ["./src/__tests__/setup.ts"],
    env: {
      BOT_TOKEN: "test-token",
      OPENAI_KEY: "test-key",
      BASE_URL: "https://openrouter.ai/api/v1",
      DB_PATH: ":memory:",
    },
  },
});
