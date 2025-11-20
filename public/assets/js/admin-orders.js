/**
 * Admin Orders Management JavaScript
 */

// Helper: Đợi AdminServices sẵn sàng
function waitForAdminServices(maxWait = 5000) {
    return new Promise((resolve, reject) => {
        if (window.AdminServices && typeof window.AdminServices.getOrders === 'function') {
            resolve(window.AdminServices);
            return;
        }
        
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (window.AdminServices && typeof window.AdminServices.getOrders === 'function') {
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
let pageSize = 10; // Giới hạn 10 đơn hàng mỗi trang
let totalPages = 1;
let filters = {
    search: '',
    status: '',
    payment_method: '',
    dateFrom: '',
    dateTo: ''
};
let sortBy = 'createdAt'; // Mặc định sắp xếp theo ngày tạo
let sortOrder = 'desc'; // Mặc định giảm dần

document.addEventListener('DOMContentLoaded', async function() {
    const pathname = window.location.pathname;
    console.log('📦 Orders page - pathname:', pathname);
    
    // Check if we're on orders page (flexible check)
    if (pathname === '/orders' || pathname.includes('/orders') || pathname.endsWith('orders.html')) {
        console.log('📦 Initializing orders page...');
        try {
            await waitForAdminServices();
            console.log('📦 AdminServices ready, initializing page...');
            initOrdersPage();
        } catch (error) {
            console.error('❌ Error waiting for AdminServices:', error);
            if (typeof showToast === 'function') {
                showToast('Không thể tải AdminServices. Vui lòng reload trang.', 'error');
            }
        }
    } else {
        console.log('📦 Not on orders page, skipping initialization');
    }
});

function initOrdersPage() {
    console.log('📦 initOrdersPage called');
    setupEventListeners();
    console.log('📦 Event listeners setup, loading orders...');
    loadOrders();
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
                loadOrders();
            }, 500);
        });
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            filters.status = e.target.value;
            currentPage = 1;
            loadOrders();
        });
    }

    const paymentMethodFilter = document.getElementById('paymentMethodFilter');
    if (paymentMethodFilter) {
        paymentMethodFilter.addEventListener('change', (e) => {
            filters.payment_method = e.target.value;
            currentPage = 1;
            loadOrders();
        });
    }

    // Sort
    const sortBySelect = document.getElementById('sortBy');
    if (sortBySelect) {
        sortBySelect.addEventListener('change', (e) => {
            sortBy = e.target.value;
            currentPage = 1;
            loadOrders();
        });
    }

    const sortOrderSelect = document.getElementById('sortOrder');
    if (sortOrderSelect) {
        sortOrderSelect.addEventListener('change', (e) => {
            sortOrder = e.target.value;
            currentPage = 1;
            loadOrders();
        });
    }

    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    if (dateFrom) {
        dateFrom.addEventListener('change', (e) => {
            filters.dateFrom = e.target.value;
            currentPage = 1;
            loadOrders();
        });
    }
    if (dateTo) {
        dateTo.addEventListener('change', (e) => {
            filters.dateTo = e.target.value;
            currentPage = 1;
            loadOrders();
        });
    }

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => loadOrders());
    }

    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    if (prevPage) prevPage.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadOrders();
        }
    });
    if (nextPage) nextPage.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadOrders();
        }
    });
}

