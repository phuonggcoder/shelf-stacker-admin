const puppeteer = require('puppeteer');
const { expect } = require('chai');

describe('Admin Interface Tests', () => {
    let browser;
    let page;
    const BASE_URL = 'http://localhost:3000';
    
    before(async () => {
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null
        });
        page = await browser.newPage();
        
        // Set admin token
        await page.evaluateOnNewDocument((token) => {
            localStorage.setItem('admin_token', token);
        }, process.env.TEST_ADMIN_TOKEN);
    });
    
    after(async () => {
        await browser.close();
    });
    
    describe('Voucher Management', () => {
        beforeEach(async () => {
            await page.goto(`${BASE_URL}/vouchers-admin.html`);
            await page.waitForSelector('#voucher-table');
        });
        
        it('should create a new voucher', async () => {
            await page.click('#btn-new');
            await page.waitForSelector('#voucher-form');
            
            // Fill form
            await page.type('input[name="voucher_id"]', 'TEST123');
            await page.select('select[name="voucher_type"]', 'discount');
            await page.select('select[name="discount_type"]', 'fixed');
            await page.type('input[name="discount_value"]', '50000');
            await page.type('input[name="min_order_value"]', '100000');
            await page.type('input[name="usage_limit"]', '100');
            await page.type('input[name="max_per_user"]', '1');
            
            // Set dates
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            
            await page.type('input[name="start_date"]', tomorrow.toISOString().split('T')[0]);
            await page.type('input[name="end_date"]', nextWeek.toISOString().split('T')[0]);
            
            // Submit
            await page.click('button[type="submit"]');
            
            // Wait for success message
            await page.waitForSelector('.success-message:not(.hidden)');
            
            // Verify voucher appears in table
            const cellText = await page.$eval('#voucher-table tbody tr:first-child td:nth-child(2)', el => el.textContent);
            expect(cellText).to.equal('TEST123');
        });
        
        it('should validate required fields', async () => {
            await page.click('#btn-new');
            await page.waitForSelector('#voucher-form');
            
            // Try to submit empty form
            await page.click('button[type="submit"]');
            
            // Check for error messages
            const errorMessages = await page.$$eval('.error-message:not(.hidden)', els => els.length);
            expect(errorMessages).to.be.greaterThan(0);
        });
        
        it('should edit existing voucher', async () => {
            // Click edit on first voucher
            await page.click('#voucher-table tbody tr:first-child .btn-edit');
            await page.waitForSelector('#voucher-form');
            
            // Update description
            await page.type('textarea[name="description"]', ' - Updated');
            
            // Submit
            await page.click('button[type="submit"]');
            
            // Wait for success message
            await page.waitForSelector('.success-message:not(.hidden)');
        });
    });
    
    describe('Order Management', () => {
        beforeEach(async () => {
            await page.goto(`${BASE_URL}/order-stats.html`);
            await page.waitForSelector('#recentOrdersTable');
        });
        
        it('should filter orders by date range', async () => {
            // Set date range
            const today = new Date().toISOString().split('T')[0];
            await page.type('#filter-date-from', today);
            await page.type('#filter-date-to', today);
            
            await page.click('#btn-apply-filters');
            
            // Wait for table update
            await page.waitForFunction(() => {
                const rows = document.querySelectorAll('#recentOrdersTable tr');
                return rows.length > 0;
            });
        });
        
        it('should process refund', async () => {
            // Find first completed order with no refund
            await page.waitForSelector('.btn-refund');
            await page.click('.btn-refund');
            
            // Wait for refund modal
            await page.waitForSelector('#refundModal');
            
            // Confirm refund
            await page.click('#btn-confirm-refund');
            
            // Wait for success message
            await page.waitForSelector('.toast-success');
        });
        
        it('should show order details', async () => {
            // Click view on first order
            await page.click('#recentOrdersTable tr:first-child .btn-view');
            
            // Wait for details modal
            await page.waitForSelector('.order-details');
            
            // Verify details loaded
            const hasDetails = await page.$eval('.order-details', el => el.textContent.length > 0);
            expect(hasDetails).to.be.true;
        });
    });
    
    describe('General UI/UX', () => {
        it('should show loading states', async () => {
            await page.goto(`${BASE_URL}/vouchers-admin.html`);
            
            // Trigger loading state
            await page.click('#btn-new');
            
            // Check loading indicator
            const hasLoading = await page.$eval('.loading-indicator', el => 
                window.getComputedStyle(el).display !== 'none'
            );
            expect(hasLoading).to.be.true;
        });
        
        it('should be responsive', async () => {
            // Test mobile viewport
            await page.setViewport({ width: 375, height: 667 });
            await page.goto(`${BASE_URL}/vouchers-admin.html`);
            
            // Check if mobile menu is present
            const hasMobileMenu = await page.$eval('.mobile-menu', el => 
                window.getComputedStyle(el).display !== 'none'
            );
            expect(hasMobileMenu).to.be.true;
        });
    });
});