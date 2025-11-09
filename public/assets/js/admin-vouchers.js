/**
 * Admin Vouchers Management JavaScript
 */

// Helper: Đợi AdminServices sẵn sàng
function waitForAdminServices(maxWait = 5000) {
    return new Promise((resolve, reject) => {
        if (window.AdminServices && typeof window.AdminServices.getVouchers === 'function') {
            resolve(window.AdminServices);
            return;
        }
        
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (window.AdminServices && typeof window.AdminServices.getVouchers === 'function') {
                clearInterval(checkInterval);
                resolve(window.AdminServices);
            } else if (Date.now() - startTime > maxWait) {
                clearInterval(checkInterval);
                reject(new Error('AdminServices không sẵn sàng sau ' + maxWait + 'ms'));
            }
        }, 100);
    });
}

let currentPage = 1;
let pageSize = 10; // Giới hạn 10 vouchers mỗi trang
let totalPages = 1;
let filters = { search: '', voucher_type: '', status: '' };

document.addEventListener('DOMContentLoaded', async function() {
    const pathname = window.location.pathname;
    console.log('🎫 Vouchers page - pathname:', pathname);
    
    if (pathname === '/vouchers' || pathname.includes('/vouchers')) {
        console.log('🎫 Initializing vouchers page...');
        try {
            await waitForAdminServices();
            console.log('🎫 AdminServices ready, initializing page...');
            initVouchersPage();
        } catch (error) {
            console.error('❌ Error waiting for AdminServices:', error);
            if (typeof showToast === 'function') {
                showToast('Không thể tải AdminServices. Vui lòng reload trang.', 'error');
            }
        }
    }
});

