/**
 * Admin Services Debug Helper
 * Kiểm tra và debug AdminServices
 */

document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for scripts to load
    setTimeout(() => {
        checkAdminServices();
    }, 1000);
});

function checkAdminServices() {
    console.log('=== AdminServices Debug ===');
    
    // Check if AdminServices exists
    if (!window.AdminServices) {
        console.error('❌ AdminServices is not defined on window object');
        console.log('Available window objects:', Object.keys(window).filter(k => k.includes('Admin') || k.includes('admin')));
        return;
    }
    
    console.log('✅ AdminServices found');
    console.log('AdminServices type:', typeof window.AdminServices);
    console.log('AdminServices methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.AdminServices)));
    
    // Check specific methods
    const requiredMethods = [
        'getDashboardStats',
        'getOrders',
        'getRevenueByTime',
        'getOrderStatistics',
        'formatCurrency',
        'formatDate'
    ];
    
    requiredMethods.forEach(method => {
        if (typeof window.AdminServices[method] === 'function') {
            console.log(`✅ ${method} exists`);
        } else {
            console.error(`❌ ${method} is missing or not a function`);
        }
    });
    
    // Check token
    const token = window.AdminServices.getToken();
    if (token) {
        console.log('✅ Token found:', token.substring(0, 20) + '...');
    } else {
        console.warn('⚠️ No token found. User may need to login.');
    }
    
    // Test API connection
    testAPIConnection();
}

async function testAPIConnection() {
    console.log('\n=== Testing API Connection ===');
    
    try {
        // Test health endpoint
        const healthResponse = await fetch('https://server-shelf-stacker-w1ds.onrender.com/api/health');
        if (healthResponse.ok) {
            console.log('✅ Backend is reachable');
        } else {
            console.warn('⚠️ Backend returned status:', healthResponse.status);
        }
    } catch (error) {
        console.error('❌ Cannot reach backend:', error.message);
    }
    
    // Test dashboard stats if token exists
    if (window.AdminServices && window.AdminServices.getToken()) {
        try {
            console.log('Testing getDashboardStats...');
            const stats = await window.AdminServices.getDashboardStats();
            console.log('✅ getDashboardStats works:', stats);
        } catch (error) {
            console.error('❌ getDashboardStats failed:', error.message);
        }
    } else {
        console.log('⚠️ Skipping API test - no token');
    }
}

// Export for manual testing
window.checkAdminServices = checkAdminServices;
window.testAPIConnection = testAPIConnection;






