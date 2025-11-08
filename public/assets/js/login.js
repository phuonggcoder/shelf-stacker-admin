// Toggle password visibility (attach only if element exists)
const togglePasswordBtn = document.querySelector('.toggle-password');
if (togglePasswordBtn) {
  togglePasswordBtn.addEventListener('click', function() {
    const passwordInput = document.getElementById('password');
    const icon = this.querySelector('i');
    if (!passwordInput) return;
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
    } else {
      passwordInput.type = 'password';
      if (icon) { icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
    }
  });
}

// Handle form submission
async function handleLogin(e) {
  if (e) e.preventDefault();
  
  const loginBtn = document.getElementById('loginBtn');
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorMsg = document.getElementById('errorMsg');
  const remember = document.getElementById('remember').checked;

  // Clear previous errors
  errorMsg.textContent = '';
  
  // Validate inputs
  if (!email || !password) {
    UI.showError('Vui lòng nhập đầy đủ email và mật khẩu', errorMsg);
    return;
  }

  // Show loading state
  UI.showLoading(loginBtn);

  try {
    // Check internet connection
    if (!navigator.onLine) {
      UI.showError('Không có kết nối internet. Vui lòng kiểm tra lại kết nối mạng.', errorMsg);
      UI.hideLoading(loginBtn);
      return;
    }

    // Check server status
    const isServerHealthy = await checkServerStatus();
    if (!isServerHealthy) {
      UI.showError('Máy chủ đang gặp sự cố. Vui lòng thử lại sau.', errorMsg);
      UI.hideLoading(loginBtn);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      UI.showError('Email không đúng định dạng', errorMsg);
      UI.hideLoading(loginBtn);
      return;
    }

    // Password validation
    if (password.length < 6) {
      UI.showError('Mật khẩu phải có ít nhất 6 ký tự', errorMsg);
      UI.hideLoading(loginBtn);
      return;
    }

    // Attempt login with retry
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        const data = await ApiClient.login(email, password);
        
        // Validate response data
        if (!data || !data.access_token || !data.user) {
          throw new Error('Invalid server response');
        }

            // Save auth data (store both backend-recommended keys and legacy keys for compatibility)
            try { localStorage.setItem('admin_token', data.access_token); } catch(e) {}
            try { localStorage.setItem('admin_refresh_token', data.refresh_token || ''); } catch(e) {}
            try { localStorage.setItem('authToken', data.access_token); } catch(e) {}
            try { localStorage.setItem('userId', data.user.id); } catch(e) {}
            try { localStorage.setItem('userData', JSON.stringify(data.user)); } catch(e) {}
        
        // Check if user is admin
            // Check if user is admin (support backend role array or isAdmin flag)
            const isAdminFlag = !!data.user.isAdmin;
            const hasAdminRole = Array.isArray(data.user.roles) && data.user.roles.includes('admin');
            if (!isAdminFlag && !hasAdminRole) {
              UI.showError('Tài khoản không có quyền truy cập hệ thống quản trị', errorMsg);
              UI.hideLoading(loginBtn);
              return;
            }

        if (remember) {
          localStorage.setItem('rememberLogin', 'true');
        }

        // Log user info and show success message
        console.log('=== Thông tin đăng nhập ===');
        console.log(`Email: ${data.user.email}`);
        console.log(`Vai trò: ${data.user.roles.join(', ')}`);
        console.log(`ID: ${data.user.id}`);
        console.log(`Thời gian token: ${data.expires_in}s`);
        console.log('=========================');

        // Show success message with user email
        UI.showSuccess(`Đăng nhập thành công với tài khoản ${data.user.email}!`);
        
        // Store user info for dashboard
        try {
          sessionStorage.setItem('currentUser', JSON.stringify({
            email: data.user.email,
            roles: data.user.roles,
            id: data.user.id,
            loginTime: new Date().toISOString()
          }));
        } catch(e) {
          console.warn('Could not store user session info:', e);
        }

        // Redirect to dashboard after showing message
        setTimeout(() => {
          window.location.href = '/home';
        }, 1500);

        return; // Success - exit the retry loop
      } catch (retryError) {
        if (retryCount === maxRetries) throw retryError;
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
      }
    }

  } catch (error) {
    console.error('Login error:', error);
    
    // Clear any sensitive data on error
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userData');

    // Handle specific error cases
    switch (error.status) {
      case 401:
        UI.showError('Email hoặc mật khẩu không đúng', errorMsg);
        break;
      case 403:
        UI.showError('Tài khoản không có quyền truy cập', errorMsg);
        break;
      case 404:
        UI.showError('Tài khoản không tồn tại', errorMsg);
        break;
      case 408:
        UI.showError('Kết nối bị gián đoạn, vui lòng thử lại', errorMsg);
        break;
      case 429:
        UI.showError('Quá nhiều lần thử đăng nhập, vui lòng đợi một lát', errorMsg);
        break;
      case 500:
        UI.showError('Lỗi hệ thống, vui lòng thử lại sau', errorMsg);
        break;
      default:
        if (!navigator.onLine) {
          UI.showError('Không có kết nối internet', errorMsg);
        } else {
          UI.showError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.', errorMsg);
        }
    }

    // Reset the password field for security
    document.getElementById('password').value = '';
    
    UI.hideLoading(loginBtn);
  }
}

