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
        
        const config = {
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...(options.headers || {})
            }
        };

        try {
            const response = await fetch(url, config);
            
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

            const data = await response.json().catch(() => ({}));
            
            if (!response.ok) {
                throw new Error(data.message || data.msg || `HTTP ${response.status}: ${response.statusText}`);
            }

            // Tự động extract data nếu response có format { success: true, data: {...} }
            // Hoặc { success: true, data: [...] }
            if (data && typeof data === 'object' && data.success === true && 'data' in data) {
                return data.data;
            }

            return data;
        } catch (error) {
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
    async getBooks(params = {}) {
        const query = new URLSearchParams(params).toString();
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
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Create book failed');
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
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Update book failed');
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
    async getOrders(params = {}) {
        const query = new URLSearchParams(params).toString();
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

    async getOrdersByPaymentMethod(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/orders/by-payment-method${query ? '?' + query : ''}`);
    }

    async getShipperDetails(id) {
        return this.request(`/api/orders/${id}/shipper-details`);
    }

    async getShipperAssignments(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/orders/shipper-assignments${query ? '?' + query : ''}`);
    }

    async getShipperPerformance(params = {}) {
        const query = new URLSearchParams(params).toString();
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

    async getShippers(params = {}) {
        const query = new URLSearchParams(params).toString();
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
    async getCategories(params = {}) {
        const query = new URLSearchParams(params).toString();
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
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Create category failed');
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
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Update category failed');
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
    async getVouchers(params = {}) {
        const query = new URLSearchParams(params).toString();
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
    async getShippersList(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/admin/shippers${query ? '?' + query : ''}`);
    }

    async getShipperOrders(shipperId, params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/admin/shipper/${shipperId}/orders${query ? '?' + query : ''}`);
    }

    // ==================== Refund Management ====================
    async getRefundRequests(params = {}) {
        const query = new URLSearchParams(params).toString();
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
    async getNotificationTemplates(params = {}) {
        const query = new URLSearchParams(params).toString();
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
    async getScheduledNotifications(params = {}) {
        const query = new URLSearchParams(params).toString();
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
    async getAdminScheduledNotifications(params = {}) {
        const query = new URLSearchParams(params).toString();
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

    async getInstantNotifications(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/v1/admin/instant-notifications${query ? '?' + query : ''}`);
    }

    async sendInstantNotification(data) {
        return this.request('/api/v1/admin/instant-notifications/send', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getRecipientsUsers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/v1/admin/recipients/users${query ? '?' + query : ''}`);
    }

    async getRecipientsShippers(params = {}) {
        const query = new URLSearchParams(params).toString();
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
    async getNotificationHistory(params = {}) {
        const query = new URLSearchParams(params).toString();
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
}

// Export singleton instance
window.AdminServices = new AdminServices();


