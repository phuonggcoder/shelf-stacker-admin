// Notification Admin Panel - Main JavaScript File

// Global variables
let templates = [];
let scheduledNotifications = [];
let notificationHistory = [];
let currentPage = 1;
let totalPages = 1;
let currentFilter = 'all';
let charts = {};

// API Configuration
const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';
// For local development, use: 'http://localhost:3000'

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
async function initializeApp() {
    try {
        showLoading(true);
        
        // Setup navigation
        setupNavigation();
        
        // Setup event listeners
        setupEventListeners();
        
        // Load initial data
        await Promise.all([
            loadDashboardData(),
            loadTemplates(),
            loadScheduledNotifications(),
            loadNotificationHistory()
        ]);
        
        // Initialize charts
        initializeCharts();
        
        showLoading(false);
        
        // Show success message
        showMessage('Notification Admin Panel loaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showMessage('Error loading application data', 'error');
        showLoading(false);
    }
}

// Setup navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Show corresponding section
            const targetSection = this.getAttribute('data-section');
            showSection(targetSection);
        });
    });
}

// Show section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Load section-specific data
        switch(sectionId) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'templates':
                loadTemplates();
                break;
            case 'scheduled':
                loadScheduledNotifications();
                break;
            case 'history':
                loadNotificationHistory();
                break;
            case 'analytics':
                loadAnalytics();
                break;
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Template form
    const templateForm = document.getElementById('template-form-modal');
    if (templateForm) {
        templateForm.addEventListener('submit', handleTemplateSubmit);
    }
    
    // Notification type selector
    const typeCards = document.querySelectorAll('.type-card');
    typeCards.forEach(card => {
        card.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            selectNotificationType(type);
        });
    });
    
    // Recipient type radio buttons
    setupRecipientTypeListeners();
    
    // Form submissions
    setupFormSubmissions();
    
    // Search and filter listeners
    setupSearchAndFilters();
    
    // Image upload listeners
    setupImageUploadListeners();
    
    // Modal close events
    setupModalListeners();
}

// Setup recipient type listeners
function setupRecipientTypeListeners() {
    const recipientTypes = ['recipient-type', 'template-recipient-type', 'scheduled-recipient-type'];
    
    recipientTypes.forEach(type => {
        const radios = document.querySelectorAll(`input[name="${type}"]`);
        radios.forEach(radio => {
            radio.addEventListener('change', function() {
                const value = this.value;
                const formId = this.closest('form').id;
                toggleUserSelector(value, formId);
            });
        });
    });
}

// Toggle user selector based on recipient type
function toggleUserSelector(recipientType, formId) {
    const userSelectors = {
        'urgent-form': {
            specific: 'user-selector',
            multiple: 'multiple-users'
        },
        'template-form': {
            specific: 'template-user-selector',
            multiple: 'template-multiple-users'
        },
        'scheduled-form': {
            specific: 'scheduled-user-selector',
            multiple: 'scheduled-multiple-users'
        }
    };
    
    const selectors = userSelectors[formId];
    if (!selectors) return;
    
    // Hide all selectors
    Object.values(selectors).forEach(selectorId => {
        const element = document.getElementById(selectorId);
        if (element) element.classList.add('hidden');
    });
    
    // Show appropriate selector
    const targetSelectorId = selectors[recipientType];
    if (targetSelectorId) {
        const element = document.getElementById(targetSelectorId);
        if (element) element.classList.remove('hidden');
    }
}

// Setup form submissions
function setupFormSubmissions() {
    // Urgent notification form
    const urgentForm = document.getElementById('urgent-form');
    if (urgentForm) {
        urgentForm.addEventListener('submit', handleUrgentNotificationSubmit);
    }
    
    // Template notification form
    const templateForm = document.getElementById('template-form');
    if (templateForm) {
        templateForm.addEventListener('submit', handleTemplateNotificationSubmit);
    }
    
    // Scheduled notification form
    const scheduledForm = document.getElementById('scheduled-form');
    if (scheduledForm) {
        scheduledForm.addEventListener('submit', handleScheduledNotificationSubmit);
    }
}

