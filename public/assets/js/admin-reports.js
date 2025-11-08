/**
 * Admin Reports JavaScript
 */

// Helper: Đợi AdminServices sẵn sàng
function waitForAdminServices(maxWait = 5000) {
    return new Promise((resolve, reject) => {
        if (window.AdminServices && typeof window.AdminServices.getSalesReport === 'function') {
            resolve(window.AdminServices);
            return;
        }
        
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (window.AdminServices && typeof window.AdminServices.getSalesReport === 'function') {
                clearInterval(checkInterval);
                resolve(window.AdminServices);
            } else if (Date.now() - startTime > maxWait) {
                clearInterval(checkInterval);
                reject(new Error('AdminServices không sẵn sàng sau ' + maxWait + 'ms'));
            }
        }, 100);
    });
}

let revenueChart = null;
let categoryChart = null;

document.addEventListener('DOMContentLoaded', async function() {
    const pathname = window.location.pathname;
    console.log('📊 Reports page - pathname:', pathname);
    
    if (pathname === '/reports' || pathname.includes('/reports')) {
        console.log('📊 Initializing reports page...');
        try {
            await waitForAdminServices();
            console.log('📊 AdminServices ready, initializing page...');
            initReportsPage();
        } catch (error) {
            console.error('❌ Error waiting for AdminServices:', error);
            if (typeof showToast === 'function') {
                showToast('Không thể tải AdminServices. Vui lòng reload trang.', 'error');
            }
        }
    }
});

function initReportsPage() {
    setupEventListeners();
    setDefaultDateRange();
}

function setDefaultDateRange() {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    
    if (dateFrom) dateFrom.value = lastMonth.toISOString().split('T')[0];
    if (dateTo) dateTo.value = today.toISOString().split('T')[0];
}

function setupEventListeners() {
    const loadReportBtn = document.getElementById('loadReportBtn');
    if (loadReportBtn) {
        loadReportBtn.addEventListener('click', () => loadReport());
    }

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => exportReport());
    }
}

async function loadReport() {
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    const reportType = document.getElementById('reportType').value;

    if (!dateFrom || !dateTo) {
        showToast('Vui lòng chọn khoảng thời gian', 'error');
        return;
    }

    showLoading();
    try {
        const params = {
            start_date: dateFrom,
            end_date: dateTo
        };

        let data;
        switch (reportType) {
            case 'sales':
                data = await window.AdminServices.getSalesReport(params);
                break;
            case 'orders':
                data = await window.AdminServices.getOrderStatistics(params);
                break;
            case 'revenue':
                data = await window.AdminServices.getRevenueByCategory(params);
                break;
            case 'time':
                data = await window.AdminServices.getRevenueByTime(params);
                break;
        }

        updateSummary(data);
        renderCharts(data, reportType);
        renderReportTable(data);
    } catch (error) {
        console.error('Error loading report:', error);
        showToast('Không thể tải báo cáo', 'error');
    } finally {
        hideLoading();
    }
}

function updateSummary(data) {
    const totalRevenue = data.totalRevenue || data.total || 0;
    const totalOrders = data.totalOrders || data.count || 0;
    const successOrders = data.successOrders || data.delivered || 0;
    const successRate = totalOrders > 0 ? ((successOrders / totalOrders) * 100).toFixed(1) : 0;

    const totalRevenueEl = document.getElementById('totalRevenue');
    const totalOrdersEl = document.getElementById('totalOrders');
    const successOrdersEl = document.getElementById('successOrders');
    const successRateEl = document.getElementById('successRate');

    if (totalRevenueEl) totalRevenueEl.textContent = window.AdminServices.formatCurrency(totalRevenue);
    if (totalOrdersEl) totalOrdersEl.textContent = totalOrders.toLocaleString();
    if (successOrdersEl) successOrdersEl.textContent = successOrders.toLocaleString();
    if (successRateEl) successRateEl.textContent = successRate + '%';
}

function renderCharts(data, reportType) {
    if (reportType === 'time' || reportType === 'sales') {
        renderRevenueChart(data);
    }
    if (reportType === 'revenue') {
        renderCategoryChart(data);
    }
}

function renderRevenueChart(data) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    if (revenueChart) revenueChart.destroy();

    const labels = data.labels || data.dates || [];
    const values = data.values || data.revenues || [];

    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Doanh thu',
                data: values,
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
                            return window.AdminServices.formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function renderCategoryChart(data) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    if (categoryChart) categoryChart.destroy();

    const categories = data.categories || [];
    const labels = categories.map(c => c.name || c.category);
    const values = categories.map(c => c.revenue || c.total || 0);

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
                    '#10b981', '#3b82f6', '#ef4444', '#14b8a6'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

function renderReportTable(data) {
    const tbody = document.getElementById('reportTableBody');
    if (!tbody) return;

    const rows = data.daily || data.items || [];
    
    if (rows.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-inbox" style="font-size: 3rem; color: #d1d5db;"></i>
                    <p style="color: #6b7280; margin-top: 1rem;">Không có dữ liệu</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = rows.map(row => {
        const total = row.totalOrders || row.count || 0;
        const success = row.successOrders || row.delivered || 0;
        const cancelled = row.cancelledOrders || row.cancelled || 0;
        const rate = total > 0 ? ((success / total) * 100).toFixed(1) : 0;

        return `
            <tr>
                <td>${window.AdminServices.formatDateOnly(row.date || row._id)}</td>
                <td>${total}</td>
                <td><strong>${window.AdminServices.formatCurrency(row.revenue || row.total || 0)}</strong></td>
                <td><span class="badge badge-success">${success}</span></td>
                <td><span class="badge badge-danger">${cancelled}</span></td>
                <td>${rate}%</td>
            </tr>
        `;
    }).join('');
}

async function exportReport() {
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    const reportType = document.getElementById('reportType').value;

    if (!dateFrom || !dateTo) {
        showToast('Vui lòng chọn khoảng thời gian', 'error');
        return;
    }

    try {
        showLoading();
        // This would typically call an export API endpoint
        showToast('Tính năng xuất Excel đang được phát triển', 'info');
    } catch (error) {
        console.error('Error exporting report:', error);
        showToast('Không thể xuất báo cáo', 'error');
    } finally {
        hideLoading();
    }
}


