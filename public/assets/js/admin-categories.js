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
let sortBy = 'name'; // Mặc định sắp xếp theo tên
let sortOrder = 'asc'; // Mặc định tăng dần

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
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterCategories(e.target.value);
            }, 300);
        });
    }

    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => showAddCategoryModal());
    }

    const trashBtn = document.getElementById('trashBtn');
    if (trashBtn) {
        trashBtn.addEventListener('click', () => {
            window.location.href = '/danhmucdaxoa';
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
        
        console.log('📁 Loading categories...');
        const response = await window.AdminServices.getCategories();
        console.log('📁 Categories response received:', response);
        
        // API có thể trả về array trực tiếp hoặc { categories: [...] }
        categories = Array.isArray(response) ? response : (response.categories || response.data || []);
        console.log('📁 Categories array:', categories.length, 'items');
        
        // Sort categories
        const sortedCategories = sortCategories(categories, sortBy, sortOrder);
        
        renderCategoriesTree(sortedCategories);
        renderCategoriesTable(sortedCategories);
    } catch (error) {
        console.error('❌ Error loading categories:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        showToast('Không thể tải danh sách danh mục: ' + error.message, 'error');
        renderCategoriesTree([]);
        renderCategoriesTable([]);
    } finally {
        hideLoading();
    }
}

function renderCategoriesTree(cats) {
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
                <p style="color: #6b7280; margin-top: 1rem;">Chưa có danh mục nào</p>
            </div>
        `;
        return;
    }

    container.innerHTML = buildTreeHTML(cats);
}

function buildTreeHTML(cats, parentId = null, level = 0) {
    const filtered = cats.filter(cat => {
        const catParentId = cat.categoryBook_id || cat.parent_id || null;
        return catParentId === parentId || (parentId === null && !catParentId);
    });

    if (filtered.length === 0) return '';

    let html = '<ul style="list-style: none; padding-left: ' + (level * 20) + 'px;">';
    filtered.forEach(cat => {
        const children = buildTreeHTML(cats, cat._id, level + 1);
        html += `
            <li style="margin: 0.5rem 0;">
                <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-radius: 4px; background: ${level % 2 === 0 ? '#f9fafb' : 'white'};">
                    <i class="fas fa-folder" style="color: #6366f1;"></i>
                    <span style="flex: 1; font-weight: 500;">${cat.name}</span>
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
        renderCategoriesTable(sorted);
        renderCategoriesTree(sorted);
        return;
    }

    const filtered = categories.filter(cat => 
        cat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Sort filtered results
    const sorted = sortCategories(filtered, sortBy, sortOrder);

    renderCategoriesTable(sorted);
    renderCategoriesTree(sorted);
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
                const data = {};
                for (let [key, value] of formData.entries()) {
                    data[key] = value;
                }
                data.isVisible = formElement.querySelector('[name="isVisible"]')?.checked || false;
                if (!data.categoryBook_id) delete data.categoryBook_id;
                
                try {
                    AdminUIComponents.showLoading('Đang lưu...');
                    await window.AdminServices.updateCategory(id, data);
                    showToast('Cập nhật danh mục thành công', 'success');
                    modal.remove();
                    loadCategories();
                } catch (error) {
                    showToast(error.message || 'Không thể cập nhật danh mục', 'error');
                } finally {
                    AdminUIComponents.hideLoading();
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
    const confirmed = await AdminUIComponents.confirm({
        title: 'Xóa danh mục',
        message: 'Bạn có chắc chắn muốn xóa danh mục này? Hành động này có thể khôi phục.',
        confirmText: 'Xóa',
        cancelText: 'Hủy',
        confirmClass: 'btn-danger'
    });

    if (!confirmed) return;

    try {
        showLoading();
        await window.AdminServices.deleteCategory(id);
        showToast('Xóa danh mục thành công', 'success');
        loadCategories();
    } catch (error) {
        console.error('Error deleting category:', error);
        showToast('Không thể xóa danh mục', 'error');
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
                const data = {};
                for (let [key, value] of formData.entries()) {
                    data[key] = value;
                }
                data.isVisible = formElement.querySelector('[name="isVisible"]')?.checked || false;
                if (!data.categoryBook_id) delete data.categoryBook_id;
                
                try {
                    AdminUIComponents.showLoading('Đang lưu...');
                    await window.AdminServices.createCategory(data);
                    showToast('Tạo danh mục thành công', 'success');
                    modal.remove();
                    loadCategories();
                } catch (error) {
                    showToast(error.message || 'Không thể tạo danh mục', 'error');
                } finally {
                    AdminUIComponents.hideLoading();
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

window.editCategory = editCategory;
window.viewCategory = viewCategory;
window.deleteCategory = deleteCategory;

