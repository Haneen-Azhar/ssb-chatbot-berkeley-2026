const store = new Map();

const CLEANUP_INTERVAL = 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now - entry.windowStart > entry.windowMs * 2) {
      store.delete(key);
    }
  }
}

export function rateLimit({ windowMs = 60 * 1000, max = 20 } = {}) {
  return function checkRate(request) {
    cleanup();

    const authHeader = request.headers.get('authorization');
    let key;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      key = 'user:' + token.slice(-16);
    } else {
      const forwarded = request.headers.get('x-forwarded-for');
      key = 'ip:' + (forwarded ? forwarded.split(',')[0].trim() : 'unknown');
    }

    const now = Date.now();
    let entry = store.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
      entry = { count: 0, windowStart: now, windowMs };
      store.set(key, entry);
    }

    entry.count++;

    if (entry.count > max) {
      return { limited: true, remaining: 0 };
    }

    return { limited: false, remaining: max - entry.count };
  };
}

export const chatLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
export const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
export const adminLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
