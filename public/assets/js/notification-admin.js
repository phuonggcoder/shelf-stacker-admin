// Global variables
let templates = [];
let filteredTemplates = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    setupEventListeners();
    loadTemplates();
    updateVariables();
});

// Setup navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            const targetSection = this.getAttribute('data-section');
            showSection(targetSection);
        });
    });
}

// Show section
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    const targetSection = document.getElementById(sectionId);
    if (targetSection) targetSection.classList.add('active');
}

// Setup event listeners
function setupEventListeners() {
    const templateForm = document.getElementById('template-form');
    if (templateForm) {
        templateForm.addEventListener('submit', handleTemplateSubmit);
    }
    
    const imageInput = document.getElementById('image-input');
    if (imageInput) {
        imageInput.addEventListener('change', handleImageChange);
    }
    
    // Modal close events
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    });
}

// Load templates
async function loadTemplates() {
    try {
        showLoading(true);
        const response = await fetch('/api/notification-templates');
        if (response.ok) {
            templates = await response.json();
        } else {
            throw new Error('Failed to load templates');
        }
    } catch (error) {
        console.error('Error loading templates:', error);
        templates = getSampleTemplates();
    }
    
    filteredTemplates = [...templates];
    renderTemplates();
    showLoading(false);
}

// Show loading state
function showLoading(show) {
    const loading = document.getElementById('loading');
    const noTemplates = document.getElementById('no-templates');
    const tableContainer = document.querySelector('.table-container');
    
    if (show) {
        loading.style.display = 'block';
        noTemplates.style.display = 'none';
        if (tableContainer) tableContainer.style.display = 'none';
    } else {
        loading.style.display = 'none';
        if (tableContainer) tableContainer.style.display = 'block';
    }
}

// Render templates
function renderTemplates() {
    const tbody = document.getElementById('templates-list');
    const noTemplates = document.getElementById('no-templates');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (filteredTemplates.length === 0) {
        noTemplates.style.display = 'block';
        return;
    }
    
    noTemplates.style.display = 'none';
    
    filteredTemplates.forEach(template => {
        const row = createTemplateRow(template);
        tbody.appendChild(row);
    });
}

// Create template row
function createTemplateRow(template) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <span class="event-type ${template.type}">
                ${getTypeIcon(template.type)} ${template.type}
            </span>
        </td>
        <td>
            <strong>${template.event}</strong>
            <br>
            <small class="text-muted">${getEventDescription(template.event)}</small>
        </td>
        <td>
            <div class="template-title">
                <strong>${template.title}</strong>
                ${template.imageUrl ? '<br><small class="text-muted">📷 Has image</small>' : ''}
            </div>
        </td>
        <td>
            <span class="status ${template.active ? 'active' : 'inactive'}">
                ${template.active ? '✅ Active' : '❌ Inactive'}
            </span>
        </td>
        <td>
            <div class="action-buttons">
                <button class="edit-btn" onclick="editTemplate('${template._id || template.id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="toggle-btn" onclick="toggleTemplate('${template._id || template.id}', ${!template.active})" title="${template.active ? 'Deactivate' : 'Activate'}">
                    <i class="fas fa-${template.active ? 'pause' : 'play'}"></i>
                </button>
                <button class="delete-btn" onclick="deleteTemplate('${template._id || template.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    return row;
}

// Get type icon
function getTypeIcon(type) {
    const icons = {
        'user': '👤',
        'shipper': '🚚',
        'both': '🔄'
    };
    return icons[type] || '📋';
}

// Get event description
function getEventDescription(event) {
    const descriptions = {
        'login_success': 'Đăng nhập thành công',
        'order_success': 'Đặt hàng thành công',
        'payment_success': 'Thanh toán thành công',
        'delivery_success': 'Giao hàng thành công',
        'email_verified': 'Xác thực email',
        'rating_received': 'Nhận đánh giá',
        'order_status_change': 'Thay đổi trạng thái đơn hàng',
        'payment_failed': 'Thanh toán thất bại',
        'delivery_failed': 'Giao hàng thất bại'
    };
    return descriptions[event] || event;
}