function initVouchersPage() {
    setupEventListeners();
    loadVouchers();
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filters.search = e.target.value;
                currentPage = 1;
                loadVouchers();
            }, 500);
        });
    }

    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilter');
    if (typeFilter) typeFilter.addEventListener('change', (e) => { filters.voucher_type = e.target.value; currentPage = 1; loadVouchers(); });
    if (statusFilter) statusFilter.addEventListener('change', (e) => { filters.status = e.target.value; currentPage = 1; loadVouchers(); });

    const addVoucherBtn = document.getElementById('addVoucherBtn');
    if (addVoucherBtn) {
        addVoucherBtn.addEventListener('click', () => {
            const form = AdminCRUDForms.createVoucherForm();
            const modal = AdminUIComponents.createModal({
                title: 'Thêm voucher mới',
                content: form.outerHTML,
                size: 'large',
                buttons: [
                    {
                        text: 'Hủy',
                        class: 'btn-secondary',
                        onClick: 'this.closest(\'.admin-modal-overlay\').remove();'
                    },
                    {
                        text: 'Lưu',
                        class: 'btn-primary',
                        icon: 'fas fa-save',
                        onClick: 'this.closest(\'form\')?.requestSubmit();'
                    }
                ]
            });
            
            const formElement = modal.querySelector('form');
            if (formElement) {
                // Handle voucher type change
                const typeSelect = formElement.querySelector('[name="voucher_type"]');
                if (typeSelect) {
                    typeSelect.addEventListener('change', () => {
                        modal.remove();
                        addVoucherBtn.click();
                    });
                }
                
                formElement.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(formElement);
                    const data = {};
                    
                    // Extract all form values
                    for (let [key, value] of formData.entries()) {
                        // Skip empty values (except for optional fields)
                        if (value === '' && !['usage_limit', 'max_discount_value', 'description'].includes(key)) {
                            continue;
                        }
                        data[key] = value;
                    }
                    
                    // Convert data types
                    if (data.min_order_value) {
                        const val = parseFloat(data.min_order_value);
                        if (!isNaN(val)) data.min_order_value = val;
                    }
                    if (data.usage_limit) {
                        const val = parseInt(data.usage_limit);
                        if (!isNaN(val)) data.usage_limit = val;
                    }
                    if (data.max_per_user) {
                        const val = parseInt(data.max_per_user);
                        if (!isNaN(val)) data.max_per_user = val;
                    }
                    
                    if (data.voucher_type === 'discount') {
                        if (data.discount_value) {
                            const val = parseFloat(data.discount_value);
                            if (!isNaN(val)) data.discount_value = val;
                        }
                        if (data.max_discount_value) {
                            const val = parseFloat(data.max_discount_value);
                            if (!isNaN(val)) data.max_discount_value = val;
                        }
                    } else {
                        if (data.shipping_discount) {
                            const val = parseFloat(data.shipping_discount);
                            if (!isNaN(val)) data.shipping_discount = val;
                        }
                    }
                    
                    // Convert datetime to ISO string
                    if (data.start_date) {
                        try {
                            data.start_date = new Date(data.start_date).toISOString();
                        } catch (e) {
                            console.error('Invalid start_date:', data.start_date);
                        }
                    }
                    if (data.end_date) {
                        try {
                            data.end_date = new Date(data.end_date).toISOString();
                        } catch (e) {
                            console.error('Invalid end_date:', data.end_date);
                        }
                    }
                    
                    // Debug: Log data before sending
                    console.log('🎫 Creating voucher with data:', data);
                    
                    // Disable save button
                    const saveBtn = modal.querySelector('.btn-primary');
                    if (saveBtn) {
                        saveBtn.disabled = true;
                        saveBtn.textContent = 'Đang lưu...';
                        saveBtn.style.opacity = '0.6';
                    }
                    
                    try {
                        AdminUIComponents.showLoading('Đang lưu...');
                        const result = await window.AdminServices.createVoucher(data);
                        console.log('🎫 Voucher created successfully:', result);
                        showToast('✅ Tạo voucher thành công', 'success');
                        modal.remove();
                        loadVouchers();
                    } catch (error) {
                        console.error('❌ Error creating voucher:', error);
                        console.error('Error details:', {
                            message: error.message,
                            stack: error.stack,
                            data: data
                        });
                        showToast('❌ ' + (error.message || 'Không thể tạo voucher'), 'error');
                    } finally {
                        // Re-enable button
                        if (saveBtn && !modal.parentNode) {
                            // Modal was removed
                        } else if (saveBtn) {
                            saveBtn.disabled = false;
                            saveBtn.textContent = 'Lưu';
                            saveBtn.style.opacity = '1';
                        }
                        AdminUIComponents.hideLoading();
                    }
                });
            }
        });
    }

    const trashBtn = document.getElementById('trashBtn');
    if (trashBtn) trashBtn.addEventListener('click', () => window.location.href = '/vouchers-trash');

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', () => loadVouchers());

    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    if (prevPage) prevPage.addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadVouchers(); } });
    if (nextPage) nextPage.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; loadVouchers(); } });
}

