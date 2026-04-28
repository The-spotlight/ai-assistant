export interface FetchOptions extends RequestInit {
  retryOnNetworkError?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
  onUnauthorized?: () => void;
}

export interface FetchResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;
const RETRY_STATUS_CODES = [429, 500, 502, 503, 504];

export async function fetchWithRetry<T>(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResponse<T>> {
  const {
    retryOnNetworkError = true,
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    onUnauthorized,
    ...fetchOptions
  } = options;

  let attempts = 0;
  let lastError: Error | null = null;

  while (attempts < maxRetries) {
    try {
      const response = await fetch(url, fetchOptions);

      if (response.status === 401) {
        onUnauthorized?.();
        return {
          success: false,
          error: '登录已过期，请重新登录',
          status: 401,
        };
      }

      if (response.status === 400) {
        let errorMessage = '请求参数错误';
        try {
          const body = await response.json();
          if (body.error) {
            errorMessage = typeof body.error === 'string' ? body.error : JSON.stringify(body.error);
          }
        } catch {
          errorMessage = '请求参数错误，请检查输入';
        }
        return {
          success: false,
          error: errorMessage,
          status: 400,
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          error: '资源未找到',
          status: 404,
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          error: '没有访问权限',
          status: 403,
        };
      }

      if (!response.ok) {
        let errorMessage = `服务器错误 (${response.status})`;
        try {
          const body = await response.json();
          if (body.error) {
            errorMessage = typeof body.error === 'string' ? body.error : JSON.stringify(body.error);
          }
        } catch {
          // Keep default error message
        }
        
        if (RETRY_STATUS_CODES.includes(response.status) && attempts < maxRetries - 1) {
          attempts++;
          await delay(retryDelayMs * Math.pow(2, attempts - 1));
          continue;
        }

        return {
          success: false,
          error: errorMessage,
          status: response.status,
        };
      }

      let data: T;
      try {
        data = await response.json();
      } catch {
        data = response.text() as unknown as T;
      }

      return {
        success: true,
        data,
        status: response.status,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!retryOnNetworkError || attempts >= maxRetries - 1) {
        return {
          success: false,
          error: lastError.message || '网络请求失败',
        };
      }

      attempts++;
      await delay(retryDelayMs * Math.pow(2, attempts - 1));
    }
  }

  return {
    success: false,
    error: lastError?.message || '网络请求失败',
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function postJsonWithRetry<T>(
  url: string,
  body: Record<string, unknown>,
  options: Omit<FetchOptions, 'method'> = {}
): Promise<FetchResponse<T>> {
  return fetchWithRetry<T>(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(body),
  });
}

export async function getWithRetry<T>(
  url: string,
  options: Omit<FetchOptions, 'method'> = {}
): Promise<FetchResponse<T>> {
  return fetchWithRetry<T>(url, {
    ...options,
    method: 'GET',
  });
}

export async function putJsonWithRetry<T>(
  url: string,
  body: Record<string, unknown>,
  options: Omit<FetchOptions, 'method'> = {}
): Promise<FetchResponse<T>> {
  return fetchWithRetry<T>(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(body),
  });
}

export async function deleteWithRetry<T>(
  url: string,
  options: Omit<FetchOptions, 'method'> = {}
): Promise<FetchResponse<T>> {
  return fetchWithRetry<T>(url, {
    ...options,
    method: 'DELETE',
  });
}