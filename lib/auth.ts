export interface UserInfo {
  id: string;
  username: string;
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'auth_token' && value) {
      return true;
    }
  }
  return false;
}

export async function login(username: string, password: string): Promise<{ success: boolean; error?: string; user?: UserInfo }> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();

    if (response.ok) {
      return { success: true, user: result.user };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: '网络错误' };
  }
}

export async function register(username: string, password: string): Promise<{ success: boolean; error?: string; user?: UserInfo }> {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();

    if (response.ok) {
      return { success: true, user: result.user };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: '网络错误' };
  }
}

export function logout(): void {
  document.cookie = 'auth_token=; path=/; max-age=0';
  window.location.href = '/login';
}

export async function getCurrentUser(): Promise<UserInfo | null> {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const response = await fetch('/api/auth/me');
    if (response.ok) {
      const data = await response.json();
      return data.user;
    }
    return null;
  } catch (error) {
    return null;
  }
}