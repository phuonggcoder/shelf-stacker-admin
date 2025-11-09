/**
 * FIXED CRUD TESTING SCRIPT
 * Copy và paste vào Browser Console (F12)
 */

console.log('🧪 Starting CRUD Test Suite (Fixed Version)...\n');

// Helper functions
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const logResult = (test, passed, message) => {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${test}: ${message}`);
    return passed;
};

// Test Suite
async function testCRUD() {
    const results = {
        total: 0,
        passed: 0,
        failed: 0,
        details: []
    };

    console.log('\n📋 TEST SUITE: CRUD OPERATIONS (FIXED)\n');
    console.log('=' .repeat(60));

    // ==========================================
    // TEST 1: Check AdminServices exists
    // ==========================================
    console.log('\n🔍 Test 1: Checking AdminServices object...');
    results.total++;
    
    if (typeof window.AdminServices !== 'undefined') {
        logResult('AdminServices Object', true, 'AdminServices exists');
        results.passed++;
        
        // Log type and structure
        console.log('   Type:', typeof window.AdminServices);
        console.log('   Constructor:', window.AdminServices.constructor.name);
        
        // Check prototype methods (correct way for class instances)
        const proto = Object.getPrototypeOf(window.AdminServices);
        const protoMethods = Object.getOwnPropertyNames(proto)
            .filter(name => name !== 'constructor' && typeof window.AdminServices[name] === 'function');
        
        console.log(`   Methods in prototype: ${protoMethods.length}`);
        console.log('   Sample methods:', protoMethods.slice(0, 5).join(', '));
        
    } else {
        logResult('AdminServices Object', false, 'AdminServices NOT found!');
        results.failed++;
        results.details.push('AdminServices is not defined - check if AdminServices.js is loaded');
        console.error('❌ CRITICAL: Stop test - AdminServices not found');
        return results;
    }

    // ==========================================
    // TEST 2: Check critical methods exist
    // ==========================================
    console.log('\n🔍 Test 2: Checking critical methods exist...');
    
    const criticalMethods = [
        'getCategories', 'createCategory', 'updateCategory', 'deleteCategory',
        'getBooks', 'createBook', 'updateBook', 'deleteBook',
        'getOrders', 'updateOrderStatus',
        'getUsers',
        'getVouchers', 'createVoucher', 'updateVoucher', 'deleteVoucher',
        'getCampaigns', 'createCampaign', 'updateCampaign', 'deleteCampaign'
    ];
    
    const missingMethods = [];
    const foundMethods = [];
    
    criticalMethods.forEach(method => {
        if (typeof window.AdminServices[method] === 'function') {
            foundMethods.push(method);
        } else {
            missingMethods.push(method);
        }
    });
    
    results.total++;
    if (missingMethods.length === 0) {
        logResult('Critical Methods', true, `All ${criticalMethods.length} methods found`);
        results.passed++;
    } else {
        logResult('Critical Methods', false, `Missing ${missingMethods.length} methods`);
        results.failed++;
        console.error('   Missing methods:', missingMethods.join(', '));
        results.details.push(`Missing methods: ${missingMethods.join(', ')}`);
    }

    // Check token
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.warn('\n⚠️  No auth token found. Login first!');
        console.warn('   Cannot proceed with API tests.');
        results.details.push('No auth token - please login first');
        return results;
    }
    
    console.log('✅ Auth token found');

    // ==========================================
    // TEST 3: Test GET Categories
    // ==========================================
    console.log('\n🔍 Test 3: Testing GET Categories...');
    results.total++;
    
    try {
        const categories = await window.AdminServices.getCategories();
        if (Array.isArray(categories) && categories.length > 0) {
            logResult('GET Categories', true, `Loaded ${categories.length} categories`);
            console.log('   Sample:', { 
                _id: categories[0]._id, 
                name: categories[0].name,
                slug: categories[0].slug 
            });
            results.passed++;
        } else if (Array.isArray(categories) && categories.length === 0) {
            logResult('GET Categories', true, 'No categories in database (empty array)');
            results.passed++;
        } else {
            logResult('GET Categories', false, 'Unexpected response format');
            results.failed++;
            console.error('   Response:', categories);
        }
    } catch (error) {
        logResult('GET Categories', false, error.message);
        results.failed++;
        results.details.push(`GET Categories failed: ${error.message}`);
    }

    await wait(1000);

    // ==========================================
    // TEST 4: Test GET Books
    // ==========================================
    console.log('\n🔍 Test 4: Testing GET Books...');
    results.total++;
    
    try {
        const response = await window.AdminServices.getBooks({ page: 1, limit: 5 });
        const books = response.books || response;
        
        if (Array.isArray(books) && books.length > 0) {
            logResult('GET Books', true, `Loaded ${books.length} books`);
            console.log('   Sample:', { 
                _id: books[0]._id, 
                title: books[0].title,
                price: books[0].price 
            });
            results.passed++;
        } else if (Array.isArray(books) && books.length === 0) {
            logResult('GET Books', true, 'No books in database (empty array)');
            results.passed++;
        } else {
            logResult('GET Books', false, 'Unexpected response format');
            results.failed++;
            console.error('   Response:', response);
        }
    } catch (error) {
        logResult('GET Books', false, error.message);
        results.failed++;
        results.details.push(`GET Books failed: ${error.message}`);
    }

    await wait(1000);

    // ==========================================
    // TEST 5: Test GET Orders
    // ==========================================
    console.log('\n🔍 Test 5: Testing GET Orders...');
    results.total++;
    
    try {
        const response = await window.AdminServices.getOrders({ page: 1, limit: 5 });
        const orders = response.orders || response;
        
        if (Array.isArray(orders)) {
            logResult('GET Orders', true, `Loaded ${orders.length} orders`);
            if (orders.length > 0) {
                console.log('   Sample:', { 
                    _id: orders[0]._id,
                    orderCode: orders[0].orderCode,
                    totalPrice: orders[0].totalPrice
                });
            }
            results.passed++;
        } else {
            logResult('GET Orders', false, 'Unexpected response format');
            results.failed++;
            console.error('   Response:', response);
        }
    } catch (error) {
        logResult('GET Orders', false, error.message);
        results.failed++;
        results.details.push(`GET Orders failed: ${error.message}`);
    }

    await wait(1000);

    // ==========================================
    // TEST 6: Test CREATE Category
    // ==========================================
    console.log('\n🔍 Test 6: Testing CREATE Category...');
    results.total++;
    
    try {
        const testCategory = {
            name: `Test Category ${Date.now()}`,
            slug: `test-category-${Date.now()}`,
            description: 'Automated test category',
            isVisible: true
        };
        
        const newCategory = await window.AdminServices.createCategory(testCategory);
        
        if (newCategory && newCategory._id) {
            logResult('CREATE Category', true, `Created: ${newCategory._id}`);
            console.log('   Created:', { 
                _id: newCategory._id, 
                name: newCategory.name,
                slug: newCategory.slug 
            });
            results.passed++;
            
            // Cleanup
            console.log('   🧹 Cleaning up...');
            try {
                await window.AdminServices.deleteCategory(newCategory._id);
                console.log('   ✅ Test category deleted');
            } catch (cleanupError) {
                console.warn('   ⚠️  Could not delete:', cleanupError.message);
            }
        } else {
            logResult('CREATE Category', false, 'No _id returned');
            results.failed++;
            console.error('   Response:', newCategory);
        }
    } catch (error) {
        logResult('CREATE Category', false, error.message);
        results.failed++;
        results.details.push(`CREATE Category failed: ${error.message}`);
    }

    // ==========================================
    // FINAL RESULTS
    // ==========================================
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Total Tests: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    
    if (results.total > 0) {
        console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%`);
    }
    
    console.log('=' .repeat(60));

    if (results.failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! CRUD is working perfectly! 🎉\n');
    } else {
        console.log(`\n⚠️  ${results.failed} test(s) failed.\n`);
        if (results.details.length > 0) {
            console.log('📋 Issues found:');
            results.details.forEach((detail, i) => {
                console.log(`   ${i + 1}. ${detail}`);
            });
        }
    }

    return results;
}

