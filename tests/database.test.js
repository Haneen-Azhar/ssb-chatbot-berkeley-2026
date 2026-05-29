// Use vi.hoisted so mock variables exist when vi.mock factories run (hoisted above imports)
const { mockSupabase, createMockQueryBuilder } = vi.hoisted(() => {
  function createMockQueryBuilder(resolvedValue = { data: null, error: null, count: 0 }) {
    const builder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(resolvedValue),
      then: undefined, // Make it non-thenable so chaining works
    };
    return builder;
  }

  const defaultBuilder = createMockQueryBuilder();
  const mockSupabase = {
    from: vi.fn(() => defaultBuilder),
  };

  return { mockSupabase, createMockQueryBuilder };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

const mockQueryBuilder = createMockQueryBuilder();

// Import after mock so the module-level createClient call uses the mock
import {
  getProfile,
  updateProfile,
  logQuery,
  getAdminOverview,
  getAdminUsers,
  getAdminTopics,
} from '../lib/database.js';

beforeEach(() => {
  vi.clearAllMocks();
  // Reset the from mock to return the default builder
  mockSupabase.from.mockReturnValue(mockQueryBuilder);
});

// ─── getProfile ──────────────────────────────────────────────────────────────

describe('getProfile', () => {
  it('returns profile data on success', async () => {
    const fakeProfile = { id: 'u1', name: 'Alice', role: 'Mentor' };
    const builder = createMockQueryBuilder({ data: fakeProfile, error: null });
    mockSupabase.from.mockReturnValue(builder);

    const result = await getProfile('u1');
    expect(result).toEqual(fakeProfile);
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    expect(builder.eq).toHaveBeenCalledWith('id', 'u1');
  });

  it('returns null on error', async () => {
    const builder = createMockQueryBuilder({ data: null, error: { message: 'Not found' } });
    mockSupabase.from.mockReturnValue(builder);

    const result = await getProfile('nonexistent');
    expect(result).toBeNull();
  });
});

// ─── updateProfile ───────────────────────────────────────────────────────────

describe('updateProfile', () => {
  it('calls supabase update with correct params and returns updated profile', async () => {
    const updated = { id: 'u1', name: 'Alice Updated', role: 'CD' };
    const builder = createMockQueryBuilder({ data: updated, error: null });
    mockSupabase.from.mockReturnValue(builder);

    const result = await updateProfile('u1', { name: 'Alice Updated', role: 'CD' });

    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    expect(builder.update).toHaveBeenCalledWith({ name: 'Alice Updated', role: 'CD' });
    expect(builder.eq).toHaveBeenCalledWith('id', 'u1');
    expect(result).toEqual(updated);
  });

  it('returns null on error', async () => {
    const builder = createMockQueryBuilder({ data: null, error: { message: 'Update failed' } });
    mockSupabase.from.mockReturnValue(builder);

    const result = await updateProfile('u1', { role: 'AM' });
    expect(result).toBeNull();
  });
});

// ─── logQuery ────────────────────────────────────────────────────────────────

describe('logQuery', () => {
  it('inserts with correct snake_case column mapping', async () => {
    const builder = createMockQueryBuilder({ data: { id: 'q1' }, error: null });
    mockSupabase.from.mockReturnValue(builder);

    await logQuery({
      userId: 'u1',
      sessionId: 'sess-abc',
      message: 'hello',
      response: 'hi there',
      sources: [{ file: 'test.md' }],
      kbResultsCount: 3,
      searchUsed: false,
      inputTokens: 100,
      outputTokens: 200,
      responseTimeMs: 1500,
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('queries');
    expect(builder.insert).toHaveBeenCalledWith({
      user_id: 'u1',
      session_id: 'sess-abc',
      message: 'hello',
      response: 'hi there',
      sources: [{ file: 'test.md' }],
      kb_results_count: 3,
      search_used: false,
      input_tokens: 100,
      output_tokens: 200,
      response_time_ms: 1500,
    });
  });

  it('never throws (catches errors silently)', async () => {
    const builder = createMockQueryBuilder({ data: null, error: { message: 'Insert failed' } });
    mockSupabase.from.mockReturnValue(builder);

    // Should not throw
    const result = await logQuery({
      userId: 'u1',
      sessionId: 's1',
      message: 'test',
      response: 'resp',
    });

    // Returns null on error
    expect(result).toBeNull();
  });

  it('also does not throw when builder throws an exception', async () => {
    mockSupabase.from.mockImplementation(() => {
      throw new Error('Catastrophic failure');
    });

    const result = await logQuery({
      userId: 'u1',
      sessionId: 's1',
      message: 'test',
      response: 'resp',
    });

    expect(result).toBeNull();
  });
});

// ─── getAdminOverview ────────────────────────────────────────────────────────

describe('getAdminOverview', () => {
  it('returns object with expected keys', async () => {
    // Mock Promise.all with multiple from() calls
    // The function calls supabase.from('queries') five times
    const builders = [];
    for (let i = 0; i < 5; i++) {
      builders.push(createMockQueryBuilder({ data: [], error: null, count: 0 }));
    }
    let callIdx = 0;
    mockSupabase.from.mockImplementation(() => {
      const b = builders[callIdx] || builders[0];
      callIdx++;
      // The overview function uses head:true with count for first 3 calls
      // and select for last 2. We need to handle both.
      // For head:true calls, they don't call .single() but resolve from .gte() or direct
      // Let's make the builder resolve its final call
      b.select.mockImplementation((fields, opts) => {
        if (opts?.head) {
          // Returns { count, error } without .single()
          const headResult = { count: 0, error: null };
          const headBuilder = { ...b };
          headBuilder.gte = vi.fn().mockResolvedValue(headResult);
          // Direct resolve if no further chaining
          headBuilder.then = (resolve) => resolve(headResult);
          return headBuilder;
        }
        return b;
      });
      return b;
    });

    const result = await getAdminOverview();

    expect(result).toHaveProperty('totalQueries');
    expect(result).toHaveProperty('queriesToday');
    expect(result).toHaveProperty('queriesThisWeek');
    expect(result).toHaveProperty('activeUsers');
    expect(result).toHaveProperty('avgResponseTimeMs');
  });

  it('all values default to 0 when no data', async () => {
    // Force the function into the catch path by making from() throw
    mockSupabase.from.mockImplementation(() => {
      throw new Error('DB down');
    });

    const result = await getAdminOverview();

    expect(result.totalQueries).toBe(0);
    expect(result.queriesToday).toBe(0);
    expect(result.queriesThisWeek).toBe(0);
    expect(result.activeUsers).toBe(0);
    expect(result.avgResponseTimeMs).toBe(0);
  });
});

// ─── getAdminUsers ───────────────────────────────────────────────────────────

describe('getAdminUsers', () => {
  it('returns array of users with queryCount and lastActive computed', async () => {
    const profiles = [
      { id: 'u1', name: 'Alice', role: 'CD' },
      { id: 'u2', name: 'Bob', role: 'Mentor' },
    ];
    const queries = [
      { user_id: 'u1', created_at: '2026-01-15T10:00:00Z' },
      { user_id: 'u1', created_at: '2026-01-16T10:00:00Z' },
      { user_id: 'u2', created_at: '2026-01-14T10:00:00Z' },
    ];

    let callCount = 0;
    mockSupabase.from.mockImplementation((table) => {
      const builder = createMockQueryBuilder();
      if (callCount === 0) {
        // profiles select
        builder.select.mockResolvedValue({ data: profiles, error: null });
      } else {
        // queries select
        builder.select.mockResolvedValue({ data: queries, error: null });
      }
      callCount++;
      return builder;
    });

    const result = await getAdminUsers();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);

    const alice = result.find((u) => u.id === 'u1');
    expect(alice.queryCount).toBe(2);
    expect(alice.lastActive).toBe('2026-01-16T10:00:00Z');

    const bob = result.find((u) => u.id === 'u2');
    expect(bob.queryCount).toBe(1);
  });

  it('returns empty array on error', async () => {
    mockSupabase.from.mockImplementation(() => {
      throw new Error('DB error');
    });

    const result = await getAdminUsers();
    expect(result).toEqual([]);
  });
});

// ─── getAdminTopics ──────────────────────────────────────────────────────────

describe('getAdminTopics', () => {
  it('parses sources JSONB correctly', async () => {
    const queryData = [
      { sources: [{ file: '01_emergency_procedures.md' }, { file: '03_first_aid_medical.md' }] },
      { sources: [{ file: '01_emergency_procedures.md' }] },
    ];

    const builder = createMockQueryBuilder();
    builder.not.mockResolvedValue({ data: queryData, error: null });
    mockSupabase.from.mockReturnValue(builder);

    const result = await getAdminTopics();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
  });

  it('converts filenames to friendly names (strips numbers, .md, underscores)', async () => {
    const queryData = [
      { sources: [{ file: '04_staff_schedules_policies.md' }] },
    ];

    const builder = createMockQueryBuilder();
    builder.not.mockResolvedValue({ data: queryData, error: null });
    mockSupabase.from.mockReturnValue(builder);

    const result = await getAdminTopics();

    expect(result.length).toBe(1);
    const topicName = result[0].topic;
    // Should not contain .md extension
    expect(topicName).not.toContain('.md');
    // Should not contain leading numbers
    expect(topicName).not.toMatch(/^\d/);
    // Should have spaces instead of underscores
    expect(topicName).not.toContain('_');
    // Should contain meaningful words
    expect(topicName.toLowerCase()).toContain('staff');
  });

  it('returns sorted by count descending', async () => {
    const queryData = [
      { sources: [{ file: '01_emergency_procedures.md' }] },
      { sources: [{ file: '03_first_aid_medical.md' }, { file: '01_emergency_procedures.md' }] },
      { sources: [{ file: '03_first_aid_medical.md' }] },
      { sources: [{ file: '03_first_aid_medical.md' }] },
    ];

    const builder = createMockQueryBuilder();
    builder.not.mockResolvedValue({ data: queryData, error: null });
    mockSupabase.from.mockReturnValue(builder);

    const result = await getAdminTopics();

    expect(result.length).toBe(2);
    // first_aid_medical appears 3 times, emergency_procedures appears 2 times
    expect(result[0].count).toBeGreaterThanOrEqual(result[1].count);
  });

  it('skips sources that are not arrays', async () => {
    const queryData = [
      { sources: 'not-an-array' },
      { sources: null },
      { sources: [{ file: '01_emergency_procedures.md' }] },
    ];

    const builder = createMockQueryBuilder();
    builder.not.mockResolvedValue({ data: queryData, error: null });
    mockSupabase.from.mockReturnValue(builder);

    const result = await getAdminTopics();

    expect(result.length).toBe(1);
  });

  it('handles scenario file paths by stripping scenarios/ prefix', async () => {
    const queryData = [
      { sources: [{ file: 'scenarios/medical/concussion.md' }] },
    ];

    const builder = createMockQueryBuilder();
    builder.not.mockResolvedValue({ data: queryData, error: null });
    mockSupabase.from.mockReturnValue(builder);

    const result = await getAdminTopics();

    expect(result[0].topic).not.toMatch(/^scenarios\//);
    expect(result[0].topic).toContain('concussion');
  });

  it('handles training file paths by prepending "Training: "', async () => {
    const queryData = [
      { sources: [{ file: 'training/deescalation_techniques.md' }] },
    ];

    const builder = createMockQueryBuilder();
    builder.not.mockResolvedValue({ data: queryData, error: null });
    mockSupabase.from.mockReturnValue(builder);

    const result = await getAdminTopics();

    expect(result[0].topic).toMatch(/^Training:/);
  });
});
