/**
 * Admin Products Management JavaScript
 */

// Helper: Đợi AdminServices sẵn sàng
function waitForAdminServices(maxWait = 5000) {
    return new Promise((resolve, reject) => {
        if (window.AdminServices && typeof window.AdminServices.getBooks === 'function') {
            resolve(window.AdminServices);
            return;
        }
        
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (window.AdminServices && typeof window.AdminServices.getBooks === 'function') {
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
let pageSize = 10; // Giới hạn 10 sản phẩm mỗi trang
let totalPages = 1;
let filters = {
    search: '',
    category: '',
    status: '',
    featured: '',
    stock: ''
};
let sortBy = 'createdAt'; // Mặc định sắp xếp theo ngày tạo
let sortOrder = 'desc'; // Mặc định giảm dần

document.addEventListener('DOMContentLoaded', async function() {
    const pathname = window.location.pathname;
    console.log('📚 Products page - pathname:', pathname);
    
    // Check if we're on products page (flexible check)
    if (pathname === '/products' || pathname.includes('/products') || pathname.endsWith('products.html')) {
        console.log('📚 Initializing products page...');
        try {
            await waitForAdminServices();
            console.log('📚 AdminServices ready, initializing page...');
            initProductsPage();
        } catch (error) {
            console.error('❌ Error waiting for AdminServices:', error);
            if (typeof showToast === 'function') {
                showToast('Không thể tải AdminServices. Vui lòng reload trang.', 'error');
            }
        }
    } else {
        console.log('📚 Not on products page, skipping initialization');
    }
});

async function initProductsPage() {
    console.log('📚 initProductsPage called');
    try {
        console.log('📚 Loading categories first...');
        await loadCategories();
        console.log('📚 Categories loaded, setting up event listeners...');
        setupEventListeners();
        console.log('📚 Event listeners setup, loading products...');
        loadProducts();
    } catch (error) {
        console.error('❌ Error initializing products page:', error);
        if (typeof showToast === 'function') {
            showToast('Không thể khởi tạo trang sản phẩm: ' + error.message, 'error');
        }
    }
}

function setupEventListeners() {
    // Search with debounce
    const searchInput = document.getElementById('searchInput');
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
                loadProducts();
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
                loadProducts();
            });
        }
    }

    // Filters
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            filters.category = e.target.value;
            currentPage = 1;
            loadProducts();
        });
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            filters.status = e.target.value;
            currentPage = 1;
            loadProducts();
        });
    }
    
    // Quick filters
    const featuredFilter = document.getElementById('featuredFilter');
    if (featuredFilter) {
        featuredFilter.addEventListener('change', (e) => {
            filters.featured = e.target.value;
            currentPage = 1;
            loadProducts();
        });
    }
    
    const stockFilter = document.getElementById('stockFilter');
    if (stockFilter) {
        stockFilter.addEventListener('change', (e) => {
            filters.stock = e.target.value;
            currentPage = 1;
            loadProducts();
        });
    }

    // Sort
    const sortBySelect = document.getElementById('sortBy');
    if (sortBySelect) {
        sortBySelect.addEventListener('change', (e) => {
            sortBy = e.target.value;
            currentPage = 1;
            loadProducts();
        });
    }

    const sortOrderSelect = document.getElementById('sortOrder');
    if (sortOrderSelect) {
        sortOrderSelect.addEventListener('change', (e) => {
            sortOrder = e.target.value;
            currentPage = 1;
            loadProducts();
        });
    }
    
    // Clear all filters
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            filters = { search: '', category: '', status: '', featured: '', stock: '' };
            sortBy = 'createdAt';
            sortOrder = 'desc';
            currentPage = 1;
            
            // Reset form inputs
            if (searchInput) searchInput.value = '';
            if (categoryFilter) categoryFilter.value = '';
            if (statusFilter) statusFilter.value = '';
            if (featuredFilter) featuredFilter.value = '';
            if (stockFilter) stockFilter.value = '';
            if (sortBySelect) sortBySelect.value = 'createdAt';
            if (sortOrderSelect) sortOrderSelect.value = 'desc';
            
            loadProducts();
            showToast('Đã xóa tất cả bộ lọc', 'info');
        });
    }

    // Pagination
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    if (prevPage) prevPage.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadProducts();
        }
    });
    if (nextPage) nextPage.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadProducts();
        }
    });

    // Actions
    const addBookBtn = document.getElementById('addBookBtn');
    if (addBookBtn) {
        addBookBtn.addEventListener('click', () => {
            showAddBookModal();
        });
    }

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadProducts();
        });
    }

    const trashBtn = document.getElementById('trashBtn');
    if (trashBtn) {
        trashBtn.addEventListener('click', () => {
            window.location.href = '/trashbooks';
        });
    }
}

