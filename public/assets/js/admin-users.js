/**
 * Admin Users Management JavaScript
 */

// Helper: Đợi AdminServices sẵn sàng
function waitForAdminServices(maxWait = 5000) {
    return new Promise((resolve, reject) => {
        if (window.AdminServices && typeof window.AdminServices.getUsers === 'function') {
            resolve(window.AdminServices);
            return;
        }
        
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (window.AdminServices && typeof window.AdminServices.getUsers === 'function') {
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
let pageSize = 10; // Giới hạn 10 users mỗi trang
let totalPages = 1;
let filters = { search: '', role: '', status: '' };

document.addEventListener('DOMContentLoaded', async function() {
    const pathname = window.location.pathname;
    console.log('👥 Users page - pathname:', pathname);
    
    if (pathname === '/users' || pathname.includes('/users')) {
        console.log('👥 Initializing users page...');
        try {
            await waitForAdminServices();
            console.log('👥 AdminServices ready, initializing page...');
            initUsersPage();
        } catch (error) {
            console.error('❌ Error waiting for AdminServices:', error);
            if (typeof showToast === 'function') {
                showToast('Không thể tải AdminServices. Vui lòng reload trang.', 'error');
            }
        }
    }
});

function initUsersPage() {
    setupEventListeners();
    loadUsers();
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
                updateUserActiveFilters();
                loadUsers();
            }, 500);
        });
    }

    const roleFilter = document.getElementById('roleFilter');
    const statusFilter = document.getElementById('statusFilter');
    if (roleFilter) roleFilter.addEventListener('change', (e) => { 
        filters.role = e.target.value; 
        currentPage = 1; 
        updateUserActiveFilters();
        loadUsers(); 
    });
    if (statusFilter) statusFilter.addEventListener('change', (e) => { 
        filters.status = e.target.value; 
        currentPage = 1; 
        updateUserActiveFilters();
        loadUsers(); 
    });

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', () => loadUsers());

    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            const form = AdminCRUDForms.createUserForm();
            const modal = AdminUIComponents.createModal({
                title: 'Thêm người dùng mới',
                content: form.outerHTML,
                size: 'medium',
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
                formElement.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(formElement);
                    const data = {};
                    for (let [key, value] of formData.entries()) {
                        data[key] = value;
                    }
                    data.roles = [data.roles];
                    
                    // Disable save button
                    const saveBtn = modal.querySelector('.btn-primary');
                    if (saveBtn) {
                        saveBtn.disabled = true;
                        saveBtn.textContent = 'Đang lưu...';
                        saveBtn.style.opacity = '0.6';
                    }
                    
                    try {
                        AdminUIComponents.showLoading('Đang lưu...');
                        await window.AdminServices.createUser(data);
                        showToast('Tạo người dùng thành công', 'success');
                        modal.remove();
                        loadUsers();
                    } catch (error) {
                        showToast(error.message || 'Không thể tạo người dùng', 'error');
                    } finally {
                        AdminUIComponents.hideLoading();
                        // Re-enable button
                        if (saveBtn && !modal.parentNode) {
                            // Modal was removed
                        } else if (saveBtn) {
                            saveBtn.disabled = false;
                            saveBtn.textContent = 'Lưu';
                            saveBtn.style.opacity = '1';
                        }
                    }
                });
            }
        });
    }

    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    if (prevPage) prevPage.addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadUsers(); } });
    if (nextPage) nextPage.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; loadUsers(); } });
}

async function loadUsers() {
    showLoading();
    try {
        if (!window.AdminServices) {
            throw new Error('AdminServices is not loaded');
        }
        
        // Theo tài liệu: GET /api/users/users KHÔNG có query parameters
        // Trả về tất cả users (không pagination)
        // Nếu cần pagination, có thể filter client-side
        const params = {};
        // Không có query parameters theo tài liệu

        console.log('👥 Loading users with params:', params);
        const response = await window.AdminServices.getUsers(params);
        console.log('👥 Users response received:', response);
        
        // API trả về array trực tiếp (không pagination theo tài liệu)
        const users = Array.isArray(response) ? response : (response.users || response.data || []);
        
        // Filter và paginate client-side vì API không hỗ trợ
        let filteredUsers = users;
        
        // Apply client-side filters
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filteredUsers = filteredUsers.filter(u => 
                (u.email && u.email.toLowerCase().includes(searchLower)) ||
                (u.full_name && u.full_name.toLowerCase().includes(searchLower)) ||
                (u.username && u.username.toLowerCase().includes(searchLower)) ||
                (u.phone_number && u.phone_number.toLowerCase().includes(searchLower))
            );
        }
        if (filters.role) {
            filteredUsers = filteredUsers.filter(u => 
                u.roles && u.roles.includes(filters.role)
            );
        }
        if (filters.status) {
            filteredUsers = filteredUsers.filter(u => {
                if (filters.status === 'active') return u.isActive !== false;
                if (filters.status === 'inactive') return u.isActive === false;
                return true;
            });
        }
        
        // Client-side pagination
        const total = filteredUsers.length;
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        const paginatedUsers = filteredUsers.slice(start, end);
        
        if (paginatedUsers.length > 0) {
            renderUsers(paginatedUsers);
            updatePagination({ 
                page: currentPage, 
                limit: pageSize, 
                total: total, 
                pages: Math.ceil(total / pageSize), 
                totalPages: Math.ceil(total / pageSize) 
            });
        } else {
            renderUsers([]);
            updatePagination({ page: 1, limit: pageSize, total: 0, pages: 1, totalPages: 1 });
        }
        
        updateUserActiveFilters();
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Không thể tải danh sách người dùng', 'error');
        renderUsers([]);
    } finally {
        hideLoading();
    }
}

