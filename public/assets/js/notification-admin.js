// Notification Admin System - Simple Version
console.log('Notification Admin System loaded');

// Global variables
let selectedEvent = null;
let templates = [];
let events = [
    { value: 'login_success', label: 'Đăng nhập thành công' },
    { value: 'order_success', label: 'Đặt hàng thành công' },
    { value: 'payment_success', label: 'Thanh toán thành công' },
    { value: 'delivery_success', label: 'Giao hàng thành công' },
    { value: 'email_verified', label: 'Xác thực email' },
    { value: 'custom', label: 'Tùy chỉnh' }
];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    initializeSystem();
});

function initializeSystem() {
    console.log('Initializing notification admin system...');
    
    // Load initial data
    loadStats();
    loadEvents();
    loadTemplates();
    
    // Set up event listeners
    setupEventListeners();
    
    console.log('System initialized successfully');
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Tab change events
    const tabs = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(event) {
            console.log('Tab changed to:', event.target.id);
            handleTabChange(event.target.id);
        });
    });
    
    // Form submissions
    const eventForm = document.getElementById('eventNotificationForm');
    if (eventForm) {
        eventForm.addEventListener('submit', handleEventNotificationSubmit);
    }
    
    const scheduledForm = document.getElementById('scheduledNotificationForm');
    if (scheduledForm) {
        scheduledForm.addEventListener('submit', handleScheduledNotificationSubmit);
    }
    
    const instantForm = document.getElementById('instantNotificationForm');
    if (instantForm) {
        instantForm.addEventListener('submit', handleInstantNotificationSubmit);
    }
    
    console.log('Event listeners set up');
}

function handleTabChange(tabId) {
    console.log('Handling tab change:', tabId);
    
    switch(tabId) {
        case 'templates-tab':
            loadTemplates();
            break;
        case 'event-tab':
            loadEvents();
            loadTemplates(); // For template dropdown
            break;
        case 'scheduled-tab':
            loadScheduledNotifications();
            break;
        case 'instant-tab':
            loadTemplates(); // For template dropdown
            break;
        case 'history-tab':
            loadHistory();
            break;
    }
}

// Stats functions
function loadStats() {
    console.log('Loading stats...');
    
    // For now, use mock data
    document.getElementById('templatesCount').textContent = '0';
    document.getElementById('sentCount').textContent = '0';
    document.getElementById('pendingCount').textContent = '0';
    document.getElementById('failedCount').textContent = '0';
    
    console.log('Stats loaded');
}

// Events functions
function loadEvents() {
    console.log('Loading events...');
    
    const eventsList = document.getElementById('eventsList');
    if (!eventsList) {
        console.error('Events list container not found');
        return;
    }
    
    if (events.length === 0) {
        eventsList.innerHTML = '<p class="text-muted">Không có sự kiện nào.</p>';
        return;
    }
    
    eventsList.innerHTML = events.map(event => `
        <div class="event-card" onclick="selectEvent('${event.value}')" data-event="${event.value}">
            <div class="d-flex align-items-center">
                <div class="flex-grow-1">
                    <h6 class="mb-1">${event.label}</h6>
                    <small class="text-muted">${event.value}</small>
                </div>
                <i class="fas fa-chevron-right text-muted"></i>
            </div>
        </div>
    `).join('');
    
    console.log('Events loaded:', events.length);
}

