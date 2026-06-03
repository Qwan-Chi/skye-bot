import type { ModuleContext, PanelRoute } from "../../core/module.js";
import type { PanelRequest } from "../panel/index.js";
import { getDb } from "../../core/db.js";

export function buildRoutes(ctx: ModuleContext): PanelRoute[] {
  const memory = ctx.services.get("memory");

  return [
    {
      method: "get",
      path: "/memories",
      handler: (req, res) => {
        const userId = (req as PanelRequest).tenant.userId!;
        // Cross-reference request_logs to find chats this user participated in.
        const rows = getDb()
          .prepare<[number], { id: string; content: string; createdAt: string; chatId: number }>(
            `SELECT m.id, m.content, m.created_at AS createdAt, m.chat_id AS chatId
             FROM memories m
             WHERE m.chat_id IN (SELECT DISTINCT chat_id FROM request_logs WHERE user_id = ?)
             ORDER BY m.created_at DESC LIMIT 100`
          )
          .all(userId);
        res.json(rows);
      },
    },
    {
      method: "delete",
      path: "/memories/:chatId/:id",
      handler: async (req, res) => {
        const chatId = Number(req.params.chatId);
        const id = String(req.params.id);
        await memory.delete(chatId, id);
        res.json({ ok: true });
      },
    },
    {
      method: "delete",
      path: "/memories/:chatId",
      handler: async (req, res) => {
        const chatId = Number(req.params.chatId);
        await memory.clear(chatId);
        res.json({ ok: true });
      },
    },
  ];
}
