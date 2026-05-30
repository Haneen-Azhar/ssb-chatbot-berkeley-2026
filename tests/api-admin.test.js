import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mocks ----
vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/database', () => ({
  getAdminOverview: vi.fn(),
  getAdminQueries: vi.fn(),
  getAdminUsers: vi.fn(),
  getAdminTopics: vi.fn(),
}));

vi.mock('@anthropic-ai/sdk', () => {
  const MockAnthropic = function () {
    this.messages = {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              overview: 'Staff are mostly asking about policies.',
              staffInsights: [
                { name: 'Alice', role: 'Mentor', insight: 'Needs help with curfew rules.' },
              ],
            }),
          },
        ],
      }),
    };
  };
  return { default: MockAnthropic };
});

// ---- Imports ----
import { requireAdmin } from '@/lib/auth';
import { getAdminOverview, getAdminQueries, getAdminUsers, getAdminTopics } from '@/lib/database';

// Import route handlers
import { GET as overviewGET } from '@/app/api/admin/route';
import { GET as queriesGET } from '@/app/api/admin/queries/route';
import { GET as usersGET } from '@/app/api/admin/users/route';
import { GET as topicsGET } from '@/app/api/admin/topics/route';
import { GET as analyzeGET } from '@/app/api/admin/analyze/route';

// ---- Helpers ----
function makeRequest(path = '/api/admin', query = '') {
  return new Request(`http://localhost${path}${query}`, { method: 'GET' });
}

// ==============================
// Admin Overview Route
// ==============================
describe('GET /api/admin (overview)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 when not admin', async () => {
    requireAdmin.mockResolvedValue(null);

    const response = await overviewGET(makeRequest());
    expect(response.status).toBe(403);

    const data = await response.json();
    expect(data.error).toBe('Forbidden');
  });

  it('returns overview stats when admin', async () => {
    requireAdmin.mockResolvedValue({ id: 'admin-1' });
    const overview = { totalUsers: 10, totalQueries: 50, avgResponseTime: 230 };
    getAdminOverview.mockResolvedValue(overview);

    const response = await overviewGET(makeRequest());
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual(overview);
  });

  it('returns 500 when getAdminOverview throws', async () => {
    requireAdmin.mockResolvedValue({ id: 'admin-1' });
    getAdminOverview.mockRejectedValue(new Error('DB error'));

    const response = await overviewGET(makeRequest());
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBe('Internal server error');
  });
});

// ==============================
// Admin Queries Route
// ==============================
describe('GET /api/admin/queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 when not admin', async () => {
    requireAdmin.mockResolvedValue(null);

    const response = await queriesGET(makeRequest('/api/admin/queries'));
    expect(response.status).toBe(403);

    const data = await response.json();
    expect(data.error).toBe('Forbidden');
  });

  it('returns paginated queries with default params', async () => {
    requireAdmin.mockResolvedValue({ id: 'admin-1' });
    const result = { data: [{ id: 1, message: 'test' }], total: 1 };
    getAdminQueries.mockResolvedValue(result);

    const response = await queriesGET(makeRequest('/api/admin/queries'));
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual(result);
    expect(getAdminQueries).toHaveBeenCalledWith({
      page: 1,
      pageSize: 50,
      userId: undefined,
      role: undefined,
      sessionFilter: null,
    });
  });

  it('accepts page, pageSize, user_id, and role params', async () => {
    requireAdmin.mockResolvedValue({ id: 'admin-1' });
    getAdminQueries.mockResolvedValue({ data: [], total: 0 });

    const response = await queriesGET(
      makeRequest('/api/admin/queries', '?page=2&pageSize=10&user_id=u-1&role=mentor')
    );
    expect(response.status).toBe(200);

    expect(getAdminQueries).toHaveBeenCalledWith({
      page: 2,
      pageSize: 10,
      userId: 'u-1',
      role: 'mentor',
      sessionFilter: null,
    });
  });

  it('returns 500 when getAdminQueries throws', async () => {
    requireAdmin.mockResolvedValue({ id: 'admin-1' });
    getAdminQueries.mockRejectedValue(new Error('DB error'));

    const response = await queriesGET(makeRequest('/api/admin/queries'));
    expect(response.status).toBe(500);
  });
});

