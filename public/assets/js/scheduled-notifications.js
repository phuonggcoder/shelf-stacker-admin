// Scheduled Notifications Management System
// Tích hợp với hệ thống notification admin hiện có

// Configuration
const API_BASE_URL = 'http://localhost:3000'; // Có thể thay đổi thành production URL
const TOKEN_KEY = 'admin_token';

// Global variables
let scheduledNotifications = [];
let currentScheduledFilter = 'all';
let scheduledCurrentPage = 1;
let scheduledTotalPages = 1;

// Utility functions
function getAuthToken() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

function getAuthHeaders() {
    const token = getAuthToken();
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('message-container');
    if (messageContainer) {
        messageContainer.innerHTML = `
            <div class="message ${type}">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.remove()" class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        messageContainer.style.display = 'block';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 5000);
    }
}

function showLoading(show = true) {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

function formatTime(timeString) {
    return timeString;
}

// Scheduled Notifications API Functions
async function scheduleNotification(notificationData) {
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/api/noti/schedule`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(notificationData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('✅ Thông báo đã được lập lịch thành công!', 'success');
            await loadScheduledNotifications();
            return { success: true, data };
        } else {
            showMessage(`❌ Lỗi: ${data.message}`, 'error');
            return { success: false, message: data.message };
        }
    } catch (error) {
        console.error('Error scheduling notification:', error);
        showMessage(`❌ Lỗi kết nối: ${error.message}`, 'error');
        return { success: false, message: error.message };
    } finally {
        showLoading(false);
    }
}

async function getScheduledNotifications(page = 1, filter = 'all') {
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/api/noti/scheduled?page=${page}&filter=${filter}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (data.success) {
            scheduledNotifications = data.data.notifications || [];
            scheduledTotalPages = data.data.totalPages || 1;
            scheduledCurrentPage = page;
            currentScheduledFilter = filter;
            
            renderScheduledNotifications();
            updateScheduledStats();
            return { success: true, data: data.data };
        } else {
            showMessage(`❌ Lỗi: ${data.message}`, 'error');
            return { success: false, message: data.message };
        }
    } catch (error) {
        console.error('Error getting scheduled notifications:', error);
        showMessage(`❌ Lỗi kết nối: ${error.message}`, 'error');
        return { success: false, message: error.message };
    } finally {
        showLoading(false);
    }
}

async function deleteScheduledNotification(notificationId) {
    try {
        if (!confirm('Bạn có chắc chắn muốn xóa thông báo đã lập lịch này?')) {
            return { success: false, message: 'Đã hủy' };
        }
        
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/api/noti/scheduled/${notificationId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('✅ Đã xóa thông báo đã lập lịch thành công!', 'success');
            await loadScheduledNotifications();
            return { success: true, data };
        } else {
            showMessage(`❌ Lỗi: ${data.message}`, 'error');
            return { success: false, message: data.message };
        }
    } catch (error) {
        console.error('Error deleting scheduled notification:', error);
        showMessage(`❌ Lỗi kết nối: ${error.message}`, 'error');
        return { success: false, message: error.message };
    } finally {
        showLoading(false);
    }
}

async function updateScheduledNotification(notificationId, updateData) {
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/api/noti/scheduled/${notificationId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updateData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('✅ Đã cập nhật thông báo đã lập lịch thành công!', 'success');
            await loadScheduledNotifications();
            return { success: true, data };
        } else {
            showMessage(`❌ Lỗi: ${data.message}`, 'error');
            return { success: false, message: data.message };
        }
    } catch (error) {
        console.error('Error updating scheduled notification:', error);
        showMessage(`❌ Lỗi kết nối: ${error.message}`, 'error');
        return { success: false, message: error.message };
    } finally {
        showLoading(false);
    }
}

