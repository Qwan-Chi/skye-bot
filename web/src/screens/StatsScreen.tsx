import { useApp } from "../store";
import { Caption, Footnote, LargeTitle, Section } from "../components/ui";
import { List } from "../components/Row";
import { Row } from "../components/Row";
import { Icon } from "../components/Icon";

export function StatsScreen() {
  const { stats } = useApp();

  const tiles = [
    { icon: Icon.ChartBar, color: "c-blue", label: "Total Requests", value: stats.totalRequests },
    { icon: Icon.Calendar, color: "c-indigo", label: "Today", value: stats.requestsToday },
    { icon: Icon.Clock, color: "c-teal", label: "Avg Latency", value: `${Math.round(stats.avgLatencyMs)} ms` },
    { icon: Icon.Warning, color: "c-red", label: "Error Rate", value: `${(stats.errorRate * 100).toFixed(1)}%` },
  ] as const;

  return (
    <div className="fade-in">
      <LargeTitle>Usage</LargeTitle>
      <Section>
        <Caption>Activity</Caption>
        <List>
          {tiles.map((t) => (
            <Row
              key={t.label}
              icon={t.icon}
              color={t.color}
              title={t.label}
              chevron={false}
              trailing={<span className="row-value">{t.value}</span>}
            />
          ))}
        </List>
        <Footnote>
          Computed from the server-side audit log. Older entries are pruned automatically.
        </Footnote>
      </Section>
    </div>
  );
}
