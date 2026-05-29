import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  it('includes a valid ISO timestamp', async () => {
    const before = new Date().toISOString();
    const response = await GET();
    const data = await response.json();
    const after = new Date().toISOString();

    expect(data.timestamp).toBeDefined();
    // Verify it parses as a valid date
    const parsed = new Date(data.timestamp);
    expect(parsed.toString()).not.toBe('Invalid Date');
    // Verify it is within the test window
    expect(data.timestamp >= before).toBe(true);
    expect(data.timestamp <= after).toBe(true);
  });

  it('returns version exactly 2.0.0', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.version).toBe('2.0.0');
  });

  it('returns all three expected fields', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data).toEqual(
      expect.objectContaining({
        status: 'ok',
        timestamp: expect.any(String),
        version: '2.0.0',
      })
    );
  });
});