// Filter templates
function filterTemplates() {
    const typeFilter = document.getElementById('type-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    
    filteredTemplates = templates.filter(template => {
        if (typeFilter && template.type !== typeFilter) return false;
        if (statusFilter && template.active.toString() !== statusFilter) return false;
        if (searchInput) {
            const searchText = `${template.event} ${template.title} ${template.type}`.toLowerCase();
            if (!searchText.includes(searchInput)) return false;
        }
        return true;
    });
    
    renderTemplates();
}

// Show create modal
function showCreateModal() {
    document.getElementById('modal-title').innerHTML = '<i class="fas fa-plus"></i> Create New Template';
    document.getElementById('template-form').reset();
    document.getElementById('template-id').value = '';
    document.getElementById('image-preview').innerHTML = '';
    document.getElementById('active-checkbox').checked = true;
    updateVariables();
    document.getElementById('template-modal').style.display = 'block';
}

// Edit template
function editTemplate(templateId) {
    const template = templates.find(t => (t._id || t.id) === templateId);
    if (!template) {
        showMessage('Template not found', 'error');
        return;
    }
    
    document.getElementById('modal-title').innerHTML = '<i class="fas fa-edit"></i> Edit Template';
    document.getElementById('template-id').value = template._id || template.id;
    document.getElementById('event-select').value = template.event;
    document.getElementById('type-select').value = template.type;
    document.getElementById('title-input').value = template.title;
    document.getElementById('message-input').value = template.message;
    document.getElementById('active-checkbox').checked = template.active;
    
    if (template.imageUrl) {
        document.getElementById('image-preview').innerHTML = `
            <img src="${template.imageUrl}" alt="Template image" style="max-width: 200px; max-height: 150px;">
        `;
    } else {
        document.getElementById('image-preview').innerHTML = '';
    }
    
    updateVariables();
    document.getElementById('template-modal').style.display = 'block';
}

// Handle template submit
async function handleTemplateSubmit(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target);
        const templateId = formData.get('_id');
        
        if (!validateTemplateForm(formData)) return;
        
        const url = templateId 
            ? `/api/notification-templates/${templateId}`
            : '/api/notification-templates';
        
        const method = templateId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            body: formData
        });
        
        if (response.ok) {
            showMessage(templateId ? 'Template updated successfully!' : 'Template created successfully!', 'success');
            closeModal();
            loadTemplates();
        } else {
            throw new Error('Failed to save template');
        }
        
    } catch (error) {
        console.error('Error saving template:', error);
        showMessage('Failed to save template: ' + error.message, 'error');
    }
}

// Validate template form
function validateTemplateForm(formData) {
    const event = formData.get('event');
    const type = formData.get('type');
    const title = formData.get('title');
    const message = formData.get('message');
    
    if (!event || !type || !title || !message) {
        showMessage('Please fill in all required fields', 'error');
        return false;
    }
    
    if (title.length > 100) {
        showMessage('Title must be less than 100 characters', 'error');
        return false;
    }
    
    if (message.length > 500) {
        showMessage('Message must be less than 500 characters', 'error');
        return false;
    }
    
    return true;
}

