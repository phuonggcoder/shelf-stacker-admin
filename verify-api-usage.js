/**
 * VERIFY API USAGE - Kiểm tra xem APIs có thực sự được gọi không
 * Scan code để tìm API calls và verify với backend
 */

const fs = require('fs');

console.log('🔍 VERIFYING API USAGE IN FRONTEND\n');
console.log('='.repeat(80));

// Map giữa trang và expected API calls
const PAGE_API_MAP = {
    'home.html': {
        name: 'Dashboard',
        apis: [
            'getDashboardStats',
            'getOrderStats',
            'getRevenueByTime'
        ]
    },
    'orders.html': {
        name: 'Orders',
        apis: [
            'getOrders',
            'getOrder',
            'updateOrderStatus',
            'cancelOrder'
        ]
    },
    'products.html': {
        name: 'Products/Books',
        apis: [
            'getBooks',
            'createBook',
            'updateBook',
            'deleteBook'
        ]
    },
    'categories.html': {
        name: 'Categories',
        apis: [
            'getCategories'
        ]
    },
    'quanlydanhmuc.html': {
        name: 'Quản lý Danh mục',
        apis: [
            'getCategories',
            'createCategory',
            'updateCategory',
            'deleteCategory'
        ]
    },
    'users.html': {
        name: 'Users',
        apis: [
            'getUsers',
            'createUser',
            'lockUser',
            'deleteUser'
        ]
    },
    'voucher-management.html': {
        name: 'Vouchers',
        apis: [
            'getVouchers',
            'createVoucher',
            'updateVoucher',
            'deleteVoucher'
        ]
    },
    'campaigns.html': {
        name: 'Campaigns',
        apis: [
            'getCampaigns',
            'createCampaign',
            'updateCampaign',
            'deleteCampaign'
        ]
    },
    'notification-admin.html': {
        name: 'Notifications',
        apis: [
            'getNotificationTemplates',
            'sendInstantNotification',
            'getRecipientsUsers'
        ]
    },
    'settings.html': {
        name: 'Settings',
        apis: [
            'getSettings',
            'updateSetting',
            'updateSettingsBulk'
        ]
    },
    'reports.html': {
        name: 'Reports',
        apis: [
            'getSalesReport',
            'getOrderStatistics',
            'getRevenueByCategory'
        ]
    }
};

// Get JS files referenced in HTML
function getJSFiles(htmlPath) {
    try {
        const content = fs.readFileSync(htmlPath, 'utf-8');
        const scriptMatches = content.match(/<script\s+src=["']([^"']+\.js)["']/gi) || [];
        return scriptMatches.map(match => {
            const src = match.match(/src=["']([^"']+)["']/i)[1];
            // Convert to local path
            if (src.startsWith('/')) {
                return 'public' + src;
            }
            return src;
        });
    } catch (error) {
        return [];
    }
}

// Check if API is called in content
function checkAPICall(content, apiName) {
    const patterns = [
        `AdminServices\\.${apiName}\\(`,
        `window\\.AdminServices\\.${apiName}\\(`,
        `apiClient\\.${apiName}\\(`,
        `API\\.${apiName}\\(`
    ];
    
    return patterns.some(pattern => {
        return new RegExp(pattern, 'i').test(content);
    });
}

// Read file safely
function readFile(path) {
    try {
        return fs.readFileSync(path, 'utf-8');
    } catch (error) {
        return '';
    }
}

console.log('\n📄 Checking each page...\n');

let totalPages = 0;
let pagesWithAPIs = 0;
let totalAPIs = 0;
let implementedAPIs = 0;

const results = [];

