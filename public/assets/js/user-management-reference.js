// Constants
const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';
const ITEMS_PER_PAGE = 10;

// State
let currentPage = 1;
let totalPages = 1;
let users = [];
let selectedUsers = new Set();
let userStats = {
  total: 0,
  active: 0,
  inactive: 0,
  blocked: 0
};

// DOM Elements
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const sortFilter = document.getElementById('sortFilter');
const userTableBody = document.getElementById('userTableBody');
const loadingIndicator = document.getElementById('loadingIndicator');
const emptyState = document.getElementById('emptyState');
const pageNumbers = document.getElementById('pageNumbers');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const userModal = document.getElementById('userModal');
const confirmationModal = document.getElementById('confirmationModal');
const selectAllCheckbox = document.getElementById('selectAll');

// Stats Elements
const totalUsersElement = document.getElementById('totalUsers');
const activeUsersElement = document.getElementById('activeUsers');
const inactiveUsersElement = document.getElementById('inactiveUsers');
const blockedUsersElement = document.getElementById('blockedUsers');

// API Functions
async function fetchUsers() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    
    const searchTerm = searchInput.value.trim();
    const status = statusFilter.value;
    const sort = sortFilter.value;
    
    const queryParams = new URLSearchParams({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      ...(searchTerm && { search: searchTerm }),
      ...(status && { status }),
      ...(sort && { sort })
    });
    
    const response = await fetch(`${API_BASE_URL}/api/users?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    const data = await response.json();
    users = data.users;
    totalPages = Math.ceil(data.total / ITEMS_PER_PAGE);
    userStats = data.stats;
    
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    showError('Failed to load users. Please try again.');
  }
}

async function updateUserStatus(userId, status) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update user status');
    }
    
    await loadUsers();
    showSuccess('User status updated successfully');
  } catch (error) {
    console.error('Error updating user status:', error);
    showError('Failed to update user status. Please try again.');
  }
}

async function deleteUser(userId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
    
    await loadUsers();
    showSuccess('User deleted successfully');
  } catch (error) {
    console.error('Error deleting user:', error);
    showError('Failed to delete user. Please try again.');
  }
}

// UI Functions
async function loadUsers() {
  showLoading(true);
  const data = await fetchUsers();
  
  if (data) {
    updateStats();
    renderUsers();
    updatePagination();
  }
  
  showLoading(false);
}

function updateStats() {
  totalUsersElement.textContent = userStats.total;
  activeUsersElement.textContent = userStats.active;
  inactiveUsersElement.textContent = userStats.inactive;
  blockedUsersElement.textContent = userStats.blocked;
}

function renderUsers() {
  userTableBody.innerHTML = '';
  
  if (users.length === 0) {
    showEmptyState(true);
    return;
  }
  
  showEmptyState(false);
  
  users.forEach(user => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <input type="checkbox" class="user-checkbox" data-user-id="${user._id}" 
               ${selectedUsers.has(user._id) ? 'checked' : ''} />
      </td>
      <td>
        <div class="user-info-cell">
          <img src="${user.avatar || '/assets/images/default-avatar.png'}" 
               alt="${user.name}" class="user-avatar-small" />
          <div>
            <p class="user-name">${user.name}</p>
            <p class="user-email">${user.email}</p>
          </div>
        </div>
      </td>
      <td>${formatDate(user.lastLogin)}</td>
      <td>${formatDate(user.createdAt)}</td>
      <td>
        <span class="status-badge ${user.status}">
          <i class="fas fa-circle"></i>
          <span>${formatStatus(user.status)}</span>
        </span>
      </td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-primary" onclick="showUserDetails('${user._id}')">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn ${user.status === 'blocked' ? 'btn-success' : 'btn-warning'}"
                  onclick="toggleUserStatus('${user._id}', '${user.status}')">
            <i class="fas fa-${user.status === 'blocked' ? 'unlock' : 'lock'}"></i>
          </button>
          <button class="btn btn-danger" onclick="confirmDelete('${user._id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    
    userTableBody.appendChild(tr);
  });
  
  document.querySelectorAll('.user-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const userId = e.target.dataset.userId;
      if (e.target.checked) {
        selectedUsers.add(userId);
      } else {
        selectedUsers.delete(userId);
      }
      updateSelectAllCheckbox();
    });
  });
}

function updatePagination() {
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;
  
  pageNumbers.innerHTML = '';
  
  const maxPages = 5;
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + maxPages - 1);
  
  for (let i = startPage; i <= endPage; i++) {
    const pageNumber = document.createElement('div');
    pageNumber.classList.add('page-number');
    if (i === currentPage) pageNumber.classList.add('active');
    pageNumber.textContent = i;
    pageNumber.addEventListener('click', () => {
      currentPage = i;
      loadUsers();
    });
    pageNumbers.appendChild(pageNumber);
  }
}

function showUserDetails(userId) {
  const user = users.find(u => u._id === userId);
  if (!user) return;
  
  document.getElementById('modalUserAvatar').src = user.avatar || '/assets/images/default-avatar.png';
  document.getElementById('modalUserName').textContent = user.name;
  document.getElementById('modalUserEmail').textContent = user.email;
  document.getElementById('modalUserPhone').textContent = user.phone || '-';
  document.getElementById('modalUserJoinDate').textContent = formatDate(user.createdAt);
  document.getElementById('modalUserLastLogin').textContent = formatDate(user.lastLogin);
  document.getElementById('modalUserOrders').textContent = user.orderCount || '0';
  
  const statusBadge = document.getElementById('modalUserStatusBadge');
  statusBadge.className = `status-badge ${user.status}`;
  statusBadge.querySelector('span').textContent = formatStatus(user.status);
  
  const blockBtn = document.getElementById('blockUserBtn');
  blockBtn.textContent = user.status === 'blocked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản';
  blockBtn.className = user.status === 'blocked' ? 'btn btn-success' : 'btn btn-warning';
  blockBtn.onclick = () => toggleUserStatus(user._id, user.status);
  
  document.getElementById('deleteUserBtn').onclick = () => confirmDelete(user._id);
  
  userModal.classList.add('active');
}

function confirmDelete(userId) {
  const user = users.find(u => u._id === userId);
  if (!user) return;
  
  document.getElementById('confirmationTitle').textContent = 'Xác nhận xóa người dùng';
  document.getElementById('confirmationMessage').textContent = 
    `Bạn có chắc chắn muốn xóa người dùng "${user.name}"? Hành động này không thể hoàn tác.`;
  
  document.getElementById('confirmActionBtn').onclick = () => {
    deleteUser(userId);
    closeModals();
  };
  
  confirmationModal.classList.add('active');
}

// Event Handlers
function handleSelectAll(e) {
  const checkboxes = document.querySelectorAll('.user-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = e.target.checked;
    const userId = checkbox.dataset.userId;
    if (e.target.checked) {
      selectedUsers.add(userId);
    } else {
      selectedUsers.delete(userId);
    }
  });
}

function toggleUserStatus(userId, currentStatus) {
  const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
  const actionText = newStatus === 'blocked' ? 'khóa' : 'mở khóa';
  const user = users.find(u => u._id === userId);
  
  document.getElementById('confirmationTitle').textContent = `Xác nhận ${actionText} tài khoản`;
  document.getElementById('confirmationMessage').textContent = 
    `Bạn có chắc chắn muốn ${actionText} tài khoản của "${user.name}"?`;
  
  document.getElementById('confirmActionBtn').onclick = () => {
    updateUserStatus(userId, newStatus);
    closeModals();
  };
  
  confirmationModal.classList.add('active');
}

// Utility Functions
function updateSelectAllCheckbox() {
  const checkboxes = document.querySelectorAll('.user-checkbox');
  const checkedCount = document.querySelectorAll('.user-checkbox:checked').length;
  selectAllCheckbox.checked = checkedCount === checkboxes.length;
}

function showLoading(show) {
  loadingIndicator.style.display = show ? 'block' : 'none';
  userTableBody.style.display = show ? 'none' : 'table-row-group';
}

function showEmptyState(show) {
  emptyState.style.display = show ? 'block' : 'none';
  userTableBody.style.display = show ? 'none' : 'table-row-group';
}

function closeModals() {
  userModal.classList.remove('active');
  confirmationModal.classList.remove('active');
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatStatus(status) {
  const statusMap = {
    active: 'Đang hoạt động',
    inactive: 'Không hoạt động',
    blocked: 'Đã khóa'
  };
  return statusMap[status] || status;
}

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

function showSuccess(message) {
  alert(message); // Replace with your toast/notification system
}

function showError(message) {
  alert(message); // Replace with your toast/notification system
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadUsers();
  
  searchInput.addEventListener('input', debounce(loadUsers, 300));
  statusFilter.addEventListener('change', () => {
    currentPage = 1;
    loadUsers();
  });
  sortFilter.addEventListener('change', () => {
    currentPage = 1;
    loadUsers();
  });
  
  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadUsers();
    }
  });
  
  nextPageBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadUsers();
    }
  });
  
  selectAllCheckbox.addEventListener('change', handleSelectAll);
  
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      closeModals();
    }
  });
  
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', closeModals);
  });
});