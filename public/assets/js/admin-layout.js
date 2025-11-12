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
    
    if (!sidebar) {
        return;
    }
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            // Prevent flickering by using requestAnimationFrame
            requestAnimationFrame(() => {
                const isCollapsed = sidebar.classList.contains('collapsed');
                sidebar.classList.toggle('collapsed');
                const newCollapsedState = sidebar.classList.contains('collapsed');
                
                // Update body class for CSS selector
                if (newCollapsedState) {
                    document.body.classList.add('sidebar-collapsed');
                } else {
                    document.body.classList.remove('sidebar-collapsed');
                }
                
                localStorage.setItem('sidebarCollapsed', newCollapsedState);
                
                // Force hide scrollbar when collapsing
                const sidebarNav = sidebar.querySelector('.sidebar-nav');
                if (newCollapsedState && sidebarNav) {
                    sidebarNav.style.overflow = 'hidden';
                    sidebarNav.style.scrollbarWidth = 'none';
                    sidebarNav.style.msOverflowStyle = 'none';
                } else if (sidebarNav) {
                    sidebarNav.style.overflow = 'auto';
                    sidebarNav.style.scrollbarWidth = 'none';
                    sidebarNav.style.msOverflowStyle = 'none';
                }
                
                // Update main content - use setProperty with important
                const adminMain = document.querySelector('.admin-main');
                if (adminMain) {
                    if (newCollapsedState) {
                        adminMain.style.setProperty('margin-left', '80px', 'important');
                        adminMain.style.setProperty('width', 'calc(100% - 80px)', 'important');
                    } else {
                        adminMain.style.setProperty('margin-left', '260px', 'important');
                        adminMain.style.setProperty('width', 'calc(100% - 260px)', 'important');
                    }
                }
                
                // Close all submenus when collapsing
                if (newCollapsedState) {
                    document.querySelectorAll('.nav-item.has-submenu.active').forEach(item => {
                        item.classList.remove('active');
                    });
                }
            });
        });
    }
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });
    }
    
    // Restore sidebar state immediately to prevent flickering
    const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    
    if (collapsed) {
        // Add collapsed class before any rendering
        sidebar.classList.add('collapsed');
        document.body.classList.add('sidebar-collapsed');
        
        // Force hide scrollbar immediately
        const sidebarNav = sidebar.querySelector('.sidebar-nav');
        if (sidebarNav) {
            sidebarNav.style.overflow = 'hidden';
            sidebarNav.style.scrollbarWidth = 'none';
            sidebarNav.style.msOverflowStyle = 'none';
        }
        
        // Update main content margin immediately - use !important via setProperty
        const adminMain = document.querySelector('.admin-main');
        if (adminMain) {
            adminMain.style.setProperty('margin-left', '80px', 'important');
            adminMain.style.setProperty('width', 'calc(100% - 80px)', 'important');
        }
    } else {
        const adminMain = document.querySelector('.admin-main');
        if (adminMain) {
            adminMain.style.setProperty('margin-left', '260px', 'important');
            adminMain.style.setProperty('width', 'calc(100% - 260px)', 'important');
        }
    }
    
    // Handle submenu toggles - improved (no flickering)
    const submenuToggles = document.querySelectorAll('.submenu-toggle');
    submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const navItem = toggle.closest('.nav-item');
            const isCollapsed = sidebar.classList.contains('collapsed');
            
            // If collapsed, expand sidebar to allow interaction
            if (isCollapsed) {
                sidebar.classList.remove('collapsed');
                document.body.classList.remove('sidebar-collapsed');
                navItem.classList.add('active');
                localStorage.setItem('sidebarCollapsed', 'false');
                
                // Update main content
                const adminMain = document.querySelector('.admin-main');
                if (adminMain) {
                    adminMain.style.setProperty('margin-left', '260px', 'important');
                    adminMain.style.setProperty('width', 'calc(100% - 260px)', 'important');
                }
                
                // Update scrollbar
                const sidebarNav = sidebar.querySelector('.sidebar-nav');
                if (sidebarNav) {
                    sidebarNav.style.overflow = 'auto';
                }
                return;
            }
            
            const isActive = navItem.classList.contains('active');
            
            // Close other submenus
            document.querySelectorAll('.nav-item.has-submenu.active').forEach(item => {
                if (item !== navItem) {
                    item.classList.remove('active');
                }
            });
            
            // Toggle current submenu
            navItem.classList.toggle('active', !isActive);
        });
    });
    
    // Keep sidebar expanded when hovering over submenu items
    let collapseTimeout;
    sidebar.addEventListener('mouseenter', () => {
        clearTimeout(collapseTimeout);
    });
    
    sidebar.addEventListener('mouseleave', () => {
        if (sidebar.classList.contains('collapsed')) {
            document.querySelectorAll('.nav-item.has-submenu.active').forEach(item => {
                item.classList.remove('active');
            });
        }
    });
    
    // Handle user info tooltip
    const userInfo = document.getElementById('userInfo');
    const userAvatar = document.getElementById('userAvatar');
    const userInfoTooltip = document.getElementById('userInfoTooltip');
    
    if (userInfo && userAvatar && userInfoTooltip) {
        let tooltipTimeout;
        
        const showUserTooltip = () => {
            if (sidebar.classList.contains('collapsed')) {
                userInfoTooltip.style.display = 'block';
                setTimeout(() => {
                    userInfoTooltip.style.opacity = '1';
                    userInfoTooltip.style.transform = 'translateX(0)';
                }, 10);
            }
        };
        
        const hideUserTooltip = () => {
            tooltipTimeout = setTimeout(() => {
                userInfoTooltip.style.opacity = '0';
                userInfoTooltip.style.transform = 'translateX(-10px)';
                setTimeout(() => {
                    userInfoTooltip.style.display = 'none';
                }, 300);
            }, 200);
        };
        
        userAvatar.addEventListener('click', (e) => {
            e.stopPropagation();
            if (sidebar.classList.contains('collapsed')) {
                const isVisible = userInfoTooltip.style.display === 'block' && 
                                 userInfoTooltip.style.opacity === '1';
                if (isVisible) {
                    hideUserTooltip();
                } else {
                    showUserTooltip();
                }
            }
        });
        
        userInfo.addEventListener('mouseenter', () => {
            clearTimeout(tooltipTimeout);
            if (sidebar.classList.contains('collapsed')) {
                showUserTooltip();
            }
        });
        
        userInfo.addEventListener('mouseleave', () => {
            if (sidebar.classList.contains('collapsed')) {
                hideUserTooltip();
            }
        });
        
        // Close tooltip when clicking outside
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('collapsed') && 
                !userInfo.contains(e.target) && 
                !userInfoTooltip.contains(e.target)) {
                hideUserTooltip();
            }
        });
        
        // Handle logout from tooltip
        const tooltipLogoutBtn = document.getElementById('tooltipLogoutBtn');
        if (tooltipLogoutBtn) {
            tooltipLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                handleLogout();
            });
        }
    }
    
    // Handle clicks outside sidebar on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && sidebar.classList.contains('mobile-open')) {
            if (!sidebar.contains(e.target) && !mobileMenuToggle?.contains(e.target)) {
                sidebar.classList.remove('mobile-open');
            }
        }
    });
    
    // Mark sidebar as initialized
    sidebar.dataset.initialized = 'true';
    
    // Setup tooltip positioning for collapsed sidebar
    if (sidebar.classList.contains('collapsed')) {
        setupTooltips();
    }
    
    // Update tooltips when sidebar toggles
    if (sidebarToggle) {
        const originalToggle = sidebarToggle.onclick;
        sidebarToggle.addEventListener('click', () => {
            setTimeout(() => {
                if (sidebar.classList.contains('collapsed')) {
                    setupTooltips();
                }
            }, 100);
        });
    }
    
    // Prevent scroll event from propagating to main content
    const sidebarNav = sidebar.querySelector('.sidebar-nav');
    if (sidebarNav) {
        sidebarNav.addEventListener('wheel', (e) => {
            // Check if we're at the top or bottom of scroll
            const { scrollTop, scrollHeight, clientHeight } = sidebarNav;
            const isAtTop = scrollTop === 0;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
            
            // If scrolling up at top or scrolling down at bottom, prevent default
            // Otherwise, stop propagation to prevent main content from scrolling
            if ((e.deltaY < 0 && isAtTop) || (e.deltaY > 0 && isAtBottom)) {
                e.preventDefault();
            } else {
                e.stopPropagation();
            }
        }, { passive: false });
        
        // Also prevent touch scroll propagation
        sidebarNav.addEventListener('touchmove', (e) => {
            e.stopPropagation();
        }, { passive: false });
    }
    
    // Prevent scroll on sidebar itself from propagating
    sidebar.addEventListener('wheel', (e) => {
        if (e.target.closest('.sidebar-nav')) {
            e.stopPropagation();
        }
    }, { passive: false });
}

