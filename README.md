<div align="center"><img src="./assets/cloud_circle.png" alt="Cloud circle avatar" width="96"/></div>

<h3 align="center">
    Skye
</h1>

<p align="center">
    <sup>A calm, minimal-minded assistant that keeps things simple and clear.</sup>
</p>

<p align="center">
    <img src="https://img.shields.io/badge/pnpm-%234a4a4a.svg?style=for-the-badge&logo=pnpm&logoColor=f69220" alt="PNPM"/>
    <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/node.js-6DA55F.svg?style=for-the-badge&logo=node.js&logoColor=white" alt="NodeJS"/>
</p>

---

## Features

A complete inventory of what the bot can do today. Keep it next to your `.env` — if a feature isn't listed here, it isn't built.

### Chat

- **Text chat in private DMs.** Just message the bot — no command needed.
- **Text chat in groups.** Bot only replies when @-mentioned. Other bots' commands are ignored.
- **Per-thread conversation memory.** Keeps the last 30 input/output items (≈15 exchanges) per `chatId[:threadId]`. Drops the oldest pair when full.
- **Streaming drafts.** Replies start appearing as the model generates them — the message is edited live (throttled to ~300 ms) until generation finishes.
- **Tool call surfacing.** When the model uses a tool, the call name and args are shown inline in a blockquote above the answer (🔌 for MCP tools, 🧠 for built-in).
- **Sender tags in groups.** User messages get prefixed with `[First Last (@username)]` so the model knows who's speaking.
- **Markdown sanitization.** Strips `*`, `_`, `~`, `` ` `` and backslash-escapes before sending — Telegram's Markdown is finicky, this avoids parse errors.
- **Per-thread rate limit.** 1 request per 2 seconds per `chatId[:threadId]`. Older requests are dropped silently.
- **`/reset`** — clear the in-process conversation buffer for this thread. Long-term memories are preserved.

### Vision (image input)

- **Photo + caption** is sent to the model with the image attached (or just the photo in DMs). Bot replies with text.
- **Capability detection.** On startup, queries `<BASE_URL>/models` and checks `architecture.modality`. If the active model doesn't support images, the photo handler tells the user and the LLM history is auto-stripped of images so old vision turns don't break subsequent requests.
- **Forwarded telegram CDN URL → base64 data URL.** MIME is derived from the file extension because Telegram's `content-type` header is unreliable.

### Image generation & editing

- **`/image <prompt>`** — text-to-image.
- **Photo + `/image <prompt>` caption** — image editing using the reply photo as reference.
- **Provider-isolated.** Uses a separate `IMAGE_*` env block (`IMAGE_BASE_URL`, `IMAGE_API_KEY`, `IMAGE_MODEL`). Falls back to the main `BASE_URL`/`OPENAI_KEY` if not set. Per-user/per-chat keys are NOT consulted — image generation is a server-level capability.
- **Default model:** `google/gemini-3.1-flash-image-preview` via OpenRouter (uses the `modalities: ["image", "text"]` extension on chat completions).

### Voice

- **Speech-to-text on voice messages** via Yandex SpeechKit (`YC_API_KEY`). Recognized text is fed into the normal chat pipeline. In groups, the caption must mention the bot — otherwise the voice is ignored.
- **`/voice` toggle** — when ON, text replies are synthesized via Yandex SpeechKit TTS and sent as Telegram voice notes (OGG Opus). When OFF or TTS unavailable, replies are plain text.
- **TTS voice configurable** via `YC_TTS_VOICE` / `YC_TTS_EMOTION` / `YC_TTS_LANG` / `YC_TTS_SPEED`. Defaults: `jane`, `neutral`, `ru-RU`, `1.0`.
- **Graceful fallback.** If STT fails → user is told. If TTS fails → falls back to text reply.

### Long-term memory

- **Per-chat memories** stored in SQLite. The model has two tools: `save_memory(content)` and `delete_memory(memory_id)`.
- **Auto-loaded** into the system prompt on every request, formatted as `[mem_xxx] content`.
- **`/forget`** — wipe all memories for the current chat.
- **Panel-managed.** Memories can also be browsed and deleted from the settings panel; the panel shows memories across all chats the user has participated in.

### Group chat awareness

- **Rolling message log** (in-memory, 50-entry ring buffer per chat) including stickers, photos, GIFs, documents, voice/video notes, replies — formatted as `[time] sender: content`.
- **Automatic summarization** of older messages every 10 turns, persisted to SQLite. The summary plus the last 20 raw messages are injected into the system prompt so the bot has context about ongoing group conversations even when it's not directly addressed.

### Settings Mini App (Telegram WebApp)

- **Telegram WebApp** served from Express. Authenticated via Telegram `initData` HMAC validation — no separate login.
- **Per-user config:** API key, base URL, model, max tokens, custom system prompt (appended to the default Skye persona).
- **Per-user MCP servers:** add, edit, delete, and reconnect arbitrary MCP servers from the panel. Inputs (`${input:foo}` in MCP config) are stored per server.
- **Per-chat toggles:** voice mode.
- **Memory browser:** list and delete saved memories.
- **Usage stats:** total requests, today's requests, average latency, error rate (from the audit log).

### MCP (Model Context Protocol)

- **Global servers** loaded from `mcp.json` at startup (path overridable via `MCP_CONFIG_PATH`). Connected via stdio or streamable HTTP transport.
- **Per-user servers** added via the panel — connected on add/update, disconnected on delete.
- **Tool merging.** Global tools + the calling user's tools are exposed to the model. Per-user tool names are namespaced as `u<userId>_<serverId>_<name>` to avoid collisions.
- **Variable substitution.** `${ENV_VAR}` and `${input:name}` references in MCP server configs are resolved against `process.env` and per-server panel inputs.
- **Graceful shutdown** — all connected MCP clients are closed on SIGINT/SIGTERM.

### Access control

- **Allow-list mode** (`ALLOWED_IDS=<chatId>,<chatId>,...`): listed chats get free access using the server's default API key. Users in those chats can still override with their own key via the panel.
- **BYO-key mode** (chat NOT in allow-list): the chat must provide an API key — either at the chat level or per individual user via the panel — otherwise the bot won't respond.
- **`/config`** — opens the Mini App for the user to set up credentials.
- **Group politeness.** In groups, the bot only replies when @-mentioned, when one of its commands is used (matching its username if a target is specified), or never if it's a command for a different bot.
- **Public commands** (`/config`, `/voice`) bypass the access gate so users can always set things up.

### Audit & quotas

- **Request logging** to SQLite. Every chat/voice/photo/image request gets a row: timestamp, chat metadata, message type, input/output character counts, latency, model, success/error, error message.
- **Automatic pruning.** Two independent guards — `AUDIT_RETENTION_DAYS` (default 90) and `AUDIT_MAX_ROWS` (default 100 000). Whichever is stricter applies. Pruning runs on startup and every 24h thereafter.

### Architecture & ops

- **Plugin module system** — every domain (`memory`, `mcp`, `speech`, `audit`, `llm`, `panel`, `telegram`, ...) lives in `src/modules/<name>/`. Each module declares its own env schema, migrations, tools, commands, panel routes via a `SkyeModule` contract. Adding a new domain is one folder + one line in the `modules[]` array in `src/index.ts`.
- **Tracked SQLite migrations** in a `migrations` table (`module:id` keys). Idempotent; only new migrations run on subsequent boots.
- **Structured JSON logging** via `pino`. Pipe through `pino-pretty` in dev (`pnpm run dev:pretty`).
- **Strict env validation** via zod at startup — process exits with a list of missing/malformed variables.
- **Vitest** test suite (45 tests) for memory, chat config, chat log, prompt, and markdown utilities. Setup wires up an in-memory SQLite with all migrations applied.

### What it does NOT do (yet)

- **Real-time voice streaming.** Voice messages are batch upload → batch reply. Telegram's Bot API doesn't support live audio either way.
- **OpenAI Realtime / WebRTC.** Out of scope for the Telegram surface.
- **Multi-host / multi-user beyond Telegram identity.** Tenancy is `(chatId, userId)` derived from Telegram, not a separate users table.

---

## Quick start

```bash
pnpm install
cp env.example .env   # then fill in BOT_TOKEN, OPENAI_KEY, etc.
pnpm run dev          # or dev:pretty for human-readable logs
```

See `AGENTS.md` for the repository conventions.
