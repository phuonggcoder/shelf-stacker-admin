/**
 * CRUD TEST WITH IMAGE SUPPORT
 * Copy và paste vào Browser Console (F12)
 */

console.log('🧪 Starting CRUD Test Suite (With Image Support)...\n');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const logResult = (test, passed, message) => {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${test}: ${message}`);
    return passed;
};

async function testCRUDWithImage() {
    const results = {
        total: 0,
        passed: 0,
        failed: 0,
        details: []
    };

    console.log('\n📋 TEST SUITE: CRUD OPERATIONS (With Image)\n');
    console.log('=' .repeat(60));

    // Check AdminServices
    console.log('\n🔍 Test 1: Checking AdminServices...');
    results.total++;
    
    if (typeof window.AdminServices === 'undefined') {
        logResult('AdminServices', false, 'AdminServices NOT found!');
        results.failed++;
        return results;
    }
    
    logResult('AdminServices', true, 'AdminServices loaded');
    results.passed++;

    // Check token
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.warn('\n⚠️  No auth token. Login first!');
        return results;
    }
    
    console.log('✅ Auth token found');

    // ==========================================
    // TEST 2: GET Categories
    // ==========================================
    console.log('\n🔍 Test 2: Testing GET Categories...');
    results.total++;
    
    try {
        const categories = await window.AdminServices.getCategories();
        if (Array.isArray(categories)) {
            logResult('GET Categories', true, `Loaded ${categories.length} categories`);
            console.log('   Sample:', categories[0]?.name || 'No categories');
            results.passed++;
        } else {
            logResult('GET Categories', false, 'Unexpected response');
            results.failed++;
        }
    } catch (error) {
        logResult('GET Categories', false, error.message);
        results.failed++;
    }

    await wait(1000);

    // ==========================================
    // TEST 3: GET Books
    // ==========================================
    console.log('\n🔍 Test 3: Testing GET Books...');
    results.total++;
    
    try {
        const response = await window.AdminServices.getBooks({ page: 1, limit: 5 });
        const books = response.books || response;
        
        if (Array.isArray(books)) {
            logResult('GET Books', true, `Loaded ${books.length} books`);
            console.log('   Sample:', books[0]?.title || 'No books');
            results.passed++;
        } else {
            logResult('GET Books', false, 'Unexpected response');
            results.failed++;
        }
    } catch (error) {
        logResult('GET Books', false, error.message);
        results.failed++;
    }

    await wait(1000);

    // ==========================================
    // TEST 4: GET Vouchers
    // ==========================================
    console.log('\n🔍 Test 4: Testing GET Vouchers...');
    results.total++;
    
    try {
        const response = await window.AdminServices.getVouchers({ page: 1, limit: 5 });
        const vouchers = response.vouchers || response;
        
        if (Array.isArray(vouchers)) {
            logResult('GET Vouchers', true, `Loaded ${vouchers.length} vouchers`);
            results.passed++;
        } else {
            logResult('GET Vouchers', false, 'Unexpected response');
            results.failed++;
        }
    } catch (error) {
        logResult('GET Vouchers', false, error.message);
        results.failed++;
    }

    await wait(1000);

    // ==========================================
    // TEST 5: CREATE Category (WITH IMAGE URL)
    // ==========================================
    console.log('\n🔍 Test 5: Testing CREATE Category (with image)...');
    results.total++;
    
    try {
        // Use a placeholder image URL
        const testCategory = {
            name: `Test Category ${Date.now()}`,
            slug: `test-category-${Date.now()}`,
            description: 'Automated test category with image',
            isVisible: true,
            // Use a valid placeholder image URL
            imageUrl: 'https://via.placeholder.com/400x400.png?text=Test+Category'
        };
        
        console.log('   Creating with imageUrl:', testCategory.imageUrl);
        
        const newCategory = await window.AdminServices.createCategory(testCategory);
        
        if (newCategory && newCategory._id) {
            logResult('CREATE Category', true, `Created: ${newCategory._id}`);
            console.log('   Created:', { 
                _id: newCategory._id, 
                name: newCategory.name,
                slug: newCategory.slug,
                image: newCategory.image 
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
        console.log('   💡 Tip: Backend requires image. Try testing CREATE via UI instead.');
    }

    await wait(1000);

    // ==========================================
    // TEST 6: UPDATE Category (if we have categories)
    // ==========================================
    console.log('\n🔍 Test 6: Testing UPDATE Category...');
    results.total++;
    
    try {
        const categories = await window.AdminServices.getCategories();
        
        if (categories && categories.length > 0) {
            const testCat = categories[0];
            console.log(`   Updating category: ${testCat.name} (${testCat._id})`);
            
            const updateData = {
                description: `Updated at ${new Date().toLocaleTimeString()} by automated test`
            };
            
            const updated = await window.AdminServices.updateCategory(testCat._id, updateData);
            
            if (updated && updated._id) {
                logResult('UPDATE Category', true, `Updated: ${updated._id}`);
                console.log('   New description:', updated.description);
                results.passed++;
                
                // Restore original
                console.log('   🔄 Restoring original description...');
                await window.AdminServices.updateCategory(testCat._id, { 
                    description: testCat.description 
                });
                console.log('   ✅ Restored');
            } else {
                logResult('UPDATE Category', false, 'No _id returned');
                results.failed++;
            }
        } else {
            logResult('UPDATE Category', false, 'No categories to update');
            results.failed++;
        }
    } catch (error) {
        logResult('UPDATE Category', false, error.message);
        results.failed++;
        results.details.push(`UPDATE Category failed: ${error.message}`);
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
            console.log('📋 Issues:');
            results.details.forEach((detail, i) => {
                console.log(`   ${i + 1}. ${detail}`);
            });
        }
    }

    return results;
}

// Quick diagnostic
console.log('🔧 QUICK DIAGNOSTIC:\n');

if (typeof window.AdminServices !== 'undefined') {
    console.log('✅ AdminServices exists');
    const methods = ['getCategories', 'createCategory', 'updateCategory', 'deleteCategory'];
    methods.forEach(m => {
        console.log(`   ${typeof window.AdminServices[m] === 'function' ? '✅' : '❌'} ${m}`);
    });
} else {
    console.log('❌ AdminServices NOT FOUND');
}

const hasToken = !!localStorage.getItem('authToken');
console.log(`${hasToken ? '✅' : '❌'} Auth token: ${hasToken ? 'Found' : 'Not found'}`);

// Run test
console.log('\n🚀 Running test suite in 2 seconds...\n');
setTimeout(() => {
    testCRUDWithImage().catch(error => {
        console.error('❌ Test crashed:', error);
    });
}, 2000);

