import type { Migration } from "../../core/module.js";

export const migrations: Migration[] = [
  {
    id: "001-init",
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS chat_summaries (
          chat_id  INTEGER PRIMARY KEY,
          summary  TEXT    NOT NULL
        );
      `);
    },
  },
];
