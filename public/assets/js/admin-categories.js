/**
 * Admin Categories Management JavaScript
 */

// Helper: Đợi AdminServices sẵn sàng
function waitForAdminServices(maxWait = 5000) {
    return new Promise((resolve, reject) => {
        if (window.AdminServices && typeof window.AdminServices.getCategories === 'function') {
            resolve(window.AdminServices);
            return;
        }
        
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (window.AdminServices && typeof window.AdminServices.getCategories === 'function') {
                clearInterval(checkInterval);
                resolve(window.AdminServices);
            } else if (Date.now() - startTime > maxWait) {
                clearInterval(checkInterval);
                reject(new Error('AdminServices không sẵn sàng sau ' + maxWait + 'ms'));
            }
        }, 100);
    });
}

let categories = [];
let allDeletedCategories = []; // Lưu tất cả danh mục đã xóa
let currentViewMode = 'active'; // 'active' or 'deleted'
let sortBy = 'name'; // Mặc định sắp xếp theo tên
let sortOrder = 'asc'; // Mặc định tăng dần
let filters = { search: '', status: '', visible: '' };

document.addEventListener('DOMContentLoaded', async function() {
    const pathname = window.location.pathname;
    console.log('📁 Categories page - pathname:', pathname);
    
    // Check if we're on categories page (flexible check)
    if (pathname === '/categories' || pathname.includes('/categories') || pathname.endsWith('categories.html')) {
        console.log('📁 Initializing categories page...');
        try {
            await waitForAdminServices();
            console.log('📁 AdminServices ready, initializing page...');
            initCategoriesPage();
        } catch (error) {
            console.error('❌ Error waiting for AdminServices:', error);
            if (typeof showToast === 'function') {
                showToast('Không thể tải AdminServices. Vui lòng reload trang.', 'error');
            }
        }
    } else {
        console.log('📁 Not on categories page, skipping initialization');
    }
});

function initCategoriesPage() {
    console.log('📁 initCategoriesPage called');
    setupEventListeners();
    console.log('📁 Event listeners setup, loading categories...');
    loadCategories();
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                // Handle search based on current view mode
                if (currentViewMode === 'deleted') {
                    // Search in deleted categories
                    handleDeletedCategoriesSearch(value);
                } else {
                    // Search in active categories
                    filterCategories(value);
                }
            }, 300);
        });
    }

    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => showAddCategoryModal());
    }

    // View mode toggle (Active/Deleted)
    const categoryActiveTab = document.getElementById('categoryActiveTab');
    const categoryDeletedTab = document.getElementById('categoryDeletedTab');
    if (categoryActiveTab) {
        categoryActiveTab.addEventListener('click', () => {
            switchCategoryViewMode('active');
        });
    }
    if (categoryDeletedTab) {
        categoryDeletedTab.addEventListener('click', () => {
            switchCategoryViewMode('deleted');
        });
    }

    // Refresh deleted categories button
    const refreshDeletedCategoriesBtn = document.getElementById('refreshDeletedCategoriesBtn');
    if (refreshDeletedCategoriesBtn) {
        refreshDeletedCategoriesBtn.addEventListener('click', () => {
            loadDeletedCategories();
        });
    }

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => loadCategories());
    }

    // Sort
    const sortBySelect = document.getElementById('sortBy');
    if (sortBySelect) {
        sortBySelect.addEventListener('change', (e) => {
            sortBy = e.target.value;
            loadCategories();
        });
    }

    const sortOrderSelect = document.getElementById('sortOrder');
    if (sortOrderSelect) {
        sortOrderSelect.addEventListener('change', (e) => {
            sortOrder = e.target.value;
            loadCategories();
        });
    }
}

