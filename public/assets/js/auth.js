// Auth middleware to protect routes and handle token refresh
(function() {
  // List of public routes that don't require authentication
  const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password'];
  
  // Function to check if current path is public
  function isPublicRoute() {
    return PUBLIC_ROUTES.some(route => window.location.pathname.startsWith(route));
  }

  // Function to check if token needs refresh (expired or will expire soon)
  function needsTokenRefresh() {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    try {
      // Parse JWT payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Check if token will expire in the next 5 minutes
      return payload.exp * 1000 < Date.now() + (5 * 60 * 1000);
    } catch (e) {
      return true;
    }
  }

  // Check authentication on page load
  async function checkAuth() {
    // Skip check for public routes
    if (isPublicRoute()) return;

    const token = localStorage.getItem('authToken');
    
    // No token - redirect to login
    if (!token) {
      window.location.href = '/login';
      return;
    }

    // Check if token needs refresh
    if (needsTokenRefresh()) {
      try {
        await ApiClient.refreshToken();
      } catch (error) {
        // If refresh fails, redirect to login
        window.location.href = '/login';
        return;
      }
    }

    // Initialize user data
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (userData) {
        // Update UI with user data
        const avatarEls = document.querySelectorAll('#headerAvatar, #sidebarAvatar');
        avatarEls.forEach(el => {
          if (el) {
            el.src = userData.avatar || 'https://graph.facebook.com/4/picture?width=100&height=100';
            el.alt = userData.name || 'User Avatar';
          }
        });

        const nameEls = document.querySelectorAll('#userName, #sidebarName');
        nameEls.forEach(el => {
          if (el) el.textContent = userData.name || 'Admin';
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  // Add request interceptor to handle 401 responses
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    try {
      const response = await originalFetch(...args);
      
      if (response.status === 401 && !isPublicRoute()) {
        // Try to refresh token
        const newToken = await ApiClient.refreshToken();
        
        if (newToken) {
          // Update Authorization header with new token
          const [url, config] = args;
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${newToken}`;
          
          // Retry original request
          return originalFetch(url, config);
        } else {
          // If refresh fails, redirect to login
          window.location.href = '/login';
        }
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Run auth check when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
  } else {
    checkAuth();
  }
})();