async function loadCategories() {
    try {
        const categories = await window.AdminServices.getCategories();
        const categoryFilter = document.getElementById('categoryFilter');
        // API có thể trả về array trực tiếp hoặc { categories: [...] }
        const categoriesList = Array.isArray(categories) ? categories : (categories.categories || categories.data || []);
        if (categoryFilter && categoriesList.length > 0) {
            categoriesList.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat._id;
                option.textContent = cat.name;
                categoryFilter.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Refresh products data (optimized version)
async function refreshProductsData() {
    // Reset to first page when refreshing after CRUD
    currentPage = 1;
    await loadProducts();
}

async function loadProducts() {
    showLoading();
    
    try {
        if (!window.AdminServices) {
            throw new Error('AdminServices is not loaded');
        }
        
        // Theo tài liệu: GET /api/books/admin hỗ trợ: page, limit, category, status, search
        // KHÔNG hỗ trợ sortBy/sortOrder (mặc định sort theo createdAt desc)
        const params = {
            page: currentPage,
            limit: pageSize
        };
        
        if (filters.search) params.search = filters.search;
        if (filters.category) params.category = filters.category;
        // Status filter: in_stock hoặc out_of_stock
        if (filters.status) {
            params.status = filters.status;
        } else if (filters.stock) {
            // Stock filter có thể override status
            params.status = filters.stock;
        }
        // Featured filter không được hỗ trợ trong API, sẽ filter client-side nếu cần

        console.log('📚 Loading books with params:', params);
        const response = await window.AdminServices.getBooks(params);
        console.log('📚 Books response received:', response);
        
        // API trả về { books: [...], pagination: {...} } hoặc { books: [...], total, page, limit, pages }
        const books = response.books || response.data || (Array.isArray(response) ? response : []);
        
        // Đảm bảo chỉ render số sản phẩm trong trang hiện tại (không render tất cả)
        if (Array.isArray(books) && books.length > 0) {
            renderProducts(books);
            
            // Xử lý pagination từ response
            let paginationData;
            if (response.pagination) {
                paginationData = response.pagination;
            } else {
                // Tính toán từ response trực tiếp
                const total = response.total || response.pagination?.total || books.length;
                const limit = response.limit || response.pagination?.limit || pageSize;
                const page = response.page || response.pagination?.page || currentPage;
                const pages = response.pages || response.pagination?.pages || response.pagination?.totalPages || Math.ceil(total / limit);
                
                paginationData = {
                    page: page,
                    limit: limit,
                    total: total,
                    pages: pages,
                    totalPages: pages // Hỗ trợ cả pages và totalPages
                };
                
                // Cập nhật currentPage từ response
                if (response.page) {
                    currentPage = response.page;
                }
            }
            
            updatePagination(paginationData);
        } else {
            renderProducts([]);
            updatePagination({ page: 1, limit: pageSize, total: 0, pages: 1, totalPages: 1 });
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Không thể tải danh sách sản phẩm', 'error');
        renderProducts([]);
    } finally {
        hideLoading();
    }
}

// Helper function để escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper function để validate và safe image URL
function safeImageUrl(url) {
    const placeholderSvg = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'50\' height=\'70\'%3E%3Crect width=\'50\' height=\'70\' fill=\'%23e5e7eb\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%239ca3af\' font-size=\'10\'%3ENo Image%3C/text%3E%3C/svg%3E';
    if (!url) return placeholderSvg;
    if (url.startsWith('data:')) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
        try {
            new URL(url);
            return url;
        } catch (e) {
            return placeholderSvg;
        }
    }
    return placeholderSvg;
}

function renderProducts(products) {
    console.log('📚 renderProducts called with', products.length, 'products');
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) {
        console.warn('⚠️ productsTableBody element not found');
        return;
    }

    // Add fade animation
    tbody.style.opacity = '0.5';
    tbody.style.transition = 'opacity 0.2s';

    setTimeout(() => {
        if (products.length === 0) {
            console.log('📚 No products to render');
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 3rem;">
                        <i class="fas fa-inbox" style="font-size: 3rem; color: #d1d5db; margin-bottom: 1rem;"></i>
                        <p style="color: #6b7280;">Không tìm thấy sản phẩm nào</p>
                    </td>
                </tr>
            `;
            tbody.style.opacity = '1';
            return;
        }

        tbody.innerHTML = products.map(book => {
        // Escape tất cả các giá trị để tránh XSS và syntax errors
        const bookId = book._id || '';
        const title = escapeHtml(book.title || 'N/A');
        const author = escapeHtml(book.author || 'N/A');
        const categories = book.categories?.map(c => escapeHtml(c.name || c)).join(', ') || 'N/A';
        const price = window.AdminServices ? window.AdminServices.formatCurrency(book.price || 0) : (book.price || 0).toLocaleString('vi-VN') + ' ₫';
        const stock = book.stock || 0;
        const imageUrl = safeImageUrl(book.thumbnail || book.cover_images?.[0]);
        const featured = book.featured ? '<span class="badge" style="background: #f59e0b; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500;">Nổi bật</span>' : '';
        
        return `
        <tr style="transition: background-color 0.2s;">
            <td style="vertical-align: middle;">
                <input type="checkbox" class="product-checkbox" value="${bookId}">
            </td>
            <td style="vertical-align: middle;">
                <img src="${imageUrl}" 
                     alt="${title}" 
                     style="width: 50px; height: 70px; object-fit: cover; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                     onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'50\' height=\'70\'%3E%3Crect width=\'50\' height=\'70\' fill=\'%23e5e7eb\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%239ca3af\' font-size=\'10\'%3ENo Image%3C/text%3E%3C/svg%3E'">
            </td>
            <td style="vertical-align: middle;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <strong style="color: #1f2937; font-size: 0.95rem;">${title}</strong>
                    ${featured}
                </div>
            </td>
            <td style="vertical-align: middle; color: #4b5563;">${author}</td>
            <td style="vertical-align: middle; color: #4b5563; font-size: 0.9rem;">${categories}</td>
            <td style="vertical-align: middle;"><strong style="color: #dc2626; font-size: 1rem;">${price}</strong></td>
            <td style="vertical-align: middle;">
                <span style="color: ${stock > 0 ? '#10b981' : '#ef4444'}; font-weight: 600;">
                    ${stock}
                </span>
            </td>
            <td style="vertical-align: middle;">
                <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 500; background: ${stock > 0 ? '#d1fae5' : '#fee2e2'}; color: ${stock > 0 ? '#065f46' : '#991b1b'};">
                    ${stock > 0 ? 'Còn hàng' : 'Hết hàng'}
                </span>
            </td>
            <td style="vertical-align: middle;">
                <div style="display: flex; gap: 0.5rem; justify-content: center;">
                    <button class="btn btn-sm btn-primary" onclick="viewBook('${bookId}')" title="Xem chi tiết" style="padding: 0.5rem; min-width: 36px;">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="editBook('${bookId}')" title="Chỉnh sửa" style="padding: 0.5rem; min-width: 36px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteBook('${bookId}')" title="Xóa" style="padding: 0.5rem; min-width: 36px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
        }).join('');

        // Update count
        const countEl = document.getElementById('productsCount');
        if (countEl) {
            countEl.textContent = `${products.length} sản phẩm`;
        }
        
        // Fade in animation
        setTimeout(() => {
            tbody.style.opacity = '1';
        }, 50);
    }, 200);
}

function updatePagination(pagination) {
    // Hỗ trợ cả pages và totalPages từ API
    totalPages = pagination.totalPages || pagination.pages || 1;
    
    // Cập nhật currentPage nếu có trong pagination
    if (pagination.page) {
        currentPage = pagination.page;
    }
    
    const currentPageEl = document.getElementById('currentPage');
    const totalPagesEl = document.getElementById('totalPages');
    const totalItemsEl = document.getElementById('totalItems');
    const pageInfoEl = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    // Update pagination info with better formatting
    if (currentPageEl) currentPageEl.textContent = currentPage;
    if (totalPagesEl) totalPagesEl.textContent = totalPages;
    if (totalItemsEl) {
        const total = pagination.total || 0;
        totalItemsEl.textContent = total.toLocaleString('vi-VN');
    }
    if (pageInfoEl) {
        const total = pagination.total || 0;
        const start = total > 0 ? (currentPage - 1) * pageSize + 1 : 0;
        const end = Math.min(currentPage * pageSize, total);
        const totalItemsSpan = pageInfoEl.querySelector('#totalItems') || document.getElementById('totalItems');
        if (totalItemsSpan) {
            totalItemsSpan.textContent = total.toLocaleString('vi-VN');
        }
        const pageInfoSpan = pageInfoEl.querySelector('span:not(#totalItems)');
        if (pageInfoSpan) {
            pageInfoSpan.textContent = `${start.toLocaleString('vi-VN')}-${end.toLocaleString('vi-VN')}`;
        } else {
            pageInfoEl.innerHTML = `Hiển thị <span>${start.toLocaleString('vi-VN')}-${end.toLocaleString('vi-VN')}</span> của <span id="totalItems">${total.toLocaleString('vi-VN')}</span> sản phẩm`;
        }
    }
    
    // Update button states with better UX
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
        prevBtn.style.opacity = currentPage <= 1 ? '0.5' : '1';
        prevBtn.style.cursor = currentPage <= 1 ? 'not-allowed' : 'pointer';
        prevBtn.title = currentPage <= 1 ? 'Đã ở trang đầu' : 'Trang trước';
    }
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.style.opacity = currentPage >= totalPages ? '0.5' : '1';
        nextBtn.style.cursor = currentPage >= totalPages ? 'not-allowed' : 'pointer';
        nextBtn.title = currentPage >= totalPages ? 'Đã ở trang cuối' : 'Trang sau';
    }
}

