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
    categories: [], // Changed to array for multi-select
    status: '',
    featured: ''
};
let sortBy = 'createdAt'; // Mặc định sắp xếp theo ngày tạo
let sortOrder = 'desc'; // Mặc định giảm dần
let allProducts = []; // Lưu tất cả sản phẩm đã tải để sắp xếp client-side
let allDeletedProducts = []; // Lưu tất cả sản phẩm đã xóa
let currentViewMode = 'active'; // 'active' or 'deleted'
let currentSortColumn = null; // Cột đang được sắp xếp
let currentSortDirection = null; // Hướng sắp xếp hiện tại (asc/desc)

// Autocomplete variables
let autocompleteTimeout = null;
let autocompleteAbortController = null;
let selectedAutocompleteIndex = -1;

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
        await loadCategoriesWithMap();
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
    // Search with debounce and autocomplete
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        
        // Create debounced search function
        const debouncedSearch = debounce(() => {
            filters.search = searchInput.value.trim();
            currentPage = 1;
            updateActiveFilters();
            applyFiltersAndRender();
        }, 500);
        
        searchInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            const clearSearchBtn = document.getElementById('clearSearchBtn');
            if (clearSearchBtn) {
                clearSearchBtn.style.display = value ? 'block' : 'none';
            }
            
            // Handle search based on current view mode
            if (currentViewMode === 'deleted') {
                // Search in deleted products (no autocomplete)
                handleDeletedProductsSearch(value);
            } else {
                // Search in active products (with autocomplete)
                if (value.length >= 2) {
                    // Show autocomplete immediately (client-side, fast)
                    handleProductsAutocomplete(value);
                    // Also trigger search for filtering existing products (debounced)
                    debouncedSearch();
                } else {
                    // Hide autocomplete if query is too short
                    const autocompleteDropdown = document.getElementById('productsAutocomplete');
                    if (autocompleteDropdown) {
                        autocompleteDropdown.style.display = 'none';
                        selectedAutocompleteIndex = -1;
                    }
                    
                    // If empty, show all products immediately
                    if (value.length === 0) {
                        filters.search = '';
                        currentPage = 1;
                        updateActiveFilters();
                        applyFiltersAndRender();
                    }
                }
            }
        });
        
        // Handle focus - show autocomplete if there's a query (only for active tab)
        searchInput.addEventListener('focus', function(e) {
            if (currentViewMode === 'deleted') {
                // Don't show autocomplete in deleted mode
                return;
            }
            const query = e.target.value.trim();
            if (query.length >= 2) {
                handleProductsAutocomplete(query);
            }
        });
        
        // Clear search button
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                clearSearchBtn.style.display = 'none';
                filters.search = '';
                currentPage = 1;
                
                // Hide autocomplete
                const autocompleteDropdown = document.getElementById('productsAutocomplete');
                if (autocompleteDropdown) {
                    autocompleteDropdown.style.display = 'none';
                }
                
                // Handle based on current view mode
                if (currentViewMode === 'deleted') {
                    handleDeletedProductsSearch('');
                } else {
                    updateActiveFilters();
                    applyFiltersAndRender();
                }
            });
        }
    }

    // Filters
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        // Make it look like a regular select but allow multi-select
        categoryFilter.addEventListener('change', (e) => {
            const selectedOptions = Array.from(e.target.selectedOptions);
            filters.categories = selectedOptions.map(opt => opt.value).filter(v => v !== '');
            currentPage = 1;
            updateActiveFilters();
            applyFiltersAndRender();
        });
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            filters.status = e.target.value;
            currentPage = 1;
            updateActiveFilters();
            applyFiltersAndRender();
        });
    }
    
    // Quick filters
    const featuredFilter = document.getElementById('featuredFilter');
    if (featuredFilter) {
        featuredFilter.addEventListener('change', (e) => {
            filters.featured = e.target.value;
            currentPage = 1;
            updateActiveFilters();
            applyFiltersAndRender();
        });
    }
    
    // Clear all filters
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            clearAllFilters();
        });
    }

    // Pagination
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    if (prevPage) prevPage.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            applyFiltersAndRender();
        }
    });
    if (nextPage) nextPage.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            applyFiltersAndRender();
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

    // View mode toggle (Active/Deleted)
    const activeTab = document.getElementById('activeTab');
    const deletedTab = document.getElementById('deletedTab');
    if (activeTab) {
        activeTab.addEventListener('click', () => {
            switchViewMode('active');
        });
    }
    if (deletedTab) {
        deletedTab.addEventListener('click', () => {
            switchViewMode('deleted');
        });
    }

    // Refresh deleted products button
    const refreshDeletedBtn = document.getElementById('refreshDeletedBtn');
    if (refreshDeletedBtn) {
        refreshDeletedBtn.addEventListener('click', () => {
            loadDeletedProducts();
        });
    }

    // Setup sortable column headers
    setupSortableColumns();
}

