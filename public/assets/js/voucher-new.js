// Voucher New JavaScript - Optimized Version
const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com/api';
const VOUCHER_API = `${API_BASE_URL}/vouchers`;

// Global variables
let allVouchers = [];
let currentPage = 1;
let itemsPerPage = 10;
let pendingDeleteVoucherId = null;
let currentEditingVoucher = null; // Track current editing voucher

// Debug mode - set to true to enable detailed logging
const DEBUG_MODE = true;

// Debug logging function
function debugLog(message, data = null) {
  if (DEBUG_MODE) {
    console.log(`[VOUCHER DEBUG] ${message}`, data || '');
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  debugLog('Initializing voucher system...');
  initializeApp();
  setupEventListeners();
  loadVouchers();
});

// Initialize application
function initializeApp() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    showNotification('error', 'Vui lòng đăng nhập.');
    window.location.href = 'login.html';
    return;
  }
  debugLog('App initialized successfully');
}

// Setup event listeners
function setupEventListeners() {
  debugLog('Setting up event listeners...');
  
  // Search and filter events
  const searchInput = document.getElementById('searchVoucher');
  const voucherTypeFilter = document.getElementById('voucherTypeFilter');
  const statusFilter = document.getElementById('statusFilter');
  
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    debugLog('Search event listener added');
  }
  
  if (voucherTypeFilter) {
    voucherTypeFilter.addEventListener('change', handleFilterChange);
    debugLog('Voucher type filter event listener added');
  }
  
  if (statusFilter) {
    statusFilter.addEventListener('change', handleFilterChange);
    debugLog('Status filter event listener added');
  }

  // Form events
  const createForm = document.getElementById('createVoucherForm');
  const editForm = document.getElementById('editVoucherForm');
  
  if (createForm) {
    createForm.addEventListener('submit', handleCreateVoucher);
    debugLog('Create form event listener added');
  }
  
  if (editForm) {
    editForm.addEventListener('submit', handleEditVoucher);
    debugLog('Edit form event listener added');
  }

  // Voucher type change events
  const voucherType = document.getElementById('voucherType');
  const editVoucherType = document.getElementById('editVoucherType');
  
  if (voucherType) {
    voucherType.addEventListener('change', handleVoucherTypeChange);
    debugLog('Voucher type change event listener added');
  }
  
  if (editVoucherType) {
    editVoucherType.addEventListener('change', handleEditVoucherTypeChange);
    debugLog('Edit voucher type change event listener added');
  }
  
  // Discount type change events
  const discountType = document.getElementById('discountType');
  const editDiscountType = document.getElementById('editDiscountType');
  
  if (discountType) {
    discountType.addEventListener('change', handleDiscountTypeChange);
    debugLog('Discount type change event listener added');
  }
  
  if (editDiscountType) {
    editDiscountType.addEventListener('change', handleEditDiscountTypeChange);
    debugLog('Edit discount type change event listener added');
  }
  
  debugLog('All event listeners setup completed');
}

