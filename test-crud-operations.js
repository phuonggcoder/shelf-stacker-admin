/**
 * AUTOMATED CRUD TESTING SCRIPT
 * Copy và paste vào Browser Console (F12) để test CRUD operations
 */

console.log('🧪 Starting CRUD Test Suite...\n');

// Helper function để đợi
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function để log kết quả
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
        failed: 0
    };

    console.log('\n📋 TEST SUITE: CRUD OPERATIONS\n');
    console.log('=' .repeat(60));

    // ==========================================
    // TEST 1: Check if AdminServices is loaded
    // ==========================================
    console.log('\n🔍 Test 1: Checking AdminServices...');
    results.total++;
    
    if (typeof AdminServices !== 'undefined') {
        logResult('AdminServices', true, 'AdminServices is loaded');
        results.passed++;
    } else {
        logResult('AdminServices', false, 'AdminServices is NOT loaded!');
        results.failed++;
        console.error('❌ CRITICAL: AdminServices not found. Cannot proceed with tests.');
        return results;
    }

    // Check token
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.warn('⚠️  No auth token found. Login first!');
        console.log('💡 Run: localStorage.setItem("authToken", "YOUR_TOKEN")');
        return results;
    }

    // ==========================================
    // TEST 2: Test Categories (GET)
    // ==========================================
    console.log('\n🔍 Test 2: Testing GET Categories...');
    results.total++;
    
    try {
        const categories = await AdminServices.getCategories();
        if (Array.isArray(categories) && categories.length > 0) {
            logResult('GET Categories', true, `Loaded ${categories.length} categories`);
            console.log('📦 Sample category:', categories[0]);
            results.passed++;
        } else {
            logResult('GET Categories', false, 'No categories returned');
            results.failed++;
        }
    } catch (error) {
        logResult('GET Categories', false, error.message);
        results.failed++;
    }

    await wait(1000);

    // ==========================================
    // TEST 3: Test Products/Books (GET)
    // ==========================================
    console.log('\n🔍 Test 3: Testing GET Books...');
    results.total++;
    
    try {
        const booksData = await AdminServices.getBooks({ page: 1, limit: 5 });
        const books = booksData.books || booksData;
        
        if (Array.isArray(books) && books.length > 0) {
            logResult('GET Books', true, `Loaded ${books.length} books`);
            console.log('📦 Sample book:', books[0]);
            results.passed++;
        } else {
            logResult('GET Books', false, 'No books returned');
            results.failed++;
        }
    } catch (error) {
        logResult('GET Books', false, error.message);
        results.failed++;
    }

    await wait(1000);

    // ==========================================
    // TEST 4: Test Orders (GET)
    // ==========================================
    console.log('\n🔍 Test 4: Testing GET Orders...');
    results.total++;
    
    try {
        const ordersData = await AdminServices.getOrders({ page: 1, limit: 5 });
        const orders = ordersData.orders || ordersData;
        
        if (Array.isArray(orders)) {
            logResult('GET Orders', true, `Loaded ${orders.length} orders`);
            if (orders.length > 0) {
                console.log('📦 Sample order:', orders[0]);
            }
            results.passed++;
        } else {
            logResult('GET Orders', false, 'No orders returned');
            results.failed++;
        }
    } catch (error) {
        logResult('GET Orders', false, error.message);
        results.failed++;
    }

    await wait(1000);

    // ==========================================
    // TEST 5: Test Users (GET)
    // ==========================================
    console.log('\n🔍 Test 5: Testing GET Users...');
    results.total++;
    
    try {
        const usersData = await AdminServices.getUsers({ page: 1, limit: 5 });
        const users = usersData.users || usersData;
        
        if (Array.isArray(users)) {
            logResult('GET Users', true, `Loaded ${users.length} users`);
            if (users.length > 0) {
                console.log('📦 Sample user:', { 
                    _id: users[0]._id, 
                    email: users[0].email,
                    name: users[0].name 
                });
            }
            results.passed++;
        } else {
            logResult('GET Users', false, 'No users returned');
            results.failed++;
        }
    } catch (error) {
        logResult('GET Users', false, error.message);
        results.failed++;
    }

    await wait(1000);

    // ==========================================
    // TEST 6: Test Campaigns (GET)
    // ==========================================
    console.log('\n🔍 Test 6: Testing GET Campaigns...');
    results.total++;
    
    try {
        const campaigns = await AdminServices.getCampaigns();
        
        if (Array.isArray(campaigns)) {
            logResult('GET Campaigns', true, `Loaded ${campaigns.length} campaigns`);
            if (campaigns.length > 0) {
                console.log('📦 Sample campaign:', campaigns[0]);
            }
            results.passed++;
        } else {
            logResult('GET Campaigns', false, 'No campaigns returned');
            results.failed++;
        }
    } catch (error) {
        logResult('GET Campaigns', false, error.message);
        results.failed++;
    }

    await wait(1000);

    // ==========================================
    // TEST 7: Test Vouchers (GET)
    // ==========================================
    console.log('\n🔍 Test 7: Testing GET Vouchers...');
    results.total++;
    
    try {
        const vouchersData = await AdminServices.getVouchers({ page: 1, limit: 5 });
        const vouchers = vouchersData.vouchers || vouchersData;
        
        if (Array.isArray(vouchers)) {
            logResult('GET Vouchers', true, `Loaded ${vouchers.length} vouchers`);
            if (vouchers.length > 0) {
                console.log('📦 Sample voucher:', vouchers[0]);
            }
            results.passed++;
        } else {
            logResult('GET Vouchers', false, 'No vouchers returned');
            results.failed++;
        }
    } catch (error) {
        logResult('GET Vouchers', false, error.message);
        results.failed++;
    }

    await wait(1000);

    // ==========================================
    // TEST 8: Test Create Category (POST)
    // ==========================================
    console.log('\n🔍 Test 8: Testing CREATE Category...');
    results.total++;
    
    try {
        const testCategory = {
            name: `Test Category ${Date.now()}`,
            slug: `test-category-${Date.now()}`,
            description: 'This is a test category created by automated test',
            isVisible: true
        };
        
        const newCategory = await AdminServices.createCategory(testCategory);
        
        if (newCategory && newCategory._id) {
            logResult('CREATE Category', true, `Created category: ${newCategory._id}`);
            console.log('📦 Created category:', newCategory);
            results.passed++;
            
            // Cleanup - Delete the test category
            console.log('🧹 Cleaning up test category...');
            try {
                await AdminServices.deleteCategory(newCategory._id);
                console.log('✅ Test category deleted');
            } catch (cleanupError) {
                console.warn('⚠️  Could not delete test category:', cleanupError.message);
            }
        } else {
            logResult('CREATE Category', false, 'Failed to create category');
            results.failed++;
        }
    } catch (error) {
        logResult('CREATE Category', false, error.message);
        results.failed++;
    }

    await wait(1000);

    // ==========================================
    // FINAL RESULTS
    // ==========================================
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Total Tests: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%`);
    console.log('=' .repeat(60));

    if (results.failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! CRUD is working perfectly! 🎉\n');
    } else {
        console.log(`\n⚠️  ${results.failed} test(s) failed. Check errors above.\n`);
    }

    return results;
}

// ==========================================
// QUICK MANUAL TESTS
// ==========================================
console.log('\n💡 QUICK MANUAL TEST COMMANDS:');
console.log('=' .repeat(60));
console.log('Run these commands in console to test manually:\n');
console.log('// Test GET Categories:');
console.log('AdminServices.getCategories().then(data => console.log("Categories:", data));\n');
console.log('// Test GET Books:');
console.log('AdminServices.getBooks({ page: 1, limit: 5 }).then(data => console.log("Books:", data));\n');
console.log('// Test GET Orders:');
console.log('AdminServices.getOrders({ page: 1, limit: 5 }).then(data => console.log("Orders:", data));\n');
console.log('// Test CREATE Category:');
console.log(`AdminServices.createCategory({ 
  name: 'Test Category', 
  slug: 'test-category', 
  description: 'Test', 
  isVisible: true 
}).then(data => console.log("Created:", data));\n`);
console.log('=' .repeat(60));

// ==========================================
// RUN THE TEST SUITE
// ==========================================
console.log('\n🚀 Running automated test suite in 2 seconds...\n');
setTimeout(() => {
    testCRUD().catch(error => {
        console.error('❌ Test suite crashed:', error);
    });
}, 2000);

