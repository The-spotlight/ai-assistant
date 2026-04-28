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

export async function login(username: string, password: string): Promise<{ success: boolean; error?: AuthError; user?: UserInfo }> {
  if (!username.trim() || !password.trim()) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: '请输入账号和密码' }
    };
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({ error: '未知错误' }));
      
      if (response.status === 401) {
        return {
          success: false,
          error: { code: 'UNAUTHORIZED', message: result.error || '账号或密码错误' }
        };
      }
      
      if (response.status === 400) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: result.error || '请求参数错误' }
        };
      }

      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: result.error || '服务器内部错误' }
      };
    }

    const result = await response.json();
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Login network error:', error);
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: '网络连接异常，请稍后重试' }
    };
  }
}

export async function register(username: string, password: string): Promise<{ success: boolean; error?: AuthError; user?: UserInfo }> {
  if (!username.trim() || !password.trim()) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: '请输入账号和密码' }
    };
  }

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({ error: '未知错误' }));
      
      if (response.status === 409) {
        return {
          success: false,
          error: { code: 'CONFLICT', message: result.error || '用户名已存在' }
        };
      }
      
      if (response.status === 400) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: result.error || '请求参数错误' }
        };
      }

      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: result.error || '服务器内部错误' }
      };
    }

    const result = await response.json();
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Register network error:', error);
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: '网络连接异常，请稍后重试' }
    };
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
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        logout();
        return null;
      }
      return null;
    }

    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}