// ==============================
// Admin Users Route
// ==============================
describe('GET /api/admin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 when not admin', async () => {
    requireAdmin.mockResolvedValue(null);

    const response = await usersGET(makeRequest('/api/admin/users'));
    expect(response.status).toBe(403);

    const data = await response.json();
    expect(data.error).toBe('Forbidden');
  });

  it('returns users list when admin', async () => {
    requireAdmin.mockResolvedValue({ id: 'admin-1' });
    const users = [
      { id: 'u-1', name: 'Alice', email: 'alice@example.com', role: 'mentor' },
      { id: 'u-2', name: 'Bob', email: 'bob@example.com', role: 'cd' },
    ];
    getAdminUsers.mockResolvedValue(users);

    const response = await usersGET(makeRequest('/api/admin/users'));
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual(users);
  });

  it('returns 500 when getAdminUsers throws', async () => {
    requireAdmin.mockResolvedValue({ id: 'admin-1' });
    getAdminUsers.mockRejectedValue(new Error('DB error'));

    const response = await usersGET(makeRequest('/api/admin/users'));
    expect(response.status).toBe(500);
  });
});

// ==============================
// Admin Topics Route
// ==============================
describe('GET /api/admin/topics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 when not admin', async () => {
    requireAdmin.mockResolvedValue(null);

    const response = await topicsGET(makeRequest('/api/admin/topics'));
    expect(response.status).toBe(403);

    const data = await response.json();
    expect(data.error).toBe('Forbidden');
  });

  it('returns topics list when admin', async () => {
    requireAdmin.mockResolvedValue({ id: 'admin-1' });
    const topics = [
      { topic: 'curfew', count: 12 },
      { topic: 'meals', count: 8 },
    ];
    getAdminTopics.mockResolvedValue(topics);

    const response = await topicsGET(makeRequest('/api/admin/topics'));
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual(topics);
  });

  it('returns 500 when getAdminTopics throws', async () => {
    requireAdmin.mockResolvedValue({ id: 'admin-1' });
    getAdminTopics.mockRejectedValue(new Error('DB error'));

    const response = await topicsGET(makeRequest('/api/admin/topics'));
    expect(response.status).toBe(500);
  });
});

// ==============================
// Admin Analyze Route
// ==============================
describe('GET /api/admin/analyze', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 when not admin', async () => {
    requireAdmin.mockResolvedValue(null);

    const response = await analyzeGET(makeRequest('/api/admin/analyze'));
    expect(response.status).toBe(403);

    const data = await response.json();
    expect(data.error).toBe('Forbidden');
  });

  it('returns analysis with totalQueries, topCategories, overview, staffInsights', async () => {
    requireAdmin.mockResolvedValue({ id: 'admin-1' });
    getAdminQueries.mockResolvedValue({
      data: [
        { user_id: 'u-1', message: 'What is curfew?' },
        { user_id: 'u-2', message: 'When are meals?' },
      ],
    });
    getAdminUsers.mockResolvedValue([
      { id: 'u-1', name: 'Alice', email: 'alice@test.com', role: 'Mentor', queryCount: 1 },
      { id: 'u-2', name: 'Bob', email: 'bob@test.com', role: 'CD', queryCount: 1 },
    ]);
    getAdminTopics.mockResolvedValue([
      { topic: 'curfew', count: 12 },
      { topic: 'meals', count: 8 },
      { topic: 'emergencies', count: 5 },
      { topic: 'other', count: 2 },
    ]);

    const response = await analyzeGET(makeRequest('/api/admin/analyze'));
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.totalQueries).toBe(2);
    expect(data.topCategories).toEqual([
      { name: 'curfew', count: 12 },
      { name: 'meals', count: 8 },
      { name: 'emergencies', count: 5 },
    ]);
    expect(data.overview).toEqual(expect.any(String));
    expect(data.staffInsights).toEqual(expect.any(Array));
  });

  it('handles empty queries gracefully', async () => {
    requireAdmin.mockResolvedValue({ id: 'admin-1' });
    getAdminQueries.mockResolvedValue({ data: [] });
    getAdminUsers.mockResolvedValue([]);
    getAdminTopics.mockResolvedValue([]);

    const response = await analyzeGET(makeRequest('/api/admin/analyze'));
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.totalQueries).toBe(0);
    expect(data.topCategories).toEqual([]);
    expect(data.overview).toContain('No queries to analyze yet');
    expect(data.staffInsights).toEqual([]);
  });
});
