// Event Notifications JavaScript
class EventNotifications {
  constructor() {
    this.currentTab = 'send';
    this.eventTemplates = {};
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadEventTemplates();
    this.updateSendForm();
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.event-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.currentTarget.getAttribute('onclick').match(/'([^']+)'/)[1];
        this.switchTab(tabName);
      });
    });

    // Form changes
    document.getElementById('eventType').addEventListener('change', () => this.updateEventForm());
    document.getElementById('sendType').addEventListener('change', () => this.updateSendForm());
  }

  switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.event-section').forEach(section => {
      section.classList.add('hidden');
    });

    // Remove active class from all tabs
    document.querySelectorAll('.event-tab').forEach(tab => {
      tab.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.remove('hidden');
    
    // Add active class to selected tab
    document.querySelector(`[onclick*="${tabName}"]`).classList.add('active');
    
    this.currentTab = tabName;
  }

  updateSendForm() {
    const sendType = document.getElementById('sendType').value;
    
    // Hide all forms
    document.getElementById('singleUserForm').classList.add('hidden');
    document.getElementById('multicastForm').classList.add('hidden');
    
    // Show appropriate form
    if (sendType === 'single') {
      document.getElementById('singleUserForm').classList.remove('hidden');
    } else if (sendType === 'multicast') {
      document.getElementById('multicastForm').classList.remove('hidden');
    }
  }

  updateEventForm() {
    const eventType = document.getElementById('eventType').value;
    const dataFieldsContainer = document.getElementById('eventDataFields');
    
    // Clear existing fields
    dataFieldsContainer.innerHTML = '';
    
    if (!eventType) return;
    
    // Get event template
    const template = this.getEventTemplate(eventType);
    if (template && template.fields) {
      template.fields.forEach(field => {
        this.createField(field, dataFieldsContainer);
      });
    }
  }

  createField(field, container) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-group';
    
    const label = document.createElement('label');
    label.htmlFor = field.name;
    label.textContent = field.label;
    
    let input;
    
    if (field.type === 'select') {
      input = document.createElement('select');
      input.id = field.name;
      field.options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        input.appendChild(optionElement);
      });
    } else if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.id = field.name;
      input.placeholder = field.placeholder;
    } else {
      input = document.createElement('input');
      input.type = field.type;
      input.id = field.name;
      input.placeholder = field.placeholder;
    }
    
    fieldDiv.appendChild(label);
    fieldDiv.appendChild(input);
    container.appendChild(fieldDiv);
  }

  getEventTemplate(eventType) {
    const templates = {
      user_login: {
        fields: [
          { name: 'loginTime', type: 'datetime-local', label: 'Thời gian đăng nhập', placeholder: '' },
          { name: 'device', type: 'select', label: 'Thiết bị', options: [
            { value: 'web', label: 'Web' },
            { value: 'mobile', label: 'Mobile' },
            { value: 'app', label: 'App' }
          ]},
          { name: 'location', type: 'text', label: 'Vị trí', placeholder: 'Ví dụ: Hanoi, Vietnam' },
          { name: 'ipAddress', type: 'text', label: 'IP Address', placeholder: '192.168.1.1' }
        ]
      },
      user_register: {
        fields: [
          { name: 'registerTime', type: 'datetime-local', label: 'Thời gian đăng ký', placeholder: '' },
          { name: 'email', type: 'email', label: 'Email', placeholder: 'user@example.com' },
          { name: 'phone', type: 'tel', label: 'Số điện thoại', placeholder: '0123456789' }
        ]
      },
      order_created: {
        fields: [
          { name: 'orderId', type: 'text', label: 'Order ID', placeholder: 'ORD123456' },
          { name: 'amount', type: 'number', label: 'Tổng tiền', placeholder: '150000' },
          { name: 'items', type: 'number', label: 'Số lượng sản phẩm', placeholder: '3' },
          { name: 'createdAt', type: 'datetime-local', label: 'Thời gian tạo', placeholder: '' }
        ]
      },
      order_status_update: {
        fields: [
          { name: 'orderId', type: 'text', label: 'Order ID', placeholder: 'ORD123456' },
          { name: 'oldStatus', type: 'select', label: 'Trạng thái cũ', options: [
            { value: 'Pending', label: 'Đang chờ xử lý' },
            { value: 'AwaitingPickup', label: 'Chờ lấy hàng' },
            { value: 'OutForDelivery', label: 'Đang giao' },
            { value: 'Delivered', label: 'Đã giao' }
          ]},
          { name: 'newStatus', type: 'select', label: 'Trạng thái mới', options: [
            { value: 'AwaitingPickup', label: 'Chờ lấy hàng' },
            { value: 'OutForDelivery', label: 'Đang giao' },
            { value: 'Delivered', label: 'Đã giao' },
            { value: 'Cancelled', label: 'Đã hủy' }
          ]},
          { name: 'estimatedDelivery', type: 'datetime-local', label: 'Dự kiến giao hàng', placeholder: '' }
        ]
      },
      payment_success: {
        fields: [
          { name: 'orderId', type: 'text', label: 'Order ID', placeholder: 'ORD123456' },
          { name: 'paymentId', type: 'text', label: 'Payment ID', placeholder: 'PAY789012' },
          { name: 'amount', type: 'number', label: 'Số tiền', placeholder: '150000' },
          { name: 'paymentMethod', type: 'select', label: 'Phương thức thanh toán', options: [
            { value: 'zalopay', label: 'ZaloPay' },
            { value: 'payos', label: 'PayOS' },
            { value: 'cod', label: 'Thanh toán khi nhận hàng' }
          ]},
          { name: 'paidAt', type: 'datetime-local', label: 'Thời gian thanh toán', placeholder: '' }
        ]
      },
      promotion_created: {
        fields: [
          { name: 'promotionId', type: 'text', label: 'Promotion ID', placeholder: 'PROM123' },
          { name: 'title', type: 'text', label: 'Tiêu đề khuyến mãi', placeholder: 'Giảm giá 20%' },
          { name: 'discount', type: 'number', label: 'Phần trăm giảm giá', placeholder: '20' },
          { name: 'validFrom', type: 'datetime-local', label: 'Hiệu lực từ', placeholder: '' },
          { name: 'validTo', type: 'datetime-local', label: 'Hiệu lực đến', placeholder: '' },
          { name: 'minOrder', type: 'number', label: 'Đơn hàng tối thiểu', placeholder: '100000' }
        ]
      },
      system_maintenance: {
        fields: [
          { name: 'maintenanceTime', type: 'datetime-local', label: 'Thời gian bảo trì', placeholder: '' },
          { name: 'duration', type: 'text', label: 'Thời gian bảo trì', placeholder: '2 hours' },
          { name: 'reason', type: 'textarea', label: 'Lý do bảo trì', placeholder: 'Cập nhật hệ thống bảo mật' },
          { name: 'affectedServices', type: 'text', label: 'Dịch vụ bị ảnh hưởng', placeholder: 'payment, order' }
        ]
      }
    };
    
    return templates[eventType];
  }

  async sendEventNotification() {
    const eventType = document.getElementById('eventType').value;
    const sendType = document.getElementById('sendType').value;
    const customTitle = document.getElementById('customTitle').value;
    const customMessage = document.getElementById('customMessage').value;
    const eventImage = document.getElementById('eventImage').files[0];
    
    if (!eventType) {
      this.showNotification('Vui lòng chọn loại event', 'error');
      return;
    }
    
    // Collect event data
    const eventData = this.collectEventData();
    
    try {
      this.setLoading(true);
      
      let response;
      const formData = new FormData();
      
      if (eventImage) {
        formData.append('imageFile', eventImage);
      }
      
      if (sendType === 'single') {
        const userId = document.getElementById('userId').value;
        if (!userId) {
          this.showNotification('Vui lòng nhập User ID', 'error');
          return;
        }
        
        formData.append('event', eventType);
        formData.append('userId', userId);
        formData.append('data', JSON.stringify(eventData));
        if (customTitle) formData.append('title', customTitle);
        if (customMessage) formData.append('message', customMessage);
        
        response = await this.apiCall('/api/noti/event', 'POST', formData);
      } else if (sendType === 'multicast') {
        const userIds = document.getElementById('userIds').value;
        if (!userIds) {
          this.showNotification('Vui lòng nhập danh sách User ID', 'error');
          return;
        }
        
        formData.append('event', eventType);
        formData.append('userIds', userIds);
        formData.append('data', JSON.stringify(eventData));
        if (customTitle) formData.append('title', customTitle);
        if (customMessage) formData.append('message', customMessage);
        
        response = await this.apiCall('/api/noti/event-multicast', 'POST', formData);
      } else if (sendType === 'broadcast') {
        formData.append('event', eventType);
        formData.append('data', JSON.stringify(eventData));
        if (customTitle) formData.append('title', customTitle);
        if (customMessage) formData.append('message', customMessage);
        
        response = await this.apiCall('/api/noti/event-broadcast', 'POST', formData);
      }
      
      if (response.success) {
        this.showNotification('Gửi event notification thành công!', 'success');
        this.resetForm();
      } else {
        this.showNotification(response.message || 'Có lỗi xảy ra', 'error');
      }
    } catch (error) {
      console.error('Error sending event notification:', error);
      this.showNotification('Có lỗi xảy ra khi gửi notification', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  collectEventData() {
    const eventType = document.getElementById('eventType').value;
    const template = this.getEventTemplate(eventType);
    const data = {};
    
    if (template && template.fields) {
      template.fields.forEach(field => {
        const element = document.getElementById(field.name);
        if (element) {
          let value = element.value;
          
          // Convert datetime-local to ISO string
          if (field.type === 'datetime-local' && value) {
            value = new Date(value).toISOString();
          }
          
          data[field.name] = value;
        }
      });
    }
    
    return data;
  }

  resetForm() {
    document.getElementById('eventType').value = '';
    document.getElementById('sendType').value = 'single';
    document.getElementById('userId').value = '';
    document.getElementById('userIds').value = '';
    document.getElementById('customTitle').value = '';
    document.getElementById('customMessage').value = '';
    document.getElementById('eventImage').value = '';
    document.getElementById('eventDataFields').innerHTML = '';
    this.updateSendForm();
  }

  setLoading(loading) {
    const button = document.getElementById('sendEventBtn');
    if (loading) {
      button.disabled = true;
      button.innerHTML = '<div class="loading"></div> Đang gửi...';
    } else {
      button.disabled = false;
      button.innerHTML = '<i class="fas fa-paper-plane"></i> Gửi Event Notification';
    }
  }

  showNotification(message, type = 'success') {
    const notification = document.getElementById('eventStatus');
    notification.textContent = message;
    notification.className = `notification ${type}-message`;
    notification.style.display = 'block';
    
    setTimeout(() => {
      notification.style.display = 'none';
    }, 5000);
  }

  async apiCall(url, method, data = null) {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    };
    
    if (data) {
      if (data instanceof FormData) {
        options.body = data;
      } else {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(data);
      }
    }
    
    const response = await fetch(url, options);
    return await response.json();
  }

  getAuthToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }

  async loadEventTemplates() {
    try {
      const response = await this.apiCall('/api/notification-templates');
      if (response.success) {
        this.eventTemplates = response.data;
      }
    } catch (error) {
      console.error('Error loading event templates:', error);
    }
  }

  // Template management functions
  async createTemplate() {
    const event = document.getElementById('templateEvent').value;
    const type = document.getElementById('templateType').value;
    const title = document.getElementById('templateTitle').value;
    const message = document.getElementById('templateMessage').value;
    const imageFile = document.getElementById('templateImage').files[0];
    
    if (!event || !title || !message) {
      this.showNotification('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('event', event);
      formData.append('type', type);
      formData.append('title', title);
      formData.append('message', message);
      if (imageFile) {
        formData.append('imageFile', imageFile);
      }
      
      const response = await this.apiCall('/api/notification-templates', 'POST', formData);
      
      if (response.success) {
        this.showNotification('Tạo template thành công!', 'success');
        this.loadTemplates();
      } else {
        this.showNotification(response.message || 'Có lỗi xảy ra', 'error');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      this.showNotification('Có lỗi xảy ra khi tạo template', 'error');
    }
  }

  async loadTemplates() {
    try {
      const response = await this.apiCall('/api/notification-templates');
      if (response.success) {
        this.displayTemplates(response.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      this.showNotification('Có lỗi xảy ra khi tải templates', 'error');
    }
  }

  displayTemplates(templates) {
    const tbody = document.getElementById('templateList');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    templates.forEach(template => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${template.event}</td>
        <td>${template.title}</td>
        <td>${template.message.substring(0, 50)}...</td>
        <td>${template.type}</td>
        <td><span class="status-badge ${template.active ? 'success' : 'pending'}">${template.active ? 'Active' : 'Inactive'}</span></td>
        <td>
          <button class="btn-secondary" onclick="eventNotifications.editTemplate('${template._id}')">Sửa</button>
          <button class="btn-danger" onclick="eventNotifications.deleteTemplate('${template._id}')">Xóa</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  // History functions
  async loadEventHistory() {
    const event = document.getElementById('historyEvent').value;
    const status = document.getElementById('historyStatus').value;
    
    try {
      let url = '/api/notification/user/all?limit=50&page=1';
      if (event) url += `&event=${event}`;
      if (status) url += `&status=${status}`;
      
      const response = await this.apiCall(url);
      if (response.success) {
        this.displayEventHistory(response.data);
      }
    } catch (error) {
      console.error('Error loading event history:', error);
      this.showNotification('Có lỗi xảy ra khi tải lịch sử', 'error');
    }
  }

  displayEventHistory(history) {
    const tbody = document.getElementById('eventHistory');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    history.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${new Date(item.createdAt).toLocaleString('vi-VN')}</td>
        <td><span class="event-badge ${this.getEventBadgeClass(item.event)}">${item.event}</span></td>
        <td>${item.userId || 'Broadcast'}</td>
        <td>${item.title}</td>
        <td><span class="status-badge ${item.status}">${item.status}</span></td>
        <td>
          <button class="btn-secondary" onclick="eventNotifications.viewEventDetails('${item._id}')">Chi tiết</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  getEventBadgeClass(event) {
    if (event.includes('login') || event.includes('register')) return 'login';
    if (event.includes('order')) return 'order';
    if (event.includes('payment')) return 'payment';
    if (event.includes('promotion') || event.includes('sale')) return 'marketing';
    if (event.includes('system') || event.includes('maintenance')) return 'system';
    return 'login';
  }

  // Stats functions
  async loadDetailedStats() {
    const period = document.getElementById('statsPeriod').value;
    const event = document.getElementById('statsEvent').value;
    
    try {
      let url = '/api/noti/stats?';
      if (period) url += `period=${period}&`;
      if (event) url += `event=${event}`;
      
      const response = await this.apiCall(url);
      if (response.success) {
        this.displayDetailedStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading detailed stats:', error);
      this.showNotification('Có lỗi xảy ra khi tải thống kê', 'error');
    }
  }

  displayDetailedStats(stats) {
    const container = document.getElementById('detailedStats');
    if (!container) return;
    
    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <h4><i class="fas fa-chart-line"></i> Tổng Events</h4>
          <div class="number">${stats.totalEvents || 0}</div>
          <div class="label">Sự kiện đã gửi</div>
        </div>
        <div class="stat-card">
          <h4><i class="fas fa-users"></i> Users Nhận</h4>
          <div class="number">${stats.totalUsers || 0}</div>
          <div class="label">Người dùng đã nhận</div>
        </div>
        <div class="stat-card">
          <h4><i class="fas fa-check-circle"></i> Thành công</h4>
          <div class="number">${stats.successRate || 0}%</div>
          <div class="label">Tỷ lệ thành công</div>
        </div>
        <div class="stat-card">
          <h4><i class="fas fa-clock"></i> Hôm nay</h4>
          <div class="number">${stats.todayEvents || 0}</div>
          <div class="label">Events hôm nay</div>
        </div>
      </div>
    `;
  }
}

// Global functions for onclick handlers
function switchTab(tabName) {
  eventNotifications.switchTab(tabName);
}

function sendEventNotification() {
  eventNotifications.sendEventNotification();
}

function createTemplate() {
  eventNotifications.createTemplate();
}

function loadTemplates() {
  eventNotifications.loadTemplates();
}

function loadEventHistory() {
  eventNotifications.loadEventHistory();
}

function loadDetailedStats() {
  eventNotifications.loadDetailedStats();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.eventNotifications = new EventNotifications();
});

// Sidebar menu toggle function
function toggleMenu(menuId) {
  const menu = document.getElementById(menuId);
  if (menu.style.display === 'none') {
    menu.style.display = 'block';
  } else {
    menu.style.display = 'none';
  }
}
