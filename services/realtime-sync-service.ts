export type RealtimeSyncEvent = "chat_updated" | "notifications_updated";

type Listener = () => void;

const listeners = new Map<RealtimeSyncEvent, Set<Listener>>();

function ensureBucket(event: RealtimeSyncEvent): Set<Listener> {
  let bucket = listeners.get(event);
  if (!bucket) {
    bucket = new Set<Listener>();
    listeners.set(event, bucket);
  }
  return bucket;
}

export const realtimeSyncService = {
  emit(event: RealtimeSyncEvent) {
    const bucket = listeners.get(event);
    if (!bucket?.size) return;
    bucket.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        console.warn("[realtimeSyncService] listener failed", error);
      }
    });
  },

  subscribe(event: RealtimeSyncEvent, listener: Listener): () => void {
    const bucket = ensureBucket(event);
    bucket.add(listener);

    return () => {
      const target = listeners.get(event);
      if (!target) return;
      target.delete(listener);
      if (!target.size) {
        listeners.delete(event);
      }
    };
  },
};