// Load vouchers with improved error handling
async function loadVouchers() {
  debugLog('Loading vouchers...');
  showLoading(true);
  
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(VOUCHER_API, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    debugLog('API Response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    debugLog('API Response data:', data);

    // Handle different response structures
    if (data && Array.isArray(data)) {
      allVouchers = data;
      debugLog('Using array response structure, vouchers count:', data.length);
    } else if (data && data.vouchers && Array.isArray(data.vouchers)) {
      allVouchers = data.vouchers;
      debugLog('Using vouchers property response structure, vouchers count:', data.vouchers.length);
    } else if (data && data.data && Array.isArray(data.data)) {
      allVouchers = data.data;
      debugLog('Using data property response structure, vouchers count:', data.data.length);
    } else {
      allVouchers = [];
      debugLog('No valid voucher data found, using empty array');
    }

    renderVouchers();
    updateSummaryStats();
    debugLog('Vouchers loaded successfully');
  } catch (error) {
    console.error('Error loading vouchers:', error);
    debugLog('Error loading vouchers:', error.message);
    showNotification('error', 'Không thể tải danh sách voucher.');
    document.getElementById('voucherTableBody').innerHTML = '<tr><td colspan="8" class="text-center text-danger">Không tải được dữ liệu.</td></tr>';
  } finally {
    showLoading(false);
  }
}

// Render vouchers table with improved data handling
function renderVouchers() {
  debugLog('Rendering vouchers...');
  const tableBody = document.getElementById('voucherTableBody');
  
  if (!tableBody) {
    debugLog('Table body element not found');
    return;
  }
  
  if (!allVouchers.length) {
    tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Không có voucher nào.</td></tr>';
    debugLog('No vouchers to render');
    return;
  }

  tableBody.innerHTML = '';
  
  allVouchers.forEach((voucher, index) => {
    debugLog(`Rendering voucher ${index + 1}:`, voucher);
    const row = createVoucherRow(voucher);
    tableBody.appendChild(row);
  });
  
  debugLog('Vouchers rendered successfully');
}

// Create voucher table row with improved data validation
function createVoucherRow(voucher) {
  const row = document.createElement('tr');
  
  // Validate voucher data
  if (!voucher) {
    debugLog('Invalid voucher data:', voucher);
    row.innerHTML = '<td colspan="8" class="text-center text-danger">Dữ liệu voucher không hợp lệ</td>';
    return row;
  }
  
  const typeLabel = voucher.voucher_type === 'discount' ? 'Giảm giá' : 'Giảm ship';
  const valueLabel = formatVoucherValue(voucher);
  const statusBadge = createStatusBadge(voucher);
  const usageProgress = createUsageProgress(voucher);

  row.innerHTML = `
    <td><strong>${voucher.voucher_id || 'N/A'}</strong></td>
    <td><span class="badge badge-${voucher.voucher_type === 'discount' ? 'primary' : 'info'}">${typeLabel}</span></td>
    <td>${valueLabel}</td>
    <td>≥ ${formatCurrency(voucher.min_order_value || 0)}</td>
    <td>${formatDateRange(voucher.start_date, voucher.end_date)}</td>
    <td>${usageProgress}</td>
    <td>${statusBadge}</td>
    <td>
      <button class="btn btn-sm btn-primary" onclick="editVoucher('${voucher._id}')" title="Sửa">
        <i class="fas fa-edit"></i>
      </button>
      <button class="btn btn-sm btn-danger" onclick="deleteVoucher('${voucher._id}')" title="Xóa">
        <i class="fas fa-trash"></i>
      </button>
    </td>
  `;

  return row;
}

// Format voucher value with improved validation
function formatVoucherValue(voucher) {
  if (!voucher) return 'N/A';
  
  if (voucher.voucher_type === 'discount') {
    if (voucher.discount_type === 'percentage') {
      let value = `${voucher.discount_value || 0}%`;
      if (voucher.max_discount_value) {
        value += ` (tối đa ${formatCurrency(voucher.max_discount_value)})`;
      }
      return value;
    } else {
      return formatCurrency(voucher.discount_value || 0);
    }
  } else {
    return formatCurrency(voucher.shipping_discount || 0);
  }
}

// Create status badge with improved logic
function createStatusBadge(voucher) {
  if (!voucher) return '<span class="status-badge inactive">Không xác định</span>';
  
  const now = new Date();
  const endDate = new Date(voucher.end_date);
  
  if (!voucher.is_active) {
    return '<span class="status-badge inactive">Ngưng hoạt động</span>';
  } else if (endDate < now) {
    return '<span class="status-badge expired">Hết hạn</span>';
  } else {
    return '<span class="status-badge active">Đang hoạt động</span>';
  }
}

// Create usage progress with improved calculation
function createUsageProgress(voucher) {
  if (!voucher) return '<div class="usage-progress"><div class="progress-text">0/0</div></div>';
  
  const usageCount = voucher.usage_count || 0;
  const usageLimit = voucher.usage_limit || 0;
  const usagePercent = usageLimit > 0 ? (usageCount / usageLimit) * 100 : 0;
  
  return `
    <div class="usage-progress">
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${Math.min(usagePercent, 100)}%"></div>
      </div>
      <div class="progress-text">${usageCount}/${usageLimit}</div>
    </div>
  `;
}

// Update summary stats with improved calculation
function updateSummaryStats() {
  debugLog('Updating summary stats...');
  const now = new Date();
  const stats = {
    totalVouchers: allVouchers.length,
    activeVouchers: allVouchers.filter(v => v && v.is_active && new Date(v.end_date) >= now).length,
    expiredVouchers: allVouchers.filter(v => v && new Date(v.end_date) < now).length,
    totalUsage: allVouchers.reduce((sum, v) => sum + (v?.usage_count || 0), 0)
  };
  
  debugLog('Calculated stats:', stats);
  
  const totalElement = document.getElementById('totalVouchers');
  const activeElement = document.getElementById('activeVouchers');
  const expiredElement = document.getElementById('expiredVouchers');
  const usageElement = document.getElementById('totalUsage');
  
  if (totalElement) totalElement.textContent = stats.totalVouchers;
  if (activeElement) activeElement.textContent = stats.activeVouchers;
  if (expiredElement) expiredElement.textContent = stats.expiredVouchers;
  if (usageElement) usageElement.textContent = stats.totalUsage;
}

// Modal functions with improved state management
function openCreateVoucherModal() {
  debugLog('Opening create voucher modal');
  document.getElementById('createVoucherModal').classList.add('active');
  resetCreateForm();
}

function closeCreateVoucherModal() {
  debugLog('Closing create voucher modal');
  document.getElementById('createVoucherModal').classList.remove('active');
}

function openEditVoucherModal() {
  debugLog('Opening edit voucher modal');
  document.getElementById('editVoucherModal').classList.add('active');
}

function closeEditVoucherModal() {
  debugLog('Closing edit voucher modal');
  document.getElementById('editVoucherModal').classList.remove('active');
  currentEditingVoucher = null; // Clear current editing voucher
}

// Analytics modal functions
function openAnalyticsModal() {
  debugLog('Opening analytics modal');
  document.getElementById('analyticsModal').classList.add('active');
  loadAnalytics();
}

function closeAnalyticsModal() {
  debugLog('Closing analytics modal');
  document.getElementById('analyticsModal').classList.remove('active');
}

// Delete modal functions
function openDeleteModal(id) {
  debugLog('Opening delete modal for voucher:', id);
  pendingDeleteVoucherId = id;
  document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
  debugLog('Closing delete modal');
  document.getElementById('deleteModal').classList.remove('active');
  pendingDeleteVoucherId = null;
}

function confirmDeleteVoucher() {
  if (pendingDeleteVoucherId) {
    debugLog('Confirming delete for voucher:', pendingDeleteVoucherId);
    deleteVoucher(pendingDeleteVoucherId);
    closeDeleteModal();
  }
}

// Form handling with improved validation
function resetCreateForm() {
  debugLog('Resetting create form');
  const form = document.getElementById('createVoucherForm');
  if (form) {
    form.reset();
    document.getElementById('voucherType').value = 'discount';
    document.getElementById('discountType').value = 'fixed';
    handleVoucherTypeChange();
    handleDiscountTypeChange();
  }
}

function handleVoucherTypeChange() {
  debugLog('Handling voucher type change');
  const voucherType = document.getElementById('voucherType').value;
  const discountFields = document.getElementById('discountFields');
  const shippingFields = document.getElementById('shippingFields');
  
  if (discountFields && shippingFields) {
    if (voucherType === 'discount') {
      discountFields.style.display = 'flex';
      shippingFields.style.display = 'none';
    } else {
      discountFields.style.display = 'none';
      shippingFields.style.display = 'block';
    }
  }
}

function handleEditVoucherTypeChange() {
  debugLog('Handling edit voucher type change');
  const voucherType = document.getElementById('editVoucherType').value;
  const discountFields = document.getElementById('editDiscountFields');
  const shippingFields = document.getElementById('editShippingFields');
  
  if (discountFields && shippingFields) {
    if (voucherType === 'discount') {
      discountFields.style.display = 'flex';
      shippingFields.style.display = 'none';
    } else {
      discountFields.style.display = 'none';
      shippingFields.style.display = 'block';
    }
  }
}

function handleDiscountTypeChange() {
  debugLog('Handling discount type change');
  const discountType = document.getElementById('discountType').value;
  const maxDiscountGroup = document.getElementById('maxDiscountGroup');
  
  if (maxDiscountGroup) {
    if (discountType === 'percentage') {
      maxDiscountGroup.style.display = 'block';
    } else {
      maxDiscountGroup.style.display = 'none';
    }
  }
}

function handleEditDiscountTypeChange() {
  debugLog('Handling edit discount type change');
  const discountType = document.getElementById('editDiscountType').value;
  const maxDiscountGroup = document.getElementById('editMaxDiscountGroup');
  
  if (maxDiscountGroup) {
    if (discountType === 'percentage') {
      maxDiscountGroup.style.display = 'block';
    } else {
      maxDiscountGroup.style.display = 'none';
    }
  }
}

// Create voucher with improved validation
async function handleCreateVoucher(event) {
  event.preventDefault();
  debugLog('Handling create voucher form submission');
  
  const formData = new FormData(event.target);
  const voucherData = Object.fromEntries(formData.entries());
  
  debugLog('Form data:', voucherData);
  
  // Enhanced validation
  if (!voucherData.voucher_id || !voucherData.voucher_id.trim()) {
    showNotification('error', 'Mã voucher không được để trống.');
    return;
  }
  
  if (voucherData.voucher_type === 'discount' && !voucherData.discount_value) {
    showNotification('error', 'Giá trị giảm giá không được để trống.');
    return;
  }
  
  if (voucherData.voucher_type === 'shipping' && !voucherData.shipping_discount) {
    showNotification('error', 'Giá trị giảm ship không được để trống.');
    return;
  }
  
  voucherData.is_active = voucherData.is_active === 'on';
  
  const numberFields = ['discount_value', 'shipping_discount', 'min_order_value', 'max_discount_value', 'usage_limit', 'max_per_user'];
  numberFields.forEach(field => {
    if (voucherData[field]) {
      voucherData[field] = parseInt(voucherData[field]);
    }
  });

  try {
    showLoading(true);
    const token = localStorage.getItem('authToken');
    
    debugLog('Sending create voucher request:', voucherData);
    
    const response = await fetch(VOUCHER_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(voucherData)
    });

    const result = await response.json();
    debugLog('Create voucher response:', result);

    if (response.ok) {
      showNotification('success', 'Tạo voucher thành công!');
      closeCreateVoucherModal();
      loadVouchers();
    } else {
      throw new Error(result.message || result.error || 'Tạo voucher thất bại');
    }
  } catch (error) {
    console.error('Error creating voucher:', error);
    debugLog('Error creating voucher:', error.message);
    showNotification('error', error.message || 'Tạo voucher thất bại');
  } finally {
    showLoading(false);
  }
}

