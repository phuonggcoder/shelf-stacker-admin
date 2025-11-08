// API Client configuration and utilities
const API_CONFIG = {
  BASE_URL: 'https://server-shelf-stacker-w1ds.onrender.com', // Always use render.com server
  TIMEOUT: 60000, // 60 seconds - render.com cold starts can be slow
  RETRY_ATTEMPTS: 5, // More retries for render.com
  RETRY_DELAY: 2000, // 2 seconds between retries
};

// Check server status with retries
async function checkServerStatus(retries = 3) {
  try {
    // First check internet connectivity
    try {
      await fetch('https://www.google.com/favicon.ico', {
        mode: 'no-cors',
        cache: 'no-cache',
        signal: AbortSignal.timeout(3000)
      });
    } catch (error) {
      throw new Error('no_internet');
    }

    // Then check our server
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-cache',
      signal: AbortSignal.timeout(10000) // Longer timeout for render.com
    });
    // Treat 2xx as healthy
    if (response.ok) return true;

    // If health endpoint not implemented (404), consider server reachable
    if (response.status === 404) {
      console.warn('Health endpoint /api/health not implemented on server; treating server as reachable.');
      return true;
    }

    // For other non-2xx statuses, throw to trigger retry logic
    throw new Error(`health_status_${response.status}`);
  } catch (error) {
    if (error.message === 'no_internet') {
      console.error('Internet connection is not available');
      throw new ApiError('Mất kết nối internet. Vui lòng kiểm tra và thử lại.', 503);
    }

    if (retries > 0) {
      console.log(`Retrying server check... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return checkServerStatus(retries - 1);
    }
    
    console.error('Server health check failed:', error);
    throw new ApiError('Không thể kết nối đến máy chủ. Máy chủ có thể đang khởi động hoặc trả lỗi, vui lòng thử lại sau.', 503);
  }
}

// Initialize API health check
let serverIsHealthy = false;
checkServerStatus().then(isHealthy => {
  serverIsHealthy = isHealthy;
  if (!isHealthy) {
    console.error('Warning: Server appears to be offline');
  }
});

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

class ApiClient {
  // Token storage keys (align with backend implementation guide)
  static TOKEN_KEY = 'admin_token';
  static REFRESH_KEY = 'admin_refresh_token';

  static getAuthToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getRefreshToken() {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  static setTokens(accessToken, refreshToken) {
    if (accessToken) localStorage.setItem(this.TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(this.REFRESH_KEY, refreshToken);
    // Backwards compatibility: also set legacy keys used elsewhere in the codebase
    if (accessToken) {
      try { localStorage.setItem('adminToken', accessToken); } catch(e) {}
      try { localStorage.setItem('authToken', accessToken); } catch(e) {}
    }
  }

  static clearTokens() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    // Remove legacy keys as well
    try { localStorage.removeItem('adminToken'); } catch(e) {}
    try { localStorage.removeItem('authToken'); } catch(e) {}
  }

  static getAuthHeaders() {
    const token = this.getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  static async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    try {
      // Add default headers including auth
      const headers = {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      };

      // Make the request
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // If unauthorized, try to refresh token and retry once
      if (response.status === 401) {
        // Try refresh token flow if refresh token exists and we haven't retried
        const refreshToken = this.getRefreshToken();
        if (refreshToken && !options.__retry) {
          try {
            const newAccess = await this.refreshToken();
            if (newAccess) {
              // Retry original request with new token
              options.__retry = true;
              options.headers = { ...(options.headers || {}), 'Authorization': `Bearer ${newAccess}` };
              return this.request(endpoint, options);
            }
          } catch (refreshErr) {
            // fall through to clear tokens and redirect
          }
        }

        this.clearTokens();
        window.location.href = '/login';
        throw new ApiError('Phiên đăng nhập đã hết hạn', 401);
      }

      if (response.status === 403) {
        this.clearTokens();
        window.location.href = '/login';
        throw new ApiError('Không có quyền truy cập', 403);
      }

      // Try parsing JSON safely
      let data = null;
      try {
        data = await response.json();
      } catch (err) {
        data = null;
      }

      if (!response.ok) {
        throw new ApiError(
          (data && data.message) || 'An error occurred',
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Yêu cầu hết thời gian chờ. Vui lòng thử lại.', 408);
      }
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new ApiError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.', 503);
      }
      throw error;
    }
  }

  static async retryRequest(endpoint, options = {}, retries = API_CONFIG.RETRY_ATTEMPTS) {
    try {
      return await this.request(endpoint, options);
    } catch (error) {
      if (retries > 0 && error.status >= 500) {
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY));
        return this.retryRequest(endpoint, options, retries - 1);
      }
      throw error;
    }
  }

  // Auth methods
  static async login(email, password) {
    try {
  // Clear any existing tokens
  this.clearTokens();

      // Check server health before attempting login
      try {
        await checkServerStatus();
      } catch (error) {
        // Show specific error messages for different connection issues
        if (error.message?.includes('internet')) {
          throw new ApiError('Mất kết nối internet. Vui lòng kiểm tra kết nối mạng và thử lại.', 503);
        } else {
          throw new ApiError('Máy chủ đang khởi động, có thể mất 1-2 phút. Vui lòng thử lại sau.', 503);
        }
      }

      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ 
          email: email.toLowerCase(), // Normalize email
          password,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            colorDepth: window.screen.colorDepth,
            deviceMemory: navigator.deviceMemory,
            hardwareConcurrency: navigator.hardwareConcurrency
          }
        }),
        // Add longer timeout for login
        signal: AbortSignal.timeout(10000)
      });

      // Validate response structure
      if (!response || typeof response !== 'object') {
        throw new ApiError('Invalid response format', 500);
      }

      if (!response.access_token || !response.user) {
        throw new ApiError('Missing required login data', 500);
      }

      // Validate user object
      if (!response.user.id || !response.user.email || response.user.email !== email.toLowerCase()) {
        throw new ApiError('Invalid user data in response', 500);
      }

      // Verify admin role
      if (!response.user.roles || !response.user.roles.includes('admin')) {
        throw new ApiError('Không có quyền truy cập trang admin', 403);
      }

  // Store admin access + refresh tokens (keys per backend guide)
  this.setTokens(response.access_token, response.refresh_token);

      return response;
    } catch (error) {
      // Add more context to the error
      if (error.status === 401) {
        error.message = 'Email hoặc mật khẩu không đúng';
      } else if (error.status === 403) {
        error.message = 'Tài khoản không có quyền truy cập';
      }
      throw error;
    }
  }

  static async refreshToken() {
    const refresh = this.getRefreshToken();
    if (!refresh) return null;

    try {
      const url = `${API_CONFIG.BASE_URL}/auth/refresh`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
      });

      if (!res.ok) {
        this.clearTokens();
        return null;
      }

      const data = await res.json();
      if (data && data.access_token) {
        this.setTokens(data.access_token, data.refresh_token || refresh);
        return data.access_token;
      }

      this.clearTokens();
      return null;
    } catch (error) {
      this.clearTokens();
      return null;
    }
  }

  // Voucher methods
  static async getVouchers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.retryRequest(`/api/vouchers?${queryString}`);
  }

  static async getVoucherById(id) {
    return this.retryRequest(`/api/vouchers/${id}`);
  }

  static async createVoucher(data) {
    return this.retryRequest('/api/vouchers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async updateVoucher(id, data) {
    return this.retryRequest(`/api/vouchers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async deleteVoucher(id) {
    return this.retryRequest(`/api/vouchers/${id}`, {
      method: 'DELETE'
    });
  }

  static async archiveVoucher(id) {
    return this.retryRequest(`/api/vouchers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_deleted: true })
    });
  }

  static async restoreVoucher(id) {
    return this.retryRequest(`/api/vouchers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_deleted: false })
    });
  }

  // Voucher validation and stats
  static async validateVoucher(voucherData) {
    return this.retryRequest('/api/vouchers/validate', {
      method: 'POST',
      body: JSON.stringify(voucherData)
    });
  }

  static async getVoucherStats(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.retryRequest(`/api/vouchers/stats?${queryString}`);
  }

  static async getVoucherUsageHistory(id, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.retryRequest(`/api/vouchers/${id}/usage?${queryString}`);
  }
}

// UI Helper methods
const UI = {
  showLoading(element) {
    element.classList.add('loading');
    element.disabled = true;
  },

  hideLoading(element) {
    element.classList.remove('loading');
    element.disabled = false;
  },

  showError(message, element = null) {
    if (element) {
      element.textContent = message;
      element.style.display = 'block';
    } else {
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = message;
        toast.className = 'toast error';
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 5000);
      }
    }
  },

  showSuccess(message) {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = message;
      toast.className = 'toast success';
      toast.style.display = 'block';
      setTimeout(() => toast.style.display = 'none', 3000);
    }
  }
};

// Export for use in other files
window.ApiClient = ApiClient;
window.UI = UI;