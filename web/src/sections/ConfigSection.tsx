import { useState, useEffect } from "react";
import {
  List,
  Section,
  Cell,
  Input,
  Slider,
  Button,
  Subheadline,
  Text,
} from "@telegram-apps/telegram-ui";
import { api, type UserConfig } from "../api";

export function ConfigSection() {
  const [config, setConfig] = useState<UserConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    api.getConfig().then(setConfig).finally(() => setLoading(false));
  }, []);

  const update = (patch: Partial<UserConfig>) => {
    setConfig((c) => ({ ...c, ...patch }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.updateConfig(config);
      setConfig(updated);
      setDirty(false);
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    } catch (e) {
      window.Telegram.WebApp.showAlert(`Failed to save: ${e}`);
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
    } finally {
      setSaving(false);
    }
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

  return (
    <List>
      <Section header="API Configuration" footer="Override default model and provider settings">
        <Cell>
          <Subheadline>API Key</Subheadline>
          <Input
            type="password"
            value={config.apiKey ?? ""}
            onChange={(e) => update({ apiKey: e.target.value || undefined })}
            placeholder="sk-..."
          />
          <Text style={{ fontSize: "12px", opacity: 0.6, marginTop: "4px" }}>
            Your OpenAI-compatible API key
          </Text>
        </Cell>

        <Cell>
          <Subheadline>Base URL</Subheadline>
          <Input
            type="url"
            value={config.baseUrl ?? ""}
            onChange={(e) => update({ baseUrl: e.target.value || undefined })}
            placeholder="https://openrouter.ai/api/v1"
          />
          <Text style={{ fontSize: "12px", opacity: 0.6, marginTop: "4px" }}>
            API endpoint (default: OpenRouter)
          </Text>
        </Cell>

        <Cell>
          <Subheadline>Model</Subheadline>
          <Input
            type="text"
            value={config.model ?? ""}
            onChange={(e) => update({ model: e.target.value || undefined })}
            placeholder="openai/gpt-oss-120b"
          />
          <Text style={{ fontSize: "12px", opacity: 0.6, marginTop: "4px" }}>
            Model ID (e.g. openai/gpt-oss-120b)
          </Text>
        </Cell>

        <Cell>
          <Subheadline>Max Tokens</Subheadline>
          <Slider
            min={100}
            max={4096}
            step={100}
            value={config.maxTokens ?? 500}
            onChange={(value) => update({ maxTokens: value })}
          />
          <Text style={{ fontSize: "12px", opacity: 0.6, textAlign: "right", marginTop: "4px" }}>
            {config.maxTokens ?? 500}
          </Text>
        </Cell>
      </Section>

      {dirty && (
        <Section>
          <Button
            size="l"
            stretched
            mode="filled"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Section>
      )}
    </List>
  );
}
