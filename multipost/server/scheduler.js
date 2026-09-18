import { store } from './store.js';
import { publishPost } from './publisher.js';

const TICK_MS = 15_000;
const running = new Set();

/** Vong lap kiem tra bai hen gio, chay ngay trong tien trinh server. */
export function startScheduler() {
  const tick = async () => {
    let due;
    try { due = store.duePosts(); } catch (err) { console.error('[scheduler]', err.message); return; }
    for (const post of due) {
      if (running.has(post.id)) continue;
      running.add(post.id);
      console.log(`[scheduler] dang bai hen gio ${post.id}`);
      publishPost(post.id)
        .then((p) => console.log(`[scheduler] ${post.id} -> ${p.status}`))
        .catch((err) => {
          console.error(`[scheduler] ${post.id} loi:`, err.message);
          store.updatePost(post.id, { status: 'failed', error: err.message });
        })
        .finally(() => running.delete(post.id));
    }
  };
  tick();
  const timer = setInterval(tick, TICK_MS);
  timer.unref?.();
  return () => clearInterval(timer);
}
