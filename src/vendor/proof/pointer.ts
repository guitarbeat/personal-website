type PointerSubscriber = (x: number, y: number) => void;

const subscribers = new Set<PointerSubscriber>();

function notifySubscribers(event: PointerEvent) {
  for (const subscriber of subscribers) {
    subscriber(event.clientX, event.clientY);
  }
}

export function subscribeToPointer(subscriber: PointerSubscriber): () => void {
  subscribers.add(subscriber);

  if (subscribers.size === 1) {
    window.addEventListener("pointermove", notifySubscribers, { passive: true });
  }

  return () => {
    subscribers.delete(subscriber);
    if (subscribers.size === 0) {
      window.removeEventListener("pointermove", notifySubscribers);
    }
  };
}
