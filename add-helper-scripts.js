/**
 * AUTO ADD HELPER SCRIPTS TO ALL PAGES
 * Thêm global-error-handler.js và retry-helper.js vào tất cả pages
 */

const fs = require('fs');
const path = require('path');

const HELPER_SCRIPTS = [
    '/assets/js/global-error-handler.js',
    '/assets/js/retry-helper.js'
];

const HTML_FILES = [
    'views/home.html',
    'views/categories.html',
    'views/vouchers.html',
    'views/settings.html',
    'views/products.html',
    'views/orders.html',
    'views/users.html',
    'views/reports.html',
    'views/notifications.html',
    'views/voucher-management.html',
    'views/notification-admin.html',
    'views/quanlynguoidung.html',
    'views/thongbao.html',
    'views/trashbooks.html',
    'views/voucher-new.html',
    'views/campaigns.html',
    'views/quanlydanhmuc.html',
    'views/danhmucdonhang.html',
    'views/danhgiasanpham.html',
    'views/order-stats.html'
];

console.log('🔧 ADDING HELPER SCRIPTS TO ALL PAGES\n');
console.log('='.repeat(80));
console.log('\nHelper scripts to add:');
HELPER_SCRIPTS.forEach(script => console.log(`  - ${script}`));
console.log('\n' + '='.repeat(80) + '\n');

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

HTML_FILES.forEach(filePath => {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`  ⚠️  Skip: ${filePath} (not found)`);
            skipCount++;
            return;
        }

        let content = fs.readFileSync(filePath, 'utf-8');
        const fileName = path.basename(filePath);
        
        // Check if already has the scripts
        if (content.includes('global-error-handler.js') && content.includes('retry-helper.js')) {
            console.log(`  ℹ️  Skip: ${fileName} (already has scripts)`);
            skipCount++;
            return;
        }

        let modified = false;

        // Find where AdminServices.js is loaded
        const adminServicesPattern = /<script\s+src=["']\/AdminServices\.js["']><\/script>/;
        
        if (adminServicesPattern.test(content)) {
            // Add after AdminServices.js
            HELPER_SCRIPTS.forEach(script => {
                if (!content.includes(script)) {
                    content = content.replace(
                        adminServicesPattern,
                        `$&\n    <script src="${script}"></script>`
                    );
                    modified = true;
                }
            });
        } else {
            // Try to find any script tag and add before it
            const anyScriptPattern = /<script\s+src=["'][^"']+["']><\/script>/;
            
            if (anyScriptPattern.test(content)) {
                const scriptsToAdd = HELPER_SCRIPTS
                    .filter(script => !content.includes(script))
                    .map(script => `    <script src="${script}"></script>`)
                    .join('\n');
                
                if (scriptsToAdd) {
                    content = content.replace(
                        anyScriptPattern,
                        `${scriptsToAdd}\n    $&`
                    );
                    modified = true;
                }
            } else {
                // Last resort: add before </body>
                const bodyClosePattern = /<\/body>/;
                
                if (bodyClosePattern.test(content)) {
                    const scriptsToAdd = HELPER_SCRIPTS
                        .filter(script => !content.includes(script))
                        .map(script => `    <script src="${script}"></script>`)
                        .join('\n');
                    
                    if (scriptsToAdd) {
                        content = content.replace(
                            bodyClosePattern,
                            `${scriptsToAdd}\n  </body>`
                        );
                        modified = true;
                    }
                }
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`  ✅ Updated: ${fileName}`);
            successCount++;
        } else {
            console.log(`  ℹ️  Skip: ${fileName} (no change needed)`);
            skipCount++;
        }

    } catch (error) {
        console.log(`  ❌ Error: ${path.basename(filePath)} - ${error.message}`);
        errorCount++;
    }
});

console.log('\n' + '='.repeat(80));
console.log('\n📊 SUMMARY\n');
console.log(`✅ Updated: ${successCount} files`);
console.log(`ℹ️  Skipped: ${skipCount} files`);
console.log(`❌ Errors: ${errorCount} files`);

if (successCount > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('\n🎉 SUCCESS! Helper scripts added to all pages.\n');
    console.log('Next steps:');
    console.log('  1. Restart your development server');
    console.log('  2. Clear browser cache (Ctrl+Shift+Delete)');
    console.log('  3. Test the application');
    console.log('  4. Check browser console for global error handler message');
    console.log('\n' + '='.repeat(80));
}