// Edit voucher with improved data fetching and mapping
async function editVoucher(id) {
  debugLog('Editing voucher with ID:', id);
  
  try {
    showLoading(true);
    const token = localStorage.getItem('authToken');
    
    debugLog('Fetching voucher data from API...');
    
    const response = await fetch(`${VOUCHER_API}/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    debugLog('Edit voucher API response status:', response.status);

    if (response.ok) {
      const voucher = await response.json();
      debugLog('Fetched voucher data:', voucher);
      
      // Store current editing voucher
      currentEditingVoucher = voucher;
      
      populateEditForm(voucher);
      openEditVoucherModal();
    } else {
      const errorData = await response.json().catch(() => ({}));
      debugLog('API error response:', errorData);
      throw new Error(errorData.message || 'Không thể tải thông tin voucher');
    }
  } catch (error) {
    console.error('Error loading voucher:', error);
    debugLog('Error loading voucher:', error.message);
    showNotification('error', error.message);
  } finally {
    showLoading(false);
  }
}

// Populate edit form with improved data mapping
function populateEditForm(voucher) {
  debugLog('Populating edit form with voucher data:', voucher);
  
  if (!voucher) {
    debugLog('No voucher data provided for form population');
    return;
  }
  
  // Map all form fields with fallback values
  const fieldMappings = {
    'editVoucherId': voucher._id || '',
    'editVoucherIdField': voucher.voucher_id || '',
    'editVoucherType': voucher.voucher_type || 'discount',
    'editDescription': voucher.description || '',
    'editDiscountType': voucher.discount_type || 'fixed',
    'editDiscountValue': voucher.discount_value || '',
    'editMaxDiscountValue': voucher.max_discount_value || '',
    'editShippingDiscount': voucher.shipping_discount || '',
    'editMinOrderValue': voucher.min_order_value || '',
    'editUsageLimit': voucher.usage_limit || '',
    'editMaxPerUser': voucher.max_per_user || '',
    'editStartDate': formatDateTimeForInput(voucher.start_date),
    'editEndDate': formatDateTimeForInput(voucher.end_date),
    'editIsActive': voucher.is_active || false
  };
  
  // Populate each field
  Object.entries(fieldMappings).forEach(([fieldId, value]) => {
    const element = document.getElementById(fieldId);
    if (element) {
      if (element.type === 'checkbox') {
        element.checked = value;
      } else {
        element.value = value;
      }
      debugLog(`Set field ${fieldId} to:`, value);
    } else {
      debugLog(`Field ${fieldId} not found in DOM`);
    }
  });

  // Update form visibility based on voucher type
  handleEditVoucherTypeChange();
  handleEditDiscountTypeChange();
  
  debugLog('Edit form populated successfully');
}

// Handle edit voucher with improved validation
async function handleEditVoucher(event) {
  event.preventDefault();
  debugLog('Handling edit voucher form submission');
  
  const formData = new FormData(event.target);
  const voucherData = Object.fromEntries(formData.entries());
  const voucherId = voucherData._id;
  
  debugLog('Edit form data:', voucherData);
  
  if (!voucherId) {
    showNotification('error', 'ID voucher không hợp lệ.');
    return;
  }
  
  delete voucherData._id;
  voucherData.is_active = voucherData.is_active === 'on';
  
  const numberFields = ['discount_value', 'shipping_discount', 'min_order_value', 'max_discount_value', 'usage_limit', 'max_per_user'];
  numberFields.forEach(field => {
    if (voucherData[field]) {
      voucherData[field] = parseInt(voucherData[field]);
    }
  });

  try {
    showLoading(true);
    const token = localStorage.getItem('authToken');
    
    debugLog('Sending update voucher request:', voucherData);
    
    const response = await fetch(`${VOUCHER_API}/${voucherId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(voucherData)
    });

    const result = await response.json();
    debugLog('Update voucher response:', result);

    if (response.ok) {
      showNotification('success', 'Cập nhật voucher thành công!');
      closeEditVoucherModal();
      loadVouchers();
    } else {
      throw new Error(result.message || result.error || 'Cập nhật voucher thất bại');
    }
  } catch (error) {
    console.error('Error updating voucher:', error);
    debugLog('Error updating voucher:', error.message);
    showNotification('error', error.message || 'Cập nhật voucher thất bại');
  } finally {
    showLoading(false);
  }
}

