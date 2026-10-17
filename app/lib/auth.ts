// app/lib/auth.ts
// Central helper for auth state + cross-component notifications

export const AUTH_CHANGED_EVENT = 'auth-changed';

export function notifyAuthChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}

export function saveAuth(token: string, email: string, name: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('strapi_token', token);
  localStorage.setItem('userEmail', email);
  localStorage.setItem('userName', name || 'Guest');
  notifyAuthChanged();
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('strapi_token');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  notifyAuthChanged();
}

export function readAuth() {
  if (typeof window === 'undefined') {
    return { isLoggedIn: false, name: '', email: '' };
  }
  const token = localStorage.getItem('strapi_token');
  const name = localStorage.getItem('userName') || '';
  const email = localStorage.getItem('userEmail') || '';
  return {
    isLoggedIn: !!token,
    name: name && name !== 'Guest' ? name : '',
    email,
  };
}