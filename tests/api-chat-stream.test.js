import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mocks ----
vi.mock('@/lib/auth', () => ({
  getUser: vi.fn(),
}));

vi.mock('@/lib/claude', () => ({
  getChatResponseStream: vi.fn(),
}));

vi.mock('@/lib/knowledgeBase', () => ({
  loadKnowledgeBase: vi.fn().mockResolvedValue(undefined),
  searchKnowledgeBase: vi.fn(),
}));

vi.mock('@/lib/search', () => ({
  webSearch: vi.fn(),
}));

vi.mock('@/lib/prompts', () => ({
  SYSTEM_PROMPT: 'You are a test bot.',
  buildUserPrompt: vi.fn().mockReturnValue('built prompt'),
  shouldTriggerSearch: vi.fn().mockReturnValue(false),
  buildRoleContext: vi.fn().mockReturnValue(''),
}));

vi.mock('@/lib/database', () => ({
  logQuery: vi.fn().mockResolvedValue(undefined),
  getCampusMemoryContext: vi.fn().mockResolvedValue(''),
}));

vi.mock('@/lib/rateLimit', () => ({
  chatLimiter: vi.fn().mockReturnValue({ limited: false, remaining: 10 }),
}));

vi.mock('@/lib/validation', () => ({
  validateChatInput: vi.fn().mockReturnValue({ valid: true }),
}));

// ---- Imports ----
import { POST } from '@/app/api/chat/stream/route';
import { validateChatInput } from '@/lib/validation';
import { getUser } from '@/lib/auth';
import { getChatResponseStream } from '@/lib/claude';
import { searchKnowledgeBase } from '@/lib/knowledgeBase';

// ---- Helpers ----
function makeRequest(body) {
  return new Request('http://localhost/api/chat/stream', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeMockStream() {
  const handlers = {};
  return {
    on: vi.fn((event, handler) => {
      handlers[event] = handler;
    }),
    finalMessage: vi.fn().mockResolvedValue({
      usage: { input_tokens: 100, output_tokens: 50 },
    }),
    // Helper to simulate text events in tests
    _emit: (event, data) => {
      if (handlers[event]) handlers[event](data);
    },
  };
}

// ---- Tests ----
describe('POST /api/chat/stream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue(null);
    searchKnowledgeBase.mockReturnValue([
      { file: 'faq.md', header: 'Hours', score: 0.9, sourceUrl: 'https://example.com', sourceLabel: 'FAQ' },
    ]);
  });

  it('returns 400 when message is missing', async () => {
    validateChatInput.mockReturnValueOnce({ valid: false, error: 'Message is required' });
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Message is required');
  });

  it('returns 400 when message is not a string', async () => {
    validateChatInput.mockReturnValueOnce({ valid: false, error: 'Message is required' });
    const response = await POST(makeRequest({ message: 42 }));
    expect(response.status).toBe(400);
  });

  it('returns a Response with Content-Type text/event-stream', async () => {
    const mockStream = makeMockStream();
    getChatResponseStream.mockResolvedValue(mockStream);

    const response = await POST(makeRequest({ message: 'Hello' }));
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    expect(response.headers.get('Cache-Control')).toBe('no-cache');
  });

  it('returns a ReadableStream as the body', async () => {
    const mockStream = makeMockStream();
    getChatResponseStream.mockResolvedValue(mockStream);

    const response = await POST(makeRequest({ message: 'Hello' }));
    expect(response.body).toBeInstanceOf(ReadableStream);
  });

  it('streams sources as the first event', async () => {
    const mockStream = makeMockStream();
    getChatResponseStream.mockResolvedValue(mockStream);

    const response = await POST(makeRequest({ message: 'Hello' }));
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const { value } = await reader.read();
    const text = decoder.decode(value);
    expect(text).toContain('"type":"sources"');
    expect(text).toContain('"sources"');

    reader.releaseLock();
  });
});
