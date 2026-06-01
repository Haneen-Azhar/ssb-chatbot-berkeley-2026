import { describe, it, expect } from 'vitest';
import { rateLimit } from '@/lib/rateLimit';
import { validateChatInput, MAX_MESSAGE_LENGTH, MAX_HISTORY_LENGTH } from '@/lib/validation';

// ─── Rate Limiting ──────────────────────────────────────

describe('rateLimit', () => {
  it('allows requests under the limit', () => {
    const limiter = rateLimit({ windowMs: 1000, max: 5 });
    const req = { headers: { get: () => '1.2.3.4' } };
    const result = limiter(req);
    expect(result.limited).toBe(false);
    expect(result.remaining).toBe(4);
  });

  it('blocks requests over the limit', () => {
    const limiter = rateLimit({ windowMs: 60000, max: 3 });
    const req = { headers: { get: () => '5.6.7.8' } };
    limiter(req);
    limiter(req);
    limiter(req);
    const result = limiter(req);
    expect(result.limited).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('tracks different IPs separately', () => {
    const limiter = rateLimit({ windowMs: 60000, max: 2 });
    const req1 = { headers: { get: () => '10.0.0.1' } };
    const req2 = { headers: { get: () => '10.0.0.2' } };
    limiter(req1);
    limiter(req1);
    expect(limiter(req1).limited).toBe(true);
    expect(limiter(req2).limited).toBe(false);
  });

  it('handles missing x-forwarded-for header', () => {
    const limiter = rateLimit({ windowMs: 1000, max: 5 });
    const req = { headers: { get: () => null } };
    const result = limiter(req);
    expect(result.limited).toBe(false);
  });

  it('resets after window expires', async () => {
    const limiter = rateLimit({ windowMs: 50, max: 1 });
    const req = { headers: { get: () => '99.99.99.99' } };
    limiter(req);
    expect(limiter(req).limited).toBe(true);
    await new Promise((r) => setTimeout(r, 60));
    expect(limiter(req).limited).toBe(false);
  });
});

// ─── Input Validation ───────────────────────────────────

describe('validateChatInput', () => {
  it('rejects null/undefined body', () => {
    expect(validateChatInput(null).valid).toBe(false);
    expect(validateChatInput(undefined).valid).toBe(false);
  });

  it('rejects missing message', () => {
    expect(validateChatInput({}).valid).toBe(false);
    expect(validateChatInput({ message: '' }).valid).toBe(false);
  });

  it('rejects non-string message', () => {
    expect(validateChatInput({ message: 123 }).valid).toBe(false);
    expect(validateChatInput({ message: [] }).valid).toBe(false);
  });

  it('accepts valid message', () => {
    expect(validateChatInput({ message: 'hello' }).valid).toBe(true);
  });

  it('rejects message over max length', () => {
    const longMsg = 'a'.repeat(MAX_MESSAGE_LENGTH + 1);
    const result = validateChatInput({ message: longMsg });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('too long');
  });

  it('accepts message at exactly max length', () => {
    const msg = 'a'.repeat(MAX_MESSAGE_LENGTH);
    expect(validateChatInput({ message: msg }).valid).toBe(true);
  });

  it('rejects non-array history', () => {
    expect(validateChatInput({ message: 'hi', history: 'not array' }).valid).toBe(false);
  });

  it('rejects history over max length', () => {
    const history = Array(MAX_HISTORY_LENGTH + 1).fill({ role: 'user', content: 'x' });
    expect(validateChatInput({ message: 'hi', history }).valid).toBe(false);
  });

  it('accepts valid history', () => {
    const history = [{ role: 'user', content: 'hello' }, { role: 'assistant', content: 'hi' }];
    expect(validateChatInput({ message: 'hi', history }).valid).toBe(true);
  });

  it('rejects history item with overly long content', () => {
    const history = [{ role: 'user', content: 'a'.repeat(10001) }];
    expect(validateChatInput({ message: 'hi', history }).valid).toBe(false);
  });
});

// ─── CORS (next.config.mjs) ─────────────────────────────

describe('CORS configuration', () => {
  it('next.config.mjs has headers function with CORS restrictions', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('next.config.mjs', 'utf-8');
    expect(content).toContain('Access-Control-Allow-Origin');
    expect(content).toContain('ssb-chatbot-berkeley-2026.vercel.app');
    expect(content).not.toContain("'*'"); // no wildcard CORS
  });
});
