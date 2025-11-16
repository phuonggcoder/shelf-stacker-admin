/**
 * Admin Campaigns Management JavaScript
 */

// Helper: Đợi AdminServices sẵn sàng
function waitForAdminServices(maxWait = 5000) {
    return new Promise((resolve, reject) => {
        if (window.AdminServices && typeof window.AdminServices.getCampaigns === 'function') {
            resolve(window.AdminServices);
            return;
        }
        
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (window.AdminServices && typeof window.AdminServices.getCampaigns === 'function') {
                clearInterval(checkInterval);
                resolve(window.AdminServices);
            } else if (Date.now() - startTime > maxWait) {
                clearInterval(checkInterval);
                reject(new Error('AdminServices không sẵn sàng sau ' + maxWait + 'ms'));
            }
        }, 100);
    });
}

let allCampaigns = [];
let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let filters = {
    search: '',
    type: '',
    status: ''
};

let editingId = null;
window.allBooks = [];
let existingImages = [];
let newImageFiles = [];
let deletedImageUrls = [];
const tableBody = document.getElementById('campaign-table-body');

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN');
}

function getCampaignStatus(campaign) {
  const now = new Date();
  const startDate = new Date(campaign.startDate);
  const endDate = new Date(campaign.endDate);
  
  if (now < startDate) {
    return { status: 'upcoming', label: 'Sắp diễn ra', color: '#f59e0b' };
  } else if (now >= startDate && now <= endDate) {
    return { status: 'active', label: 'Đang hoạt động', color: '#10b981' };
  } else {
    return { status: 'ended', label: 'Đã kết thúc', color: '#6b7280' };
  }
}

// Helper function để escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Highlight search text
function highlightSearchText(text, searchTerm) {
    if (!searchTerm || !text) return escapeHtml(text);
    
    const escapedText = escapeHtml(text);
    const escapedSearch = escapeHtml(searchTerm);
    const regex = new RegExp(`(${escapedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    
    return escapedText.replace(regex, '<mark style="background-color: #fef08a; padding: 2px 4px; border-radius: 3px;">$1</mark>');
}

function renderCampaigns(campaigns) {
  if (!tableBody) {
    console.warn('⚠️ campaign-table-body element not found');
    return;
  }

  if (!campaigns || campaigns.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 3rem;">
          <i class="fas fa-inbox" style="font-size: 3rem; color: #d1d5db; margin-bottom: 1rem;"></i>
          <p style="color: #6b7280;">Không tìm thấy chiến dịch nào</p>
        </td>
      </tr>
    `;
    return;
  }

  const searchTerm = filters.search || '';
  
  // Add fade animation
  tableBody.style.opacity = '0.5';
  tableBody.style.transition = 'opacity 0.2s';

  setTimeout(() => {
    tableBody.innerHTML = campaigns.map(c => {
      const imageUrl = Array.isArray(c.image) && c.image.length > 0 
        ? c.image[0] 
        : 'https://server-shelf-stacker-w1ds.onrender.com/assets/images/default-thumbnail.png';
      
      const typeDisplay = {
        'promotion': 'Khuyến mãi',
        'event': 'Sự kiện',
        'advertisement': 'Quảng cáo',
        'special_offer': 'Ưu đãi đặc biệt',
        'community_event': 'Sự kiện cộng đồng'
      }[c.type] || c.type;
      
      const statusInfo = getCampaignStatus(c);
      const images = Array.isArray(c.image) ? c.image : (c.image ? [c.image] : []);
      const books = Array.isArray(c.books) ? c.books : [];
      
      // Highlight search terms
      const highlightedName = highlightSearchText(c.name, searchTerm);
      
      return `
        <tr style="transition: background-color 0.2s;">
          <td style="vertical-align: middle;">
            <img src="${imageUrl}" 
                 style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 2px solid #ddd;" 
                 alt="Campaign image"
                 data-campaign-id="${c._id}"
                 data-campaign-name="${escapeHtml(c.name || '')}"
                 data-images='${JSON.stringify(images)}'
                 class="campaign-image-view"
                 title="Click để xem hình ảnh"
                 onmouseover="this.style.borderColor='#4f46e5'"
                 onmouseout="this.style.borderColor='#ddd'">
          </td>
          <td style="vertical-align: middle;">
            <strong style="color: #1f2937; font-size: 0.95rem;">${highlightedName}</strong>
          </td>
          <td style="vertical-align: middle;">
            <span class="badge" style="background: #e0e7ff; color: #3730a3; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">
              ${typeDisplay}
            </span>
          </td>
          <td style="vertical-align: middle; color: #4b5563; font-size: 0.9rem;">${formatDate(c.startDate)}</td>
          <td style="vertical-align: middle; color: #4b5563; font-size: 0.9rem;">${formatDate(c.endDate)}</td>
          <td style="vertical-align: middle;">
            <span class="badge" style="background: ${statusInfo.color}20; color: ${statusInfo.color}; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">
              ${statusInfo.label}
            </span>
          </td>
          <td style="vertical-align: middle;">
            <span style="cursor: pointer; color: #4f46e5; text-decoration: underline; font-weight: 600; font-size: 0.9rem;" 
                  data-campaign-id="${c._id}"
                  data-campaign-name="${escapeHtml(c.name || '')}"
                  data-books='${JSON.stringify(books)}'
                  class="campaign-books-view"
                  title="Click để xem danh sách sách"
                  onmouseover="this.style.color='#4338ca'"
                  onmouseout="this.style.color='#4f46e5'">
              ${books.length} sách
            </span>
          </td>
          <td style="vertical-align: middle;">
            <div style="display: flex; gap: 0.5rem; justify-content: center;">
              <button onclick="viewCampaignDetails('${c._id}')" class="btn btn-sm btn-info" title="Xem chi tiết" style="padding: 0.5rem; min-width: 36px;">
                <i class="fas fa-eye"></i>
              </button>
              <button onclick="editCampaign('${c._id}')" class="btn btn-sm btn-primary" title="Sửa" style="padding: 0.5rem; min-width: 36px;">
                <i class="fas fa-edit"></i>
              </button>
              <button onclick="deleteCampaign('${c._id}')" class="btn btn-sm btn-danger" title="Xóa" style="padding: 0.5rem; min-width: 36px;">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
    tableBody.style.opacity = '1';
    
    // Attach event listeners after rendering
    setTimeout(() => {
      document.querySelectorAll('.campaign-image-view').forEach(img => {
        img.addEventListener('click', function() {
          const campaignId = this.getAttribute('data-campaign-id');
          const campaignName = this.getAttribute('data-campaign-name');
          const images = JSON.parse(this.getAttribute('data-images') || '[]');
          viewCampaignImages(campaignId, campaignName, images);
        });
      });
      
      document.querySelectorAll('.campaign-books-view').forEach(span => {
        span.addEventListener('click', function() {
          const campaignId = this.getAttribute('data-campaign-id');
          const campaignName = this.getAttribute('data-campaign-name');
          const books = JSON.parse(this.getAttribute('data-books') || '[]');
          viewCampaignBooks(campaignId, campaignName, books);
        });
      });
    }, 100);
  }, 50);
}

async function loadCampaigns() {
  if (typeof showLoading === 'function') {
    showLoading();
  }
  
  try {
    if (!window.AdminServices) {
      throw new Error('AdminServices is not loaded');
    }
    
    console.log('📢 Loading campaigns...');
    const response = await window.AdminServices.getCampaigns();
    
    // Extract campaigns from response
    const extractDataFunc = window.extractData || function(resp, key) {
      if (!resp) return [];
      if (Array.isArray(resp)) return resp;
      if (key && resp[key]) return Array.isArray(resp[key]) ? resp[key] : [];
      if (resp.data) return Array.isArray(resp.data) ? resp.data : [];
      if (resp.campaigns) return Array.isArray(resp.campaigns) ? resp.campaigns : [];
      return [];
    };
    
    allCampaigns = extractDataFunc(response, 'campaigns');
    console.log('📢 Loaded campaigns:', allCampaigns.length);
    
    // Apply filters and render
    applyFiltersAndRender();
  } catch (error) {
    console.error('❌ Error loading campaigns:', error);
    if (typeof showToast === 'function') {
      showToast('Không thể tải danh sách chiến dịch: ' + error.message, 'error');
    }
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 3rem;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #f59e0b; margin-bottom: 1rem;"></i>
            <p style="color: #6b7280;">Lỗi tải dữ liệu</p>
          </td>
        </tr>
      `;
    }
  } finally {
    if (typeof hideLoading === 'function') {
      hideLoading();
    }
  }
}

function applyFiltersAndRender() {
  let filtered = [...allCampaigns];
  
  // Apply search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(c => {
      const name = (c.name || '').toLowerCase();
      const description = (c.description || '').toLowerCase();
      return name.includes(searchLower) || description.includes(searchLower);
    });
  }
  
  // Apply type filter
  if (filters.type) {
    filtered = filtered.filter(c => c.type === filters.type);
  }
  
  // Apply status filter
  if (filters.status) {
    filtered = filtered.filter(c => {
      const statusInfo = getCampaignStatus(c);
      return statusInfo.status === filters.status;
    });
  }
  
  // Calculate pagination
  totalPages = Math.ceil(filtered.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCampaigns = filtered.slice(startIndex, endIndex);
  
  // Render campaigns
  renderCampaigns(paginatedCampaigns);
  
  // Update pagination
  updatePagination();
  
  // Update active filters
  updateActiveFilters();
}