// UI Functions
function renderScheduledNotifications() {
    const scheduledList = document.getElementById('scheduled-list');
    if (!scheduledList) return;
    
    if (scheduledNotifications.length === 0) {
        scheduledList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clock"></i>
                <h3>Chưa có thông báo nào được lập lịch</h3>
                <p>Bắt đầu lập lịch thông báo để tự động gửi theo thời gian</p>
            </div>
        `;
        return;
    }
    
    scheduledList.innerHTML = scheduledNotifications.map(notification => `
        <div class="scheduled-item ${notification.status}" data-id="${notification._id}">
            <div class="scheduled-header">
                <div class="scheduled-title">
                    <h4>${notification.title}</h4>
                    <span class="status-badge ${notification.status}">
                        ${getStatusText(notification.status)}
                    </span>
                </div>
                <div class="scheduled-actions">
                    <button class="btn-icon" onclick="editScheduledNotification('${notification._id}')" title="Chỉnh sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteScheduledNotification('${notification._id}')" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <div class="scheduled-content">
                <p class="scheduled-message">${notification.message}</p>
                <div class="scheduled-details">
                    <div class="detail-item">
                        <i class="fas fa-calendar"></i>
                        <span>Gửi lúc: ${formatDateTime(notification.sendAt)}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-users"></i>
                        <span>Người nhận: ${getRecipientText(notification.recipients)}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-tag"></i>
                        <span>Loại: ${getTypeText(notification.type)}</span>
                    </div>
                </div>
            </div>
            
            <div class="scheduled-footer">
                <div class="scheduled-time">
                    <i class="fas fa-clock"></i>
                    <span>Tạo lúc: ${formatDateTime(notification.createdAt)}</span>
                </div>
                <div class="scheduled-id">
                    ID: ${notification._id}
                </div>
            </div>
        </div>
    `).join('');
    
    renderScheduledPagination();
}

function renderScheduledPagination() {
    const paginationContainer = document.getElementById('scheduled-pagination');
    if (!paginationContainer || scheduledTotalPages <= 1) {
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<div class="pagination-controls">';
    
    // Previous button
    if (scheduledCurrentPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="changeScheduledPage(${scheduledCurrentPage - 1})">
            <i class="fas fa-chevron-left"></i> Trước
        </button>`;
    }
    
    // Page numbers
    const startPage = Math.max(1, scheduledCurrentPage - 2);
    const endPage = Math.min(scheduledTotalPages, scheduledCurrentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<button class="pagination-btn ${i === scheduledCurrentPage ? 'active' : ''}" 
            onclick="changeScheduledPage(${i})">${i}</button>`;
    }
    
    // Next button
    if (scheduledCurrentPage < scheduledTotalPages) {
        paginationHTML += `<button class="pagination-btn" onclick="changeScheduledPage(${scheduledCurrentPage + 1})">
            Sau <i class="fas fa-chevron-right"></i>
        </button>`;
    }
    
    paginationHTML += '</div>';
    paginationContainer.innerHTML = paginationHTML;
}

function updateScheduledStats() {
    const stats = {
        total: scheduledNotifications.length,
        pending: scheduledNotifications.filter(n => n.status === 'pending').length,
        sent: scheduledNotifications.filter(n => n.status === 'sent').length,
        cancelled: scheduledNotifications.filter(n => n.status === 'cancelled').length
    };
    
    // Update stats in dashboard
    const scheduledCountElement = document.getElementById('scheduled-count');
    if (scheduledCountElement) {
        scheduledCountElement.textContent = stats.pending;
    }
    
    // Update scheduled section stats
    const scheduledStatsContainer = document.getElementById('scheduled-stats');
    if (scheduledStatsContainer) {
        scheduledStatsContainer.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Tổng số:</span>
                <span class="stat-value">${stats.total}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Đang chờ:</span>
                <span class="stat-value">${stats.pending}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Đã gửi:</span>
                <span class="stat-value">${stats.sent}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Đã hủy:</span>
                <span class="stat-value">${stats.cancelled}</span>
            </div>
        `;
    }
}

