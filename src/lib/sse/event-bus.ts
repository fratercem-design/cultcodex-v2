type Listener = (data: unknown) => void;

class EventBus {
  private channels = new Map<string, Set<Listener>>();

  subscribe(channel: string, listener: Listener): () => void {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    const listeners = this.channels.get(channel)!;
    listeners.add(listener);

    // Return unsubscribe function
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.channels.delete(channel);
      }
    };
  }

  publish(channel: string, data: unknown): void {
    const listeners = this.channels.get(channel);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(data);
        } catch (err) {
          console.error(`[EventBus] Error in listener for channel ${channel}:`, err);
        }
      }
    }
  }
}

export const eventBus = new EventBus();
