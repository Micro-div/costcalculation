// A tiny module-level signal that flips to "ready" once the intro loader has
// finished. Entrance animations (the estimator card, hero heading, section
// reveals, feature cards) wait for this so they play as the site appears
// instead of finishing behind the loader.

type Listener = () => void;

let ready = false;
const listeners = new Set<Listener>();

export function markAppReady() {
  if (ready) return;
  ready = true;
  const pending = Array.from(listeners);
  listeners.clear();
  pending.forEach((listener) => listener());
}

export function isAppReady() {
  return ready;
}

export function subscribeAppReady(listener: Listener) {
  if (ready) {
    listener();
    return () => {};
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
