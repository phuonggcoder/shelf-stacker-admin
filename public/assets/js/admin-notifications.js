/**
 * Admin Notifications Management JavaScript
 */

// Helper: Đợi AdminServices sẵn sàng
function waitForAdminServices(maxWait = 5000) {
    return new Promise((resolve, reject) => {
        if (window.AdminServices && typeof window.AdminServices.getNotificationTemplates === 'function') {
            resolve(window.AdminServices);
            return;
        }
        
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (window.AdminServices && typeof window.AdminServices.getNotificationTemplates === 'function') {
                clearInterval(checkInterval);
                resolve(window.AdminServices);
            } else if (Date.now() - startTime > maxWait) {
                clearInterval(checkInterval);
                reject(new Error('AdminServices không sẵn sàng sau ' + maxWait + 'ms'));
            }
        }, 100);
    });
}

let currentTab = 'templates';

document.addEventListener('DOMContentLoaded', async function() {
    const pathname = window.location.pathname;
    console.log('🔔 Notifications page - pathname:', pathname);
    
    if (pathname === '/notifications' || pathname.includes('/notifications')) {
        console.log('🔔 Initializing notifications page...');
        try {
            await waitForAdminServices();
            console.log('🔔 AdminServices ready, initializing page...');
            initNotificationsPage();
        } catch (error) {
            console.error('❌ Error waiting for AdminServices:', error);
            if (typeof showToast === 'function') {
                showToast('Không thể tải AdminServices. Vui lòng reload trang.', 'error');
            }
        }
    }
});

function initNotificationsPage() {
    setupTabs();
    setupEventListeners();
    loadTemplates();
}

function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
}

function switchTab(tab) {
    currentTab = tab;
    
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
            btn.style.borderBottom = '2px solid #6366f1';
            btn.style.color = '#111827';
        } else {
            btn.classList.remove('active');
            btn.style.borderBottom = 'none';
            btn.style.color = '#6b7280';
        }
    });

    // Show/hide content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });

    const activeTab = document.getElementById(tab + 'Tab');
    if (activeTab) activeTab.style.display = 'block';

    // Load data for active tab
    if (tab === 'templates') loadTemplates();
    else if (tab === 'scheduled') loadScheduled();
    else if (tab === 'history') loadHistory();
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                loadTemplates(e.target.value);
            }, 500);
        });
    }

    const addTemplateBtn = document.getElementById('addTemplateBtn');
    if (addTemplateBtn) {
        addTemplateBtn.addEventListener('click', () => {
            showAddTemplateModal();
        });
    }

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            if (currentTab === 'templates') loadTemplates();
            else if (currentTab === 'scheduled') loadScheduled();
            else if (currentTab === 'history') loadHistory();
        });
    }

    const sendForm = document.getElementById('sendNotificationForm');
    if (sendForm) {
        sendForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await sendInstantNotification();
        });
    }
}

async function loadTemplates(search = '') {
    showLoading();
    try {
        const params = {};
        if (search) params.search = search;
        
        const response = await window.AdminServices.getNotificationTemplates(params);
        const templates = response.data || response || [];
        renderTemplates(templates);
    } catch (error) {
        console.error('Error loading templates:', error);
        showToast('Không thể tải danh sách templates', 'error');
        renderTemplates([]);
    } finally {
        hideLoading();
    }
}

