class ApiError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ApiError';
    }
}

class ApiClient {
    constructor() {
        this.baseUrl = 'https://server-shelf-stacker-w1ds.onrender.com';
        this.token = localStorage.getItem('token');
        this.isOnline = navigator.onLine;
        this.setupConnectionListener();
    }

    setupConnectionListener() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.notifyConnectionChange(true);
        });
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.notifyConnectionChange(false);
        });
    }

    notifyConnectionChange(isOnline) {
        const event = new CustomEvent('connectionChange', { 
            detail: { isOnline } 
        });
        window.dispatchEvent(event);
    }

    async checkServerStatus() {
        if (!navigator.onLine) {
            throw new ApiError('Mất kết nối internet. Vui lòng kiểm tra và thử lại.');
        }

        try {
            const response = await fetch(this.baseUrl + '/api/health', {
                method: 'GET',
                cache: 'no-cache',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new ApiError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
            }

            return true;
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
        }
    }

    async get(url) {
        await this.checkServerStatus();
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new ApiError(response.statusText);
            }
            return response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            if (error instanceof ApiError) throw error;
            throw new ApiError('Lỗi khi gọi API. Vui lòng thử lại.');
        }
    }

    async post(url, data) {
        await this.checkServerStatus();
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new ApiError(response.statusText);
            }
            return response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            if (error instanceof ApiError) throw error;
            throw new ApiError('Lỗi khi gọi API. Vui lòng thử lại.');
        }
    }

    formatCurrency(amount) {
        if (!amount) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatDateTime(isoString) {
        if (!isoString) return '';
        try {
            return new Intl.DateTimeFormat('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).format(new Date(isoString));
        } catch (e) {
            console.warn('Invalid date:', isoString);
            return '';
        }
    }
}