function renderUsers(users) {
    console.log('👥 renderUsers called with', users.length, 'users');
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) {
        console.warn('⚠️ usersTableBody element not found');
        return;
    }

    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 3rem;"><i class="fas fa-inbox" style="font-size: 3rem; color: #d1d5db;"></i><p style="color: #6b7280; margin-top: 1rem;">Không tìm thấy người dùng nào</p></td></tr>`;
        return;
    }

    // Get search term for highlighting
    const searchTerm = filters.search || '';
    
    tbody.innerHTML = users.map(user => {
        const email = user.email || 'N/A';
        const fullName = user.full_name || user.username || 'N/A';
        const phoneNumber = user.phone_number || 'N/A';
        
        // Highlight search terms
        const highlightedEmail = highlightSearchText(email, searchTerm);
        const highlightedFullName = highlightSearchText(fullName, searchTerm);
        const highlightedPhone = highlightSearchText(phoneNumber, searchTerm);
        
        return `
        <tr style="transition: background-color 0.2s;">
            <td style="vertical-align: middle;"><strong style="color: #1f2937;">${highlightedEmail}</strong></td>
            <td style="vertical-align: middle; color: #4b5563;">${highlightedFullName}</td>
            <td style="vertical-align: middle;">
                ${user.roles?.map(r => {
                    const roleColors = {
                        'admin': { bg: '#fee2e2', text: '#991b1b' },
                        'shipper': { bg: '#dbeafe', text: '#1e40af' },
                        'user': { bg: '#d1fae5', text: '#065f46' }
                    };
                    const role = r === 'admin' ? 'admin' : (r === 'shipper' ? 'shipper' : 'user');
                    const colors = roleColors[role] || { bg: '#f3f4f6', text: '#374151' };
                    const label = r === 'admin' ? 'Admin' : (r === 'shipper' ? 'Shipper' : 'Người dùng');
                    return `<span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 500; background: ${colors.bg}; color: ${colors.text}; margin-right: 0.25rem;">${label}</span>`;
                }).join('') || '<span style="color: #6b7280;">Người dùng</span>'}
            </td>
            <td style="vertical-align: middle; color: #4b5563;">${highlightedPhone}</td>
            <td style="vertical-align: middle;">
                <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 500; background: ${user.isActive ? '#d1fae5' : '#fee2e2'}; color: ${user.isActive ? '#065f46' : '#991b1b'};">
                    ${user.isActive ? 'Hoạt động' : 'Đã khóa'}
                </span>
            </td>
            <td style="vertical-align: middle; color: #4b5563; font-size: 0.9rem;">${window.AdminServices.formatDate(user.createdAt)}</td>
            <td style="vertical-align: middle;">
                <div style="display: flex; gap: 0.5rem; justify-content: center;">
                    <button class="btn btn-sm btn-primary" onclick="viewUser('${user._id}')" title="Xem chi tiết" style="padding: 0.5rem; min-width: 36px;"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-secondary" onclick="toggleUserStatus('${user._id}', ${!user.isActive})" title="${user.isActive ? 'Khóa' : 'Mở khóa'}" style="padding: 0.5rem; min-width: 36px;">
                        <i class="fas fa-${user.isActive ? 'lock' : 'unlock'}"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
    }).join('');

    const countEl = document.getElementById('usersCount');
    if (countEl) countEl.textContent = `${users.length} người dùng`;
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

