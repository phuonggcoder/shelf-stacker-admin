/**
 * Admin Settings JavaScript
 * Tích hợp với Backend API System Settings
 */

// Helper: Đợi AdminServices sẵn sàng
function waitForAdminServices(maxWait = 5000) {
    return new Promise((resolve, reject) => {
        if (window.AdminServices && typeof window.AdminServices.getSettings === 'function') {
            resolve(window.AdminServices);
            return;
        }
        
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (window.AdminServices && typeof window.AdminServices.getSettings === 'function') {
                clearInterval(checkInterval);
                resolve(window.AdminServices);
            } else if (Date.now() - startTime > maxWait) {
                clearInterval(checkInterval);
                reject(new Error('AdminServices không sẵn sàng sau ' + maxWait + 'ms'));
            }
        }, 100);
    });
}

let settings = [];
let currentCategory = 'general';

document.addEventListener('DOMContentLoaded', async function() {
    const pathname = window.location.pathname;
    console.log('⚙️ Settings page - pathname:', pathname);
    
    if (pathname === '/settings' || pathname.includes('/settings')) {
        console.log('⚙️ Initializing settings page...');
        try {
            await waitForAdminServices();
            console.log('⚙️ AdminServices ready, initializing page...');
        initSettingsPage();
        } catch (error) {
            console.error('❌ Error waiting for AdminServices:', error);
            if (typeof showToast === 'function') {
                showToast('Không thể tải AdminServices. Vui lòng reload trang.', 'error');
            }
        }
    }
});

async function initSettingsPage() {
    setupEventListeners();
    await loadSettings();
    await loadSystemInfo();
}

function setupEventListeners() {
    // Category tabs
    const categoryTabs = document.querySelectorAll('.category-tab');
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const category = tab.dataset.category;
            switchCategory(category);
        });
    });

    // Save buttons
    const saveGeneralBtn = document.getElementById('saveGeneralBtn');
    if (saveGeneralBtn) {
        saveGeneralBtn.addEventListener('click', () => saveGeneralSettings());
    }

    const saveSecurityBtn = document.getElementById('saveSecurityBtn');
    if (saveSecurityBtn) {
        saveSecurityBtn.addEventListener('click', () => saveSecuritySettings());
    }

    const saveNotificationBtn = document.getElementById('saveNotificationBtn');
    if (saveNotificationBtn) {
        saveNotificationBtn.addEventListener('click', () => saveNotificationSettings());
    }

    // Check system status
    const checkSystemBtn = document.getElementById('checkSystemBtn');
    if (checkSystemBtn) {
        checkSystemBtn.addEventListener('click', () => checkSystemStatus());
    }
}

