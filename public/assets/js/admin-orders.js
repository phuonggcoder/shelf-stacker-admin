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
        
        const params = {
            page: currentPage,
            limit: pageSize,
            sortBy: sortBy,
            sortOrder: sortOrder
        };
        
        if (filters.search) params.search = filters.search;
        if (filters.status) params.status = filters.status;
        if (filters.payment_method) params.payment_method = filters.payment_method;
        if (filters.dateFrom) params.start_date = filters.dateFrom;
        if (filters.dateTo) params.end_date = filters.dateTo;

        console.log('📦 Loading orders with params:', params);
        const response = await window.AdminServices.getOrders(params);
        console.log('📦 Orders response received:', response);
        
        // API trả về { orders: [...], total, page, limit, pages } hoặc { orders: [...], pagination: {...} }
        const orders = response.orders || response.data || (Array.isArray(response) ? response : []);
        
        // Đảm bảo chỉ render số đơn hàng trong trang hiện tại
        if (Array.isArray(orders) && orders.length > 0) {
            renderOrders(orders);
            
            // Xử lý pagination từ response
            let paginationData;
            if (response.pagination) {
                paginationData = response.pagination;
            } else {
                const total = response.total || response.pagination?.total || orders.length;
                const limit = response.limit || response.pagination?.limit || pageSize;
                const page = response.page || response.pagination?.page || currentPage;
                const pages = response.pages || response.pagination?.pages || response.pagination?.totalPages || Math.ceil(total / limit);
                
                paginationData = {
                    page: page,
                    limit: limit,
                    total: total,
                    pages: pages,
                    totalPages: pages
                };
                
                if (response.page) {
                    currentPage = response.page;
                }
            }
            
            updatePagination(paginationData);
        } else {
            renderOrders([]);
            updatePagination({ page: 1, limit: pageSize, total: 0, pages: 1, totalPages: 1 });
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        showToast('Không thể tải danh sách đơn hàng', 'error');
        renderOrders([]);
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
        const statusColor = getStatusColor(order.status);
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
        
        return `
        <tr style="transition: background-color 0.2s;">
            <td style="vertical-align: middle;"><strong style="color: #1f2937;">#${order.order_id || order._id?.substring(0, 8) || 'N/A'}</strong></td>
            <td style="vertical-align: middle;">
                <div style="color: #1f2937; font-weight: 500;">${order.user?.email || order.user?.username || 'N/A'}</div>
                ${order.shipping_address?.phone ? `<small style="color: #6b7280; font-size: 0.85rem;">${order.shipping_address.phone}</small>` : ''}
            </td>
            <td style="vertical-align: middle;">
                <div style="color: #1f2937; font-weight: 500;">${order.items?.length || 0} sản phẩm</div>
                ${order.items?.[0]?.book?.title ? `<small style="color: #6b7280; font-size: 0.85rem; display: block; margin-top: 0.25rem;">${order.items[0].book.title}${order.items.length > 1 ? '...' : ''}</small>` : ''}
            </td>
            <td style="vertical-align: middle;"><strong style="color: #dc2626; font-size: 1rem;">${window.AdminServices ? window.AdminServices.formatCurrency(order.total_amount || 0) : (order.total_amount || 0).toLocaleString('vi-VN') + ' ₫'}</strong></td>
            <td style="vertical-align: middle; color: #4b5563;">${getPaymentMethodText(order.payment_method)}</td>
            <td style="vertical-align: middle;">
                <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 500; background: ${bgColor}; color: ${textColor};">
                    ${getStatusText(order.status)}
                </span>
            </td>
            <td style="vertical-align: middle; color: #4b5563; font-size: 0.9rem;">${window.AdminServices ? window.AdminServices.formatDate(order.createdAt) : new Date(order.createdAt).toLocaleString('vi-VN')}</td>
            <td style="vertical-align: middle;">
                <div style="display: flex; gap: 0.5rem; justify-content: center;">
                    <button class="btn btn-sm btn-primary" onclick="viewOrder('${order._id}')" title="Xem chi tiết" style="padding: 0.5rem; min-width: 36px;">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="updateOrderStatus('${order._id}')" title="Cập nhật trạng thái" style="padding: 0.5rem; min-width: 36px;">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
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
        const order = await window.AdminServices.getOrder(id);
        console.log('📦 Order details loaded:', order);
        hideLoading();
        
        if (!order) {
            showToast('Không tìm thấy đơn hàng', 'error');
            return;
        }
        
        // Escape values
        const orderId = escapeHtml(order.order_id || order._id || 'N/A');
        const userEmail = escapeHtml(order.user?.email || order.user?.username || 'N/A');
        const userName = escapeHtml(order.user?.full_name || order.shipping_address?.name || 'N/A');
        const phone = escapeHtml(order.shipping_address?.phone || 'N/A');
        const address = escapeHtml(order.shipping_address?.address || 'N/A');
        const totalAmount = window.AdminServices.formatCurrency(order.total_amount || 0);
        const paymentMethod = getPaymentMethodText(order.payment_method);
        const status = getStatusText(order.status);
        const createdAt = window.AdminServices.formatDate(order.createdAt);
        
        // Items
        const itemsHtml = order.items?.map(item => {
            const itemTitle = escapeHtml(item.book?.title || 'N/A');
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
            }
        });
    }
}

window.viewOrder = viewOrder;
window.updateOrderStatus = updateOrderStatus;

