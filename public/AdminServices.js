/**
 * Admin Services - Complete API Integration
 * Handles all admin API calls with proper error handling and token management
 */

const BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

class AdminServices {
    constructor() {
        this.baseUrl = BASE_URL;
    }

    // ==================== Token Management ====================
    getToken() {
        return localStorage.getItem('admin_token') || localStorage.getItem('authToken');
    }

    getRefreshToken() {
        return localStorage.getItem('admin_refresh_token');
    }

    setTokens(accessToken, refreshToken) {
        if (accessToken) {
            localStorage.setItem('admin_token', accessToken);
            localStorage.setItem('authToken', accessToken); // Legacy support
        }
        if (refreshToken) {
            localStorage.setItem('admin_refresh_token', refreshToken);
        }
    }

    clearTokens() {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminToken');
    }

    getAuthHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    }

    // ==================== Request Handler ====================
    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        
        // Enhanced logging for email change endpoints
        const isEmailChangeEndpoint = endpoint.includes('change-email') || endpoint.includes('verify-email-change');
        if (isEmailChangeEndpoint) {
            console.log('📧 [AdminServices] Request to email change endpoint:', {
                endpoint,
                method: options.method || 'GET',
                hasBody: !!options.body,
                timestamp: new Date().toISOString()
            });
        }
        
        const config = {
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...(options.headers || {})
            }
        };

        try {
            const requestStartTime = Date.now();
            const response = await fetch(url, config);
            const requestDuration = Date.now() - requestStartTime;
            
            if (isEmailChangeEndpoint) {
                console.log('📧 [AdminServices] Email change endpoint response:', {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok,
                    duration: `${requestDuration}ms`,
                    timestamp: new Date().toISOString()
                });
            }
            
            // Handle 401 - Unauthorized
            if (response.status === 401) {
                const refreshToken = this.getRefreshToken();
                if (refreshToken && !options._retried) {
                    try {
                        const newToken = await this.refreshToken();
                        if (newToken) {
                            config.headers['Authorization'] = `Bearer ${newToken}`;
                            config._retried = true;
                            return this.request(endpoint, config);
                        }
                    } catch (e) {
                        // Refresh failed, redirect to login
                    }
                }
                this.clearTokens();
                window.location.href = '/login';
                throw new Error('Phiên đăng nhập đã hết hạn');
            }

            // Handle 403 - Forbidden
            if (response.status === 403) {
                throw new Error('Không có quyền truy cập');
            }

            const data = await response.json().catch((parseError) => {
                if (isEmailChangeEndpoint) {
                    console.error('❌ [AdminServices] Failed to parse email change response:', {
                        error: parseError.message,
                        status: response.status,
                        statusText: response.statusText
                    });
                }
                return {};
            });
            
            if (!response.ok) {
                const errorMessage = data.message || data.msg || `HTTP ${response.status}: ${response.statusText}`;
                
                if (isEmailChangeEndpoint) {
                    console.error('❌ [AdminServices] Email change endpoint error:', {
                        status: response.status,
                        message: errorMessage,
                        errorData: data,
                        timestamp: new Date().toISOString()
                    });
                }
                
                throw new Error(errorMessage);
            }

            if (isEmailChangeEndpoint) {
                console.log('✅ [AdminServices] Email change endpoint success:', {
                    success: data?.success,
                    hasMessage: !!data?.message,
                    timestamp: new Date().toISOString()
                });
            }

            // Chỉ tự động extract data nếu response có format { success: true, data: {...} }
            // KHÔNG extract nếu có success: true nhưng không có data field (ví dụ: { success: true, vouchers: [...] })
            if (data && typeof data === 'object' && data.success === true && 'data' in data) {
                return data.data;
            }

            // Trả về toàn bộ response để frontend xử lý
            // Các format có thể:
            // - { orders: [...], total, page, limit, pages }
            // - { books: [...], pagination: {...} }
            // - { success: true, vouchers: [...], pagination: {...} }
            // - { success: true, data: {...} } (đã extract ở trên)
            return data;
        } catch (error) {
            if (isEmailChangeEndpoint) {
                console.error('❌ [AdminServices] Email change endpoint request failed:', {
                    endpoint,
                    error: error.message,
                    name: error.name,
                    timestamp: new Date().toISOString()
                });
            }
            
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
            }
            throw error;
        }
    }

    // ==================== Authentication ====================
    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (!response.user?.roles?.includes('admin')) {
            throw new Error('Tài khoản không có quyền admin');
        }

        this.setTokens(response.access_token, response.refresh_token);
        return response;
    }

    async refreshToken() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) return null;

        try {
            const response = await fetch(`${this.baseUrl}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken })
            });

            if (!response.ok) {
                this.clearTokens();
                return null;
            }

            const data = await response.json();
            if (data.access_token) {
                this.setTokens(data.access_token, data.refresh_token || refreshToken);
                return data.access_token;
            }
            return null;
        } catch (error) {
            this.clearTokens();
            return null;
        }
    }

    logout() {
        this.clearTokens();
        window.location.href = '/login';
    }

    // ==================== Books Management ====================
    /**
     * Lấy danh sách sách (Admin) với pagination và filter
     * @param {Object} params - Query parameters
     * @param {number} params.page - Số trang (default: 1)
     * @param {number} params.limit - Số lượng mỗi trang (default: 20)
     * @param {string} params.category - ID category để lọc
     * @param {string} params.status - in_stock (còn hàng) hoặc out_of_stock (hết hàng)
     * @param {string} params.search - Tìm kiếm theo title, author, hoặc description (case-insensitive)
     * @returns {Promise<Object>} { books: [...], pagination: { page, limit, total, pages } }
     */
    async getBooks(params = {}) {
        // Set defaults
        const queryParams = {
            page: params.page || 1,
            limit: params.limit || 20,
            ...(params.category && { category: params.category }),
            ...(params.status && { status: params.status }),
            ...(params.search && { search: params.search })
        };
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/api/books/admin${query ? '?' + query : ''}`);
    }

    async getBook(id) {
        return this.request(`/api/books/${id}`);
    }

    async createBook(data) {
        // API expects multipart/form-data for file uploads
        if (data instanceof FormData) {
            const token = this.getToken();
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            // Don't set Content-Type for FormData, browser will set it with boundary
            const response = await fetch(`${this.baseUrl}/api/books`, {
                method: 'POST',
                headers,
                body: data
            });
            if (!response.ok) {
                let errorMessage = 'Create book failed';
                try {
                    const error = await response.json();
                    errorMessage = error.message || error.msg || error.error || errorMessage;
                } catch (e) {
                    // If response is not JSON, try to get text
                    try {
                        const text = await response.text();
                        errorMessage = text || errorMessage;
                    } catch (e2) {
                        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                    }
                }
                throw new Error(errorMessage);
            }
            const result = await response.json();
            // Auto-extract data if response has { success: true, data: {...} }
            if (result && typeof result === 'object' && result.success === true && 'data' in result) {
                return result.data;
            }
            return result;
        } else {
            // Fallback to JSON if no files
            return this.request('/api/books', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }
    }

    async updateBook(id, data) {
        // API expects multipart/form-data for file uploads
        if (data instanceof FormData) {
            const token = this.getToken();
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            // Don't set Content-Type for FormData, browser will set it with boundary
            const response = await fetch(`${this.baseUrl}/api/books/${id}`, {
                method: 'PUT',
                headers,
                body: data
            });
            if (!response.ok) {
                let errorMessage = 'Update book failed';
                try {
                    const error = await response.json();
                    errorMessage = error.message || error.msg || error.error || errorMessage;
                } catch (e) {
                    // If response is not JSON, try to get text
                    try {
                        const text = await response.text();
                        errorMessage = text || errorMessage;
                    } catch (e2) {
                        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                    }
                }
                throw new Error(errorMessage);
            }
            const result = await response.json();
            // Auto-extract data if response has { success: true, data: {...} }
            if (result && typeof result === 'object' && result.success === true && 'data' in result) {
                return result.data;
            }
            return result;
        } else {
            // Fallback to JSON if no files
            return this.request(`/api/books/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        }
    }

    async deleteBook(id) {
        return this.request(`/api/books/${id}`, {
            method: 'DELETE'
        });
    }

    async getTrashBooks() {
        return this.request('/api/books/trash/all');
    }

    async restoreBook(id) {
        return this.request(`/api/books/${id}/restore`, {
            method: 'PATCH'
        });
    }

    async forceDeleteBook(id) {
        return this.request(`/api/books/${id}/force`, {
            method: 'DELETE'
        });
    }

    async featureBook(id) {
        return this.request(`/api/books/${id}/feature`, {
            method: 'PATCH'
        });
    }

    async unfeatureBook(id) {
        return this.request(`/api/books/${id}/unfeature`, {
            method: 'PATCH'
        });
    }

    async fetchGoogleBooks(googleBooksId) {
        return this.request('/api/books/fetch/google', {
            method: 'POST',
            body: JSON.stringify({ googleBooksId })
        });
    }

    async getGoogleBooksImages(id) {
        return this.request(`/api/books/google/${id}/images`);
    }

    async validateGoogleBooksImage(url) {
        return this.request('/api/books/google/validate-image', {
            method: 'POST',
            body: JSON.stringify({ url })
        });
    }

    // ==================== Orders Management ====================
    /**
     * Lấy tất cả đơn hàng với pagination và filter
     * @param {Object} params - Query parameters
     * @param {number} params.page - Số trang (default: 1)
     * @param {number} params.limit - Số lượng mỗi trang (default: 20)
     * @param {string} params.status - Trạng thái: Pending, AwaitingPickup, OutForDelivery, Delivered, Returned, Cancelled, Refunded
     * @param {string} params.user_id - ID người dùng (ObjectId)
     * @param {string} params.shipper_id - ID shipper (ObjectId)
     * @returns {Promise<Object>} { orders: [...], total, page, limit, pages }
     */
    async getOrders(params = {}) {
        // Set defaults
        const queryParams = {
            page: params.page || 1,
            limit: params.limit || 20,
            ...(params.status && { status: params.status }),
            ...(params.user_id && { user_id: params.user_id }),
            ...(params.shipper_id && { shipper_id: params.shipper_id })
        };
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/api/orders${query ? '?' + query : ''}`);
    }

    async getOrder(id) {
        return this.request(`/api/orders/${id}`);
    }

    async updateOrderStatus(id, orderStatus, note = '') {
        // API expects: { "order_status": "Delivered" }
        const body = { order_status: orderStatus };
        if (note) {
            body.note = note;
        }
        return this.request(`/api/orders/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify(body)
        });
    }

    async approveCODOrder(id) {
        return this.request(`/api/orders/${id}/approve-cod`, {
            method: 'PATCH'
        });
    }

    async cancelOrder(id, reason) {
        return this.request(`/api/admin/orders/${id}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
    }

    async refundZaloPayOrder(id, amount, reason) {
        return this.request(`/api/orders/${id}/zalopay-refund`, {
            method: 'POST',
            body: JSON.stringify({ amount, reason })
        });
    }

    async refundPayOSOrder(id, amount, description) {
        return this.request(`/api/orders/${id}/payos-refund`, {
            method: 'POST',
            body: JSON.stringify({ amount, description })
        });
    }

    async updatePaymentMethod(id, paymentMethod) {
        return this.request(`/api/orders/${id}/payment-method`, {
            method: 'PATCH',
            body: JSON.stringify({ payment_method: paymentMethod })
        });
    }

    /**
     * Lấy đơn hàng theo phương thức thanh toán
     * @param {Object} params - Query parameters
     * @param {string} params.payment_method - Required: COD, BANK_TRANSFER, MOMO, ZALOPAY, VNPAY, PAYOS
     * @param {number} params.page - Số trang (default: 1)
     * @param {number} params.limit - Số lượng mỗi trang (default: 20)
     */
    async getOrdersByPaymentMethod(params = {}) {
        if (!params.payment_method) {
            throw new Error('payment_method is required');
        }
        const queryParams = {
            payment_method: params.payment_method,
            page: params.page || 1,
            limit: params.limit || 20
        };
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/api/orders/by-payment-method${query ? '?' + query : ''}`);
    }

    async getShipperDetails(id) {
        return this.request(`/api/orders/${id}/shipper-details`);
    }

    /**
     * Lấy Shipper Assignments với pagination và filter
     * @param {Object} params - Query parameters
     * @param {number} params.page - Số trang (default: 1)
     * @param {number} params.limit - Số lượng mỗi trang (default: 20)
     * @param {string} params.status - Trạng thái đơn hàng
     */
    async getShipperAssignments(params = {}) {
        const queryParams = {
            page: params.page || 1,
            limit: params.limit || 20,
            ...(params.status && { status: params.status })
        };
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/api/orders/shipper-assignments${query ? '?' + query : ''}`);
    }

    /**
     * Thống kê hiệu suất Shipper
     * @param {Object} params - Query parameters
     * @param {string} params.shipper_id - ID shipper
     * @param {string} params.start_date - YYYY-MM-DD
     * @param {string} params.end_date - YYYY-MM-DD
     */
    async getShipperPerformance(params = {}) {
        const queryParams = {
            ...(params.shipper_id && { shipper_id: params.shipper_id }),
            ...(params.start_date && { start_date: params.start_date }),
            ...(params.end_date && { end_date: params.end_date })
        };
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/api/orders/shipper-performance${query ? '?' + query : ''}`);
    }

    async getOrderStatsSummary() {
        return this.request('/api/orders/stats/summary');
    }

    async getPaymentMethodStats(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/orders/stats/payment-methods${query ? '?' + query : ''}`);
    }

    async getOrderTimeline(id) {
        return this.request(`/api/orders/${id}/timeline`);
    }

    async getDeliveryStats(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/orders/delivery-stats${query ? '?' + query : ''}`);
    }

    // ==================== Users Management ====================
    async getUsers() {
        // Theo tài liệu: GET /api/users/users KHÔNG có query parameters
        // Trả về tất cả users (không pagination)
        return this.request('/api/users/users');
    }

    async getUser(id) {
        return this.request(`/api/users/users/${id}`);
    }

    async createUser(data) {
        return this.request('/api/users/admin/create', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async lockUser(id, isActive) {
        return this.request(`/api/users/users/${id}/lock`, {
            method: 'PATCH',
            body: JSON.stringify({ isActive })
        });
    }

    async deleteUser(id) {
        return this.request(`/api/users/${id}`, {
            method: 'DELETE'
        });
    }

    /**
     * Lấy danh sách Shipper với pagination và filter
     * @param {Object} params - Query parameters
     * @param {number} params.page - Số trang (default: 1, min: 1)
     * @param {number} params.limit - Số lượng mỗi trang (default: 50, min: 1, max: 100)
     * @param {boolean} params.verified - true hoặc false để lọc theo shipper_verified
     * @param {boolean} params.isActive - true hoặc false để lọc theo isActive
     * @returns {Promise<Object>} { success: true, total, page, limit, users: [...] }
     */
    async getShippers(params = {}) {
        const queryParams = {
            page: params.page || 1,
            limit: params.limit || 50,
            ...(params.verified !== undefined && { verified: params.verified }),
            ...(params.isActive !== undefined && { isActive: params.isActive })
        };
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/api/users/shippers${query ? '?' + query : ''}`);
    }

    async verifyShipper(userId) {
        return this.request(`/api/users/users/${userId}/verify-shipper`, {
            method: 'POST'
        });
    }

    async updateShipperStatus(userId, data) {
        return this.request(`/api/users/users/${userId}/shipper-status`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    // ==================== Categories Management ====================
    /**
     * Lấy danh sách danh mục với filter
     * @param {Object} params - Query parameters
     * @param {string} params.visible - "true" hoặc "false" để lọc theo isVisible
     * @returns {Promise<Array>} Array of categories
     */
    async getCategories(params = {}) {
        const queryParams = {
            ...(params.visible && { visible: params.visible })
        };
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/api/categories${query ? '?' + query : ''}`);
    }

    async getCategory(id) {
        return this.request(`/api/categories/${id}`);
    }

    async createCategory(data) {
        // API expects multipart/form-data for file uploads
        if (data instanceof FormData) {
            const token = this.getToken();
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await fetch(`${this.baseUrl}/api/categories`, {
                method: 'POST',
                headers,
                body: data
            });
            if (!response.ok) {
                let errorMessage = 'Create category failed';
                try {
                    const error = await response.json();
                    errorMessage = error.message || error.msg || error.error || errorMessage;
                } catch (e) {
                    try {
                        const text = await response.text();
                        errorMessage = text || errorMessage;
                    } catch (e2) {
                        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                    }
                }
                throw new Error(errorMessage);
            }
            const result = await response.json();
            if (result && typeof result === 'object' && result.success === true && 'data' in result) {
                return result.data;
            }
            return result;
        } else {
            return this.request('/api/categories', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }
    }

    async updateCategory(id, data) {
        // API expects multipart/form-data for file uploads
        if (data instanceof FormData) {
            const token = this.getToken();
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await fetch(`${this.baseUrl}/api/categories/${id}`, {
                method: 'PUT',
                headers,
                body: data
            });
            if (!response.ok) {
                let errorMessage = 'Update category failed';
                try {
                    const error = await response.json();
                    errorMessage = error.message || error.msg || error.error || errorMessage;
                } catch (e) {
                    try {
                        const text = await response.text();
                        errorMessage = text || errorMessage;
                    } catch (e2) {
                        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                    }
                }
                throw new Error(errorMessage);
            }
            const result = await response.json();
            if (result && typeof result === 'object' && result.success === true && 'data' in result) {
                return result.data;
            }
            return result;
        } else {
            return this.request(`/api/categories/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        }
    }

    async deleteCategory(id) {
        return this.request(`/api/categories/${id}`, {
            method: 'DELETE'
        });
    }

    async getTrashCategories() {
        return this.request('/api/categories/trash/all');
    }

    async restoreCategory(id) {
        return this.request(`/api/categories/${id}/restore`, {
            method: 'PATCH'
        });
    }

    async forceDeleteCategory(id) {
        return this.request(`/api/categories/${id}/force`, {
            method: 'DELETE'
        });
    }

    // ==================== Vouchers Management ====================
    /**
     * Lấy danh sách Voucher với pagination và filter
     * @param {Object} params - Query parameters
     * @param {number} params.page - Số trang (default: 1)
     * @param {number} params.limit - Số lượng mỗi trang (default: 10)
     * @param {string} params.search - Tìm kiếm theo voucher_id (case-insensitive)
     * @param {string} params.voucher_type - discount hoặc shipping
     * @param {string} params.status - active (is_active = true) hoặc inactive (is_active = false)
     * @returns {Promise<Object>} { success: true, vouchers: [...], pagination: { page, limit, total, pages } }
     */
    async getVouchers(params = {}) {
        const queryParams = {
            page: params.page || 1,
            limit: params.limit || 10,
            ...(params.search && { search: params.search }),
            ...(params.voucher_type && { voucher_type: params.voucher_type }),
            ...(params.status && { status: params.status })
        };
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/api/vouchers${query ? '?' + query : ''}`);
    }

    async getVoucher(id) {
        return this.request(`/api/vouchers/admin/${id}`);
    }

    async createVoucher(data) {
        return this.request('/api/vouchers', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateVoucher(id, data) {
        return this.request(`/api/vouchers/admin/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteVoucher(id) {
        return this.request(`/api/vouchers/admin/${id}`, {
            method: 'DELETE'
        });
    }

    async archiveVoucher(id) {
        return this.updateVoucher(id, { is_deleted: true });
    }

    async restoreVoucher(id) {
        return this.updateVoucher(id, { is_deleted: false });
    }

    // ==================== Campaigns Management ====================
    async getCampaigns(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/campaigns${query ? '?' + query : ''}`);
    }

    async getCampaign(id) {
        return this.request(`/api/campaigns/${id}`);
    }

    async createCampaign(data) {
        // API expects multipart/form-data for file uploads
        if (data instanceof FormData) {
            const token = this.getToken();
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await fetch(`${this.baseUrl}/api/campaigns`, {
                method: 'POST',
                headers,
                body: data
            });
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Create campaign failed');
            }
            const result = await response.json();
            if (result && typeof result === 'object' && result.success === true && 'data' in result) {
                return result.data;
            }
            return result;
        } else {
            return this.request('/api/campaigns', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }
    }

    async updateCampaign(id, data) {
        // API expects multipart/form-data for file uploads
        if (data instanceof FormData) {
            const token = this.getToken();
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await fetch(`${this.baseUrl}/api/campaigns/${id}`, {
                method: 'PUT',
                headers,
                body: data
            });
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Update campaign failed');
            }
            const result = await response.json();
            if (result && typeof result === 'object' && result.success === true && 'data' in result) {
                return result.data;
            }
            return result;
        } else {
            return this.request(`/api/campaigns/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        }
    }

    async deleteCampaign(id) {
        return this.request(`/api/campaigns/${id}`, {
            method: 'DELETE'
        });
    }

    async addVouchersToCampaign(id, voucherIds) {
        return this.request(`/api/campaigns/${id}/vouchers`, {
            method: 'POST',
            body: JSON.stringify({ voucherIds })
        });
    }

    async deleteCampaignImage(id, imageUrl) {
        return this.request(`/api/campaigns/${id}/images`, {
            method: 'DELETE',
            body: JSON.stringify({ imageUrl })
        });
    }

    async clearCampaignImages(id, imageUrls = []) {
        return this.request(`/api/campaigns/clear-images/${id}`, {
            method: 'DELETE',
            body: JSON.stringify({ imageUrls })
        });
    }

    async clearSingleCampaignImage(id, imageUrl) {
        return this.request(`/api/campaigns/clear-single-image/${id}`, {
            method: 'DELETE',
            body: JSON.stringify({ imageUrl })
        });
    }

    async getTrashCampaigns() {
        return this.request('/api/campaigns/trash/all');
    }

    async restoreCampaign(id) {
        return this.request(`/api/campaigns/${id}/restore`, {
            method: 'PATCH'
        });
    }

    // ==================== Reviews Management ====================
    async deleteReview(reviewId) {
        return this.request(`/api/review/${reviewId}`, {
            method: 'DELETE'
        });
    }

    // ==================== Shipper Management ====================
    /**
     * Lấy danh sách Shipper (Admin Router) với pagination
     * @param {Object} params - Query parameters
     * @param {number} params.page - Số trang (default: 1)
     * @param {number} params.limit - Số lượng mỗi trang (default: 20)
     * @returns {Promise<Object>} { shippers: [...], pagination: { page, limit, total, pages } }
     */
    async getShippersList(params = {}) {
        const queryParams = {
            page: params.page || 1,
            limit: params.limit || 20
        };
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/api/admin/shippers${query ? '?' + query : ''}`);
    }

    /**
     * Lấy đơn hàng theo Shipper (Admin)
     * @param {string} shipperId - ID shipper
     * @param {Object} params - Query parameters
     * @param {number} params.page - Số trang (default: 1)
     * @param {number} params.limit - Số lượng mỗi trang (default: 20)
     * @param {string} params.status - Trạng thái đơn hàng
     * @returns {Promise<Object>} { shipper: {...}, orders: [...], pagination: {...}, stats: [...] }
     */
    async getShipperOrders(shipperId, params = {}) {
        const queryParams = {
            page: params.page || 1,
            limit: params.limit || 20,
            ...(params.status && { status: params.status })
        };
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/api/admin/shipper/${shipperId}/orders${query ? '?' + query : ''}`);
    }

    // ==================== Refund Management ====================
    /**
     * Lấy danh sách đơn hàng cần hoàn tiền với pagination và filter
     * @param {Object} params - Query parameters
     * @param {number} params.page - Số trang (default: 1)
     * @param {number} params.limit - Số lượng mỗi trang (default: 20)
     * @param {string} params.status - Trạng thái hoàn tiền: pending, processing, completed, failed
     * @returns {Promise<Object>} { orders: [...], pagination: { page, limit, total, pages } }
     */
    async getRefundRequests(params = {}) {
        const queryParams = {
            page: params.page || 1,
            limit: params.limit || 20,
            ...(params.status && { status: params.status })
        };
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/api/admin/refund-requests${query ? '?' + query : ''}`);
    }

    async processRefund(orderId, amount, reason) {
        return this.request(`/api/admin/refund/${orderId}/process`, {
            method: 'POST',
            body: JSON.stringify({ amount, reason })
        });
    }

    // ==================== Statistics ====================
    async getOrderStats() {
        return this.request('/api/admin/order-stats');
    }

    async getExpiringOrders(minutes = 5) {
        return this.request(`/api/admin/expiring-orders?minutes=${minutes}`);
    }

    // ==================== Reviews Management ====================
    /**
     * Lấy đánh giá của sản phẩm với pagination, filter và sort
     * @param {string} productId - ID sản phẩm (required)
     * @param {Object} params - Query parameters
     * @param {number} params.page - Số trang (default: 1)
     * @param {number} params.limit - Số lượng mỗi trang (default: 10)
     * @param {string} params.sort - latest, highest, lowest (default: latest)
     * @param {boolean} params.hasImage - true để chỉ lấy đánh giá có hình ảnh
     * @returns {Promise<Object>} { reviews: [...], pagination: {...}, summary: {...} }
     */
    async getProductReviews(productId, params = {}) {
        const queryParams = {
            page: params.page || 1,
            limit: params.limit || 10,
            sort: params.sort || 'latest',
            ...(params.hasImage !== undefined && { hasImage: params.hasImage })
        };
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/api/v1/review/product/${productId}${query ? '?' + query : ''}`);
    }

    /**
     * Lấy đánh giá của User với pagination
     * @param {string} userId - ID người dùng (required)
     * @param {Object} params - Query parameters
     * @param {number} params.page - Số trang (default: 1)
     * @param {number} params.limit - Số lượng mỗi trang (default: 10)
     * @returns {Promise<Object>} { reviews: [...], pagination: {...} }
     */
    async getUserReviews(userId, params = {}) {
        const queryParams = {
            page: params.page || 1,
            limit: params.limit || 10
        };
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/api/v1/review/user/${userId}${query ? '?' + query : ''}`);
    }

    /**
     * Lấy đánh giá của Current User với pagination
     * @param {Object} params - Query parameters
     * @param {number} params.page - Số trang (default: 1)
     * @param {number} params.limit - Số lượng mỗi trang (default: 10)
     * @returns {Promise<Object>} { reviews: [...], pagination: {...} }
     */
    async getMyReviews(params = {}) {
        const queryParams = {
            page: params.page || 1,
            limit: params.limit || 10
        };
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/api/v1/review/user/me${query ? '?' + query : ''}`);
    }

    async deleteReview(reviewId) {
        return this.request(`/api/v1/review/${reviewId}`, {
            method: 'DELETE'
        });
    }

    // ==================== Campaigns - Additional Methods ====================
    async getTrashCampaigns() {
        return this.request('/api/campaigns/trash/all');
    }

    async restoreCampaign(id) {
        return this.request(`/api/campaigns/${id}/restore`, {
            method: 'PATCH'
        });
    }

    // ==================== File Upload Helper ====================
    async uploadFile(file, endpoint = '/api/upload') {
        const formData = new FormData();
        formData.append('file', file);
        
        const token = this.getToken();
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers,
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Upload failed');
        }
        
        return response.json();
    }

    // ==================== Notifications Management ====================
    /**
     * Lấy danh sách Notification Templates với pagination và filter
     * @param {Object} params - Query parameters
     * @param {number} params.page - Số trang (default: 1)
     * @param {number} params.limit - Số lượng mỗi trang (default: 10)
     * @param {string} params.type - Loại template
     * @param {string} params.event - Sự kiện
     * @returns {Promise<Object>} { success: true, templates: [...], pagination: { page, limit, total, pages } }
     */
    async getNotificationTemplates(params = {}) {
        const queryParams = {
            page: params.page || 1,
            limit: params.limit || 10,
            ...(params.type && { type: params.type }),
            ...(params.event && { event: params.event })
        };
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/api/v1/admin/notification-templates${query ? '?' + query : ''}`);
    }

    async createNotificationTemplate(data) {
        return this.request('/api/v1/admin/notification-templates', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateNotificationTemplate(id, data) {
        return this.request(`/api/v1/admin/notification-templates/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteNotificationTemplate(id) {
        return this.request(`/api/v1/admin/notification-templates/${id}`, {
            method: 'DELETE'
        });
    }

    async sendDynamicNotification(data) {
        return this.request('/api/v1/admin/dynamic-notifications/send', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // Scheduled Notifications (Section 14 - different from admin scheduled notifications)
    /**
     * Lấy danh sách Scheduled Notifications (Public) với pagination và filter
     * @param {Object} params - Query parameters
     * @param {number} params.page - Số trang (default: 1)
     * @param {number} params.limit - Số lượng mỗi trang (default: 20)
     * @param {string} params.status - Trạng thái
     * @param {string} params.type - Loại
     * @param {string} params.startDate - YYYY-MM-DD
     * @param {string} params.endDate - YYYY-MM-DD
     * @returns {Promise<Object>} { scheduledNotifications: [...], total, page, limit }
     */
    async getScheduledNotifications(params = {}) {
        const queryParams = {
            page: params.page || 1,
            limit: params.limit || 20,
            ...(params.status && { status: params.status }),
            ...(params.type && { type: params.type }),
            ...(params.startDate && { startDate: params.startDate }),
            ...(params.endDate && { endDate: params.endDate })
        };
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/api/scheduled-notifications${query ? '?' + query : ''}`);
    }

    async createScheduledNotification(data) {
        // API expects multipart/form-data
        if (data instanceof FormData) {
            const token = this.getToken();
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await fetch(`${this.baseUrl}/api/scheduled-notifications`, {
                method: 'POST',
                headers,
                body: data
            });
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Create scheduled notification failed');
            }
            const result = await response.json();
            if (result && typeof result === 'object' && result.success === true && 'data' in result) {
                return result.data;
            }
            return result;
        } else {
            return this.request('/api/scheduled-notifications', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }
    }

    async updateScheduledNotification(id, data) {
        // API expects multipart/form-data
        if (data instanceof FormData) {
            const token = this.getToken();
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await fetch(`${this.baseUrl}/api/scheduled-notifications/${id}`, {
                method: 'PUT',
                headers,
                body: data
            });
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Update scheduled notification failed');
            }
            const result = await response.json();
            if (result && typeof result === 'object' && result.success === true && 'data' in result) {
                return result.data;
            }
            return result;
        } else {
            return this.request(`/api/scheduled-notifications/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        }
    }

    async deleteScheduledNotification(id) {
        return this.request(`/api/scheduled-notifications/${id}`, {
            method: 'DELETE'
        });
    }

    async getScheduledNotificationDetail(id) {
        return this.request(`/api/scheduled-notifications/${id}`);
    }

    // Admin Scheduled Notifications (Section 11.3 - different from Section 14)
    /**
     * Lấy danh sách Scheduled Notifications (Admin) với pagination và filter
     * @param {Object} params - Query parameters
     * @param {number} params.page - Số trang (default: 1)
     * @param {number} params.limit - Số lượng mỗi trang (default: 10)
     * @param {string} params.type - Loại notification
     * @param {string} params.status - Trạng thái: pending, sent, cancelled, failed
     * @returns {Promise<Object>} { success: true, notifications: [...], pagination: { page, limit, total, pages } }
     */
    async getAdminScheduledNotifications(params = {}) {
        const queryParams = {
            page: params.page || 1,
            limit: params.limit || 10,
            ...(params.type && { type: params.type }),
            ...(params.status && { status: params.status })
        };
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/api/v1/admin/scheduled-notifications${query ? '?' + query : ''}`);
    }

    async createAdminScheduledNotification(data) {
        return this.request('/api/v1/admin/scheduled-notifications', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateAdminScheduledNotification(id, data) {
        return this.request(`/api/v1/admin/scheduled-notifications/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteAdminScheduledNotification(id) {
        return this.request(`/api/v1/admin/scheduled-notifications/${id}`, {
            method: 'DELETE'
        });
    }

    /**
     * Lấy danh sách Instant Notifications với pagination và filter
     * @param {Object} params - Query parameters
     * @param {number} params.page - Số trang (default: 1)
     * @param {number} params.limit - Số lượng mỗi trang (default: 10)
     * @param {string} params.type - Loại notification
     * @param {string} params.status - Trạng thái
     * @returns {Promise<Object>} { success: true, notifications: [...], pagination: { page, limit, total, pages } }
     */
    async getInstantNotifications(params = {}) {
        const queryParams = {
            page: params.page || 1,
            limit: params.limit || 10,
            ...(params.type && { type: params.type }),
            ...(params.status && { status: params.status })
        };
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/api/v1/admin/instant-notifications${query ? '?' + query : ''}`);
    }

    async sendInstantNotification(data) {
        return this.request('/api/v1/admin/instant-notifications/send', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Lấy danh sách Users có Device Tokens với pagination và search
     * @param {Object} params - Query parameters
     * @param {number} params.page - Số trang (default: 1)
     * @param {number} params.limit - Số lượng mỗi trang (default: 20)
     * @param {string} params.search - Tìm kiếm theo username, email, hoặc full_name (case-insensitive)
     * @returns {Promise<Object>} { success: true, users: [...], pagination: { page, limit, total, pages } }
     */
    async getRecipientsUsers(params = {}) {
        const queryParams = {
            page: params.page || 1,
            limit: params.limit || 20,
            ...(params.search && { search: params.search })
        };
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/api/v1/admin/recipients/users${query ? '?' + query : ''}`);
    }

    /**
     * Lấy danh sách Shippers có Device Tokens với pagination và search
     * @param {Object} params - Query parameters
     * @param {number} params.page - Số trang (default: 1)
     * @param {number} params.limit - Số lượng mỗi trang (default: 20)
     * @param {string} params.search - Tìm kiếm theo username, email, hoặc full_name (case-insensitive)
     * @returns {Promise<Object>} { success: true, shippers: [...], pagination: { page, limit, total, pages } }
     */
    async getRecipientsShippers(params = {}) {
        const queryParams = {
            page: params.page || 1,
            limit: params.limit || 20,
            ...(params.search && { search: params.search })
        };
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/api/v1/admin/recipients/shippers${query ? '?' + query : ''}`);
    }

    async getNotificationStats(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/v1/admin/notification-stats${query ? '?' + query : ''}`);
    }

    async getNotificationEvents() {
        return this.request('/api/v1/admin/notification-events');
    }

    // Notification Template Router
    async createNotificationTemplateV2(data) {
        return this.request('/api/admin/notifications/templates', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateNotificationTemplateV2(id, data) {
        return this.request(`/api/admin/notifications/templates/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async toggleNotificationTemplate(id) {
        return this.request(`/api/admin/notifications/templates/${id}/toggle`, {
            method: 'PATCH'
        });
    }

    async deleteNotificationTemplateV2(id) {
        return this.request(`/api/admin/notifications/templates/${id}`, {
            method: 'DELETE'
        });
    }

    async previewNotificationTemplate(id, data) {
        return this.request(`/api/admin/notifications/templates/${id}/preview`, {
            method: 'POST',
            body: JSON.stringify({ data })
        });
    }

    async testNotificationTemplate(id, data, userId = null) {
        return this.request(`/api/admin/notifications/templates/${id}/test`, {
            method: 'POST',
            body: JSON.stringify({ data, userId })
        });
    }

    // Notification History
    /**
     * Lấy lịch sử thông báo với pagination, filter và sort
     * @param {Object} params - Query parameters
     * @param {number} params.page - Số trang (default: 1)
     * @param {number} params.limit - Số lượng mỗi trang (default: 20)
     * @param {string} params.recipientType - Loại người nhận: user, shipper, admin
     * @param {string} params.recipientId - ID người nhận
     * @param {string} params.status - Trạng thái: sent, delivered, read, failed
     * @param {string} params.type - Loại thông báo: push, email, sms
     * @param {string} params.category - Danh mục
     * @param {string} params.startDate - Ngày bắt đầu (YYYY-MM-DD)
     * @param {string} params.endDate - Ngày kết thúc (YYYY-MM-DD)
     * @param {string} params.sortBy - Trường sắp xếp (default: sentAt)
     * @param {string} params.sortOrder - Thứ tự: asc hoặc desc (default: desc)
     * @returns {Promise<Object>} { success: true, data: [...], pagination: { page, limit, total, totalPages } }
     */
    async getNotificationHistory(params = {}) {
        const queryParams = {
            page: params.page || 1,
            limit: params.limit || 20,
            ...(params.recipientType && { recipientType: params.recipientType }),
            ...(params.recipientId && { recipientId: params.recipientId }),
            ...(params.status && { status: params.status }),
            ...(params.type && { type: params.type }),
            ...(params.category && { category: params.category }),
            ...(params.startDate && { startDate: params.startDate }),
            ...(params.endDate && { endDate: params.endDate }),
            sortBy: params.sortBy || 'sentAt',
            sortOrder: params.sortOrder || 'desc'
        };
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/api/notification-history${query ? '?' + query : ''}`);
    }

    async getNotificationHistoryStats(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/notification-history/stats${query ? '?' + query : ''}`);
    }

    async cleanOldNotifications(days = 90) {
        return this.request('/api/notification-history/clean-old', {
            method: 'POST',
            body: JSON.stringify({ days })
        });
    }

    async exportNotificationHistory(data) {
        return this.request('/api/notification-history/export', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // Notification Utilities
    async resetRateLimits() {
        return this.request('/api/admin/notifications/reset-rate-limits', {
            method: 'POST'
        });
    }

    async clearPendingNotifications() {
        return this.request('/api/admin/notifications/clear-pending', {
            method: 'POST'
        });
    }

    // ==================== Statistics & Reports ====================
    async getDashboardStats() {
        return this.request('/api/admin/statistics/dashboard');
    }

    async getSalesReport(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/admin/reports/sales${query ? '?' + query : ''}`);
    }

    async getOrderStatistics(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/admin/statistics/orders${query ? '?' + query : ''}`);
    }

    async getRevenueByCategory(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/admin/statistics/revenue/category${query ? '?' + query : ''}`);
    }

    async getRevenueByTime(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/admin/statistics/revenue/time${query ? '?' + query : ''}`);
    }

    async getSalesReport(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/admin/statistics/sales-report${query ? '?' + query : ''}`);
    }

    async getOrderStatisticsDetail(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/admin/statistics/orders/detail${query ? '?' + query : ''}`);
    }

    // ==================== System Settings ====================
    /**
     * Lấy tất cả settings (Admin)
     * @param {string} category - Optional: Filter theo category
     * @returns {Promise<Object>} { success: true, settings: [...] }
     */
    async getSettings(category = null) {
        const url = category 
            ? `${this.baseUrl}/api/admin/settings?category=${category}`
            : `${this.baseUrl}/api/admin/settings`;
        return this.request(url);
    }

    /**
     * Lấy setting theo key (Admin)
     * @param {string} key - Setting key
     * @returns {Promise<Object>} { success: true, setting: {...} }
     */
    async getSetting(key) {
        return this.request(`/api/admin/settings/${key}`);
    }

    /**
     * Cập nhật setting (Admin)
     * @param {string} key - Setting key
     * @param {*} value - Setting value
     * @returns {Promise<Object>} { success: true, setting: {...} }
     */
    async updateSetting(key, value) {
        return this.request(`/api/admin/settings/${key}`, {
            method: 'PUT',
            body: JSON.stringify({ value })
        });
    }

    /**
     * Cập nhật nhiều settings (Admin)
     * @param {Array} settings - Array of { key, value }
     * @returns {Promise<Object>} { success: true, updated: number, settings: [...] }
     */
    async updateSettingsBulk(settings) {
        return this.request('/api/admin/settings/bulk', {
            method: 'PUT',
            body: JSON.stringify({ settings })
        });
    }

    /**
     * Tạo setting mới (Admin)
     * @param {Object} setting - { key, value, type, category, description, isPublic }
     * @returns {Promise<Object>} { success: true, setting: {...} }
     */
    async createSetting(setting) {
        return this.request('/api/admin/settings', {
            method: 'POST',
            body: JSON.stringify(setting)
        });
    }

    /**
     * Lấy public settings (không cần auth)
     * @returns {Promise<Object>} { success: true, settings: {...} }
     */
    async getPublicSettings() {
        return this.request('/api/settings/public');
    }

    // ==================== System Management ====================
    /**
     * Lấy thông tin hệ thống (Admin)
     * @returns {Promise<Object>} { success: true, system: {...} }
     */
    async getSystemInfo() {
        return this.request('/api/admin/system/info');
    }

    /**
     * Lấy system logs (Admin)
     * @param {Object} params - { page, limit, level, start_date, end_date }
     * @returns {Promise<Object>} { success: true, logs: [...], pagination: {...} }
     */
    async getSystemLogs(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/admin/system/logs${query ? '?' + query : ''}`);
    }

    /**
     * Tạo backup (Admin)
     * @returns {Promise<Object>} { success: true, backup: {...} }
     */
    async createBackup() {
        return this.request('/api/admin/system/backup', {
            method: 'POST'
        });
    }

    /**
     * Lấy danh sách backups (Admin)
     * @returns {Promise<Object>} { success: true, backups: [...] }
     */
    async getBackups() {
        return this.request('/api/admin/system/backups');
    }

    /**
     * Restore từ backup (Admin)
     * @param {string} backupId - Backup ID
     * @returns {Promise<Object>} { success: true, message: '...' }
     */
    async restoreBackup(backupId) {
        return this.request(`/api/admin/system/restore/${backupId}`, {
            method: 'POST'
        });
    }

    // ==================== Payment Management ====================
    async getPayments(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/payments${query ? '?' + query : ''}`);
    }

    async getPayment(id) {
        return this.request(`/api/payments/${id}`);
    }

    async createPayment(data) {
        return this.request('/api/payments', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // ==================== Address Management ====================
    async getProvinces(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/admin/address/provinces${query ? '?' + query : ''}`);
    }

    async getDistricts(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/admin/address/districts${query ? '?' + query : ''}`);
    }

    async getWards(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/admin/address/wards${query ? '?' + query : ''}`);
    }

    async updateAddress(data) {
        return this.request('/api/admin/address/update', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // ==================== Email Verification ====================
    async verifyUserEmail(userId) {
        return this.request('/api/admin/email-verification/verify-user-email', {
            method: 'POST',
            body: JSON.stringify({ userId })
        });
    }

    async verifyMultipleUsers(userIds) {
        return this.request('/api/admin/email-verification/verify-multiple-users', {
            method: 'POST',
            body: JSON.stringify({ userIds })
        });
    }

    async getUnverifiedUsers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/admin/email-verification/unverified-users${query ? '?' + query : ''}`);
    }

    async sendVerificationEmail(userId) {
        return this.request('/api/admin/email-verification/send-verification', {
            method: 'POST',
            body: JSON.stringify({ userId })
        });
    }

    // ==================== Messages/Support ====================
    async getConversations(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/admin/messages/conversations${query ? '?' + query : ''}`);
    }

    async assignConversation(conversationId, assignedTo) {
        return this.request(`/api/admin/messages/conversations/${conversationId}/assign`, {
            method: 'PATCH',
            body: JSON.stringify({ assignedTo })
        });
    }

    async updateConversationStatus(conversationId, status) {
        return this.request(`/api/admin/messages/conversations/${conversationId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }

    async getMessageStats(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/admin/messages/stats${query ? '?' + query : ''}`);
    }

    // ==================== Shipper Notifications ====================
    async getShipperNotificationStatus() {
        return this.request('/api/v1/shipper-notifications/status');
    }

    async testAwaitingPickupNotification(orderId, shipperId) {
        return this.request('/api/v1/shipper-notifications/test-awaiting-pickup', {
            method: 'POST',
            body: JSON.stringify({ orderId, shipperId })
        });
    }

    async testDeliverySuccessNotification(orderId, shipperId) {
        return this.request('/api/v1/shipper-notifications/test-delivery-success', {
            method: 'POST',
            body: JSON.stringify({ orderId, shipperId })
        });
    }

    async testRatingNotification(shipperId, ratingData) {
        return this.request('/api/v1/shipper-notifications/test-rating', {
            method: 'POST',
            body: JSON.stringify({ shipper_id: shipperId, rating_data: ratingData })
        });
    }

    async broadcastAwaitingPickup(orderData) {
        return this.request('/api/v1/shipper-notifications/broadcast-awaiting-pickup', {
            method: 'POST',
            body: JSON.stringify({ order_data: orderData })
        });
    }

    async getShippersForNotification() {
        return this.request('/api/v1/shipper-notifications/shippers');
    }

    async sendNotificationToOrderShipper(orderId, notificationType) {
        return this.request('/api/v1/shipper-notifications/send-to-order-shipper', {
            method: 'POST',
            body: JSON.stringify({ order_id: orderId, notification_type: notificationType })
        });
    }

    // ==================== CKEditor Upload ====================
    async uploadCKEditorImage(file) {
        const formData = new FormData();
        formData.append('upload', file);
        
        const token = this.getToken();
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${this.baseUrl}/api/ckeditor/ckeditor5-upload`, {
            method: 'POST',
            headers,
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Upload image failed');
        }
        
        const result = await response.json();
        // Response format: { "default": "https://cloudinary.com/..." }
        return result.default || result.url || result;
    }

    async uploadCKEditorImageFromUrl(url) {
        return this.request('/api/ckeditor/ckeditor5-upload-from-url', {
            method: 'POST',
            body: JSON.stringify({ url })
        });
    }

    async uploadCKEditorImageBase64(imageData) {
        return this.request('/api/ckeditor/ckeditor5-upload-base64', {
            method: 'POST',
            body: JSON.stringify({ imageData })
        });
    }

    async uploadCKEditorImagesMultiple(files) {
        const formData = new FormData();
        // files should be an array of File objects
        if (Array.isArray(files)) {
            files.forEach((file, index) => {
                formData.append('upload', file);
            });
        } else {
            formData.append('upload', files);
        }
        
        const token = this.getToken();
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${this.baseUrl}/api/ckeditor/ckeditor5-upload-multiple`, {
            method: 'POST',
            headers,
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Upload images failed');
        }
        
        const result = await response.json();
        // Response format: { "urls": ["https://...", "https://..."] }
        return result.urls || result;
    }

    // ==================== Utility Methods ====================
    formatCurrency(amount) {
        if (!amount) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(amount);
    }

    formatDate(dateString) {
        if (!dateString) return '';
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(dateString));
    }

    formatDateOnly(dateString) {
        if (!dateString) return '';
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date(dateString));
    }

    // ==================== User Profile Management ====================
    /**
     * Lấy thông tin cá nhân của user đang đăng nhập
     * @returns {Promise<Object>} User object
     */
    async getMyProfile() {
        console.log('👤 [AdminServices] getMyProfile called');
        try {
            const response = await this.request('/api/users/me');
            console.log('📦 [AdminServices] getMyProfile response:', response);
            return response;
        } catch (error) {
            console.error('❌ [AdminServices] getMyProfile error:', error);
            throw error;
        }
    }

    /**
     * Cập nhật thông tin cá nhân
     * @param {Object} data - { full_name, phone_number, gender, birth_date, avatar }
     * @returns {Promise<Object>} Updated user object
     */
    async updateProfile(data) {
        console.log('📤 [AdminServices] updateProfile called with:', data);
        const response = await this.request('/api/users/update', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        console.log('📦 [AdminServices] updateProfile response:', response);
        return response;
    }

    /**
     * Đổi mật khẩu
     * @param {string} currentPassword - Mật khẩu hiện tại
     * @param {string} newPassword - Mật khẩu mới
     * @returns {Promise<Object>} { message: "Password changed successfully" }
     */
    async changePassword(currentPassword, newPassword) {
        console.log('🔐 [AdminServices] changePassword called');
        try {
            const response = await this.request('/api/users/change-password', {
                method: 'PUT',
                body: JSON.stringify({ currentPassword, newPassword })
            });
            console.log('📦 [AdminServices] changePassword response:', response);
            return response;
        } catch (error) {
            console.error('❌ [AdminServices] changePassword error:', error);
            throw error;
        }
    }

    /**
     * Yêu cầu đổi email
     * @param {string} newEmail - Email mới
     * @param {string} currentPassword - Mật khẩu hiện tại
     * @returns {Promise<Object>} { success, message, old_email, new_email, expiresIn }
     */
    async requestEmailChange(newEmail, currentPassword) {
        console.log('📧 [AdminServices] requestEmailChange called with:', { 
            newEmail, 
            currentPassword: '***',
            timestamp: new Date().toISOString()
        });
        
        try {
            // Validate inputs
            if (!newEmail || !currentPassword) {
                const error = new Error('Email mới và mật khẩu hiện tại là bắt buộc');
                console.error('❌ [AdminServices] requestEmailChange validation error:', error);
                throw error;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(newEmail)) {
                const error = new Error('Email không hợp lệ');
                console.error('❌ [AdminServices] requestEmailChange email validation error:', error);
                throw error;
            }

            console.log('📧 [AdminServices] Sending request to /api/users/change-email');
            
            const response = await this.request('/api/users/change-email', {
                method: 'PUT',
                body: JSON.stringify({ newEmail, currentPassword })
            });
            
            console.log('✅ [AdminServices] requestEmailChange response received:', {
                success: response?.success,
                message: response?.message,
                old_email: response?.old_email,
                new_email: response?.new_email,
                expiresIn: response?.expiresIn,
                timestamp: new Date().toISOString()
            });
            
            // Log warning if response doesn't have expected structure
            if (!response || typeof response !== 'object') {
                console.warn('⚠️ [AdminServices] Unexpected response format:', response);
            }
            
            return response;
        } catch (error) {
            console.error('❌ [AdminServices] requestEmailChange error:', {
                message: error.message,
                name: error.name,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            
            // Provide more user-friendly error messages based on backend error codes
            const errorMessage = error.message || '';
            
            // Email Service Errors
            if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('Connection timeout')) {
                throw new Error('Kết nối email service bị timeout. Vui lòng kiểm tra cấu hình EMAIL_USER và EMAIL_PASSWORD, hoặc thử lại sau.');
            }
            
            if (errorMessage.includes('EAUTH') || errorMessage.includes('Authentication failed')) {
                throw new Error('Lỗi xác thực email. Vui lòng kiểm tra EMAIL_USER và EMAIL_PASSWORD (phải là App Password từ Gmail).');
            }
            
            if (errorMessage.includes('ECONNECTION') || errorMessage.includes('Connection error')) {
                throw new Error('Không thể kết nối đến email service. Vui lòng kiểm tra kết nối mạng và firewall.');
            }
            
            // ESMS Service Errors
            if (errorMessage.includes('CodeResult') && errorMessage.includes('101')) {
                throw new Error('Lỗi xác thực ESMS. Vui lòng kiểm tra ESMS_API_KEY và ESMS_SECRET_KEY trong environment variables.');
            }
            
            if (errorMessage.includes('CodeResult') && errorMessage.includes('102')) {
                throw new Error('Tài khoản ESMS không đủ số dư để gửi SMS. Vui lòng nạp tiền vào tài khoản ESMS.');
            }
            
            if (errorMessage.includes('CodeResult') && errorMessage.includes('103')) {
                throw new Error('Brandname ESMS không hợp lệ hoặc chưa được đăng ký. Vui lòng kiểm tra cấu hình ESMS_BRANDNAME.');
            }
            
            // Network Errors
            if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
                throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
            }
            
            throw error;
        }
    }

    /**
     * Xác thực đổi email bằng OTP
     * @param {string} oldEmailOtp - OTP từ email cũ
     * @param {string} newEmailOtp - OTP từ email mới
     * @returns {Promise<Object>} { success, message, data }
     */
    async verifyEmailChange(oldEmailOtp, newEmailOtp) {
        console.log('📧 [AdminServices] verifyEmailChange called', {
            oldEmailOtpLength: oldEmailOtp?.length || 0,
            newEmailOtpLength: newEmailOtp?.length || 0,
            timestamp: new Date().toISOString()
        });
        
        try {
            // Validate inputs
            if (!oldEmailOtp || !newEmailOtp) {
                const error = new Error('Cả hai mã OTP (email cũ và email mới) đều là bắt buộc');
                console.error('❌ [AdminServices] verifyEmailChange validation error:', error);
                throw error;
            }

            // Clean OTPs (remove spaces and non-numeric characters)
            const cleanOTP = (otp) => {
                if (!otp) return '';
                return otp.toString().replace(/\s/g, '').replace(/[^0-9]/g, '').trim();
            };
            
            const cleanedOldOtp = cleanOTP(oldEmailOtp);
            const cleanedNewOtp = cleanOTP(newEmailOtp);
            
            console.log('📧 [AdminServices] OTPs cleaned:', {
                oldOtp: { original: oldEmailOtp?.length || 0, cleaned: cleanedOldOtp.length },
                newOtp: { original: newEmailOtp?.length || 0, cleaned: cleanedNewOtp.length }
            });
            
            if (!cleanedOldOtp || !cleanedNewOtp) {
                const error = new Error('Mã OTP không hợp lệ');
                console.error('❌ [AdminServices] verifyEmailChange OTP validation error:', error);
                throw error;
            }
            
            console.log('📧 [AdminServices] Sending verification request to /api/users/verify-email-change');
            
            const response = await this.request('/api/users/verify-email-change', {
                method: 'POST',
                body: JSON.stringify({ oldEmailOtp: cleanedOldOtp, newEmailOtp: cleanedNewOtp })
            });
            
            console.log('✅ [AdminServices] verifyEmailChange response received:', {
                success: response?.success,
                message: response?.message,
                hasData: !!response?.data,
                timestamp: new Date().toISOString()
            });
            
            return response;
        } catch (error) {
            console.error('❌ [AdminServices] verifyEmailChange error:', {
                message: error.message,
                name: error.name,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            
            // Provide more user-friendly error messages based on backend error codes
            const errorMessage = error.message || '';
            
            // Email Service Errors
            if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('Connection timeout')) {
                throw new Error('Kết nối email service bị timeout. Vui lòng kiểm tra cấu hình EMAIL_USER và EMAIL_PASSWORD, hoặc thử lại sau.');
            }
            
            if (errorMessage.includes('EAUTH') || errorMessage.includes('Authentication failed')) {
                throw new Error('Lỗi xác thực email. Vui lòng kiểm tra EMAIL_USER và EMAIL_PASSWORD (phải là App Password từ Gmail).');
            }
            
            if (errorMessage.includes('ECONNECTION') || errorMessage.includes('Connection error')) {
                throw new Error('Không thể kết nối đến email service. Vui lòng kiểm tra kết nối mạng và firewall.');
            }
            
            // ESMS Service Errors
            if (errorMessage.includes('CodeResult') && errorMessage.includes('101')) {
                throw new Error('Lỗi xác thực ESMS. Vui lòng kiểm tra ESMS_API_KEY và ESMS_SECRET_KEY trong environment variables.');
            }
            
            if (errorMessage.includes('CodeResult') && errorMessage.includes('102')) {
                throw new Error('Tài khoản ESMS không đủ số dư để gửi SMS. Vui lòng nạp tiền vào tài khoản ESMS.');
            }
            
            if (errorMessage.includes('CodeResult') && errorMessage.includes('103')) {
                throw new Error('Brandname ESMS không hợp lệ hoặc chưa được đăng ký. Vui lòng kiểm tra cấu hình ESMS_BRANDNAME.');
            }
            
            // OTP Errors
            if (errorMessage.includes('OTP') || errorMessage.includes('expired') || errorMessage.includes('invalid')) {
                throw new Error('Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.');
            }
            
            // Network Errors
            if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
                throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
            }
            
            throw error;
        }
    }

    /**
     * Gửi email xác thực
     * @param {string} email - Email cần xác thực
     * @param {string} purpose - Mục đích: "registration" hoặc "email_change"
     * @returns {Promise<Object>} { success, message, data }
     */
    async sendEmailVerification(email, purpose = 'registration') {
        console.log('📧 [AdminServices] sendEmailVerification called with:', { email, purpose });
        try {
            const response = await this.request('/api/email-verification/send-verification', {
                method: 'POST',
                body: JSON.stringify({ email, purpose })
            });
            console.log('📦 [AdminServices] sendEmailVerification response:', response);
            return response;
        } catch (error) {
            console.error('❌ [AdminServices] sendEmailVerification error:', error);
            throw error;
        }
    }

    /**
     * Xác thực email bằng token
     * @param {string} token - Verification token
     * @param {string} type - Loại: "registration" hoặc "email_change"
     * @returns {Promise<Object>} { success, message, data }
     */
    async verifyEmail(token, type = 'registration') {
        return this.request('/api/email-verification/verify', {
            method: 'POST',
            body: JSON.stringify({ token, type })
        });
    }

    /**
     * Gửi lại email xác thực
     * @returns {Promise<Object>} { success, message, data }
     */
    async resendEmailVerification() {
        return this.request('/api/email-verification/resend', {
            method: 'POST'
        });
    }

    /**
     * Kiểm tra trạng thái xác thực email
     * @returns {Promise<Object>} { success, data: { email, isEmailVerified, emailVerifiedAt } }
     */
    async getEmailVerificationStatus() {
        return this.request('/api/email-verification/status');
    }

    /**
     * Gửi OTP SMS
     * @param {string} phone - Số điện thoại
     * @returns {Promise<Object>} { success: true }
     */
    async requestSMSOTP(phone) {
        console.log('📱 [AdminServices] requestSMSOTP called with:', { phone, timestamp: new Date().toISOString() });
        try {
            // Validate phone number
            if (!phone) {
                const error = new Error('Số điện thoại là bắt buộc');
                console.error('❌ [AdminServices] requestSMSOTP validation error:', error);
                throw error;
            }

            // Clean phone number (remove spaces, dashes, etc.)
            const cleanPhone = phone.replace(/\s+/g, '').replace(/[-\s()]/g, '');
            
            console.log('📱 [AdminServices] Sending SMS OTP request to /api/users/auth/request-otp');
            
            const response = await this.request('/api/users/auth/request-otp', {
                method: 'POST',
                body: JSON.stringify({ phone: cleanPhone })
            });
            
            console.log('✅ [AdminServices] requestSMSOTP response received:', {
                success: response?.success,
                message: response?.message,
                timestamp: new Date().toISOString()
            });
            
            return response;
        } catch (error) {
            console.error('❌ [AdminServices] requestSMSOTP error:', {
                message: error.message,
                name: error.name,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            
            // Provide more user-friendly error messages based on backend error codes
            const errorMessage = error.message || '';
            
            // ESMS Service Errors
            if (errorMessage.includes('CodeResult') && errorMessage.includes('101')) {
                throw new Error('Lỗi xác thực ESMS. Vui lòng kiểm tra ESMS_API_KEY và ESMS_SECRET_KEY trong environment variables.');
            }
            
            if (errorMessage.includes('CodeResult') && errorMessage.includes('102')) {
                throw new Error('Tài khoản ESMS không đủ số dư để gửi SMS. Vui lòng nạp tiền vào tài khoản ESMS.');
            }
            
            if (errorMessage.includes('CodeResult') && errorMessage.includes('103')) {
                throw new Error('Brandname ESMS không hợp lệ hoặc chưa được đăng ký. Vui lòng kiểm tra cấu hình ESMS_BRANDNAME.');
            }
            
            // Network Errors
            if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
                throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
            }
            
            throw error;
        }
    }

    /**
     * Xác thực OTP SMS
     * @param {string} phone - Số điện thoại
     * @param {string} otp - Mã OTP
     * @returns {Promise<Object>} { success, message, access_token, refresh_token, user }
     */
    async verifySMSOTP(phone, otp) {
        console.log('📱 [AdminServices] verifySMSOTP called');
        try {
            const response = await this.request('/api/users/auth/verify-otp', {
                method: 'POST',
                body: JSON.stringify({ phone, otp })
            });
            console.log('📦 [AdminServices] verifySMSOTP response:', response);
            return response;
        } catch (error) {
            console.error('❌ [AdminServices] verifySMSOTP error:', error);
            throw error;
        }
    }

    /**
     * Validate token
     * @returns {Promise<Object>} { success, valid, user, token_info }
     */
    async validateToken() {
        console.log('🔐 [AdminServices] validateToken called');
        try {
            const response = await this.request('/api/users/validate-token');
            console.log('📦 [AdminServices] validateToken response:', response);
            return response;
        } catch (error) {
            console.error('❌ [AdminServices] validateToken error:', error);
            throw error;
        }
    }

    /**
     * Yêu cầu thay đổi/thêm số điện thoại
     * POST /api/users/request-phone-change
     * @param {string} newPhone - Số điện thoại mới
     * @returns {Promise<Object>} { success, message, step, old_phone?, new_phone }
     */
    async requestPhoneChange(newPhone) {
        console.log('📱 [AdminServices] requestPhoneChange called with:', { newPhone });
        try {
            const response = await this.request('/api/users/request-phone-change', {
                method: 'POST',
                body: JSON.stringify({ new_phone: newPhone })
            });
            console.log('📦 [AdminServices] requestPhoneChange response:', response);
            
            // Log thông tin quan trọng
            if (response.step) {
                console.log('📱 [AdminServices] Phone change step:', response.step);
                if (response.step === 'verify_old_phone') {
                    console.log('📱 [AdminServices] Need to verify old phone first:', {
                        old_phone: response.old_phone,
                        new_phone: response.new_phone
                    });
                } else if (response.step === 'verify_new_phone') {
                    console.log('📱 [AdminServices] Need to verify new phone:', {
                        phone: response.phone || response.new_phone
                    });
                }
            }
            
            return response;
        } catch (error) {
            console.error('❌ [AdminServices] requestPhoneChange error:', error);
            throw error;
        }
    }

    /**
     * Xác thực OTP và hoàn tất thay đổi số điện thoại
     * POST /api/users/verify-phone-change
     * @param {string} otp - Mã OTP
     * @returns {Promise<Object>} { success, message, data, user }
     */
    async verifyPhoneChange(otp) {
        console.log('📱 [AdminServices] verifyPhoneChange called');
        try {
            // Clean OTP trước khi gửi (loại bỏ spaces)
            const cleanOTP = (otp) => {
                if (!otp) return '';
                return otp.toString().replace(/\s/g, '').replace(/[^0-9]/g, '').trim();
            };
            
            const cleanOtp = cleanOTP(otp);
            
            console.log('📱 [AdminServices] OTP cleaned:', {
                original: otp,
                cleaned: cleanOtp
            });
            
            const response = await this.request('/api/users/verify-phone-change', {
                method: 'POST',
                body: JSON.stringify({ otp: cleanOtp })
            });
            console.log('📦 [AdminServices] verifyPhoneChange response:', response);
            
            return response;
        } catch (error) {
            console.error('❌ [AdminServices] verifyPhoneChange error:', error);
            throw error;
        }
    }

    /**
     * Upload avatar
     * @param {File} file - File ảnh
     * @returns {Promise<string>} URL của avatar
     */
    async uploadAvatar(file) {
        console.log('📤 [AdminServices] uploadAvatar called with file:', file?.name, file?.size);
        try {
            // Validate file
            if (!file) {
                throw new Error('File is required');
            }
            
            if (!file.type || !file.type.startsWith('image/')) {
                throw new Error('Chỉ cho phép upload ảnh');
            }
            
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('Kích thước ảnh không được vượt quá 5MB');
            }
            
            // Sử dụng endpoint /api/user-upload/avatar
            const formData = new FormData();
            formData.append('avatar', file); // Field name phải là 'avatar' theo backend
            
            const token = this.getToken();
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            // Không set Content-Type, browser sẽ tự động set với boundary cho multipart/form-data
            
            console.log('📤 [AdminServices] Uploading to:', `${this.baseUrl}/api/user-upload/avatar`);
            
            const response = await fetch(`${this.baseUrl}/api/user-upload/avatar`, {
                method: 'POST',
                headers,
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                console.error('❌ [AdminServices] uploadAvatar error response:', error);
                throw new Error(error.message || error.msg || `Upload avatar failed: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('📦 [AdminServices] uploadAvatar response:', result);
            
            // Backend trả về: { success: true, avatar: "...", user: {...} }
            if (result.success && result.avatar) {
                return result.avatar;
            }
            
            // Fallback: thử các format khác
            if (result.avatar) {
                return result.avatar;
            }
            if (result.data && result.data.avatar) {
                return result.data.avatar;
            }
            if (result.url) {
                return result.url;
            }
            
            console.warn('⚠️ [AdminServices] Unexpected response format:', result);
            throw new Error('Không thể lấy URL avatar từ response');
        } catch (error) {
            console.error('❌ [AdminServices] uploadAvatar error:', error);
            throw error;
        }
    }
}

// Export singleton instance
window.AdminServices = new AdminServices();