// Helper functions
function getStatusText(status) {
    const statusMap = {
        'pending': 'Đang chờ',
        'sent': 'Đã gửi',
        'failed': 'Thất bại',
        'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
}

function getTypeText(type) {
    const typeMap = {
        'scheduled': 'Lập lịch',
        'reminder': 'Nhắc nhở',
        'event': 'Sự kiện',
        'marketing': 'Marketing',
        'system': 'Hệ thống'
    };
    return typeMap[type] || type;
}

function getRecipientText(recipients) {
    if (!recipients) return 'Tất cả người dùng';
    
    if (recipients.type === 'all') {
        return 'Tất cả người dùng';
    } else if (recipients.type === 'specific') {
        return `Người dùng cụ thể (${recipients.userIds?.length || 1})`;
    } else if (recipients.type === 'multiple') {
        return `${recipients.userIds?.length || 0} người dùng`;
    }
    
    return 'Không xác định';
}

// Event handlers
async function loadScheduledNotifications() {
    await getScheduledNotifications(scheduledCurrentPage, currentScheduledFilter);
}

async function changeScheduledPage(page) {
    await getScheduledNotifications(page, currentScheduledFilter);
}

async function changeScheduledFilter(filter) {
    await getScheduledNotifications(1, filter);
}

function editScheduledNotification(notificationId) {
    const notification = scheduledNotifications.find(n => n._id === notificationId);
    if (!notification) {
        showMessage('❌ Không tìm thấy thông báo', 'error');
        return;
    }
    
    // Populate the scheduled form with notification data
    populateScheduledForm(notification);
    
    // Switch to send section
    switchToSection('send');
    
    // Scroll to scheduled form
    const scheduledForm = document.getElementById('scheduled-form');
    if (scheduledForm) {
        scheduledForm.scrollIntoView({ behavior: 'smooth' });
    }
}

function populateScheduledForm(notification) {
    const sendAt = new Date(notification.sendAt);
    
    // Set date and time
    const dateInput = document.getElementById('schedule-date');
    const timeInput = document.getElementById('schedule-time');
    
    if (dateInput) {
        dateInput.value = sendAt.toISOString().split('T')[0];
    }
    if (timeInput) {
        timeInput.value = sendAt.toTimeString().slice(0, 5);
    }
    
    // Set title and message
    const titleInput = document.getElementById('scheduled-title');
    const messageInput = document.getElementById('scheduled-message');
    
    if (titleInput) titleInput.value = notification.title;
    if (messageInput) messageInput.value = notification.message;
    
    // Set recipient type
    const recipientType = notification.recipients?.type || 'all';
    const radioButtons = document.querySelectorAll('input[name="scheduled-recipient-type"]');
    radioButtons.forEach(radio => {
        if (radio.value === recipientType) {
            radio.checked = true;
        }
    });
    
    // Set recipient IDs
    const userIdInput = document.getElementById('scheduled-user-id');
    const userIdsInput = document.getElementById('scheduled-user-ids');
    
    if (recipientType === 'specific' && userIdInput) {
        userIdInput.value = notification.recipients?.userIds?.[0] || '';
    } else if (recipientType === 'multiple' && userIdsInput) {
        userIdsInput.value = notification.recipients?.userIds?.join(', ') || '';
    }
    
    // Update form visibility
    updateScheduledRecipientVisibility();
}

// Scheduled form handlers
function handleScheduledFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const notificationData = {
        title: formData.get('scheduled-title') || document.getElementById('scheduled-title')?.value,
        message: formData.get('scheduled-message') || document.getElementById('scheduled-message')?.value,
        type: 'scheduled',
        sendAt: getScheduledDateTime(),
        recipients: getScheduledRecipients()
    };
    
    // Validate data
    if (!notificationData.title || !notificationData.message) {
        showMessage('❌ Vui lòng điền đầy đủ tiêu đề và nội dung', 'error');
        return;
    }
    
    if (!notificationData.sendAt) {
        showMessage('❌ Vui lòng chọn thời gian gửi', 'error');
        return;
    }
    
    if (notificationData.sendAt <= Date.now()) {
        showMessage('❌ Thời gian gửi phải trong tương lai', 'error');
        return;
    }
    
    // Schedule notification
    scheduleNotification(notificationData).then(result => {
        if (result.success) {
            // Reset form
            event.target.reset();
            document.getElementById('scheduled-image-preview').innerHTML = '';
        }
    });
}

