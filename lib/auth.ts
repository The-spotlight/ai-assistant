const LOGIN_STATUS_KEY = 'ai_assistant_logged_in';
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = '123456';

export function isLoggedIn(): boolean {
  try {
    const status = localStorage.getItem(LOGIN_STATUS_KEY);
    return status === 'true';
  } catch {
    return false;
  }
}

export function login(username: string, password: string): boolean {
  if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
    localStorage.setItem(LOGIN_STATUS_KEY, 'true');
    return true;
  }
  return false;
}

export function logout(): void {
  localStorage.removeItem(LOGIN_STATUS_KEY);
}
