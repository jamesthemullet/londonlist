import { findUserByUsername } from './find-user-by-username';

const mockFindMany = jest.fn();
const mockQuery = jest.fn(() => ({ findMany: mockFindMany }));
const mockStrapi = { db: { query: mockQuery } };

describe('findUserByUsername', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReturnValue({ findMany: mockFindMany });
  });

  it('queries users-permissions plugin for the given username', async () => {
    mockFindMany.mockResolvedValue([{ id: 1, username: 'alice' }]);
    const result = await findUserByUsername(mockStrapi, 'alice');
    expect(mockQuery).toHaveBeenCalledWith('plugin::users-permissions.user');
    expect(mockFindMany).toHaveBeenCalledWith({ where: { username: 'alice' } });
    expect(result).toEqual({ id: 1, username: 'alice' });
  });

  it('returns undefined when no user is found', async () => {
    mockFindMany.mockResolvedValue([]);
    const result = await findUserByUsername(mockStrapi, 'nobody');
    expect(result).toBeUndefined();
  });

  it('returns the first result when multiple rows come back', async () => {
    mockFindMany.mockResolvedValue([
      { id: 2, username: 'bob' },
      { id: 3, username: 'bob' },
    ]);
    const result = await findUserByUsername(mockStrapi, 'bob');
    expect(result).toEqual({ id: 2, username: 'bob' });
  });
});
