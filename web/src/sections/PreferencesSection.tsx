import { useState, useEffect } from "react";
import {
  List,
  Section,
  Cell,
  Switch,
  Textarea,
  Button,
  Subheadline,
  Text,
} from "@telegram-apps/telegram-ui";
import { api, type UserConfig, type ChatConfig } from "../api";

export function PreferencesSection() {
  const [config, setConfig] = useState<UserConfig>({});
  const [chatConfig, setChatConfig] = useState<ChatConfig>({ fastMode: false, voiceMode: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    Promise.all([api.getConfig(), api.getChatConfig()])
      .then(([cfg, chatCfg]) => {
        setConfig(cfg);
        setChatConfig(chatCfg);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateConfig = (patch: Partial<UserConfig>) => {
    setConfig((c) => ({ ...c, ...patch }));
    setDirty(true);
  };

  const toggleChat = async (key: "fastMode" | "voiceMode") => {
    const next = { [key]: !chatConfig[key] };
    setChatConfig((c) => ({ ...c, ...next }));
    try {
      const updated = await api.updateChatConfig(next);
      setChatConfig(updated);
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    } catch (e) {
      window.Telegram.WebApp.showAlert(`Failed: ${e}`);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.updateConfig(config);
      setConfig(updated);
      setDirty(false);
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    } catch (e) {
      window.Telegram.WebApp.showAlert(`Failed: ${e}`);
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
      <Section header="Chat Toggles" footer="Per-chat behavior settings">
        <Cell
          after={
            <Switch
              checked={chatConfig.fastMode}
              onChange={() => toggleChat("fastMode")}
            />
          }
        >
          <Subheadline>Fast Mode</Subheadline>
          <Text style={{ fontSize: "12px", opacity: 0.6, marginTop: "2px" }}>
            Use local Ollama for ultra-low latency responses
          </Text>
        </Cell>

        <Cell
          after={
            <Switch
              checked={chatConfig.voiceMode}
              onChange={() => toggleChat("voiceMode")}
            />
          }
        >
          <Subheadline>Voice Mode</Subheadline>
          <Text style={{ fontSize: "12px", opacity: 0.6, marginTop: "2px" }}>
            Send responses as voice notes via ElevenLabs TTS
          </Text>
        </Cell>
      </Section>

      <Section header="System Prompt" footer="Customize the bot's personality">
        <Cell>
          <Subheadline>Custom Instructions</Subheadline>
          <Textarea
            value={config.systemPrompt ?? ""}
            onChange={(e) => updateConfig({ systemPrompt: e.target.value || undefined })}
            placeholder="e.g. Always respond in Spanish. Be more formal."
            rows={5}
          />
          <Text style={{ fontSize: "12px", opacity: 0.6, marginTop: "4px" }}>
            Append to the default system prompt
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
