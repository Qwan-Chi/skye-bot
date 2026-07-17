import { describe, expect, it } from "vitest";
import { telegramEnvSchema } from "../env.js";

describe("telegram env security limits", () => {
  it("keeps pending updates and applies a bounded job timeout by default", () => {
    const env = telegramEnvSchema.parse({ BOT_TOKEN: "token" });
    expect(env.TELEGRAM_DROP_PENDING_UPDATES).toBe("0");
    expect(env.TELEGRAM_JOB_TIMEOUT_MS).toBe(180_000);
  });

  it("rejects unsafe queue timeout values", () => {
    expect(() =>
      telegramEnvSchema.parse({ BOT_TOKEN: "token", TELEGRAM_JOB_TIMEOUT_MS: 9_999 })
    ).toThrow();
    expect(() =>
      telegramEnvSchema.parse({ BOT_TOKEN: "token", TELEGRAM_JOB_TIMEOUT_MS: 900_001 })
    ).toThrow();
  });

  it("defaults attachment downloads to 25 MiB", () => {
    expect(telegramEnvSchema.parse({ BOT_TOKEN: "token" }).TELEGRAM_MAX_ATTACHMENT_BYTES).toBe(
      25 * 1024 * 1024
    );
  });

  it("rejects attachment limits above 50 MiB", () => {
    expect(() =>
      telegramEnvSchema.parse({
        BOT_TOKEN: "token",
        TELEGRAM_MAX_ATTACHMENT_BYTES: 51 * 1024 * 1024,
      })
    ).toThrow();
  });
});
