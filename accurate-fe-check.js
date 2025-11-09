/**
 * ACCURATE FE-API INTEGRATION CHECKER
 * Kiểm tra chính xác bằng cách:
 * 1. Đọc HTML file
 * 2. Tìm các file JS được load
 * 3. Kiểm tra các file JS đó có gọi API không
 */

const fs = require('fs');
const path = require('path');

const PAGES = [
    {
        name: 'Dashboard',
        html: 'views/home.html',
        expectedAPIs: ['getDashboardStats', 'getOrderStats', 'getRevenueByTime'],
        priority: 'HIGH'
    },
    {
        name: 'Orders',
        html: 'views/orders.html',
        expectedAPIs: ['getOrders', 'getOrder', 'updateOrderStatus', 'cancelOrder'],
        priority: 'HIGH'
    },
    {
        name: 'Books',
        html: 'views/products.html',
        expectedAPIs: ['getBooks', 'createBook', 'updateBook', 'deleteBook'],
        priority: 'HIGH'
    },
    {
        name: 'Categories',
        html: 'views/quanlydanhmuc.html',
        expectedAPIs: ['getCategories', 'createCategory', 'updateCategory', 'deleteCategory'],
        priority: 'HIGH'
    },
    {
        name: 'Users',
        html: 'views/users.html',
        expectedAPIs: ['getUsers', 'createUser', 'lockUser', 'deleteUser'],
        priority: 'MEDIUM'
    },
    {
        name: 'Vouchers',
        html: 'views/voucher-management.html',
        expectedAPIs: ['getVouchers', 'createVoucher', 'updateVoucher', 'deleteVoucher'],
        priority: 'MEDIUM'
    },
    {
        name: 'Campaigns',
        html: 'views/campaigns.html',
        expectedAPIs: ['getCampaigns', 'createCampaign', 'updateCampaign', 'deleteCampaign'],
        priority: 'MEDIUM'
    },
    {
        name: 'Notifications',
        html: 'views/notification-admin.html',
        expectedAPIs: ['getNotificationTemplates', 'sendInstantNotification', 'getRecipientsUsers'],
        priority: 'MEDIUM'
    },
    {
        name: 'Settings',
        html: 'views/settings.html',
        expectedAPIs: ['getSettings', 'updateSetting', 'updateSettingsBulk'],
        priority: 'LOW'
    },
    {
        name: 'Reports',
        html: 'views/reports.html',
        expectedAPIs: ['getSalesReport', 'getOrderStatistics', 'getRevenueByCategory'],
        priority: 'LOW'
    }
];

class AccurateChecker {
    constructor() {
        this.results = {
            pages: [],
            summary: {
                total: 0,
                fullyImplemented: 0,
                partiallyImplemented: 0,
                notImplemented: 0,
                uiIssues: []
            }
        };
    }