async function loadVouchers() {
    showLoading();
    try {
        if (!window.AdminServices) {
            throw new Error('AdminServices is not loaded');
        }
        
        // Theo tài liệu: GET /api/vouchers hỗ trợ: page, limit, search, voucher_type, status
        // KHÔNG hỗ trợ sortBy/sortOrder (mặc định sort theo createdAt desc)
        const params = { 
            page: currentPage, 
            limit: pageSize 
        };
        if (filters.search) params.search = filters.search;
        if (filters.voucher_type) params.voucher_type = filters.voucher_type;
        if (filters.status) params.status = filters.status;

        console.log('🎫 Loading vouchers with params:', params);
        const response = await window.AdminServices.getVouchers(params);
        console.log('🎫 Vouchers response received:', response);
        console.log('🎫 Response type:', typeof response);
        console.log('🎫 Response keys:', response ? Object.keys(response) : 'null');
        
        // Use helper functions from api-response-helpers.js
        // Ensure helper functions are available (fallback if not loaded)
        const extractDataFunc = window.extractData || function(resp, key) {
            if (!resp) return [];
            if (Array.isArray(resp)) return resp;
            if (key && resp[key]) return Array.isArray(resp[key]) ? resp[key] : [];
            if (resp.data) return Array.isArray(resp.data) ? resp.data : [];
            return [];
        };
        
        const extractPaginationFunc = window.extractPagination || function(resp, defaultPage, defaultLimit) {
            if (!resp) {
                return { page: defaultPage, limit: defaultLimit, total: 0, pages: 1, totalPages: 1 };
            }
            if (resp.pagination) {
                return {
                    page: resp.pagination.page || defaultPage,
                    limit: resp.pagination.limit || defaultLimit,
                    total: resp.pagination.total || 0,
                    pages: resp.pagination.pages || resp.pagination.totalPages || 1,
                    totalPages: resp.pagination.totalPages || resp.pagination.pages || 1
                };
            }
            if (resp.page || resp.total) {
                const total = resp.total || 0;
                const limit = resp.limit || defaultLimit;
                const page = resp.page || defaultPage;
                const pages = resp.pages || resp.totalPages || Math.ceil(total / limit);
                return { page, limit, total, pages, totalPages: pages };
            }
            return { page: defaultPage, limit: defaultLimit, total: 0, pages: 1, totalPages: 1 };
        };
        
        // Extract vouchers và pagination using helper functions
        const vouchers = extractDataFunc(response, 'vouchers');
        const paginationData = extractPaginationFunc(response, currentPage, pageSize);
        
        console.log('🎫 Extracted vouchers:', vouchers.length);
        console.log('🎫 Extracted pagination:', paginationData);
        
        // Cập nhật currentPage từ pagination
        if (paginationData.page) {
            currentPage = paginationData.page;
        }
        
        if (vouchers.length > 0) {
            renderVouchers(vouchers);
            updatePagination(paginationData);
        } else {
            renderVouchers([]);
            updatePagination(paginationData);
        }
    } catch (error) {
        console.error('Error loading vouchers:', error);
        showToast('Không thể tải danh sách vouchers', 'error');
        renderVouchers([]);
    } finally {
        hideLoading();
    }
}

