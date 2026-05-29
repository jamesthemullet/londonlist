import Cookie from 'js-cookie';

export function useAuthHeader(): { Authorization: string } {
  const token = Cookie.get('token') ?? '';
  return { Authorization: `Bearer ${token}` };
}
