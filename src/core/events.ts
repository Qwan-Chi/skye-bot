/**
 * Tiny typed pub-sub for cross-module signals.
 *
 * Modules augment SkyeEvents to declare payload types:
 *
 *   declare module "../../core/events.js" {
 *     interface SkyeEvents {
 *       "chat.message.in": { chatId: number; userId: number; text: string };
 *     }
 *   }
 */
export interface SkyeEvents {
  [key: string]: unknown;
}

type Listener<T> = (payload: T) => void | Promise<void>;

export class EventBus {
  private listeners = new Map<string, Set<Listener<unknown>>>();

  on<K extends keyof SkyeEvents>(event: K, fn: Listener<SkyeEvents[K]>): () => void;
  on(event: string, fn: Listener<unknown>): () => void;
  on(event: string, fn: Listener<unknown>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(fn);
    return () => set!.delete(fn);
  }

  emit<K extends keyof SkyeEvents>(event: K, payload: SkyeEvents[K]): void;
  emit(event: string, payload: unknown): void;
  emit(event: string, payload: unknown): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const fn of set) {
      try {
        const r = fn(payload);
        if (r instanceof Promise) r.catch(() => {});
      } catch {
        // swallow listener errors to keep the bus decoupled
      }
    }
  }
}