// Actions
function editBook(id) {
    showEditBookModal(id);
}

async function viewBook(id) {
    try {
        console.log('📚 viewBook called with id:', id);
        showLoading();
        const book = await window.AdminServices.getBook(id);
        console.log('📚 Book details loaded:', book);
        hideLoading();
        
        if (!book) {
            showToast('Không tìm thấy sản phẩm', 'error');
            return;
        }
        
        // Escape tất cả các giá trị để tránh XSS và syntax errors
        const title = escapeHtml(book.title || 'N/A');
        const author = escapeHtml(book.author || 'N/A');
        const price = window.AdminServices.formatCurrency(book.price || 0);
        const stock = book.stock || 0;
        const categories = book.categories?.map(c => escapeHtml(c.name || c)).join(', ') || 'N/A';
        const description = escapeHtml(book.description || 'Chưa có mô tả');
        const imageUrl = safeImageUrl(book.thumbnail || book.cover_images?.[0]);
        const placeholderSvg = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'300\'%3E%3Crect width=\'200\' height=\'300\' fill=\'%23e5e7eb\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%239ca3af\' font-size=\'14\'%3ENo Image%3C/text%3E%3C/svg%3E';
        const featured = book.featured ? '<span class="badge" style="background: #f59e0b; color: white; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.85rem; margin-top: 0.5rem; display: inline-block;">Nổi bật</span>' : '';
        
        // Hiển thị modal chi tiết sản phẩm
        const modal = AdminUIComponents.createModal({
            title: 'Chi tiết sản phẩm',
            content: `
                <div style="padding: 1.5rem;">
                    <div style="display: grid; grid-template-columns: 200px 1fr; gap: 2rem; margin-bottom: 2rem;">
                        <div>
                            <img src="${imageUrl}" 
                                 alt="${title}" 
                                 style="width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
                                 onerror="this.onerror=null; this.src='${placeholderSvg}'">
                        </div>
                        <div>
                            <h2 style="margin: 0 0 1rem 0; color: #1f2937;">${title}</h2>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Tác giả:</strong> ${author}</p>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Giá:</strong> <span style="color: #dc2626; font-size: 1.25rem; font-weight: bold;">${price}</span></p>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Tồn kho:</strong> ${stock}</p>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Danh mục:</strong> ${categories}</p>
                            ${featured}
                        </div>
                    </div>
                    <div style="margin-top: 1.5rem;">
                        <h3 style="margin: 0 0 1rem 0; color: #1f2937;">Mô tả</h3>
                        <p style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${description}</p>
                    </div>
                </div>
            `,
            size: 'large',
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
                    onClick: `this.closest('.admin-modal-overlay').remove(); editBook('${id}');`
                }
            ]
        });
        console.log('📚 Modal created successfully');
    } catch (error) {
        hideLoading();
        console.error('❌ Error loading book details:', error);
        showToast('Không thể tải chi tiết sản phẩm: ' + (error.message || 'Unknown error'), 'error');
    }
}

