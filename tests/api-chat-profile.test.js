import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mocks ----
vi.mock('@/lib/auth', () => ({
  getUser: vi.fn(),
}));

vi.mock('@/lib/database', () => ({
  updateProfile: vi.fn(),
}));

// ---- Imports ----
import { GET, PUT } from '@/app/api/chat/profile/route';
import { getUser } from '@/lib/auth';
import { updateProfile } from '@/lib/database';

// ---- Helpers ----
function makeGetRequest() {
  return new Request('http://localhost/api/chat/profile', { method: 'GET' });
}

function makePutRequest(body) {
  return new Request('http://localhost/api/chat/profile', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// ---- Tests ----
describe('GET /api/chat/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    getUser.mockResolvedValue(null);

    const response = await GET(makeGetRequest());
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns profile data when authenticated', async () => {
    const profile = { name: 'Alice', role: 'mentor', bot_name: 'BerkeleyBot' };
    getUser.mockResolvedValue({ id: 'user-1', profile });

    const response = await GET(makeGetRequest());
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.profile).toEqual(profile);
  });
});

describe('PUT /api/chat/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    getUser.mockResolvedValue(null);

    const response = await PUT(makePutRequest({ name: 'Bob' }));
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('updates name, role, and bot_name fields', async () => {
    getUser.mockResolvedValue({ id: 'user-1', profile: {} });
    const updatedProfile = { name: 'Bob', role: 'cd', bot_name: 'MyBot' };
    updateProfile.mockResolvedValue(updatedProfile);

    await PUT(makePutRequest({ name: 'Bob', role: 'cd', bot_name: 'MyBot' }));

    expect(updateProfile).toHaveBeenCalledWith('user-1', {
      name: 'Bob',
      role: 'cd',
      bot_name: 'MyBot',
    });
  });

  it('returns updated profile on success', async () => {
    getUser.mockResolvedValue({ id: 'user-1', profile: {} });
    const updatedProfile = { name: 'Bob', role: 'cd', bot_name: 'MyBot' };
    updateProfile.mockResolvedValue(updatedProfile);

    const response = await PUT(makePutRequest({ name: 'Bob', role: 'cd', bot_name: 'MyBot' }));
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.profile).toEqual(updatedProfile);
  });

  it('returns 500 when update fails (returns null)', async () => {
    getUser.mockResolvedValue({ id: 'user-1', profile: {} });
    updateProfile.mockResolvedValue(null);

    const response = await PUT(makePutRequest({ name: 'Bob' }));
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBe('Failed to update profile');
  });

  it('returns 500 when updateProfile throws', async () => {
    getUser.mockResolvedValue({ id: 'user-1', profile: {} });
    updateProfile.mockRejectedValue(new Error('DB down'));

    const response = await PUT(makePutRequest({ name: 'Bob' }));
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBe('Internal server error');
  });

  it('only includes provided fields in updates', async () => {
    getUser.mockResolvedValue({ id: 'user-1', profile: {} });
    updateProfile.mockResolvedValue({ name: 'Bob' });

    await PUT(makePutRequest({ name: 'Bob' }));

    expect(updateProfile).toHaveBeenCalledWith('user-1', { name: 'Bob' });
  });
});
