import { useApp } from "../store";
import { Caption, Footnote, LargeTitle, Section, EmptyState } from "../components/ui";
import { List } from "../components/Row";
import { Row } from "../components/Row";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";

export function ToolsScreen() {
  const { mcpServers, openMcpEditor } = useApp();

  return (
    <div className="fade-in">
      <LargeTitle>Tools</LargeTitle>

      <Section>
        <Caption>MCP Servers</Caption>
        {mcpServers.length === 0 ? (
          <div className="glass">
            <EmptyState
              icon={Icon.Server}
              title="No servers connected"
              sub="Add an MCP server to expose extra tools to the model."
            />
          </div>
        ) : (
          <List>
            {mcpServers.map((s) => (
              <Row
                key={s.id}
                icon={Icon.Server}
                color="c-blue"
                title={s.name}
                subtitle={
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span className={`chip${s.toolCount > 0 ? "" : " chip-muted"}`}>
                      {s.toolCount} {s.toolCount === 1 ? "tool" : "tools"}
                    </span>
                    {s.connected ? "Connected" : "Disconnected"}
                  </span>
                }
                onClick={() => openMcpEditor(s)}
              />
            ))}
          </List>
        )}

        <Button variant="glass" icon={<Icon.Plus />} onClick={() => openMcpEditor(null)}>
          Add Server
        </Button>
        <Footnote>
          MCP servers expose extra tools to the LLM. Stdio and Streamable HTTP transports are supported.
        </Footnote>
      </Section>
    </div>
  );
}
