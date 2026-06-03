import type { ChatConfigService } from "../chatConfig/service.js";
import type { UserConfigService } from "../userConfig/service.js";
import type { ApiCredentials } from "../llm/client.js";

export interface AccessDeps {
  chatConfig: ChatConfigService;
  userConfig: UserConfigService;
  allowedIds: Set<number>;
  defaultBaseUrl: string;
  defaultModel: string;
}

/**
 * Resolve which API credentials (if any) to use for a given chat+user pair.
 * Precedence:
 *   1. chat is allow-listed → user's personal key, else "no creds" (use globals)
 *   2. user has personal key → use it
 *   3. chat has its own key → use it
 *   4. nothing → undefined
 */
export function resolveCredentials(
  deps: AccessDeps,
  chatId: number,
  userId?: number
): ApiCredentials | undefined {
  const cfg = deps.chatConfig.get(chatId);
  if (deps.allowedIds.has(chatId)) {
    if (userId) {
      const userCfg = deps.userConfig.get(userId);
      if (userCfg.apiKey) {
        return {
          apiKey: userCfg.apiKey,
          baseUrl: userCfg.baseUrl ?? deps.defaultBaseUrl,
          model: userCfg.model,
        };
      }
    }
    return undefined;
  }
  if (userId) {
    const userCfg = deps.userConfig.get(userId);
    if (userCfg.apiKey) {
      return {
        apiKey: userCfg.apiKey,
        baseUrl: userCfg.baseUrl ?? deps.defaultBaseUrl,
        model: userCfg.model,
      };
    }
  }
  if (!cfg.apiKey) return undefined;
  return {
    apiKey: cfg.apiKey,
    baseUrl: cfg.baseUrl ?? deps.defaultBaseUrl,
  };
}

export function hasAccess(deps: AccessDeps, chatId: number, userId?: number): boolean {
  if (deps.allowedIds.has(chatId)) return true;
  const cfg = deps.chatConfig.get(chatId);
  if (cfg.apiKey) return true;
  if (userId) {
    const userCfg = deps.userConfig.get(userId);
    return !!userCfg.apiKey;
  }
  return false;
}
