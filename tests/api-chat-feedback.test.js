import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/chat/feedback/route';

// ---- Helpers ----
function makeRequest(body) {
  return new Request('http://localhost/api/chat/feedback', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// ---- Tests ----
describe('POST /api/chat/feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns success true', async () => {
    const response = await POST(
      makeRequest({ messageId: 'msg-1', helpful: true, comment: 'Great answer!' })
    );
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({ success: true });
  });

  it('accepts messageId, helpful, and comment fields', async () => {
    const body = { messageId: 'msg-42', helpful: false, comment: 'Not useful' };
    const response = await POST(makeRequest(body));
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('returns success even with minimal fields', async () => {
    const response = await POST(makeRequest({ messageId: 'msg-1' }));
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('returns 500 when request body is invalid JSON', async () => {
    const request = new Request('http://localhost/api/chat/feedback', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBe('Internal server error');
  });
});