async function loadSettings(category = null) {
    showLoading();
    try {
        if (!window.AdminServices) {
            throw new Error('AdminServices is not loaded');
        }

        console.log('⚙️ Loading settings...', category ? `category: ${category}` : 'all categories');
        const response = await window.AdminServices.getSettings(category);
        console.log('⚙️ Settings response received:', response);

        // Extract settings from response - xử lý nhiều format
        let settingsList = [];
        if (Array.isArray(response)) {
            settingsList = response;
        } else if (response.settings) {
            settingsList = Array.isArray(response.settings) ? response.settings : [];
        } else if (response.data) {
            if (Array.isArray(response.data)) {
                settingsList = response.data;
            } else if (response.data.settings && Array.isArray(response.data.settings)) {
                settingsList = response.data.settings;
            }
        } else if (response.success && response.data) {
            if (Array.isArray(response.data)) {
                settingsList = response.data;
            } else if (response.data.settings && Array.isArray(response.data.settings)) {
                settingsList = response.data.settings;
            }
        }

        console.log('⚙️ Extracted settings:', settingsList.length);

        if (category) {
            // Update settings for specific category
            settings = settings.filter(s => s.category !== category);
            settings.push(...settingsList);
        } else {
            settings = settingsList;
        }

        renderSettings();
    } catch (error) {
        console.error('❌ Error loading settings:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        showToast('Không thể tải cài đặt: ' + (error.message || 'Unknown error'), 'error');
    } finally {
        hideLoading();
    }
}

function renderSettings() {
    console.log('⚙️ Rendering settings...');
    
    // Group settings by category
    const settingsByCategory = settings.reduce((acc, setting) => {
        if (!acc[setting.category]) {
            acc[setting.category] = [];
        }
        acc[setting.category].push(setting);
        return acc;
    }, {});

    // Render General Settings
    renderCategorySettings('general', settingsByCategory.general || []);
    
    // Render Security Settings
    renderCategorySettings('security', settingsByCategory.security || []);
    
    // Render Notification Settings
    renderCategorySettings('notification', settingsByCategory.notification || []);
}

function renderCategorySettings(category, categorySettings) {
    console.log(`⚙️ Rendering ${category} settings:`, categorySettings.length);
    
    // Map setting keys to form elements
    // Support multiple key variations for flexibility
    const keyToElementId = {
        'general': {
            'site_name': 'systemName',
            'siteName': 'systemName',
            'system_name': 'systemName',
            'site_email': 'contactEmail',
            'siteEmail': 'contactEmail',
            'contact_email': 'contactEmail',
            'site_phone': 'contactPhone',
            'sitePhone': 'contactPhone',
            'contact_phone': 'contactPhone'
        },
        'security': {
            'session_timeout': 'sessionTimeout',
            'sessionTimeout': 'sessionTimeout',
            'session_timeout_minutes': 'sessionTimeout',
            'require_2fa': 'require2FA',
            'require2FA': 'require2FA',
            'require_two_factor': 'require2FA',
            'enable_logging': 'enableLogging',
            'enableLogging': 'enableLogging',
            'logging_enabled': 'enableLogging'
        },
        'notification': {
            'email_notifications': 'emailNotifications',
            'emailNotifications': 'emailNotifications',
            'email_notification_enabled': 'emailNotifications',
            'push_notifications': 'pushNotifications',
            'pushNotifications': 'pushNotifications',
            'push_notification_enabled': 'pushNotifications',
            'notification_email': 'notificationEmail',
            'notificationEmail': 'notificationEmail',
            'admin_notification_email': 'notificationEmail'
        }
    };

    const mapping = keyToElementId[category];
    if (!mapping) {
        console.warn(`⚠️ No mapping found for category: ${category}`);
        return;
    }

    categorySettings.forEach(setting => {
        const elementId = mapping[setting.key];
        if (!elementId) {
            console.log(`ℹ️ No element mapping for setting key: ${setting.key} in category: ${category}`);
            return;
        }

        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`⚠️ Element not found: ${elementId} for setting: ${setting.key}`);
            return;
        }

        // Set value based on type
        try {
            if (setting.type === 'boolean') {
                if (element.type === 'checkbox') {
                    element.checked = setting.value === true || setting.value === 'true' || setting.value === 1;
                }
            } else if (setting.type === 'number') {
                element.value = setting.value || '';
            } else {
                element.value = setting.value || '';
            }

            console.log(`✅ Set ${setting.key} to ${setting.value} (${setting.type}) in element ${elementId}`);
        } catch (error) {
            console.error(`❌ Error setting ${setting.key}:`, error);
        }
    });
}

function switchCategory(category) {
    currentCategory = category;
    
    // Update tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
        if (tab.dataset.category === category) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Load settings for category
    loadSettings(category);
}

