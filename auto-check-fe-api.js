/**
 * AUTOMATIC FE-API INTEGRATION CHECKER
 * Kiểm tra tự động xem FE đã tích hợp đúng API chưa
 */

const fs = require('fs');
const path = require('path');

// API Endpoints từ documentation
const API_ENDPOINTS = {
    // Authentication
    authentication: [
        'POST /auth/login',
        'POST /auth/refresh'
    ],
    
    // Dashboard & Statistics
    dashboard: [
        'GET /api/admin/statistics/dashboard',
        'GET /api/admin/statistics/orders',
        'GET /api/admin/statistics/revenue/time',
        'GET /api/admin/statistics/revenue/category',
        'GET /api/admin/statistics/sales-report',
        'GET /api/admin/statistics/orders/detail'
    ],
    
    // Orders
    orders: [
        'GET /api/orders',
        'GET /api/orders/:order_id',
        'PATCH /api/orders/:order_id/status',
        'POST /api/admin/orders/:order_id/cancel',
        'GET /api/admin/expiring-orders',
        'GET /api/admin/order-stats'
    ],
    
    // Books
    books: [
        'GET /api/books/admin',
        'POST /api/books',
        'PUT /api/books/:id',
        'DELETE /api/books/:id',
        'GET /api/books/trash/all',
        'PATCH /api/books/:id/restore',
        'DELETE /api/books/:id/force'
    ],
    
    // Categories
    categories: [
        'GET /api/categories',
        'POST /api/categories',
        'PUT /api/categories/:id',
        'DELETE /api/categories/:id'
    ],
    
    // Users
    users: [
        'GET /api/users/users',
        'GET /api/users/users/:userId',
        'POST /api/users/admin/create',
        'PATCH /api/users/users/:userId/lock',
        'POST /api/users/users/:userId/verify-shipper'
    ],
    
    // Vouchers
    vouchers: [
        'GET /api/vouchers',
        'POST /api/vouchers',
        'PUT /api/vouchers/admin/:id',
        'DELETE /api/vouchers/admin/:id'
    ],
    
    // Campaigns
    campaigns: [
        'GET /api/campaigns',
        'POST /api/campaigns',
        'PUT /api/campaigns/:id',
        'DELETE /api/campaigns/:id'
    ],
    
    // Shippers
    shippers: [
        'GET /api/users/shippers',
        'GET /api/admin/shipper/:shipper_id/orders',
        'GET /api/admin/shippers'
    ],
    
    // Payments
    payments: [
        'GET /api/payments',
        'GET /api/payments/:id'
    ],
    
    // Reviews
    reviews: [
        'GET /api/v1/review',
        'DELETE /api/v1/review/:reviewId'
    ],
    
    // Notifications
    notifications: [
        'GET /api/v1/admin/notification-templates',
        'POST /api/v1/admin/notification-templates',
        'PUT /api/v1/admin/notification-templates/:id',
        'DELETE /api/v1/admin/notification-templates/:id',
        'POST /api/v1/admin/instant-notifications/send',
        'POST /api/v1/admin/scheduled-notifications',
        'GET /api/v1/admin/recipients/users',
        'GET /api/v1/admin/recipients/shippers',
        'POST /api/v1/shipper-notifications/send-to-order-shipper',
        'GET /api/notification-history'
    ],
    
    // Refunds
    refunds: [
        'GET /api/admin/refund-requests',
        'POST /api/admin/refund/:order_id/process'
    ],
    
    // Settings
    settings: [
        'GET /api/admin/settings',
        'GET /api/admin/settings/:key',
        'PUT /api/admin/settings/:key',
        'PUT /api/admin/settings/bulk',
        'POST /api/admin/settings'
    ],
    
    // System
    system: [
        'GET /api/admin/system/info',
        'GET /api/admin/system/logs',
        'POST /api/admin/system/backup',
        'GET /api/admin/system/backups',
        'POST /api/admin/system/restore/:backup_id'
    ]
};

// Các file cần kiểm tra
const FILES_TO_CHECK = {
    views: [
        'views/home.html',
        'views/orders.html',
        'views/danhmucdonhang.html',
        'views/products.html',
        'views/quanlydanhmuc.html',
        'views/categories.html',
        'views/users.html',
        'views/quanlynguoidung.html',
        'views/voucher.html',
        'views/voucher-management.html',
        'views/vouchers.html',
        'views/campaigns.html',
        'views/notification-admin.html',
        'views/settings.html',
        'views/reports.html',
        'views/order-stats.html',
        'views/danhgiasanpham.html'
    ],
    js: [
        'public/AdminServices.js',
        'public/assets/js/dashboard.js',
        'public/assets/js/orders.js',
        'public/assets/js/products.js',
        'public/assets/js/categories.js',
        'public/assets/js/users.js',
        'public/assets/js/vouchers.js',
        'public/assets/js/campaigns.js',
        'public/assets/js/notifications.js'
    ]
};

