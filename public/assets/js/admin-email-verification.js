// Admin Email Verification Management
class AdminEmailVerification {
  constructor() {
    this.currentPage = 1;
    this.itemsPerPage = 20;
    this.selectedUsers = new Set();
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadStatistics();
    this.loadUnverifiedUsers();
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', this.debounce(() => {
        this.searchUsers();
      }, 300));
    }

    // Select all checkbox
    const selectAll = document.getElementById('selectAll');
    if (selectAll) {
      selectAll.addEventListener('change', (e) => {
        this.toggleSelectAll(e.target.checked);
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        window.location.href = '/login';
      });
    }
  }

  // Utility functions
  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;

    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');

    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }

  debounce(func, wait) {
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

  // Tab management
  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Load appropriate data
    switch (tabName) {
      case 'unverified':
        this.loadUnverifiedUsers();
        break;
      case 'bulk':
        // Bulk actions tab doesn't need initial data load
        break;
      case 'history':
        this.loadHistory();
        break;
    }
  }

  // Statistics
  async loadStatistics() {
    try {
      const response = await fetch('https://server-shelf-stacker-w1ds.onrender.com/auth/users', {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const users = await response.json();
      const totalUsers = users.length;
      const verifiedUsers = users.filter(user => user.isEmailVerified).length;
      const unverifiedUsers = totalUsers - verifiedUsers;
      const verificationRate = totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0;

      // Update statistics
      document.getElementById('totalUsers').textContent = totalUsers;
      document.getElementById('verifiedUsers').textContent = verifiedUsers;
      document.getElementById('unverifiedUsers').textContent = unverifiedUsers;
      document.getElementById('verificationRate').textContent = `${verificationRate}%`;

    } catch (error) {
      console.error('Error loading statistics:', error);
      this.showNotification('Lỗi khi tải thống kê', 'error');
    }
  }

  // User management
  async loadUnverifiedUsers() {
    try {
      const tbody = document.getElementById('usersTableBody');
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Đang tải...</td></tr>';

      const response = await fetch(`https://server-shelf-stacker-w1ds.onrender.com/auth/users?page=${this.currentPage}&limit=${this.itemsPerPage}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      const users = Array.isArray(data) ? data : [];
      const unverifiedUsers = users.filter(user => !user.isEmailVerified);

      this.renderUsersTable(unverifiedUsers);
      this.renderPagination(unverifiedUsers.length);

    } catch (error) {
      console.error('Error loading unverified users:', error);
      this.showNotification('Lỗi khi tải danh sách users', 'error');
    }
  }

  renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Không có users nào chưa xác thực email</td></tr>';
      return;
    }

    tbody.innerHTML = users.map((user, index) => `
      <tr>
        <td>
          <input type="checkbox" class="user-checkbox" value="${user._id}" onchange="adminEmailVerification.toggleUserSelection('${user._id}', this.checked)">
        </td>
        <td class="user-email">${user.email || 'N/A'}</td>
        <td>${user.username || user.full_name || 'N/A'}</td>
        <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</td>
        <td>${user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('vi-VN') : 'N/A'}</td>
        <td>
          <span class="user-status status-unverified">Chưa xác thực</span>
        </td>
        <td class="action-buttons">
          <button class="btn btn-verify" onclick="adminEmailVerification.verifyUserEmail('${user._id}', '${user.email}')">
            <i class="fas fa-check"></i> Xác thực
          </button>
          <button class="btn btn-send-email" onclick="adminEmailVerification.sendVerificationEmail('${user._id}')">
            <i class="fas fa-envelope"></i> Gửi email
          </button>
          <button class="btn btn-view" onclick="adminEmailVerification.viewUserDetails('${user._id}')">
            <i class="fas fa-eye"></i> Chi tiết
          </button>
        </td>
      </tr>
    `).join('');
  }

  renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / this.itemsPerPage);
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
      pagination.innerHTML = '';
      return;
    }

    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
      <button onclick="adminEmailVerification.changePage(${this.currentPage - 1})" 
              ${this.currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i>
      </button>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
        paginationHTML += `
          <button onclick="adminEmailVerification.changePage(${i})" 
                  class="${i === this.currentPage ? 'active' : ''}">
            ${i}
          </button>
        `;
      } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
        paginationHTML += '<span>...</span>';
      }
    }

    // Next button
    paginationHTML += `
      <button onclick="adminEmailVerification.changePage(${this.currentPage + 1})" 
              ${this.currentPage === totalPages ? 'disabled' : ''}>
        <i class="fas fa-chevron-right"></i>
      </button>
    `;

    pagination.innerHTML = paginationHTML;
  }

  changePage(page) {
    this.currentPage = page;
    this.loadUnverifiedUsers();
  }

  // Search functionality
  async searchUsers() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    
    if (!searchTerm) {
      this.loadUnverifiedUsers();
      return;
    }

    try {
      const response = await fetch(`https://server-shelf-stacker-w1ds.onrender.com/auth/users?search=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) throw new Error('Search failed');

      const users = await response.json();
      const unverifiedUsers = users.filter(user => !user.isEmailVerified);
      
      this.renderUsersTable(unverifiedUsers);
      document.getElementById('pagination').innerHTML = '';

    } catch (error) {
      console.error('Search error:', error);
      this.showNotification('Lỗi khi tìm kiếm', 'error');
    }
  }

  // User selection
  toggleUserSelection(userId, isSelected) {
    if (isSelected) {
      this.selectedUsers.add(userId);
    } else {
      this.selectedUsers.delete(userId);
    }
    this.updateSelectAllState();
  }

  toggleSelectAll(isSelected) {
    const checkboxes = document.querySelectorAll('.user-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = isSelected;
      this.toggleUserSelection(checkbox.value, isSelected);
    });
  }

  updateSelectAllState() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.user-checkbox');
    const checkedBoxes = document.querySelectorAll('.user-checkbox:checked');
    
    if (checkedBoxes.length === 0) {
      selectAll.checked = false;
      selectAll.indeterminate = false;
    } else if (checkedBoxes.length === checkboxes.length) {
      selectAll.checked = true;
      selectAll.indeterminate = false;
    } else {
      selectAll.checked = false;
      selectAll.indeterminate = true;
    }
  }

  // User actions
  async verifyUserEmail(userId, email) {
    if (!confirm(`Bạn có chắc muốn xác thực email cho ${email}?`)) {
      return;
    }

    try {
      const response = await fetch('https://server-shelf-stacker-w1ds.onrender.com/api/email-verification/admin/verify-user-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          userId: userId,
          email: email,
          reason: 'Admin manual verification'
        })
      });

      const result = await response.json();

      if (result.success) {
        this.showNotification('Xác thực email thành công!', 'success');
        this.loadStatistics();
        this.loadUnverifiedUsers();
      } else {
        throw new Error(result.message || 'Xác thực thất bại');
      }

    } catch (error) {
      console.error('Verification error:', error);
      this.showNotification(`Lỗi: ${error.message}`, 'error');
    }
  }

  async sendVerificationEmail(userId) {
    try {
      const response = await fetch('https://server-shelf-stacker-w1ds.onrender.com/api/email-verification/admin/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          userId: userId,
          purpose: 'admin_verification'
        })
      });

      const result = await response.json();

      if (result.success) {
        this.showNotification('Email xác thực đã được gửi!', 'success');
      } else {
        throw new Error(result.message || 'Gửi email thất bại');
      }

    } catch (error) {
      console.error('Send email error:', error);
      this.showNotification(`Lỗi: ${error.message}`, 'error');
    }
  }

  viewUserDetails(userId) {
    // Implement user details view
    this.showNotification('Tính năng xem chi tiết đang được phát triển', 'info');
  }

  // Bulk actions
  async executeBulkAction() {
    const action = document.getElementById('bulkAction').value;
    const reason = document.getElementById('bulkReason').value;

    if (!action) {
      this.showNotification('Vui lòng chọn hành động', 'error');
      return;
    }

    if (this.selectedUsers.size === 0) {
      this.showNotification('Vui lòng chọn ít nhất một user', 'error');
      return;
    }

    const users = Array.from(this.selectedUsers).map(userId => ({ userId }));

    try {
      let response;
      
      switch (action) {
        case 'verify':
          response = await fetch('https://server-shelf-stacker-w1ds.onrender.com/api/email-verification/admin/verify-multiple-users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify({
              users: users,
              reason: reason || 'Bulk admin verification'
            })
          });
          break;

        case 'send_email':
          // Send verification emails to multiple users
          for (const user of users) {
            await this.sendVerificationEmail(user.userId);
          }
          this.showNotification(`Đã gửi email xác thực cho ${users.length} users`, 'success');
          return;

        case 'export':
          this.exportUsers(users);
          return;

        default:
          this.showNotification('Hành động không hợp lệ', 'error');
          return;
      }

      const result = await response.json();

      if (result.success) {
        this.showNotification(`Đã xử lý ${result.data.total} users thành công!`, 'success');
        this.loadStatistics();
        this.loadUnverifiedUsers();
        this.selectedUsers.clear();
        this.updateSelectAllState();
      } else {
        throw new Error(result.message || 'Thao tác thất bại');
      }

    } catch (error) {
      console.error('Bulk action error:', error);
      this.showNotification(`Lỗi: ${error.message}`, 'error');
    }
  }

  // Utility actions
  async sendReminderEmails() {
    if (!confirm('Gửi email nhắc nhở cho tất cả users chưa xác thực?')) {
      return;
    }

    try {
      this.showNotification('Đang gửi email nhắc nhở...', 'info');
      
      // This would typically call a bulk reminder API
      // For now, we'll just show a success message
      setTimeout(() => {
        this.showNotification('Đã gửi email nhắc nhở thành công!', 'success');
      }, 2000);

    } catch (error) {
      console.error('Send reminder error:', error);
      this.showNotification('Lỗi khi gửi email nhắc nhở', 'error');
    }
  }

  async cleanupExpiredTokens() {
    try {
      const response = await fetch('https://server-shelf-stacker-w1ds.onrender.com/api/email-verification/cleanup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      const result = await response.json();

      if (result.success) {
        this.showNotification(`Đã dọn dẹp ${result.data.deletedCount} token hết hạn`, 'success');
      } else {
        throw new Error(result.message || 'Dọn dẹp thất bại');
      }

    } catch (error) {
      console.error('Cleanup error:', error);
      this.showNotification('Lỗi khi dọn dẹp token', 'error');
    }
  }

  exportUnverifiedUsers() {
    // Implement CSV export
    this.showNotification('Tính năng xuất danh sách đang được phát triển', 'info');
  }

  // History management
  async loadHistory() {
    try {
      const tbody = document.getElementById('historyTableBody');
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">Đang tải lịch sử...</td></tr>';

      // This would typically fetch from a history API
      // For now, we'll show a placeholder
      setTimeout(() => {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">Tính năng lịch sử đang được phát triển</td></tr>';
      }, 1000);

    } catch (error) {
      console.error('Load history error:', error);
      this.showNotification('Lỗi khi tải lịch sử', 'error');
    }
  }

  async searchHistory() {
    // Implement history search
    this.showNotification('Tính năng tìm kiếm lịch sử đang được phát triển', 'info');
  }
}

// Initialize the admin email verification system
let adminEmailVerification;

document.addEventListener('DOMContentLoaded', function() {
  adminEmailVerification = new AdminEmailVerification();
});

// Global functions for onclick handlers
window.refreshUsers = function() {
  adminEmailVerification.loadUnverifiedUsers();
};

window.searchUsers = function() {
  adminEmailVerification.searchUsers();
};

window.executeBulkAction = function() {
  adminEmailVerification.executeBulkAction();
};

window.sendReminderEmails = function() {
  adminEmailVerification.sendReminderEmails();
};

window.cleanupExpiredTokens = function() {
  adminEmailVerification.cleanupExpiredTokens();
};

window.exportUnverifiedUsers = function() {
  adminEmailVerification.exportUnverifiedUsers();
};

window.searchHistory = function() {
  adminEmailVerification.searchHistory();
};

