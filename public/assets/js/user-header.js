// Update header with logged in user info
function updateUserHeader() {
    try {
        // Get stored user info from login
        const userInfo = JSON.parse(sessionStorage.getItem('currentUser'));
        if (!userInfo) {
            console.warn('No user info found in session');
            return;
        }

        // Update user name in header
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = userInfo.email.split('@')[0]; // Show username part of email
        }

        // Optional: Add role badge if admin
        if (userInfo.roles && userInfo.roles.includes('admin')) {
            const roleSpan = document.createElement('span');
            roleSpan.className = 'role-badge';
            roleSpan.textContent = 'Admin';
            userNameEl?.parentElement?.appendChild(roleSpan);
        }

        // Add hover tooltip with full info
        const userInfoEl = document.querySelector('.user-info');
        if (userInfoEl) {
            userInfoEl.title = `Email: ${userInfo.email}\nVai trò: ${userInfo.roles.join(', ')}\nĐăng nhập: ${new Date(userInfo.loginTime).toLocaleString('vi-VN')}`;
        }

        // Log to console
        console.log('=== Thông tin người dùng hiện tại ===');
        console.log('Email:', userInfo.email);
        console.log('Vai trò:', userInfo.roles.join(', '));
        console.log('Thời gian đăng nhập:', new Date(userInfo.loginTime).toLocaleString('vi-VN'));
        console.log('=====================================');

    } catch (error) {
        console.error('Error updating user header:', error);
    }
}

// Add some minimal styles
const style = document.createElement('style');
style.textContent = `
.role-badge {
    background: #4CAF50;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    margin-left: 8px;
}
.user-info {
    cursor: help;
}
`;
document.head.appendChild(style);

// Update header when DOM loads
document.addEventListener('DOMContentLoaded', updateUserHeader);