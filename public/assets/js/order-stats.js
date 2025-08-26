// Order Statistics System
console.log('Order Statistics System loaded');

// Global variables
let orderStatusChart = null;
let paymentMethodChart = null;

// Status colors mapping
const statusColors = {
    'Processing': '#28a745',
    'Delivered': '#007bff', 
    'Cancelled': '#dc3545',
    'Delivering': '#fd7e14',
    'Pending Delivery': '#6f42c1',
    'Pending Confirmation': '#20c997',
    'Returned': '#ffc107',
    'Refunded': '#17a2b8',
    'Undefined': '#6c757d'
};

// Status labels mapping
const statusLabels = {
    'Processing': 'Đang xử lý',
    'Delivered': 'Đã giao',
    'Cancelled': 'Đã hủy',
    'Delivering': 'Đang giao',
    'Pending Delivery': 'Chờ giao hàng',
    'Pending Confirmation': 'Chờ xác nhận',
    'Returned': 'Đã trả hàng',
    'Refunded': 'Đã hoàn tiền',
    'Undefined': 'Không xác định'
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing order stats...');
    loadOrderStats();
});

// Load order statistics
async function loadOrderStats() {
    try {
        console.log('Loading order statistics...');
        
        // For now, use mock data since API might not be available
        const mockData = {
            totalOrders: 245,
            totalRevenue: 12500000,
            statusStats: {
                'Processing': 125,
                'Delivered': 55,
                'Cancelled': 15,
                'Delivering': 20,
                'Pending Delivery': 12,
                'Pending Confirmation': 8,
                'Returned': 5,
                'Refunded': 3,
                'Undefined': 2
            },
            paymentStats: {
                'Tiền mặt': 80,
                'Chuyển khoản': 95,
                'Ví điện tử': 45,
                'Thẻ tín dụng': 25
            },
            successCount: 55,
            failedCount: 15
        };

        // Update summary cards
        updateSummaryCards(mockData);
        
        // Create charts
        createOrderStatusChart(mockData.statusStats);
        createPaymentMethodChart(mockData.paymentStats);
        
        // Update status details
        updateStatusDetails(mockData.statusStats);
        
        // Load recent orders
        loadRecentOrders();
        
        console.log('Order statistics loaded successfully');
        
    } catch (error) {
        console.error('Error loading order statistics:', error);
        showError('Lỗi khi tải thống kê đơn hàng');
    }
}

// Update summary cards
function updateSummaryCards(data) {
    document.getElementById('totalOrders').textContent = data.totalOrders.toLocaleString();
    document.getElementById('totalRevenue').textContent = formatCurrency(data.totalRevenue);
    document.getElementById('successCount').textContent = data.successCount.toLocaleString();
    document.getElementById('failedCount').textContent = data.failedCount.toLocaleString();
}

// Create order status pie chart
function createOrderStatusChart(statusStats) {
    const ctx = document.getElementById('orderStatusChart').getContext('2d');
    
    // Prepare data for chart
    const labels = [];
    const data = [];
    const colors = [];
    
    Object.keys(statusStats).forEach(status => {
        if (statusStats[status] > 0) {
            labels.push(statusLabels[status] || status);
            data.push(statusStats[status]);
            colors.push(statusColors[status] || '#6c757d');
        }
    });
    
    // Destroy existing chart if exists
    if (orderStatusChart) {
        orderStatusChart.destroy();
    }
    
    // Create new chart
    orderStatusChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Create payment method chart
function createPaymentMethodChart(paymentStats) {
    const ctx = document.getElementById('paymentMethodChart').getContext('2d');
    
    const labels = Object.keys(paymentStats);
    const data = Object.values(paymentStats);
    const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14'];
    
    // Destroy existing chart if exists
    if (paymentMethodChart) {
        paymentMethodChart.destroy();
    }
    
    // Create new chart
    paymentMethodChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Update status details sidebar
function updateStatusDetails(statusStats) {
    const container = document.getElementById('statusDetails');
    
    let html = '';
    Object.keys(statusStats).forEach(status => {
        if (statusStats[status] > 0) {
            const count = statusStats[status];
            const total = Object.values(statusStats).reduce((a, b) => a + b, 0);
            const percentage = ((count / total) * 100).toFixed(1);
            const colorClass = getStatusColorClass(status);
            
            html += `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div class="d-flex align-items-center">
                        <span class="status-badge ${colorClass} me-2">${statusLabels[status] || status}</span>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold">${count}</div>
                        <small class="text-muted">${percentage}%</small>
                    </div>
                </div>
            `;
        }
    });
    
    container.innerHTML = html;
}

// Get status color class
function getStatusColorClass(status) {
    const colorMap = {
        'Processing': 'status-processing',
        'Delivered': 'status-delivered',
        'Cancelled': 'status-cancelled',
        'Delivering': 'status-delivering',
        'Pending Delivery': 'status-pending',
        'Pending Confirmation': 'status-pending-confirmation',
        'Returned': 'status-returned',
        'Refunded': 'status-refunded',
        'Undefined': 'status-undefined'
    };
    
    return colorMap[status] || 'status-undefined';
}

// Load recent orders
async function loadRecentOrders() {
    try {
        // Mock recent orders data
        const recentOrders = [
            { id: 'ORD-001', status: 'Delivered', amount: 250000 },
            { id: 'ORD-002', status: 'Processing', amount: 180000 },
            { id: 'ORD-003', status: 'Delivering', amount: 320000 },
            { id: 'ORD-004', status: 'Cancelled', amount: 150000 },
            { id: 'ORD-005', status: 'Delivered', amount: 450000 }
        ];
        
        const tbody = document.getElementById('recentOrdersTable');
        tbody.innerHTML = recentOrders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>
                    <span class="status-badge ${getStatusColorClass(order.status)}">
                        ${statusLabels[order.status] || order.status}
                    </span>
                </td>
                <td>${formatCurrency(order.amount)}</td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading recent orders:', error);
        document.getElementById('recentOrdersTable').innerHTML = 
            '<tr><td colspan="3" class="text-center text-danger">Lỗi khi tải dữ liệu</td></tr>';
    }
}

// Refresh statistics
function refreshStats() {
    console.log('Refreshing statistics...');
    
    // Show loading state
    const refreshBtn = document.querySelector('button[onclick="refreshStats()"]');
    const originalText = refreshBtn.innerHTML;
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang tải...';
    refreshBtn.disabled = true;
    
    // Reload data
    setTimeout(() => {
        loadOrderStats();
        
        // Restore button
        refreshBtn.innerHTML = originalText;
        refreshBtn.disabled = false;
        
        // Show success message
        showSuccess('Thống kê đã được cập nhật!');
    }, 1000);
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

function showSuccess(message) {
    // Create success alert
    const alert = document.createElement('div');
    alert.className = 'alert alert-success alert-dismissible fade show position-fixed';
    alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alert.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alert);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 3000);
}

function showError(message) {
    // Create error alert
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show position-fixed';
    alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alert.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

console.log('Order Statistics System script loaded successfully');