// Delete voucher with improved confirmation
async function deleteVoucher(id) {
  debugLog('Deleting voucher with ID:', id);
  
  if (!confirm('Bạn có chắc chắn muốn xóa voucher này?')) {
    debugLog('Delete cancelled by user');
    return;
  }

  try {
    showLoading(true);
    const token = localStorage.getItem('authToken');
    
    debugLog('Sending delete voucher request...');
    
    const response = await fetch(`${VOUCHER_API}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    debugLog('Delete voucher response status:', response.status);

    if (response.ok) {
      showNotification('success', 'Xóa voucher thành công!');
      loadVouchers();
    } else {
      const result = await response.json();
      debugLog('Delete error response:', result);
      throw new Error(result.message || result.error || 'Không thể xóa voucher');
    }
  } catch (error) {
    console.error('Error deleting voucher:', error);
    debugLog('Error deleting voucher:', error.message);
    showNotification('error', error.message);
  } finally {
    showLoading(false);
  }
}

// Search and filter functions with improved performance
function handleSearch() {
  const searchTerm = document.getElementById('searchVoucher').value.toLowerCase();
  debugLog('Searching for:', searchTerm);
  
  const filteredVouchers = allVouchers.filter(voucher => 
    voucher && (
      (voucher.voucher_id && voucher.voucher_id.toLowerCase().includes(searchTerm)) ||
      (voucher.description && voucher.description.toLowerCase().includes(searchTerm))
    )
  );
  
  debugLog('Search results count:', filteredVouchers.length);
  renderFilteredVouchers(filteredVouchers);
}

function handleFilterChange() {
  const voucherType = document.getElementById('voucherTypeFilter').value;
  const status = document.getElementById('statusFilter').value;
  
  debugLog('Filtering by type:', voucherType, 'status:', status);
  
  let filteredVouchers = allVouchers;
  
  if (voucherType) {
    filteredVouchers = filteredVouchers.filter(v => v && v.voucher_type === voucherType);
  }
  
  if (status) {
    const now = new Date();
    filteredVouchers = filteredVouchers.filter(v => {
      if (!v) return false;
      
      if (status === 'active') return v.is_active && new Date(v.end_date) >= now;
      if (status === 'inactive') return !v.is_active;
      if (status === 'expired') return new Date(v.end_date) < now;
      return true;
    });
  }
  
  debugLog('Filter results count:', filteredVouchers.length);
  renderFilteredVouchers(filteredVouchers);
}

function renderFilteredVouchers(vouchers) {
  debugLog('Rendering filtered vouchers:', vouchers.length);
  const tableBody = document.getElementById('voucherTableBody');
  
  if (!vouchers.length) {
    tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Không tìm thấy voucher nào.</td></tr>';
    return;
  }

  tableBody.innerHTML = '';
  vouchers.forEach(voucher => {
    const row = createVoucherRow(voucher);
    tableBody.appendChild(row);
  });
}

// Analytics functions with improved error handling
async function loadAnalytics() {
  debugLog('Loading analytics...');
  try {
    showLoading(true);
    const token = localStorage.getItem('authToken');
    const startDate = document.getElementById('analyticsStartDate').value;
    const endDate = document.getElementById('analyticsEndDate').value;
    
    debugLog('Analytics date range:', { startDate, endDate });
    
    const response = await fetch(`${VOUCHER_API}/analytics?startDate=${startDate}&endDate=${endDate}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      debugLog('Analytics data received:', data);
      renderAnalytics(data);
    } else {
      throw new Error('Không thể tải dữ liệu thống kê');
    }
  } catch (error) {
    console.error('Error loading analytics:', error);
    debugLog('Error loading analytics:', error.message);
    showNotification('error', error.message);
    // Fallback to basic analytics from current data
    renderBasicAnalytics();
  } finally {
    showLoading(false);
  }
}

