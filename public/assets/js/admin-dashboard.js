/**
 * Admin Dashboard JavaScript
 * Handles dashboard statistics, charts, and recent activities
 */

// Helper: Đợi AdminServices sẵn sàng
function waitForAdminServices(maxWait = 5000) {
    return new Promise((resolve, reject) => {
        if (window.AdminServices && typeof window.AdminServices.getDashboardStats === 'function') {
            resolve(window.AdminServices);
            return;
        }
        
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (window.AdminServices && typeof window.AdminServices.getDashboardStats === 'function') {
                clearInterval(checkInterval);
                resolve(window.AdminServices);
            } else if (Date.now() - startTime > maxWait) {
                clearInterval(checkInterval);
                reject(new Error('AdminServices không sẵn sàng sau ' + maxWait + 'ms'));
            }
        }, 100);
    });
}

document.addEventListener('DOMContentLoaded', async function() {
    if (window.location.pathname === '/home' || window.location.pathname === '/') {
        try {
            // Đợi AdminServices sẵn sàng
            await waitForAdminServices();
            initDashboard();
        } catch (error) {
            console.error('Error waiting for AdminServices:', error);
            showToast('Không thể tải AdminServices. Vui lòng reload trang.', 'error');
        }
    }
});

async function initDashboard() {
    showLoading();
    
    try {
        // Đảm bảo AdminServices sẵn sàng
        if (!window.AdminServices) {
            await waitForAdminServices();
        }
        
        await Promise.all([
            loadDashboardStats(),
            loadRecentOrders(),
            loadRecentActivities(),
            initCharts()
        ]);
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Không thể tải dữ liệu dashboard: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function loadDashboardStats() {
    try {
        // Check if AdminServices is available
        if (!window.AdminServices) {
            console.error('AdminServices is not loaded');
            updateStatsCards({
                totalOrders: 0,
                totalRevenue: 0,
                activeUsers: 0,
                pendingOrders: 0
            });
            return;
        }

        console.log('📊 Loading dashboard stats...');
        const stats = await window.AdminServices.getDashboardStats();
        console.log('📊 Dashboard stats received:', stats);
        
        if (!stats) {
            console.warn('⚠️ Stats is null or undefined');
            updateStatsCards({
                totalOrders: 0,
                totalRevenue: 0,
                activeUsers: 0,
                pendingOrders: 0
            });
            return;
        }
        
        updateStatsCards(stats);
    } catch (error) {
        console.error('❌ Error loading stats:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        // Show default values
        updateStatsCards({
            totalOrders: 0,
            totalRevenue: 0,
            activeUsers: 0,
            pendingOrders: 0
        });
    }
}

function updateStatsCards(stats) {
    console.log('📊 updateStatsCards called with:', stats);
    
    // Update stat cards
    const cards = {
        totalOrders: document.getElementById('statTotalOrders'),
        totalRevenue: document.getElementById('statTotalRevenue'),
        activeUsers: document.getElementById('statActiveUsers'),
        pendingOrders: document.getElementById('statPendingOrders')
    };
    
    console.log('📊 Card elements found:', {
        totalOrders: !!cards.totalOrders,
        totalRevenue: !!cards.totalRevenue,
        activeUsers: !!cards.activeUsers,
        pendingOrders: !!cards.pendingOrders
    });
    
    if (cards.totalOrders) {
        const value = stats.totalOrders || stats.total_orders || 0;
        cards.totalOrders.textContent = formatNumber(value);
        console.log('✅ Updated totalOrders:', value);
    } else {
        console.warn('⚠️ statTotalOrders element not found');
    }
    
    if (cards.totalRevenue) {
        const revenue = stats.totalRevenue || stats.total_revenue || 0;
        cards.totalRevenue.textContent = window.AdminServices 
            ? window.AdminServices.formatCurrency(revenue) 
            : revenue.toLocaleString('vi-VN') + ' ₫';
        console.log('✅ Updated totalRevenue:', revenue);
    } else {
        console.warn('⚠️ statTotalRevenue element not found');
    }
    
    if (cards.activeUsers) {
        const value = stats.activeUsers || stats.active_users || 0;
        cards.activeUsers.textContent = formatNumber(value);
        console.log('✅ Updated activeUsers:', value);
    } else {
        console.warn('⚠️ statActiveUsers element not found');
    }
    
    if (cards.pendingOrders) {
        const value = stats.pendingOrders || stats.pending_orders || 0;
        cards.pendingOrders.textContent = formatNumber(value);
        console.log('✅ Updated pendingOrders:', value);
    } else {
        console.warn('⚠️ statPendingOrders element not found');
    }
}

async function loadRecentOrders() {
    try {
        if (!window.AdminServices) {
            console.error('AdminServices is not loaded');
            return;
        }

        const orders = await window.AdminServices.getOrders({ 
            limit: 5,
            page: 1
        });
        
        const container = document.getElementById('recentOrdersList');
        if (container) {
            // API trả về { orders: [...], total, page, limit }
            const ordersList = orders.orders || orders.data || (Array.isArray(orders) ? orders : []);
            if (ordersList.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #6b7280;">
                        <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                        <p>Chưa có đơn hàng nào</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = ordersList.map(order => `
                <div style="padding: 1rem; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="display: block; margin-bottom: 0.25rem;">#${order.order_id || order._id}</strong>
                        <span style="color: #6b7280; font-size: 0.85rem;">${order.user?.email || 'N/A'}</span>
                    </div>
                    <div style="text-align: right;">
                        <span class="badge badge-${getStatusColor(order.status)}" style="display: block; margin-bottom: 0.25rem;">${getStatusText(order.status)}</span>
                        <span style="color: #6b7280; font-size: 0.85rem;">${window.AdminServices ? window.AdminServices.formatCurrency(order.total_amount || 0) : (order.total_amount || 0).toLocaleString('vi-VN') + ' ₫'}</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading recent orders:', error);
        const container = document.getElementById('recentOrdersList');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #6b7280;">
                    <i class="fas fa-exclamation-circle"></i>
                    <p style="margin-top: 0.5rem;">Không thể tải đơn hàng</p>
                </div>
            `;
        }
    }
}

async function loadRecentActivities() {
    try {
        if (!window.AdminServices) {
            console.error('AdminServices is not loaded');
            return;
        }

        // Use recent orders as activities
        const activities = await window.AdminServices.getOrders({ limit: 10, page: 1 });
        
        const container = document.getElementById('recentActivitiesList');
        if (container) {
            // API trả về { orders: [...], total, page, limit }
            const activitiesList = activities.orders || activities.data || (Array.isArray(activities) ? activities : []);
            if (activitiesList.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #6b7280;">
                        <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                        <p>Chưa có hoạt động nào</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = activitiesList.map(activity => `
                <div style="padding: 1rem; border-bottom: 1px solid #e5e7eb; display: flex; gap: 1rem; align-items: start;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: #6366f1; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;">
                        <i class="fas fa-shopping-cart"></i>
                    </div>
                    <div style="flex: 1;">
                        <p style="margin: 0 0 0.25rem 0;"><strong>Đơn hàng mới</strong> #${activity.order_id || activity._id}</p>
                        <span style="color: #6b7280; font-size: 0.85rem;">${window.AdminServices ? window.AdminServices.formatDate(activity.createdAt) : new Date(activity.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading activities:', error);
        const container = document.getElementById('recentActivitiesList');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #6b7280;">
                    <i class="fas fa-exclamation-circle"></i>
                    <p style="margin-top: 0.5rem;">Không thể tải hoạt động</p>
                </div>
            `;
        }
    }
}

async function initCharts() {
    if (!window.AdminServices) {
        console.error('AdminServices is not loaded');
        renderRevenueChart({ labels: [], values: [] });
        renderOrdersChart({ labels: [], values: [] });
        return;
    }

    // Revenue Chart
    try {
        const revenueData = await window.AdminServices.getRevenueByTime({
            start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end_date: new Date().toISOString(),
            group_by: 'day'
        });
        
        renderRevenueChart(revenueData);
    } catch (error) {
        console.error('Error loading revenue chart:', error);
        // Render empty chart
        renderRevenueChart({ labels: [], values: [] });
    }
    
    // Orders Chart
    try {
        const orderStats = await window.AdminServices.getOrderStatistics({
            start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            end_date: new Date().toISOString()
        });
        
        renderOrdersChart(orderStats);
    } catch (error) {
        console.error('Error loading orders chart:', error);
        // Render empty chart
        renderOrdersChart({ labels: [], values: [] });
    }
}

// Handle period changes
document.addEventListener('DOMContentLoaded', function() {
    const revenuePeriod = document.getElementById('revenuePeriod');
    const ordersPeriod = document.getElementById('ordersPeriod');
    
    if (revenuePeriod) {
        revenuePeriod.addEventListener('change', async (e) => {
            const days = parseInt(e.target.value);
            try {
                const revenueData = await window.AdminServices.getRevenueByTime({
                    start_date: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
                    end_date: new Date().toISOString(),
                    group_by: 'day'
                });
                renderRevenueChart(revenueData);
            } catch (error) {
                console.error('Error loading revenue chart:', error);
            }
        });
    }
    
    if (ordersPeriod) {
        ordersPeriod.addEventListener('change', async (e) => {
            const days = parseInt(e.target.value);
            try {
                const orderStats = await window.AdminServices.getOrderStatistics({
                    start_date: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
                    end_date: new Date().toISOString()
                });
                renderOrdersChart(orderStats);
            } catch (error) {
                console.error('Error loading orders chart:', error);
            }
        });
    }
});

let revenueChartInstance = null;
let ordersChartInstance = null;

function renderRevenueChart(data) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    // Destroy existing chart if exists
    if (revenueChartInstance) {
        revenueChartInstance.destroy();
    }
    
    revenueChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels || [],
            datasets: [{
                label: 'Doanh thu',
                data: data.values || [],
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true
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
                        callback: function(value) {
                            return window.AdminServices ? window.AdminServices.formatCurrency(value) : value.toLocaleString('vi-VN') + ' ₫';
                        }
                    }
                }
            }
        }
    });
}

function renderOrdersChart(data) {
    const ctx = document.getElementById('ordersChart');
    if (!ctx) return;
    
    // Destroy existing chart if exists
    if (ordersChartInstance) {
        ordersChartInstance.destroy();
    }
    
    ordersChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels || [],
            datasets: [{
                label: 'Số đơn hàng',
                data: data.values || [],
                backgroundColor: '#8b5cf6',
                borderRadius: 8
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
                    beginAtZero: true
                }
            }
        }
    });
}

// Utility functions
function formatNumber(num) {
    return new Intl.NumberFormat('vi-VN').format(num);
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

