/**
 * Admin Settings JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/settings' || window.location.pathname.includes('/settings')) {
        initSettingsPage();
    }
});

function initSettingsPage() {
    loadSettings();
    setupEventListeners();
}

function setupEventListeners() {
    // Settings will be saved via button clicks
}

function loadSettings() {
    // Load saved settings from localStorage
    const systemName = localStorage.getItem('systemName') || 'Shelf Stacker Admin';
    const contactEmail = localStorage.getItem('contactEmail') || 'admin@shelfstacker.com';
    const contactPhone = localStorage.getItem('contactPhone') || '';
    const sessionTimeout = localStorage.getItem('sessionTimeout') || '30';
    const require2FA = localStorage.getItem('require2FA') === 'true';
    const enableLogging = localStorage.getItem('enableLogging') !== 'false';
    const emailNotifications = localStorage.getItem('emailNotifications') !== 'false';
    const pushNotifications = localStorage.getItem('pushNotifications') !== 'false';
    const notificationEmail = localStorage.getItem('notificationEmail') || '';

    const systemNameEl = document.getElementById('systemName');
    const contactEmailEl = document.getElementById('contactEmail');
    const contactPhoneEl = document.getElementById('contactPhone');
    const sessionTimeoutEl = document.getElementById('sessionTimeout');
    const require2FAEl = document.getElementById('require2FA');
    const enableLoggingEl = document.getElementById('enableLogging');
    const emailNotificationsEl = document.getElementById('emailNotifications');
    const pushNotificationsEl = document.getElementById('pushNotifications');
    const notificationEmailEl = document.getElementById('notificationEmail');

    if (systemNameEl) systemNameEl.value = systemName;
    if (contactEmailEl) contactEmailEl.value = contactEmail;
    if (contactPhoneEl) contactPhoneEl.value = contactPhone;
    if (sessionTimeoutEl) sessionTimeoutEl.value = sessionTimeout;
    if (require2FAEl) require2FAEl.checked = require2FA;
    if (enableLoggingEl) enableLoggingEl.checked = enableLogging;
    if (emailNotificationsEl) emailNotificationsEl.checked = emailNotifications;
    if (pushNotificationsEl) pushNotificationsEl.checked = pushNotifications;
    if (notificationEmailEl) notificationEmailEl.value = notificationEmail;

    // Set API endpoint
    const apiEndpointEl = document.getElementById('apiEndpoint');
    if (apiEndpointEl && window.AdminServices) {
        apiEndpointEl.textContent = window.AdminServices.baseUrl || 'https://server-shelf-stacker-w1ds.onrender.com';
    }
}

function saveGeneralSettings() {
    const systemName = document.getElementById('systemName').value;
    const contactEmail = document.getElementById('contactEmail').value;
    const contactPhone = document.getElementById('contactPhone').value;

    localStorage.setItem('systemName', systemName);
    localStorage.setItem('contactEmail', contactEmail);
    localStorage.setItem('contactPhone', contactPhone);

    showToast('Đã lưu cài đặt chung', 'success');
}

function saveSecuritySettings() {
    const sessionTimeout = document.getElementById('sessionTimeout').value;
    const require2FA = document.getElementById('require2FA').checked;
    const enableLogging = document.getElementById('enableLogging').checked;

    localStorage.setItem('sessionTimeout', sessionTimeout);
    localStorage.setItem('require2FA', require2FA);
    localStorage.setItem('enableLogging', enableLogging);

    showToast('Đã lưu cài đặt bảo mật', 'success');
}

function saveNotificationSettings() {
    const emailNotifications = document.getElementById('emailNotifications').checked;
    const pushNotifications = document.getElementById('pushNotifications').checked;
    const notificationEmail = document.getElementById('notificationEmail').value;

    localStorage.setItem('emailNotifications', emailNotifications);
    localStorage.setItem('pushNotifications', pushNotifications);
    localStorage.setItem('notificationEmail', notificationEmail);

    showToast('Đã lưu cài đặt thông báo', 'success');
}

async function checkSystemStatus() {
    showLoading();
    try {
        if (window.AdminServices) {
            // Test API connection
            const stats = await window.AdminServices.getDashboardStats();
            const statusEl = document.getElementById('systemStatus');
            if (statusEl) {
                statusEl.textContent = 'Hoạt động';
                statusEl.className = 'badge badge-success';
            }
            showToast('Hệ thống hoạt động bình thường', 'success');
        }
    } catch (error) {
        const statusEl = document.getElementById('systemStatus');
        if (statusEl) {
            statusEl.textContent = 'Lỗi kết nối';
            statusEl.className = 'badge badge-danger';
        }
        showToast('Không thể kết nối đến hệ thống', 'error');
    } finally {
        hideLoading();
    }
}

