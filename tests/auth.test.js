// Use vi.hoisted so mock variables exist when vi.mock factories run (hoisted above imports)
const { mockGetProfile, mockGetUser, mockCreateClient } = vi.hoisted(() => ({
  mockGetProfile: vi.fn(),
  mockGetUser: vi.fn(),
  mockCreateClient: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

vi.mock('../lib/database.js', () => ({
  getProfile: mockGetProfile,
}));

// Import after mocks
import { getUser, requireAdmin } from '../lib/auth.js';

// Helper to create a mock Request with headers
function makeRequest(headers = {}) {
  return {
    headers: {
      get: (key) => headers[key.toLowerCase()] || null,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();

  // Default: Supabase env vars are set (from setup.js)
  // mockCreateClient returns a supabase instance with auth.getUser
  mockCreateClient.mockReturnValue({
    auth: {
      getUser: mockGetUser,
    },
  });
});

// ─── getUser ─────────────────────────────────────────────────────────────────

describe('getUser', () => {
  it('returns null when no Authorization header', async () => {
    const req = makeRequest({});
    const result = await getUser(req);
    expect(result).toBeNull();
  });

  it('returns null when Authorization header does not start with "Bearer "', async () => {
    const req = makeRequest({ authorization: 'Basic abc123' });
    const result = await getUser(req);
    expect(result).toBeNull();
  });

  it('returns null when Supabase URL/key not configured', async () => {
    const origUrl = process.env.SUPABASE_URL;
    const origPublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const origKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    delete process.env.SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const req = makeRequest({ authorization: 'Bearer valid-token' });

    // Re-import to pick up missing env vars
    // Since the check is inside the function, we can just test directly
    const result = await getUser(req);
    expect(result).toBeNull();

    // Restore
    process.env.SUPABASE_URL = origUrl;
    process.env.NEXT_PUBLIC_SUPABASE_URL = origPublicUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = origKey;
  });

  it('returns null when token is invalid (supabase returns error)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    const req = makeRequest({ authorization: 'Bearer bad-token' });
    const result = await getUser(req);
    expect(result).toBeNull();
  });

  it('returns null when supabase returns no user', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const req = makeRequest({ authorization: 'Bearer orphan-token' });
    const result = await getUser(req);
    expect(result).toBeNull();
  });

  it('returns user with profile when token is valid', async () => {
    const fakeUser = { id: 'user-123', email: 'test@ssb.com' };
    const fakeProfile = { id: 'user-123', name: 'Test User', role: 'Mentor', is_admin: false };

    mockGetUser.mockResolvedValue({
      data: { user: fakeUser },
      error: null,
    });
    mockGetProfile.mockResolvedValue(fakeProfile);

    const req = makeRequest({ authorization: 'Bearer good-token' });
    const result = await getUser(req);

    expect(result).not.toBeNull();
    expect(result.id).toBe('user-123');
    expect(result.email).toBe('test@ssb.com');
    expect(result.profile).toEqual(fakeProfile);
  });

  it('calls getProfile with the user ID from supabase auth', async () => {
    const fakeUser = { id: 'abc-999', email: 'staff@ssb.com' };

    mockGetUser.mockResolvedValue({
      data: { user: fakeUser },
      error: null,
    });
    mockGetProfile.mockResolvedValue(null);

    const req = makeRequest({ authorization: 'Bearer some-token' });
    await getUser(req);

    expect(mockGetProfile).toHaveBeenCalledWith('abc-999');
  });
});

// ─── requireAdmin ────────────────────────────────────────────────────────────

describe('requireAdmin', () => {
  it('returns null when user is not authenticated', async () => {
    const req = makeRequest({});
    const result = await requireAdmin(req);
    expect(result).toBeNull();
  });

  it('returns null when user is not admin (is_admin: false)', async () => {
    const fakeUser = { id: 'user-1', email: 'staff@ssb.com' };
    const fakeProfile = { id: 'user-1', name: 'Staff', is_admin: false };

    mockGetUser.mockResolvedValue({
      data: { user: fakeUser },
      error: null,
    });
    mockGetProfile.mockResolvedValue(fakeProfile);

    const req = makeRequest({ authorization: 'Bearer staff-token' });
    const result = await requireAdmin(req);
    expect(result).toBeNull();
  });

  it('returns null when user profile has no is_admin field', async () => {
    const fakeUser = { id: 'user-2', email: 'nofield@ssb.com' };
    const fakeProfile = { id: 'user-2', name: 'NoField' };

    mockGetUser.mockResolvedValue({
      data: { user: fakeUser },
      error: null,
    });
    mockGetProfile.mockResolvedValue(fakeProfile);

    const req = makeRequest({ authorization: 'Bearer nofield-token' });
    const result = await requireAdmin(req);
    expect(result).toBeNull();
  });

  it('returns user when user is admin (is_admin: true)', async () => {
    const fakeUser = { id: 'admin-1', email: 'admin@ssb.com' };
    const fakeProfile = { id: 'admin-1', name: 'Admin', is_admin: true };

    mockGetUser.mockResolvedValue({
      data: { user: fakeUser },
      error: null,
    });
    mockGetProfile.mockResolvedValue(fakeProfile);

    const req = makeRequest({ authorization: 'Bearer admin-token' });
    const result = await requireAdmin(req);

    expect(result).not.toBeNull();
    expect(result.id).toBe('admin-1');
    expect(result.profile.is_admin).toBe(true);
  });
});