function renderTemplates(templates) {
    const tbody = document.getElementById('templatesTableBody');
    if (!tbody) return;

    if (templates.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-inbox" style="font-size: 3rem; color: #d1d5db;"></i>
                    <p style="color: #6b7280; margin-top: 1rem;">Không tìm thấy template nào</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = templates.map(template => `
        <tr>
            <td><strong>${template.name || 'N/A'}</strong></td>
            <td>
                <span class="badge ${template.type === 'email' ? 'badge-primary' : template.type === 'push' ? 'badge-info' : 'badge-secondary'}">
                    ${template.type || 'N/A'}
                </span>
            </td>
            <td>${template.event || 'N/A'}</td>
            <td>${template.title || 'N/A'}</td>
            <td>
                <span class="badge ${template.isActive !== false ? 'badge-success' : 'badge-danger'}">
                    ${template.isActive !== false ? 'Hoạt động' : 'Tắt'}
                </span>
            </td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-sm btn-primary" onclick="viewTemplate('${template._id}')" title="Xem"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-secondary" onclick="editTemplate('${template._id}')" title="Sửa"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTemplate('${template._id}')" title="Xóa"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');

    const countEl = document.getElementById('templatesCount');
    if (countEl) countEl.textContent = `${templates.length} templates`;
}

async function loadScheduled() {
    showLoading();
    try {
        const response = await window.AdminServices.getScheduledNotifications();
        const scheduled = response.data || response || [];
        renderScheduled(scheduled);
    } catch (error) {
        console.error('Error loading scheduled:', error);
        showToast('Không thể tải danh sách đã lên lịch', 'error');
        renderScheduled([]);
    } finally {
        hideLoading();
    }
}

function renderScheduled(scheduled) {
    const container = document.getElementById('scheduledList');
    if (!container) return;

    if (scheduled.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <i class="fas fa-inbox" style="font-size: 3rem; color: #d1d5db;"></i>
                <p style="color: #6b7280; margin-top: 1rem;">Chưa có thông báo nào được lên lịch</p>
            </div>
        `;
        return;
    }

    container.innerHTML = scheduled.map(item => `
        <div style="padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 0.5rem 0;">${item.template?.name || 'N/A'}</h4>
                    <p style="color: #6b7280; margin: 0 0 0.5rem 0;">${item.template?.title || ''}</p>
                    <p style="color: #6b7280; font-size: 0.9rem; margin: 0;">
                        <i class="fas fa-clock"></i> ${window.AdminServices.formatDate(item.scheduledAt)}
                    </p>
                </div>
                <button class="btn btn-sm btn-danger" onclick="cancelScheduled('${item._id}')">
                    <i class="fas fa-times"></i> Hủy
                </button>
            </div>
        </div>
    `).join('');
}

async function loadHistory() {
    showLoading();
    try {
        const response = await window.AdminServices.getNotificationHistory({ limit: 50 });
        const history = response.data || response || [];
        renderHistory(history);
    } catch (error) {
        console.error('Error loading history:', error);
        showToast('Không thể tải lịch sử', 'error');
        renderHistory([]);
    } finally {
        hideLoading();
    }
}

function renderHistory(history) {
    const container = document.getElementById('historyList');
    if (!container) return;

    if (history.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <i class="fas fa-inbox" style="font-size: 3rem; color: #d1d5db;"></i>
                <p style="color: #6b7280; margin-top: 1rem;">Chưa có lịch sử gửi thông báo</p>
            </div>
        `;
        return;
    }

    container.innerHTML = history.map(item => `
        <div style="padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 0.5rem 0;">${item.title || 'N/A'}</h4>
                    <p style="color: #6b7280; margin: 0 0 0.5rem 0;">${item.message || ''}</p>
                    <p style="color: #6b7280; font-size: 0.9rem; margin: 0;">
                        <i class="fas fa-clock"></i> ${window.AdminServices.formatDate(item.createdAt)}
                        <span style="margin-left: 1rem;">
                            <span class="badge ${item.status === 'sent' ? 'badge-success' : 'badge-danger'}">
                                ${item.status === 'sent' ? 'Đã gửi' : 'Thất bại'}
                            </span>
                        </span>
                    </p>
                </div>
            </div>
        </div>
    `).join('');
}

async function sendInstantNotification() {
    try {
        // Get form values
        const title = document.getElementById('sendTitle')?.value?.trim();
        const message = document.getElementById('sendMessage')?.value?.trim();
        const recipientsInput = document.getElementById('sendRecipients')?.value?.trim();
        const sendToAllCheckbox = document.getElementById('sendToAll');
        const imageInput = document.getElementById('sendImage')?.value?.trim();
        const notificationType = document.getElementById('notificationType')?.value || 'push';
        
        // Validate
        if (!title || !message) {
            showToast('Vui lòng điền đầy đủ tiêu đề và nội dung', 'error');
            return;
        }
        
        // Prepare request data according to API format
        // API format: { title, message, type, userId, userIds, sendToAll, image, data }
        const requestData = {
            title,
            message,
            type: notificationType || 'push'
        };
        
        // Handle recipients
        const sendToAll = sendToAllCheckbox?.checked || false;
        if (sendToAll) {
            requestData.sendToAll = true;
        } else if (recipientsInput) {
            // Parse recipients - could be comma-separated user IDs
            const recipients = recipientsInput.split(',').map(r => r.trim()).filter(r => r);
            if (recipients.length === 0) {
                showToast('Vui lòng nhập ít nhất một người nhận hoặc chọn gửi cho tất cả', 'error');
                return;
            }
            if (recipients.length === 1) {
                requestData.userId = recipients[0];
            } else {
                requestData.userIds = recipients;
            }
        } else {
            showToast('Vui lòng chọn người nhận hoặc chọn gửi cho tất cả', 'error');
            return;
        }
        
        // Add image if provided
        if (imageInput) {
            requestData.image = imageInput;
        }
        
        // Add custom data if needed
        requestData.data = {};
        
        console.log('📢 Sending instant notification with data:', requestData);
        
        // Disable send button
        const sendBtn = document.getElementById('send-notification-btn') || 
                        document.querySelector('#sendNotificationForm button[type="submit"]');
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.textContent = 'Đang gửi...';
            sendBtn.style.opacity = '0.6';
        }
        
        showLoading();
        const result = await window.AdminServices.sendInstantNotification(requestData);
        console.log('📢 Notification sent successfully:', result);
        
        // Show success message with details
        const sentCount = result?.result?.sent_count || result?.sent_count || 0;
        const failedCount = result?.result?.failed_count || result?.failed_count || 0;
        let message = 'Gửi thông báo thành công';
        if (sentCount > 0 || failedCount > 0) {
            message += ` (Đã gửi: ${sentCount}, Thất bại: ${failedCount})`;
        }
        showToast(message, 'success');
        
        // Reset form
        const form = document.getElementById('sendNotificationForm');
        if (form) {
            form.reset();
        }
    } catch (error) {
        console.error('❌ Error sending notification:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        const errorMessage = error.message || 'Không thể gửi thông báo';
        showToast('❌ ' + errorMessage, 'error');
    } finally {
        hideLoading();
        // Re-enable button
        const sendBtn = document.getElementById('send-notification-btn') || 
                        document.querySelector('#sendNotificationForm button[type="submit"]');
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Gửi thông báo';
            sendBtn.style.opacity = '1';
        }
    }
}

function viewTemplate(id) {
    window.location.href = `/notification-admin?template=${id}`;
}

function editTemplate(id) {
    window.location.href = `/notification-admin?template=${id}&edit=true`;
}

async function deleteTemplate(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa template này?')) return;

    try {
        showLoading();
        await window.AdminServices.deleteNotificationTemplate(id);
        showToast('Xóa template thành công', 'success');
        loadTemplates();
    } catch (error) {
        console.error('Error deleting template:', error);
        showToast('Không thể xóa template', 'error');
    } finally {
        hideLoading();
    }
}

async function cancelScheduled(id) {
    if (!confirm('Bạn có chắc chắn muốn hủy thông báo đã lên lịch này?')) return;

    try {
        showLoading();
        await window.AdminServices.deleteScheduledNotification(id);
        showToast('Hủy thông báo thành công', 'success');
        loadScheduled();
    } catch (error) {
        console.error('Error canceling scheduled:', error);
        showToast('Không thể hủy thông báo', 'error');
    } finally {
        hideLoading();
    }
}

function showAddTemplateModal() {
    window.location.href = '/notification-admin?action=create';
}

window.viewTemplate = viewTemplate;
window.editTemplate = editTemplate;
window.deleteTemplate = deleteTemplate;
window.cancelScheduled = cancelScheduled;