async function deleteBook(id) {
    const confirmed = await AdminUIComponents.confirm({
        title: 'Xóa sản phẩm',
        message: 'Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này có thể khôi phục.',
        confirmText: 'Xóa',
        cancelText: 'Hủy',
        confirmClass: 'btn-danger'
    });

    if (!confirmed) return;

    try {
        showLoading();
        await window.AdminServices.deleteBook(id);
        showToast('✅ Xóa sản phẩm thành công!', 'success');
        // Refresh data without reloading page
        await refreshProductsData();
    } catch (error) {
        console.error('Error deleting book:', error);
        showToast('❌ ' + (error.message || 'Không thể xóa sản phẩm'), 'error');
    } finally {
        hideLoading();
    }
}

async function showAddBookModal() {
    try {
        // Load categories for the form
        const categories = await window.AdminServices.getCategories();
        const categoriesList = Array.isArray(categories) ? categories : (categories.categories || categories.data || []);
        
        const form = AdminCRUDForms.createBookForm();
        
        // Add categories select if not exists
        const categoriesSelect = form.querySelector('[name="categories"]');
        if (!categoriesSelect && categoriesList.length > 0) {
            // Add categories field to form
            const categoriesField = document.createElement('div');
            categoriesField.className = 'form-group';
            categoriesField.innerHTML = `
                <label class="form-label">Danh mục</label>
                <select name="categories" class="form-select" multiple style="min-height: 100px;">
                    ${categoriesList.map(cat => `<option value="${cat._id}">${cat.name}</option>`).join('')}
                </select>
                <small class="form-help-text" style="color: #6b7280; font-size: 0.85rem;">Giữ Ctrl/Cmd để chọn nhiều danh mục</small>
            `;
            form.insertBefore(categoriesField, form.querySelector('.form-group:last-child'));
        }
        
        const modal = AdminUIComponents.createModal({
            title: 'Thêm sách mới',
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
        
        // Re-attach form submit handler
        const formElement = modal.querySelector('form');
    if (formElement) {
        formElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(formElement);
            
            // Handle checkbox
            const featured = formElement.querySelector('[name="featured"]')?.checked || false;
            formData.set('featured', featured);
            
            // Handle categories array
            const categoryInputs = formElement.querySelectorAll('[name="categories"]:checked, select[name="categories"] option:checked');
            if (categoryInputs.length > 0) {
                // Remove old categories entries
                formData.delete('categories');
                categoryInputs.forEach(opt => {
                    if (opt.value) {
                        formData.append('categories', opt.value);
                    }
                });
            }
            
            // Convert number fields
            const price = formData.get('price');
            if (price) formData.set('price', parseFloat(price));
            const stock = formData.get('stock');
            if (stock) formData.set('stock', parseInt(stock));
            const pageCount = formData.get('page_count');
            if (pageCount) formData.set('page_count', parseInt(pageCount));
            const weight = formData.get('weight');
            if (weight) formData.set('weight', parseFloat(weight));
            
            try {
                AdminUIComponents.showLoading('Đang lưu...');
                const result = await window.AdminServices.createBook(formData);
                showToast('✅ Tạo sách thành công!', 'success');
                modal.remove();
                // Refresh data without reloading page
                await refreshProductsData();
            } catch (error) {
                console.error('Error creating book:', error);
                showToast('❌ ' + (error.message || 'Không thể tạo sách'), 'error');
            } finally {
                AdminUIComponents.hideLoading();
            }
        });
    }
    } catch (error) {
        console.error('Error loading categories:', error);
        showToast('Không thể tải danh sách danh mục', 'error');
    }
}

