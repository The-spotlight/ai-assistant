const LOGIN_STATUS_KEY = 'ai_assistant_logged_in';
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = '123456';

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === LOGIN_STATUS_KEY && value === 'true') {
      return true;
    }
  }
  return false;
}

export function login(username: string, password: string): boolean {
  if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
    document.cookie = `${LOGIN_STATUS_KEY}=true; path=/; max-age=31536000; SameSite=Lax`;
    return true;
  }
  return false;
}

export function logout(): void {
  document.cookie = `${LOGIN_STATUS_KEY}=; path=/; max-age=0`;
}