class FEAPIChecker {
    constructor() {
        this.results = {
            missingAPIs: [],
            unusedAPIs: [],
            uiIssues: [],
            apiCallIssues: [],
            implementedAPIs: []
        };
    }

    // Đọc nội dung file
    readFile(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf-8');
        } catch (error) {
            console.log(`⚠️  Cannot read file: ${filePath}`);
            return null;
        }
    }

    // Kiểm tra API có được gọi trong code không
    checkAPIUsage(content, apiPath) {
        // Chuyển đổi API path thành pattern tìm kiếm
        const patterns = [
            apiPath.replace(/:[^/]+/g, '\\${.*?}'), // Pattern cho template string
            apiPath.replace(/:[^/]+/g, '[^/]+'),    // Pattern cho string concatenation
            apiPath.split('/').pop()                 // Method name trong AdminServices
        ];

        return patterns.some(pattern => {
            const regex = new RegExp(pattern.replace(/\//g, '\\/'), 'i');
            return regex.test(content);
        });
    }

    // Kiểm tra tất cả files
    checkAllFiles() {
        console.log('🔍 STARTING AUTOMATIC FE-API INTEGRATION CHECK...\n');
        
        let allContent = '';
        
        // Đọc tất cả files
        [...FILES_TO_CHECK.views, ...FILES_TO_CHECK.js].forEach(file => {
            const content = this.readFile(file);
            if (content) {
                allContent += content + '\n';
            }
        });

        // Kiểm tra từng API endpoint
        Object.entries(API_ENDPOINTS).forEach(([category, endpoints]) => {
            console.log(`\n📦 Checking ${category.toUpperCase()} APIs:`);
            
            endpoints.forEach(endpoint => {
                const [method, path] = endpoint.split(' ');
                const isUsed = this.checkAPIUsage(allContent, path);
                
                if (isUsed) {
                    console.log(`  ✅ ${endpoint}`);
                    this.results.implementedAPIs.push(endpoint);
                } else {
                    console.log(`  ❌ ${endpoint} - NOT FOUND`);
                    this.results.missingAPIs.push({
                        category,
                        endpoint,
                        priority: this.getPriority(category)
                    });
                }
            });
        });

        // Kiểm tra lỗi UI/UX
        this.checkUIIssues(allContent);
        
        // Kiểm tra lỗi API calls
        this.checkAPICallIssues(allContent);

        // In báo cáo tổng kết
        this.printReport();
    }

    // Xác định mức độ ưu tiên
    getPriority(category) {
        const highPriority = ['authentication', 'dashboard', 'orders', 'books'];
        const mediumPriority = ['categories', 'users', 'vouchers', 'campaigns'];
        
        if (highPriority.includes(category)) return 'HIGH';
        if (mediumPriority.includes(category)) return 'MEDIUM';
        return 'LOW';
    }

    // Kiểm tra lỗi UI/UX
    checkUIIssues(content) {
        console.log('\n\n🎨 CHECKING UI/UX ISSUES...\n');

        const uiChecks = [
            {
                name: 'Missing loading states',
                pattern: /fetch\(|\.then\(/g,
                check: (matches) => {
                    const loadingPatterns = /loading|spinner|disabled/gi;
                    return !loadingPatterns.test(content);
                }
            },
            {
                name: 'Missing error messages',
                pattern: /catch\(/g,
                check: (matches) => {
                    const errorPatterns = /alert|toast|notification|showError/gi;
                    const errorCount = (content.match(errorPatterns) || []).length;
                    const catchCount = matches.length;
                    return errorCount < catchCount * 0.5; // Ít nhất 50% catch phải có error handling
                }
            },
            {
                name: 'No pagination',
                pattern: /getOrders|getBooks|getUsers|getVouchers/g,
                check: () => {
                    return !/page|limit|pagination/i.test(content);
                }
            },
            {
                name: 'No search functionality',
                pattern: /<input[^>]*type=["']search["']/gi,
                check: (matches) => matches.length < 5 // Ít nhất 5 trang cần có search
            },
            {
                name: 'Missing date formatting',
                pattern: /createdAt|updatedAt|order_date/gi,
                check: () => {
                    return !/formatDate|toLocaleString|Intl\.DateTimeFormat/i.test(content);
                }
            },
            {
                name: 'Missing currency formatting',
                pattern: /price|amount|total|revenue/gi,
                check: () => {
                    return !/formatCurrency|toLocaleString.*VND/i.test(content);
                }
            }
        ];

        uiChecks.forEach(check => {
            const matches = content.match(check.pattern) || [];
            if (matches.length > 0 && check.check(matches)) {
                console.log(`  ⚠️  ${check.name}`);
                this.results.uiIssues.push(check.name);
            }
        });
    }

    // Kiểm tra lỗi API calls
    checkAPICallIssues(content) {
        console.log('\n\n🔧 CHECKING API CALL ISSUES...\n');

        const issues = [];

        // Kiểm tra missing Authorization header
        const fetchCalls = content.match(/fetch\([^)]+\)/gs) || [];
        let missingAuth = 0;
        fetchCalls.forEach(call => {
            if (!/Authorization|getAuthHeaders|getHeaders/i.test(call)) {
                missingAuth++;
            }
        });
        if (missingAuth > 0) {
            issues.push(`${missingAuth} fetch calls missing Authorization header`);
        }

        // Kiểm tra error handling
        const catchBlocks = content.match(/catch\s*\([^)]*\)\s*\{[^}]*\}/gs) || [];
        let emptyCatch = 0;
        catchBlocks.forEach(block => {
            if (block.length < 50) { // Empty or minimal catch block
                emptyCatch++;
            }
        });
        if (emptyCatch > 0) {
            issues.push(`${emptyCatch} empty or minimal catch blocks`);
        }

        // Kiểm tra response handling
        if (!/handleResponse|response\.json|response\.ok/i.test(content)) {
            issues.push('No proper response handling found');
        }

        // Kiểm tra FormData usage
        const formDataUsage = content.match(/new FormData\(/g) || [];
        const contentTypeFormData = content.match(/Content-Type.*multipart\/form-data/gi) || [];
        if (formDataUsage.length > 0 && contentTypeFormData.length > 0) {
            issues.push('FormData usage with explicit Content-Type (should be auto-set by browser)');
        }

        if (issues.length > 0) {
            issues.forEach(issue => {
                console.log(`  ⚠️  ${issue}`);
                this.results.apiCallIssues.push(issue);
            });
        } else {
            console.log('  ✅ No major API call issues found');
        }
    }

    // In báo cáo
    printReport() {
        console.log('\n\n' + '='.repeat(80));
        console.log('📊 FINAL REPORT');
        console.log('='.repeat(80));

        console.log(`\n✅ Implemented APIs: ${this.results.implementedAPIs.length}`);
        console.log(`❌ Missing APIs: ${this.results.missingAPIs.length}`);
        console.log(`⚠️  UI/UX Issues: ${this.results.uiIssues.length}`);
        console.log(`🔧 API Call Issues: ${this.results.apiCallIssues.length}`);

        // Chi tiết Missing APIs
        if (this.results.missingAPIs.length > 0) {
            console.log('\n\n❌ MISSING APIs (Need to implement):');
            
            const byPriority = {
                HIGH: [],
                MEDIUM: [],
                LOW: []
            };
            
            this.results.missingAPIs.forEach(item => {
                byPriority[item.priority].push(item);
            });

            ['HIGH', 'MEDIUM', 'LOW'].forEach(priority => {
                if (byPriority[priority].length > 0) {
                    console.log(`\n  🔴 ${priority} PRIORITY:`);
                    byPriority[priority].forEach(item => {
                        console.log(`    - ${item.endpoint} (${item.category})`);
                    });
                }
            });
        }

        // Chi tiết UI/UX Issues
        if (this.results.uiIssues.length > 0) {
            console.log('\n\n⚠️  UI/UX ISSUES:');
            this.results.uiIssues.forEach(issue => {
                console.log(`  - ${issue}`);
            });
        }

        // Chi tiết API Call Issues
        if (this.results.apiCallIssues.length > 0) {
            console.log('\n\n🔧 API CALL ISSUES:');
            this.results.apiCallIssues.forEach(issue => {
                console.log(`  - ${issue}`);
            });
        }

        // Tính toán phần trăm hoàn thành
        const totalAPIs = Object.values(API_ENDPOINTS).flat().length;
        const implementedAPIs = this.results.implementedAPIs.length;
        const completionRate = ((implementedAPIs / totalAPIs) * 100).toFixed(2);

        console.log('\n\n📈 COMPLETION RATE:');
        console.log(`  ${implementedAPIs}/${totalAPIs} APIs implemented (${completionRate}%)`);

        // Lưu báo cáo ra file
        this.saveReport();
    }

    // Lưu báo cáo ra file
    saveReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalAPIs: Object.values(API_ENDPOINTS).flat().length,
                implementedAPIs: this.results.implementedAPIs.length,
                missingAPIs: this.results.missingAPIs.length,
                uiIssues: this.results.uiIssues.length,
                apiCallIssues: this.results.apiCallIssues.length,
                completionRate: ((this.results.implementedAPIs.length / Object.values(API_ENDPOINTS).flat().length) * 100).toFixed(2) + '%'
            },
            details: this.results
        };

        fs.writeFileSync('FE_API_CHECK_REPORT.json', JSON.stringify(report, null, 2));
        console.log('\n\n💾 Detailed report saved to: FE_API_CHECK_REPORT.json');
    }
}

// Chạy checker
const checker = new FEAPIChecker();
checker.checkAllFiles();

