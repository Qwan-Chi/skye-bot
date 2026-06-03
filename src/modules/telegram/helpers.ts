import type { Context as GrammyContext } from "grammy";
import type { LogEntry } from "../chatLog/service.js";
import type { AuditEntry } from "../audit/service.js";
import { log } from "../../utils/log.js";

const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/** Download an image from a URL and return it as a base64 data URL. */
export async function toDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());

  const ext = url.split(/[?#]/)[0].split(".").pop()?.toLowerCase() || "";
  const headerMime = (res.headers.get("content-type") || "").split(";")[0].trim();
  const mime =
    MIME_MAP[ext] || (headerMime.startsWith("image/") ? headerMime : null) || "image/jpeg";

  return `data:${mime};base64,${buf.toString("base64")}`;
}

/**
 * Parse a JSON string that may contain trailing garbage (some models append
 * extra text after the JSON object). Falls back to a brace-balanced scan.
 */
export function safeJsonParse(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    let depth = 0;
    let start = -1;
    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (ch === "{") {
        if (depth === 0) start = i;
        depth++;
      } else if (ch === "}") {
        depth--;
        if (depth === 0 && start !== -1) {
          const candidate = trimmed.slice(start, i + 1);
          try {
            return JSON.parse(candidate);
          } catch {
            // keep searching
          }
        }
      }
    }
    log.warn({ raw: trimmed.slice(0, 200) }, "Failed to parse tool arguments JSON");
    return {};
  }
}

export function senderTag(ctx: GrammyContext): string {
  const from = ctx.from;
  if (!from) return "";
  const parts: string[] = [];
  if (from.first_name) parts.push(from.first_name);
  if (from.last_name) parts.push(from.last_name);
  const name = parts.join(" ") || "Unknown";
  const handle = from.username ? ` (@${from.username})` : "";
  return `[${name}${handle}] `;
}

export function ctxAudit(
  ctx: GrammyContext
): Pick<AuditEntry, "chatId" | "chatType" | "threadId" | "userId" | "username" | "firstName"> {
  return {
    chatId: ctx.chat!.id,
    chatType: ctx.chat!.type,
    threadId: ctx.message?.message_thread_id ?? undefined,
    userId: ctx.from!.id,
    username: ctx.from?.username ?? undefined,
    firstName: ctx.from?.first_name ?? undefined,
  };
}

export function serializeError(e: unknown): Record<string, unknown> {
  if (!(e instanceof Error)) return { message: String(e) };
  const a = e as { status?: number; error?: unknown; code?: string };
  const obj: Record<string, unknown> = { message: e.message };
  if (a.status != null) obj.status = a.status;
  if (a.error != null) obj.apiError = a.error;
  if (a.code != null) obj.code = a.code;
  return obj;
}

export function fmtError(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  const a = e as {
    status?: number;
    error?: { code?: string; type?: string };
  };
  const parts: string[] = [e.message];
  if (a.status != null) parts.push(`status=${a.status}`);
  if (a.error?.code != null) parts.push(`code=${a.error.code}`);
  if (a.error?.type != null) parts.push(`type=${a.error.type}`);
  return parts.join(" | ");
}

export function extractLogEntry(ctx: GrammyContext): LogEntry {
  const from = ctx.from;
  const nameParts: string[] = [];
  if (from?.first_name) nameParts.push(from.first_name);
  if (from?.last_name) nameParts.push(from.last_name);
  const sender = nameParts.join(" ") || "Unknown";

  const now = new Date();
  const timestamp = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const msg = ctx.message!;
  let type = "text";
  let content = "";

  if ("text" in msg && msg.text) {
    content = msg.text;
  } else if ("sticker" in msg && msg.sticker) {
    type = "sticker";
    content = msg.sticker.emoji || "sticker";
  } else if ("photo" in msg && msg.photo) {
    type = "photo";
    content = ("caption" in msg && msg.caption) || "photo";
  } else if ("video" in msg && msg.video) {
    type = "video";
    content = ("caption" in msg && msg.caption) || "video";
  } else if ("animation" in msg && msg.animation) {
    type = "GIF";
    content = ("caption" in msg && msg.caption) || "GIF";
  } else if ("document" in msg && msg.document) {
    type = "document";
    content = msg.document.file_name || "document";
  } else if ("voice" in msg && msg.voice) {
    type = "voice";
    content = "voice message";
  } else if ("video_note" in msg && msg.video_note) {
    type = "video_note";
    content = "video note";
  } else if ("audio" in msg && msg.audio) {
    type = "audio";
    content = msg.audio.title || msg.audio.file_name || "audio";
  } else {
    content = "[unsupported message type]";
  }

  let replyTo: string | undefined;
  if ("reply_to_message" in msg && msg.reply_to_message?.from) {
    const rf = msg.reply_to_message.from;
    const rParts: string[] = [];
    if (rf.first_name) rParts.push(rf.first_name);
    if (rf.last_name) rParts.push(rf.last_name);
    replyTo = rParts.join(" ") || "Unknown";
  }

  return { sender, timestamp, type, content, replyTo };
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export interface ToolCallRecord {
  name: string;
  args: Record<string, unknown>;
  isMcp: boolean;
}

export function formatToolCalls(calls: ToolCallRecord[]): string {
  return calls
    .map((c) => {
      const icon = c.isMcp ? "🔌" : "🧠";
      const argsStr = Object.entries(c.args)
        .map(([k, v]) => {
          let val = JSON.stringify(v);
          if (val.length > 40) val = val.slice(0, 40) + "...";
          return `${k}=${val}`;
        })
        .join(", ");
      return `${icon} ${c.name}(${argsStr})`;
    })
    .join("\n");
}

export function buildDraftHtml(toolCalls: ToolCallRecord[], suffix?: string): string {
  const prefix = formatToolCalls(toolCalls);
  const blockquote = `<blockquote>${escapeHtml(prefix)}</blockquote>`;
  return suffix ? `${blockquote}\n${escapeHtml(suffix)}` : blockquote;
}

export function buildFinalReply(
  toolCalls: ToolCallRecord[],
  text: string
): { text: string; options?: { parse_mode: "HTML" } } {
  if (toolCalls.length === 0) return { text };
  return {
    text: buildDraftHtml(toolCalls, text),
    options: { parse_mode: "HTML" },
  };
}

export function createDraftManager(ctx: GrammyContext, parseMode?: "HTML") {
  let msgId: number | undefined;
  let lastText = "";
  const extraOpts = parseMode ? { parse_mode: parseMode } : {};

  return {
    send: async (text: string) => {
      if (text === lastText) return;
      lastText = text;
      if (!msgId) {
        const m = await ctx.reply(text, {
          reply_to_message_id: ctx.message!.message_id,
          ...extraOpts,
        });
        msgId = m.message_id;
      } else {
        await ctx.api
          .editMessageText(ctx.chat!.id, msgId, text, extraOpts)
          .catch((e: { description?: string }) => {
            if (e?.description?.includes("not modified")) return;
            log.warn({ err: e }, "Failed to edit draft message");
          });
      }
    },
    delete: async () => {
      if (!msgId) return;
      await ctx.api.deleteMessage(ctx.chat!.id, msgId).catch(() => {});
      msgId = undefined;
      lastText = "";
    },
  };
}