// Toggle template status
async function toggleTemplate(templateId, newStatus) {
    try {
        const response = await fetch(`/api/notification-templates/${templateId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: newStatus })
        });
        
        if (response.ok) {
            showMessage(`Template ${newStatus ? 'activated' : 'deactivated'} successfully!`, 'success');
            loadTemplates();
        } else {
            throw new Error('Failed to update template status');
        }
        
    } catch (error) {
        console.error('Error toggling template:', error);
        showMessage('Failed to update template status: ' + error.message, 'error');
    }
}

// Delete template
async function deleteTemplate(templateId) {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/notification-templates/${templateId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('Template deleted successfully!', 'success');
            loadTemplates();
        } else {
            throw new Error('Failed to delete template');
        }
        
    } catch (error) {
        console.error('Error deleting template:', error);
        showMessage('Failed to delete template: ' + error.message, 'error');
    }
}

// Close modal
function closeModal() {
    document.getElementById('template-modal').style.display = 'none';
}

// Close test modal
function closeTestModal() {
    document.getElementById('test-modal').style.display = 'none';
}

// Handle image change
function handleImageChange(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('image-preview');
    
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            showMessage('Image size must be less than 5MB', 'error');
            e.target.value = '';
            preview.innerHTML = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 150px; border-radius: 8px;">
            `;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
}

// Update variables
function updateVariables() {
    const event = document.getElementById('event-select').value;
    const variablesList = document.getElementById('variables-list');
    
    const variables = getVariablesForEvent(event);
    variablesList.textContent = variables.join(', ');
}

// Get variables for event
function getVariablesForEvent(event) {
    const variableMap = {
        'login_success': ['username', 'login_time', 'device_info'],
        'order_success': ['order_id', 'total_amount', 'username', 'delivery_address', 'order_date'],
        'payment_success': ['order_id', 'payment_method', 'amount', 'username', 'payment_date'],
        'delivery_success': ['order_id', 'shipper_name', 'delivery_time', 'tracking_number'],
        'email_verified': ['username', 'email', 'verification_date'],
        'rating_received': ['order_id', 'rating', 'comment', 'username'],
        'order_status_change': ['order_id', 'old_status', 'new_status', 'username'],
        'payment_failed': ['order_id', 'payment_method', 'error_message', 'username'],
        'delivery_failed': ['order_id', 'shipper_name', 'failure_reason', 'username']
    };
    
    return variableMap[event] || ['order_id', 'username'];
}

// Test template
function testTemplate() {
    const event = document.getElementById('event-select').value;
    const title = document.getElementById('title-input').value;
    const message = document.getElementById('message-input').value;
    
    if (!event || !title || !message) {
        showMessage('Please fill in event, title and message before testing', 'error');
        return;
    }
    
    document.getElementById('test-modal').style.display = 'block';
    
    const testData = getTestDataForEvent(event);
    const previewTitle = replaceVariables(title, testData);
    const previewMessage = replaceVariables(message, testData);
    
    document.getElementById('test-preview-content').innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e1e8ed;">
            <h4 style="margin: 0 0 10px 0; color: #2c3e50;">${previewTitle}</h4>
            <p style="margin: 0; color: #5f6368; line-height: 1.5;">${previewMessage}</p>
        </div>
    `;
}

// Send test notification
async function sendTestNotification() {
    const event = document.getElementById('event-select').value;
    const userId = document.getElementById('test-user-id').value || 'test_user_123';
    
    try {
        const testData = getTestDataForEvent(event);
        
        const response = await fetch('/api/noti/send-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: event,
                userId: userId,
                data: testData
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Test notification sent successfully!', 'success');
            closeTestModal();
        } else {
            showMessage('Test failed: ' + (result.message || 'Unknown error'), 'error');
        }
        
    } catch (error) {
        console.error('Error sending test notification:', error);
        showMessage('Test failed: ' + error.message, 'error');
    }
}

// Get test data for event
function getTestDataForEvent(event) {
    const testData = {
        'login_success': {
            username: 'Test User',
            login_time: new Date().toLocaleString(),
            device_info: 'Chrome on Windows'
        },
        'order_success': {
            order_id: 'ORD123456',
            total_amount: '150,000đ',
            username: 'Test User',
            delivery_address: '123 Test Street, Hanoi',
            order_date: new Date().toLocaleDateString()
        },
        'payment_success': {
            order_id: 'ORD123456',
            payment_method: 'ZaloPay',
            amount: '150,000đ',
            username: 'Test User',
            payment_date: new Date().toLocaleString()
        },
        'delivery_success': {
            order_id: 'ORD123456',
            shipper_name: 'Test Shipper',
            delivery_time: new Date().toLocaleString(),
            tracking_number: 'TRK789012'
        },
        'email_verified': {
            username: 'Test User',
            email: 'test@example.com',
            verification_date: new Date().toLocaleString()
        },
        'rating_received': {
            order_id: 'ORD123456',
            rating: '5',
            comment: 'Great service!',
            username: 'Test User'
        },
        'order_status_change': {
            order_id: 'ORD123456',
            old_status: 'Processing',
            new_status: 'Shipped',
            username: 'Test User'
        },
        'payment_failed': {
            order_id: 'ORD123456',
            payment_method: 'Credit Card',
            error_message: 'Insufficient funds',
            username: 'Test User'
        },
        'delivery_failed': {
            order_id: 'ORD123456',
            shipper_name: 'Test Shipper',
            failure_reason: 'Customer not available',
            username: 'Test User'
        }
    };
    
    return testData[event] || {};
}

// Replace variables in text
function replaceVariables(text, data) {
    return text.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
        return data[variable] || match;
    });
}

// Load notification history
async function loadNotificationHistory() {
    try {
        const historyData = getSampleHistoryData();
        renderNotificationHistory(historyData);
    } catch (error) {
        console.error('Error loading notification history:', error);
        showMessage('Failed to load notification history', 'error');
    }
}

// Render notification history
function renderNotificationHistory(historyData) {
    const tbody = document.getElementById('history-list');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    historyData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.date}</td>
            <td>
                <span class="event-type ${item.type}">
                    ${getTypeIcon(item.type)} ${item.event}
                </span>
            </td>
            <td>${item.user}</td>
            <td>
                <span class="status ${item.status === 'sent' ? 'active' : 'inactive'}">
                    ${item.status === 'sent' ? '✅ Sent' : '❌ Failed'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewHistoryDetails('${item.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// View history details
function viewHistoryDetails(historyId) {
    showMessage('History details feature coming soon!', 'info');
}

// Show message
function showMessage(message, type = 'info') {
    const container = document.getElementById('message-container');
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    
    container.appendChild(messageElement);
    
    setTimeout(() => {
        messageElement.remove();
    }, 5000);
}

// Sample data for demo
function getSampleTemplates() {
    return [
        {
            id: '1',
            event: 'login_success',
            type: 'user',
            title: '🎉 Chào mừng trở lại!',
            message: 'Xin chào {{username}}, bạn đã đăng nhập thành công lúc {{login_time}}.',
            active: true,
            imageUrl: null
        },
        {
            id: '2',
            event: 'order_success',
            type: 'user',
            title: '✅ Đặt hàng thành công!',
            message: 'Đơn hàng #{{order_id}} của bạn đã được xác nhận với tổng tiền {{total_amount}}. Chúng tôi sẽ giao hàng đến {{delivery_address}}.',
            active: true,
            imageUrl: null
        },
        {
            id: '3',
            event: 'order_success',
            type: 'shipper',
            title: '🆕 Đơn hàng mới chờ lấy',
            message: 'Bạn có đơn hàng mới #{{order_id}} cần lấy tại {{delivery_address}}. Tổng tiền: {{total_amount}}.',
            active: true,
            imageUrl: null
        },
        {
            id: '4',
            event: 'payment_failed',
            type: 'both',
            title: '❌ Thanh toán thất bại',
            message: 'Thanh toán cho đơn hàng #{{order_id}} bằng {{payment_method}} đã thất bại. Lý do: {{error_message}}.',
            active: true,
            imageUrl: null
        },
        {
            id: '5',
            event: 'delivery_success',
            type: 'user',
            title: '🚚 Giao hàng thành công!',
            message: 'Đơn hàng #{{order_id}} đã được giao thành công bởi {{shipper_name}} lúc {{delivery_time}}. Mã theo dõi: {{tracking_number}}.',
            active: false,
            imageUrl: null
        }
    ];
}

function getSampleHistoryData() {
    return [
        {
            id: '1',
            date: '2024-01-15 14:30',
            event: 'login_success',
            type: 'user',
            user: 'user123',
            status: 'sent'
        },
        {
            id: '2',
            date: '2024-01-15 14:25',
            event: 'order_success',
            type: 'user',
            user: 'user456',
            status: 'sent'
        },
        {
            id: '3',
            date: '2024-01-15 14:20',
            event: 'payment_success',
            type: 'user',
            user: 'user789',
            status: 'sent'
        },
        {
            id: '4',
            date: '2024-01-15 14:15',
            event: 'delivery_success',
            type: 'shipper',
            user: 'shipper001',
            status: 'failed'
        }
    ];
}

// Export functions for global access
window.showCreateModal = showCreateModal;
window.editTemplate = editTemplate;
window.toggleTemplate = toggleTemplate;
window.deleteTemplate = deleteTemplate;
window.closeModal = closeModal;
window.closeTestModal = closeTestModal;
window.testTemplate = testTemplate;
window.sendTestNotification = sendTestNotification;
window.loadNotificationHistory = loadNotificationHistory;
window.viewHistoryDetails = viewHistoryDetails;
window.filterTemplates = filterTemplates;
