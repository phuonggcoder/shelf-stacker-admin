/**
 * Quick Test Script - Chạy trong Browser Console để test các chức năng
 * 
 * Cách sử dụng:
 * 1. Mở Browser Console (F12)
 * 2. Copy toàn bộ code này và paste vào console
 * 3. Nhấn Enter để chạy
 * 4. Xem kết quả
 */

(async function quickTest() {
    console.log('🧪 ========================================');
    console.log('🧪 QUICK TEST SCRIPT - Kiểm Tra Các Chức Năng');
    console.log('🧪 ========================================\n');

    // Test 1: Kiểm tra Helper Functions
    console.log('📦 Test 1: Kiểm tra Helper Functions');
    console.log('-----------------------------------');
    if (typeof window.extractData === 'function') {
        console.log('✅ extractData: OK');
    } else {
        console.error('❌ extractData: NOT FOUND - File api-response-helpers.js chưa được load!');
    }
    
    if (typeof window.extractPagination === 'function') {
        console.log('✅ extractPagination: OK');
    } else {
        console.error('❌ extractPagination: NOT FOUND - File api-response-helpers.js chưa được load!');
    }
    console.log('');

    // Test 2: Kiểm tra AdminServices
    console.log('🔧 Test 2: Kiểm tra AdminServices');
    console.log('-----------------------------------');
    if (typeof window.AdminServices === 'object') {
        console.log('✅ AdminServices: OK');
        
        // Kiểm tra các methods
        const methods = [
            'getOrders',
            'getBooks',
            'getVouchers',
            'getCategories',
            'getSettings',
            'getSystemInfo',
            'sendInstantNotification'
        ];
        
        methods.forEach(method => {
            if (typeof window.AdminServices[method] === 'function') {
                console.log(`✅ ${method}: OK`);
            } else {
                console.error(`❌ ${method}: NOT FOUND`);
            }
        });
    } else {
        console.error('❌ AdminServices: NOT FOUND - File AdminServices.js chưa được load!');
    }
    console.log('');

    // Test 3: Test Helper Functions
    console.log('🧪 Test 3: Test Helper Functions');
    console.log('-----------------------------------');
    
    if (typeof window.extractData === 'function') {
        // Test extractData
        const testCases = [
            { name: 'Array', data: [1, 2, 3], key: null, expected: [1, 2, 3] },
            { name: 'Object with key', data: { orders: [1, 2, 3] }, key: 'orders', expected: [1, 2, 3] },
            { name: 'Nested data', data: { data: { orders: [1, 2, 3] } }, key: 'orders', expected: [1, 2, 3] },
            { name: 'Success format', data: { success: true, data: { orders: [1, 2, 3] } }, key: 'orders', expected: [1, 2, 3] }
        ];
        
        testCases.forEach(testCase => {
            const result = extractData(testCase.data, testCase.key);
            if (JSON.stringify(result) === JSON.stringify(testCase.expected)) {
                console.log(`✅ extractData (${testCase.name}): OK`);
            } else {
                console.error(`❌ extractData (${testCase.name}): FAILED`);
                console.error(`   Expected: ${JSON.stringify(testCase.expected)}`);
                console.error(`   Got: ${JSON.stringify(result)}`);
            }
        });
        
        // Test extractPagination
        const paginationTests = [
            { name: 'Direct pagination', data: { page: 1, limit: 10, total: 100, pages: 10 }, expected: { page: 1, limit: 10, total: 100, pages: 10 } },
            { name: 'Nested pagination', data: { pagination: { page: 1, limit: 10, total: 100, pages: 10 } }, expected: { page: 1, limit: 10, total: 100, pages: 10 } }
        ];
        
        paginationTests.forEach(testCase => {
            const result = extractPagination(testCase.data, 1, 10);
            if (result.page === testCase.expected.page && result.total === testCase.expected.total) {
                console.log(`✅ extractPagination (${testCase.name}): OK`);
            } else {
                console.error(`❌ extractPagination (${testCase.name}): FAILED`);
                console.error(`   Expected: ${JSON.stringify(testCase.expected)}`);
                console.error(`   Got: ${JSON.stringify(result)}`);
            }
        });
    } else {
        console.error('❌ Helper functions not available - Cannot test');
    }
    console.log('');

    // Test 4: Test API Calls (nếu có token)
    console.log('🌐 Test 4: Test API Calls');
    console.log('-----------------------------------');
    const token = localStorage.getItem('admin_token') || localStorage.getItem('authToken');
    if (token) {
        console.log('✅ Token found');
        
        // Test getOrders
        try {
            console.log('📦 Testing getOrders...');
            const ordersResponse = await window.AdminServices.getOrders({ page: 1, limit: 5 });
            console.log('✅ getOrders: OK');
            console.log('   Response:', ordersResponse);
            
            if (typeof window.extractData === 'function') {
                const orders = extractData(ordersResponse, 'orders');
                console.log(`   Extracted orders: ${orders.length} items`);
                
                const pagination = extractPagination(ordersResponse, 1, 5);
                console.log('   Pagination:', pagination);
            }
        } catch (error) {
            console.error('❌ getOrders: FAILED');
            console.error('   Error:', error.message);
        }
        
        // Test getSettings
        try {
            console.log('⚙️ Testing getSettings...');
            const settingsResponse = await window.AdminServices.getSettings();
            console.log('✅ getSettings: OK');
            console.log('   Response:', settingsResponse);
        } catch (error) {
            console.error('❌ getSettings: FAILED');
            console.error('   Error:', error.message);
        }
        
        // Test getSystemInfo
        try {
            console.log('💻 Testing getSystemInfo...');
            const systemInfoResponse = await window.AdminServices.getSystemInfo();
            console.log('✅ getSystemInfo: OK');
            console.log('   Response:', systemInfoResponse);
        } catch (error) {
            console.error('❌ getSystemInfo: FAILED');
            console.error('   Error:', error.message);
        }
    } else {
        console.warn('⚠️ No token found - Cannot test API calls');
        console.warn('   Please login first');
    }
    console.log('');

    // Test 5: Kiểm tra UI Elements
    console.log('🎨 Test 5: Kiểm tra UI Elements');
    console.log('-----------------------------------');
    const uiElements = [
        { id: 'ordersTableBody', name: 'Orders Table' },
        { id: 'productsTableBody', name: 'Products Table' },
        { id: 'vouchersTableBody', name: 'Vouchers Table' },
        { id: 'categoriesTableBody', name: 'Categories Table' },
        { id: 'loadingOverlay', name: 'Loading Overlay' },
        { id: 'toastContainer', name: 'Toast Container' }
    ];
    
    uiElements.forEach(element => {
        const el = document.getElementById(element.id);
        if (el) {
            console.log(`✅ ${element.name} (${element.id}): OK`);
        } else {
            console.warn(`⚠️ ${element.name} (${element.id}): NOT FOUND - Có thể không ở trang này`);
        }
    });
    console.log('');

    // Test 6: Kiểm tra Current Page
    console.log('📄 Test 6: Kiểm tra Current Page');
    console.log('-----------------------------------');
    const pathname = window.location.pathname;
    console.log(`Current path: ${pathname}`);
    
    if (pathname.includes('orders')) {
        console.log('📦 You are on Orders page');
        const tbody = document.getElementById('ordersTableBody');
        if (tbody) {
            console.log(`✅ Orders table found: ${tbody.children.length} rows`);
        }
    } else if (pathname.includes('products')) {
        console.log('📚 You are on Products page');
        const tbody = document.getElementById('productsTableBody');
        if (tbody) {
            console.log(`✅ Products table found: ${tbody.children.length} rows`);
        }
    } else if (pathname.includes('vouchers')) {
        console.log('🎫 You are on Vouchers page');
        const tbody = document.getElementById('vouchersTableBody');
        if (tbody) {
            console.log(`✅ Vouchers table found: ${tbody.children.length} rows`);
        }
    } else if (pathname.includes('categories')) {
        console.log('📁 You are on Categories page');
        const tbody = document.getElementById('categoriesTableBody');
        if (tbody) {
            console.log(`✅ Categories table found: ${tbody.children.length} rows`);
        }
    } else if (pathname.includes('settings')) {
        console.log('⚙️ You are on Settings page');
    }
    console.log('');

    console.log('🧪 ========================================');
    console.log('🧪 TEST COMPLETE');
    console.log('🧪 ========================================');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Nếu có lỗi, xem chi tiết ở trên');
    console.log('2. Kiểm tra Network tab để xem API calls');
    console.log('3. Kiểm tra Console tab để xem logs');
    console.log('4. Hard refresh browser (Ctrl + Shift + R)');
    console.log('5. Restart server nếu cần');
})();

