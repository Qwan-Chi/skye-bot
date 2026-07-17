import type { Migration } from "../../core/module.js";

export const migrations: Migration[] = [
  {
    id: "001_processed_updates",
    up(db) {
      db.exec(`
        CREATE TABLE telegram_processed_updates (
          update_id   INTEGER PRIMARY KEY,
          chat_id     INTEGER,
          processed_at TEXT NOT NULL
        );

        CREATE INDEX idx_telegram_processed_updates_at
          ON telegram_processed_updates(processed_at);
      `);
    },
  },
];