// Setup tooltips with fixed positioning
function setupTooltips() {
    const sidebar = document.getElementById('adminSidebar');
    if (!sidebar || !sidebar.classList.contains('collapsed')) return;
    
    // Setup nav links and logout button tooltips
    const navLinks = sidebar.querySelectorAll('.nav-link, .logout-btn');
    navLinks.forEach(link => {
        // Skip if already has tooltip handler
        if (link.dataset.tooltipSetup === 'true') return;
        
        const tooltip = link.querySelector('.sidebar-tooltip');
        if (!tooltip) return;
        
        link.dataset.tooltipSetup = 'true';
        
        link.addEventListener('mouseenter', function(e) {
            const rect = this.getBoundingClientRect();
            const tooltipEl = this.querySelector('.sidebar-tooltip');
            if (!tooltipEl) return;
            
            tooltipEl.style.position = 'fixed';
            tooltipEl.style.left = (rect.right + 12) + 'px';
            tooltipEl.style.top = (rect.top + rect.height / 2) + 'px';
            tooltipEl.style.transform = 'translateY(-50%)';
            tooltipEl.style.display = 'block';
            tooltipEl.style.visibility = 'visible';
            tooltipEl.style.opacity = '1';
            tooltipEl.style.zIndex = '99999';
        });
        
        link.addEventListener('mouseleave', function() {
            const tooltipEl = this.querySelector('.sidebar-tooltip');
            if (!tooltipEl) return;
            
            tooltipEl.style.opacity = '0';
            tooltipEl.style.visibility = 'hidden';
            setTimeout(() => {
                tooltipEl.style.display = 'none';
            }, 200);
        });
    });
    
    // Setup user info tooltip
    const userInfo = document.getElementById('userInfo');
    if (userInfo && userInfo.dataset.tooltipSetup !== 'true') {
        const tooltip = userInfo.querySelector('.sidebar-tooltip');
        if (tooltip) {
            userInfo.dataset.tooltipSetup = 'true';
            
            userInfo.addEventListener('mouseenter', function() {
                const rect = this.getBoundingClientRect();
                const tooltipEl = this.querySelector('.sidebar-tooltip');
                if (!tooltipEl) return;
                
                tooltipEl.style.position = 'fixed';
                tooltipEl.style.left = (rect.right + 12) + 'px';
                tooltipEl.style.top = (rect.top + rect.height / 2) + 'px';
                tooltipEl.style.bottom = 'auto';
                tooltipEl.style.transform = 'translateY(-50%)';
                tooltipEl.style.display = 'block';
                tooltipEl.style.visibility = 'visible';
                tooltipEl.style.opacity = '1';
                tooltipEl.style.zIndex = '99999';
            });
            
            userInfo.addEventListener('mouseleave', function() {
                const tooltipEl = this.querySelector('.sidebar-tooltip');
                if (!tooltipEl) return;
                
                tooltipEl.style.opacity = '0';
                tooltipEl.style.visibility = 'hidden';
                setTimeout(() => {
                    tooltipEl.style.display = 'none';
                }, 200);
            });
        }
    }
}

