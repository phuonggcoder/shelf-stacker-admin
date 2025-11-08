/**
 * Admin Layout JavaScript
 * Handles sidebar, navigation, and common UI interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    initSidebar();
    initNavigation();
    initUserMenu();
    checkAuth();
    loadUserInfo();
});

// ==================== Sidebar Management ====================
function initSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });
    }
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });
    }
    
    // Restore sidebar state
    const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (collapsed) {
        sidebar.classList.add('collapsed');
    }
    
    // Handle submenu toggles
    const submenuLinks = document.querySelectorAll('.nav-item.has-submenu > .nav-link');
    submenuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const navItem = link.closest('.nav-item');
            navItem.classList.toggle('active');
        });
    });
}

// ==================== Navigation ====================
function initNavigation() {
    // Set active nav link based on current page
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath.includes(href.replace('/', ''))) {
            link.classList.add('active');
            const navItem = link.closest('.nav-item');
            if (navItem) {
                navItem.classList.add('active');
            }
        }
    });
    
    // Update breadcrumb
    updateBreadcrumb();
}

function updateBreadcrumb() {
    const breadcrumb = document.getElementById('breadcrumb');
    if (!breadcrumb) return;
    
    const path = window.location.pathname;
    const pageMap = {
        '/home': 'Dashboard',
        '/products': 'Sản phẩm',
        '/categories': 'Danh mục',
        '/orders': 'Đơn hàng',
        '/vouchers': 'Vouchers',
        '/users': 'Người dùng',
        '/notifications': 'Thông báo',
        '/reports': 'Báo cáo',
        '/settings': 'Cài đặt'
    };
    
    const pageName = pageMap[path] || 'Trang chủ';
    breadcrumb.innerHTML = `<i class="fas fa-home"></i><span>${pageName}</span>`;
}

// ==================== User Menu ====================
function initUserMenu() {
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutMenuItem = document.getElementById('logoutMenuItem');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (logoutMenuItem) {
        logoutMenuItem.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
}

function handleLogout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        if (window.AdminServices) {
            window.AdminServices.logout();
        } else {
            localStorage.clear();
            window.location.href = '/login';
        }
    }
}

// ==================== Authentication ====================
function checkAuth() {
    if (window.location.pathname === '/login') {
        return;
    }
    
    const token = localStorage.getItem('admin_token') || localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    
    // Verify token is still valid (optional - can check expiry)
    // For now, just check if token exists
}

// ==================== User Info ====================
function loadUserInfo() {
    const userData = localStorage.getItem('userData');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            const userName = document.getElementById('userName');
            const userEmail = document.getElementById('userEmail');
            
            if (userName) userName.textContent = user.username || user.full_name || 'Admin';
            if (userEmail) userEmail.textContent = user.email || '';
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

// ==================== Loading Overlay ====================
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('active');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// ==================== Toast Notifications ====================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = getToastIcon(type);
    toast.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
}

function getToastIcon(type) {
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    return icons[type] || icons.info;
}

// Add slide out animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOutRight {
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Export functions
window.AdminLayout = {
    showLoading,
    hideLoading,
    showToast,
    updateBreadcrumb
};


