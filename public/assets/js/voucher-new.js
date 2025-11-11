// Voucher New JavaScript - Optimized Version
const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com/api';
const VOUCHER_API = `${API_BASE_URL}/vouchers`;

// Global variables
let allVouchers = [];
let allDeletedVouchers = []; // Lưu tất cả vouchers đã xóa
let currentViewMode = 'active'; // 'active' or 'deleted'
let currentPage = 1;
let itemsPerPage = 10;
let pendingDeleteVoucherId = null;
let currentEditingVoucher = null; // Track current editing voucher
let currentVoucherSortColumn = null; // Cột đang được sắp xếp
let currentVoucherSortDirection = null; // Hướng sắp xếp hiện tại (asc/desc)

// Debug mode - set to true to enable detailed logging
const DEBUG_MODE = true;

// Debug logging function
function debugLog(message, data = null) {
  if (DEBUG_MODE) {
    console.log(`[VOUCHER DEBUG] ${message}`, data || '');
  }
}

// Update voucher stats
function updateVoucherStats(stats) {
  document.getElementById('totalVouchers').textContent = stats.total || 0;
  document.getElementById('activeVouchers').textContent = stats.active || 0;
  document.getElementById('expiredVouchers').textContent = stats.expired || 0;
  document.getElementById('usageCount').textContent = stats.used || 0;
}

// Loading spinner
function showLoadingSpinner() {
  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  spinner.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(spinner);
}