function updatePagination() {
  const container = document.getElementById('paginationContainer');
  if (!container) return;
  
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
  
  let html = '<div class="pagination" style="display: flex; justify-content: center; align-items: center; gap: 0.5rem; margin-top: 1.5rem;">';
  
  // Previous button
  html += `<button class="btn btn-sm btn-secondary" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">
    <i class="fas fa-chevron-left"></i>
  </button>`;
  
  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      html += `<button class="btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-secondary'}" onclick="goToPage(${i})">${i}</button>`;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      html += '<span style="padding: 0.5rem;">...</span>';
    }
  }
  
  // Next button
  html += `<button class="btn btn-sm btn-secondary" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">
    <i class="fas fa-chevron-right"></i>
  </button>`;
  
  html += '</div>';
  container.innerHTML = html;
}

function goToPage(page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  applyFiltersAndRender();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Update active filters display
function updateActiveFilters() {
  const container = document.getElementById('activeFiltersContainer');
  if (!container) return;

  container.innerHTML = '';

  // Search filter
  if (filters.search) {
    const badge = createCampaignFilterBadge('Tìm kiếm', `"${filters.search}"`, 'search');
    container.appendChild(badge);
  }

  // Type filter
  if (filters.type) {
    const typeMap = {
      'promotion': 'Khuyến mãi',
      'event': 'Sự kiện',
      'advertisement': 'Quảng cáo',
      'special_offer': 'Ưu đãi đặc biệt',
      'community_event': 'Sự kiện cộng đồng'
    };
    const typeText = typeMap[filters.type] || filters.type;
    const badge = createCampaignFilterBadge('Loại', typeText, 'type');
    container.appendChild(badge);
  }

  // Status filter
  if (filters.status) {
    const statusMap = {
      'active': 'Đang hoạt động',
      'upcoming': 'Sắp diễn ra',
      'ended': 'Đã kết thúc'
    };
    const statusText = statusMap[filters.status] || filters.status;
    const badge = createCampaignFilterBadge('Trạng thái', statusText, 'status');
    container.appendChild(badge);
  }

  // Show container if there are filters
  container.style.display = container.children.length > 0 ? 'flex' : 'none';
}

// Create filter badge for campaigns
function createCampaignFilterBadge(label, value, filterType) {
  const badge = document.createElement('div');
  badge.className = 'filter-badge';
  badge.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    background: #e0e7ff;
    color: #3730a3;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
  `;

  badge.innerHTML = `
    <span>${label}: ${value}</span>
    <button type="button" class="filter-remove-btn" data-filter-type="${filterType}" 
            style="background: none; border: none; color: #3730a3; cursor: pointer; padding: 0; margin-left: 0.25rem; display: inline-flex; align-items: center;">
      <i class="fas fa-times" style="font-size: 0.75rem;"></i>
    </button>
  `;

  // Add remove handler
  const removeBtn = badge.querySelector('.filter-remove-btn');
  removeBtn.addEventListener('click', () => {
    removeCampaignFilter(filterType);
  });

  return badge;
}

// Remove campaign filter
function removeCampaignFilter(filterType) {
  if (filterType === 'search') {
    filters.search = '';
    const searchInput = document.getElementById('search-campaign');
    if (searchInput) {
      searchInput.value = '';
      const clearSearchBtn = document.getElementById('clearSearchBtn');
      if (clearSearchBtn) clearSearchBtn.style.display = 'none';
    }
  } else if (filterType === 'type') {
    filters.type = '';
    const typeFilter = document.getElementById('campaignTypeFilter');
    if (typeFilter) typeFilter.value = '';
  } else if (filterType === 'status') {
    filters.status = '';
    const statusFilter = document.getElementById('campaignStatusFilter');
    if (statusFilter) statusFilter.value = '';
  }

  currentPage = 1;
  applyFiltersAndRender();
}

// Setup event listeners
function setupEventListeners() {
  // Search input
  const searchInput = document.getElementById('search-campaign');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      const value = e.target.value.trim();
      const clearSearchBtn = document.getElementById('clearSearchBtn');
      if (clearSearchBtn) {
        clearSearchBtn.style.display = value ? 'block' : 'none';
      }
      
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        filters.search = value;
        currentPage = 1;
        applyFiltersAndRender();
      }, 500);
    });
    
    // Clear search button
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        filters.search = '';
        currentPage = 1;
        applyFiltersAndRender();
      });
    }
  }
  
  // Type filter
  const typeFilter = document.getElementById('campaignTypeFilter');
  if (typeFilter) {
    typeFilter.addEventListener('change', (e) => {
      filters.type = e.target.value;
      currentPage = 1;
      applyFiltersAndRender();
    });
  }
  
  // Status filter
  const statusFilter = document.getElementById('campaignStatusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      filters.status = e.target.value;
      currentPage = 1;
      applyFiltersAndRender();
    });
  }
  
  // Add campaign button
  const addBtn = document.getElementById('btn-add-campaign');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      editingId = null;
      showCampaignModal();
    });
  }
  
  // Refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadCampaigns();
    });
  }
  
  // Modal close buttons
  const closeModal = document.getElementById('closeCampaignModal');
  const cancelBtn = document.getElementById('cancelCampaignBtn');
  if (closeModal) {
    closeModal.addEventListener('click', () => {
      hideCampaignModal();
    });
  }
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      hideCampaignModal();
    });
  }
  
  // Campaign form submit
  const campaignForm = document.getElementById('campaign-form');
  if (campaignForm) {
    campaignForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveCampaign();
    });
  }
}

// Show campaign modal
function showCampaignModal() {
  const modal = document.getElementById('campaign-modal');
  if (modal) {
    modal.style.display = 'flex';
    // Reset form if adding new campaign
    if (!editingId) {
      const form = document.getElementById('campaign-form');
      if (form) form.reset();
      existingImages = [];
      newImageFiles = [];
      deletedImageUrls = [];
      const imagePreviewContainer = document.getElementById('image-preview-container');
      if (imagePreviewContainer) imagePreviewContainer.innerHTML = '';
      const bookSearchList = document.getElementById('book-search-list');
      if (bookSearchList) bookSearchList.innerHTML = '';
      const selectedBooksCount = document.getElementById('selected-books-count');
      if (selectedBooksCount) selectedBooksCount.textContent = 'Đã chọn: 0 sách';
      const bookSearchWrap = document.getElementById('book-search-wrap');
      if (bookSearchWrap) bookSearchWrap.style.display = 'none';
    }
  }
}

// Hide campaign modal
function hideCampaignModal() {
  const modal = document.getElementById('campaign-modal');
  if (modal) {
    modal.style.display = 'none';
    editingId = null;
  }
}

// Save campaign
async function saveCampaign() {
  const nameInput = document.getElementById('campaign-name');
  const descInput = document.getElementById('campaign-desc');
  const typeSelect = document.getElementById('campaign-type');
  const startDateInput = document.getElementById('campaign-start-date');
  const endDateInput = document.getElementById('campaign-end-date');
  const booksSelect = document.getElementById('campaign-books');
  const imagesInput = document.getElementById('campaign-images');
  const saveBtn = document.getElementById('saveCampaignBtn');

  if (!nameInput || !typeSelect || !startDateInput || !endDateInput) {
    if (typeof showToast === 'function') {
      showToast('Không tìm thấy các trường form cần thiết', 'error');
    }
    return;
  }

  const name = nameInput.value.trim();
  const description = descInput ? descInput.value.trim() : '';
  const type = typeSelect.value;
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  if (!name || !type || !startDate || !endDate) {
    if (typeof showToast === 'function') {
      showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
    }
    return;
  }

  // Get selected books
  const selectedBooks = booksSelect ? Array.from(booksSelect.selectedOptions).map(opt => opt.value) : [];

  // Disable save button
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
  }

  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('type', type);
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);
    formData.append('books', JSON.stringify(selectedBooks));
    formData.append('status', 'true'); // Default to active

    // Add new image files
    newImageFiles.forEach(file => {
      formData.append('imageFile', file);
    });

    if (editingId) {
      // Update existing campaign
      await window.AdminServices.updateCampaign(editingId, formData);
      if (typeof showToast === 'function') {
        showToast('Cập nhật chiến dịch thành công', 'success');
      }
    } else {
      // Create new campaign
      const result = await window.AdminServices.createCampaign(formData);
      if (typeof showToast === 'function') {
        showToast('Tạo chiến dịch thành công', 'success');
      }
    }

    // Reload campaigns
    await loadCampaigns();
    hideCampaignModal();
  } catch (error) {
    console.error('❌ Error saving campaign:', error);
    if (typeof showToast === 'function') {
      showToast('Không thể lưu chiến dịch: ' + error.message, 'error');
    }
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save"></i> Lưu';
    }
  }
}

async function loadBooksForSearch(selectedIds = []) {
  try {
    if (!window.allBooks || window.allBooks.length === 0) {
      await loadBooks();
    }
    
    const books = window.allBooks || [];
    const select = document.getElementById('campaign-books');
    if (select) {
      select.innerHTML = '';
      books.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b._id;
        opt.textContent = b.title || b.name || 'Không tên';
        if (selectedIds.includes(b._id)) opt.selected = true;
        select.appendChild(opt);
      });
    }
    
    renderBookSearchList(books, selectedIds);
  } catch (err) {
    console.error('❌ Lỗi tải sách:', err);
    if (typeof showToast === 'function') {
      showToast('Không thể tải danh sách sách: ' + err.message, 'error');
    }
  }
}

function renderBookSearchList(books, selectedIds = []) {
  const listDiv = document.getElementById('book-search-list');
  if (!listDiv) return;

  listDiv.innerHTML = '';
  
  if (books.length === 0) {
    listDiv.innerHTML = '<div style="text-align: center; padding: 2rem; color: #6b7280;">Không tìm thấy sách nào</div>';
    return;
  }

  books.forEach(book => {
    const isSelected = selectedIds.includes(book._id);
    const div = document.createElement('div');
    div.style.cssText = `
      border: 1px solid ${isSelected ? '#4f46e5' : '#e5e7eb'}; 
      border-radius: 8px; 
      padding: 12px; 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      background: ${isSelected ? '#eef2ff' : '#fff'};
      cursor: pointer;
      transition: all 0.2s;
    `;
    
    div.innerHTML = `
      <img src="${book.thumbnail && book.thumbnail !== 'undefined' ? book.thumbnail : 'https://server-shelf-stacker-w1ds.onrender.com/assets/images/default-thumbnail.png'}" 
           style="width: 70px; height: 90px; object-fit: cover; margin-bottom: 8px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <div style="font-weight: 600; font-size: 13px; text-align: center; margin-bottom: 4px; color: #1f2937;">${escapeHtml(book.title || book.name || 'Không tên')}</div>
      <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px; text-align: center;">${escapeHtml(book.author || '')}</div>
      <div style="color: #e53935; font-size: 13px; font-weight: 600;">${book.price ? Number(book.price).toLocaleString('vi-VN') + '₫' : 'N/A'}</div>
      <button class="btn-select-book" data-id="${book._id}" 
              style="margin-top: 8px; background: ${isSelected ? '#dc2626' : '#4f46e5'}; color: #fff; border: none; border-radius: 4px; padding: 4px 12px; cursor: pointer; font-size: 12px; font-weight: 500;">
        ${isSelected ? 'Bỏ chọn' : 'Chọn'}
      </button>
    `;
    
    listDiv.appendChild(div);
  });

  // Attach click handlers
  listDiv.querySelectorAll('.btn-select-book').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const id = this.getAttribute('data-id');
      const select = document.getElementById('campaign-books');
      if (!select) return;

      const option = Array.from(select.options).find(opt => opt.value === id);
      if (option) {
        option.selected = !option.selected;
        const selected = Array.from(select.options).filter(opt => opt.selected).map(opt => opt.value);
        renderBookSearchList(books, selected);
        
        // Update selected books count
        const selectedBooksCount = document.getElementById('selected-books-count');
        if (selectedBooksCount) {
          selectedBooksCount.textContent = `Đã chọn: ${selected.length} sách`;
        }
      }
    });
  });
}

async function loadBooks() {
  try {
    if (!window.AdminServices) {
      throw new Error('AdminServices is not loaded');
    }
    const response = await window.AdminServices.getBooks({ limit: 1000 });
    window.allBooks = Array.isArray(response) ? response : (response.data || response.books || []);
    console.log('📚 Loaded books:', window.allBooks.length);
    
    // Populate select element
    const select = document.getElementById('campaign-books');
    if (select) {
      select.innerHTML = '';
      window.allBooks.forEach(book => {
        const option = document.createElement('option');
        option.value = book._id;
        option.textContent = book.title || book.name || 'Không tên';
        select.appendChild(option);
      });
    }
  } catch (err) {
    console.error('❌ Không thể tải danh sách sách:', err);
    window.allBooks = [];
    if (typeof showToast === 'function') {
      showToast('Không thể tải danh sách sách: ' + err.message, 'error');
    }
  }
}

function getSelectedBooks() {
  const options = document.getElementById('campaign-books').selectedOptions;
  return Array.from(options).map(opt => opt.value);
}

function renderImagePreviews() {
  const container = document.getElementById('image-preview-container');
  if (!container) {
    console.error('❌ Không tìm thấy container #image-preview-container');
    return;
  }
  container.innerHTML = '';

  // Hiển thị các ảnh đã tồn tại (từ Cloudinary)
  existingImages.forEach((url, index) => {
    if (!deletedImageUrls.includes(url)) {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        position: relative;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        background: #f9fafb;
      `;
      wrapper.innerHTML = `
        <img src="${url}" style="width: 100%; height: 150px; object-fit: cover; display: block;" />
        <div style="position: absolute; top: 4px; right: 4px; display: flex; gap: 4px;">
          <button type="button" class="btn btn-sm btn-danger" data-url="${url}" data-action="delete" 
                  style="padding: 4px 8px; min-width: auto;" title="Xóa hình ảnh">
            <i class="fas fa-trash" style="font-size: 12px;"></i>
          </button>
        </div>
      `;
      container.appendChild(wrapper);
    }
  });

  // Hiển thị các ảnh mới (chưa upload)
  newImageFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        position: relative;
        border: 2px solid #4f46e5;
        border-radius: 8px;
        overflow: hidden;
        background: #f9fafb;
      `;
      wrapper.innerHTML = `
        <img src="${e.target.result}" style="width: 100%; height: 150px; object-fit: cover; display: block;" />
        <div style="position: absolute; top: 4px; right: 4px;">
          <button type="button" class="btn btn-sm btn-danger" data-index="${index}" data-action="remove" 
                  style="padding: 4px 8px; min-width: auto;" title="Xóa hình ảnh">
            <i class="fas fa-times" style="font-size: 12px;"></i>
          </button>
        </div>
        <div style="position: absolute; bottom: 4px; left: 4px; background: rgba(79, 70, 229, 0.9); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">
          Mới
        </div>
      `;
      container.appendChild(wrapper);
    };
    reader.readAsDataURL(file);
  });

  // Attach event listeners
  setTimeout(() => {
    container.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', function() {
        const url = this.getAttribute('data-url');
        if (url && confirm('Bạn có chắc muốn xóa hình ảnh này?')) {
          deletedImageUrls.push(url);
          existingImages = existingImages.filter(img => img !== url);
          renderImagePreviews();
        }
      });
    });

    container.querySelectorAll('[data-action="remove"]').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        if (!isNaN(index) && confirm('Bạn có chắc muốn xóa hình ảnh này?')) {
          newImageFiles.splice(index, 1);
          renderImagePreviews();
        }
      });
    });
  }, 100);
}

function attachEditButtonListeners() {
  // Xóa các sự kiện cũ để tránh trùng lặp
  document.querySelectorAll('.edit-image-btn').forEach(btn => {
    btn.removeEventListener('click', btn._clickHandler); // Xóa handler cũ nếu có
  });
  document.querySelectorAll('.replace-image-btn').forEach(btn => {
    btn.removeEventListener('click', btn._clickHandler); // Xóa handler cũ nếu có
  });

  // Gắn sự kiện cho nút xóa ảnh
  document.querySelectorAll('.edit-image-btn').forEach(btn => {
    const handler = async function() {
      const url = this.getAttribute('data-url');
      const index = this.getAttribute('data-index');

      if (url) {
        // Xóa ảnh trên Cloudinary
        const campaignId = editingId;
        if (!campaignId) {
          showNotification('error', 'Không tìm thấy campaignId để xóa ảnh!');
          return;
        }
        try {
          const res = await fetch(`https://server-shelf-stacker-w1ds.onrender.com/api/campaigns/clear-single-image/${campaignId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imageUrl: url })
          });
          const data = await res.json();
          if (data.success) {
            // Cập nhật mảng existingImages
            existingImages = existingImages.filter(img => img !== url);
            deletedImageUrls.push(url); // Thêm vào danh sách đã xóa
            showNotification('success', 'Đã xóa ảnh thành công trên Cloudinary!');
            renderImagePreviews(); // Làm mới giao diện
          } else {
            showNotification('error', data.message || 'Xóa ảnh thất bại!');
          }
        } catch (err) {
          showNotification('error', 'Lỗi khi xóa ảnh: ' + err.message);
        }
      } else if (index !== null) {
        // Xóa ảnh mới (chưa upload)
        newImageFiles.splice(parseInt(index), 1);
        showNotification('success', 'Đã xóa ảnh mới thành công!');
        renderImagePreviews(); // Làm mới giao diện
      }
    };
    btn._clickHandler = handler; // Lưu handler để có thể xóa sau này
    btn.addEventListener('click', handler, { once: true });
  });

  // Gắn sự kiện cho nút thay thế ảnh
  document.querySelectorAll('.replace-image-btn').forEach(btn => {
    const handler = function() {
      const url = this.getAttribute('data-url');
      const index = this.getAttribute('data-index');
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async function(e) {
        const file = e.target.files[0];
        if (file) {
          if (url) {
            const campaignId = editingId;
            if (!campaignId) {
              showNotification('error', 'Không tìm thấy campaignId để thay thế ảnh!');
              return;
            }
            try {
              const res = await fetch(`https://server-shelf-stacker-w1ds.onrender.com/api/campaigns/clear-single-image/${campaignId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': token,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ imageUrl: url })
              });
              const data = await res.json();
              if (data.success) {
                existingImages = existingImages.filter(img => img !== url);
                deletedImageUrls.push(url);
                newImageFiles.push(file);
                showNotification('success', 'Đã thay thế ảnh thành công!');
                renderImagePreviews();
              } else {
                showNotification('error', data.message || 'Thay thế ảnh thất bại!');
              }
            } catch (err) {
              showNotification('error', 'Lỗi khi thay thế ảnh: ' + err.message);
            }
          } else if (index !== null) {
            newImageFiles[parseInt(index)] = file;
            showNotification('success', 'Đã thay thế ảnh mới thành công!');
            renderImagePreviews();
          }
        } else {
          showNotification('error', 'Vui lòng chọn một hình ảnh để thay thế!');
        }
      };
      input.click();
    };
    btn._clickHandler = handler; // Lưu handler để có thể xóa sau này
    btn.addEventListener('click', handler, { once: true });
  });
}

function showNotification(type, message) {
  const notification = document.createElement('div');
  notification.id = `notification-${Date.now()}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#28a745' : '#dc3545'};
    color: white;
    padding: 15px 25px;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Segoe UI', sans-serif;
    animation: slideIn 0.3s ease, fadeOut 0.5s ease 2.5s forwards;
  `;

  const icon = document.createElement('span');
  icon.innerHTML = type === 'success' 
    ? '<i class="fa fa-check-circle" style="font-size: 18px;"></i>' 
    : '<i class="fa fa-exclamation-circle" style="font-size: 18px;"></i>';
  notification.appendChild(icon);

  const text = document.createElement('span');
  text.innerHTML = message;
  notification.appendChild(text);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 16px;
    cursor: pointer;
    margin-left: 15px;
    padding: 0 5px;
  `;
  closeBtn.onclick = () => {
    notification.style.display = 'none';
    document.body.removeChild(notification);
  };
  notification.appendChild(closeBtn);

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 500);
  }, 2500);
}

function toggleNotificationDropdown() {
  const dropdown = document.getElementById('notificationDropdown');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
}

const notificationBell = document.querySelector('.notification-bell');
if (notificationBell) {
  notificationBell.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleNotificationDropdown();
  });
}

document.addEventListener('click', function (event) {
  const dropdown = document.getElementById('notificationDropdown');
  if (dropdown && dropdown.classList.contains('active')) {
    if (!event.target.closest('.notification-bell')) {
      dropdown.classList.remove('active');
    }
  }
});

function goToOrderDetails(orderId) {
  window.location.href = 'danhmucdonhang';
}

function renderNotifications(orders) {
  const dropdown = document.getElementById('notificationDropdown');
  const badge = document.getElementById('notificationBadge');
  if (!dropdown || !badge) return;

  const filteredOrders = orders.filter(order =>
    order.order_status === 'Pending' || order.order_status === 'Processing'
  );

  badge.textContent = filteredOrders.length;
  badge.style.display = filteredOrders.length > 0 ? 'inline-block' : 'none';

  if (!filteredOrders.length) {
    dropdown.innerHTML = '<div style="padding: 16px; text-align: center; color: #888;">Không có đơn hàng mới cần xác nhận.</div>';
  } else {
    dropdown.innerHTML = filteredOrders.map(order => {
      const code = order.order_id || order._id || 'Không rõ';
      const statusKey = order.order_status;
      const status = statusKey === 'Pending'
        ? 'Đang chờ xác nhận'
        : statusKey === 'Processing'
          ? 'Đang xử lý'
          : 'Chưa rõ';
      const createdAt = order.order_date || order.createdAt || '';
      const formattedDate = createdAt
        ? new Date(createdAt).toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        : 'Chưa rõ';

      return `
        <div class="notification-item" data-id="${order._id}" data-status="${statusKey}">
          <div>
            <i class="fas fa-box-open" style="margin-right:6px;"></i>
            Đơn hàng có mã <b>${code}</b>, thời gian <b>${formattedDate}</b>, trạng thái <b>${status}</b> cần được xác nhận!
          </div>
        </div>
      `;
    }).join('');

    setTimeout(() => {
      document.querySelectorAll('.notification-item').forEach(item => {
        item.onclick = function() {
          const orderId = this.getAttribute('data-id');
          goToOrderDetails(orderId);
          dropdown.classList.remove('active');
        };
      });
    }, 0);
  }
}

async function fetchOrdersForNotifications() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    showNotification('error', 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
    return;
  }

  try {
    const response = await fetch(orderAPI, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Không thể lấy dữ liệu đơn hàng');
    }

    const ordersData = await response.json();
    const orders = ordersData.orders || [];
    renderNotifications(orders);

    const pendingOrders = orders.filter(order =>
      order.order_status === 'Pending' || order.order_status === 'Processing'
    );
    if (pendingOrders.length > 0) {
      pendingOrders.sort((a, b) => new Date(b.order_date || b.createdAt) - new Date(a.order_date || a.order_date));
      const newestOrder = pendingOrders[0];
      if (lastNotifiedOrderId !== newestOrder._id) {
        lastNotifiedOrderId = newestOrder._id;
        const code = newestOrder.order_id || newestOrder._id || 'Không rõ';
        const status = newestOrder.order_status === 'Pending'
          ? 'Đang chờ xác nhận'
          : newestOrder.order_status === 'Processing'
            ? 'Đang xử lý'
            : 'Chưa rõ';
        const createdAt = newestOrder.order_date || newestOrder.createdAt || '';
        const formattedDate = createdAt
          ? new Date(createdAt).toLocaleString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })
          : 'Chưa rõ';

        showNotification(
          'success',
          `<span style="display:flex;align-items:center;gap:8px;">
            <i class="fas fa-box-open" style="font-size:22px;color:#fff;"></i>
            <span>
              Đơn hàng mới!<br>
              Mã đơn <b>${code}</b>, thời gian <b>${formattedDate}</b>, trạng thái <b>${status}</b> cần được xác nhận!
            </span>
          </span>`
        );
      }
    }
  } catch (error) {
    showNotification('error', 'Lỗi khi tải dữ liệu đơn hàng: ' + error.message);
  }
}

