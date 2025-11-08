// User Management JavaScript
const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com/api';

// Get auth token
const getAuthHeader = () => ({
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
  'Content-Type': 'application/json'
});

// Show loading spinner
const showLoading = () => {
  const spinner = document.querySelector('.loading-spinner');
  if (spinner) spinner.style.display = 'flex';
};

// Hide loading spinner
const hideLoading = () => {
  const spinner = document.querySelector('.loading-spinner');
  if (spinner) spinner.style.display = 'none';
};

// Show notification toast
const showToast = (message, type = 'info') => {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};

// Load users with filters
async function loadUsers(page = 1, filters = {}) {
  try {
    showLoading();
    
    const queryParams = new URLSearchParams({
      page,
      ...filters
    });

    const response = await fetch(`${API_BASE_URL}/users?${queryParams}`, {
      headers: getAuthHeader()
    });

    if (!response.ok) throw new Error('Failed to fetch users');

    const data = await response.json();
    renderUsers(data.users);
    updatePagination(data.pagination);
    updateStats(data.stats);

  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

// Render users table
function renderUsers(users) {
  const tbody = document.querySelector('.user-table tbody');
  if (!tbody) return;

  tbody.innerHTML = users.map(user => `
    <tr>
      <td>
        <div class="user-info">
          <img src="${user.avatar || '/assets/img/default-avatar.jpg'}" alt="${user.name}" class="user-avatar">
          <div>
            <div class="user-name">${user.name}</div>
            <div class="user-email">${user.email}</div>
          </div>
        </div>
      </td>
      <td>${user.phone || '-'}</td>
      <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleString('vi-VN') : '-'}</td>
      <td>
        <span class="status-badge ${user.status}">${
          user.status === 'active' ? 'Đang hoạt động' :
          user.status === 'inactive' ? 'Ngừng hoạt động' :
          user.status === 'blocked' ? 'Đã khóa' : 'Không xác định'
        }</span>
      </td>
      <td>
        <div class="actions">
          <button onclick="viewUser('${user.id}')" class="btn-icon" title="Xem chi tiết">
            <i class="fas fa-eye"></i>
          </button>
          <button onclick="editUser('${user.id}')" class="btn-icon" title="Chỉnh sửa">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="toggleUserStatus('${user.id}', '${user.status}')" class="btn-icon" title="${user.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}">
            <i class="fas fa-${user.status === 'active' ? 'lock' : 'unlock'}"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="5" class="no-data">Không có dữ liệu người dùng</td></tr>';
}

// Update pagination
function updatePagination({ currentPage, totalPages, total }) {
  const pagination = document.querySelector('.pagination');
  if (!pagination) return;

  pagination.innerHTML = `
    <button 
      ${currentPage === 1 ? 'disabled' : ''} 
      onclick="loadUsers(${currentPage - 1}, getFilters())"
    >
      <i class="fas fa-chevron-left"></i>
    </button>
    <span>Trang ${currentPage} / ${totalPages}</span>
    <button 
      ${currentPage === totalPages ? 'disabled' : ''} 
      onclick="loadUsers(${currentPage + 1}, getFilters())"
    >
      <i class="fas fa-chevron-right"></i>
    </button>
  `;
}

// Update user stats
function updateStats(stats) {
  document.getElementById('totalUsers').textContent = stats.total || 0;
  document.getElementById('activeUsers').textContent = stats.active || 0;
  document.getElementById('inactiveUsers').textContent = stats.inactive || 0;
  document.getElementById('blockedUsers').textContent = stats.blocked || 0;
}

// Get current filters
function getFilters() {
  return {
    search: document.getElementById('searchInput')?.value || '',
    status: document.getElementById('statusFilter')?.value || '',
    sortBy: document.getElementById('sortFilter')?.value || ''
  };
}

// Handle search input
let searchTimeout;
const handleSearch = (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadUsers(1, getFilters());
  }, 500);
};

// Toggle user status
async function toggleUserStatus(userId, currentStatus) {
  try {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    
    const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) throw new Error('Failed to update user status');

    showToast(`Đã ${newStatus === 'active' ? 'mở khóa' : 'khóa'} tài khoản thành công`, 'success');
    loadUsers(1, getFilters());
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// View user details
function viewUser(userId) {
  // Implementation for viewing user details modal
}

// Edit user
function editUser(userId) {
  // Implementation for editing user modal
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadUsers(1);

  // Setup event listeners
  document.getElementById('searchInput')?.addEventListener('input', handleSearch);
  document.getElementById('statusFilter')?.addEventListener('change', () => loadUsers(1, getFilters()));
  document.getElementById('sortFilter')?.addEventListener('change', () => loadUsers(1, getFilters()));
});