// Switch view mode between active and deleted products
function switchViewMode(mode) {
    currentViewMode = mode;
    const activeView = document.getElementById('activeProductsView');
    const deletedView = document.getElementById('deletedProductsView');
    const activeTab = document.getElementById('activeTab');
    const deletedTab = document.getElementById('deletedTab');
    const viewModeText = document.getElementById('viewModeText');
    
    // Hide autocomplete when switching tabs
    const autocompleteDropdown = document.getElementById('productsAutocomplete');
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
        if (viewModeText) viewModeText.textContent = 'Danh sách sản phẩm';
        // Load active products if not loaded
        if (allProducts.length === 0) {
            loadProducts();
        } else {
            // Apply current search if exists
            const searchInput = document.getElementById('searchInput');
            if (searchInput && searchInput.value.trim()) {
                applyFiltersAndRender();
            } else {
                applyFiltersAndRender();
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
        if (viewModeText) viewModeText.textContent = 'Sản phẩm đã xóa';
        // Load deleted products
        loadDeletedProducts();
    }
}

// Load deleted products
async function loadDeletedProducts() {
    if (typeof showLoading === 'function') {
        showLoading();
    }

    try {
        if (!window.AdminServices) {
            throw new Error('AdminServices is not loaded');
        }

        console.log('🗑️ Loading deleted books...');
        const response = await window.AdminServices.getTrashBooks();
        console.log('🗑️ Deleted books response:', response);

        // Extract deleted products from response
        const extractDataFunc = window.extractData || function(resp, key) {
            if (!resp) return [];
            if (Array.isArray(resp)) return resp;
            if (key && resp[key]) return Array.isArray(resp[key]) ? resp[key] : [];
            if (resp.data) return Array.isArray(resp.data) ? resp.data : [];
            if (resp.books) return Array.isArray(resp.books) ? resp.books : [];
            return [];
        };

        allDeletedProducts = extractDataFunc(response, 'books');
        console.log('🗑️ Loaded deleted products:', allDeletedProducts.length);

        // Apply search filter if exists
        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput ? searchInput.value.trim() : '';
        
        if (searchTerm) {
            handleDeletedProductsSearch(searchTerm);
        } else {
            // Render deleted products
            renderDeletedProducts(allDeletedProducts, '');
        }

        // Update count
        const deletedCount = document.getElementById('deletedProductsCount');
        if (deletedCount) {
            const displayCount = searchTerm ? 
                allDeletedProducts.filter(p => {
                    const searchLower = searchTerm.toLowerCase();
                    const title = (p.title || '').toLowerCase();
                    const author = (p.author || '').toLowerCase();
                    return title.includes(searchLower) || author.includes(searchLower);
                }).length : allDeletedProducts.length;
            deletedCount.textContent = `${displayCount} sản phẩm đã xóa`;
        }
    } catch (error) {
        console.error('❌ Error loading deleted products:', error);
        if (typeof showToast === 'function') {
            showToast('Không thể tải danh sách sản phẩm đã xóa: ' + error.message, 'error');
        }
        const tbody = document.getElementById('deletedProductsTableBody');
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
        if (typeof hideLoading === 'function') {
            hideLoading();
        }
    }
}

// Render deleted products with search highlighting
function renderDeletedProducts(products, searchTerm = '') {
    const tbody = document.getElementById('deletedProductsTableBody');
    if (!tbody) return;

    if (!products || products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-inbox" style="font-size: 3rem; color: #d1d5db; margin-bottom: 1rem;"></i>
                    <p style="color: #6b7280;">${searchTerm ? 'Không tìm thấy sản phẩm nào' : 'Không có sản phẩm nào đã xóa'}</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = products.map(product => {
        const imageUrl = product.thumbnail || product.image || 'https://server-shelf-stacker-w1ds.onrender.com/assets/images/default-thumbnail.png';
        const deletedAt = product.deletedAt ? new Date(product.deletedAt).toLocaleString('vi-VN') : 'N/A';
        const price = product.price ? Number(product.price).toLocaleString('vi-VN') + '₫' : 'N/A';

        // Highlight search term in title and author
        const titleDisplay = searchTerm ? highlightSearchText(product.title || 'N/A', searchTerm) : escapeHtml(product.title || 'N/A');
        const authorDisplay = searchTerm ? highlightSearchText(product.author || 'N/A', searchTerm) : escapeHtml(product.author || 'N/A');

        return `
            <tr style="opacity: 0.8;">
                <td style="vertical-align: middle;">
                    <img src="${imageUrl}" 
                         style="width: 50px; height: 70px; object-fit: cover; border-radius: 4px;" 
                         alt="${escapeHtml(product.title || '')}" />
                </td>
                <td style="vertical-align: middle;">
                    <strong style="color: #1f2937;">${titleDisplay}</strong>
                </td>
                <td style="vertical-align: middle; color: #4b5563;">${authorDisplay}</td>
                <td style="vertical-align: middle; color: #4b5563;">${price}</td>
                <td style="vertical-align: middle; color: #6b7280; font-size: 0.875rem;">${deletedAt}</td>
                <td style="vertical-align: middle;">
                    <div style="display: flex; gap: 0.5rem; justify-content: center;">
                        <button onclick="restoreProduct('${product._id}')" class="btn btn-sm btn-success" title="Khôi phục" style="padding: 0.5rem 1rem;">
                            <i class="fas fa-undo"></i> Khôi phục
                        </button>
                        <button onclick="permanentlyDeleteProduct('${product._id}')" class="btn btn-sm btn-danger" title="Xóa vĩnh viễn" style="padding: 0.5rem 1rem;">
                            <i class="fas fa-trash-alt"></i> Xóa vĩnh viễn
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Handle search for deleted products
function handleDeletedProductsSearch(searchTerm) {
    if (!searchTerm) {
        renderDeletedProducts(allDeletedProducts, '');
        // Update count
        const deletedCount = document.getElementById('deletedProductsCount');
        if (deletedCount) {
            deletedCount.textContent = `${allDeletedProducts.length} sản phẩm đã xóa`;
        }
        return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = allDeletedProducts.filter(product => {
        const title = (product.title || '').toLowerCase();
        const author = (product.author || '').toLowerCase();
        return title.includes(searchLower) || author.includes(searchLower);
    });

    renderDeletedProducts(filtered, searchTerm);
    
    // Update count
    const deletedCount = document.getElementById('deletedProductsCount');
    if (deletedCount) {
        deletedCount.textContent = `${filtered.length} sản phẩm đã xóa`;
    }
}

// Restore product
async function restoreProduct(productId) {
    if (!confirm('Bạn có chắc muốn khôi phục sản phẩm này?')) {
        return;
    }

    if (typeof showLoading === 'function') {
        showLoading();
    }

    try {
        if (!window.AdminServices) {
            throw new Error('AdminServices is not loaded');
        }

        await window.AdminServices.restoreBook(productId);
        
        if (typeof showToast === 'function') {
            showToast('Khôi phục sản phẩm thành công', 'success');
        }

        // Reload based on current view mode
        if (currentViewMode === 'deleted') {
            await loadDeletedProducts();
        } else {
            await loadProducts();
        }
    } catch (error) {
        console.error('❌ Error restoring product:', error);
        if (typeof showToast === 'function') {
            showToast('Không thể khôi phục sản phẩm: ' + error.message, 'error');
        }
    } finally {
        if (typeof hideLoading === 'function') {
            hideLoading();
        }
    }
}

// Permanently delete product
async function permanentlyDeleteProduct(productId) {
    const product = allDeletedProducts.find(p => p._id === productId);
    const productName = product ? (product.title || 'sản phẩm này') : 'sản phẩm này';
    
    if (!confirm(`Bạn có chắc muốn XÓA VĨNH VIỄN "${productName}"?\n\nHành động này không thể hoàn tác!`)) {
        return;
    }

    if (typeof showLoading === 'function') {
        showLoading();
    }

    try {
        if (!window.AdminServices) {
            throw new Error('AdminServices is not loaded');
        }

        await window.AdminServices.forceDeleteBook(productId);
        
        if (typeof showToast === 'function') {
            showToast('Xóa vĩnh viễn sản phẩm thành công', 'success');
        }

        // Reload deleted products
        await loadDeletedProducts();
    } catch (error) {
        console.error('❌ Error permanently deleting product:', error);
        if (typeof showToast === 'function') {
            showToast('Không thể xóa vĩnh viễn sản phẩm: ' + error.message, 'error');
        }
    } finally {
        if (typeof hideLoading === 'function') {
            hideLoading();
        }
    }
}

// Export functions
window.restoreProduct = restoreProduct;
window.permanentlyDeleteProduct = permanentlyDeleteProduct;

// Setup sortable columns
function setupSortableColumns() {
    const sortableHeaders = document.querySelectorAll('.table th.sortable');
    sortableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const sortField = this.getAttribute('data-sort');
            handleColumnSort(sortField, this);
        });
    });
}

// Handle column sorting
function handleColumnSort(field, headerElement) {
    // Remove sort classes from all headers
    document.querySelectorAll('.table th.sortable').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc', 'sort-none');
    });

    // Determine new sort direction
    if (currentSortColumn === field) {
        // Toggle direction if clicking same column
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        // Default to ascending for new column
        currentSortDirection = 'asc';
        currentSortColumn = field;
    }

    // Add sort class to current header
    headerElement.classList.add(`sort-${currentSortDirection}`);

    // Sort products
    sortProducts(field, currentSortDirection);
    
    // Re-render products
    applyFiltersAndRender();
}

// Sort products array
function sortProducts(field, direction) {
    if (!allProducts || allProducts.length === 0) return;

    allProducts.sort((a, b) => {
        let aValue, bValue;

        switch(field) {
            case 'title':
                aValue = (a.title || '').toLowerCase();
                bValue = (b.title || '').toLowerCase();
                break;
            case 'author':
                aValue = (a.author || '').toLowerCase();
                bValue = (b.author || '').toLowerCase();
                break;
            case 'category':
                aValue = (a.categories && a.categories.length > 0) 
                    ? (a.categories[0].name || a.categories[0] || '').toLowerCase()
                    : '';
                bValue = (b.categories && b.categories.length > 0)
                    ? (b.categories[0].name || b.categories[0] || '').toLowerCase()
                    : '';
                break;
            case 'price':
                aValue = parseFloat(a.price || 0);
                bValue = parseFloat(b.price || 0);
                break;
            default:
                return 0;
        }

        // Compare values
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            if (direction === 'asc') {
                return aValue.localeCompare(bValue, 'vi');
            } else {
                return bValue.localeCompare(aValue, 'vi');
            }
        } else {
            // Numeric comparison
            if (direction === 'asc') {
                return aValue - bValue;
            } else {
                return bValue - aValue;
            }
        }
    });
}

// Apply filters and render products
function applyFiltersAndRender() {
    let filteredProducts = [...allProducts];

    // Apply search filter
    if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredProducts = filteredProducts.filter(product => {
            const title = (product.title || '').toLowerCase();
            const author = (product.author || '').toLowerCase();
            return title.includes(searchTerm) || author.includes(searchTerm);
        });
    }

    // Apply category filter (multi-select)
    if (filters.categories && filters.categories.length > 0) {
        filteredProducts = filteredProducts.filter(product => {
            if (!product.categories || product.categories.length === 0) return false;
            return filters.categories.some(catId => 
                product.categories.some(cat => (cat._id || cat) === catId)
            );
        });
    }

    // Apply status filter (stock)
    if (filters.status) {
        filteredProducts = filteredProducts.filter(product => {
            const stock = product.stock || 0;
            if (filters.status === 'in_stock') return stock > 0;
            if (filters.status === 'out_of_stock') return stock === 0;
            return true;
        });
    }

    // Apply featured filter
    if (filters.featured) {
        filteredProducts = filteredProducts.filter(product => {
            if (filters.featured === 'true') return product.featured === true;
            if (filters.featured === 'false') return product.featured !== true;
            return true;
        });
    }

    // Update total pages based on filtered results
    totalPages = Math.ceil(filteredProducts.length / pageSize);
    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    }

    // Paginate
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const paginatedProducts = filteredProducts.slice(startIdx, endIdx);

    // Render
    renderProducts(paginatedProducts);
    updatePagination({
        page: currentPage,
        limit: pageSize,
        total: filteredProducts.length,
        totalPages: totalPages
    });
    updateActiveFilters();
}

// Store categories map for display
let categoriesMap = {};

async function loadCategoriesWithMap() {
    try {
        const categories = await window.AdminServices.getCategories();
        const categoriesList = Array.isArray(categories) ? categories : (categories.categories || categories.data || []);
        categoriesMap = {};
        categoriesList.forEach(cat => {
            categoriesMap[cat._id] = cat.name;
        });
        await loadCategories();
    } catch (error) {
        console.error('Error loading categories map:', error);
    }
}

async function loadCategories() {
    try {
        const categories = await window.AdminServices.getCategories();
        const categoryFilter = document.getElementById('categoryFilter');
        // API có thể trả về array trực tiếp hoặc { categories: [...] }
        const categoriesList = Array.isArray(categories) ? categories : (categories.categories || categories.data || []);
        if (categoryFilter && categoriesList.length > 0) {
            // Clear existing options except "Tất cả danh mục"
            const allOption = categoryFilter.querySelector('option[value=""]');
            categoryFilter.innerHTML = '';
            if (allOption) categoryFilter.appendChild(allOption);
            
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

// Update active filters display
function updateActiveFilters() {
    const container = document.getElementById('activeFiltersContainer');
    if (!container) return;

    container.innerHTML = '';

    // Search filter
    if (filters.search) {
        const badge = createFilterBadge('Tìm kiếm', `"${filters.search}"`, 'search');
        container.appendChild(badge);
    }

    // Category filters
    if (filters.categories && filters.categories.length > 0) {
        filters.categories.forEach(catId => {
            const catName = categoriesMap[catId] || catId;
            const badge = createFilterBadge('Danh mục', catName, 'category', catId);
            container.appendChild(badge);
        });
    }

    // Status filter
    if (filters.status) {
        const statusText = filters.status === 'in_stock' ? 'Còn hàng' : 'Hết hàng';
        const badge = createFilterBadge('Trạng thái', statusText, 'status');
        container.appendChild(badge);
    }

    // Featured filter
    if (filters.featured) {
        const featuredText = filters.featured === 'true' ? 'Sách nổi bật' : 'Sách thường';
        const badge = createFilterBadge('Nổi bật', featuredText, 'featured');
        container.appendChild(badge);
    }

    // Show container if there are filters
    container.style.display = container.children.length > 0 ? 'flex' : 'none';
}

// Create filter badge
function createFilterBadge(label, value, filterType, filterValue = null) {
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
        <button type="button" class="filter-remove-btn" data-filter-type="${filterType}" data-filter-value="${filterValue || ''}" style="
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
        removeFilter(filterType, filterValue);
    });

    return badge;
}

// Remove individual filter
function removeFilter(filterType, filterValue) {
    switch(filterType) {
        case 'search':
            filters.search = '';
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.value = '';
            const clearSearchBtn = document.getElementById('clearSearchBtn');
            if (clearSearchBtn) clearSearchBtn.style.display = 'none';
            break;
        case 'category':
            filters.categories = filters.categories.filter(id => id !== filterValue);
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) {
                Array.from(categoryFilter.options).forEach(opt => {
                    if (opt.value === filterValue) opt.selected = false;
                });
            }
            break;
        case 'status':
            filters.status = '';
            const statusFilter = document.getElementById('statusFilter');
            if (statusFilter) statusFilter.value = '';
            break;
        case 'featured':
            filters.featured = '';
            const featuredFilter = document.getElementById('featuredFilter');
            if (featuredFilter) featuredFilter.value = '';
            break;
    }
    currentPage = 1;
    updateActiveFilters();
    applyFiltersAndRender();
}

// Clear all filters
function clearAllFilters() {
    filters = { search: '', categories: [], status: '', featured: '' };
    currentPage = 1;
    
    // Reset form inputs
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    if (clearSearchBtn) clearSearchBtn.style.display = 'none';
    
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        Array.from(categoryFilter.options).forEach(opt => opt.selected = false);
        if (categoryFilter.options[0]) categoryFilter.options[0].selected = true;
    }
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) statusFilter.value = '';
    
    const featuredFilter = document.getElementById('featuredFilter');
    if (featuredFilter) featuredFilter.value = '';
    
    updateActiveFilters();
    applyFiltersAndRender();
    if (typeof showToast === 'function') {
        showToast('Đã xóa tất cả bộ lọc', 'info');
    }
}

// Highlight search text in content
function highlightSearchText(text, searchTerm) {
    if (!searchTerm || !text) return escapeHtml(text);
    
    const escapedText = escapeHtml(text);
    const escapedSearch = escapeHtml(searchTerm);
    const regex = new RegExp(`(${escapedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    
    return escapedText.replace(regex, '<mark style="background-color: #fef08a; padding: 2px 4px; border-radius: 3px;">$1</mark>');
}

// Debounce helper function
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
        
        // Load tất cả products để có thể sắp xếp client-side chính xác
        // Sử dụng limit lớn để load tất cả (hoặc có thể load từng trang nếu cần)
        const params = {
            page: 1,
            limit: 1000 // Load nhiều products để sắp xếp chính xác
        };
        
        // Note: Không apply filters ở API level khi cần sắp xếp client-side
        // Ta sẽ filter và sort ở client-side để có kết quả chính xác
        
        console.log('📚 Loading all books for sorting...');
        const response = await window.AdminServices.getBooks(params);
        console.log('📚 Books response received:', response);
        console.log('📚 Response type:', typeof response);
        console.log('📚 Response keys:', response ? Object.keys(response) : 'null');
        
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
        
        // Extract books và pagination using helper functions
        const books = extractDataFunc(response, 'books');
        const paginationData = extractPaginationFunc(response, currentPage, pageSize);
        
        console.log('📚 Extracted books:', books.length);
        console.log('📚 Extracted pagination:', paginationData);
        
        // Lưu tất cả products để sắp xếp client-side
        // Note: Nếu API hỗ trợ pagination và có nhiều trang, cần load tất cả
        // Ở đây giả sử ta load từng trang, nhưng để sắp xếp tốt hơn nên load tất cả
        // Tạm thời lưu products hiện tại
        allProducts = books;
        
        // Cập nhật currentPage từ pagination
        if (paginationData.page) {
            currentPage = paginationData.page;
        }
        
        // Apply filters and render (includes sorting if any)
        if (allProducts.length > 0) {
            updateActiveFilters();
            applyFiltersAndRender();
        } else {
            renderProducts([]);
            updatePagination(paginationData);
            updateActiveFilters();
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

// Products autocomplete function
async function handleProductsAutocomplete(query) {
    // Don't show autocomplete in deleted mode
    if (currentViewMode === 'deleted') {
        const autocompleteDropdown = document.getElementById('productsAutocomplete');
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

    const autocompleteDropdown = document.getElementById('productsAutocomplete');
    if (!autocompleteDropdown) {
        console.warn('⚠️ productsAutocomplete element not found');
        return;
    }

    // If query is less than 2 characters, hide dropdown
    if (!query || query.length < 2) {
        autocompleteDropdown.style.display = 'none';
        selectedAutocompleteIndex = -1;
        return;
    }

    console.log('🔍 handleProductsAutocomplete called with query:', query);
    console.log('📦 allProducts length:', allProducts?.length || 0);
    
    // Helper function to get client-side suggestions
    const getClientSideSuggestions = (searchQuery) => {
        if (!allProducts || allProducts.length === 0) {
            console.warn('⚠️ allProducts is empty, cannot provide suggestions');
            return [];
        }
        
        const searchLower = searchQuery.toLowerCase();
        const filtered = allProducts.filter(product => {
            if (!product) return false;
            const title = (product.title || '').toLowerCase();
            const author = (product.author || '').toLowerCase();
            return title.includes(searchLower) || author.includes(searchLower);
        }).slice(0, 10);
        
        console.log('🔍 Client-side filtered results:', filtered.length);
        
        return filtered.map(p => ({
            id: p._id,
            label: `${p.title || 'N/A'} - ${p.author || 'N/A'}`,
            value: p.title || '',
            title: p.title,
            author: p.author,
            thumbnail: p.thumbnail || p.cover_images?.[0]
        }));
    };
    
    // Show client-side suggestions immediately (no debounce for display)
    // Don't show loading - show results immediately if available
    const clientSideSuggestions = getClientSideSuggestions(query);
    console.log('💡 Client-side suggestions:', clientSideSuggestions.length);
    
    if (clientSideSuggestions.length > 0) {
        // Show results immediately from client-side data (no loading state needed)
        renderProductsAutocompleteSuggestions(clientSideSuggestions, query);
    } else {
        // Show empty state only if no products loaded yet
        if (allProducts && allProducts.length > 0) {
            autocompleteDropdown.innerHTML = '<div class="autocomplete-empty">Không tìm thấy sản phẩm nào</div>';
        } else {
            autocompleteDropdown.innerHTML = '<div class="autocomplete-loading"><i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...</div>';
        }
        autocompleteDropdown.style.display = 'block';
    }
    
    // Optionally try API in background (if available, will update with better results)
    // But don't block UI - client-side results are shown immediately
    if (autocompleteTimeout) {
        clearTimeout(autocompleteTimeout);
    }
    
    autocompleteTimeout = setTimeout(async () => {
        try {
            // Create new AbortController for this request
            if (autocompleteAbortController) {
                autocompleteAbortController.abort();
            }
            autocompleteAbortController = new AbortController();
            
            // Get API base URL from AdminServices or use default
            let API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com/api';
            if (window.AdminServices && window.AdminServices.baseURL) {
                API_BASE_URL = window.AdminServices.baseURL;
            } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                API_BASE_URL = 'http://localhost:3000/api';
            }
            
            const token = localStorage.getItem('authToken') || localStorage.getItem('admin_token') || localStorage.getItem('access_token');
            
            console.log('🔍 Trying API autocomplete (background):', `${API_BASE_URL}/books/autocomplete?q=${query}`);
            
            const response = await fetch(`${API_BASE_URL}/books/autocomplete?q=${encodeURIComponent(query)}&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                signal: autocompleteAbortController.signal
            }).catch(err => {
                console.log('⚠️ Fetch error (expected if API not available):', err.message);
                return null;
            });

            if (response && response.ok) {
                const result = await response.json();
                console.log('📦 Autocomplete API response:', result);
                
                // If API returns data and has more/better results, update
                if (result.success && result.data && result.data.length > 0) {
                    // Update with API results
                    renderProductsAutocompleteSuggestions(result.data, query);
                }
            } else if (response) {
                console.log('⚠️ API autocomplete not available (status:', response.status, '), using client-side suggestions');
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                // Request was cancelled, ignore
                return;
            }
            console.log('⚠️ API autocomplete error (expected if API not available):', error.message);
            // Client-side suggestions already shown, no need to change
        }
    }, 200); // Smaller delay for API call since UI is already updated
}

// Render autocomplete suggestions for products
function renderProductsAutocompleteSuggestions(suggestions, query) {
    const autocompleteDropdown = document.getElementById('productsAutocomplete');
    if (!autocompleteDropdown) {
        console.warn('⚠️ productsAutocomplete element not found');
        return;
    }

    autocompleteDropdown.innerHTML = suggestions.map((item, index) => {
        const title = item.title || item.label || 'N/A';
        const author = item.author || '';
        const highlightedTitle = highlightSearchText(title, query);
        const highlightedAuthor = author ? highlightSearchText(author, query) : '';
        const thumbnail = item.thumbnail || '';
        const imageUrl = thumbnail ? safeImageUrl(thumbnail) : 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'60\'%3E%3Crect width=\'40\' height=\'60\' fill=\'%23e5e7eb\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%239ca3af\' font-size=\'8\'%3ENo Image%3C/text%3E%3C/svg%3E';
        
        return `
            <div class="autocomplete-item" data-index="${index}" data-product-id="${item.id || ''}" data-product-title="${escapeHtml(title)}">
                <img src="${imageUrl}" alt="${escapeHtml(title)}" style="width: 45px; height: 65px; object-fit: cover; border-radius: 4px; flex-shrink: 0;" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'45\' height=\'65\'%3E%3Crect width=\'45\' height=\'65\' fill=\'%23e5e7eb\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%239ca3af\' font-size=\'9\'%3ENo Image%3C/text%3E%3C/svg%3E'">
                <div>
                    <div class="autocomplete-item-title">${highlightedTitle}</div>
                    ${author ? `<div class="autocomplete-item-meta">Tác giả: ${highlightedAuthor}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers
    autocompleteDropdown.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', function() {
            const productTitle = this.dataset.productTitle;
            selectProductsAutocompleteSuggestion(productTitle);
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

// Select autocomplete suggestion for products
function selectProductsAutocompleteSuggestion(productTitle) {
    const searchInput = document.getElementById('searchInput');
    const autocompleteDropdown = document.getElementById('productsAutocomplete');
    
    if (searchInput) {
        searchInput.value = productTitle;
        // Focus back to input
        searchInput.focus();
    }
    
    if (autocompleteDropdown) {
        autocompleteDropdown.style.display = 'none';
    }
    
    selectedAutocompleteIndex = -1;
    
    // Trigger search immediately
    filters.search = productTitle;
    currentPage = 1;
    updateActiveFilters();
    applyFiltersAndRender();
}

// Close autocomplete when clicking outside (for products) - moved to global scope
if (typeof window.setupProductsAutocompleteClickOutside === 'undefined') {
    window.setupProductsAutocompleteClickOutside = true;
    document.addEventListener('click', function(event) {
        const searchContainer = document.querySelector('#searchInput')?.closest('[style*="position: relative"], .form-input')?.parentElement;
        const autocompleteDropdown = document.getElementById('productsAutocomplete');
        const searchInput = document.getElementById('searchInput');
        
        if (autocompleteDropdown && searchInput) {
            // Check if click is outside both input and dropdown
            if (!searchInput.contains(event.target) && 
                !autocompleteDropdown.contains(event.target) &&
                event.target.id !== 'clearSearchBtn') {
                autocompleteDropdown.style.display = 'none';
                selectedAutocompleteIndex = -1;
            }
        }
    });

    // Handle keyboard navigation in autocomplete (for products)
    document.addEventListener('keydown', function(event) {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput || document.activeElement !== searchInput) {
            return;
        }

        const autocompleteDropdown = document.getElementById('productsAutocomplete');
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
            } else {
                items.forEach((item) => item.classList.remove('active'));
            }
            items.forEach((item, index) => {
                item.classList.toggle('active', index === selectedAutocompleteIndex);
            });
        } else if (event.key === 'Enter' && selectedAutocompleteIndex >= 0) {
            event.preventDefault();
            const selectedItem = items[selectedAutocompleteIndex];
            if (selectedItem) {
                const productTitle = selectedItem.dataset.productTitle;
                selectProductsAutocompleteSuggestion(productTitle);
            }
        } else if (event.key === 'Escape') {
            event.preventDefault();
            autocompleteDropdown.style.display = 'none';
            selectedAutocompleteIndex = -1;
        }
    });
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

        // Get search term for highlighting
        const searchTerm = filters.search || '';
        
        tbody.innerHTML = products.map(book => {
        // Escape tất cả các giá trị để tránh XSS và syntax errors
        const bookId = book._id || '';
        const title = book.title || 'N/A';
        const author = book.author || 'N/A';
        const categories = book.categories?.map(c => {
            const catName = c.name || c;
            return categoriesMap[c._id || c] || catName;
        }).join(', ') || 'N/A';
        const price = window.AdminServices ? window.AdminServices.formatCurrency(book.price || 0) : (book.price || 0).toLocaleString('vi-VN') + ' ₫';
        const stock = book.stock || 0;
        const imageUrl = safeImageUrl(book.thumbnail || book.cover_images?.[0]);
        const featured = book.featured ? '<span class="badge" style="background: #f59e0b; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500;">Nổi bật</span>' : '';
        
        // Highlight search terms
        const highlightedTitle = highlightSearchText(title, searchTerm);
        const highlightedAuthor = highlightSearchText(author, searchTerm);
        const highlightedCategories = categories.split(', ').map(cat => highlightSearchText(cat, searchTerm)).join(', ');
        
        return `
        <tr style="transition: background-color 0.2s;">
            <td style="vertical-align: middle;">
                <input type="checkbox" class="product-checkbox" value="${bookId}">
            </td>
            <td style="vertical-align: middle;">
                <img src="${imageUrl}" 
                     alt="${escapeHtml(title)}" 
                     style="width: 50px; height: 70px; object-fit: cover; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                     onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'50\' height=\'70\'%3E%3Crect width=\'50\' height=\'70\' fill=\'%23e5e7eb\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%239ca3af\' font-size=\'10\'%3ENo Image%3C/text%3E%3C/svg%3E'">
            </td>
            <td style="vertical-align: middle;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <strong style="color: #1f2937; font-size: 0.95rem;">${highlightedTitle}</strong>
                    ${featured}
                </div>
            </td>
            <td style="vertical-align: middle; color: #4b5563;">${highlightedAuthor}</td>
            <td style="vertical-align: middle; color: #4b5563; font-size: 0.9rem;">${highlightedCategories}</td>
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
    console.log('📚 deleteBook called with id:', id);
    
    const confirmed = await AdminUIComponents.confirm({
        title: 'Xóa sản phẩm',
        message: 'Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này có thể khôi phục.',
        confirmText: 'Xóa',
        cancelText: 'Hủy',
        confirmClass: 'btn-danger'
    });

    console.log('📚 Confirm dialog result:', confirmed);
    
    if (!confirmed) {
        console.log('📚 Delete cancelled by user');
        return;
    }

    try {
        showLoading();
        console.log('📚 Deleting book:', id);
        await window.AdminServices.deleteBook(id);
        console.log('📚 Book deleted successfully');
        showToast('✅ Xóa sản phẩm thành công!', 'success');
        // Refresh data without reloading page
        await refreshProductsData();
    } catch (error) {
        console.error('❌ Error deleting book:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
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
            
            // Handle checkbox - FormData needs string values
            const featured = formElement.querySelector('[name="featured"]')?.checked || false;
            formData.set('featured', featured ? 'true' : 'false');
            
            // Handle categories array - Fix: use select element directly
            const categorySelect = formElement.querySelector('select[name="categories"]');
            if (categorySelect) {
                // Remove old categories entries
                formData.delete('categories');
                const selectedCategories = Array.from(categorySelect.selectedOptions);
                selectedCategories.forEach(option => {
                    if (option.value) {
                        formData.append('categories', option.value);
                    }
                });
            }
            
            // Convert number fields - FormData values are strings, need to convert
            const price = formData.get('price');
            if (price) {
                const priceNum = parseFloat(price);
                if (!isNaN(priceNum)) {
                    formData.set('price', priceNum.toString());
                }
            }
            const stock = formData.get('stock');
            if (stock) {
                const stockNum = parseInt(stock);
                if (!isNaN(stockNum)) {
                    formData.set('stock', stockNum.toString());
                }
            }
            const pageCount = formData.get('page_count');
            if (pageCount) {
                const pageCountNum = parseInt(pageCount);
                if (!isNaN(pageCountNum)) {
                    formData.set('page_count', pageCountNum.toString());
                }
            }
            const weight = formData.get('weight');
            if (weight) {
                const weightNum = parseFloat(weight);
                if (!isNaN(weightNum)) {
                    formData.set('weight', weightNum.toString());
                }
            }
            
            // Debug: Log FormData contents
            console.log('📚 FormData contents:', Array.from(formData.entries()));
            
            // Disable save button
            const saveBtn = modal.querySelector('.btn-primary');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.textContent = 'Đang lưu...';
                saveBtn.style.opacity = '0.6';
            }
            
            try {
                AdminUIComponents.showLoading('Đang lưu...');
                console.log('📚 Creating book with FormData...');
                const result = await window.AdminServices.createBook(formData);
                console.log('📚 Book created successfully:', result);
                showToast('✅ Tạo sách thành công!', 'success');
                modal.remove();
                // Refresh data without reloading page
                await refreshProductsData();
            } catch (error) {
                console.error('❌ Error creating book:', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack
                });
                showToast('❌ ' + (error.message || 'Không thể tạo sách'), 'error');
            } finally {
                AdminUIComponents.hideLoading();
                // Re-enable button
                if (saveBtn && !modal.parentNode) {
                    // Modal was removed, don't re-enable
                } else if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Lưu';
                    saveBtn.style.opacity = '1';
                }
            }
        });
    }
    } catch (error) {
        console.error('Error loading categories:', error);
        showToast('Không thể tải danh sách danh mục', 'error');
    }
}

function showEditBookModal(bookId) {
    console.log('📚 showEditBookModal called with bookId:', bookId);
    
    if (!bookId) {
        console.error('❌ No bookId provided to showEditBookModal');
        showToast('Lỗi: Không có ID sách', 'error');
        return;
    }
    
    AdminUIComponents.showLoading('Đang tải...');
    
    Promise.all([
        window.AdminServices.getBook(bookId),
        window.AdminServices.getCategories()
    ]).then(([book, categories]) => {
        console.log('📚 Book data loaded:', { id: book?._id, title: book?.title });
        console.log('📚 Categories loaded:', categories?.length || 0);
        
        AdminUIComponents.hideLoading();
        
        if (!book) {
            console.error('❌ Book data is null or undefined');
            showToast('Không thể tải thông tin sách', 'error');
            return;
        }
        
        const categoriesList = Array.isArray(categories) ? categories : (categories.categories || categories.data || []);
        
        const form = AdminCRUDForms.createBookForm(book);
        console.log('📚 Form created:', !!form);
        
        if (!form) {
            console.error('❌ Failed to create form');
            showToast('Không thể tạo form', 'error');
            return;
        }
        
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
                    icon: 'fas fa-save'
                    // Don't use onClick - we'll attach handler manually
                }
            ]
        });
        
        const formElement = modal.querySelector('form');
        const modalFooter = modal.querySelector('.admin-modal-footer') || modal.querySelector('.modal-footer');
        const cancelBtn = modalFooter ? modalFooter.querySelector('.btn-secondary') : null;
        const saveBtn = modalFooter ? modalFooter.querySelector('.btn-primary') : modal.querySelector('.btn-primary');
        
        // Remove inline onclick from save button and attach proper handler
        if (saveBtn) {
            saveBtn.removeAttribute('onclick');
            saveBtn.setAttribute('type', 'button'); // Prevent form submit by default
        }
        
        console.log('📚 Edit modal setup:', {
            formFound: !!formElement,
            saveBtnFound: !!saveBtn,
            cancelBtnFound: !!cancelBtn,
            bookId: bookId
        });
        
        if (formElement) {
            // Handle form submission
            const handleSubmit = async (e) => {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                
                console.log('📚 Form submit triggered for book:', bookId);
                
                const formData = new FormData(formElement);
                
                // Handle checkbox - FormData needs string values
                const featured = formElement.querySelector('[name="featured"]')?.checked || false;
                formData.set('featured', featured ? 'true' : 'false');
                
                // Handle categories array - Fix: use select element directly
                const categorySelect = formElement.querySelector('select[name="categories"]');
                if (categorySelect) {
                    // Remove old categories entries
                    formData.delete('categories');
                    const selectedCategories = Array.from(categorySelect.selectedOptions);
                    selectedCategories.forEach(option => {
                        if (option.value) {
                            formData.append('categories', option.value);
                        }
                    });
                }
                
                // Convert number fields - FormData values are strings, need to convert
                const price = formData.get('price');
                if (price) {
                    const priceNum = parseFloat(price);
                    if (!isNaN(priceNum)) {
                        formData.set('price', priceNum.toString());
                    }
                }
                const stock = formData.get('stock');
                if (stock) {
                    const stockNum = parseInt(stock);
                    if (!isNaN(stockNum)) {
                        formData.set('stock', stockNum.toString());
                    }
                }
                const pageCount = formData.get('page_count');
                if (pageCount) {
                    const pageCountNum = parseInt(pageCount);
                    if (!isNaN(pageCountNum)) {
                        formData.set('page_count', pageCountNum.toString());
                    }
                }
                const weight = formData.get('weight');
                if (weight) {
                    const weightNum = parseFloat(weight);
                    if (!isNaN(weightNum)) {
                        formData.set('weight', weightNum.toString());
                    }
                }
                
                // Debug: Log FormData contents
                console.log('📚 FormData contents (update):', Array.from(formData.entries()));
                console.log('📚 Updating book ID:', bookId);
                
                // Disable save button - try multiple selectors
                const currentSaveBtn = modalFooter ? modalFooter.querySelector('.btn-primary') : 
                                      modal.querySelector('button.btn-primary') ||
                                      modal.querySelector('button[type="button"].btn-primary') ||
                                      Array.from(modal.querySelectorAll('button')).find(btn => 
                                          btn.textContent.trim().includes('Lưu') && btn.classList.contains('btn-primary')
                                      );
                
                let originalText = 'Lưu';
                if (currentSaveBtn) {
                    originalText = currentSaveBtn.textContent.trim();
                    currentSaveBtn.disabled = true;
                    currentSaveBtn.textContent = 'Đang cập nhật...';
                    currentSaveBtn.style.opacity = '0.6';
                    currentSaveBtn.style.cursor = 'not-allowed';
                    console.log('✅ Save button disabled');
                } else {
                    console.warn('⚠️  Save button not found in modal');
                }
                
                try {
                    AdminUIComponents.showLoading('Đang cập nhật...');
                    console.log('📚 Calling AdminServices.updateBook...');
                    const result = await window.AdminServices.updateBook(bookId, formData);
                    console.log('✅ Book updated successfully:', result);
                    showToast('✅ Cập nhật sách thành công!', 'success');
                    
                    // Close modal
                    if (modal && modal.parentNode) {
                        modal.remove();
                    }
                    
                    // Refresh data without reloading page
                    await refreshProductsData();
                } catch (error) {
                    console.error('❌ Error updating book:', error);
                    console.error('Error details:', {
                        message: error.message,
                        stack: error.stack,
                        name: error.name
                    });
                    showToast('❌ ' + (error.message || 'Không thể cập nhật sách'), 'error');
                } finally {
                    AdminUIComponents.hideLoading();
                    
                    // Re-enable button - try to find it again in case modal structure changed
                    if (modal && modal.parentNode) {
                        const btnToEnable = modalFooter ? modalFooter.querySelector('.btn-primary') : 
                                          modal.querySelector('button.btn-primary') ||
                                          Array.from(modal.querySelectorAll('button')).find(btn => 
                                              btn.classList.contains('btn-primary')
                                          );
                        if (btnToEnable) {
                            btnToEnable.disabled = false;
                            btnToEnable.textContent = originalText;
                            btnToEnable.style.opacity = '1';
                            btnToEnable.style.cursor = 'pointer';
                            console.log('✅ Save button re-enabled');
                        }
                    }
                }
            };
            
            // Attach submit handler to form
            formElement.addEventListener('submit', handleSubmit);
            
            // Attach click handler to save button
            if (saveBtn) {
                saveBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('📚 Save button clicked - triggering form submit');
                    handleSubmit(e);
                }, { once: false });
            } else {
                console.error('❌ Save button not found!');
            }
            
            // Ensure cancel button works
            if (cancelBtn) {
                cancelBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    modal.remove();
                });
            }
        } else {
            console.error('❌ Form element not found in modal!');
        }
    }).catch(error => {
        console.error('❌ Error in showEditBookModal:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            bookId: bookId
        });
        AdminUIComponents.hideLoading();
        showToast('Không thể tải thông tin sách: ' + (error.message || 'Lỗi không xác định'), 'error');
    });
}

// Export functions
window.editBook = editBook;
window.viewBook = viewBook;
window.deleteBook = deleteBook;