// Các handler cũ dùng id kiểu 'close-campaign-modal', 'campaign-image',
// 'save-campaign-btn', 'update-campaign-btn' đã được thay thế bởi
// cơ chế mới trong setupEventListeners + saveCampaign.
// Để tránh lỗi phần tử null và trùng logic, khối handler legacy đã được loại bỏ.

async function editCampaign(id) {
  try {
    if (typeof showLoading === 'function') {
      showLoading();
    }

    const c = await window.AdminServices.getCampaign(id);
    editingId = id;

    const nameInput = document.getElementById('campaign-name');
    const descInput = document.getElementById('campaign-desc');
    const typeSelect = document.getElementById('campaign-type');
    const startDateInput = document.getElementById('campaign-start-date');
    const endDateInput = document.getElementById('campaign-end-date');
    const booksSelect = document.getElementById('campaign-books');

    if (nameInput) nameInput.value = c.name || '';
    if (descInput) descInput.value = c.description || '';
    if (typeSelect) typeSelect.value = c.type || '';
    if (startDateInput) startDateInput.value = c.startDate ? c.startDate.split('T')[0] : '';
    if (endDateInput) endDateInput.value = c.endDate ? c.endDate.split('T')[0] : '';

    // Load books and select them
    const selectedBooks = Array.isArray(c.books) ? c.books.map(b => typeof b === 'object' ? b._id : b) : [];
    await loadBooksForSearch(selectedBooks);

    // Select books in select element
    if (booksSelect) {
      Array.from(booksSelect.options).forEach(opt => {
        opt.selected = selectedBooks.includes(opt.value);
      });
      const selectedBooksCount = document.getElementById('selected-books-count');
      if (selectedBooksCount) {
        selectedBooksCount.textContent = `Đã chọn: ${selectedBooks.length} sách`;
      }
    }

    // Load images
    existingImages = Array.isArray(c.image) ? c.image : (c.image ? [c.image] : []);
    newImageFiles = [];
    deletedImageUrls = [];
    renderImagePreviews();

    showCampaignModal();
  } catch (err) {
    console.error('❌ Không tải được dữ liệu chiến dịch:', err);
    if (typeof showToast === 'function') {
      showToast('Không thể chỉnh sửa chiến dịch này: ' + err.message, 'error');
    }
  } finally {
    if (typeof hideLoading === 'function') {
      hideLoading();
    }
  }
}

