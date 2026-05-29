import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockSupabaseFrom = vi.fn();
const mockSupabase = { from: mockSupabaseFrom };

vi.mock('@/lib/supabase', () => ({
  createServerClient: vi.fn(() => mockSupabase),
}));

vi.mock('@/lib/auth', () => ({
  getUser: vi.fn(),
}));

import { GET, DELETE } from '@/app/api/chat/conversations/route';
import { getUser } from '@/lib/auth';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(url = 'http://localhost/api/chat/conversations') {
  return {
    url,
    headers: new Map([['authorization', 'Bearer test-token']]),
  };
}

function chainableQuery(data, error = null) {
  // Builds a chainable object for supabase .from().select().eq().order()
  const result = { data, error };
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(result),
    delete: vi.fn().mockReturnThis(),
  };
  // For DELETE, .eq after .delete should resolve at the end
  // The route calls: supabase.from('queries').delete().eq().eq()
  // The last .eq call ends the chain, so we need .eq to resolve
  return chain;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GET /api/chat/conversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty conversations when not authenticated', async () => {
    getUser.mockResolvedValue(null);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.conversations).toEqual([]);
  });

  it('returns conversations grouped by session_id', async () => {
    getUser.mockResolvedValue({ id: 'user-1' });

    const chain = chainableQuery([
      { session_id: 's1', message: 'Hello', response: 'Hi', created_at: '2026-05-01T10:00:00Z' },
      { session_id: 's1', message: 'How are you?', response: 'Good', created_at: '2026-05-01T10:01:00Z' },
      { session_id: 's2', message: 'Different convo', response: 'Sure', created_at: '2026-05-02T10:00:00Z' },
    ]);
    mockSupabaseFrom.mockReturnValue(chain);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.conversations).toHaveLength(2);
    const ids = body.conversations.map((c) => c.id);
    expect(ids).toContain('s1');
    expect(ids).toContain('s2');
  });

  it('conversations are sorted by updatedAt descending', async () => {
    getUser.mockResolvedValue({ id: 'user-1' });

    const chain = chainableQuery([
      { session_id: 'old', message: 'Old', response: 'R', created_at: '2026-01-01T00:00:00Z' },
      { session_id: 'new', message: 'New', response: 'R', created_at: '2026-05-28T00:00:00Z' },
      { session_id: 'mid', message: 'Mid', response: 'R', created_at: '2026-03-15T00:00:00Z' },
    ]);
    mockSupabaseFrom.mockReturnValue(chain);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.conversations[0].id).toBe('new');
    expect(body.conversations[1].id).toBe('mid');
    expect(body.conversations[2].id).toBe('old');
  });

  it('limits to 50 conversations max', async () => {
    getUser.mockResolvedValue({ id: 'user-1' });

    // Generate 60 unique sessions
    const rows = Array.from({ length: 60 }, (_, i) => ({
      session_id: `s-${i}`,
      message: `msg ${i}`,
      response: `res ${i}`,
      created_at: new Date(2026, 0, 1, i).toISOString(),
    }));

    const chain = chainableQuery(rows);
    mockSupabaseFrom.mockReturnValue(chain);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.conversations.length).toBeLessThanOrEqual(50);
  });

  it('each conversation has id, preview, messages, createdAt, updatedAt', async () => {
    getUser.mockResolvedValue({ id: 'user-1' });

    const chain = chainableQuery([
      { session_id: 's1', message: 'Hello world', response: 'Hi there', created_at: '2026-05-01T10:00:00Z' },
    ]);
    mockSupabaseFrom.mockReturnValue(chain);

    const res = await GET(makeRequest());
    const body = await res.json();
    const convo = body.conversations[0];

    expect(convo).toHaveProperty('id', 's1');
    expect(convo).toHaveProperty('preview');
    expect(convo).toHaveProperty('messages');
    expect(convo).toHaveProperty('createdAt');
    expect(convo).toHaveProperty('updatedAt');
  });

  it('messages alternate user/assistant roles', async () => {
    getUser.mockResolvedValue({ id: 'user-1' });

    const chain = chainableQuery([
      { session_id: 's1', message: 'Q1', response: 'A1', created_at: '2026-05-01T10:00:00Z' },
      { session_id: 's1', message: 'Q2', response: 'A2', created_at: '2026-05-01T10:01:00Z' },
    ]);
    mockSupabaseFrom.mockReturnValue(chain);

    const res = await GET(makeRequest());
    const body = await res.json();
    const msgs = body.conversations[0].messages;

    expect(msgs).toHaveLength(4);
    expect(msgs[0].role).toBe('user');
    expect(msgs[1].role).toBe('assistant');
    expect(msgs[2].role).toBe('user');
    expect(msgs[3].role).toBe('assistant');
  });

  it('preview is first message truncated to 60 chars', async () => {
    getUser.mockResolvedValue({ id: 'user-1' });

    const longMsg = 'A'.repeat(100);
    const chain = chainableQuery([
      { session_id: 's1', message: longMsg, response: 'Short', created_at: '2026-05-01T10:00:00Z' },
    ]);
    mockSupabaseFrom.mockReturnValue(chain);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.conversations[0].preview).toHaveLength(60);
    expect(body.conversations[0].preview).toBe(longMsg.slice(0, 60));
  });
});

describe('DELETE /api/chat/conversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    getUser.mockResolvedValue(null);

    const res = await DELETE(makeRequest('http://localhost/api/chat/conversations?session_id=s1'));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('returns 400 when session_id is missing', async () => {
    getUser.mockResolvedValue({ id: 'user-1' });

    const res = await DELETE(makeRequest('http://localhost/api/chat/conversations'));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('session_id');
  });

  it('returns success when valid', async () => {
    getUser.mockResolvedValue({ id: 'user-1' });

    const deleteChain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    mockSupabaseFrom.mockReturnValue(deleteChain);

    const res = await DELETE(makeRequest('http://localhost/api/chat/conversations?session_id=s1'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('calls supabase delete with correct user_id and session_id', async () => {
    getUser.mockResolvedValue({ id: 'user-42' });

    const deleteChain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    mockSupabaseFrom.mockReturnValue(deleteChain);

    await DELETE(makeRequest('http://localhost/api/chat/conversations?session_id=sess-abc'));

    expect(mockSupabaseFrom).toHaveBeenCalledWith('queries');
    expect(deleteChain.delete).toHaveBeenCalled();
    expect(deleteChain.eq).toHaveBeenCalledWith('user_id', 'user-42');
    expect(deleteChain.eq).toHaveBeenCalledWith('session_id', 'sess-abc');
  });
});