function showEditBookModal(bookId) {
    AdminUIComponents.showLoading('Đang tải...');
    Promise.all([
        window.AdminServices.getBook(bookId),
        window.AdminServices.getCategories()
    ]).then(([book, categories]) => {
        AdminUIComponents.hideLoading();
        const categoriesList = Array.isArray(categories) ? categories : (categories.categories || categories.data || []);
        const form = AdminCRUDForms.createBookForm(book);
        
        // Add categories select if not exists
        const categoriesSelect = form.querySelector('[name="categories"]');
        if (!categoriesSelect && categoriesList.length > 0) {
            // Get current book categories
            const bookCategories = book.categories?.map(c => c._id || c) || [];
            
            // Add categories field to form
            const categoriesField = document.createElement('div');
            categoriesField.className = 'form-group';
            categoriesField.innerHTML = `
                <label class="form-label">Danh mục</label>
                <select name="categories" class="form-select" multiple style="min-height: 100px;">
                    ${categoriesList.map(cat => `<option value="${cat._id}" ${bookCategories.includes(cat._id) ? 'selected' : ''}>${cat.name}</option>`).join('')}
                </select>
                <small class="form-help-text" style="color: #6b7280; font-size: 0.85rem;">Giữ Ctrl/Cmd để chọn nhiều danh mục</small>
            `;
            form.insertBefore(categoriesField, form.querySelector('.form-group:last-child'));
        }
        
        const modal = AdminUIComponents.createModal({
            title: 'Sửa sách',
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
            formElement.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(formElement);
                
                // Handle checkbox
                const featured = formElement.querySelector('[name="featured"]')?.checked || false;
                formData.set('featured', featured);
                
                // Handle categories array
                const categoryInputs = formElement.querySelectorAll('[name="categories"]:checked, select[name="categories"] option:checked');
                if (categoryInputs.length > 0) {
                    // Remove old categories entries
                    formData.delete('categories');
                    categoryInputs.forEach(opt => {
                        if (opt.value) {
                            formData.append('categories', opt.value);
                        }
                    });
                }
                
                // Convert number fields
                const price = formData.get('price');
                if (price) formData.set('price', parseFloat(price));
                const stock = formData.get('stock');
                if (stock) formData.set('stock', parseInt(stock));
                const pageCount = formData.get('page_count');
                if (pageCount) formData.set('page_count', parseInt(pageCount));
                const weight = formData.get('weight');
                if (weight) formData.set('weight', parseFloat(weight));
                
                try {
                    AdminUIComponents.showLoading('Đang lưu...');
                    const result = await window.AdminServices.updateBook(bookId, formData);
                    showToast('✅ Cập nhật sách thành công!', 'success');
                    modal.remove();
                    // Refresh data without reloading page
                    await refreshProductsData();
                } catch (error) {
                    console.error('Error updating book:', error);
                    showToast('❌ ' + (error.message || 'Không thể cập nhật sách'), 'error');
                } finally {
                    AdminUIComponents.hideLoading();
                }
            });
        }
    }).catch(error => {
        AdminUIComponents.hideLoading();
        showToast('Không thể tải thông tin sách', 'error');
    });
}

// Export functions
window.editBook = editBook;
window.viewBook = viewBook;
window.deleteBook = deleteBook;