// Khối handler legacy cho nút 'update-campaign-btn' đã bị loại bỏ vì
// giao diện mới không còn sử dụng các id này nữa.

async function deleteCampaign(id) {
  try {
    const campaign = await AdminServices.getCampaign(id);

    showConfirmDeleteCampaignDialog();

    const observer = new MutationObserver((mutations, obs) => {
      const dialog = document.getElementById('dialog-confirm-delete-campaign');
      const cancelBtn = document.getElementById('cancel-delete-campaign-btn');
      const confirmBtn = document.getElementById('confirm-delete-campaign-btn');
      if (dialog && cancelBtn && confirmBtn) {
        obs.disconnect();
        cancelBtn.addEventListener('click', () => dialog.remove());
        confirmBtn.addEventListener('click', async () => {
          dialog.remove();
          try {
            await AdminServices.deleteCampaign(id);

            // Update books to remove campaign reference
            if (Array.isArray(campaign.books) && campaign.books.length > 0) {
              await Promise.all(campaign.books.map(book => {
                const bookId = typeof book === 'object' ? book._id : book;
                return AdminServices.updateBook(bookId, { campaigns: [] });
              }));
            }

            showSuccessDeleteCampaignDialog();
            loadCampaigns();
          } catch (err) {
            console.error('❌ Lỗi khi xóa chiến dịch:', err);
            showNotification('error', 'Lỗi khi xóa chiến dịch: ' + err.message);
          }
        }, { once: true });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  } catch (err) {
    console.error('❌ Lỗi khi tải dữ liệu để xóa:', err);
    showNotification('error', 'Không thể xóa chiến dịch: ' + err.message);
  }
}

// Export deleteCampaign function
window.deleteCampaign = deleteCampaign;

// View campaign images
async function viewCampaignImages(campaignId, campaignName, imagesJson) {
  const images = typeof imagesJson === 'string' ? JSON.parse(imagesJson.replace(/&quot;/g, '"')) : imagesJson;
  if (!images || images.length === 0) {
    showNotification('info', 'Chiến dịch này chưa có hình ảnh');
    return;
  }

  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.9); z-index: 10000; display: flex;
    flex-direction: column; align-items: center; justify-content: center;
    padding: 20px; overflow-y: auto;
  `;
  
  modal.innerHTML = `
    <div style="background: white; border-radius: 8px; padding: 20px; max-width: 90%; max-height: 90%; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #333;">Hình ảnh chiến dịch: ${campaignName}</h2>
        <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" 
                style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 18px;">
          ✕
        </button>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
        ${images.map((img, index) => `
          <div style="position: relative;">
            <img src="${img}" 
                 style="width: 100%; height: 250px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 2px solid #ddd;"
                 onclick="window.open('${img}', '_blank')"
                 onmouseover="this.style.borderColor='#007bff'"
                 onmouseout="this.style.borderColor='#ddd'"
                 alt="Hình ảnh ${index + 1}">
            <div style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
              ${index + 1}/${images.length}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close on click outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// View campaign books
async function viewCampaignBooks(campaignId, campaignName, bookIdsJson) {
  const bookIds = typeof bookIdsJson === 'string' ? JSON.parse(bookIdsJson.replace(/&quot;/g, '"')) : bookIdsJson;
  if (!bookIds || bookIds.length === 0) {
    showNotification('info', 'Chiến dịch này chưa có sách nào');
    return;
  }

  try {
    // Load book details
    const allBooks = await AdminServices.getBooks({ limit: 1000 });
    const books = allBooks.filter(book => bookIds.includes(book._id));
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.9); z-index: 10000; display: flex;
      flex-direction: column; align-items: center; justify-content: center;
      padding: 20px; overflow-y: auto;
    `;
    
    modal.innerHTML = `
      <div style="background: white; border-radius: 8px; padding: 20px; max-width: 90%; max-height: 90%; overflow-y: auto; width: 1000px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #333;">Sách trong chiến dịch: ${campaignName}</h2>
          <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" 
                  style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 18px;">
            ✕
          </button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px;">
          ${books.map(book => `
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 10px; text-align: center; background: #f9f9f9;">
              <img src="${book.thumbnail || book.cover_images?.[0] || 'https://server-shelf-stacker-w1ds.onrender.com/assets/images/default-thumbnail.png'}" 
                   style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px; margin-bottom: 10px; cursor: pointer;"
                   onclick="window.open('${book.thumbnail || book.cover_images?.[0] || ''}', '_blank')"
                   alt="${(book.title || 'N/A').replace(/"/g, '&quot;')}">
              <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px; color: #333;">
                ${book.title || 'N/A'}
              </div>
              <div style="font-size: 12px; color: #666; margin-bottom: 5px;">
                ${book.author || 'N/A'}
              </div>
              <div style="font-size: 14px; font-weight: bold; color: #e53935;">
                ${book.price ? Number(book.price).toLocaleString('vi-VN') + '₫' : 'N/A'}
              </div>
            </div>
          `).join('')}
        </div>
        <div style="margin-top: 20px; text-align: center; color: #666;">
          Tổng: ${books.length} sách
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on click outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  } catch (error) {
    console.error('❌ Lỗi tải sách:', error);
    showNotification('error', 'Không thể tải danh sách sách: ' + error.message);
  }
}

// View campaign details
async function viewCampaignDetails(campaignId) {
  try {
    const campaign = await AdminServices.getCampaign(campaignId);
    const images = Array.isArray(campaign.image) ? campaign.image : (campaign.image ? [campaign.image] : []);
    const books = Array.isArray(campaign.books) ? campaign.books : [];
    
    // Load book details if there are books
    let bookDetails = [];
    if (books.length > 0) {
      const allBooks = await AdminServices.getBooks({ limit: 1000 });
      bookDetails = allBooks.filter(book => books.includes(book._id));
    }
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.9); z-index: 10000; display: flex;
      flex-direction: column; align-items: center; justify-content: center;
      padding: 20px; overflow-y: auto;
    `;
    
    const typeDisplay = {
      'promotion': 'Khuyến mãi',
      'event': 'Sự kiện',
      'advertisement': 'Quảng cáo',
      'special_offer': 'Ưu đãi đặc biệt',
      'community_event': 'Sự kiện cộng đồng'
    }[campaign.type] || campaign.type;
    
    modal.innerHTML = `
      <div style="background: white; border-radius: 8px; padding: 30px; max-width: 90%; max-height: 90%; overflow-y: auto; width: 1200px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #333;">Chi tiết chiến dịch</h2>
          <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" 
                  style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 18px;">
            ✕
          </button>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <h3 style="margin-top: 0; color: #333;">Thông tin cơ bản</h3>
            <p><strong>Tên:</strong> ${campaign.name || 'N/A'}</p>
            <p><strong>Loại:</strong> ${typeDisplay}</p>
            <p><strong>Ngày bắt đầu:</strong> ${formatDate(campaign.startDate)}</p>
            <p><strong>Ngày kết thúc:</strong> ${formatDate(campaign.endDate)}</p>
            <p><strong>Mô tả:</strong> ${campaign.description || 'N/A'}</p>
          </div>
          <div>
            <h3 style="margin-top: 0; color: #333;">Thống kê</h3>
            <p><strong>Số hình ảnh:</strong> ${images.length}</p>
            <p><strong>Số sách:</strong> ${books.length}</p>
          </div>
        </div>
        
        ${images.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #333;">Hình ảnh</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px;">
              ${images.map((img, index) => `
                <img src="${img}" 
                     style="width: 100%; height: 150px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 2px solid #ddd;"
                     onclick="window.open('${img}', '_blank')"
                     alt="Hình ảnh ${index + 1}">
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${bookDetails.length > 0 ? `
          <div>
            <h3 style="color: #333;">Sách trong chiến dịch (${bookDetails.length})</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; max-height: 400px; overflow-y: auto;">
              ${bookDetails.map(book => `
                <div style="border: 1px solid #ddd; border-radius: 4px; padding: 8px; text-align: center;">
                  <img src="${book.thumbnail || book.cover_images?.[0] || 'https://server-shelf-stacker-w1ds.onrender.com/assets/images/default-thumbnail.png'}" 
                       style="width: 100%; height: 180px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;">
                  <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px;">${book.title || 'N/A'}</div>
                  <div style="font-size: 11px; color: #666;">${book.author || 'N/A'}</div>
                  <div style="font-size: 12px; font-weight: bold; color: #e53935; margin-top: 4px;">
                    ${book.price ? Number(book.price).toLocaleString('vi-VN') + '₫' : 'N/A'}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : '<p>Chưa có sách nào trong chiến dịch này.</p>'}
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on click outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  } catch (error) {
    console.error('❌ Lỗi tải chi tiết chiến dịch:', error);
    showNotification('error', 'Không thể tải chi tiết chiến dịch: ' + error.message);
  }
}

// Export functions
window.viewCampaignImages = viewCampaignImages;
window.viewCampaignBooks = viewCampaignBooks;
window.viewCampaignDetails = viewCampaignDetails;

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
  const pathname = window.location.pathname;
  console.log('📢 Campaigns page - pathname:', pathname);
  
  // Check if we're on campaigns page
  if (pathname === '/campaigns' || pathname.includes('/campaigns') || pathname.endsWith('campaigns.html')) {
    console.log('📢 Initializing campaigns page...');
    try {
      await waitForAdminServices();
      console.log('📢 AdminServices ready, initializing page...');
      initCampaignsPage();
    } catch (error) {
      console.error('❌ Error waiting for AdminServices:', error);
      if (typeof showToast === 'function') {
        showToast('Không thể tải AdminServices. Vui lòng reload trang.', 'error');
      }
    }
  } else {
    console.log('📢 Not on campaigns page, skipping initialization');
  }
});