function getScheduledDateTime() {
    const dateInput = document.getElementById('schedule-date');
    const timeInput = document.getElementById('schedule-time');
    
    if (!dateInput?.value || !timeInput?.value) {
        return null;
    }
    
    const dateTimeString = `${dateInput.value}T${timeInput.value}:00`;
    return new Date(dateTimeString).getTime();
}

function getScheduledRecipients() {
    const recipientType = document.querySelector('input[name="scheduled-recipient-type"]:checked')?.value || 'all';
    
    if (recipientType === 'all') {
        return { type: 'all' };
    } else if (recipientType === 'specific') {
        const userId = document.getElementById('scheduled-user-id')?.value?.trim();
        if (!userId) {
            showMessage('❌ Vui lòng nhập ID người dùng', 'error');
            return null;
        }
        return { type: 'specific', userIds: [userId] };
    } else if (recipientType === 'multiple') {
        const userIds = document.getElementById('scheduled-user-ids')?.value?.trim();
        if (!userIds) {
            showMessage('❌ Vui lòng nhập danh sách ID người dùng', 'error');
            return null;
        }
        return { type: 'multiple', userIds: userIds.split(',').map(id => id.trim()) };
    }
    
    return { type: 'all' };
}

function updateScheduledRecipientVisibility() {
    const recipientType = document.querySelector('input[name="scheduled-recipient-type"]:checked')?.value || 'all';
    
    const userSelector = document.getElementById('scheduled-user-selector');
    const multipleUsers = document.getElementById('scheduled-multiple-users');
    
    if (userSelector) userSelector.style.display = recipientType === 'specific' ? 'block' : 'none';
    if (multipleUsers) multipleUsers.style.display = recipientType === 'multiple' ? 'block' : 'none';
}

// Quick schedule functions
async function scheduleForTomorrow(title, message, time = '09:00') {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(parseInt(time.split(':')[0]), parseInt(time.split(':')[1]), 0, 0);
    
    const notificationData = {
        title,
        message,
        type: 'scheduled',
        sendAt: tomorrow.getTime(),
        recipients: { type: 'all' }
    };
    
    return await scheduleNotification(notificationData);
}

async function scheduleForNextWeek(title, message, dayOfWeek = 1, time = '09:00') {
    const nextWeek = new Date();
    const currentDay = nextWeek.getDay();
    const daysToAdd = (dayOfWeek - currentDay + 7) % 7;
    nextWeek.setDate(nextWeek.getDate() + daysToAdd);
    nextWeek.setHours(parseInt(time.split(':')[0]), parseInt(time.split(':')[1]), 0, 0);
    
    const notificationData = {
        title,
        message,
        type: 'scheduled',
        sendAt: nextWeek.getTime(),
        recipients: { type: 'all' }
    };
    
    return await scheduleNotification(notificationData);
}

async function scheduleInMinutes(title, message, minutes) {
    const sendAt = Date.now() + (minutes * 60 * 1000);
    
    const notificationData = {
        title,
        message,
        type: 'scheduled',
        sendAt,
        recipients: { type: 'all' }
    };
    
    return await scheduleNotification(notificationData);
}

async function scheduleInHours(title, message, hours) {
    const sendAt = Date.now() + (hours * 60 * 60 * 1000);
    
    const notificationData = {
        title,
        message,
        type: 'scheduled',
        sendAt,
        recipients: { type: 'all' }
    };
    
    return await scheduleNotification(notificationData);
}

