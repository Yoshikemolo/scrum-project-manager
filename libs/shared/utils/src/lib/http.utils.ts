export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export class HttpUtils {
  /**
   * Make HTTP request with retries
   */
  static async request<T = any>(
    url: string,
    options: HttpRequestOptions = {},
  ): Promise<HttpResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      params,
      timeout = 30000,
      retries = 3,
      retryDelay = 1000,
    } = options;

    // Add query parameters
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    requestOptions.signal = controller.signal;

    // Attempt request with retries
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        return {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: this.headersToObject(response.headers),
        };
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries - 1) {
          await this.delay(retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  /**
   * GET request
   */
  static async get<T = any>(
    url: string,
    options?: Omit<HttpRequestOptions, 'method' | 'body'>,
  ): Promise<T> {
    const response = await this.request<T>(url, { ...options, method: 'GET' });
    return response.data;
  }

  /**
   * POST request
   */
  static async post<T = any>(
    url: string,
    body?: any,
    options?: Omit<HttpRequestOptions, 'method'>,
  ): Promise<T> {
    const response = await this.request<T>(url, { ...options, method: 'POST', body });
    return response.data;
  }

  /**
   * PUT request
   */
  static async put<T = any>(
    url: string,
    body?: any,
    options?: Omit<HttpRequestOptions, 'method'>,
  ): Promise<T> {
    const response = await this.request<T>(url, { ...options, method: 'PUT', body });
    return response.data;
  }

  /**
   * DELETE request
   */
  static async delete<T = any>(
    url: string,
    options?: Omit<HttpRequestOptions, 'method' | 'body'>,
  ): Promise<T> {
    const response = await this.request<T>(url, { ...options, method: 'DELETE' });
    return response.data;
  }

  /**
   * PATCH request
   */
  static async patch<T = any>(
    url: string,
    body?: any,
    options?: Omit<HttpRequestOptions, 'method'>,
  ): Promise<T> {
    const response = await this.request<T>(url, { ...options, method: 'PATCH', body });
    return response.data;
  }

  /**
   * Convert Headers to object
   */
  private static headersToObject(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Delay helper
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Build URL with base and path
   */
  static buildUrl(base: string, path: string): string {
    if (!base) return path;
    if (!path) return base;
    
    const baseEndsWithSlash = base.endsWith('/');
    const pathStartsWithSlash = path.startsWith('/');
    
    if (baseEndsWithSlash && pathStartsWithSlash) {
      return base + path.substring(1);
    } else if (!baseEndsWithSlash && !pathStartsWithSlash) {
      return base + '/' + path;
    } else {
      return base + path;
    }
  }

  /**
   * Parse response headers for pagination
   */
  static parsePaginationHeaders(headers: Record<string, string>): {
    total?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  } {
    return {
      total: headers['x-total-count'] ? parseInt(headers['x-total-count']) : undefined,
      page: headers['x-page'] ? parseInt(headers['x-page']) : undefined,
      limit: headers['x-limit'] ? parseInt(headers['x-limit']) : undefined,
      hasNext: headers['x-has-next'] === 'true',
      hasPrev: headers['x-has-prev'] === 'true',
    };
  }

  /**
   * Handle file download
   */
  static async downloadFile(
    url: string,
    filename: string,
    options?: HttpRequestOptions,
  ): Promise<void> {
    const response = await fetch(url, {
      method: options?.method || 'GET',
      headers: options?.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }
}