function initCampaignsPage() {
  console.log('📢 initCampaignsPage called');
  setupEventListeners();
  setupBookSearch();
  console.log('📢 Event listeners setup, loading campaigns...');
  loadCampaigns();
  loadBooks();
}

// Thiết lập tìm kiếm & chọn sách cho chiến dịch
function setupBookSearch() {
  const toggleBtn = document.getElementById('toggle-book-list');
  const searchWrap = document.getElementById('book-search-wrap');
  const searchInput = document.getElementById('book-search-input');

  if (toggleBtn && searchWrap) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = searchWrap.style.display === 'none' || !searchWrap.style.display;
      searchWrap.style.display = isHidden ? 'block' : 'none';
      if (isHidden) {
        // Khi mở panel thì reload danh sách sách gợi ý
        loadBooksForSearch();
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const keyword = searchInput.value.trim().toLowerCase();
      const select = document.getElementById('campaign-books');
      if (!window.allBooks || !Array.isArray(window.allBooks)) return;

      const selectedIds = select
        ? Array.from(select.options).filter(o => o.selected).map(o => o.value)
        : [];

      const filtered = keyword
        ? window.allBooks.filter(b => {
            const title = (b.title || b.name || '').toLowerCase();
            const author = (b.author || '').toLowerCase();
            return title.includes(keyword) || author.includes(keyword);
          })
        : window.allBooks;

      renderBookSearchList(filtered, selectedIds);
    });
  }
}

