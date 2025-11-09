/**
 * DEEP CHECK - Kiểm tra chi tiết từng trang
 */

const fs = require('fs');
const path = require('path');

const PAGES_TO_CHECK = [
    { file: 'views/home.html', name: 'Dashboard', apis: ['getDashboardStats', 'statistics/dashboard'] },
    { file: 'views/orders.html', name: 'Orders List', apis: ['getOrders', '/api/orders'] },
    { file: 'views/danhmucdonhang.html', name: 'Order Management', apis: ['getOrders', 'updateOrderStatus', 'getOrder'] },
    { file: 'views/products.html', name: 'Books Management', apis: ['getBooks', 'createBook', 'updateBook', 'deleteBook'] },
    { file: 'views/quanlydanhmuc.html', name: 'Category Management', apis: ['getCategories', 'createCategory', 'updateCategory'] },
    { file: 'views/categories.html', name: 'Categories', apis: ['getCategories'] },
    { file: 'views/users.html', name: 'Users List', apis: ['getUsers'] },
    { file: 'views/quanlynguoidung.html', name: 'User Management', apis: ['getUsers', 'createUser', 'lockUser'] },
    { file: 'views/voucher.html', name: 'Vouchers', apis: ['getVouchers'] },
    { file: 'views/voucher-management.html', name: 'Voucher Management', apis: ['getVouchers', 'createVoucher', 'updateVoucher', 'deleteVoucher'] },
    { file: 'views/vouchers.html', name: 'Vouchers Alt', apis: ['getVouchers'] },
    { file: 'views/campaigns.html', name: 'Campaigns', apis: ['getCampaigns', 'createCampaign', 'updateCampaign'] },
    { file: 'views/notification-admin.html', name: 'Notifications', apis: ['getNotificationTemplates', 'sendInstantNotification'] },
    { file: 'views/settings.html', name: 'Settings', apis: ['getSettings', 'updateSetting'] },
    { file: 'views/reports.html', name: 'Reports', apis: ['getSalesReport', 'getOrderStatistics'] },
    { file: 'views/order-stats.html', name: 'Order Stats', apis: ['getOrderStats', 'getOrderStatistics'] },
    { file: 'views/danhgiasanpham.html', name: 'Product Reviews', apis: ['getProductReviews', 'deleteReview'] }
];

class DeepChecker {
    constructor() {
        this.issues = {
            missingAPICalls: [],
            fetchIssues: [],
            uiIssues: [],
            dataHandlingIssues: []
        };
    }

