import { useState, useEffect } from "react";
import {
  List,
  Section,
  Cell,
  Button,
  Text,
} from "@telegram-apps/telegram-ui";
import { api, type MemoryEntry } from "../api";

export function MemorySection() {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.getMemories().then(setMemories).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = (chatId: number, id: string) => {
    window.Telegram.WebApp.showConfirm("Delete this memory?", async (ok) => {
      if (!ok) return;
      try {
        await api.deleteMemory(chatId, id);
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

  return (
    <List>
      <Section header="Saved Memories" footer={`${memories.length} memories across all chats`}>
        {memories.length === 0 ? (
          <Cell>
            <Text style={{ opacity: 0.6 }}>
              No memories saved yet. The bot automatically saves important information during conversations.
            </Text>
          </Cell>
        ) : (
          memories.map((m) => (
            <Cell key={m.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", width: "100%" }}>
                <div style={{ flex: 1 }}>
                  <Text>{m.content}</Text>
                  <Text style={{ fontSize: "11px", opacity: 0.5, marginTop: "4px" }}>
                    {new Date(m.createdAt).toLocaleDateString()} · {m.id}
                  </Text>
                </div>
                <Button
                  size="s"
                  mode="bezeled"
                  onClick={() => {
                    const chatId = Number(m.id.split("_")[0]) || 0;
                    handleDelete(chatId, m.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </Cell>
          ))
        )}
      </Section>
    </List>
  );
}