    readFile(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf-8');
        } catch (error) {
            return null;
        }
    }

    // Tìm các file JS được load trong HTML
    findLoadedJSFiles(htmlContent) {
        const scriptTags = htmlContent.match(/<script[^>]*src=["']([^"']+\.js)["'][^>]*>/gi) || [];
        const jsFiles = scriptTags.map(tag => {
            const match = tag.match(/src=["']([^"']+\.js)["']/i);
            return match ? match[1] : null;
        }).filter(Boolean);
        
        return jsFiles;
    }

    // Kiểm tra API có được gọi trong nội dung không
    checkAPIInContent(content, apiName) {
        const patterns = [
            `AdminServices.${apiName}`,
            `window.AdminServices.${apiName}`,
            `.${apiName}\\(`,
            `${apiName}\\(`
        ];
        
        return patterns.some(pattern => {
            try {
                const regex = new RegExp(pattern, 'i');
                return regex.test(content);
            } catch (e) {
                console.error(`Error in regex pattern: ${pattern}`, e);
                return false;
            }
        });
    }

    // Kiểm tra common UI issues
    checkUIIssues(content) {
        const issues = [];

        // Error handling
        const catchBlocks = (content.match(/catch\s*\(/g) || []).length;
        const apiCalls = (content.match(/AdminServices\./g) || []).length;
        if (apiCalls > 0 && catchBlocks < apiCalls * 0.7) {
            issues.push(`Thiếu error handling (${catchBlocks} catch cho ${apiCalls} API calls)`);
        }

        // Loading state
        if (content.includes('AdminServices.') && !content.includes('loading') && !content.includes('showLoading')) {
            issues.push('Không có loading state');
        }

        // Empty state
        if (content.includes('tbody') || content.includes('list')) {
            if (!content.includes('empty') && !content.includes('Không có') && !content.includes('No data')) {
                issues.push('Không có empty state message');
            }
        }

        // Date formatting
        if (content.includes('createdAt') || content.includes('updatedAt')) {
            if (!content.includes('formatDate') && !content.includes('toLocaleString')) {
                issues.push('Không có date formatting');
            }
        }

        // Currency formatting
        if (content.includes('price') || content.includes('amount') || content.includes('total')) {
            if (!content.includes('formatCurrency') && !content.includes('toLocaleString')) {
                issues.push('Không có currency formatting');
            }
        }

        // Pagination
        if (content.includes('getOrders') || content.includes('getBooks') || content.includes('getUsers')) {
            if (!content.includes('pagination') && !content.includes('currentPage')) {
                issues.push('Không có pagination');
            }
        }

        return issues;
    }

    checkPage(page) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📄 Checking: ${page.name} (${page.html})`);
        console.log(`${'='.repeat(80)}`);

        const htmlContent = this.readFile(page.html);
        if (!htmlContent) {
            console.log('  ❌ Cannot read HTML file');
            this.results.pages.push({
                name: page.name,
                status: 'error',
                error: 'Cannot read HTML file'
            });
            return;
        }

        // Tìm các file JS được load
        const jsFiles = this.findLoadedJSFiles(htmlContent);
        console.log(`  📦 Found ${jsFiles.length} JS files loaded:`);
        jsFiles.forEach(file => console.log(`     - ${file}`));

        // Đọc nội dung tất cả JS files
        let allJSContent = '';
        const loadedJSFiles = [];
        jsFiles.forEach(jsFile => {
            // Convert path từ HTML (e.g., /assets/js/admin-dashboard.js) sang path thực tế
            const actualPath = jsFile.startsWith('/') 
                ? 'public' + jsFile 
                : path.join('public', jsFile);
            
            const jsContent = this.readFile(actualPath);
            if (jsContent) {
                allJSContent += jsContent + '\n';
                loadedJSFiles.push(jsFile);
                console.log(`     ✅ Loaded: ${jsFile}`);
            } else {
                console.log(`     ⚠️  Cannot load: ${jsFile}`);
            }
        });

        // Combine với AdminServices.js
        const adminServicesContent = this.readFile('public/AdminServices.js');
        if (adminServicesContent) {
            allJSContent += adminServicesContent;
        }

        // Kiểm tra từng API
        console.log(`\n  🔍 Checking API calls:`);
        const foundAPIs = [];
        const missingAPIs = [];
        
        page.expectedAPIs.forEach(api => {
            if (this.checkAPIInContent(allJSContent, api)) {
                console.log(`     ✅ ${api}`);
                foundAPIs.push(api);
            } else {
                console.log(`     ❌ ${api}`);
                missingAPIs.push(api);
            }
        });

        // Kiểm tra UI issues
        const uiIssues = this.checkUIIssues(allJSContent);
        if (uiIssues.length > 0) {
            console.log(`\n  ⚠️  UI/UX Issues:`);
            uiIssues.forEach(issue => console.log(`     - ${issue}`));
        } else {
            console.log(`\n  ✅ No major UI/UX issues`);
        }

        // Xác định status
        let status;
        if (foundAPIs.length === page.expectedAPIs.length) {
            status = 'fully_implemented';
            this.results.summary.fullyImplemented++;
        } else if (foundAPIs.length > 0) {
            status = 'partially_implemented';
            this.results.summary.partiallyImplemented++;
        } else {
            status = 'not_implemented';
            this.results.summary.notImplemented++;
        }

        this.results.pages.push({
            name: page.name,
            html: page.html,
            priority: page.priority,
            status: status,
            jsFiles: loadedJSFiles,
            apiCoverage: {
                found: foundAPIs.length,
                total: page.expectedAPIs.length,
                percentage: ((foundAPIs.length / page.expectedAPIs.length) * 100).toFixed(2)
            },
            foundAPIs: foundAPIs,
            missingAPIs: missingAPIs,
            uiIssues: uiIssues
        });

        console.log(`\n  📊 Coverage: ${foundAPIs.length}/${page.expectedAPIs.length} (${((foundAPIs.length / page.expectedAPIs.length) * 100).toFixed(2)}%)`);
        console.log(`  Status: ${status.replace(/_/g, ' ').toUpperCase()}`);
    }

    checkAll() {
        console.log('🔍 ACCURATE FE-API INTEGRATION CHECK\n');
        
        this.results.summary.total = PAGES.length;
        
        PAGES.forEach(page => {
            this.checkPage(page);
        });

        this.printSummary();
        this.saveReport();
    }

    printSummary() {
        console.log('\n\n' + '='.repeat(80));
        console.log('📊 FINAL SUMMARY');
        console.log('='.repeat(80));

        console.log(`\nTotal pages checked: ${this.results.summary.total}`);
        console.log(`✅ Fully implemented: ${this.results.summary.fullyImplemented}`);
        console.log(`🟡 Partially implemented: ${this.results.summary.partiallyImplemented}`);
        console.log(`❌ Not implemented: ${this.results.summary.notImplemented}`);

        const overallCoverage = this.results.pages.reduce((sum, page) => {
            return sum + parseFloat(page.apiCoverage.percentage);
        }, 0) / this.results.pages.length;

        console.log(`\n📈 Overall API Coverage: ${overallCoverage.toFixed(2)}%`);

        // Group by priority and status
        console.log('\n\n📋 BY PRIORITY:');
        ['HIGH', 'MEDIUM', 'LOW'].forEach(priority => {
            const pagesInPriority = this.results.pages.filter(p => p.priority === priority);
            if (pagesInPriority.length > 0) {
                console.log(`\n  ${priority} PRIORITY:`);
                pagesInPriority.forEach(page => {
                    const icon = page.status === 'fully_implemented' ? '✅' : 
                                 page.status === 'partially_implemented' ? '🟡' : '❌';
                    console.log(`    ${icon} ${page.name}: ${page.apiCoverage.percentage}% (${page.apiCoverage.found}/${page.apiCoverage.total})`);
                    
                    if (page.missingAPIs.length > 0) {
                        console.log(`       Missing: ${page.missingAPIs.join(', ')}`);
                    }
                    if (page.uiIssues.length > 0) {
                        console.log(`       Issues: ${page.uiIssues.length} UI/UX issues`);
                    }
                });
            }
        });

        // Top issues
        const allUIIssues = this.results.pages.flatMap(p => p.uiIssues);
        const issueFrequency = {};
        allUIIssues.forEach(issue => {
            const key = issue.split('(')[0].trim(); // Group similar issues
            issueFrequency[key] = (issueFrequency[key] || 0) + 1;
        });

        if (Object.keys(issueFrequency).length > 0) {
            console.log('\n\n⚠️  COMMON UI/UX ISSUES:');
            Object.entries(issueFrequency)
                .sort((a, b) => b[1] - a[1])
                .forEach(([issue, count]) => {
                    console.log(`  - ${issue}: ${count} pages`);
                });
        }
    }

    saveReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                ...this.results.summary,
                overallCoverage: (this.results.pages.reduce((sum, page) => {
                    return sum + parseFloat(page.apiCoverage.percentage);
                }, 0) / this.results.pages.length).toFixed(2) + '%'
            },
            pages: this.results.pages
        };

        fs.writeFileSync('ACCURATE_FE_CHECK_REPORT.json', JSON.stringify(report, null, 2));
        fs.writeFileSync('ACCURATE_FE_CHECK_REPORT.md', this.generateMarkdownReport(report));
        
        console.log('\n\n💾 Reports saved:');
        console.log('  - ACCURATE_FE_CHECK_REPORT.json');
        console.log('  - ACCURATE_FE_CHECK_REPORT.md');
    }

    generateMarkdownReport(report) {
        let md = '# FE-API Integration Report\n\n';
        md += `Generated: ${new Date().toLocaleString('vi-VN')}\n\n`;
        md += '## Summary\n\n';
        md += `- **Total Pages**: ${report.summary.total}\n`;
        md += `- **Fully Implemented**: ${report.summary.fullyImplemented}\n`;
        md += `- **Partially Implemented**: ${report.summary.partiallyImplemented}\n`;
        md += `- **Not Implemented**: ${report.summary.notImplemented}\n`;
        md += `- **Overall Coverage**: ${report.summary.overallCoverage}\n\n`;

        md += '## Pages Detail\n\n';
        report.pages.forEach(page => {
            const icon = page.status === 'fully_implemented' ? '✅' : 
                         page.status === 'partially_implemented' ? '🟡' : '❌';
            md += `### ${icon} ${page.name} (${page.priority})\n\n`;
            md += `- **File**: \`${page.html}\`\n`;
            md += `- **Status**: ${page.status.replace(/_/g, ' ')}\n`;
            md += `- **Coverage**: ${page.apiCoverage.percentage}% (${page.apiCoverage.found}/${page.apiCoverage.total})\n`;
            md += `- **JS Files**: ${page.jsFiles.join(', ')}\n\n`;

            if (page.foundAPIs.length > 0) {
                md += '**Found APIs**:\n';
                page.foundAPIs.forEach(api => md += `- ✅ ${api}\n`);
                md += '\n';
            }

            if (page.missingAPIs.length > 0) {
                md += '**Missing APIs**:\n';
                page.missingAPIs.forEach(api => md += `- ❌ ${api}\n`);
                md += '\n';
            }

            if (page.uiIssues.length > 0) {
                md += '**UI/UX Issues**:\n';
                page.uiIssues.forEach(issue => md += `- ⚠️ ${issue}\n`);
                md += '\n';
            }

            md += '\n---\n\n';
        });

        return md;
    }
}

// Run checker
const checker = new AccurateChecker();
checker.checkAll();