function selectEvent(eventValue) {
    console.log('Event selected:', eventValue);
    selectedEvent = eventValue;
    
    // Update UI
    document.querySelectorAll('.event-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    const selectedCard = document.querySelector(`[data-event="${eventValue}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
}

// Template functions
function loadTemplates() {
    console.log('Loading templates...');
    
    // For now, use mock data
    templates = [
        {
            id: 1,
            name: 'Thông báo đơn hàng thành công',
            type: 'user',
            event: 'order_success',
            status: 'active',
            createdAt: '2024-08-25'
        }
    ];
    
    updateTemplatesTable();
    updateTemplateDropdowns();
    
    console.log('Templates loaded:', templates.length);
}

function updateTemplatesTable() {
    const tbody = document.getElementById('templatesTableBody');
    if (!tbody) return;
    
    if (templates.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Không có template nào</td></tr>';
        return;
    }
    
    tbody.innerHTML = templates.map(template => `
        <tr>
            <td>${template.id}</td>
            <td>${template.name}</td>
            <td><span class="badge bg-primary">${template.type}</span></td>
            <td>${template.event}</td>
            <td><span class="badge bg-success">${template.status}</span></td>
            <td>${template.createdAt}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editTemplate(${template.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteTemplate(${template.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function updateTemplateDropdowns() {
    const dropdowns = ['eventTemplateSelect', 'instantTemplateSelect'];
    
    dropdowns.forEach(dropdownId => {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            const currentValue = dropdown.value;
            dropdown.innerHTML = '<option value="">Chọn template...</option>' + 
                templates.map(template => `<option value="${template.id}">${template.name}</option>`).join('');
            dropdown.value = currentValue;
        }
    });
}

// Template modal functions
function openTemplateModal() {
    console.log('Opening template modal...');
    
    const modal = document.getElementById('templateModal');
    const title = document.getElementById('templateModalTitle');
    const form = document.getElementById('templateForm');
    
    if (!modal || !title || !form) {
        console.error('Modal elements not found');
        alert('Lỗi: Không thể mở modal');
        return;
    }
    
    // Reset form
    form.reset();
    title.textContent = 'Tạo Template mới';
    
    // Clear content
    const contentTextarea = document.getElementById('templateContent');
    if (contentTextarea) {
        contentTextarea.value = '';
    }
    
    // Show modal
    try {
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        console.log('Modal opened successfully');
    } catch (error) {
        console.error('Error opening modal:', error);
        alert('Lỗi khi mở modal: ' + error.message);
    }
}

// Global function for inserting variables
window.insertVariable = function(variable) {
    console.log('Inserting variable:', variable);
    
    const textarea = document.getElementById('templateContent');
    if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        
        textarea.value = before + variable + after;
        textarea.selectionStart = textarea.selectionEnd = start + variable.length;
        textarea.focus();
        
        console.log('Variable inserted successfully');
    }
};

function saveTemplate() {
    console.log('Saving template...');
    
    const form = document.getElementById('templateForm');
    if (!form) {
        console.error('Template form not found');
        return;
    }
    
    const formData = new FormData(form);
    const templateData = {
        name: formData.get('templateName'),
        type: formData.get('templateType'),
        event: formData.get('templateEvent'),
        title: formData.get('templateTitle'),
        message: formData.get('templateContent'),
        active: formData.get('templateActive') === 'on'
    };
    
    console.log('Template data:', templateData);
    
    // For now, just show success message
    alert('Template đã được lưu thành công!');
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('templateModal'));
    if (modal) {
        modal.hide();
    }
    
    // Reload templates
    loadTemplates();
}

// Form submission handlers
function handleEventNotificationSubmit(event) {
    event.preventDefault();
    console.log('Event notification form submitted');
    
    if (!selectedEvent) {
        alert('Vui lòng chọn một sự kiện');
        return;
    }
    
    const formData = new FormData(event.target);
    const data = {
        event: selectedEvent,
        type: formData.get('eventNotificationType'),
        templateId: formData.get('eventTemplateSelect')
    };
    
    console.log('Event notification data:', data);
    alert('Thông báo theo sự kiện đã được gửi!');
}

function handleScheduledNotificationSubmit(event) {
    event.preventDefault();
    console.log('Scheduled notification form submitted');
    
    const formData = new FormData(event.target);
    const data = {
        name: formData.get('scheduledNotificationName'),
        time: formData.get('scheduledNotificationTime'),
        type: formData.get('scheduledNotificationType'),
        title: formData.get('scheduledNotificationTitle'),
        content: formData.get('scheduledNotificationContent')
    };
    
    console.log('Scheduled notification data:', data);
    alert('Thông báo đã được lên lịch!');
}

function handleInstantNotificationSubmit(event) {
    event.preventDefault();
    console.log('Instant notification form submitted');
    
    const formData = new FormData(event.target);
    const data = {
        type: formData.get('instantNotificationType'),
        sendType: formData.get('instantSendType'),
        templateId: formData.get('instantTemplateSelect'),
        title: formData.get('instantNotificationTitle'),
        content: formData.get('instantNotificationContent')
    };
    
    console.log('Instant notification data:', data);
    alert('Thông báo đã được gửi ngay!');
}

// Preview functions
function previewNotification() {
    console.log('Previewing notification...');
    alert('Chức năng xem trước sẽ được hiển thị ở đây');
}

function previewScheduledNotification() {
    console.log('Previewing scheduled notification...');
    alert('Chức năng xem trước sẽ được hiển thị ở đây');
}

function previewInstantNotification() {
    console.log('Previewing instant notification...');
    alert('Chức năng xem trước sẽ được hiển thị ở đây');
}

// Utility functions
function resetInstantForm() {
    console.log('Resetting instant form...');
    const form = document.getElementById('instantNotificationForm');
    if (form) {
        form.reset();
    }
}

function loadScheduledNotifications() {
    console.log('Loading scheduled notifications...');
    // This would load scheduled notifications from API
}

function loadHistory() {
    console.log('Loading history...');
    // This would load notification history from API
}

function editTemplate(templateId) {
    console.log('Editing template:', templateId);
    alert('Chức năng chỉnh sửa template sẽ được mở ở đây');
}

function deleteTemplate(templateId) {
    console.log('Deleting template:', templateId);
    if (confirm('Bạn có chắc chắn muốn xóa template này?')) {
        alert('Template đã được xóa!');
        loadTemplates();
    }
}

console.log('Notification Admin System script loaded successfully');
