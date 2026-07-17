import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { migrations } from "../migrations.js";
import { TelegramReliabilityService, ThreadWorkQueue } from "../reliability.js";

const abortableWait = (signal: AbortSignal): Promise<void> =>
  new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
  });

describe("ThreadWorkQueue", () => {
  it("runs jobs serially within a thread", async () => {
    const queue = new ThreadWorkQueue(1_000);
    const events: string[] = [];

    queue.enqueue("chat:1", 1, async () => {
      events.push("first:start");
      await new Promise((resolve) => setTimeout(resolve, 10));
      events.push("first:end");
    });
    queue.enqueue("chat:1", 1, async () => {
      events.push("second");
    });

    await queue.whenIdle();
    expect(events).toEqual(["first:start", "first:end", "second"]);
    expect(queue.diagnostics()).toMatchObject({ pendingJobs: 0, activeJobs: 0 });
  });

  it("releases a thread after a timed-out job", async () => {
    const queue = new ThreadWorkQueue(15);
    const events: string[] = [];

    queue.enqueue("chat:1", 1, async (signal) => abortableWait(signal));
    queue.enqueue("chat:1", 1, async () => {
      events.push("continued");
    });

    await queue.whenIdle();
    expect(events).toEqual(["continued"]);
    expect(queue.diagnostics().timedOutTotal).toBe(1);
  });

  it("cancels active and pending work without blocking later jobs", async () => {
    const queue = new ThreadWorkQueue(1_000);
    const events: string[] = [];

    queue.enqueue("chat:1", 1, async (signal) => abortableWait(signal));
    queue.enqueue("chat:1", 1, async () => {
      events.push("stale");
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    queue.cancelChat(1);
    queue.enqueue("chat:1", 1, async () => {
      events.push("fresh");
    });

    await queue.whenIdle();
    expect(events).toEqual(["fresh"]);
    expect(queue.diagnostics().cancelledTotal).toBe(1);
  });
});

describe("TelegramReliabilityService", () => {
  const createService = () => {
    const db = new Database(":memory:");
    migrations[0]!.up(db);
    return { db, service: new TelegramReliabilityService(db, 1_000) };
  };

  it("persists completed updates and suppresses their duplicates", async () => {
    const { db, service } = createService();
    let calls = 0;

    await service.processUpdate(42, 7, async () => {
      calls += 1;
    });
    await service.processUpdate(42, 7, async () => {
      calls += 1;
    });

    expect(calls).toBe(1);
    expect(service.diagnostics()).toMatchObject({ processedUpdates: 1, duplicateUpdates: 1 });
    expect(
      db.prepare("SELECT chat_id FROM telegram_processed_updates WHERE update_id = 42").get()
    ).toEqual({ chat_id: 7 });
    db.close();
  });

  it("does not mark failed updates as completed", async () => {
    const { db, service } = createService();
    const failure = new Error("temporary failure");

    await expect(
      service.processUpdate(9, undefined, async () => Promise.reject(failure))
    ).rejects.toBe(failure);
    await service.processUpdate(9, undefined, async () => undefined);

    expect(service.diagnostics()).toMatchObject({ processedUpdates: 1, failedUpdates: 1 });
    db.close();
  });

  it("exposes readiness only after polling and preflight complete", () => {
    const { db, service } = createService();
    expect(service.isReady()).toBe(false);
    service.markApiReady("skye_bot");
    service.markLlmPreflightComplete();
    service.markPolling();
    expect(service.isReady()).toBe(true);
    expect(service.diagnostics()).toMatchObject({ status: "polling", botUsername: "skye_bot" });
    db.close();
  });
});