function renderVouchers(vouchers) {
    console.log('🎫 renderVouchers called with', vouchers.length, 'vouchers');
    const tbody = document.getElementById('vouchersTableBody');
    if (!tbody) {
        console.warn('⚠️ vouchersTableBody element not found');
        return;
    }

    if (vouchers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 3rem;"><i class="fas fa-inbox" style="font-size: 3rem; color: #d1d5db;"></i><p style="color: #6b7280; margin-top: 1rem;">Không tìm thấy voucher nào</p></td></tr>`;
        return;
    }

    tbody.innerHTML = vouchers.map(voucher => {
        const now = new Date();
        const endDate = new Date(voucher.end_date);
        const isExpired = endDate < now;
        const isActive = !voucher.is_deleted && !isExpired && new Date(voucher.start_date) <= now;
        
        const statusBg = isActive ? '#d1fae5' : (isExpired ? '#fee2e2' : '#f3f4f6');
        const statusText = isActive ? '#065f46' : (isExpired ? '#991b1b' : '#374151');
        const statusTextLabel = isActive ? 'Hoạt động' : (isExpired ? 'Hết hạn' : 'Không hoạt động');

        return `
            <tr style="transition: background-color 0.2s;">
                <td style="vertical-align: middle;"><strong style="color: #1f2937;">${voucher.voucher_id || voucher.code || 'N/A'}</strong></td>
                <td style="vertical-align: middle;">
                    <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 500; background: ${voucher.voucher_type === 'discount' ? '#dbeafe' : '#e0e7ff'}; color: ${voucher.voucher_type === 'discount' ? '#1e40af' : '#3730a3'};">
                        ${voucher.voucher_type === 'discount' ? 'Giảm giá' : 'Miễn phí ship'}
                    </span>
                </td>
                <td style="vertical-align: middle;"><strong style="color: #dc2626;">${voucher.voucher_type === 'discount' 
                        ? `${voucher.discount_type === 'percentage' ? voucher.discount_value + '%' : window.AdminServices.formatCurrency(voucher.discount_value)}`
                        : window.AdminServices.formatCurrency(voucher.shipping_discount || 0)}</strong></td>
                <td style="vertical-align: middle; color: #4b5563;">${window.AdminServices.formatCurrency(voucher.min_order_value || 0)}</td>
                <td style="vertical-align: middle; color: #4b5563;">${voucher.usage_limit || 'Không giới hạn'}</td>
                <td style="vertical-align: middle; color: #4b5563; font-weight: 500;">${voucher.used_count || 0}</td>
                <td style="vertical-align: middle; color: #4b5563; font-size: 0.9rem;">${window.AdminServices.formatDate(voucher.end_date)}</td>
                <td style="vertical-align: middle;">
                    <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 500; background: ${statusBg}; color: ${statusText};">
                        ${statusTextLabel}
                    </span>
                </td>
                <td style="vertical-align: middle;">
                    <div style="display: flex; gap: 0.5rem; justify-content: center;">
                        <button class="btn btn-sm btn-primary" onclick="viewVoucher('${voucher._id}')" title="Xem chi tiết" style="padding: 0.5rem; min-width: 36px;"><i class="fas fa-eye"></i></button>
                        <button class="btn btn-sm btn-secondary" onclick="editVoucher('${voucher._id}')" title="Chỉnh sửa" style="padding: 0.5rem; min-width: 36px;"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteVoucher('${voucher._id}')" title="Xóa" style="padding: 0.5rem; min-width: 36px;"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    const countEl = document.getElementById('vouchersCount');
    if (countEl) countEl.textContent = `${vouchers.length} vouchers`;
}

function updatePagination(pagination) {
    // Hỗ trợ cả pages và totalPages từ API
    totalPages = pagination.totalPages || pagination.pages || 1;
    
    // Cập nhật currentPage nếu có trong pagination
    if (pagination.page) {
        currentPage = pagination.page;
    }
    const els = {
        currentPage: document.getElementById('currentPage'),
        totalPages: document.getElementById('totalPages'),
        totalItems: document.getElementById('totalItems'),
        pageInfo: document.getElementById('pageInfo'),
        prevBtn: document.getElementById('prevPage'),
        nextBtn: document.getElementById('nextPage')
    };

    if (els.currentPage) els.currentPage.textContent = currentPage;
    if (els.totalPages) els.totalPages.textContent = totalPages;
    if (els.totalItems) els.totalItems.textContent = pagination.total || 0;
    if (els.pageInfo) {
        const start = (currentPage - 1) * pageSize + 1;
        const end = Math.min(currentPage * pageSize, pagination.total || 0);
        els.pageInfo.textContent = `${start}-${end}`;
    }
    if (els.prevBtn) els.prevBtn.disabled = currentPage <= 1;
    if (els.nextBtn) els.nextBtn.disabled = currentPage >= totalPages;
}

async function viewVoucher(id) {
    try {
        console.log('🎫 viewVoucher called with id:', id);
        showLoading();
        const voucher = await window.AdminServices.getVoucher(id);
        console.log('🎫 Voucher details loaded:', voucher);
        hideLoading();
        
        if (!voucher) {
            showToast('Không tìm thấy voucher', 'error');
            return;
        }
        
        // Escape values
        const voucherId = escapeHtml(voucher.voucher_id || voucher.code || 'N/A');
        const voucherType = voucher.voucher_type === 'discount' ? 'Giảm giá' : 'Miễn phí ship';
        const discountValue = voucher.voucher_type === 'discount' 
            ? (voucher.discount_type === 'percentage' ? `${voucher.discount_value}%` : window.AdminServices.formatCurrency(voucher.discount_value))
            : window.AdminServices.formatCurrency(voucher.shipping_discount || 0);
        const minOrder = window.AdminServices.formatCurrency(voucher.min_order_value || 0);
        const usageLimit = voucher.usage_limit || 'Không giới hạn';
        const usedCount = voucher.used_count || 0;
        const startDate = window.AdminServices.formatDate(voucher.start_date);
        const endDate = window.AdminServices.formatDate(voucher.end_date);
        
        const now = new Date();
        const endDateObj = new Date(voucher.end_date);
        const isExpired = endDateObj < now;
        const isActive = !voucher.is_deleted && !isExpired && new Date(voucher.start_date) <= now;
        const statusBadge = isActive 
            ? '<span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 500; background: #d1fae5; color: #065f46;">Hoạt động</span>'
            : (isExpired 
                ? '<span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 500; background: #fee2e2; color: #991b1b;">Hết hạn</span>'
                : '<span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 500; background: #f3f4f6; color: #374151;">Không hoạt động</span>');
        
        const modal = AdminUIComponents.createModal({
            title: 'Chi tiết voucher',
            content: `
                <div style="padding: 1.5rem;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                        <div>
                            <h3 style="margin: 0 0 1rem 0; color: #1f2937; font-size: 1.1rem;">Thông tin voucher</h3>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Mã voucher:</strong> ${voucherId}</p>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Loại:</strong> ${voucherType}</p>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Giá trị:</strong> <span style="color: #dc2626; font-weight: bold;">${discountValue}</span></p>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Đơn tối thiểu:</strong> ${minOrder}</p>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Trạng thái:</strong> ${statusBadge}</p>
                        </div>
                        <div>
                            <h3 style="margin: 0 0 1rem 0; color: #1f2937; font-size: 1.1rem;">Sử dụng</h3>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Giới hạn:</strong> ${usageLimit}</p>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Đã sử dụng:</strong> ${usedCount}</p>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Bắt đầu:</strong> ${startDate}</p>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Kết thúc:</strong> ${endDate}</p>
                        </div>
                    </div>
                </div>
            `,
            size: 'medium',
            buttons: [
                {
                    text: 'Đóng',
                    class: 'btn-secondary',
                    onClick: 'this.closest(\'.admin-modal-overlay\').remove();'
                },
                {
                    text: 'Chỉnh sửa',
                    class: 'btn-primary',
                    icon: 'fas fa-edit',
                    onClick: `this.closest('.admin-modal-overlay').remove(); editVoucher('${id}');`
                }
            ]
        });
        console.log('🎫 Modal created successfully');
    } catch (error) {
        hideLoading();
        console.error('❌ Error loading voucher details:', error);
        showToast('Không thể tải chi tiết voucher: ' + (error.message || 'Unknown error'), 'error');
    }
}

// Helper function để escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function editVoucher(id) {
    try {
        AdminUIComponents.showLoading('Đang tải...');
        const voucher = await window.AdminServices.getVoucher(id);
        AdminUIComponents.hideLoading();
        
        const form = AdminCRUDForms.createVoucherForm(voucher);
        const modal = AdminUIComponents.createModal({
            title: 'Sửa voucher',
            content: form.outerHTML,
            size: 'large',
            buttons: [
                {
                    text: 'Hủy',
                    class: 'btn-secondary',
                    onClick: 'this.closest(\'.admin-modal-overlay\').remove();'
                },
                {
                    text: 'Lưu',
                    class: 'btn-primary',
                    icon: 'fas fa-save',
                    onClick: 'this.closest(\'form\')?.requestSubmit();'
                }
            ]
        });
        
        const formElement = modal.querySelector('form');
        if (formElement) {
            // Handle voucher type change
            const typeSelect = formElement.querySelector('[name="voucher_type"]');
            if (typeSelect) {
                typeSelect.addEventListener('change', () => {
                    // Reload form with new type
                    modal.remove();
                    editVoucher(id);
                });
            }
            
            formElement.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(formElement);
                const data = {};
                
                // Extract all form values
                for (let [key, value] of formData.entries()) {
                    // Skip empty values (except for optional fields)
                    if (value === '' && !['usage_limit', 'max_discount_value', 'description'].includes(key)) {
                        continue;
                    }
                    data[key] = value;
                }
                
                // Convert data types
                if (data.min_order_value) {
                    const val = parseFloat(data.min_order_value);
                    if (!isNaN(val)) data.min_order_value = val;
                }
                if (data.usage_limit) {
                    const val = parseInt(data.usage_limit);
                    if (!isNaN(val)) data.usage_limit = val;
                }
                if (data.max_per_user) {
                    const val = parseInt(data.max_per_user);
                    if (!isNaN(val)) data.max_per_user = val;
                }
                
                if (data.voucher_type === 'discount') {
                    if (data.discount_value) {
                        const val = parseFloat(data.discount_value);
                        if (!isNaN(val)) data.discount_value = val;
                    }
                    if (data.max_discount_value) {
                        const val = parseFloat(data.max_discount_value);
                        if (!isNaN(val)) data.max_discount_value = val;
                    }
                } else {
                    if (data.shipping_discount) {
                        const val = parseFloat(data.shipping_discount);
                        if (!isNaN(val)) data.shipping_discount = val;
                    }
                }
                
                // Convert datetime to ISO string
                if (data.start_date) {
                    try {
                        data.start_date = new Date(data.start_date).toISOString();
                    } catch (e) {
                        console.error('Invalid start_date:', data.start_date);
                    }
                }
                if (data.end_date) {
                    try {
                        data.end_date = new Date(data.end_date).toISOString();
                    } catch (e) {
                        console.error('Invalid end_date:', data.end_date);
                    }
                }
                
                // Debug: Log data before sending
                console.log('🎫 Updating voucher with data:', data);
                
                // Disable update button
                const updateBtn = modal.querySelector('.btn-primary');
                if (updateBtn) {
                    updateBtn.disabled = true;
                    updateBtn.textContent = 'Đang cập nhật...';
                    updateBtn.style.opacity = '0.6';
                }
                
                try {
                    AdminUIComponents.showLoading('Đang cập nhật...');
                    const result = await window.AdminServices.updateVoucher(id, data);
                    console.log('🎫 Voucher updated successfully:', result);
                    showToast('✅ Cập nhật voucher thành công', 'success');
                    modal.remove();
                    loadVouchers();
                } catch (error) {
                    console.error('❌ Error updating voucher:', error);
                    console.error('Error details:', {
                        message: error.message,
                        stack: error.stack,
                        data: data
                    });
                    showToast('❌ ' + (error.message || 'Không thể cập nhật voucher'), 'error');
                } finally {
                    // Re-enable button
                    if (updateBtn && !modal.parentNode) {
                        // Modal was removed
                    } else if (updateBtn) {
                        updateBtn.disabled = false;
                        updateBtn.textContent = 'Cập nhật';
                        updateBtn.style.opacity = '1';
                    }
                    AdminUIComponents.hideLoading();
                }
            });
        }
    } catch (error) {
        AdminUIComponents.hideLoading();
        showToast('Không thể tải thông tin voucher', 'error');
    }
}

async function deleteVoucher(id) {
    console.log('🎫 deleteVoucher called with id:', id);
    
    const confirmed = await AdminUIComponents.confirm({
        title: 'Xóa voucher',
        message: 'Bạn có chắc chắn muốn xóa voucher này? Hành động này có thể khôi phục.',
        confirmText: 'Xóa',
        cancelText: 'Hủy',
        confirmClass: 'btn-danger'
    });

    console.log('🎫 Confirm dialog result:', confirmed);
    
    if (!confirmed) {
        console.log('🎫 Delete cancelled by user');
        return;
    }

    try {
        showLoading();
        console.log('🎫 Deleting voucher:', id);
        await window.AdminServices.deleteVoucher(id);
        console.log('🎫 Voucher deleted successfully');
        showToast('✅ Xóa voucher thành công', 'success');
        loadVouchers();
    } catch (error) {
        console.error('❌ Error deleting voucher:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        showToast('❌ ' + (error.message || 'Không thể xóa voucher'), 'error');
    } finally {
        hideLoading();
    }
}

window.viewVoucher = viewVoucher;
window.editVoucher = editVoucher;
window.deleteVoucher = deleteVoucher;