function hideLoadingSpinner() {
  const spinner = document.querySelector('.loading-spinner');
  if (spinner) {
    spinner.remove();
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

// Validate voucher data
function validateVoucherData(data) {
  // Required fields
  if (!data.code || !data.discountType || !data.discountValue || !data.minOrderValue) {
    return 'Vui lòng điền đầy đủ thông tin bắt buộc';
  }

  // Validate discount value
  const discountValue = parseFloat(data.discountValue);
  if (isNaN(discountValue) || discountValue <= 0) {
    return 'Giá trị giảm giá không hợp lệ';
  }

  // For percentage discounts
  if (data.discountType === 'percent' && discountValue > 100) {
    return 'Phần trăm giảm giá không thể vượt quá 100%';
  }

  // Validate minimum order value
  const minOrderValue = parseFloat(data.minOrderValue);
  if (isNaN(minOrderValue) || minOrderValue < 0) {
    return 'Giá trị đơn hàng tối thiểu không hợp lệ';
  }

  // Validate usage limit
  if (data.usageLimit && parseInt(data.usageLimit) <= 0) {
    return 'Giới hạn sử dụng phải lớn hơn 0';
  }

  // Validate dates
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  const now = new Date();

  if (startDate < now) {
    return 'Ngày bắt đầu phải sau thời điểm hiện tại';
  }

  if (endDate <= startDate) {
    return 'Ngày kết thúc phải sau ngày bắt đầu';
  }

  return null;
}

// Setup event listeners
function setupEventListeners() {
  debugLog('Setting up event listeners...');
  
  // Search and filter events
  const searchInput = document.getElementById('searchVoucher');
  const voucherTypeFilter = document.getElementById('voucherTypeFilter');
  const statusFilter = document.getElementById('statusFilter');
  
  if (searchInput) {
    // Create debounced search function
    const debouncedSearch = debounce(handleSearch, 500);
    
    // Handle autocomplete on input
    searchInput.addEventListener('input', function(e) {
      const query = e.target.value.trim();
      
      // Show autocomplete if query length >= 2
      if (query.length >= 2) {
        handleAutocomplete(query);
        // Also trigger search for filtering existing vouchers
        debouncedSearch();
      } else {
        // Hide autocomplete if query is too short
        const autocompleteDropdown = document.getElementById('voucherAutocomplete');
        if (autocompleteDropdown) {
          autocompleteDropdown.style.display = 'none';
        }
        
        // If empty, show all vouchers immediately
        if (query.length === 0) {
          handleSearch();
        }
      }
    });
    
    // Handle focus - show autocomplete if there's a query
    searchInput.addEventListener('focus', function(e) {
      const query = e.target.value.trim();
      if (query.length >= 2) {
        handleAutocomplete(query);
      }
    });
    
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

  // View mode toggle (Active/Deleted)
  const voucherActiveTab = document.getElementById('voucherActiveTab');
  const voucherDeletedTab = document.getElementById('voucherDeletedTab');
  if (voucherActiveTab) {
    voucherActiveTab.addEventListener('click', () => {
      switchVoucherViewMode('active');
    });
  }
  if (voucherDeletedTab) {
    voucherDeletedTab.addEventListener('click', () => {
      switchVoucherViewMode('deleted');
    });
  }

  // Update search input listener to handle view mode
  if (searchInput) {
    // Also listen for input changes to trigger search in deleted mode
    searchInput.addEventListener('input', function(e) {
      const query = e.target.value.trim();
      
      if (currentViewMode === 'deleted') {
        // For deleted tab, search immediately without autocomplete
        handleDeletedVouchersSearch(query);
      } else {
        // For active tab, use existing autocomplete logic
        if (query.length >= 2) {
          handleAutocomplete(query);
        } else {
          const autocompleteDropdown = document.getElementById('voucherAutocomplete');
          if (autocompleteDropdown) {
            autocompleteDropdown.style.display = 'none';
          }
        }
        // Trigger search after debounce
        const debouncedSearch = debounce(handleSearch, 500);
        debouncedSearch();
      }
    });
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

  // Apply sorting if any
  let vouchersToRender = [...allVouchers];
  if (currentVoucherSortColumn) {
    sortVouchers(vouchersToRender, currentVoucherSortColumn, currentVoucherSortDirection);
  }

  tableBody.innerHTML = '';
  
  vouchersToRender.forEach((voucher, index) => {
    debugLog(`Rendering voucher ${index + 1}:`, voucher);
    const row = createVoucherRow(voucher);
    tableBody.appendChild(row);
  });
  
  debugLog('Vouchers rendered successfully');
  
  // Setup sortable columns after render
  setupVoucherSortableColumns();
  
  // Update active filters
  updateVoucherActiveFilters();
}

// Setup sortable columns for vouchers
function setupVoucherSortableColumns() {
  const sortableHeaders = document.querySelectorAll('.voucher-table thead th.sortable');
  sortableHeaders.forEach(header => {
    if (!header.dataset.hasListener) {
      header.dataset.hasListener = 'true';
      header.addEventListener('click', function() {
        const sortField = this.getAttribute('data-sort');
        handleVoucherColumnSort(sortField, this);
      });
    }
  });
}

// Handle voucher column sorting
function handleVoucherColumnSort(field, headerElement) {
  // Remove sort classes from all headers
  document.querySelectorAll('.voucher-table thead th.sortable').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc', 'sort-none');
  });

  // Determine new sort direction
  if (currentVoucherSortColumn === field) {
    // Toggle direction if clicking same column
    currentVoucherSortDirection = currentVoucherSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    // Default to ascending for new column
    currentVoucherSortDirection = 'asc';
    currentVoucherSortColumn = field;
  }

  // Add sort class to current header
  headerElement.classList.add(`sort-${currentVoucherSortDirection}`);

  // Re-render vouchers with sorting
  renderVouchers();
}

// Sort vouchers array
function sortVouchers(vouchers, field, direction) {
  if (!vouchers || vouchers.length === 0) return;

  vouchers.sort((a, b) => {
    let aValue, bValue;

    switch(field) {
      case 'voucher_id':
        aValue = (a.voucher_id || '').toLowerCase();
        bValue = (b.voucher_id || '').toLowerCase();
        break;
      case 'value':
        // Sort by discount value or shipping discount
        if (a.voucher_type === 'discount') {
          aValue = parseFloat(a.discount_value || 0);
        } else {
          aValue = parseFloat(a.shipping_discount || 0);
        }
        if (b.voucher_type === 'discount') {
          bValue = parseFloat(b.discount_value || 0);
        } else {
          bValue = parseFloat(b.shipping_discount || 0);
        }
        break;
      case 'min_order':
        aValue = parseFloat(a.min_order_value || 0);
        bValue = parseFloat(b.min_order_value || 0);
        break;
      case 'date':
        aValue = new Date(a.start_date || 0);
        bValue = new Date(b.start_date || 0);
        break;
      default:
        return 0;
    }

    // Compare values
    if (field === 'date') {
      // Date comparison
      if (direction === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    } else if (field === 'value' || field === 'min_order') {
      // Numeric comparison
      if (direction === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    } else {
      // String comparison
      if (direction === 'asc') {
        return aValue.localeCompare(bValue, 'vi');
      } else {
        return bValue.localeCompare(aValue, 'vi');
      }
    }
  });
}

// Create voucher table row with improved data validation
function createVoucherRow(voucher, searchTerm = '') {
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

  // Use provided searchTerm or get from input
  if (!searchTerm) {
    searchTerm = document.getElementById('searchVoucher')?.value.trim() || '';
  }
  const voucherId = voucher.voucher_id || 'N/A';
  const highlightedVoucherId = highlightSearchText(voucherId, searchTerm);

  row.innerHTML = `
    <td><strong>${highlightedVoucherId}</strong></td>
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

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Highlight search text in content
function highlightSearchText(text, searchTerm) {
  if (!searchTerm || !text) return escapeHtml(text);
  
  const escapedText = escapeHtml(text);
  const escapedSearch = escapeHtml(searchTerm);
  const regex = new RegExp(`(${escapedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  
  return escapedText.replace(regex, '<mark style="background-color: #fef08a; padding: 2px 4px; border-radius: 3px;">$1</mark>');
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
  
  if (!confirm('Bạn có chắc chắn muốn xóa voucher này? Voucher sẽ được chuyển vào thùng rác và có thể khôi phục sau.')) {
    debugLog('Delete cancelled by user');
    return;
  }

  try {
    showLoading(true);
    const token = localStorage.getItem('authToken');
    
    debugLog('Sending soft delete voucher request...');
    
    // Use admin endpoint for soft delete
    const response = await fetch(`${VOUCHER_API}/admin/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    debugLog('Delete voucher response status:', response.status);

    if (response.ok) {
      const result = await response.json();
      showNotification('success', result.message || 'Xóa voucher thành công!');
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

// Autocomplete variables
let autocompleteTimeout = null;
let autocompleteAbortController = null;
let selectedAutocompleteIndex = -1;

// Autocomplete function
async function handleAutocomplete(query) {
  // Don't show autocomplete in deleted mode
  if (currentViewMode === 'deleted') {
    const autocompleteDropdown = document.getElementById('voucherAutocomplete');
    if (autocompleteDropdown) {
      autocompleteDropdown.style.display = 'none';
    }
    return;
  }

  // Clear previous timeout
  if (autocompleteTimeout) {
    clearTimeout(autocompleteTimeout);
  }

  // Cancel previous request
  if (autocompleteAbortController) {
    autocompleteAbortController.abort();
  }

  const autocompleteDropdown = document.getElementById('voucherAutocomplete');
  if (!autocompleteDropdown) return;

  // If query is less than 2 characters, hide dropdown
  if (!query || query.length < 2) {
    autocompleteDropdown.style.display = 'none';
    selectedAutocompleteIndex = -1;
    return;
  }

  // Show loading state
  autocompleteDropdown.innerHTML = '<div class="autocomplete-loading"><i class="fas fa-spinner fa-spin"></i> Đang tìm kiếm...</div>';
  autocompleteDropdown.style.display = 'block';

  // Debounce API call
  autocompleteTimeout = setTimeout(async () => {
    try {
      // Create new AbortController for this request
      autocompleteAbortController = new AbortController();
      
      const token = localStorage.getItem('authToken') || localStorage.getItem('admin_token') || localStorage.getItem('access_token');
      const response = await fetch(`${VOUCHER_API}/autocomplete?q=${encodeURIComponent(query)}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: autocompleteAbortController.signal
      });

      if (!response.ok) {
        throw new Error('Autocomplete request failed');
      }

      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        renderAutocompleteSuggestions(result.data, query);
      } else {
        autocompleteDropdown.innerHTML = '<div class="autocomplete-empty">Không tìm thấy voucher nào</div>';
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      console.error('Autocomplete error:', error);
      autocompleteDropdown.innerHTML = '<div class="autocomplete-empty">Lỗi khi tìm kiếm</div>';
    }
  }, 300);
}

// Render autocomplete suggestions
function renderAutocompleteSuggestions(suggestions, query) {
  const autocompleteDropdown = document.getElementById('voucherAutocomplete');
  if (!autocompleteDropdown) return;

  autocompleteDropdown.innerHTML = suggestions.map((item, index) => {
    const highlightedVoucherId = highlightSearchText(item.voucher_id || item.value || item.label, query);
    const typeLabel = item.voucher_type === 'discount' ? 'Giảm giá' : 'Giảm ship';
    const discountText = item.discount_type === 'percentage' 
      ? `${item.discount_value}%` 
      : `${formatCurrency(item.discount_value || 0)}`;
    
    return `
      <div class="autocomplete-item" data-index="${index}" data-voucher-id="${item.voucher_id || item.value}">
        <div class="autocomplete-item-title">${highlightedVoucherId}</div>
        <div class="autocomplete-item-meta">
          <span class="autocomplete-item-type">${typeLabel}</span>
          ${item.discount_value ? `<span>Giảm: ${discountText}</span>` : ''}
          ${item.description ? `<span>${escapeHtml(item.description.substring(0, 50))}${item.description.length > 50 ? '...' : ''}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Add click handlers
  autocompleteDropdown.querySelectorAll('.autocomplete-item').forEach(item => {
    item.addEventListener('click', function() {
      const voucherId = this.dataset.voucherId;
      selectAutocompleteSuggestion(voucherId);
    });
    
    item.addEventListener('mouseenter', function() {
      // Remove active class from all items
      autocompleteDropdown.querySelectorAll('.autocomplete-item').forEach(i => i.classList.remove('active'));
      // Add active class to current item
      this.classList.add('active');
      selectedAutocompleteIndex = parseInt(this.dataset.index);
    });
  });

  selectedAutocompleteIndex = -1;
  autocompleteDropdown.style.display = 'block';
}

// Select autocomplete suggestion
function selectAutocompleteSuggestion(voucherId) {
  const searchInput = document.getElementById('searchVoucher');
  const autocompleteDropdown = document.getElementById('voucherAutocomplete');
  
  if (searchInput) {
    searchInput.value = voucherId;
    // Focus back to input
    searchInput.focus();
  }
  
  if (autocompleteDropdown) {
    autocompleteDropdown.style.display = 'none';
  }
  
  selectedAutocompleteIndex = -1;
  
  // Trigger search immediately (no debounce needed since user selected)
  handleSearch();
}

// Close autocomplete when clicking outside
document.addEventListener('click', function(event) {
  const searchBox = document.querySelector('.search-box');
  const autocompleteDropdown = document.getElementById('voucherAutocomplete');
  
  if (searchBox && autocompleteDropdown && !searchBox.contains(event.target)) {
    autocompleteDropdown.style.display = 'none';
    selectedAutocompleteIndex = -1;
  }
});

// Handle keyboard navigation in autocomplete
document.addEventListener('keydown', function(event) {
  const autocompleteDropdown = document.getElementById('voucherAutocomplete');
  if (!autocompleteDropdown || autocompleteDropdown.style.display === 'none') {
    return;
  }

  const items = autocompleteDropdown.querySelectorAll('.autocomplete-item');
  if (items.length === 0) return;

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    selectedAutocompleteIndex = Math.min(selectedAutocompleteIndex + 1, items.length - 1);
    items[selectedAutocompleteIndex].scrollIntoView({ block: 'nearest' });
    items.forEach((item, index) => {
      item.classList.toggle('active', index === selectedAutocompleteIndex);
    });
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    selectedAutocompleteIndex = Math.max(selectedAutocompleteIndex - 1, -1);
    if (selectedAutocompleteIndex >= 0) {
      items[selectedAutocompleteIndex].scrollIntoView({ block: 'nearest' });
    }
    items.forEach((item, index) => {
      item.classList.toggle('active', index === selectedAutocompleteIndex);
    });
  } else if (event.key === 'Enter' && selectedAutocompleteIndex >= 0) {
    event.preventDefault();
    const selectedItem = items[selectedAutocompleteIndex];
    if (selectedItem) {
      const voucherId = selectedItem.dataset.voucherId;
      selectAutocompleteSuggestion(voucherId);
    }
  } else if (event.key === 'Escape') {
    autocompleteDropdown.style.display = 'none';
    selectedAutocompleteIndex = -1;
  }
});

// Search and filter functions with improved performance
function handleSearch() {
  const searchInput = document.getElementById('searchVoucher');
  const searchTerm = searchInput ? searchInput.value.trim() : '';
  debugLog('Searching for:', searchTerm);
  
  // Hide autocomplete when searching (only for active tab)
  if (currentViewMode === 'active') {
    const autocompleteDropdown = document.getElementById('voucherAutocomplete');
    if (autocompleteDropdown) {
      autocompleteDropdown.style.display = 'none';
    }
  }
  
  // Handle search based on current view mode
  if (currentViewMode === 'deleted') {
    // Search in deleted vouchers
    handleDeletedVouchersSearch(searchTerm);
  } else {
    // Search in active vouchers
    const searchLower = searchTerm.toLowerCase();
    const filteredVouchers = allVouchers.filter(voucher => 
      voucher && (
        (voucher.voucher_id && voucher.voucher_id.toLowerCase().includes(searchLower)) ||
        (voucher.description && voucher.description.toLowerCase().includes(searchLower))
      )
    );
    
    debugLog('Search results count:', filteredVouchers.length);
    renderFilteredVouchers(filteredVouchers, searchTerm);
    updateVoucherActiveFilters();
  }
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
  updateVoucherActiveFilters();
}

// Update active filters display for vouchers
function updateVoucherActiveFilters() {
  const container = document.getElementById('activeFiltersContainer');
  if (!container) {
    // Create container if it doesn't exist
    const actionBar = document.querySelector('.action-bar');
    if (actionBar) {
      const newContainer = document.createElement('div');
      newContainer.id = 'activeFiltersContainer';
      newContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; align-items: center;';
      actionBar.parentNode.insertBefore(newContainer, actionBar.nextSibling);
      return updateVoucherActiveFilters();
    }
    return;
  }

  container.innerHTML = '';

  // Search filter
  const searchTerm = document.getElementById('searchVoucher')?.value.trim() || '';
  if (searchTerm) {
    const badge = createVoucherFilterBadge('Tìm kiếm', `"${searchTerm}"`, 'search');
    container.appendChild(badge);
  }

  // Voucher type filter
  const voucherType = document.getElementById('voucherTypeFilter')?.value || '';
  if (voucherType) {
    const typeMap = {
      discount: 'Giảm giá',
      percent: 'Giảm giá phần trăm',
      shipping: 'Miễn phí vận chuyển',
      combo: 'Combo giảm giá'
    };
    const typeText = typeMap[voucherType] || voucherType;
    const badge = createVoucherFilterBadge('Loại', typeText, 'type');
    container.appendChild(badge);
  }

  // Status filter
  const status = document.getElementById('statusFilter')?.value || '';
  if (status) {
    const statusMap = {
      active: 'Đang hoạt động',
      inactive: 'Ngưng hoạt động',
      expired: 'Hết hạn'
    };
    const statusText = statusMap[status] || status;
    const badge = createVoucherFilterBadge('Trạng thái', statusText, 'status');
    container.appendChild(badge);
  }

  // Show container if there are filters
  container.style.display = container.children.length > 0 ? 'flex' : 'none';
}

// Create filter badge for vouchers
function createVoucherFilterBadge(label, value, filterType) {
  const badge = document.createElement('div');
  badge.className = 'filter-badge';
  badge.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    background: #e0e7ff;
    color: #3730a3;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
  `;
  
  badge.innerHTML = `
    <span><strong>${label}:</strong> ${escapeHtml(value)}</span>
    <button type="button" class="filter-remove-btn" data-filter-type="${filterType}" style="
      background: none;
      border: none;
      color: #6366f1;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      font-size: 1rem;
      line-height: 1;
    ">
      <i class="fas fa-times"></i>
    </button>
  `;

  // Add click handler for remove button
  const removeBtn = badge.querySelector('.filter-remove-btn');
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    removeVoucherFilter(filterType);
  });

  return badge;
}

// Remove individual filter for vouchers
function removeVoucherFilter(filterType) {
  switch(filterType) {
    case 'search':
      const searchInput = document.getElementById('searchVoucher');
      if (searchInput) searchInput.value = '';
      break;
    case 'type':
      const voucherTypeFilter = document.getElementById('voucherTypeFilter');
      if (voucherTypeFilter) voucherTypeFilter.value = '';
      break;
    case 'status':
      const statusFilter = document.getElementById('statusFilter');
      if (statusFilter) statusFilter.value = '';
      break;
  }
  
  // Re-apply filters
  handleFilterChange();
  handleSearch();
}

function renderFilteredVouchers(vouchers, searchTerm = '') {
  debugLog('Rendering filtered vouchers:', vouchers.length);
  const tableBody = document.getElementById('voucherTableBody');
  
  if (!vouchers.length) {
    tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Không tìm thấy voucher nào.</td></tr>';
    setupVoucherSortableColumns(); // Setup even when empty
    updateVoucherActiveFilters(); // Update filters even when empty
    return;
  }

  // Apply sorting if any
  let vouchersToRender = [...vouchers];
  if (currentVoucherSortColumn) {
    sortVouchers(vouchersToRender, currentVoucherSortColumn, currentVoucherSortDirection);
  }

  tableBody.innerHTML = '';
  vouchersToRender.forEach(voucher => {
    const row = createVoucherRow(voucher, searchTerm);
    tableBody.appendChild(row);
  });
  
  // Setup sortable columns after render
  setupVoucherSortableColumns();
  
  // Update active filters
  updateVoucherActiveFilters();
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

// Switch view mode between active and deleted vouchers
function switchVoucherViewMode(mode) {
  currentViewMode = mode;
  const activeView = document.getElementById('activeVouchersView');
  const deletedView = document.getElementById('deletedVouchersView');
  const activeTab = document.getElementById('voucherActiveTab');
  const deletedTab = document.getElementById('voucherDeletedTab');
  
  // Hide autocomplete when switching tabs
  const autocompleteDropdown = document.getElementById('voucherAutocomplete');
  if (autocompleteDropdown) {
    autocompleteDropdown.style.display = 'none';
  }

  if (mode === 'active') {
    if (activeView) activeView.style.display = 'block';
    if (deletedView) deletedView.style.display = 'none';
    if (activeTab) {
      activeTab.style.borderBottomColor = '#4f46e5';
      activeTab.style.color = '#4f46e5';
      activeTab.style.fontWeight = '600';
    }
    if (deletedTab) {
      deletedTab.style.borderBottomColor = 'transparent';
      deletedTab.style.color = '#6b7280';
      deletedTab.style.fontWeight = '500';
    }
    // Load active vouchers if not loaded
    if (allVouchers.length === 0) {
      loadVouchers();
    } else {
      // Apply current search if exists
      const searchInput = document.getElementById('searchVoucher');
      const searchTerm = searchInput ? searchInput.value.trim() : '';
      if (searchTerm) {
        handleSearch();
      } else {
        renderVouchers();
      }
    }
  } else {
    if (activeView) activeView.style.display = 'none';
    if (deletedView) deletedView.style.display = 'block';
    if (activeTab) {
      activeTab.style.borderBottomColor = 'transparent';
      activeTab.style.color = '#6b7280';
      activeTab.style.fontWeight = '500';
    }
    if (deletedTab) {
      deletedTab.style.borderBottomColor = '#4f46e5';
      deletedTab.style.color = '#4f46e5';
      deletedTab.style.fontWeight = '600';
    }
    // Load deleted vouchers
    loadDeletedVouchers();
  }
}

// Load deleted vouchers
async function loadDeletedVouchers() {
  debugLog('Loading deleted vouchers...');
  showLoading(true);

  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      showNotification('error', 'Vui lòng đăng nhập.');
      return;
    }

    // Use trash endpoint
    const response = await fetch(`${VOUCHER_API}/trash/all`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    debugLog('Deleted vouchers response:', data);

    allDeletedVouchers = data.vouchers || [];
    debugLog('Loaded deleted vouchers:', allDeletedVouchers.length);

    // Apply search filter if exists
    const searchInput = document.getElementById('searchVoucher');
    const searchTerm = searchInput ? searchInput.value.trim() : '';
    
    if (searchTerm) {
      handleDeletedVouchersSearch(searchTerm);
    } else {
      // Render deleted vouchers
      renderDeletedVouchers(allDeletedVouchers, '');
    }
  } catch (error) {
    debugLog('Error loading deleted vouchers:', error);
    showNotification('error', 'Không thể tải danh sách vouchers đã xóa: ' + error.message);
    const tbody = document.getElementById('deletedVoucherTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 3rem;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #f59e0b; margin-bottom: 1rem;"></i>
            <p style="color: #6b7280;">Lỗi tải dữ liệu</p>
          </td>
        </tr>
      `;
    }
  } finally {
    showLoading(false);
  }
}

// Render deleted vouchers with search highlighting
function renderDeletedVouchers(vouchers, searchTerm = '') {
  const tbody = document.getElementById('deletedVoucherTableBody');
  if (!tbody) return;

  if (!vouchers || vouchers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 3rem;">
          <i class="fas fa-inbox" style="font-size: 3rem; color: #d1d5db; margin-bottom: 1rem;"></i>
          <p style="color: #6b7280;">${searchTerm ? 'Không tìm thấy voucher nào' : 'Không có voucher nào đã xóa'}</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = vouchers.map(v => {
    const deletedAt = v.deletedAt ? new Date(v.deletedAt).toLocaleString('vi-VN') : (v.updatedAt ? new Date(v.updatedAt).toLocaleString('vi-VN') : 'N/A');
    const typeDisplay = v.voucher_type === 'discount' ? 'Giảm giá' : (v.voucher_type === 'shipping' ? 'Giảm ship' : 'N/A');
    const valueDisplay = v.discount_value ? formatCurrency(v.discount_value) : (v.shipping_discount ? formatCurrency(v.shipping_discount) : 'N/A');
    const minOrderDisplay = v.min_order_value ? formatCurrency(v.min_order_value) : 'N/A';
    
    // Highlight search term in voucher_id
    const voucherIdDisplay = searchTerm ? highlightSearchText(v.voucher_id || 'N/A', searchTerm) : escapeHtml(v.voucher_id || 'N/A');

    return `
      <tr style="opacity: 0.8;">
        <td style="vertical-align: middle;">
          <strong style="color: #1f2937;">${voucherIdDisplay}</strong>
        </td>
        <td style="vertical-align: middle; color: #4b5563;">${typeDisplay}</td>
        <td style="vertical-align: middle; color: #4b5563;">${valueDisplay}</td>
        <td style="vertical-align: middle; color: #4b5563; font-size: 0.875rem;">${minOrderDisplay}</td>
        <td style="vertical-align: middle; color: #6b7280; font-size: 0.875rem;">${deletedAt}</td>
        <td style="vertical-align: middle;">
          <div style="display: flex; gap: 0.5rem; justify-content: center;">
            <button onclick="restoreVoucher('${v._id}')" class="btn btn-sm btn-success" title="Khôi phục" style="padding: 0.5rem 1rem;">
              <i class="fas fa-undo"></i> Khôi phục
            </button>
            <button onclick="permanentlyDeleteVoucher('${v._id}')" class="btn btn-sm btn-danger" title="Xóa vĩnh viễn" style="padding: 0.5rem 1rem;">
              <i class="fas fa-trash-alt"></i> Xóa vĩnh viễn
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Handle search for deleted vouchers
function handleDeletedVouchersSearch(searchTerm) {
  if (!searchTerm) {
    renderDeletedVouchers(allDeletedVouchers, '');
    return;
  }

  const searchLower = searchTerm.toLowerCase();
  const filtered = allDeletedVouchers.filter(v => 
    v && (
      (v.voucher_id && v.voucher_id.toLowerCase().includes(searchLower)) ||
      (v.description && v.description.toLowerCase().includes(searchLower))
    )
  );

  renderDeletedVouchers(filtered, searchTerm);
}

// Helper function to escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Restore voucher
async function restoreVoucher(voucherId) {
  if (!confirm('Bạn có chắc muốn khôi phục voucher này?')) {
    return;
  }

  showLoading(true);

  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      showNotification('error', 'Vui lòng đăng nhập.');
      return;
    }

    // Use restore endpoint
    const response = await fetch(`${VOUCHER_API}/${voucherId}/restore`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    showNotification('success', result.message || 'Khôi phục voucher thành công');

    // Reload based on current view mode
    if (currentViewMode === 'deleted') {
      await loadDeletedVouchers();
    } else {
      await loadVouchers();
    }
  } catch (error) {
    debugLog('Error restoring voucher:', error);
    showNotification('error', 'Không thể khôi phục voucher: ' + error.message);
  } finally {
    showLoading(false);
  }
}

// Permanently delete voucher
async function permanentlyDeleteVoucher(voucherId) {
  const voucher = allDeletedVouchers.find(v => v._id === voucherId);
  const voucherCode = voucher ? (voucher.voucher_id || 'voucher này') : 'voucher này';
  
  if (!confirm(`Bạn có chắc muốn XÓA VĨNH VIỄN "${voucherCode}"?\n\nHành động này không thể hoàn tác!`)) {
    return;
  }

  showLoading(true);

  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      showNotification('error', 'Vui lòng đăng nhập.');
      return;
    }

    // Use force delete endpoint
    const response = await fetch(`${VOUCHER_API}/${voucherId}/force`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    showNotification('success', result.message || 'Xóa vĩnh viễn voucher thành công');

    // Reload deleted vouchers
    await loadDeletedVouchers();
  } catch (error) {
    debugLog('Error permanently deleting voucher:', error);
    showNotification('error', 'Không thể xóa vĩnh viễn voucher: ' + error.message);
  } finally {
    showLoading(false);
  }
}

// Export functions for global access
window.editVoucher = editVoucher;
window.deleteVoucher = deleteVoucher;
window.restoreVoucher = restoreVoucher;
window.permanentlyDeleteVoucher = permanentlyDeleteVoucher;
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