function renderAnalytics(data) {
  debugLog('Rendering analytics with data:', data);
  // Implementation for analytics charts
  // This would typically use a charting library like Chart.js
  console.log('Analytics data:', data);
}

function renderBasicAnalytics() {
  debugLog('Rendering basic analytics from current data');
  // Basic analytics using current voucher data
  const topVouchers = allVouchers
    .filter(v => v) // Filter out null/undefined vouchers
    .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
    .slice(0, 5);
  
  debugLog('Top vouchers:', topVouchers);
}

// Notification functions
function toggleNotificationDropdown() {
  debugLog('Toggling notification dropdown');
  const dropdown = document.getElementById('notificationDropdown');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
}

// Utility functions with improved error handling
function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    if (show) {
      overlay.classList.add('active');
    } else {
      overlay.classList.remove('active');
    }
  }
}

function showNotification(type, message) {
  debugLog('Showing notification:', { type, message });
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('vi-VN');
  } catch (error) {
    debugLog('Error formatting date:', dateString, error);
    return 'N/A';
  }
}

function formatDateRange(startDate, endDate) {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  return `${start} - ${end}`;
}

function formatDateTimeForInput(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      debugLog('Invalid date string:', dateString);
      return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    debugLog('Error formatting datetime for input:', dateString, error);
    return '';
  }
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

