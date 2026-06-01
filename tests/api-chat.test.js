import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mocks ----
vi.mock('@/lib/auth', () => ({
  getUser: vi.fn(),
}));

vi.mock('@/lib/claude', () => ({
  getChatResponse: vi.fn(),
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

// ---- Imports (after mocks) ----
import { POST } from '@/app/api/chat/route';
import { getUser } from '@/lib/auth';
import { getChatResponse } from '@/lib/claude';
import { searchKnowledgeBase } from '@/lib/knowledgeBase';
import { buildRoleContext } from '@/lib/prompts';
import { logQuery } from '@/lib/database';
import { validateChatInput } from '@/lib/validation';

// ---- Helpers ----
function makeRequest(body) {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const defaultKbResults = [
  { file: 'faq.md', header: 'Hours', score: 0.9, sourceUrl: 'https://example.com', sourceLabel: 'FAQ' },
];

const defaultChatResult = {
  success: true,
  response: 'Here is my answer.',
  usage: { inputTokens: 100, outputTokens: 50 },
};

// ---- Tests ----
describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue(null);
    searchKnowledgeBase.mockReturnValue(defaultKbResults);
    getChatResponse.mockResolvedValue(defaultChatResult);
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
    const response = await POST(makeRequest({ message: 123 }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Message is required');
  });

  it('returns 400 when message is an empty string', async () => {
    validateChatInput.mockReturnValueOnce({ valid: false, error: 'Message is required' });
    const response = await POST(makeRequest({ message: '' }));
    expect(response.status).toBe(400);
  });

  it('returns success response with response, sources, and usage', async () => {
    const response = await POST(makeRequest({ message: 'What are the hours?' }));
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.response).toBe('Here is my answer.');
    expect(data.sources).toEqual([
      { file: 'faq.md', header: 'Hours', score: 0.9, sourceUrl: 'https://example.com', sourceLabel: 'FAQ' },
    ]);
    expect(data.usage).toEqual({ inputTokens: 100, outputTokens: 50 });
    expect(data.responseTimeMs).toEqual(expect.any(Number));
  });

  it('calls searchKnowledgeBase with the user message', async () => {
    await POST(makeRequest({ message: 'Tell me about curfew' }));
    expect(searchKnowledgeBase).toHaveBeenCalledWith('Tell me about curfew');
  });

  it('calls buildRoleContext with user profile when authenticated', async () => {
    const profile = { role: 'mentor', name: 'Test User' };
    getUser.mockResolvedValue({ id: 'user-1', profile });

    await POST(makeRequest({ message: 'Hello' }));
    expect(buildRoleContext).toHaveBeenCalledWith(profile);
  });

  it('calls buildRoleContext with undefined when not authenticated', async () => {
    getUser.mockResolvedValue(null);

    await POST(makeRequest({ message: 'Hello' }));
    expect(buildRoleContext).toHaveBeenCalledWith(undefined);
  });

  it('calls logQuery when user is authenticated', async () => {
    getUser.mockResolvedValue({ id: 'user-1', profile: { role: 'mentor' } });

    await POST(makeRequest({ message: 'Help me', sessionId: 'sess-1' }));

    // logQuery is called asynchronously with .catch, so give it a tick
    await new Promise((r) => setTimeout(r, 0));

    expect(logQuery).toHaveBeenCalledTimes(1);
    expect(logQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        sessionId: 'sess-1',
        message: 'Help me',
        response: 'Here is my answer.',
      })
    );
  });

  it('does NOT call logQuery when user is not authenticated', async () => {
    getUser.mockResolvedValue(null);

    await POST(makeRequest({ message: 'Help me' }));
    await new Promise((r) => setTimeout(r, 0));

    expect(logQuery).not.toHaveBeenCalled();
  });

  it('generates a sessionId when none is provided', async () => {
    getUser.mockResolvedValue({ id: 'user-1', profile: {} });

    await POST(makeRequest({ message: 'Test' }));
    await new Promise((r) => setTimeout(r, 0));

    expect(logQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: expect.any(String),
      })
    );
  });

  it('uses the provided sessionId from request body', async () => {
    getUser.mockResolvedValue({ id: 'user-1', profile: {} });

    await POST(makeRequest({ message: 'Test', sessionId: 'my-session' }));
    await new Promise((r) => setTimeout(r, 0));

    expect(logQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'my-session',
      })
    );
  });

  it('returns 500 when getChatResponse fails', async () => {
    getChatResponse.mockResolvedValue({ success: false, error: 'Model error' });

    const response = await POST(makeRequest({ message: 'Hello' }));
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Model error');
  });

  it('includes searchUsed in the response', async () => {
    const response = await POST(makeRequest({ message: 'Hello' }));
    const data = await response.json();
    expect(data).toHaveProperty('searchUsed');
    expect(typeof data.searchUsed).toBe('boolean');
  });
});
