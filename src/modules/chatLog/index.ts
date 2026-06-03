import type { SkyeModule } from "../../core/module.js";
import { migrations } from "./migrations.js";
import { chatLogService, setLlmClient, type ChatLogService } from "./service.js";

declare module "../../core/module.js" {
  interface SkyeServices {
    chatLog: ChatLogService;
  }
}

export const chatLogModule: SkyeModule = {
  name: "chatLog",
  migrations,
  init(ctx) {
    // chatLog depends on llm; llm module is initialized earlier in modules[].
    setLlmClient(ctx.services.get("llm"));
    return { service: chatLogService };
  },
};
