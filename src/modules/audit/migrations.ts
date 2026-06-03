import type { Migration } from "../../core/module.js";

export const migrations: Migration[] = [
  {
    id: "001-init",
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS request_logs (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          ts         TEXT    NOT NULL,
          chat_id    INTEGER NOT NULL,
          chat_type  TEXT    NOT NULL,
          thread_id  INTEGER,
          user_id    INTEGER NOT NULL,
          username   TEXT,
          first_name TEXT,
          msg_type   TEXT    NOT NULL,
          command    TEXT,
          input_len  INTEGER NOT NULL DEFAULT 0,
          output_len INTEGER NOT NULL DEFAULT 0,
          latency_ms INTEGER NOT NULL DEFAULT 0,
          model      TEXT    NOT NULL,
          status     TEXT    NOT NULL,
          error_msg  TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_rl_ts      ON request_logs(ts);
        CREATE INDEX IF NOT EXISTS idx_rl_user_id ON request_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_rl_chat_id ON request_logs(chat_id);
      `);
    },
  },
];
