// API Integration Tests
const axios = require('axios');
const assert = require('assert');

const API_BASE_URL = 'http://localhost:3000/api';
let adminToken;

// Test Configuration
const config = {
    voucher: {
        id: 'TEST123',
        type: 'discount',
        value: 50000,
        minOrder: 100000
    },
    order: {
        items: [
            { book_id: '123', quantity: 1 }
        ],
        shipping: {
            address: '123 Test St'
        }
    }
};

// Setup test environment
async function setup() {
    adminToken = process.env.TEST_ADMIN_TOKEN;
    if (!adminToken) {
        throw new Error('TEST_ADMIN_TOKEN environment variable is required');
    }

    axios.defaults.baseURL = API_BASE_URL;
    axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
}

// Test Suites
async function testVoucherAPI() {
    console.log('\nTesting Voucher API...');

    // Test voucher creation
    try {
        const createResponse = await axios.post('/vouchers', {
            voucher_id: config.voucher.id,
            voucher_type: config.voucher.type,
            discount_type: 'fixed',
            discount_value: config.voucher.value,
            min_order_value: config.voucher.minOrder,
            usage_limit: 100,
            max_per_user: 1,
            start_date: new Date(),
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        assert.strictEqual(createResponse.status, 201);
        console.log('✓ Voucher creation successful');

        // Test voucher retrieval
        const getResponse = await axios.get(`/vouchers/admin/${createResponse.data._id}`);
        assert.strictEqual(getResponse.status, 200);
        assert.strictEqual(getResponse.data.voucher_id, config.voucher.id);
        console.log('✓ Voucher retrieval successful');

        // Test voucher update
        const updateResponse = await axios.put(`/vouchers/admin/${createResponse.data._id}`, {
            description: 'Updated test voucher'
        });
        assert.strictEqual(updateResponse.status, 200);
        console.log('✓ Voucher update successful');

        // Test voucher deletion
        const deleteResponse = await axios.delete(`/vouchers/admin/${createResponse.data._id}`);
        assert.strictEqual(deleteResponse.status, 200);
        console.log('✓ Voucher deletion successful');

    } catch (error) {
        console.error('✗ Voucher API test failed:', error.message);
        throw error;
    }
}

async function testOrderAPI() {
    console.log('\nTesting Order API...');

    try {
        // Test order creation
        const createResponse = await axios.post('/orders', {
            items: config.order.items,
            shipping_address: config.order.shipping.address,
            payment_method: 'cod'
        });

        assert.strictEqual(createResponse.status, 201);
        const orderId = createResponse.data._id;
        console.log('✓ Order creation successful');

        // Test order retrieval
        const getResponse = await axios.get(`/orders/${orderId}`);
        assert.strictEqual(getResponse.status, 200);
        console.log('✓ Order retrieval successful');

        // Test order update
        const updateResponse = await axios.put(`/orders/${orderId}`, {
            status: 'processing'
        });
        assert.strictEqual(updateResponse.status, 200);
        console.log('✓ Order update successful');

        // Test refund endpoints
        const refundResponse = await axios.post(`/orders/${orderId}/zalopay-refund`);
        assert.strictEqual(refundResponse.status, 200);
        console.log('✓ Refund endpoint successful');

    } catch (error) {
        console.error('✗ Order API test failed:', error.message);
        throw error;
    }
}

async function testUIIntegration() {
    console.log('\nTesting UI Integration...');

    try {
        // Test navigation API endpoints
        const navResponse = await axios.get('/api/auth/validate');
        assert.strictEqual(navResponse.status, 200);
        console.log('✓ Navigation authentication successful');

        // Test stats API
        const statsResponse = await axios.get('/api/orders/stats');
        assert.strictEqual(statsResponse.status, 200);
        console.log('✓ Statistics API successful');

        // Test search API
        const searchResponse = await axios.get('/api/orders/search?q=test');
        assert.strictEqual(searchResponse.status, 200);
        console.log('✓ Search API successful');

    } catch (error) {
        console.error('✗ UI Integration test failed:', error.message);
        throw error;
    }
}

// Run all tests
async function runTests() {
    try {
        await setup();
        await testVoucherAPI();
        await testOrderAPI();
        await testUIIntegration();
        console.log('\n✓ All tests completed successfully');
    } catch (error) {
        console.error('\n✗ Tests failed:', error.message);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}