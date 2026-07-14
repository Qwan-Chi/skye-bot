import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { ServiceRegistry } from "../../../core/module.js";
import { migrations as telegramMigrations } from "../../telegram/migrations.js";
import { TelegramReliabilityService } from "../../telegram/reliability.js";
import { MonitoringService } from "../service.js";

describe("MonitoringService", () => {
  const createServices = () => {
    const db = new Database(":memory:");
    telegramMigrations[0]!.up(db);
    const registry = new ServiceRegistry();
    const telegram = new TelegramReliabilityService(db, 1_000);
    registry.set("telegramReliability", telegram);
    return { db, registry, telegram };
  };

  it("reports unavailable until Telegram startup is complete", () => {
    const { db, registry, telegram } = createServices();
    const monitoring = new MonitoringService(db, registry, false);

    expect(monitoring.ready()).toMatchObject({
      status: "unavailable",
      checks: { database: true, telegram: false, reminders: true },
    });

    telegram.markApiReady();
    telegram.markLlmPreflightComplete();
    telegram.markPolling();
    expect(monitoring.ready()).toMatchObject({
      status: "ok",
      checks: { database: true, telegram: true, reminders: true },
    });
    db.close();
  });

  it("reports a closed database as unavailable", () => {
    const { db, registry, telegram } = createServices();
    telegram.markApiReady();
    telegram.markLlmPreflightComplete();
    telegram.markPolling();
    const monitoring = new MonitoringService(db, registry, false);
    db.close();

    expect(monitoring.ready()).toMatchObject({
      status: "unavailable",
      checks: { database: false, telegram: true, reminders: true },
    });
  });
});
