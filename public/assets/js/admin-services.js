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
        // Chỉ trả về header Authorization, Content-Type sẽ được set động trong request()
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    // ==================== Request Handler ====================
    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        
        // Hợp nhất headers và tự động set Content-Type cho JSON (không áp dụng cho FormData)
        const baseHeaders = this.getAuthHeaders();
        const isFormData = options.body instanceof FormData;
        const mergedHeaders = {
            ...baseHeaders,
            ...(options.headers || {})
        };
        if (options.body && !isFormData && !mergedHeaders['Content-Type']) {
            mergedHeaders['Content-Type'] = 'application/json';
        }

        const config = {
            ...options,
            headers: mergedHeaders
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
        return this.request('/api/books', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateBook(id, data) {
        return this.request(`/api/books/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
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

    async updateOrderStatus(id, status, note = '') {
        return this.request(`/api/orders/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, note })
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
    async getUsers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/users/users${query ? '?' + query : ''}`);
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
    async getCategories() {
        return this.request('/api/categories');
    }

    async getCategory(id) {
        return this.request(`/api/categories/${id}`);
    }

    async createCategory(data) {
        return this.request('/api/categories', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateCategory(id, data) {
        return this.request(`/api/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
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
        // Sử dụng endpoint voucher chuẩn (đã dùng ở ApiClient legacy)
        return this.request(`/api/vouchers/${id}`);
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
        return this.request('/api/campaigns', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateCampaign(id, data) {
        return this.request(`/api/campaigns/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
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
        return this.request(`/api/review/${reviewId}`, {
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
        return this.request(`/api/admin/notification-templates${query ? '?' + query : ''}`);
    }

    async createNotificationTemplate(data) {
        return this.request('/api/admin/notification-templates', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateNotificationTemplate(id, data) {
        return this.request(`/api/admin/notification-templates/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteNotificationTemplate(id) {
        return this.request(`/api/admin/notification-templates/${id}`, {
            method: 'DELETE'
        });
    }

    async sendDynamicNotification(data) {
        return this.request('/api/admin/dynamic-notifications/send', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getScheduledNotifications(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/admin/scheduled-notifications${query ? '?' + query : ''}`);
    }

    async createScheduledNotification(data) {
        return this.request('/api/admin/scheduled-notifications', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateScheduledNotification(id, data) {
        return this.request(`/api/admin/scheduled-notifications/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteScheduledNotification(id) {
        return this.request(`/api/admin/scheduled-notifications/${id}`, {
            method: 'DELETE'
        });
    }

    async getInstantNotifications(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/admin/instant-notifications${query ? '?' + query : ''}`);
    }

    async sendInstantNotification(data) {
        return this.request('/api/admin/instant-notifications/send', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getRecipientsUsers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/admin/recipients/users${query ? '?' + query : ''}`);
    }

    async getRecipientsShippers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/admin/recipients/shippers${query ? '?' + query : ''}`);
    }

    async getNotificationStats(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/admin/notification-stats${query ? '?' + query : ''}`);
    }

    async getNotificationEvents() {
        return this.request('/api/admin/notification-events');
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
        return this.request(`/api/admin/notifications/history${query ? '?' + query : ''}`);
    }

    async getNotificationHistoryStats(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/admin/notifications/history/stats${query ? '?' + query : ''}`);
    }

    async cleanOldNotifications(days = 90) {
        return this.request('/api/admin/notifications/history/clean-old', {
            method: 'POST',
            body: JSON.stringify({ days })
        });
    }

    async exportNotificationHistory(data) {
        return this.request('/api/admin/notifications/history/export', {
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
        return this.request('/api/admin/shipper-notifications/status');
    }

    async testAwaitingPickupNotification(orderId, shipperId) {
        return this.request('/api/admin/shipper-notifications/test-awaiting-pickup', {
            method: 'POST',
            body: JSON.stringify({ orderId, shipperId })
        });
    }

    async testDeliverySuccessNotification(orderId, shipperId) {
        return this.request('/api/admin/shipper-notifications/test-delivery-success', {
            method: 'POST',
            body: JSON.stringify({ orderId, shipperId })
        });
    }

    async testRatingNotification(orderId, shipperId, rating, comment) {
        return this.request('/api/admin/shipper-notifications/test-rating', {
            method: 'POST',
            body: JSON.stringify({ orderId, shipperId, rating, comment })
        });
    }

    async broadcastAwaitingPickup(orderId) {
        return this.request('/api/admin/shipper-notifications/broadcast-awaiting-pickup', {
            method: 'POST',
            body: JSON.stringify({ orderId })
        });
    }

    async getShippersForNotification(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/admin/shipper-notifications/shippers${query ? '?' + query : ''}`);
    }

    async sendNotificationToOrderShipper(orderId, type) {
        return this.request('/api/admin/shipper-notifications/send-to-order-shipper', {
            method: 'POST',
            body: JSON.stringify({ orderId, type })
        });
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