async function viewUser(id) {
    try {
        console.log('👥 viewUser called with id:', id);
        showLoading();
        const user = await window.AdminServices.getUser(id);
        console.log('👥 User details loaded:', user);
        hideLoading();
        
        if (!user) {
            showToast('Không tìm thấy người dùng', 'error');
            return;
        }
        
        // Escape values
        const email = escapeHtml(user.email || 'N/A');
        const fullName = escapeHtml(user.full_name || user.username || 'N/A');
        const phone = escapeHtml(user.phone_number || 'N/A');
        const roles = user.roles?.map(r => {
            const roleLabels = { 'admin': 'Admin', 'shipper': 'Shipper', 'user': 'Người dùng' };
            return roleLabels[r] || r;
        }).join(', ') || 'Người dùng';
        const createdAt = window.AdminServices.formatDate(user.createdAt);
        const isActive = user.isActive !== false;
        const statusBadge = isActive 
            ? '<span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 500; background: #d1fae5; color: #065f46;">Hoạt động</span>'
            : '<span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 500; background: #fee2e2; color: #991b1b;">Đã khóa</span>';
        
        const modal = AdminUIComponents.createModal({
            title: 'Chi tiết người dùng',
            content: `
                <div style="padding: 1.5rem;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                        <div>
                            <h3 style="margin: 0 0 1rem 0; color: #1f2937; font-size: 1.1rem;">Thông tin cơ bản</h3>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Email:</strong> ${email}</p>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Họ tên:</strong> ${fullName}</p>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Điện thoại:</strong> ${phone}</p>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Vai trò:</strong> ${roles}</p>
                        </div>
                        <div>
                            <h3 style="margin: 0 0 1rem 0; color: #1f2937; font-size: 1.1rem;">Thông tin khác</h3>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Trạng thái:</strong> ${statusBadge}</p>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Ngày tạo:</strong> ${createdAt}</p>
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
                    text: isActive ? 'Khóa' : 'Mở khóa',
                    class: isActive ? 'btn-danger' : 'btn-success',
                    icon: isActive ? 'fas fa-lock' : 'fas fa-unlock',
                    onClick: `this.closest('.admin-modal-overlay').remove(); toggleUserStatus('${id}', ${!isActive});`
                }
            ]
        });
        console.log('👥 Modal created successfully');
    } catch (error) {
        hideLoading();
        console.error('❌ Error loading user details:', error);
        showToast('Không thể tải chi tiết người dùng: ' + (error.message || 'Unknown error'), 'error');
    }
}

// Helper function để escape HTML
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

// Update active filters display for users
function updateUserActiveFilters() {
    const container = document.getElementById('activeFiltersContainer');
    if (!container) return;

    container.innerHTML = '';

    // Search filter
    if (filters.search) {
        const badge = createUserFilterBadge('Tìm kiếm', `"${filters.search}"`, 'search');
        container.appendChild(badge);
    }

    // Role filter
    if (filters.role) {
        const roleMap = {
            user: 'Người dùng',
            shipper: 'Shipper',
            admin: 'Admin'
        };
        const roleText = roleMap[filters.role] || filters.role;
        const badge = createUserFilterBadge('Vai trò', roleText, 'role');
        container.appendChild(badge);
    }

    // Status filter
    if (filters.status) {
        const statusText = filters.status === 'active' ? 'Hoạt động' : 'Đã khóa';
        const badge = createUserFilterBadge('Trạng thái', statusText, 'status');
        container.appendChild(badge);
    }

    // Show container if there are filters
    container.style.display = container.children.length > 0 ? 'flex' : 'none';
}

// Create filter badge for users
function createUserFilterBadge(label, value, filterType) {
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
        removeUserFilter(filterType);
    });

    return badge;
}

// Remove individual filter for users
function removeUserFilter(filterType) {
    switch(filterType) {
        case 'search':
            filters.search = '';
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.value = '';
            break;
        case 'role':
            filters.role = '';
            const roleFilter = document.getElementById('roleFilter');
            if (roleFilter) roleFilter.value = '';
            break;
        case 'status':
            filters.status = '';
            const statusFilter = document.getElementById('statusFilter');
            if (statusFilter) statusFilter.value = '';
            break;
    }
    currentPage = 1;
    updateUserActiveFilters();
    loadUsers();
}

async function toggleUserStatus(id, isActive) {
    const confirmed = await AdminUIComponents.confirm({
        title: isActive ? 'Mở khóa người dùng' : 'Khóa người dùng',
        message: `Bạn có chắc chắn muốn ${isActive ? 'mở khóa' : 'khóa'} người dùng này?`,
        confirmText: isActive ? 'Mở khóa' : 'Khóa',
        cancelText: 'Hủy',
        confirmClass: isActive ? 'btn-success' : 'btn-danger'
    });

    if (!confirmed) return;

    try {
        showLoading();
        await window.AdminServices.lockUser(id, isActive);
        showToast(isActive ? 'Mở khóa người dùng thành công' : 'Khóa người dùng thành công', 'success');
        loadUsers();
    } catch (error) {
        console.error('Error toggling user status:', error);
        showToast('Không thể thay đổi trạng thái người dùng', 'error');
    } finally {
        hideLoading();
    }
}

window.viewUser = viewUser;
window.toggleUserStatus = toggleUserStatus;

