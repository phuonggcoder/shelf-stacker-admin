// Dashboard class manages all dashboard functionalities

class Dashboard {
    constructor() {
        this.apiClient = new ApiClient();
        this.chart = null;
        this.init();
    }

    async init() {
        await this.loadStats();
        await this.loadActivities();
        this.initChart();
        this.startAutoRefresh();
    }

    async loadStats() {
        try {
            const stats = await this.apiClient.get(this.apiClient.baseUrl + '/api/dashboard/stats');
            
            // Update order stats
            document.getElementById('newOrders').textContent = stats.newOrders;
            document.getElementById('ordersChange').textContent = `${stats.ordersChange}%`;
            this.updateTrend('ordersChange', stats.ordersChange);

            // Update voucher stats
            document.getElementById('totalVouchers').textContent = stats.totalVouchers;
            document.getElementById('vouchersChange').textContent = `${stats.vouchersChange}%`;
            this.updateTrend('vouchersChange', stats.vouchersChange);

            // Update user stats
            document.getElementById('newUsers').textContent = stats.newUsers;
            document.getElementById('usersChange').textContent = `${stats.usersChange}%`;
            this.updateTrend('usersChange', stats.usersChange);

            // Update revenue stats
            document.getElementById('revenue').textContent = this.apiClient.formatCurrency(stats.revenue);
            document.getElementById('revenueChange').textContent = `${stats.revenueChange}%`;
            this.updateTrend('revenueChange', stats.revenueChange);

        } catch (error) {
            console.error('Error loading stats:', error);
            this.showError('Không thể tải thống kê');
        }
    }

    async loadActivities() {
        try {
            const activities = await this.apiClient.get(this.apiClient.baseUrl + '/api/dashboard/activities');
            const activityList = document.getElementById('activityList');
            
            if (!activities.length) {
                activityList.innerHTML = '<div class="no-data">Không có hoạt động nào</div>';
                return;
            }

            activityList.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas ${this.getActivityIcon(activity.type)}"></i>
                    </div>
                    <div class="activity-content">
                        <p>${activity.message}</p>
                        <span class="activity-time">${this.formatTime(activity.timestamp)}</span>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading activities:', error);
            this.showError('Không thể tải hoạt động');
        }
    }

    initChart() {
        const ctx = document.getElementById('orderChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Đơn hàng',
                    data: [],
                    borderColor: '#6c63ff',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
        
        this.updateChart();
    }

    async updateChart() {
        try {
            const period = document.getElementById('chartPeriod').value;
            const data = await this.apiClient.get(`${this.apiClient.baseUrl}/api/dashboard/orders-chart?period=${period}`);
            
            this.chart.data.labels = data.labels;
            this.chart.data.datasets[0].data = data.values;
            this.chart.update();

        } catch (error) {
            console.error('Error updating chart:', error);
            this.showError('Không thể cập nhật biểu đồ');
        }
    }

    updateTrend(elementId, value) {
        const element = document.getElementById(elementId)?.closest('.trend');
        if (element) {
            element.className = 'trend ' + (value > 0 ? 'positive' : value < 0 ? 'negative' : '');
        }
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 60) {
            return `${diffInMinutes} phút trước`;
        }
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return `${diffInHours} giờ trước`;
        }
        
        return this.apiClient.formatDateTime(timestamp);
    }

    getActivityIcon(type) {
        const icons = {
            order: 'fa-shopping-cart',
            user: 'fa-user',
            product: 'fa-box',
            voucher: 'fa-ticket-alt',
            default: 'fa-info-circle'
        };
        return icons[type] || icons.default;
    }

    showError(message) {
        console.error('Error:', message);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(errorDiv);
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    startAutoRefresh() {
        setInterval(() => this.loadStats(), 300000); // 5 minutes
        setInterval(() => this.loadActivities(), 60000); // 1 minute
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});

// Global functions
function refreshActivities() {
    window.dashboard?.loadActivities();
}

function updateChart() {
    window.dashboard?.updateChart();
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
}