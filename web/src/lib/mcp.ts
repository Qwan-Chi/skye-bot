/**
 * Helpers for the MCP server editor: structured form <-> config object,
 * `${input:NAME}` placeholder scanning, and starter templates.
 */

export type Transport = "stdio" | "http";

export interface KvRow {
  key: string;
  value: string;
}

export interface McpForm {
  name: string;
  transport: Transport;
  command: string;
  argsText: string;
  cwd: string;
  url: string;
  headers: KvRow[];
  env: KvRow[];
}

const PLACEHOLDER = /\$\{input:([^}]+)\}/g;

export function scanInputs(text: string): string[] {
  const keys = new Set<string>();
  let m: RegExpExecArray | null;
  PLACEHOLDER.lastIndex = 0;
  while ((m = PLACEHOLDER.exec(text)) !== null) keys.add(m[1]);
  return [...keys].sort();
}

export function emptyForm(): McpForm {
  return {
    name: "",
    transport: "stdio",
    command: "",
    argsText: "",
    cwd: "",
    url: "",
    headers: [],
    env: [],
  };
}

function rowsFrom(obj: Record<string, unknown> | undefined): KvRow[] {
  if (!obj) return [];
  return Object.entries(obj).map(([k, v]) => ({ key: k, value: String(v ?? "") }));
}

/** Reconstruct the structured form from a stored config object. */
export function parseConfig(config: Record<string, unknown> | undefined | null): McpForm {
  const cfg = config ?? {};
  const transport: Transport = cfg.type === "http" || (!cfg.type && cfg.url) ? "http" : "stdio";
  return {
    name: "",
    transport,
    command: String(cfg.command ?? ""),
    argsText: Array.isArray(cfg.args) ? (cfg.args as string[]).join("\n") : "",
    cwd: String(cfg.cwd ?? ""),
    url: String(cfg.url ?? ""),
    headers: rowsFrom(cfg.headers as Record<string, unknown> | undefined),
    env: rowsFrom(cfg.env as Record<string, unknown> | undefined),
  };
}

/** Build the config object + referenced inputs map from the form + input values. */
export function serialize(
  form: McpForm,
  inputValues: Record<string, string>,
): { config: Record<string, unknown>; inputs: Record<string, string> } {
  const args = form.argsText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const config: Record<string, unknown> = { type: form.transport };
  if (form.transport === "stdio") {
    if (form.command) config.command = form.command;
    if (args.length) config.args = args;
    if (form.cwd) config.cwd = form.cwd;
  } else {
    if (form.url) config.url = form.url;
  }
  const headers = Object.fromEntries(
    form.headers.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value]),
  );
  if (Object.keys(headers).length) config.headers = headers;
  const env = Object.fromEntries(
    form.env.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value]),
  );
  if (Object.keys(env).length) config.env = env;

  const referenced = scanInputs(JSON.stringify(config));
  const inputs: Record<string, string> = {};
  for (const name of referenced) inputs[name] = inputValues[name] ?? "";

  return { config, inputs };
}

/** Live JSON preview of the config that will be stored. */
export function previewJson(form: McpForm): string {
  return JSON.stringify(serialize(form, {}).config, null, 2);
}

export function isValid(form: McpForm): boolean {
  if (!form.name.trim()) return false;
  if (form.transport === "stdio") return form.command.trim().length > 0;
  return form.url.trim().length > 0;
}

/** Toggles a row's value between a literal and a `${input:KEY}` placeholder. */
export function isSecretRow(row: KvRow): boolean {
  return row.value === `\${input:${row.key}}`;
}

export function toggleSecret(row: KvRow): KvRow {
  if (isSecretRow(row)) {
    // unlock -> clear placeholder (value will be re-entered via inputs)
    return { ...row, value: "" };
  }
  if (!row.key.trim()) return row;
  return { ...row, value: `\${input:${row.key}}` };
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  build: () => { form: Partial<McpForm>; inputs: Record<string, string> };
}

export const PRESETS: Preset[] = [
  {
    id: "filesystem",
    name: "Filesystem",
    description: "Read & write files in a folder.",
    build: () => ({
      form: {
        name: "filesystem",
        transport: "stdio",
        command: "npx",
        argsText: ["-y", "@modelcontextprotocol/server-filesystem", "${input:PATH}"].join("\n"),
      },
      inputs: { PATH: "" },
    }),
  },
  {
    id: "fetch",
    name: "Fetch",
    description: "Let the model fetch web pages.",
    build: () => ({
      form: { name: "fetch", transport: "stdio", command: "npx", argsText: "-y\n@modelcontextprotocol/server-fetch" },
      inputs: {},
    }),
  },
  {
    id: "github",
    name: "GitHub",
    description: "Search repos, issues, PRs.",
    build: () => ({
      form: {
        name: "github",
        transport: "stdio",
        command: "npx",
        argsText: "-y\n@modelcontextprotocol/server-github",
        env: [{ key: "GITHUB_TOKEN", value: "${input:GITHUB_TOKEN}" }],
      },
      inputs: { GITHUB_TOKEN: "" },
    }),
  },
  {
    id: "http",
    name: "HTTP Server",
    description: "Connect to a remote MCP over HTTP.",
    build: () => ({
      form: {
        name: "remote",
        transport: "http",
        url: "${input:ENDPOINT}",
        headers: [{ key: "Authorization", value: "Bearer ${input:TOKEN}" }],
      },
      inputs: { ENDPOINT: "", TOKEN: "" },
    }),
  },
];

/**
 * Import a pasted JSON snippet into the structured form. Accepts either a raw
 * server config (`{ command, args, ... }`) or the shared `mcpServers` shape
 * (`{ "mcpServers": { "name": { ... } } }`).
 */
export function importJson(raw: string): { form: McpForm; inputs: Record<string, string> } {
  const data = JSON.parse(raw);
  let name = "";
  let cfg: Record<string, unknown> = data;
  if (data && typeof data === "object" && "mcpServers" in data) {
    const servers = data.mcpServers as Record<string, unknown>;
    const first = Object.entries(servers)[0];
    if (!first) throw new Error("No servers in snippet");
    name = first[0];
    cfg = first[1] as Record<string, unknown>;
  }
  const form = parseConfig(cfg);
  form.name = name || form.name;
  // inputs are re-entered by the user; keep names from scan.
  const inputNames = scanInputs(JSON.stringify(cfg));
  const inputs: Record<string, string> = {};
  for (const n of inputNames) inputs[n] = "";
  return { form, inputs };
}