// Setup search and filters
function setupSearchAndFilters() {
    // Template search
    const templateSearch = document.getElementById('template-search');
    if (templateSearch) {
        templateSearch.addEventListener('input', debounce(filterTemplates, 300));
    }
    
    // Template filter buttons
    const templateFilterBtns = document.querySelectorAll('[data-filter]');
    templateFilterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            applyTemplateFilter(filter);
        });
    });
    
    // Scheduled search
    const scheduledSearch = document.getElementById('scheduled-search');
    if (scheduledSearch) {
        scheduledSearch.addEventListener('input', debounce(filterScheduled, 300));
    }
    
    // History search
    const historySearch = document.getElementById('history-search');
    if (historySearch) {
        historySearch.addEventListener('input', debounce(filterHistory, 300));
    }
}

// Setup image upload listeners
function setupImageUploadListeners() {
    const imageInputs = ['urgent-image', 'template-image', 'scheduled-image'];
    
    imageInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('change', function() {
                handleImageChange(this, inputId.replace('-image', '-image-preview'));
            });
        }
    });
}

// Setup modal listeners
function setupModalListeners() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this);
            }
        });
    });
}

// Select notification type
function selectNotificationType(type) {
    // Remove active class from all type cards
    document.querySelectorAll('.type-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Add active class to selected card
    const selectedCard = document.querySelector(`[data-type="${type}"]`);
    if (selectedCard) {
        selectedCard.classList.add('active');
    }
    
    // Hide all forms
    document.querySelectorAll('.notification-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Show selected form
    const targetForm = document.getElementById(`${type}-form`);
    if (targetForm) {
        targetForm.classList.add('active');
    }
    
    // Load template selector if template type
    if (type === 'template') {
        loadTemplateSelector();
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/noti/stats`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            const stats = await response.json();
            updateDashboardStats(stats);
        } else {
            throw new Error('Failed to load dashboard stats');
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Use sample data for demo
        updateDashboardStats(getSampleStats());
    }
}

// Update dashboard statistics
function updateDashboardStats(stats) {
    document.getElementById('urgent-count').textContent = stats.urgentSentToday || 0;
    document.getElementById('scheduled-count').textContent = stats.scheduledActive || 0;
    document.getElementById('template-count').textContent = stats.activeTemplates || 0;
    document.getElementById('success-rate').textContent = `${stats.successRate || 0}%`;
}

// Load templates
async function loadTemplates() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/notification-templates`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            templates = data.templates || data;
        } else {
            throw new Error('Failed to load templates');
        }
    } catch (error) {
        console.error('Error loading templates:', error);
        templates = getSampleTemplates();
    }
    
    renderTemplates();
}

// Render templates
function renderTemplates() {
    const grid = document.getElementById('templates-grid');
    if (!grid) return;
    
    if (templates.length === 0) {
        grid.innerHTML = `
            <div class="no-data">
                <i class="fas fa-inbox"></i>
                <p>No templates found</p>
                <button class="btn-primary" onclick="openTemplateModal()">
                    <i class="fas fa-plus"></i> Create First Template
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = templates.map(template => `
        <div class="template-card">
            <div class="template-header">
                <div class="template-name">${template.name}</div>
                <div class="template-event">${template.event}</div>
            </div>
            <div class="template-content">
                <div class="template-title">${template.title}</div>
                <div class="template-message">${template.message}</div>
                ${template.image ? `<img src="${template.image}" alt="Template Image" class="template-image">` : ''}
                <div class="template-actions">
                    <button class="btn-secondary" onclick="editTemplate('${template._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-secondary" onclick="testTemplate('${template._id}')">
                        <i class="fas fa-flask"></i> Test
                    </button>
                    <button class="btn-danger" onclick="deleteTemplate('${template._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Filter templates
function filterTemplates() {
    const searchTerm = document.getElementById('template-search').value.toLowerCase();
    const filteredTemplates = templates.filter(template => 
        template.name.toLowerCase().includes(searchTerm) ||
        template.event.toLowerCase().includes(searchTerm) ||
        template.title.toLowerCase().includes(searchTerm)
    );
    
    renderFilteredTemplates(filteredTemplates);
}

// Apply template filter
function applyTemplateFilter(filter) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    let filteredTemplates = templates;
    
    if (filter !== 'all') {
        filteredTemplates = templates.filter(template => 
            template.event.includes(filter)
        );
    }
    
    renderFilteredTemplates(filteredTemplates);
}

// Render filtered templates
function renderFilteredTemplates(filteredTemplates) {
    const grid = document.getElementById('templates-grid');
    if (!grid) return;
    
    if (filteredTemplates.length === 0) {
        grid.innerHTML = `
            <div class="no-data">
                <i class="fas fa-search"></i>
                <p>No templates match your search</p>
            </div>
        `;
        return;
    }
    
    // Reuse the same rendering logic
    const originalTemplates = templates;
    templates = filteredTemplates;
    renderTemplates();
    templates = originalTemplates;
}

// Load scheduled notifications
async function loadScheduledNotifications() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/noti/scheduled`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            scheduledNotifications = data.scheduledNotifications || data;
        } else {
            throw new Error('Failed to load scheduled notifications');
        }
    } catch (error) {
        console.error('Error loading scheduled notifications:', error);
        scheduledNotifications = getSampleScheduledNotifications();
    }
    
    renderScheduledNotifications();
}

// Render scheduled notifications
function renderScheduledNotifications() {
    const list = document.getElementById('scheduled-list');
    if (!list) return;
    
    if (scheduledNotifications.length === 0) {
        list.innerHTML = `
            <div class="no-data">
                <i class="fas fa-clock"></i>
                <p>No scheduled notifications</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = scheduledNotifications.map(scheduled => `
        <div class="scheduled-item">
            <div class="scheduled-info">
                <h4>${scheduled.title}</h4>
                <p><strong>Scheduled for:</strong> ${new Date(scheduled.scheduledAt).toLocaleString()}</p>
                <p><strong>Type:</strong> ${scheduled.type}</p>
                <p><strong>Status:</strong> ${scheduled.status}</p>
                <p><strong>Recipients:</strong> ${scheduled.userId || scheduled.userIds ? 'Specific Users' : 'All Users'}</p>
            </div>
            <div class="scheduled-actions">
                <button class="btn-secondary" onclick="editScheduled('${scheduled._id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-danger" onclick="cancelScheduled('${scheduled._id}')">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </div>
        </div>
    `).join('');
}

// Load notification history
async function loadNotificationHistory(page = 1, filters = {}) {
    try {
        const queryParams = new URLSearchParams({
            page: page,
            limit: 20,
            ...filters
        });
        
        const response = await fetch(`${API_BASE_URL}/api/notification/history?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            notificationHistory = data.notifications || [];
            currentPage = page;
            totalPages = Math.ceil(data.total / data.limit);
            
            updateHistoryStats(data);
            renderNotificationHistory();
            renderPagination();
        } else {
            throw new Error('Failed to load notification history');
        }
    } catch (error) {
        console.error('Error loading notification history:', error);
        notificationHistory = getSampleNotificationHistory();
        renderNotificationHistory();
    }
}

// Update history statistics
function updateHistoryStats(data) {
    document.getElementById('total-sent').textContent = data.total || 0;
    document.getElementById('history-success-rate').textContent = `${data.successRate || 0}%`;
    document.getElementById('total-failed').textContent = data.failed || 0;
}

// Render notification history
function renderNotificationHistory() {
    const list = document.getElementById('history-list');
    if (!list) return;
    
    if (notificationHistory.length === 0) {
        list.innerHTML = `
            <div class="no-data">
                <i class="fas fa-history"></i>
                <p>No notification history found</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = notificationHistory.map(notification => `
        <div class="history-item ${notification.status}">
            <div class="history-header">
                <div>
                    <div class="history-title">${notification.title}</div>
                    <div class="history-message">${notification.message}</div>
                    <div class="history-meta">
                        <span><i class="fas fa-user"></i> ${notification.userId || 'All Users'}</span>
                        <span><i class="fas fa-tag"></i> ${notification.type}</span>
                        <span><i class="fas fa-clock"></i> ${new Date(notification.sendAt).toLocaleString()}</span>
                        <span><i class="fas fa-circle"></i> ${notification.status}</span>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="btn-secondary" onclick="viewNotificationDetails('${notification._id}')">
                        <i class="fas fa-eye"></i> Details
                    </button>
                    <button class="btn-secondary" onclick="resendNotification('${notification._id}')">
                        <i class="fas fa-redo"></i> Resend
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Render pagination
function renderPagination() {
    const pagination = document.getElementById('history-pagination');
    if (!pagination) return;
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i> Previous
        </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
                <button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += '<span>...</span>';
        }
    }
    
    // Next button
    paginationHTML += `
        <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            Next <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    pagination.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    if (page >= 1 && page <= totalPages) {
        loadNotificationHistory(page);
    }
}

// Handle urgent notification submit
async function handleUrgentNotificationSubmit(e) {
    e.preventDefault();
    
    try {
        showLoading(true);
        
        const formData = new FormData();
        formData.append('title', document.getElementById('urgent-title').value);
        formData.append('message', document.getElementById('urgent-message').value);
        formData.append('type', 'urgent');
        
        const recipientType = document.querySelector('input[name="recipient-type"]:checked').value;
        
        if (recipientType === 'specific') {
            formData.append('userId', document.getElementById('user-id').value);
        } else if (recipientType === 'multiple') {
            formData.append('userIds', document.getElementById('user-ids').value);
        } else {
            formData.append('all', 'true');
        }
        
        const imageFile = document.getElementById('urgent-image').files[0];
        if (imageFile) {
            formData.append('imageFile', imageFile);
        }
        
        const response = await fetch('/api/noti/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            showMessage('Urgent notification sent successfully!', 'success');
            e.target.reset();
            document.getElementById('urgent-image-preview').innerHTML = '';
        } else {
            throw new Error('Failed to send urgent notification');
        }
    } catch (error) {
        console.error('Error sending urgent notification:', error);
        showMessage('Error sending urgent notification', 'error');
    } finally {
        showLoading(false);
    }
}

// Handle template notification submit
async function handleTemplateNotificationSubmit(e) {
    e.preventDefault();
    
    try {
        showLoading(true);
        
        const selectedTemplate = document.querySelector('.template-option.selected');
        if (!selectedTemplate) {
            showMessage('Please select a template', 'warning');
            return;
        }
        
        const templateId = selectedTemplate.getAttribute('data-id');
        const formData = new FormData();
        formData.append('event', selectedTemplate.getAttribute('data-event'));
        
        const recipientType = document.querySelector('input[name="template-recipient-type"]:checked').value;
        
        if (recipientType === 'specific') {
            formData.append('userId', document.getElementById('template-user-id').value);
        } else if (recipientType === 'multiple') {
            formData.append('userIds', document.getElementById('template-user-ids').value);
        } else {
            formData.append('all', 'true');
        }
        
        // Add template variables
        const variableInputs = document.querySelectorAll('#template-variables input');
        const variables = {};
        variableInputs.forEach(input => {
            variables[input.name] = input.value;
        });
        formData.append('data', JSON.stringify(variables));
        
        const response = await fetch('/api/noti/send-event', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            showMessage('Template notification sent successfully!', 'success');
            e.target.reset();
        } else {
            throw new Error('Failed to send template notification');
        }
    } catch (error) {
        console.error('Error sending template notification:', error);
        showMessage('Error sending template notification', 'error');
    } finally {
        showLoading(false);
    }
}

// Handle scheduled notification submit
async function handleScheduledNotificationSubmit(e) {
    e.preventDefault();
    
    try {
        showLoading(true);
        
        const formData = new FormData();
        formData.append('title', document.getElementById('scheduled-title').value);
        formData.append('message', document.getElementById('scheduled-message').value);
        formData.append('type', 'scheduled');
        
        const date = document.getElementById('schedule-date').value;
        const time = document.getElementById('schedule-time').value;
        const scheduledAt = new Date(`${date}T${time}`).toISOString();
        formData.append('scheduledAt', scheduledAt);
        
        const recipientType = document.querySelector('input[name="scheduled-recipient-type"]:checked').value;
        
        if (recipientType === 'specific') {
            formData.append('userId', document.getElementById('scheduled-user-id').value);
        } else if (recipientType === 'multiple') {
            formData.append('userIds', document.getElementById('scheduled-user-ids').value);
        } else {
            formData.append('all', 'true');
        }
        
        const imageFile = document.getElementById('scheduled-image').files[0];
        if (imageFile) {
            formData.append('imageFile', imageFile);
        }
        
        const response = await fetch('/api/noti/schedule', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            showMessage('Notification scheduled successfully!', 'success');
            e.target.reset();
            document.getElementById('scheduled-image-preview').innerHTML = '';
            loadScheduledNotifications();
        } else {
            throw new Error('Failed to schedule notification');
        }
    } catch (error) {
        console.error('Error scheduling notification:', error);
        showMessage('Error scheduling notification', 'error');
    } finally {
        showLoading(false);
    }
}

// Handle template submit
async function handleTemplateSubmit(e) {
    e.preventDefault();
    
    try {
        showLoading(true);
        
        const formData = new FormData();
        formData.append('name', document.getElementById('template-name').value);
        formData.append('event', document.getElementById('template-event').value);
        formData.append('title', document.getElementById('template-title').value);
        formData.append('message', document.getElementById('template-message').value);
        
        const imageFile = document.getElementById('template-image').files[0];
        if (imageFile) {
            formData.append('imageFile', imageFile);
        }
        
        const response = await fetch('/api/notification-templates', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            showMessage('Template created successfully!', 'success');
            closeTemplateModal();
            loadTemplates();
        } else {
            throw new Error('Failed to create template');
        }
    } catch (error) {
        console.error('Error creating template:', error);
        showMessage('Error creating template', 'error');
    } finally {
        showLoading(false);
    }
}

// Load template selector
function loadTemplateSelector() {
    const selector = document.getElementById('template-selector');
    if (!selector) return;
    
    if (templates.length === 0) {
        selector.innerHTML = `
            <div class="no-data">
                <p>No templates available</p>
                <button class="btn-primary" onclick="openTemplateModal()">
                    <i class="fas fa-plus"></i> Create Template
                </button>
            </div>
        `;
        return;
    }
    
    selector.innerHTML = templates.map(template => `
        <div class="template-option" data-id="${template._id}" data-event="${template.event}" onclick="selectTemplate('${template._id}')">
            <h4>${template.name}</h4>
            <p>${template.title}</p>
            <div class="event-tag">${template.event}</div>
        </div>
    `).join('');
}

// Select template
function selectTemplate(templateId) {
    // Remove selected class from all options
    document.querySelectorAll('.template-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Add selected class to chosen option
    const selectedOption = document.querySelector(`[data-id="${templateId}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
    
    // Load template variables
    loadTemplateVariables(templateId);
}

// Load template variables
function loadTemplateVariables(templateId) {
    const template = templates.find(t => t._id === templateId);
    if (!template) return;
    
    const variablesContainer = document.getElementById('template-variables');
    if (!variablesContainer) return;
    
    // Extract variables from template (simple regex for {{variable}})
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables = new Set();
    let match;
    
    while ((match = variableRegex.exec(template.title + template.message)) !== null) {
        variables.add(match[1]);
    }
    
    if (variables.size === 0) {
        variablesContainer.innerHTML = '<p>No variables found in this template</p>';
        return;
    }
    
    variablesContainer.innerHTML = Array.from(variables).map(variable => `
        <div class="variable-input">
            <label for="var-${variable}">${variable}:</label>
            <input type="text" id="var-${variable}" name="${variable}" placeholder="Enter value for ${variable}">
        </div>
    `).join('');
}

// Handle image change
function handleImageChange(input, previewId) {
    const file = input.files[0];
    const preview = document.getElementById(previewId);
    
    if (file && preview) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
}

// Open template modal
function openTemplateModal() {
    const modal = document.getElementById('template-modal');
    if (modal) {
        modal.style.display = 'block';
        document.getElementById('template-modal-title').textContent = 'Add New Template';
        document.getElementById('template-form-modal').reset();
        document.getElementById('template-image-preview').innerHTML = '';
    }
}

// Close template modal
function closeTemplateModal() {
    const modal = document.getElementById('template-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal
function closeModal(modal) {
    modal.style.display = 'none';
}

// Show loading
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

// Show message
function showMessage(message, type = 'info') {
    const container = document.getElementById('message-container');
    if (!container) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.innerHTML = `
        <i class="fas fa-${getMessageIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(messageElement);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        messageElement.remove();
    }, 5000);
}

// Get message icon
function getMessageIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

// Get auth token
function getAuthToken() {
    return localStorage.getItem('adminToken') || 'demo-token';
}

// Logout
function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
}

// Initialize charts
function initializeCharts() {
    // Activity chart
    const activityCtx = document.getElementById('activityChart');
    if (activityCtx) {
        charts.activity = new Chart(activityCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Notifications Sent',
                    data: [12, 19, 15, 25, 22, 30, 28],
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Type chart
    const typeCtx = document.getElementById('typeChart');
    if (typeCtx) {
        charts.type = new Chart(typeCtx, {
            type: 'doughnut',
            data: {
                labels: ['Urgent', 'Template', 'Scheduled'],
                datasets: [{
                    data: [30, 45, 25],
                    backgroundColor: ['#dc3545', '#007bff', '#fd7e14']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Load analytics
async function loadAnalytics() {
    try {
        const response = await fetch('/api/noti/analytics', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            const analytics = await response.json();
            updateAnalyticsCharts(analytics);
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Update analytics charts
function updateAnalyticsCharts(analytics) {
    // Update existing charts with real data
    if (charts.activity && analytics.activity) {
        charts.activity.data.labels = analytics.activity.labels;
        charts.activity.data.datasets[0].data = analytics.activity.data;
        charts.activity.update();
    }
    
    if (charts.type && analytics.types) {
        charts.type.data.labels = analytics.types.labels;
        charts.type.data.datasets[0].data = analytics.types.data;
        charts.type.update();
    }
}

// Generate report
function generateReport(type) {
    showMessage(`Generating ${type} report...`, 'info');
    
    // Simulate report generation
    setTimeout(() => {
        const link = document.createElement('a');
        link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(getSampleReportData())}`;
        link.download = `notification-report-${type}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        showMessage(`${type} report downloaded successfully!`, 'success');
    }, 2000);
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Sample data functions
function getSampleStats() {
    return {
        urgentSentToday: 15,
        scheduledActive: 8,
        activeTemplates: 12,
        successRate: 95
    };
}

function getSampleTemplates() {
    return [
        {
            _id: '1',
            name: 'Order Success',
            event: 'order_success',
            title: 'Order {{orderId}} completed!',
            message: 'Your order {{orderId}} has been completed successfully!',
            image: null
        },
        {
            _id: '2',
            name: 'Payment Success',
            event: 'payment_success',
            title: 'Payment received for {{orderId}}',
            message: 'Payment of {{amount}} has been received for order {{orderId}}.',
            image: null
        }
    ];
}

function getSampleScheduledNotifications() {
    return [
        {
            _id: '1',
            title: 'Weekly Newsletter',
            scheduledAt: new Date(Date.now() + 86400000).toISOString(),
            type: 'newsletter',
            status: 'pending',
            userId: null
        }
    ];
}

function getSampleNotificationHistory() {
    return [
        {
            _id: '1',
            title: 'Order Completed',
            message: 'Your order #12345 has been completed successfully!',
            userId: 'user123',
            type: 'urgent',
            sendAt: new Date().toISOString(),
            status: 'sent'
        }
    ];
}

function getSampleReportData() {
    return `Date,Type,Recipients,Status
2024-01-01,Urgent,All Users,Sent
2024-01-01,Template,Specific Users,Sent
2024-01-02,Scheduled,All Users,Pending`;
}

// Action functions (to be implemented)
function editTemplate(id) {
    showMessage('Edit template functionality coming soon', 'info');
}

function testTemplate(id) {
    showMessage('Test template functionality coming soon', 'info');
}

function deleteTemplate(id) {
    if (confirm('Are you sure you want to delete this template?')) {
        showMessage('Delete template functionality coming soon', 'info');
    }
}

function editScheduled(id) {
    showMessage('Edit scheduled notification functionality coming soon', 'info');
}

function cancelScheduled(id) {
    if (confirm('Are you sure you want to cancel this scheduled notification?')) {
        showMessage('Cancel scheduled notification functionality coming soon', 'info');
    }
}

function viewNotificationDetails(id) {
    showMessage('View notification details functionality coming soon', 'info');
}

function resendNotification(id) {
    if (confirm('Are you sure you want to resend this notification?')) {
        showMessage('Resend notification functionality coming soon', 'info');
    }
}

function applyDateFilter() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (startDate && endDate) {
        loadNotificationHistory(1, {
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString()
        });
    }
}

function filterScheduled() {
    const searchTerm = document.getElementById('scheduled-search').value.toLowerCase();
    const filteredScheduled = scheduledNotifications.filter(scheduled => 
        scheduled.title.toLowerCase().includes(searchTerm) ||
        scheduled.type.toLowerCase().includes(searchTerm)
    );
    
    // Re-render with filtered data
    const originalScheduled = scheduledNotifications;
    scheduledNotifications = filteredScheduled;
    renderScheduledNotifications();
    scheduledNotifications = originalScheduled;
}

function filterHistory() {
    const searchTerm = document.getElementById('history-search').value.toLowerCase();
    const filteredHistory = notificationHistory.filter(notification => 
        notification.title.toLowerCase().includes(searchTerm) ||
        notification.message.toLowerCase().includes(searchTerm) ||
        notification.type.toLowerCase().includes(searchTerm)
    );
    
    // Re-render with filtered data
    const originalHistory = notificationHistory;
    notificationHistory = filteredHistory;
    renderNotificationHistory();
    notificationHistory = originalHistory;
}
