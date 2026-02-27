// Some browser-side libraries still expect Node's `global` to exist.
// Define it early to prevent runtime crashes (e.g., sockjs-client under Vite).
const g = globalThis as any;
if (typeof g.global === 'undefined') {
  g.global = g;
}

