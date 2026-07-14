import type { RemindersService, Reminder } from "./service.js";
import type { EventBus } from "../../core/events.js";
import { log } from "../../utils/log.js";

export interface ReminderFiredPayload {
  reminder: Reminder;
}

declare module "../../core/events.js" {
  interface SkyeEvents {
    "reminders.fired": ReminderFiredPayload;
    "reminders.delivered": ReminderFiredPayload;
    "reminders.failed": ReminderFiredPayload & { error?: string };
  }
}

export class ReminderScheduler {
  private timer: NodeJS.Timeout | null = null;
  private firing = new Set<string>();
  private lastTickAt: string | undefined;
  private lastError: string | undefined;

  constructor(
    private readonly deps: {
      service: RemindersService;
      events: EventBus;
    },
    private readonly settings: {
      enabled: boolean;
      checkIntervalSec: number;
      graceSec: number;
    }
  ) {}

  start(): void {
    if (!this.settings.enabled) return;
    if (this.timer) return;
    this.deps.events.on("reminders.delivered", ({ reminder }) => {
      this.complete(reminder);
      this.firing.delete(reminder.id);
    });
    this.deps.events.on("reminders.failed", ({ reminder, error }) => {
      const retryAt = new Date(Date.now() + 60_000);
      this.deps.service.reschedule(reminder.id, retryAt);
      this.firing.delete(reminder.id);
      log.warn(
        { id: reminder.id, retryAt: retryAt.toISOString(), error },
        "Reminder delivery scheduled for retry"
      );
    });
    this.timer = setInterval(() => void this.tick(), this.settings.checkIntervalSec * 1000);
    this.timer.unref();
    log.info({ intervalSec: this.settings.checkIntervalSec }, "Reminder scheduler started");
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async tick(): Promise<void> {
    this.lastTickAt = new Date().toISOString();
    const now = new Date();
    let due: Reminder[];
    try {
      due = this.deps.service.due(now);
    } catch (e) {
      this.lastError = e instanceof Error ? e.message : String(e);
      log.error({ err: e }, "Reminder scheduler: failed to query due reminders");
      return;
    }
    this.lastError = undefined;
    if (due.length === 0) return;

    for (const reminder of due) {
      if (this.firing.has(reminder.id)) continue;
      this.firing.add(reminder.id);

      void (async () => {
        try {
          const fireAge = now.getTime() - new Date(reminder.fireAt).getTime();
          const isStale = fireAge > this.settings.graceSec * 1000;

          if (isStale) {
            log.info(
              { id: reminder.id, fireAgeSec: Math.round(fireAge / 1000) },
              "Reminder is stale (past grace), rescheduling/deactivating without firing"
            );
          } else {
            log.info({ id: reminder.id, chatId: reminder.chatId }, "Firing reminder");
            this.deps.events.emit("reminders.fired", { reminder });
            return;
          }
          this.complete(reminder);
        } catch (e) {
          log.error({ err: e, id: reminder.id }, "Failed to process fired reminder");
          this.firing.delete(reminder.id);
        }
      })();
    }
  }

  diagnostics(): {
    enabled: boolean;
    running: boolean;
    inFlight: number;
    lastTickAt?: string;
    lastError?: string;
  } {
    return {
      enabled: this.settings.enabled,
      running: this.timer != null,
      inFlight: this.firing.size,
      ...(this.lastTickAt ? { lastTickAt: this.lastTickAt } : {}),
      ...(this.lastError ? { lastError: this.lastError } : {}),
    };
  }

  private complete(reminder: Reminder): void {
    if (reminder.repeat === "none") {
      this.deps.service.deactivate(reminder.id);
      return;
    }
    const next = this.deps.service.advanceRepeating(reminder);
    if (next) this.deps.service.reschedule(reminder.id, next);
    else this.deps.service.deactivate(reminder.id);
  }
}