    readFile(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf-8');
        } catch (error) {
            return null;
        }
    }

    checkPage(page) {
        const content = this.readFile(page.file);
        if (!content) {
            this.issues.missingAPICalls.push({
                page: page.name,
                issue: 'File not found or cannot be read'
            });
            return;
        }

        console.log(`\n📄 Checking: ${page.name} (${page.file})`);
        
        // Check API calls
        let foundAPIs = 0;
        let missingAPIs = [];
        page.apis.forEach(api => {
            if (content.includes(api)) {
                foundAPIs++;
                console.log(`  ✅ Found: ${api}`);
            } else {
                missingAPIs.push(api);
                console.log(`  ❌ Missing: ${api}`);
            }
        });

        if (missingAPIs.length > 0) {
            this.issues.missingAPICalls.push({
                page: page.name,
                file: page.file,
                missing: missingAPIs,
                found: foundAPIs,
                total: page.apis.length
            });
        }

        // Check common issues
        this.checkCommonIssues(content, page);
    }

    checkCommonIssues(content, page) {
        const issues = [];

        // 1. Check loading state
        if (content.includes('fetch(') || content.includes('.getOrders') || content.includes('.getBooks')) {
            if (!content.includes('loading') && !content.includes('spinner') && !content.includes('disabled')) {
                issues.push('No loading state found');
            }
        }

        // 2. Check error handling
        const catchCount = (content.match(/catch\s*\(/g) || []).length;
        const fetchCount = (content.match(/fetch\(|AdminServices\./g) || []).length;
        if (fetchCount > 0 && catchCount < fetchCount * 0.5) {
            issues.push(`Poor error handling: ${catchCount} catch blocks for ${fetchCount} API calls`);
        }

        // 3. Check empty state
        if (content.includes('table') || content.includes('tbody')) {
            if (!content.includes('Không có') && !content.includes('empty') && !content.includes('No data')) {
                issues.push('No empty state message');
            }
        }

        // 4. Check pagination
        if (content.includes('getOrders') || content.includes('getBooks') || content.includes('getUsers')) {
            if (!content.includes('pagination') && !content.includes('page') && !content.includes('limit')) {
                issues.push('No pagination implemented');
            }
        }

        // 5. Check search
        if (content.includes('<table') || content.includes('list')) {
            if (!content.includes('search') && !content.includes('filter')) {
                issues.push('No search/filter functionality');
            }
        }

        // 6. Check date formatting
        if (content.includes('createdAt') || content.includes('updatedAt') || content.includes('order_date')) {
            if (!content.includes('formatDate') && !content.includes('toLocaleString') && !content.includes('new Date')) {
                issues.push('No date formatting');
            }
        }

        // 7. Check currency formatting
        if (content.includes('price') || content.includes('amount') || content.includes('total')) {
            if (!content.includes('formatCurrency') && !content.includes('₫') && !content.includes('VND')) {
                issues.push('No currency formatting');
            }
        }

        // 8. Check authorization
        const fetchMatches = content.match(/fetch\([^)]+\)/g) || [];
        let unauthorizedFetch = 0;
        fetchMatches.forEach(match => {
            if (!match.includes('Authorization') && !match.includes('getAuthHeaders') && !match.includes('headers')) {
                unauthorizedFetch++;
            }
        });
        if (unauthorizedFetch > 0) {
            issues.push(`${unauthorizedFetch} fetch calls without proper authorization`);
        }

        // 9. Check data rendering
        if (content.includes('innerHTML') || content.includes('textContent')) {
            if (!content.includes('forEach') && !content.includes('map')) {
                issues.push('Possible manual data rendering (should use loops)');
            }
        }

        // 10. Check form validation
        if (content.includes('<form') || content.includes('submit')) {
            if (!content.includes('validate') && !content.includes('required') && !content.includes('checkValidity')) {
                issues.push('No form validation');
            }
        }

        if (issues.length > 0) {
            console.log(`  ⚠️  Issues found:`);
            issues.forEach(issue => console.log(`     - ${issue}`));
            
            this.issues.uiIssues.push({
                page: page.name,
                file: page.file,
                issues: issues
            });
        } else {
            console.log(`  ✅ No major issues`);
        }
    }

    checkAll() {
        console.log('🔍 DEEP CHECK - Analyzing each page in detail...\n');
        console.log('='.repeat(80));

        PAGES_TO_CHECK.forEach(page => {
            this.checkPage(page);
        });

        this.printSummary();
        this.saveReport();
    }

    printSummary() {
        console.log('\n\n' + '='.repeat(80));
        console.log('📊 SUMMARY REPORT');
        console.log('='.repeat(80));

        // Missing API Calls
        if (this.issues.missingAPICalls.length > 0) {
            console.log('\n❌ PAGES WITH MISSING API CALLS:\n');
            this.issues.missingAPICalls.forEach(item => {
                if (item.issue) {
                    console.log(`  ${item.page}: ${item.issue}`);
                } else {
                    console.log(`  ${item.page} (${item.file}):`);
                    console.log(`    Missing: ${item.missing.join(', ')}`);
                    console.log(`    Coverage: ${item.found}/${item.total} APIs found`);
                }
            });
        } else {
            console.log('\n✅ ALL PAGES HAVE PROPER API CALLS');
        }

        // UI Issues
        if (this.issues.uiIssues.length > 0) {
            console.log('\n\n⚠️  PAGES WITH UI/UX ISSUES:\n');
            this.issues.uiIssues.forEach(item => {
                console.log(`  ${item.page} (${item.file}):`);
                item.issues.forEach(issue => {
                    console.log(`    - ${issue}`);
                });
            });
        } else {
            console.log('\n✅ NO MAJOR UI/UX ISSUES');
        }

        // Statistics
        console.log('\n\n📊 STATISTICS:');
        console.log(`  Total pages checked: ${PAGES_TO_CHECK.length}`);
        console.log(`  Pages with missing API calls: ${this.issues.missingAPICalls.length}`);
        console.log(`  Pages with UI/UX issues: ${this.issues.uiIssues.length}`);
        
        const healthScore = ((PAGES_TO_CHECK.length - this.issues.missingAPICalls.length - this.issues.uiIssues.length) / PAGES_TO_CHECK.length * 100).toFixed(2);
        console.log(`\n  Health Score: ${healthScore}%`);
    }

    saveReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalPages: PAGES_TO_CHECK.length,
                pagesWithMissingAPIs: this.issues.missingAPICalls.length,
                pagesWithUIIssues: this.issues.uiIssues.length
            },
            details: this.issues
        };

        fs.writeFileSync('DEEP_CHECK_REPORT.json', JSON.stringify(report, null, 2));
        console.log('\n💾 Detailed report saved to: DEEP_CHECK_REPORT.json');
    }
}

const checker = new DeepChecker();
checker.checkAll();