Object.entries(PAGE_API_MAP).forEach(([htmlFile, config]) => {
    totalPages++;
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📄 ${config.name} (${htmlFile})`);
    console.log(`${'='.repeat(80)}`);
    
    const htmlPath = `views/${htmlFile}`;
    const jsFiles = getJSFiles(htmlPath);
    
    console.log(`\n  📦 JS Files loaded: ${jsFiles.length}`);
    jsFiles.slice(0, 5).forEach(file => {
        console.log(`     - ${file}`);
    });
    if (jsFiles.length > 5) {
        console.log(`     ... and ${jsFiles.length - 5} more`);
    }
    
    // Read all JS content
    let allJSContent = readFile('public/AdminServices.js');
    jsFiles.forEach(jsFile => {
        allJSContent += '\n' + readFile(jsFile);
    });
    
    console.log(`\n  🔍 Checking APIs:`);
    
    const pageAPIs = {
        found: [],
        missing: []
    };
    
    config.apis.forEach(apiName => {
        totalAPIs++;
        if (checkAPICall(allJSContent, apiName)) {
            console.log(`     ✅ ${apiName}`);
            pageAPIs.found.push(apiName);
            implementedAPIs++;
        } else {
            console.log(`     ❌ ${apiName}`);
            pageAPIs.missing.push(apiName);
        }
    });
    
    if (pageAPIs.found.length > 0) {
        pagesWithAPIs++;
    }
    
    const coverage = (pageAPIs.found.length / config.apis.length * 100).toFixed(0);
    console.log(`\n  📊 Coverage: ${pageAPIs.found.length}/${config.apis.length} (${coverage}%)`);
    
    results.push({
        page: config.name,
        file: htmlFile,
        coverage: parseInt(coverage),
        found: pageAPIs.found,
        missing: pageAPIs.missing
    });
});

// Summary
console.log('\n\n' + '='.repeat(80));
console.log('📊 FINAL SUMMARY');
console.log('='.repeat(80));

console.log(`\n📄 Pages:`);
console.log(`  Total pages checked: ${totalPages}`);
console.log(`  Pages with APIs: ${pagesWithAPIs}`);
console.log(`  Pages without APIs: ${totalPages - pagesWithAPIs}`);

console.log(`\n🔌 APIs:`);
console.log(`  Total API calls expected: ${totalAPIs}`);
console.log(`  API calls implemented: ${implementedAPIs}`);
console.log(`  API calls missing: ${totalAPIs - implementedAPIs}`);
console.log(`  Overall coverage: ${(implementedAPIs / totalAPIs * 100).toFixed(2)}%`);

// Group by coverage
const fullyCovered = results.filter(r => r.coverage === 100);
const partiallyCovered = results.filter(r => r.coverage > 0 && r.coverage < 100);
const notCovered = results.filter(r => r.coverage === 0);

console.log(`\n✅ Fully covered (100%): ${fullyCovered.length} pages`);
fullyCovered.forEach(r => {
    console.log(`     - ${r.page} (${r.file})`);
});

if (partiallyCovered.length > 0) {
    console.log(`\n🟡 Partially covered: ${partiallyCovered.length} pages`);
    partiallyCovered.forEach(r => {
        console.log(`     - ${r.page} (${r.file}): ${r.coverage}%`);
        console.log(`       Missing: ${r.missing.join(', ')}`);
    });
}

if (notCovered.length > 0) {
    console.log(`\n❌ Not covered: ${notCovered.length} pages`);
    notCovered.forEach(r => {
        console.log(`     - ${r.page} (${r.file})`);
        console.log(`       Missing: ${r.missing.join(', ')}`);
    });
}

// Save detailed report
const report = {
    timestamp: new Date().toISOString(),
    summary: {
        totalPages,
        pagesWithAPIs,
        totalAPIs,
        implementedAPIs,
        coverage: (implementedAPIs / totalAPIs * 100).toFixed(2) + '%'
    },
    results
};

fs.writeFileSync('API_USAGE_REPORT.json', JSON.stringify(report, null, 2));

console.log('\n\n💾 Detailed report saved to: API_USAGE_REPORT.json');

// Final status
console.log('\n' + '='.repeat(80));
if (implementedAPIs === totalAPIs) {
    console.log('\n🎉 PERFECT! All APIs are being used correctly!');
} else {
    console.log(`\n⚠️  ${totalAPIs - implementedAPIs} API calls need to be implemented.`);
}
console.log('\n' + '='.repeat(80));

