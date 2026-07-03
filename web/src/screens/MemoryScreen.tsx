import { useMemo } from "react";
import { useApp } from "../store";
import { Caption, Footnote, LargeTitle, Section, EmptyState } from "../components/ui";
import { List } from "../components/Row";
import { Row } from "../components/Row";
import { Icon } from "../components/Icon";
import { formatDate } from "../lib/format";

export function MemoryScreen() {
  const { memories, deleteMemory } = useApp();

  const grouped = useMemo(() => {
    const map = new Map<number, typeof memories>();
    for (const m of memories) {
      const arr = map.get(m.chatId) ?? [];
      arr.push(m);
      map.set(m.chatId, arr);
    }
    return [...map.entries()];
  }, [memories]);

  return (
    <div className="fade-in">
      <LargeTitle>Memory</LargeTitle>

      {memories.length === 0 ? (
        <Section>
          <div className="glass">
            <EmptyState
              icon={Icon.Book}
              title="No memories yet"
              sub="Ask Skye to remember something during a chat and it will appear here."
            />
          </div>
        </Section>
      ) : (
        grouped.map(([chatId, items]) => (
          <Section key={chatId}>
            <Caption>Chat {chatId}</Caption>
            <List>
              {items.map((m) => (
                <Row
                  key={m.id}
                  icon={Icon.CircleStack}
                  color="c-orange"
                  title={m.content}
                  multiline
                  subtitle={formatDate(m.createdAt)}
                  onClick={() => deleteMemory(m)}
                  chevron={false}
                  trailing={
                    <span className="chevron" style={{ color: "var(--destructive)", opacity: 0.7 }}>
                      <Icon.Trash />
                    </span>
                  }
                />
              ))}
            </List>
          </Section>
        ))
      )}

      {memories.length > 0 && (
        <Footnote>
          Tap a memory to delete it. Memories are scoped to a specific chat — clearing them only affects
          that chat's history.
        </Footnote>
      )}
    </div>
  );
}
