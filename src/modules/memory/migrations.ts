import type { Migration } from "../../core/module.js";

export const migrations: Migration[] = [
  {
    id: "001-init",
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS memories (
          id         TEXT    PRIMARY KEY,
          chat_id    INTEGER NOT NULL,
          content    TEXT    NOT NULL,
          created_at TEXT    NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_memories_chat ON memories(chat_id);
      `);
    },
  },
];