// Quick schedule buttons
function setupQuickScheduleButtons() {
    // Add quick schedule buttons to the scheduled section
    const scheduledSection = document.getElementById('scheduled');
    if (scheduledSection) {
        const quickScheduleDiv = document.createElement('div');
        quickScheduleDiv.className = 'quick-schedule-buttons';
        quickScheduleDiv.innerHTML = `
            <h3>Lập lịch nhanh</h3>
            <div class="quick-buttons">
                <button class="btn-secondary" onclick="quickScheduleTomorrow()">
                    <i class="fas fa-sun"></i> Ngày mai 09:00
                </button>
                <button class="btn-secondary" onclick="quickScheduleNextWeek()">
                    <i class="fas fa-calendar-week"></i> Tuần tới thứ 2
                </button>
                <button class="btn-secondary" onclick="quickSchedule30Min()">
                    <i class="fas fa-clock"></i> Sau 30 phút
                </button>
                <button class="btn-secondary" onclick="quickSchedule2Hours()">
                    <i class="fas fa-hourglass-half"></i> Sau 2 giờ
                </button>
            </div>
        `;
        
        // Insert after section header
        const sectionHeader = scheduledSection.querySelector('.section-header');
        if (sectionHeader) {
            sectionHeader.insertAdjacentElement('afterend', quickScheduleDiv);
        }
    }
}

async function quickScheduleTomorrow() {
    const title = prompt('Nhập tiêu đề thông báo:');
    if (!title) return;
    
    const message = prompt('Nhập nội dung thông báo:');
    if (!message) return;
    
    await scheduleForTomorrow(title, message);
}

async function quickScheduleNextWeek() {
    const title = prompt('Nhập tiêu đề thông báo:');
    if (!title) return;
    
    const message = prompt('Nhập nội dung thông báo:');
    if (!message) return;
    
    await scheduleForNextWeek(title, message);
}

async function quickSchedule30Min() {
    const title = prompt('Nhập tiêu đề thông báo:');
    if (!title) return;
    
    const message = prompt('Nhập nội dung thông báo:');
    if (!message) return;
    
    await scheduleInMinutes(title, message, 30);
}

async function quickSchedule2Hours() {
    const title = prompt('Nhập tiêu đề thông báo:');
    if (!title) return;
    
    const message = prompt('Nhập nội dung thông báo:');
    if (!message) return;
    
    await scheduleInHours(title, message, 2);
}

// Initialize scheduled notifications system
function initScheduledNotifications() {
    // Set up event listeners
    const scheduledForm = document.getElementById('scheduled-form');
    if (scheduledForm) {
        scheduledForm.addEventListener('submit', handleScheduledFormSubmit);
    }
    
    // Set up recipient type change listeners
    const recipientRadios = document.querySelectorAll('input[name="scheduled-recipient-type"]');
    recipientRadios.forEach(radio => {
        radio.addEventListener('change', updateScheduledRecipientVisibility);
    });
    
    // Set up filter buttons
    const filterButtons = document.querySelectorAll('[data-filter]');
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const filter = e.target.dataset.filter;
            changeScheduledFilter(filter);
            
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
    
    // Set up search functionality
    const searchInput = document.getElementById('scheduled-search');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                // Implement search functionality
                console.log('Searching for:', e.target.value);
            }, 500);
        });
    }
    
    // Set up quick schedule buttons
    setupQuickScheduleButtons();
    
    // Load initial data
    loadScheduledNotifications();
}

// Export functions for use in other modules
window.ScheduledNotifications = {
    scheduleNotification,
    getScheduledNotifications,
    deleteScheduledNotification,
    updateScheduledNotification,
    scheduleForTomorrow,
    scheduleForNextWeek,
    scheduleInMinutes,
    scheduleInHours,
    loadScheduledNotifications,
    initScheduledNotifications
};

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the notification admin page
    if (document.getElementById('scheduled')) {
        initScheduledNotifications();
    }
});