async function loadCategories() {
    showLoading();
    try {
        if (!window.AdminServices) {
            throw new Error('AdminServices is not loaded');
        }
        
        // Theo tài liệu: GET /api/categories hỗ trợ: visible (string: "true" hoặc "false")
        const params = {};
        if (filters.visible !== undefined && filters.visible !== '') {
            params.visible = filters.visible;
        }
        console.log('📁 Loading categories...');
        const response = await window.AdminServices.getCategories(params);
        console.log('📁 Categories response received:', response);
        
        // API có thể trả về array trực tiếp hoặc { categories: [...] }
        categories = Array.isArray(response) ? response : (response.categories || response.data || []);
        console.log('📁 Categories array:', categories.length, 'items');
        
        // Sort categories
        const sortedCategories = sortCategories(categories, sortBy, sortOrder);
        
        renderCategoriesTree(sortedCategories);
        // Update count in tree header
        const countEl = document.getElementById('categoriesCount');
        if (countEl) countEl.textContent = `${sortedCategories.length} danh mục`;
    } catch (error) {
        console.error('❌ Error loading categories:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        showToast('Không thể tải danh sách danh mục: ' + error.message, 'error');
        renderCategoriesTree([]);
        const countEl = document.getElementById('categoriesCount');
        if (countEl) countEl.textContent = '0 danh mục';
    } finally {
        hideLoading();
    }
}

function renderCategoriesTree(cats, searchTerm = '') {
    console.log('📁 renderCategoriesTree called with', cats.length, 'categories');
    const container = document.getElementById('categoriesTree');
    if (!container) {
        console.warn('⚠️ categoriesTree element not found');
        return;
    }

    if (cats.length === 0) {
        console.log('📁 No categories to render in tree');
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <i class="fas fa-inbox" style="font-size: 3rem; color: #d1d5db;"></i>
                <p style="color: #6b7280; margin-top: 1rem;">${searchTerm ? 'Không tìm thấy danh mục nào' : 'Chưa có danh mục nào'}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = buildTreeHTML(cats, null, 0, searchTerm);
}

function buildTreeHTML(cats, parentId = null, level = 0, searchTerm = '') {
    const filtered = cats.filter(cat => {
        const catParentId = cat.categoryBook_id || cat.parent_id || null;
        return catParentId === parentId || (parentId === null && !catParentId);
    });

    if (filtered.length === 0) return '';

    let html = '<ul style="list-style: none; padding-left: ' + (level * 20) + 'px;">';
    filtered.forEach(cat => {
        const children = buildTreeHTML(cats, cat._id, level + 1, searchTerm);
        
        // Highlight search term in category name
        const nameDisplay = searchTerm ? highlightSearchTextCategory(cat.name || '', searchTerm) : escapeHtmlCategory(cat.name || '');
        
        html += `
            <li style="margin: 0.5rem 0;">
                <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-radius: 4px; background: ${level % 2 === 0 ? '#f9fafb' : 'white'};">
                    <i class="fas fa-folder" style="color: #6366f1;"></i>
                    <span style="flex: 1; font-weight: 500;">${nameDisplay}</span>
                    ${cat.isVisible ? '<span class="badge badge-success">Hiển thị</span>' : '<span class="badge badge-danger">Ẩn</span>'}
                    <button class="btn btn-sm btn-primary" onclick="editCategory('${cat._id}')" title="Sửa"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCategory('${cat._id}')" title="Xóa"><i class="fas fa-trash"></i></button>
                </div>
                ${children}
            </li>
        `;
    });
    html += '</ul>';
    return html;
}

// Helper function to highlight search text in categories
function highlightSearchTextCategory(text, searchTerm) {
    if (!searchTerm || !text) return escapeHtmlCategory(text);
    
    const escapedText = escapeHtmlCategory(text);
    const escapedSearch = escapeHtmlCategory(searchTerm);
    const regex = new RegExp(`(${escapedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    
    return escapedText.replace(regex, '<mark style="background-color: #fef08a; padding: 2px 4px; border-radius: 3px;">$1</mark>');
}

function renderCategoriesTable(cats) {
    console.log('📁 renderCategoriesTable called with', cats.length, 'categories');
    const tbody = document.getElementById('categoriesTableBody');
    if (!tbody) {
        console.warn('⚠️ categoriesTableBody element not found');
        return;
    }

    if (cats.length === 0) {
        console.log('📁 No categories to render in table');
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-inbox" style="font-size: 3rem; color: #d1d5db;"></i>
                    <p style="color: #6b7280; margin-top: 1rem;">Không tìm thấy danh mục nào</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = cats.map(cat => `
        <tr style="transition: background-color 0.2s;">
            <td style="vertical-align: middle;"><strong style="color: #1f2937; font-size: 0.95rem;">${cat.name || 'N/A'}</strong></td>
            <td style="vertical-align: middle;"><code style="background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 4px; color: #4b5563; font-size: 0.85rem;">${cat.slug || 'N/A'}</code></td>
            <td style="vertical-align: middle; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #4b5563; font-size: 0.9rem;">${cat.description || 'N/A'}</td>
            <td style="vertical-align: middle;">
                <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 500; background: ${cat.isVisible ? '#d1fae5' : '#fee2e2'}; color: ${cat.isVisible ? '#065f46' : '#991b1b'};">
                    ${cat.isVisible ? 'Hiển thị' : 'Ẩn'}
                </span>
            </td>
            <td style="vertical-align: middle;">
                <div style="display: flex; gap: 0.5rem; justify-content: center;">
                    <button class="btn btn-sm btn-primary" onclick="editCategory('${cat._id}')" title="Chỉnh sửa" style="padding: 0.5rem; min-width: 36px;"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-secondary" onclick="viewCategory('${cat._id}')" title="Xem chi tiết" style="padding: 0.5rem; min-width: 36px;"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCategory('${cat._id}')" title="Xóa" style="padding: 0.5rem; min-width: 36px;"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');

    const countEl = document.getElementById('categoriesCount');
    if (countEl) countEl.textContent = `${cats.length} danh mục`;
}

function sortCategories(cats, sortBy, sortOrder) {
    const sorted = [...cats];
    sorted.sort((a, b) => {
        let aVal, bVal;
        
        switch (sortBy) {
            case 'name':
                aVal = (a.name || '').toLowerCase();
                bVal = (b.name || '').toLowerCase();
                break;
            case 'createdAt':
                aVal = new Date(a.createdAt || 0);
                bVal = new Date(b.createdAt || 0);
                break;
            case 'updatedAt':
                aVal = new Date(a.updatedAt || 0);
                bVal = new Date(b.updatedAt || 0);
                break;
            default:
                aVal = (a.name || '').toLowerCase();
                bVal = (b.name || '').toLowerCase();
        }
        
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });
    
    return sorted;
}

function filterCategories(searchTerm) {
    if (!searchTerm) {
        const sorted = sortCategories(categories, sortBy, sortOrder);
        renderCategoriesTree(sorted);
        const countEl = document.getElementById('categoriesCount');
        if (countEl) countEl.textContent = `${sorted.length} danh mục`;
        return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = categories.filter(cat => 
        cat.name?.toLowerCase().includes(searchLower) ||
        cat.slug?.toLowerCase().includes(searchLower) ||
        cat.description?.toLowerCase().includes(searchLower)
    );
    
    // Sort filtered results
    const sorted = sortCategories(filtered, sortBy, sortOrder);

    renderCategoriesTree(sorted, searchTerm);
    const countEl = document.getElementById('categoriesCount');
    if (countEl) countEl.textContent = `${sorted.length} danh mục`;
}

// Handle search for deleted categories
function handleDeletedCategoriesSearch(searchTerm) {
    if (!searchTerm) {
        renderDeletedCategories(allDeletedCategories, '');
        // Update count
        const deletedCount = document.getElementById('deletedCategoriesCount');
        if (deletedCount) {
            deletedCount.textContent = `${allDeletedCategories.length} danh mục đã xóa`;
        }
        return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = allDeletedCategories.filter(cat => 
        cat && (
            (cat.name && cat.name.toLowerCase().includes(searchLower)) ||
            (cat.slug && cat.slug.toLowerCase().includes(searchLower)) ||
            (cat.description && cat.description.toLowerCase().includes(searchLower))
        )
    );

    renderDeletedCategories(filtered, searchTerm);
    
    // Update count
    const deletedCount = document.getElementById('deletedCategoriesCount');
    if (deletedCount) {
        deletedCount.textContent = `${filtered.length} danh mục đã xóa`;
    }
}

async function editCategory(id) {
    const category = categories.find(c => c._id === id);
    if (!category) return;

    try {
        const allCategories = await window.AdminServices.getCategories();
        // API có thể trả về array trực tiếp hoặc { categories: [...] }
        const categoriesList = Array.isArray(allCategories) ? allCategories : (allCategories.categories || allCategories.data || []);
        const parentCategories = categoriesList.filter(c => c._id !== id);
        
        const form = AdminCRUDForms.createCategoryForm(category, parentCategories);
        const modal = AdminUIComponents.createModal({
            title: 'Sửa danh mục',
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
                
                // Handle checkbox - FormData needs string values
                const isVisible = formElement.querySelector('[name="isVisible"]')?.checked || false;
                formData.set('isVisible', isVisible ? 'true' : 'false');
                
                // Remove categoryBook_id if empty
                const categoryBookId = formData.get('categoryBook_id');
                if (!categoryBookId || categoryBookId === '') {
                    formData.delete('categoryBook_id');
                }
                
                // Debug: Log FormData contents
                console.log('📁 FormData contents (update category):', Array.from(formData.entries()));
                
                // Disable save button
                const saveBtn = modal.querySelector('.btn-primary');
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.textContent = 'Đang cập nhật...';
                    saveBtn.style.opacity = '0.6';
                }
                
                try {
                    AdminUIComponents.showLoading('Đang cập nhật...');
                    console.log('📁 Updating category with FormData...');
                    const result = await window.AdminServices.updateCategory(id, formData);
                    console.log('📁 Category updated successfully:', result);
                    showToast('✅ Cập nhật danh mục thành công', 'success');
                    modal.remove();
                    loadCategories();
                } catch (error) {
                    console.error('❌ Error updating category:', error);
                    console.error('Error details:', {
                        message: error.message,
                        stack: error.stack
                    });
                    showToast('❌ ' + (error.message || 'Không thể cập nhật danh mục'), 'error');
                } finally {
                    AdminUIComponents.hideLoading();
                    // Re-enable button
                    if (saveBtn && !modal.parentNode) {
                        // Modal removed
                    } else if (saveBtn) {
                        saveBtn.disabled = false;
                        saveBtn.textContent = 'Lưu';
                        saveBtn.style.opacity = '1';
                    }
                }
            });
        }
    } catch (error) {
        showToast('Không thể tải danh sách danh mục', 'error');
    }
}

async function updateCategory(id, data) {
    try {
        showLoading();
        await window.AdminServices.updateCategory(id, data);
        showToast('Cập nhật danh mục thành công', 'success');
        loadCategories();
    } catch (error) {
        console.error('Error updating category:', error);
        showToast('Không thể cập nhật danh mục', 'error');
    } finally {
        hideLoading();
    }
}

function viewCategory(id) {
    window.location.href = `/category-products?id=${id}`;
}

async function deleteCategory(id) {
    console.log('📁 deleteCategory called with id:', id);
    
    const confirmed = await AdminUIComponents.confirm({
        title: 'Xóa danh mục',
        message: 'Bạn có chắc chắn muốn xóa danh mục này? Hành động này có thể khôi phục.',
        confirmText: 'Xóa',
        cancelText: 'Hủy',
        confirmClass: 'btn-danger'
    });

    console.log('📁 Confirm dialog result:', confirmed);
    
    if (!confirmed) {
        console.log('📁 Delete cancelled by user');
        return;
    }

    try {
        showLoading();
        console.log('📁 Deleting category:', id);
        await window.AdminServices.deleteCategory(id);
        console.log('📁 Category deleted successfully');
        showToast('✅ Xóa danh mục thành công', 'success');
        loadCategories();
    } catch (error) {
        console.error('❌ Error deleting category:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        showToast('❌ ' + (error.message || 'Không thể xóa danh mục'), 'error');
    } finally {
        hideLoading();
    }
}

async function showAddCategoryModal() {
    try {
        const categories = await window.AdminServices.getCategories();
        // API có thể trả về array trực tiếp hoặc { categories: [...] }
        const parentCategories = Array.isArray(categories) ? categories : (categories.categories || categories.data || []);
        
        const form = AdminCRUDForms.createCategoryForm(null, parentCategories);
        const modal = AdminUIComponents.createModal({
            title: 'Thêm danh mục mới',
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
                
                // Handle checkbox - FormData needs string values
                const isVisible = formElement.querySelector('[name="isVisible"]')?.checked || false;
                formData.set('isVisible', isVisible ? 'true' : 'false');
                
                // Remove categoryBook_id if empty
                const categoryBookId = formData.get('categoryBook_id');
                if (!categoryBookId || categoryBookId === '') {
                    formData.delete('categoryBook_id');
                }
                
                // Debug: Log FormData contents
                console.log('📁 FormData contents (create category):', Array.from(formData.entries()));
                
                // Disable save button
                const saveBtn = modal.querySelector('.btn-primary');
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.textContent = 'Đang lưu...';
                    saveBtn.style.opacity = '0.6';
                }
                
                try {
                    AdminUIComponents.showLoading('Đang lưu...');
                    console.log('📁 Creating category with FormData...');
                    const result = await window.AdminServices.createCategory(formData);
                    console.log('📁 Category created successfully:', result);
                    showToast('✅ Tạo danh mục thành công', 'success');
                    modal.remove();
                    loadCategories();
                } catch (error) {
                    console.error('❌ Error creating category:', error);
                    console.error('Error details:', {
                        message: error.message,
                        stack: error.stack
                    });
                    showToast('❌ ' + (error.message || 'Không thể tạo danh mục'), 'error');
                } finally {
                    AdminUIComponents.hideLoading();
                    // Re-enable button
                    if (saveBtn && !modal.parentNode) {
                        // Modal removed
                    } else if (saveBtn) {
                        saveBtn.disabled = false;
                        saveBtn.textContent = 'Lưu';
                        saveBtn.style.opacity = '1';
                    }
                }
            });
        }
    } catch (error) {
        showToast('Không thể tải danh sách danh mục', 'error');
    }
}

async function createCategory(data) {
    try {
        showLoading();
        await window.AdminServices.createCategory(data);
        showToast('Tạo danh mục thành công', 'success');
        loadCategories();
    } catch (error) {
        console.error('Error creating category:', error);
        showToast('Không thể tạo danh mục', 'error');
    } finally {
        hideLoading();
    }
}

// Switch view mode between active and deleted categories
function switchCategoryViewMode(mode) {
    currentViewMode = mode;
    const activeView = document.getElementById('activeCategoriesView');
    const deletedView = document.getElementById('deletedCategoriesView');
    const activeTab = document.getElementById('categoryActiveTab');
    const deletedTab = document.getElementById('categoryDeletedTab');

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
        // Load active categories if not loaded
        if (categories.length === 0) {
            loadCategories();
        } else {
            // Apply current search if exists
            const searchInput = document.getElementById('searchInput');
            const searchTerm = searchInput ? searchInput.value.trim() : '';
            filterCategories(searchTerm);
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
        // Load deleted categories
        loadDeletedCategories();
    }
}

// Load deleted categories
async function loadDeletedCategories() {
    if (typeof showLoading === 'function') {
        showLoading();
    }

    try {
        if (!window.AdminServices) {
            throw new Error('AdminServices is not loaded');
        }

        console.log('🗑️ Loading deleted categories...');
        const response = await window.AdminServices.getTrashCategories();
        console.log('🗑️ Deleted categories response:', response);

        // Extract deleted categories from response
        const extractDataFunc = window.extractData || function(resp, key) {
            if (!resp) return [];
            if (Array.isArray(resp)) return resp;
            if (key && resp[key]) return Array.isArray(resp[key]) ? resp[key] : [];
            if (resp.data) return Array.isArray(resp.data) ? resp.data : [];
            if (resp.categories) return Array.isArray(resp.categories) ? resp.categories : [];
            return [];
        };

        allDeletedCategories = extractDataFunc(response, 'categories');
        console.log('🗑️ Loaded deleted categories:', allDeletedCategories.length);

        // Apply search filter if exists
        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput ? searchInput.value.trim() : '';
        
        if (searchTerm) {
            handleDeletedCategoriesSearch(searchTerm);
        } else {
            // Render deleted categories
            renderDeletedCategories(allDeletedCategories, '');
        }

        // Update count
        const deletedCount = document.getElementById('deletedCategoriesCount');
        if (deletedCount) {
            const displayCount = searchTerm ? 
                allDeletedCategories.filter(cat => {
                    const searchLower = searchTerm.toLowerCase();
                    const name = (cat.name || '').toLowerCase();
                    const slug = (cat.slug || '').toLowerCase();
                    const description = (cat.description || '').toLowerCase();
                    return name.includes(searchLower) || slug.includes(searchLower) || description.includes(searchLower);
                }).length : allDeletedCategories.length;
            deletedCount.textContent = `${displayCount} danh mục đã xóa`;
        }
    } catch (error) {
        console.error('❌ Error loading deleted categories:', error);
        if (typeof showToast === 'function') {
            showToast('Không thể tải danh sách danh mục đã xóa: ' + error.message, 'error');
        }
        const tbody = document.getElementById('deletedCategoriesTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 3rem;">
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

// Render deleted categories with search highlighting
function renderDeletedCategories(cats, searchTerm = '') {
    const tbody = document.getElementById('deletedCategoriesTableBody');
    if (!tbody) return;

    if (!cats || cats.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-inbox" style="font-size: 3rem; color: #d1d5db; margin-bottom: 1rem;"></i>
                    <p style="color: #6b7280;">${searchTerm ? 'Không tìm thấy danh mục nào' : 'Không có danh mục nào đã xóa'}</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = cats.map(cat => {
        const deletedAt = cat.deletedAt ? new Date(cat.deletedAt).toLocaleString('vi-VN') : 'N/A';
        const description = cat.description ? (cat.description.length > 50 ? cat.description.substring(0, 50) + '...' : cat.description) : 'N/A';

        // Highlight search term in name, slug, and description
        const nameDisplay = searchTerm ? highlightSearchTextCategory(cat.name || 'N/A', searchTerm) : escapeHtmlCategory(cat.name || 'N/A');
        const slugDisplay = searchTerm ? highlightSearchTextCategory(cat.slug || 'N/A', searchTerm) : escapeHtmlCategory(cat.slug || 'N/A');
        const descDisplay = searchTerm ? highlightSearchTextCategory(description, searchTerm) : escapeHtmlCategory(description);

        return `
            <tr style="opacity: 0.8;">
                <td style="vertical-align: middle;">
                    <strong style="color: #1f2937;">${nameDisplay}</strong>
                </td>
                <td style="vertical-align: middle; color: #4b5563; font-size: 0.875rem;">${slugDisplay}</td>
                <td style="vertical-align: middle; color: #4b5563; font-size: 0.875rem;">${descDisplay}</td>
                <td style="vertical-align: middle; color: #6b7280; font-size: 0.875rem;">${deletedAt}</td>
                <td style="vertical-align: middle;">
                    <div style="display: flex; gap: 0.5rem; justify-content: center;">
                        <button onclick="restoreCategory('${cat._id}')" class="btn btn-sm btn-success" title="Khôi phục" style="padding: 0.5rem 1rem;">
                            <i class="fas fa-undo"></i> Khôi phục
                        </button>
                        <button onclick="permanentlyDeleteCategory('${cat._id}')" class="btn btn-sm btn-danger" title="Xóa vĩnh viễn" style="padding: 0.5rem 1rem;">
                            <i class="fas fa-trash-alt"></i> Xóa vĩnh viễn
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Helper function để escape HTML
function escapeHtmlCategory(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Restore category
async function restoreCategory(categoryId) {
    if (!confirm('Bạn có chắc muốn khôi phục danh mục này?')) {
        return;
    }

    if (typeof showLoading === 'function') {
        showLoading();
    }

    try {
        if (!window.AdminServices) {
            throw new Error('AdminServices is not loaded');
        }

        await window.AdminServices.restoreCategory(categoryId);
        
        if (typeof showToast === 'function') {
            showToast('Khôi phục danh mục thành công', 'success');
        }

        // Reload based on current view mode
        if (currentViewMode === 'deleted') {
            await loadDeletedCategories();
        } else {
            await loadCategories();
        }
    } catch (error) {
        console.error('❌ Error restoring category:', error);
        if (typeof showToast === 'function') {
            showToast('Không thể khôi phục danh mục: ' + error.message, 'error');
        }
    } finally {
        if (typeof hideLoading === 'function') {
            hideLoading();
        }
    }
}

// Permanently delete category
async function permanentlyDeleteCategory(categoryId) {
    const category = allDeletedCategories.find(c => c._id === categoryId);
    const categoryName = category ? (category.name || 'danh mục này') : 'danh mục này';
    
    if (!confirm(`Bạn có chắc muốn XÓA VĨNH VIỄN "${categoryName}"?\n\nHành động này không thể hoàn tác!`)) {
        return;
    }

    if (typeof showLoading === 'function') {
        showLoading();
    }

    try {
        if (!window.AdminServices) {
            throw new Error('AdminServices is not loaded');
        }

        await window.AdminServices.forceDeleteCategory(categoryId);
        
        if (typeof showToast === 'function') {
            showToast('Xóa vĩnh viễn danh mục thành công', 'success');
        }

        // Reload deleted categories
        await loadDeletedCategories();
    } catch (error) {
        console.error('❌ Error permanently deleting category:', error);
        if (typeof showToast === 'function') {
            showToast('Không thể xóa vĩnh viễn danh mục: ' + error.message, 'error');
        }
    } finally {
        if (typeof hideLoading === 'function') {
            hideLoading();
        }
    }
}

window.editCategory = editCategory;
window.viewCategory = viewCategory;
window.deleteCategory = deleteCategory;
window.restoreCategory = restoreCategory;
window.permanentlyDeleteCategory = permanentlyDeleteCategory;