async function saveGeneralSettings() {
    showLoading();
    try {
        const systemName = document.getElementById('systemName')?.value?.trim();
        const contactEmail = document.getElementById('contactEmail')?.value?.trim();
        const contactPhone = document.getElementById('contactPhone')?.value?.trim();

        if (!systemName || !contactEmail) {
            showToast('Vui lòng điền đầy đủ thông tin (Tên hệ thống và Email liên hệ)', 'error');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactEmail)) {
            showToast('Email không hợp lệ', 'error');
            return;
        }

        // Try multiple key variations - backend might use different keys
        const settingsToUpdate = [];
        
        // Try to find existing setting keys first
        const generalSettings = settings.filter(s => s.category === 'general');
        const siteNameSetting = generalSettings.find(s => s.key.includes('name') || s.key.includes('Name'));
        const siteEmailSetting = generalSettings.find(s => s.key.includes('email') || s.key.includes('Email'));
        const sitePhoneSetting = generalSettings.find(s => s.key.includes('phone') || s.key.includes('Phone'));

        // Use existing key if found, otherwise use default
        settingsToUpdate.push({
            key: siteNameSetting?.key || 'site_name',
            value: systemName
        });
        settingsToUpdate.push({
            key: siteEmailSetting?.key || 'site_email',
            value: contactEmail
        });
        if (contactPhone) {
            settingsToUpdate.push({
                key: sitePhoneSetting?.key || 'site_phone',
                value: contactPhone
            });
        }

        console.log('⚙️ Updating general settings:', settingsToUpdate);
        const result = await window.AdminServices.updateSettingsBulk(settingsToUpdate);
        console.log('⚙️ Settings updated successfully:', result);

        showToast('✅ Đã lưu cài đặt chung thành công', 'success');
        
        // Reload settings
        await loadSettings('general');
    } catch (error) {
        console.error('❌ Error saving general settings:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        showToast('❌ ' + (error.message || 'Không thể lưu cài đặt chung'), 'error');
    } finally {
        hideLoading();
    }
}