async function loadOrders() {
    showLoading();
    
    try {
        if (!window.AdminServices) {
            throw new Error('AdminServices is not loaded');
        }
        
        // Theo tài liệu: GET /api/orders hỗ trợ: page, limit, status, user_id, shipper_id
        // KHÔNG hỗ trợ sortBy/sortOrder (mặc định sort theo createdAt desc)
        const params = {
            page: currentPage,
            limit: pageSize
        };
        
        if (filters.status) params.status = filters.status;
        if (filters.user_id) params.user_id = filters.user_id;
        if (filters.shipper_id) params.shipper_id = filters.shipper_id;
        // Search, payment_method, dateFrom, dateTo không được hỗ trợ trong API này
        // Có thể filter client-side hoặc sử dụng endpoint khác

        console.log('📦 Loading orders with params:', params);
        const response = await window.AdminServices.getOrders(params);
        console.log('📦 Orders response received:', response);
        console.log('📦 Response type:', typeof response);
        console.log('📦 Response keys:', response ? Object.keys(response) : 'null');
        
        // Use helper functions from api-response-helpers.js
        // Ensure helper functions are available (fallback if not loaded)
        const extractData = window.extractData || function(resp, key) {
            if (!resp) {
                console.warn('⚠️ Response is null or undefined');
                return [];
            }
            // Nếu là array trực tiếp
            if (Array.isArray(resp)) {
                console.log('📦 Response is array, length:', resp.length);
                return resp;
            }
            // Nếu có key cụ thể (orders, books, vouchers, etc.)
            if (key && resp[key]) {
                const data = Array.isArray(resp[key]) ? resp[key] : [];
                console.log(`📦 Found data in response.${key}, length:`, data.length);
                return data;
            }
            // Nếu có data field
            if (resp.data) {
                // data có thể là array hoặc object có orders field
                if (Array.isArray(resp.data)) {
                    console.log('📦 Found data array, length:', resp.data.length);
                    return resp.data;
                }
                if (resp.data[key]) {
                    const data = Array.isArray(resp.data[key]) ? resp.data[key] : [];
                    console.log(`📦 Found data.data.${key}, length:`, data.length);
                    return data;
                }
            }
            // Nếu response có success và data
            if (resp.success && resp.data) {
                if (Array.isArray(resp.data)) {
                    console.log('📦 Found success.data array, length:', resp.data.length);
                    return resp.data;
                }
                if (resp.data[key]) {
                    const data = Array.isArray(resp.data[key]) ? resp.data[key] : [];
                    console.log(`📦 Found success.data.${key}, length:`, data.length);
                    return data;
                }
            }
            console.warn('⚠️ Could not extract data from response:', resp);
            return [];
        };
        
        // Use helper functions from api-response-helpers.js
        const extractPagination = window.extractPagination || function(resp, defaultPage, defaultLimit) {
            if (!resp) {
                console.warn('⚠️ Response is null, using defaults');
                return { page: defaultPage, limit: defaultLimit, total: 0, pages: 1, totalPages: 1 };
            }
            
            // Format 1: { pagination: { page, limit, total, pages, totalPages } }
            if (resp.pagination) {
                const pagination = {
                    page: resp.pagination.page || defaultPage,
                    limit: resp.pagination.limit || defaultLimit,
                    total: resp.pagination.total || 0,
                    pages: resp.pagination.pages || resp.pagination.totalPages || 1,
                    totalPages: resp.pagination.totalPages || resp.pagination.pages || 1
                };
                console.log('📦 Extracted pagination from resp.pagination:', pagination);
                return pagination;
            }
            
            // Format 2: { page, limit, total, pages, totalPages } (trực tiếp)
            if (resp.page !== undefined || resp.total !== undefined) {
                const total = resp.total || 0;
                const limit = resp.limit || defaultLimit;
                const page = resp.page || defaultPage;
                const pages = resp.pages || resp.totalPages || Math.ceil(total / limit) || 1;
                const pagination = { page, limit, total, pages, totalPages: pages };
                console.log('📦 Extracted pagination from resp directly:', pagination);
                return pagination;
            }
            
            // Format 3: { data: { pagination: {...} } }
            if (resp.data && resp.data.pagination) {
                const pagination = {
                    page: resp.data.pagination.page || defaultPage,
                    limit: resp.data.pagination.limit || defaultLimit,
                    total: resp.data.pagination.total || 0,
                    pages: resp.data.pagination.pages || resp.data.pagination.totalPages || 1,
                    totalPages: resp.data.pagination.totalPages || resp.data.pagination.pages || 1
                };
                console.log('📦 Extracted pagination from resp.data.pagination:', pagination);
                return pagination;
            }
            
            // Format 4: { success: true, data: { pagination: {...} } }
            if (resp.success && resp.data && resp.data.pagination) {
                const pagination = {
                    page: resp.data.pagination.page || defaultPage,
                    limit: resp.data.pagination.limit || defaultLimit,
                    total: resp.data.pagination.total || 0,
                    pages: resp.data.pagination.pages || resp.data.pagination.totalPages || 1,
                    totalPages: resp.data.pagination.totalPages || resp.data.pagination.pages || 1
                };
                console.log('📦 Extracted pagination from resp.success.data.pagination:', pagination);
                return pagination;
            }
            
            console.warn('⚠️ Could not extract pagination, using defaults');
            return { page: defaultPage, limit: defaultLimit, total: 0, pages: 1, totalPages: 1 };
        };
        
        // Extract orders và pagination
        const orders = extractData(response, 'orders');
        const paginationData = extractPagination(response, currentPage, pageSize);
        
        console.log('📦 Extracted orders:', orders.length);
        console.log('📦 Extracted pagination:', paginationData);
        
        // Cập nhật currentPage từ pagination
        if (paginationData.page) {
            currentPage = paginationData.page;
        }
        
        // Render orders và pagination
        renderOrders(orders);
        updatePagination(paginationData);
        
        // Show message nếu không có orders
        if (orders.length === 0 && paginationData.total === 0) {
            console.log('📦 No orders found');
        }
    } catch (error) {
        console.error('❌ Error loading orders:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        showToast('Không thể tải danh sách đơn hàng: ' + (error.message || 'Unknown error'), 'error');
        renderOrders([]);
        updatePagination({ page: currentPage, limit: pageSize, total: 0, pages: 1, totalPages: 1 });
    } finally {
        hideLoading();
    }
}

function renderOrders(orders) {
    console.log('📦 renderOrders called with', orders.length, 'orders');
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) {
        console.warn('⚠️ ordersTableBody element not found');
        return;
    }

    if (orders.length === 0) {
        console.log('📦 No orders to render');
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-inbox" style="font-size: 3rem; color: #d1d5db;"></i>
                    <p style="color: #6b7280; margin-top: 1rem;">Không tìm thấy đơn hàng nào</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = orders.map(order => {
        try {
            // Extract order data - xử lý nhiều format
            const orderId = order.order_id || order._id?.substring(0, 8) || order._id || 'N/A';
            const orderStatus = order.order_status || order.status || 'Pending';
            
            // Extract user info - có thể là object hoặc ID
            let userEmail = 'N/A';
            let userName = 'N/A';
            let userPhone = '';
            if (order.user_id) {
                if (typeof order.user_id === 'object') {
                    userEmail = order.user_id.email || order.user_id.username || 'N/A';
                    userName = order.user_id.full_name || order.user_id.username || 'N/A';
                    userPhone = order.user_id.phone_number || '';
                }
            }
            if (order.user) {
                userEmail = order.user.email || order.user.username || userEmail;
                userName = order.user.full_name || order.user.username || userName;
                userPhone = order.user.phone_number || userPhone;
            }
            
            // Extract shipping address
            let shippingPhone = userPhone;
            if (order.shipping_address_snapshot) {
                shippingPhone = order.shipping_address_snapshot.phone_number || shippingPhone;
                userName = order.shipping_address_snapshot.receiver_name || userName;
            }
            if (order.shipping_address) {
                shippingPhone = order.shipping_address.phone || order.shipping_address.phone_number || shippingPhone;
                userName = order.shipping_address.receiver_name || order.shipping_address.name || userName;
            }
            
            // Extract order items
            const orderItems = order.order_items || order.items || [];
            const itemCount = orderItems.length;
            let firstItemTitle = '';
            if (itemCount > 0) {
                const firstItem = orderItems[0];
                if (firstItem.book_id) {
                    firstItemTitle = typeof firstItem.book_id === 'object' 
                        ? (firstItem.book_id.title || 'N/A')
                        : 'N/A';
                } else if (firstItem.book) {
                    firstItemTitle = typeof firstItem.book === 'object'
                        ? (firstItem.book.title || 'N/A')
                        : 'N/A';
                }
            }
            
            // Extract payment method
            const paymentMethod = order.payment_id?.payment_method 
                || order.payment_method 
                || 'N/A';
            
            // Extract total amount
            const totalAmount = order.total_amount || 0;
            
            // Extract date
            const createdAt = order.order_date || order.createdAt || new Date();
            
            const statusColor = getStatusColor(orderStatus);
            const statusBgColors = {
                'warning': '#fef3c7',
                'info': '#dbeafe',
                'primary': '#dbeafe',
                'success': '#d1fae5',
                'danger': '#fee2e2',
                'secondary': '#f3f4f6'
            };
            const statusTextColors = {
                'warning': '#92400e',
                'info': '#1e40af',
                'primary': '#1e40af',
                'success': '#065f46',
                'danger': '#991b1b',
                'secondary': '#374151'
            };
            const bgColor = statusBgColors[statusColor] || '#f3f4f6';
            const textColor = statusTextColors[statusColor] || '#374151';
            
            // Escape HTML để tránh XSS
            const safeOrderId = escapeHtml(orderId);
            const safeUserEmail = escapeHtml(userEmail);
            const safeUserName = escapeHtml(userName);
            const safeShippingPhone = escapeHtml(shippingPhone);
            const safeFirstItemTitle = escapeHtml(firstItemTitle);
            const safePaymentMethod = escapeHtml(paymentMethod);
            const safeOrderStatus = escapeHtml(orderStatus);
            
            return `
            <tr style="transition: background-color 0.2s;">
                <td style="vertical-align: middle;"><strong style="color: #1f2937;">#${safeOrderId}</strong></td>
                <td style="vertical-align: middle;">
                    <div style="color: #1f2937; font-weight: 500;">${safeUserEmail}</div>
                    ${safeShippingPhone ? `<small style="color: #6b7280; font-size: 0.85rem;">${safeShippingPhone}</small>` : ''}
                </td>
                <td style="vertical-align: middle;">
                    <div style="color: #1f2937; font-weight: 500;">${itemCount} sản phẩm</div>
                    ${safeFirstItemTitle ? `<small style="color: #6b7280; font-size: 0.85rem; display: block; margin-top: 0.25rem;">${safeFirstItemTitle}${itemCount > 1 ? '...' : ''}</small>` : ''}
                </td>
                <td style="vertical-align: middle;"><strong style="color: #dc2626; font-size: 1rem;">${window.AdminServices ? window.AdminServices.formatCurrency(totalAmount) : totalAmount.toLocaleString('vi-VN') + ' ₫'}</strong></td>
                <td style="vertical-align: middle; color: #4b5563;">${getPaymentMethodText(paymentMethod)}</td>
                <td style="vertical-align: middle;">
                    <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 500; background: ${bgColor}; color: ${textColor};">
                        ${getStatusText(orderStatus)}
                    </span>
                </td>
                <td style="vertical-align: middle; color: #4b5563; font-size: 0.9rem;">${window.AdminServices ? window.AdminServices.formatDate(createdAt) : new Date(createdAt).toLocaleString('vi-VN')}</td>
                <td style="vertical-align: middle;">
                    <div style="display: flex; gap: 0.5rem; justify-content: center;">
                        <button class="btn btn-sm btn-primary" onclick="viewOrder('${order._id || orderId}')" title="Xem chi tiết" style="padding: 0.5rem; min-width: 36px;">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="updateOrderStatus('${order._id || orderId}')" title="Cập nhật trạng thái" style="padding: 0.5rem; min-width: 36px;">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        } catch (error) {
            console.error('❌ Error rendering order:', error, order);
            return `
                <tr>
                    <td colspan="8" style="text-align: center; color: #dc2626;">
                        Lỗi hiển thị đơn hàng: ${error.message}
                    </td>
                </tr>
            `;
        }
    }).join('');

    const countEl = document.getElementById('ordersCount');
    if (countEl) countEl.textContent = `${orders.length} đơn hàng`;
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

    if (currentPageEl) currentPageEl.textContent = currentPage;
    if (totalPagesEl) totalPagesEl.textContent = totalPages;
    if (totalItemsEl) totalItemsEl.textContent = pagination.total || 0;
    if (pageInfoEl) {
        const start = (currentPage - 1) * pageSize + 1;
        const end = Math.min(currentPage * pageSize, pagination.total || 0);
        pageInfoEl.textContent = `${start}-${end}`;
    }
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
        prevBtn.style.opacity = currentPage <= 1 ? '0.5' : '1';
        prevBtn.style.cursor = currentPage <= 1 ? 'not-allowed' : 'pointer';
    }
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.style.opacity = currentPage >= totalPages ? '0.5' : '1';
        nextBtn.style.cursor = currentPage >= totalPages ? 'not-allowed' : 'pointer';
    }
}

function getStatusColor(status) {
    const colors = {
        'Pending': 'warning',
        'AwaitingPickup': 'info',
        'OutForDelivery': 'primary',
        'Delivered': 'success',
        'Cancelled': 'danger',
        'Refunded': 'secondary'
    };
    return colors[status] || 'secondary';
}

function getStatusText(status) {
    const texts = {
        'Pending': 'Chờ xử lý',
        'AwaitingPickup': 'Chờ lấy hàng',
        'OutForDelivery': 'Đang giao',
        'Delivered': 'Đã giao',
        'Cancelled': 'Đã hủy',
        'Refunded': 'Đã hoàn tiền'
    };
    return texts[status] || status;
}

function getPaymentMethodText(method) {
    const texts = {
        'COD': 'COD',
        'BANK_TRANSFER': 'Chuyển khoản',
        'MOMO': 'MoMo',
        'ZALOPAY': 'ZaloPay',
        'VNPAY': 'VNPay',
        'PAYOS': 'PayOS'
    };
    return texts[method] || method;
}

async function viewOrder(id) {
    try {
        console.log('📦 viewOrder called with id:', id);
        showLoading();
        const response = await window.AdminServices.getOrder(id);
        console.log('📦 Order details loaded:', response);
        // API trả về { success: true, order: {...}, payment: {...}, ... }
        const order = response && response.order ? response.order : response;
        const payment = response && response.payment ? response.payment : {};
        hideLoading();
        
        if (!order) {
            showToast('Không tìm thấy đơn hàng', 'error');
            return;
        }
        
        // Escape values
        const orderId = escapeHtml(order.order_id || order._id || 'N/A');

        // Thông tin khách hàng: ưu tiên user, sau đó user_id, cuối cùng shipping_address
        const userObj = order.user || order.user_id || {};
        const shipping = order.shipping_address || {};

        const userEmail = escapeHtml(
            userObj.email ||
            userObj.username ||
            'N/A'
        );
        const userName = escapeHtml(
            userObj.full_name ||
            userObj.username ||
            shipping.name ||
            'N/A'
        );
        const phone = escapeHtml(
            shipping.phone ||
            userObj.phone_number ||
            userObj.phone ||
            'N/A'
        );
        const address = escapeHtml(
            response.formattedAddress ||
            shipping.address ||
            shipping.street ||
            shipping.detail ||
            'N/A'
        );

        // Tổng tiền: hỗ trợ nhiều schema
        const totalAmount = window.AdminServices.formatCurrency(
            order.total_amount ||
            payment.amount ||
            order.amount ||
            0
        );

        // Phương thức thanh toán
        const paymentMethodCode = order.payment_method || payment.payment_method || '';
        const paymentMethod = paymentMethodCode
            ? getPaymentMethodText(paymentMethodCode)
            : (response.paymentMethodText || 'N/A');

        // Trạng thái đơn: hỗ trợ status và order_status
        const status = getStatusText(order.status || order.order_status);

        // Ngày tạo: hỗ trợ createdAt và order_date
        const createdAt = window.AdminServices.formatDate(
            order.createdAt || order.order_date
        );
        
        // Items
        const rawItems = order.items || order.order_items || [];
        const itemsHtml = rawItems.map(item => {
            const book = item.book || item.book_id || {};
            const itemTitle = escapeHtml(book.title || 'N/A');
            const itemPrice = window.AdminServices.formatCurrency(item.price || 0);
            const quantity = item.quantity || 0;
            const subtotal = window.AdminServices.formatCurrency((item.price || 0) * quantity);
            return `
                <tr>
                    <td>${itemTitle}</td>
                    <td style="text-align: center;">${quantity}</td>
                    <td style="text-align: right;">${itemPrice}</td>
                    <td style="text-align: right;"><strong>${subtotal}</strong></td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="4" style="text-align: center; color: #6b7280;">Không có sản phẩm</td></tr>';
        
        const modal = AdminUIComponents.createModal({
            title: 'Chi tiết đơn hàng',
            content: `
                <div style="padding: 1.5rem;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                        <div>
                            <h3 style="margin: 0 0 1rem 0; color: #1f2937; font-size: 1.1rem;">Thông tin khách hàng</h3>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Email:</strong> ${userEmail}</p>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Tên:</strong> ${userName}</p>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Điện thoại:</strong> ${phone}</p>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Địa chỉ:</strong> ${address}</p>
                        </div>
                        <div>
                            <h3 style="margin: 0 0 1rem 0; color: #1f2937; font-size: 1.1rem;">Thông tin đơn hàng</h3>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Mã đơn:</strong> #${orderId}</p>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Ngày tạo:</strong> ${createdAt}</p>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Phương thức:</strong> ${paymentMethod}</p>
                            <p style="color: #6b7280; margin: 0.5rem 0;"><strong>Trạng thái:</strong> ${status}</p>
                        </div>
                    </div>
                    <div style="margin-top: 1.5rem;">
                        <h3 style="margin: 0 0 1rem 0; color: #1f2937; font-size: 1.1rem;">Sản phẩm</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 2px solid #e5e7eb;">
                                    <th style="text-align: left; padding: 0.75rem; color: #6b7280; font-weight: 600;">Sản phẩm</th>
                                    <th style="text-align: center; padding: 0.75rem; color: #6b7280; font-weight: 600;">Số lượng</th>
                                    <th style="text-align: right; padding: 0.75rem; color: #6b7280; font-weight: 600;">Đơn giá</th>
                                    <th style="text-align: right; padding: 0.75rem; color: #6b7280; font-weight: 600;">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                            <tfoot>
                                <tr style="border-top: 2px solid #e5e7eb;">
                                    <td colspan="3" style="text-align: right; padding: 0.75rem; font-weight: 600; color: #1f2937;">Tổng cộng:</td>
                                    <td style="text-align: right; padding: 0.75rem; font-size: 1.25rem; font-weight: bold; color: #dc2626;">${totalAmount}</td>
                                </tr>
                            </tfoot>
                        </table>
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
                    text: 'Cập nhật trạng thái',
                    class: 'btn-primary',
                    icon: 'fas fa-edit',
                    onClick: `this.closest('.admin-modal-overlay').remove(); updateOrderStatus('${id}');`
                }
            ]
        });
        console.log('📦 Modal created successfully');
    } catch (error) {
        hideLoading();
        console.error('❌ Error loading order details:', error);
        showToast('Không thể tải chi tiết đơn hàng: ' + (error.message || 'Unknown error'), 'error');
    }
}

// Helper function để escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function updateOrderStatus(id) {
    const statusOptions = [
        { value: 'Pending', label: 'Chờ xử lý' },
        { value: 'AwaitingPickup', label: 'Chờ lấy hàng' },
        { value: 'OutForDelivery', label: 'Đang giao' },
        { value: 'Delivered', label: 'Đã giao' },
        { value: 'Cancelled', label: 'Đã hủy' },
        { value: 'Refunded', label: 'Đã hoàn tiền' }
    ];

    const form = AdminUIComponents.createForm([
        {
            name: 'status',
            label: 'Trạng thái mới',
            type: 'select',
            required: true,
            options: statusOptions
        },
        {
            name: 'note',
            label: 'Ghi chú (tùy chọn)',
            type: 'textarea',
            rows: 3,
            placeholder: 'Nhập ghi chú nếu có'
        }
    ]);

    const modal = AdminUIComponents.createModal({
        title: 'Cập nhật trạng thái đơn hàng',
        content: form.outerHTML,
        size: 'medium',
        buttons: [
            {
                text: 'Hủy',
                class: 'btn-secondary',
                onClick: 'this.closest(\'.admin-modal-overlay\').remove();'
            },
            {
                text: 'Cập nhật',
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
            const status = formData.get('status');
            const note = formData.get('note') || '';

            // Disable update button
            const updateBtn = modal.querySelector('.btn-primary');
            if (updateBtn) {
                updateBtn.disabled = true;
                updateBtn.textContent = 'Đang cập nhật...';
                updateBtn.style.opacity = '0.6';
            }

            try {
                showLoading();
                await window.AdminServices.updateOrderStatus(id, status, note);
                showToast('Cập nhật trạng thái thành công', 'success');
                modal.remove();
                loadOrders();
            } catch (error) {
                console.error('Error updating order status:', error);
                showToast('Không thể cập nhật trạng thái', 'error');
            } finally {
                hideLoading();
                // Re-enable button
                if (updateBtn && !modal.parentNode) {
                    // Modal was removed, don't re-enable
                } else if (updateBtn) {
                    updateBtn.disabled = false;
                    updateBtn.textContent = 'Cập nhật';
                    updateBtn.style.opacity = '1';
                }
            }
        });
    }
}

window.viewOrder = viewOrder;
window.updateOrderStatus = updateOrderStatus;