// ==========================================
// Quick diagnostic
// ==========================================
console.log('🔧 QUICK DIAGNOSTIC:\n');

// Check 1: AdminServices exists
if (typeof window.AdminServices !== 'undefined') {
    console.log('✅ AdminServices exists');
    console.log(`   Type: ${typeof window.AdminServices}`);
    
    // Check methods properly (via prototype)
    const sampleMethods = ['getCategories', 'getBooks', 'createCategory', 'getOrders'];
    const methodsStatus = sampleMethods.map(m => 
        `${typeof window.AdminServices[m] === 'function' ? '✅' : '❌'} ${m}`
    );
    console.log('   Sample methods:');
    methodsStatus.forEach(status => console.log(`      ${status}`));
} else {
    console.log('❌ AdminServices NOT FOUND');
    console.log('   Please check if AdminServices.js is loaded in HTML');
}

// Check 2: Auth token
const hasToken = !!localStorage.getItem('authToken');
console.log(`${hasToken ? '✅' : '❌'} Auth token: ${hasToken ? 'Found' : 'Not found'}`);

// ==========================================
// RUN TEST SUITE
// ==========================================
console.log('\n🚀 Running test suite in 2 seconds...\n');
setTimeout(() => {
    testCRUD().catch(error => {
        console.error('❌ Test suite crashed:', error);
        console.error(error.stack);
    });
}, 2000);