async function saveSecuritySettings() {
    showLoading();
    try {
        const sessionTimeout = document.getElementById('sessionTimeout')?.value?.trim();
        const require2FA = document.getElementById('require2FA')?.checked || false;
        const enableLogging = document.getElementById('enableLogging')?.checked !== false;

        // Validate session timeout
        const timeoutValue = parseInt(sessionTimeout) || 30;
        if (timeoutValue < 5 || timeoutValue > 480) {
            showToast('Thời gian hết hạn session phải từ 5 đến 480 phút', 'error');
            return;
        }

        // Try to find existing setting keys first
        const securitySettings = settings.filter(s => s.category === 'security');
        const sessionTimeoutSetting = securitySettings.find(s => s.key.includes('timeout') || s.key.includes('Timeout'));
        const require2FASetting = securitySettings.find(s => s.key.includes('2fa') || s.key.includes('2FA') || s.key.includes('two_factor'));
        const enableLoggingSetting = securitySettings.find(s => s.key.includes('logging') || s.key.includes('Logging'));

        const settingsToUpdate = [
            {
                key: sessionTimeoutSetting?.key || 'session_timeout',
                value: timeoutValue
            },
            {
                key: require2FASetting?.key || 'require_2fa',
                value: require2FA
            },
            {
                key: enableLoggingSetting?.key || 'enable_logging',
                value: enableLogging
            }
        ];

        console.log('⚙️ Updating security settings:', settingsToUpdate);
        const result = await window.AdminServices.updateSettingsBulk(settingsToUpdate);
        console.log('⚙️ Settings updated successfully:', result);

        showToast('✅ Đã lưu cài đặt bảo mật thành công', 'success');
        
        // Reload settings
        await loadSettings('security');
    } catch (error) {
        console.error('❌ Error saving security settings:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        showToast('❌ ' + (error.message || 'Không thể lưu cài đặt bảo mật'), 'error');
    } finally {
        hideLoading();
    }
}

async function saveNotificationSettings() {
    showLoading();
    try {
        const emailNotifications = document.getElementById('emailNotifications')?.checked !== false;
        const pushNotifications = document.getElementById('pushNotifications')?.checked !== false;
        const notificationEmail = document.getElementById('notificationEmail')?.value?.trim() || '';

        // Validate email if provided
        if (notificationEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(notificationEmail)) {
                showToast('Email thông báo không hợp lệ', 'error');
                return;
            }
        }

        // Try to find existing setting keys first
        const notificationSettings = settings.filter(s => s.category === 'notification');
        const emailNotificationsSetting = notificationSettings.find(s => 
            (s.key.includes('email') && s.key.includes('notification')) || 
            s.key === 'email_notifications' || 
            s.key === 'emailNotifications'
        );
        const pushNotificationsSetting = notificationSettings.find(s => 
            (s.key.includes('push') && s.key.includes('notification')) || 
            s.key === 'push_notifications' || 
            s.key === 'pushNotifications'
        );
        const notificationEmailSetting = notificationSettings.find(s => 
            s.key === 'notification_email' || 
            s.key === 'notificationEmail' || 
            (s.key.includes('email') && !s.key.includes('notification'))
        );

        const settingsToUpdate = [
            {
                key: emailNotificationsSetting?.key || 'email_notifications',
                value: emailNotifications
            },
            {
                key: pushNotificationsSetting?.key || 'push_notifications',
                value: pushNotifications
            }
        ];

        // Only add notification email if provided
        if (notificationEmail) {
            settingsToUpdate.push({
                key: notificationEmailSetting?.key || 'notification_email',
                value: notificationEmail
            });
        }

        console.log('⚙️ Updating notification settings:', settingsToUpdate);
        const result = await window.AdminServices.updateSettingsBulk(settingsToUpdate);
        console.log('⚙️ Settings updated successfully:', result);

        showToast('✅ Đã lưu cài đặt thông báo thành công', 'success');
        
        // Reload settings
        await loadSettings('notification');
    } catch (error) {
        console.error('❌ Error saving notification settings:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        showToast('❌ ' + (error.message || 'Không thể lưu cài đặt thông báo'), 'error');
    } finally {
        hideLoading();
    }
}

async function loadSystemInfo() {
    try {
        if (!window.AdminServices) {
            throw new Error('AdminServices is not loaded');
        }

        console.log('⚙️ Loading system info...');
        const response = await window.AdminServices.getSystemInfo();
        console.log('⚙️ System info response received:', response);

        // Extract system info from response
        let systemInfo = {};
        if (response.system) {
            systemInfo = response.system;
        } else if (response.data && response.data.system) {
            systemInfo = response.data.system;
        } else if (response.success && response.data && response.data.system) {
            systemInfo = response.data.system;
        } else {
            systemInfo = response;
        }

        // Update UI
        const systemVersionEl = document.getElementById('systemVersion');
        if (systemVersionEl && systemInfo.version) {
            systemVersionEl.textContent = systemInfo.version;
        }

        const apiEndpointEl = document.getElementById('apiEndpoint');
        if (apiEndpointEl && window.AdminServices) {
            apiEndpointEl.textContent = window.AdminServices.baseUrl || 'https://server-shelf-stacker-w1ds.onrender.com';
        }

        // Update system status
        const systemStatusEl = document.getElementById('systemStatus');
        if (systemStatusEl) {
            if (systemInfo.database && systemInfo.database.status === 'connected') {
                systemStatusEl.textContent = 'Hoạt động';
                systemStatusEl.className = 'badge badge-success';
            } else {
                systemStatusEl.textContent = 'Lỗi kết nối';
                systemStatusEl.className = 'badge badge-danger';
            }
        }
    } catch (error) {
        console.error('❌ Error loading system info:', error);
        // Don't show error toast for system info, just log it
    }
}

async function checkSystemStatus() {
    showLoading();
    try {
        if (!window.AdminServices) {
            throw new Error('AdminServices is not loaded');
        }

        // Test API connection by getting dashboard stats
            const stats = await window.AdminServices.getDashboardStats();
            const statusEl = document.getElementById('systemStatus');
        
            if (statusEl) {
                statusEl.textContent = 'Hoạt động';
                statusEl.className = 'badge badge-success';
            }
        
        showToast('✅ Hệ thống hoạt động bình thường', 'success');
        
        // Reload system info
        await loadSystemInfo();
    } catch (error) {
        console.error('❌ Error checking system status:', error);
        const statusEl = document.getElementById('systemStatus');
        if (statusEl) {
            statusEl.textContent = 'Lỗi kết nối';
            statusEl.className = 'badge badge-danger';
        }
        showToast('❌ Không thể kết nối đến hệ thống: ' + (error.message || 'Unknown error'), 'error');
    } finally {
        hideLoading();
    }
}

// Export functions for onclick handlers
window.saveGeneralSettings = saveGeneralSettings;
window.saveSecuritySettings = saveSecuritySettings;
window.saveNotificationSettings = saveNotificationSettings;
window.checkSystemStatus = checkSystemStatus;
