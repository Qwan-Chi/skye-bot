import { useState, useEffect } from "react";
import {
  List,
  Section,
  Cell,
  Subheadline,
  Text,
} from "@telegram-apps/telegram-ui";
import { api, type UsageStats } from "../api";

export function StatsSection() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getUsageStats().then(setStats).finally(() => setLoading(false));
  }, []);

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

  if (!stats) {
    return (
      <List>
        <Section>
          <Cell>
            <Text style={{ opacity: 0.6 }}>No data available</Text>
          </Cell>
        </Section>
      </List>
    );
  }

  return (
    <List>
      <Section header="Usage Statistics" footer="Your request history">
        <Cell>
          <Subheadline>Total Requests</Subheadline>
          <Text style={{ fontSize: "24px", fontWeight: 600, marginTop: "4px" }}>
            {stats.totalRequests.toLocaleString()}
          </Text>
        </Cell>

        <Cell>
          <Subheadline>Today</Subheadline>
          <Text style={{ fontSize: "24px", fontWeight: 600, marginTop: "4px" }}>
            {stats.requestsToday.toLocaleString()}
          </Text>
        </Cell>

        <Cell>
          <Subheadline>Avg Latency</Subheadline>
          <Text style={{ fontSize: "24px", fontWeight: 600, marginTop: "4px" }}>
            {Math.round(stats.avgLatencyMs)}ms
          </Text>
        </Cell>

        <Cell>
          <Subheadline>Error Rate</Subheadline>
          <Text
            style={{
              fontSize: "24px",
              fontWeight: 600,
              marginTop: "4px",
              color: stats.errorRate > 0.1 ? "#ff3b30" : undefined,
            }}
          >
            {(stats.errorRate * 100).toFixed(1)}%
          </Text>
        </Cell>
      </Section>
    </List>
  );
}