// Handle form submission (attach only if form exists)
const loginFormElement = document.getElementById('loginForm');
if (loginFormElement) {
  loginFormElement.addEventListener('submit', handleLogin);
  // Handle keyboard navigation
  loginFormElement.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLogin();
    }
  });
}

// Add input validation and visual feedback
const emailInputEl = document.getElementById('email');
if (emailInputEl) {
  emailInputEl.addEventListener('input', function() {
    this.classList.remove('error');
    const em = document.getElementById('errorMsg'); if (em) em.textContent = '';
  });
}

const passwordInputEl = document.getElementById('password');
if (passwordInputEl) {
  passwordInputEl.addEventListener('input', function() {
    this.classList.remove('error');
    const em = document.getElementById('errorMsg'); if (em) em.textContent = '';
  });
}

// Check for remembered login
document.addEventListener('DOMContentLoaded', function() {
  // Clear tokens on load (new keys + legacy)
  try { localStorage.removeItem('admin_token'); } catch(e) {}
  try { localStorage.removeItem('admin_refresh_token'); } catch(e) {}
  try { localStorage.removeItem('adminToken'); } catch(e) {}
  try { localStorage.removeItem('authToken'); } catch(e) {}

  // Server status UI (if element exists)
  const serverStatusEl = document.getElementById('serverStatus');
  async function updateServerStatus() {
    if (!serverStatusEl) return;
    try {
      const healthy = await checkServerStatus();
      serverStatusEl.style.display = 'block';
      if (healthy) {
        serverStatusEl.textContent = 'Máy chủ đang hoạt động';
        serverStatusEl.className = 'server-status online';
        const btn = document.getElementById('loginBtn'); if (btn) btn.disabled = false;
      } else {
        serverStatusEl.textContent = 'Không thể kết nối đến máy chủ';
        serverStatusEl.className = 'server-status offline';
        const btn = document.getElementById('loginBtn'); if (btn) btn.disabled = true;
      }
    } catch (err) {
      serverStatusEl.style.display = 'block';
      serverStatusEl.textContent = err.message || 'Không thể kết nối đến máy chủ';
      serverStatusEl.className = 'server-status offline';
      const btn = document.getElementById('loginBtn'); if (btn) btn.disabled = true;
    }
  }

  updateServerStatus();
  setInterval(updateServerStatus, 30000);

  const remembered = localStorage.getItem('rememberLogin');
  if (remembered) {
    const rem = document.getElementById('remember'); if (rem) rem.checked = true;
  }
});