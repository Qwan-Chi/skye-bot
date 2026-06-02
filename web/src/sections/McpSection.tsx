import { useState, useEffect } from "react";
import {
  List,
  Section,
  Cell,
  Button,
  Input,
  Textarea,
  Radio,
  Badge,
  Subheadline,
  Text,
} from "@telegram-apps/telegram-ui";
import { api, type McpServer } from "../api";

type ServerForm = {
  name: string;
  type: "http" | "stdio";
  url: string;
  headers: string;
  command: string;
  args: string;
  env: string;
};

const emptyForm: ServerForm = {
  name: "",
  type: "http",
  url: "",
  headers: "",
  command: "",
  args: "",
  env: "",
};

function formToConfig(form: ServerForm): McpServer["config"] {
  if (form.type === "http") {
    const config: McpServer["config"] = { type: "http", url: form.url };
    if (form.headers.trim()) {
      try {
        config.headers = JSON.parse(form.headers);
      } catch {
        // ignore
      }
    }
    return config;
  }
  const config: McpServer["config"] = { type: "stdio", command: form.command };
  if (form.args.trim()) {
    try {
      config.args = JSON.parse(form.args);
    } catch {
      config.args = form.args.split(/\s+/).filter(Boolean);
    }
  }
  if (form.env.trim()) {
    try {
      config.env = JSON.parse(form.env);
    } catch {
      // ignore
    }
  }
  return config;
}

function configToForm(config: McpServer["config"]): ServerForm {
  return {
    name: "",
    type: config.type ?? (config.url ? "http" : "stdio"),
    url: config.url ?? "",
    headers: config.headers ? JSON.stringify(config.headers, null, 2) : "",
    command: config.command ?? "",
    args: config.args ? JSON.stringify(config.args) : "",
    env: config.env ? JSON.stringify(config.env, null, 2) : "",
  };
}

export function McpSection() {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ServerForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.getMcpServers().then(setServers).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (server: McpServer) => {
    const formData = configToForm(server.config);
    setForm({ ...formData, name: server.name });
    setEditingId(server.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      window.Telegram.WebApp.showAlert("Server name is required");
      return;
    }
    setSaving(true);
    try {
      const config = formToConfig(form);
      if (editingId) {
        await api.updateMcpServer(editingId, form.name, config);
      } else {
        await api.addMcpServer(form.name, config);
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
      load();
    } catch (e) {
      window.Telegram.WebApp.showAlert(`Failed: ${e}`);
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (server: McpServer) => {
    window.Telegram.WebApp.showConfirm(`Delete "${server.name}"?`, async (ok) => {
      if (!ok) return;
      try {
        await api.deleteMcpServer(server.id);
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        load();
      } catch (e) {
        window.Telegram.WebApp.showAlert(`Failed: ${e}`);
      }
    });
  };

  if (loading) {
    return (
      <List>
        <Section>
          <Cell>
            <Text>Loading...</Text>
          </Cell>
        </Section>
      </List>
    );
  }

  if (showForm) {
    return (
      <List>
        <Section header={editingId ? "Edit Server" : "Add MCP Server"}>
          <Cell>
            <Subheadline>Name</Subheadline>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="my-server"
            />
          </Cell>

          <Cell>
            <Subheadline>Type</Subheadline>
            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <Radio
                checked={form.type === "http"}
                onChange={() => setForm((f) => ({ ...f, type: "http" }))}
              >
                HTTP
              </Radio>
              <Radio
                checked={form.type === "stdio"}
                onChange={() => setForm((f) => ({ ...f, type: "stdio" }))}
              >
                Stdio
              </Radio>
            </div>
          </Cell>

          {form.type === "http" ? (
            <>
              <Cell>
                <Subheadline>URL</Subheadline>
                <Input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://example.com/mcp"
                />
              </Cell>
              <Cell>
                <Subheadline>Headers (JSON)</Subheadline>
                <Textarea
                  value={form.headers}
                  onChange={(e) => setForm((f) => ({ ...f, headers: e.target.value }))}
                  placeholder='{"Authorization": "Bearer token"}'
                  rows={3}
                />
                <Text style={{ fontSize: "12px", opacity: 0.6, marginTop: "4px" }}>
                  e.g. {"{"}"Authorization": "Bearer ..."{"}"}
                </Text>
              </Cell>
            </>
          ) : (
            <>
              <Cell>
                <Subheadline>Command</Subheadline>
                <Input
                  value={form.command}
                  onChange={(e) => setForm((f) => ({ ...f, command: e.target.value }))}
                  placeholder="npx"
                />
              </Cell>
              <Cell>
                <Subheadline>Args (JSON array or space-separated)</Subheadline>
                <Input
                  value={form.args}
                  onChange={(e) => setForm((f) => ({ ...f, args: e.target.value }))}
                  placeholder='["-y", "my-mcp-server"]'
                />
              </Cell>
              <Cell>
                <Subheadline>Environment (JSON)</Subheadline>
                <Textarea
                  value={form.env}
                  onChange={(e) => setForm((f) => ({ ...f, env: e.target.value }))}
                  placeholder='{"API_KEY": "..."}'
                  rows={3}
                />
                <Text style={{ fontSize: "12px", opacity: 0.6, marginTop: "4px" }}>
                  Additional env vars
                </Text>
              </Cell>
            </>
          )}
        </Section>

        <Section>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              size="l"
              stretched
              mode="bezeled"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              size="l"
              stretched
              mode="filled"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </Section>
      </List>
    );
  }

  return (
    <List>
      <Section
        header="MCP Servers"
        footer={`${servers.length} server(s) configured`}
      >
        {servers.length === 0 ? (
          <Cell>
            <Text style={{ opacity: 0.6 }}>
              No MCP servers configured. Add one to extend the bot with external tools.
            </Text>
          </Cell>
        ) : (
          servers.map((server) => (
            <Cell
              key={server.id}
              after={
                <Badge type="dot" mode="primary" style={{ backgroundColor: server.connected ? "#34c759" : "#ff3b30" }} />
              }
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <div style={{ flex: 1 }}>
                  <Subheadline>{server.name}</Subheadline>
                  <Text style={{ fontSize: "12px", opacity: 0.6, marginTop: "2px" }}>
                    {server.config.type === "http" || server.config.url
                      ? `HTTP: ${server.config.url}`
                      : `Stdio: ${server.config.command}`}
                    {server.toolCount != null && ` · ${server.toolCount} tools`}
                  </Text>
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <Button size="s" mode="bezeled" onClick={() => openEdit(server)}>
                    Edit
                  </Button>
                  <Button size="s" mode="bezeled" onClick={() => handleDelete(server)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Cell>
          ))
        )}
      </Section>

      <Section>
        <Button size="l" stretched mode="filled" onClick={openAdd}>
          + Add Server
        </Button>
      </Section>
    </List>
  );
}
