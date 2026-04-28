import { postJsonWithRetry, getWithRetry } from '@/lib/fetch-wrapper';

export interface UserInfo {
  id: string;
  username: string;
}

export interface AuthError {
  code: string;
  message: string;
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

export function logout(): void {
  document.cookie = 'auth_token=; path=/; max-age=0';
  window.location.href = '/login';
}

export async function login(username: string, password: string): Promise<{ success: boolean; error?: AuthError; user?: UserInfo }> {
  if (!username.trim() || !password.trim()) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: '请输入账号和密码' }
    };
  }

  const response = await postJsonWithRetry<{ success: boolean; user: UserInfo }>(
    '/api/auth/login',
    { username, password },
    {
      credentials: 'include' as RequestCredentials,
      maxRetries: 2,
    }
  );

  if (!response.success) {
    let errorCode = 'SERVER_ERROR';
    if (response.status === 401) {
      errorCode = 'UNAUTHORIZED';
    } else if (response.status === 400) {
      errorCode = 'VALIDATION_ERROR';
    } else if (!response.status) {
      errorCode = 'NETWORK_ERROR';
    }

    return {
      success: false,
      error: { code: errorCode, message: response.error || '登录失败' }
    };
  }

  return { success: true, user: response.data?.user };
}

export async function register(username: string, password: string): Promise<{ success: boolean; error?: AuthError; user?: UserInfo }> {
  if (!username.trim() || !password.trim()) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: '请输入账号和密码' }
    };
  }

  const response = await postJsonWithRetry<{ success: boolean; user: UserInfo }>(
    '/api/auth/register',
    { username, password },
    {
      maxRetries: 2,
    }
  );

  if (!response.success) {
    let errorCode = 'SERVER_ERROR';
    if (response.status === 409) {
      errorCode = 'CONFLICT';
    } else if (response.status === 400) {
      errorCode = 'VALIDATION_ERROR';
    } else if (!response.status) {
      errorCode = 'NETWORK_ERROR';
    }

    return {
      success: false,
      error: { code: errorCode, message: response.error || '注册失败' }
    };
  }

  return { success: true, user: response.data?.user };
}

export async function getCurrentUser(): Promise<UserInfo | null> {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const response = await getWithRetry<{ user: UserInfo }>('/api/auth/me', {
    credentials: 'include' as RequestCredentials,
    maxRetries: 2,
    onUnauthorized: logout,
  });

  if (!response.success) {
    if (response.status === 401) {
      logout();
    }
    return null;
  }

  return response.data?.user || null;
}