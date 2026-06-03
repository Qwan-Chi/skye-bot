import { getDb } from "../../core/db.js";
import type { ApiCredentials, LlmClient } from "../llm/client.js";
import { log } from "../../utils/log.js";

const MAX_BUFFER = 50;
const RECENT_COUNT = 20;
const SUMMARIZE_INTERVAL = 10;

export interface LogEntry {
  sender: string;
  timestamp: string;
  type: string;
  content: string;
  replyTo?: string;
}

// In-memory ring buffers keyed by chatId (reset on restart is acceptable)
const logs = new Map<number, LogEntry[]>();
const counters = new Map<number, number>();
const chatTitles = new Map<number, string>();

let llmRef: LlmClient | null = null;

/** Wired by the chatLog module's init() so summarizeChat can hit the LLM. */
export function setLlmClient(client: LlmClient): void {
  llmRef = client;
}

function getSummary(chatId: number): string {
  const row = getDb()
    .prepare<[number], { summary: string }>("SELECT summary FROM chat_summaries WHERE chat_id = ?")
    .get(chatId);
  return row?.summary ?? "";
}

export function formatLogEntry(entry: LogEntry): string {
  const time = entry.timestamp;
  const reply = entry.replyTo ? ` (replying to ${entry.replyTo})` : "";
  const typeTag = entry.type !== "text" ? `[${entry.type}] ` : "";
  return `[${time}] ${entry.sender}${reply}: ${typeTag}${entry.content}`;
}

/** Push a message to the buffer. Returns true if summarization is due. */
export function logMessage(chatId: number, entry: LogEntry, chatTitle?: string): boolean {
  if (chatTitle) chatTitles.set(chatId, chatTitle);
  if (!logs.has(chatId)) logs.set(chatId, []);
  const buf = logs.get(chatId)!;
  buf.push(entry);
  if (buf.length > MAX_BUFFER) buf.shift();
  const count = (counters.get(chatId) ?? 0) + 1;
  counters.set(chatId, count);
  return count >= SUMMARIZE_INTERVAL;
}

export function getOlderEntries(chatId: number): LogEntry[] {
  const buf = logs.get(chatId);
  if (!buf) return [];
  const cutoff = Math.max(0, buf.length - RECENT_COUNT);
  return buf.slice(0, cutoff);
}

export function getChatContext(
  chatId: number
): { chatTitle: string; summary: string; recentLog: string } | undefined {
  const buf = logs.get(chatId);
  if (!buf || buf.length === 0) return undefined;
  const title = chatTitles.get(chatId) ?? "Unknown Chat";
  const summary = getSummary(chatId);
  const recent = buf.slice(-RECENT_COUNT);
  const recentLog = recent.map(formatLogEntry).join("\n");
  return { chatTitle: title, summary, recentLog };
}

export async function setSummary(chatId: number, summary: string): Promise<void> {
  getDb()
    .prepare(
      `INSERT INTO chat_summaries (chat_id, summary) VALUES (?, ?)
       ON CONFLICT(chat_id) DO UPDATE SET summary = excluded.summary`
    )
    .run(chatId, summary);
  counters.set(chatId, 0);
}

export async function summarizeChat(chatId: number, creds?: ApiCredentials): Promise<void> {
  const older = getOlderEntries(chatId);
  if (older.length === 0) {
    counters.set(chatId, 0);
    return;
  }
  if (!llmRef) {
    log.warn(`Chat ${chatId}: summarization skipped — LLM client not wired`);
    counters.set(chatId, 0);
    return;
  }

  const formatted = older.map(formatLogEntry).join("\n");
  const instructions =
    "You are a concise summarizer. Given a log of group chat messages, produce a brief summary noting: key participants, topics discussed, any media or files exchanged, and approximate timeline. Keep it under 200 words. Output only the summary, no preamble.";

  try {
    const res = await llmRef.ask(instructions, formatted, creds);
    const text = res.output_text;
    if (text) {
      await setSummary(chatId, text);
      log.info(`Chat ${chatId}: summarized ${older.length} older messages`);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    log.warn(`Chat ${chatId}: summarization failed: ${msg}`);
    counters.set(chatId, 0);
  }
}

export interface ChatLogService {
  log(chatId: number, entry: LogEntry, chatTitle?: string): boolean;
  context(chatId: number): { chatTitle: string; summary: string; recentLog: string } | undefined;
  summarize(chatId: number, creds?: ApiCredentials): Promise<void>;
}

export const chatLogService: ChatLogService = {
  log: logMessage,
  context: getChatContext,
  summarize: summarizeChat,
};