// Sidebar functions
function toggleSidebar() {
  debugLog('Toggling sidebar');
  const sidebar = document.getElementById('mainSidebar');
  if (sidebar) {
    sidebar.classList.toggle('active');
  }
}

function toggleMenu(menuId) {
  debugLog('Toggling menu:', menuId);
  const menu = document.getElementById(menuId);
  if (menu) {
    const isVisible = menu.style.display !== 'none';
    menu.style.display = isVisible ? 'none' : 'block';
  }
}

// Close modals when clicking outside
document.addEventListener('click', function(event) {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    if (event.target === modal) {
      modal.classList.remove('active');
    }
  });
});

// Close modals with Escape key
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.classList.remove('active');
    });
  }
});

// Export functions for global access
window.editVoucher = editVoucher;
window.deleteVoucher = deleteVoucher;
window.openCreateVoucherModal = openCreateVoucherModal;
window.closeCreateVoucherModal = closeCreateVoucherModal;
window.openEditVoucherModal = openEditVoucherModal;
window.closeEditVoucherModal = closeEditVoucherModal;
window.openAnalyticsModal = openAnalyticsModal;
window.closeAnalyticsModal = closeAnalyticsModal;
window.openDeleteModal = openDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDeleteVoucher = confirmDeleteVoucher;
window.toggleNotificationDropdown = toggleNotificationDropdown;
window.toggleSidebar = toggleSidebar;
window.toggleMenu = toggleMenu;
