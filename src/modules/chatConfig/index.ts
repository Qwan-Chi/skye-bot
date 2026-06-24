import type { SkyeModule } from "../../core/module.js";
import { migrations } from "./migrations.js";
import { buildRoutes } from "./routes.js";
import { sendRichReply } from "../telegram/helpers.js";
import {
  chatConfigService,
  getChatConfig,
  setChatVoiceMode,
  type ChatConfigService,
} from "./service.js";

declare module "../../core/module.js" {
  interface SkyeServices {
    chatConfig: ChatConfigService;
  }
}

export const chatConfigModule: SkyeModule = {
  name: "chatConfig",
  migrations,
  init(ctx) {
    ctx.services.set("chatConfig", chatConfigService);
    return {
      service: chatConfigService,
      panelRoutes: buildRoutes(ctx),
      commands: [
        {
          name: "voice",
          description: "Toggle voice note responses",
          public: true,
          handler: async (ctx, tenant) => {
            const cfg = getChatConfig(tenant.chatId);
            const newState = !cfg.voiceMode;
            setChatVoiceMode(tenant.chatId, newState);
            await sendRichReply(
              ctx,
              newState
                ? "🎙 **Voice mode ON**\n\n_Text responses will be sent as voice notes._"
                : "📝 **Voice mode OFF**\n\n_Responses will be sent as text._"
            );
          },
        },
      ],
    };
  },
};
