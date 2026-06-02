import { useState, useEffect } from "react";
import { AppRoot, Tabbar } from "@telegram-apps/telegram-ui";
import { Icon28Chat } from "@telegram-apps/telegram-ui/dist/icons/28/chat";
import { Icon28Devices } from "@telegram-apps/telegram-ui/dist/icons/28/devices";
import { Icon28Edit } from "@telegram-apps/telegram-ui/dist/icons/28/edit";
import { Icon28Archive } from "@telegram-apps/telegram-ui/dist/icons/28/archive";
import { Icon28Stats } from "@telegram-apps/telegram-ui/dist/icons/28/stats";
import { ConfigSection } from "./sections/ConfigSection";
import { McpSection } from "./sections/McpSection";
import { PreferencesSection } from "./sections/PreferencesSection";
import { MemorySection } from "./sections/MemorySection";
import { StatsSection } from "./sections/StatsSection";

type Tab = "config" | "mcp" | "prefs" | "memory" | "stats";

export function App() {
  const [tab, setTab] = useState<Tab>("config");

  useEffect(() => {
    const handler = () => {
      const tg = window.Telegram.WebApp;
      if (tg.colorScheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };
    handler();
    window.Telegram.WebApp.onEvent("themeChanged", handler);
    return () => window.Telegram.WebApp.offEvent("themeChanged", handler);
  }, []);

  return (
    <AppRoot>
      <div style={{ paddingBottom: "80px" }}>
        {tab === "config" && <ConfigSection />}
        {tab === "mcp" && <McpSection />}
        {tab === "prefs" && <PreferencesSection />}
        {tab === "memory" && <MemorySection />}
        {tab === "stats" && <StatsSection />}
      </div>

      <Tabbar>
        <Tabbar.Item selected={tab === "config"} onClick={() => setTab("config")} text="API">
          <Icon28Chat />
        </Tabbar.Item>
        <Tabbar.Item selected={tab === "mcp"} onClick={() => setTab("mcp")} text="MCP">
          <Icon28Devices />
        </Tabbar.Item>
        <Tabbar.Item selected={tab === "prefs"} onClick={() => setTab("prefs")} text="Prefs">
          <Icon28Edit />
        </Tabbar.Item>
        <Tabbar.Item selected={tab === "memory"} onClick={() => setTab("memory")} text="Memory">
          <Icon28Archive />
        </Tabbar.Item>
        <Tabbar.Item selected={tab === "stats"} onClick={() => setTab("stats")} text="Stats">
          <Icon28Stats />
        </Tabbar.Item>
      </Tabbar>
    </AppRoot>
  );
}
