// Admin Navigation JavaScript
class AdminNavigation {
    constructor() {
        this.currentPage = window.location.pathname;
        this.setupNavigation();
        this.setupAPIHandlers();
    }

    setupNavigation() {
        // Set active state
        const activeLink = document.querySelector(`.nav-link[href="${this.currentPage}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Add click handlers
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });
    }

    setupAPIHandlers() {
        // Add API authorization header
        this.addAuthorizationHeader();

        // Setup API error handling
        this.setupAPIErrorHandling();
    }

    addAuthorizationHeader() {
        const token = localStorage.getItem('admin_token');
        if (token) {
            window.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    }

    setupAPIErrorHandling() {
        window.axios.interceptors.response.use(
            response => response,
            error => this.handleAPIError(error)
        );
    }

    async handleNavigation(e) {
        const link = e.currentTarget;
        const page = link.dataset.page;

        try {
            // Show loading state
            link.classList.add('loading');

            // Check authentication
            await this.validateAuth();

            // Perform any pre-navigation tasks
            await this.preNavigationTasks(page);

        } catch (error) {
            console.error('Navigation error:', error);
            this.showError('Navigation failed. Please try again.');
            e.preventDefault();
        } finally {
            link.classList.remove('loading');
        }
    }

    async validateAuth() {
        try {
            const response = await fetch('/api/auth/validate', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Authentication failed');
            }
        } catch (error) {
            window.location.href = '/login';
            throw error;
        }
    }

    async preNavigationTasks(page) {
        // Perform any necessary data loading or state management before navigation
        switch(page) {
            case 'order-stats':
                await this.preloadOrderStats();
                break;
            case 'vouchers':
                await this.preloadVoucherData();
                break;
            // Add other page-specific tasks
        }
    }

    async preloadOrderStats() {
        try {
            const response = await fetch('/api/orders/stats', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load order statistics');
            }

            // Cache the stats data
            localStorage.setItem('orderStats', JSON.stringify(await response.json()));
        } catch (error) {
            console.error('Error preloading order stats:', error);
            // Continue navigation even if preload fails
        }
    }

    async preloadVoucherData() {
        try {
            const response = await fetch('/api/vouchers?limit=10&page=1', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load voucher data');
            }

            // Cache the voucher data
            localStorage.setItem('voucherData', JSON.stringify(await response.json()));
        } catch (error) {
            console.error('Error preloading voucher data:', error);
            // Continue navigation even if preload fails
        }
    }

    handleAPIError(error) {
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    // Unauthorized - redirect to login
                    window.location.href = '/login';
                    break;
                case 403:
                    // Forbidden - show permission error
                    this.showError('You do not have permission to access this resource');
                    break;
                case 404:
                    // Not found - show not found error
                    this.showError('The requested resource was not found');
                    break;
                default:
                    // Other errors
                    this.showError('An error occurred. Please try again later.');
            }
        } else {
            this.showError('Network error. Please check your connection.');
        }
        return Promise.reject(error);
    }

    showError(message) {
        // Implement error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'admin-error-notification';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminNav = new AdminNavigation();
});