// Thiết lập upload & preview hình ảnh chiến dịch
function setupImageUpload() {
  const imagesInput = document.getElementById('campaign-images');
  const previewContainer = document.getElementById('image-preview-container');

  if (!imagesInput || !previewContainer) return;

  imagesInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Gộp vào mảng newImageFiles để dùng chung với renderImagePreviews()
    newImageFiles = newImageFiles.concat(files);
    renderImagePreviews();

    // Reset input để có thể chọn lại cùng một file nếu muốn
    imagesInput.value = '';
  });
}

function showSuccessUpdateCampaignDialog() {
  fetch('/components/dialogs/success-update-campaign.html')
    .then(res => res.text())
    .then(html => document.body.insertAdjacentHTML('beforeend', html));
}

function showSuccessDeleteCampaignDialog() {
  fetch('/components/dialogs/success-delete-campaign.html')
    .then(res => res.text())
    .then(html => document.body.insertAdjacentHTML('beforeend', html));
}

function showNotFoundCampaignDialog() {
  fetch('/components/dialogs/not-found-campaign.html')
    .then(res => res.text())
    .then(html => document.body.insertAdjacentHTML('beforeend', html));
}

function showConfirmDeleteCampaignDialog() {
  fetch('/components/dialogs/confirm-delete-campaign.html')
    .then(res => res.text())
    .then(html => document.body.insertAdjacentHTML('beforeend', html));
}

function showSuccessAddCampaignDialog() {
  fetch('/components/dialogs/success-add-campaign.html')
    .then(res => res.text())
    .then(html => document.body.insertAdjacentHTML('beforeend', html));
}

// Ghi đè window.onload gây lỗi (uploadDialog null) và xung đột với các trang khác
// đã được loại bỏ. Logic avatar / upload sẽ được khởi tạo an toàn ở nơi khác nếu cần.

function toggleMenu(id) {
  const el = document.getElementById(id);
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

// Các handler sidebar/avatar/upload cũ dùng các ID không tồn tại trên trang campaigns
// đã được loại bỏ để tránh lỗi null.onclick và không ảnh hưởng đến phần khác của admin.

// Ngăn submit mặc định nếu form tồn tại (đã có saveCampaign xử lý)
const campaignFormElement = document.getElementById('campaign-form');
if (campaignFormElement) {
  campaignFormElement.addEventListener('submit', function(e) {
    e.preventDefault();
  });
}