// Export for use in includes.js
window.initSidebar = initSidebar;
window.setActiveNavigation = setActiveNavigation;
window.setupTooltips = setupTooltips;

// ==================== Navigation ====================
function initNavigation() {
    // Wait for sidebar to be loaded if using data-include
    const checkSidebar = setInterval(() => {
        const sidebar = document.getElementById('adminSidebar');
        if (sidebar && sidebar.innerHTML.trim() !== '') {
            clearInterval(checkSidebar);
            setActiveNavigation();
        }
    }, 100);
    
    // Also try immediately in case sidebar is already loaded
    setTimeout(() => {
        setActiveNavigation();
    }, 500);
    
    // Update breadcrumb
    updateBreadcrumb();
}

function setActiveNavigation() {
    // Set active nav link based on current page
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link, .submenu-link');
    
    // Remove all active classes first
    navLinks.forEach(link => {
        link.classList.remove('active');
        const navItem = link.closest('.nav-item');
        if (navItem) {
            navItem.classList.remove('active');
        }
    });
    
    // Set active based on current path
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href !== '#' && (currentPath === href || currentPath.startsWith(href + '/'))) {
            link.classList.add('active');
            const navItem = link.closest('.nav-item');
            if (navItem) {
                navItem.classList.add('active');
                
                // If it's in a submenu, also activate parent submenu
                const parentSubmenu = navItem.closest('.has-submenu');
                if (parentSubmenu) {
                    parentSubmenu.classList.add('active');
                }
            }
        }
    });
    
    // Special handling for exact matches
    if (currentPath === '/home' || currentPath === '/') {
        const homeLink = document.querySelector('a[href="/home"]');
        if (homeLink) {
            homeLink.classList.add('active');
            homeLink.closest('.nav-item')?.classList.add('active');
        }
    }
    
    // Auto-expand submenu if current page is in submenu
    const activeSubmenuLink = document.querySelector('.submenu-link.active');
    if (activeSubmenuLink) {
        const parentSubmenu = activeSubmenuLink.closest('.has-submenu');
        if (parentSubmenu) {
            parentSubmenu.classList.add('active');
        }
    }
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
            const tooltipUserName = document.getElementById('tooltipUserName');
            const tooltipUserEmail = document.getElementById('tooltipUserEmail');
            
            const name = user.username || user.full_name || 'Admin';
            const email = user.email || '';
            
            if (userName) userName.textContent = name;
            if (userEmail) userEmail.textContent = email;
            if (tooltipUserName) tooltipUserName.textContent = name;
            if (tooltipUserEmail) tooltipUserEmail.textContent = email;
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





