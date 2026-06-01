// Simple in-memory rate limiter for serverless
// Tracks requests per IP with a sliding window

const store = new Map();

const CLEANUP_INTERVAL = 60 * 1000; // clean old entries every 60s
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

    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const key = ip;

    const now = Date.now();
    let entry = store.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
      entry = { count: 0, windowStart: now, windowMs };
      store.set(key, entry);
    }

    entry.count++;

    if (entry.count > max) {
      console.warn(`Rate limit exceeded: ${ip} (${entry.count}/${max} in ${windowMs}ms)`);
      return { limited: true, remaining: 0 };
    }

    return { limited: false, remaining: max - entry.count };
  };
}

// Pre-configured limiters
export const chatLimiter = rateLimit({ windowMs: 60 * 1000, max: 15 }); // 15 msgs/min
export const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 }); // 10 auth attempts/min
export const adminLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 }); // 30 admin requests/min
