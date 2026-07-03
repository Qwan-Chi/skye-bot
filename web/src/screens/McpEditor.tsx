import { useEffect, useMemo, useState } from "react";
import { useApp } from "../store";
import { Sheet } from "../components/Sheet";
import { Segmented } from "../components/Segmented";
import { TextField } from "../components/Field";
import { KeyValueEditor } from "../components/KeyValueEditor";
import { Button } from "../components/Button";
import { Caption, Footnote, Hint } from "../components/ui";
import { Icon } from "../components/Icon";
import {
  type McpForm,
  type KvRow,
  emptyForm,
  parseConfig,
  serialize,
  previewJson,
  isValid,
  isSecretRow,
  toggleSecret,
  scanInputs,
  PRESETS,
  importJson,
} from "../lib/mcp";
import { alertDialog, haptic } from "../lib/telegram";

export function McpEditor() {
  const { editor, closeMcpEditor, saveMcpServer, deleteMcpServer } = useApp();
  const open = editor.open;
  const editing = editor.server;

  const [form, setForm] = useState<McpForm>(emptyForm());
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [inputSecret, setInputSecret] = useState<Record<string, boolean>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Reset the form whenever a different editor target opens.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      const f = parseConfig(editing.config);
      f.name = editing.name;
      setForm(f);
      const names = scanInputs(JSON.stringify(editing.config));
      setInputValues(Object.fromEntries(names.map((n) => [n, ""])));
      setInputSecret(Object.fromEntries(names.map((n) => [n, true])));
    } else {
      setForm(emptyForm());
      setInputValues({});
      setInputSecret({});
    }
    setShowPreview(false);
  }, [open, editing]);

  // Keep the inputs list in sync with placeholders referenced in the form.
  const referenced = useMemo(
    () => scanInputs(JSON.stringify(serialize(form, {}).config)),
    [form],
  );
  useEffect(() => {
    setInputValues((prev) => {
      const next: Record<string, string> = {};
      for (const n of referenced) next[n] = prev[n] ?? "";
      return next;
    });
    setInputSecret((prev) => {
      const next: Record<string, boolean> = {};
      for (const n of referenced) next[n] = prev[n] ?? true;
      return next;
    });
  }, [referenced]);

  const set = (patch: Partial<McpForm>) => setForm((f) => ({ ...f, ...patch }));

  const applyPreset = (id: string) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const { form: partial, inputs } = preset.build();
    setForm((f) => ({ ...emptyForm(), ...partial, name: partial.name ?? f.name }));
    setInputValues(inputs);
    setInputSecret(
      Object.fromEntries(
        Object.keys(inputs).map((n) => [n, /token|key|secret/i.test(n)]),
      ),
    );
    setShowTemplates(false);
    haptic.light();
  };

  const doImport = (raw: string) => {
    try {
      const { form: imported, inputs } = importJson(raw);
      setForm(imported);
      setInputValues(inputs);
      setInputSecret(Object.fromEntries(Object.keys(inputs).map((n) => [n, true])));
      setShowImport(false);
      haptic.success();
    } catch (e) {
      haptic.error();
      alertDialog(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const save = () => {
    if (!isValid(form)) {
      haptic.warning();
      alertDialog(
        form.transport === "stdio"
          ? "Give the server a name and a command."
          : "Give the server a name and an endpoint URL.",
      );
      return;
    }
    const { config, inputs } = serialize(form, inputValues);
    void saveMcpServer(editing?.id ?? null, form.name.trim(), config, inputs);
  };

  const valid = isValid(form);

  return (
    <>
      <Sheet
        open={open}
        onClose={closeMcpEditor}
        title={editing ? "Edit Server" : "New Server"}
        headerLeft={
          <button className="sheet-action" onClick={closeMcpEditor}>
            Cancel
          </button>
        }
        headerRight={
          <button className="sheet-action sheet-action-right" onClick={save} disabled={!valid}>
            Save
          </button>
        }
      >
        <div className="section" style={{ marginTop: 4 }}>
          {!editing && (
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <Button
                variant="glass"
                icon={<Icon.Squares />}
                onClick={() => setShowTemplates(true)}
              >
                Templates
              </Button>
              <Button
                variant="glass"
                icon={<Icon.Clipboard />}
                onClick={() => setShowImport(true)}
              >
                Import JSON
              </Button>
            </div>
          )}

          <Caption>Name</Caption>
          <div className="list glass">
            <TextField value={form.name} onChange={(v) => set({ name: v })} placeholder="my-server" />
          </div>

          <Caption>Transport</Caption>
          <Segmented
            value={form.transport}
            onChange={(t) => set({ transport: t })}
            options={[
              { value: "stdio", label: "Stdio", icon: <Icon.CommandLine /> },
              { value: "http", label: "HTTP", icon: <Icon.Globe /> },
            ]}
          />

          {form.transport === "stdio" ? (
            <>
              <Caption>Command</Caption>
              <div className="list glass">
                <TextField
                  value={form.command}
                  onChange={(v) => set({ command: v })}
                  placeholder="npx"
                  mono
                  left="Run"
                />
                <li className="row no-sep">
                  <textarea
                    className="field textarea field-mono"
                    rows={4}
                    value={form.argsText}
                    placeholder={"-y\n@modelcontextprotocol/server-filesystem"}
                    spellCheck={false}
                    onChange={(e) => set({ argsText: e.target.value })}
                  />
                </li>
                <TextField
                  value={form.cwd}
                  onChange={(v) => set({ cwd: v })}
                  placeholder="/optional/working/dir"
                  mono
                  left="In"
                />
              </div>
              <Footnote>One argument per line. Use ${`{input:NAME}`} to reference a secret below.</Footnote>
            </>
          ) : (
            <>
              <Caption>Endpoint</Caption>
              <div className="list glass">
                <TextField
                  value={form.url}
                  onChange={(v) => set({ url: v })}
                  placeholder="https://mcp.example.com/sse"
                  mono
                  left="URL"
                />
              </div>
              <Caption>Headers</Caption>
              <KeyValueEditor
                rows={form.headers}
                onChange={(rows) => set({ headers: rows })}
                placeholderKey="Header"
                placeholderValue="value"
              />
            </>
          )}

          <Caption>Environment</Caption>
          <EnvEditor
            rows={form.env}
            onChange={(rows) => set({ env: rows })}
            resolveValue={(k) => inputValues[k] ?? ""}
          />
          <Footnote>
            Flip the lock to store a value as a secret — it becomes ${`{input:KEY}`} and is filled in
            the Inputs section below.
          </Footnote>

          {referenced.length > 0 && (
            <>
              <Caption>Inputs</Caption>
              <div className="list glass">
                {referenced.map((name) => (
                  <li className="row row-input" key={name}>
                    <div className="row-label" style={{ minWidth: 0, fontFamily: "ui-monospace, monospace", fontSize: 13 }}>
                      {name}
                    </div>
                    <input
                      className="field"
                      type={inputSecret[name] ? "password" : "text"}
                      value={inputValues[name] ?? ""}
                      placeholder={inputSecret[name] ? "••••••••" : "value"}
                      spellCheck={false}
                      autoComplete="off"
                      onChange={(e) =>
                        setInputValues((v) => ({ ...v, [name]: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      className={`kv-lock${inputSecret[name] ? " is-on" : ""}`}
                      onClick={() =>
                        setInputSecret((s) => ({ ...s, [name]: !s[name] }))
                      }
                      aria-label="Toggle secret"
                    >
                      {inputSecret[name] ? <Icon.LockClosed /> : <Icon.LockOpen />}
                    </button>
                  </li>
                ))}
              </div>
              <Hint>These values are stored encrypted server-side and never shown again.</Hint>
            </>
          )}

          <button
            className="sheet-action"
            style={{ marginLeft: 20, marginTop: 14, padding: "8px 0" }}
            onClick={() => setShowPreview((s) => !s)}
          >
            <Icon.ChevronDown
              style={{
                width: 16,
                height: 16,
                transition: "transform 200ms ease",
                transform: showPreview ? "rotate(180deg)" : "none",
              }}
            />
            {showPreview ? "Hide" : "Show"} config JSON
          </button>
          {showPreview && (
            <pre className="json-preview">{previewJson(form) || "{}"}</pre>
          )}

          {editing && (
            <Button
              variant="destructive"
              icon={<Icon.Trash />}
              onClick={() => deleteMcpServer(editing.id)}
              style={{ marginTop: 20 }}
            >
              Delete Server
            </Button>
          )}
        </div>
      </Sheet>

      <TemplatesSheet
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        onPick={applyPreset}
      />
      <ImportSheet open={showImport} onClose={() => setShowImport(false)} onImport={doImport} />
    </>
  );
}

/** Env editor with per-row lock toggle to mark a value as a secret input. */
function EnvEditor({
  rows,
  onChange,
  resolveValue,
}: {
  rows: KvRow[];
  onChange: (rows: KvRow[]) => void;
  resolveValue?: (key: string) => string;
}) {
  const update = (i: number, patch: Partial<KvRow>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const add = () => onChange([...rows, { key: "", value: "" }]);

  return (
    <div className="list glass">
      {rows.map((r, i) => {
        const secret = isSecretRow(r);
        return (
          <div className="kv" key={i}>
            <input
              className="kv-key"
              value={r.key}
              placeholder="NAME"
              spellCheck={false}
              autoComplete="off"
              onChange={(e) => update(i, { key: e.target.value })}
            />
            <input
              className="kv-value"
              value={secret ? "" : r.value}
              placeholder={secret ? "••••••••" : "value"}
              type={secret ? "password" : "text"}
              spellCheck={false}
              autoComplete="off"
              onChange={(e) => update(i, { value: e.target.value })}
            />
            <button
              type="button"
              className={`kv-lock${secret ? " is-on" : ""}`}
              onClick={() =>
                onChange(
                  rows.map((rr, idx) => {
                    if (idx !== i) return rr;
                    if (isSecretRow(rr)) {
                      return { ...rr, value: resolveValue?.(rr.key) ?? "" };
                    }
                    return toggleSecret(rr);
                  }),
                )
              }
              aria-label="Toggle secret"
            >
              {secret ? <Icon.LockClosed /> : <Icon.LockOpen />}
            </button>
            <button type="button" className="kv-remove" onClick={() => remove(i)} aria-label="Remove">
              <Icon.Trash />
            </button>
          </div>
        );
      })}
      <button type="button" className="kv-add" onClick={add}>
        <Icon.Plus />
        Add variable
      </button>
    </div>
  );
}

function TemplatesSheet({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (id: string) => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Templates"
      headerLeft={
        <button className="sheet-action" onClick={onClose}>
          Close
        </button>
      }
    >
      <div className="section" style={{ marginTop: 4 }}>
        <Caption>Start from a preset</Caption>
        <div className="list glass">
          {PRESETS.map((p) => (
            <li
              key={p.id}
              className="row row-tap"
              onClick={() => onPick(p.id)}
            >
              <span className="badge c-blue">
                <Icon.Squares />
              </span>
              <div className="row-content">
                <div className="row-title">{p.name}</div>
                <div className="row-subtitle">{p.description}</div>
              </div>
              <span className="chevron">
                <Icon.ChevronRight />
              </span>
            </li>
          ))}
        </div>
        <Footnote>You can tweak every field after picking a template.</Footnote>
      </div>
    </Sheet>
  );
}

function ImportSheet({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (raw: string) => void;
}) {
  const [raw, setRaw] = useState("");
  useEffect(() => {
    if (open) setRaw("");
  }, [open]);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Import JSON"
      headerLeft={
        <button className="sheet-action" onClick={onClose}>
          Cancel
        </button>
      }
      headerRight={
        <button className="sheet-action sheet-action-right" onClick={() => onImport(raw)}>
          Import
        </button>
      }
    >
      <div className="section" style={{ marginTop: 4 }}>
        <Caption>Paste a server config</Caption>
        <div className="list glass">
          <li className="row no-sep">
            <textarea
              className="field textarea textarea-lg field-mono"
              rows={10}
              value={raw}
              placeholder={'{\n  "command": "npx",\n  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]\n}'}
              spellCheck={false}
              onChange={(e) => setRaw(e.target.value)}
            />
          </li>
        </div>
        <Hint>
          Works with a raw server config or the shared <code>{"{ mcpServers: { name: {...} } }"}</code> shape.
        </Hint>
      </div>
    </Sheet>
  );
}
