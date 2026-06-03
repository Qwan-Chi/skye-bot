import OpenAI from "openai";
import type {
  ResponseInputItem,
  ResponseFunctionToolCall,
} from "openai/resources/responses/responses.js";
import { log } from "../../utils/log.js";

export interface ApiCredentials {
  apiKey: string;
  baseUrl: string;
  model?: string;
}

export type { ResponseInputItem, ResponseFunctionToolCall };

export interface LlmModuleSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxCompletionTokens: number;
  /** Empty → falls back to apiKey. */
  imageApiKey: string;
  /** Empty → falls back to baseUrl. */
  imageBaseUrl: string;
  imageModel: string;
}

/**
 * Stateful LLM client bound to module config. Methods accept optional
 * per-request credentials override (per-user/per-chat keys).
 */
export class LlmClient {
  private globalClient: OpenAI;
  private supportsImagesCache: boolean | null = null;

  constructor(public readonly settings: LlmModuleSettings) {
    this.globalClient = new OpenAI({
      baseURL: settings.baseUrl,
      apiKey: settings.apiKey,
    });
  }

  private client(creds?: ApiCredentials): OpenAI {
    if (!creds) return this.globalClient;
    return new OpenAI({ baseURL: creds.baseUrl, apiKey: creds.apiKey });
  }

  /** One-shot non-streaming call. */
  ask(instructions: string, input: string, creds?: ApiCredentials) {
    return this.client(creds).responses.create({
      model: creds?.model ?? this.settings.model,
      instructions,
      input,
      max_output_tokens: this.settings.maxCompletionTokens,
    });
  }

  /** Streaming response. Caller drives events / awaits .finalResponse(). */
  askStream(
    instructions: string,
    input: ResponseInputItem[],
    tools?: { name: string; description: string; parameters: Record<string, unknown> }[],
    creds?: ApiCredentials
  ) {
    const openaiTools = tools?.length
      ? tools.map((t) => ({
          type: "function" as const,
          name: t.name,
          description: t.description,
          parameters: t.parameters,
          strict: false,
        }))
      : undefined;
    return this.client(creds).responses.stream({
      model: creds?.model ?? this.settings.model,
      instructions,
      input,
      max_output_tokens: this.settings.maxCompletionTokens,
      ...(openaiTools ? { tools: openaiTools } : {}),
    });
  }

  /** Probe OpenRouter /models once to learn image capability. */
  async checkCapabilities(): Promise<void> {
    try {
      const res = await fetch(`${this.settings.baseUrl}/models`);
      if (!res.ok) {
        log.warn(`Models endpoint returned ${res.status}, skipping capability check`);
        return;
      }
      const data = await res.json();
      const found = (data.data as { id: string; architecture?: { modality?: string } }[])?.find(
        (m) => m.id === this.settings.model
      );
      if (found) {
        const modality = found.architecture?.modality ?? "";
        this.supportsImagesCache = modality.toLowerCase().includes("image");
        log.info(
          `Model "${this.settings.model}" image support: ${this.supportsImagesCache} (modality: "${modality}")`
        );
      } else {
        log.warn(`Model "${this.settings.model}" not found in models list`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn(`Could not fetch model capabilities: ${msg}`);
    }
  }

  /** Cached result of checkCapabilities — null if unknown. */
  supportsImages(): boolean | null {
    return this.supportsImagesCache;
  }

  /**
   * Generate (or edit) an image via the configured image provider.
   * Uses IMAGE_BASE_URL/IMAGE_API_KEY when set, otherwise falls back to the
   * main chat creds. Always uses IMAGE_MODEL. Per-user creds intentionally
   * NOT consulted — image generation is a server-level capability.
   */
  async generateImage(prompt: string, imageUrl?: string): Promise<Buffer | null> {
    const apiKey = this.settings.imageApiKey || this.settings.apiKey;
    const baseUrl = this.settings.imageBaseUrl || this.settings.baseUrl;

    const content: unknown = imageUrl
      ? [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } },
        ]
      : prompt;

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.settings.imageModel,
        messages: [{ role: "user", content }],
        modalities: ["image", "text"],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Image generation failed (${res.status}): ${body}`);
    }

    const data: {
      choices?: { message?: { images?: { image_url: { url: string } }[] } }[];
    } = await res.json();
    const images = data.choices?.[0]?.message?.images;
    if (!images?.length) return null;

    const dataUrl = images[0].image_url.url;
    const base64 = dataUrl.split(",")[1];
    if (!base64) return null;

    return Buffer.from(base64, "base64");
  }
}
