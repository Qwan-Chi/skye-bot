import type Database from "better-sqlite3";
import type { ServiceRegistry } from "../../core/module.js";

export interface HealthReport {
  status: "ok" | "unavailable";
  startedAt: string;
  uptimeSeconds: number;
  checks: {
    database: boolean;
    telegram: boolean;
    reminders: boolean;
  };
}

export class MonitoringService {
  readonly startedAt = new Date().toISOString();

  constructor(
    private readonly db: Database.Database,
    private readonly services: ServiceRegistry,
    private readonly remindersEnabled: boolean
  ) {}

  live(): Pick<HealthReport, "status" | "startedAt" | "uptimeSeconds"> {
    return {
      status: "ok",
      startedAt: this.startedAt,
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  ready(): HealthReport {
    let database = false;
    try {
      database = this.db.prepare("SELECT 1 AS ok").get() != null;
    } catch {
      database = false;
    }

    const telegram = this.services.has("telegramReliability")
      ? this.services.get("telegramReliability").isReady()
      : false;
    const reminders =
      !this.remindersEnabled ||
      (this.services.has("reminderScheduler") &&
        this.services.get("reminderScheduler").diagnostics().running);
    const ready = database && telegram && reminders;

    return {
      status: ready ? "ok" : "unavailable",
      startedAt: this.startedAt,
      uptimeSeconds: Math.floor(process.uptime()),
      checks: { database, telegram, reminders },
    };
  }
}
