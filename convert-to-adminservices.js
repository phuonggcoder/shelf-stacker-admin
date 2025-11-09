/**
 * CONVERT TO ADMINSERVICES
 * Tự động convert các file đang dùng fetch() sang AdminServices
 */

const fs = require('fs');

console.log('🔧 CONVERTING TO ADMINSERVICES\n');
console.log('='.repeat(80));

const CONVERSIONS = [
    {
        file: 'public/assets/js/quanlydanhmuc.js',
        name: 'Quản lý Danh mục',
        conversions: [
            {
                from: /fetch\([^,]+\/api\/categories[^,]*,\s*\{\s*headers:\s*\{\s*['"]Authorization['"]:.*?\}\s*\}\)/g,
                to: 'AdminServices.getCategories()',
                api: 'getCategories'
            },
            {
                from: /fetch\([^,]+\/api\/categories[^,]*,\s*\{\s*method:\s*['"]POST['"],\s*headers:.*?body:.*?\}\)/gs,
                to: 'AdminServices.createCategory(formData)',
                api: 'createCategory'
            },
            {
                from: /fetch\([^,]+\/api\/categories\/\$\{.*?\}[^,]*,\s*\{\s*method:\s*['"]PUT['"],.*?\}\)/gs,
                to: 'AdminServices.updateCategory(categoryId, formData)',
                api: 'updateCategory'
            },
            {
                from: /fetch\([^,]+\/api\/categories\/\$\{.*?\}[^,]*,\s*\{\s*method:\s*['"]DELETE['"].*?\}\)/gs,
                to: 'AdminServices.deleteCategory(categoryId)',
                api: 'deleteCategory'
            }
        ]
    },
    {
        file: 'public/assets/js/campaigns.js',
        name: 'Campaigns',
        conversions: [
            {
                from: /fetch\(apiURL,\s*\{\s*headers:\s*\{\s*['"]Authorization['"]:.*?\}\s*\}\)/g,
                to: 'AdminServices.getCampaigns()',
                api: 'getCampaigns'
            },
            {
                from: /fetch\(apiURL,\s*\{\s*method:\s*['"]POST['"],.*?\}\)/gs,
                to: 'AdminServices.createCampaign(formData)',
                api: 'createCampaign'
            },
            {
                from: /fetch\(`\$\{apiURL\}\/\$\{.*?\}`,\s*\{\s*method:\s*['"]PUT['"],.*?\}\)/gs,
                to: 'AdminServices.updateCampaign(campaignId, formData)',
                api: 'updateCampaign'
            },
            {
                from: /fetch\(`\$\{apiURL\}\/\$\{.*?\}`,\s*\{\s*method:\s*['"]DELETE['"].*?\}\)/gs,
                to: 'AdminServices.deleteCampaign(campaignId)',
                api: 'deleteCampaign'
            }
        ]
    },
    {
        file: 'public/assets/js/notification-admin.js',
        name: 'Notification Admin',
        conversions: [
            {
                from: /fetch\([^,]+\/api\/v1\/admin\/notification-templates[^,]*,\s*\{\s*headers:.*?\}\)/g,
                to: 'AdminServices.getNotificationTemplates()',
                api: 'getNotificationTemplates'
            },
            {
                from: /fetch\([^,]+\/api\/v1\/admin\/instant-notifications\/send[^,]*,\s*\{\s*method:\s*['"]POST['"].*?\}\)/gs,
                to: 'AdminServices.sendInstantNotification(data)',
                api: 'sendInstantNotification'
            },
            {
                from: /fetch\([^,]+\/api\/v1\/admin\/recipients\/users[^,]*,\s*\{\s*headers:.*?\}\)/g,
                to: 'AdminServices.getRecipientsUsers()',
                api: 'getRecipientsUsers'
            }
        ]
    }
];

let totalConverted = 0;

CONVERSIONS.forEach(fileConfig => {
    console.log(`\n📄 ${fileConfig.name} (${fileConfig.file})`);
    
    try {
        let content = fs.readFileSync(fileConfig.file, 'utf-8');
        let converted = 0;
        
        // Add AdminServices check at the beginning if not present
        if (!content.includes('AdminServices')) {
            console.log('  ℹ️  Adding AdminServices availability check...');
            const checkCode = `
// Wait for AdminServices to be available
function waitForAdminServices(maxWait = 5000) {
    return new Promise((resolve, reject) => {
        if (window.AdminServices) {
            resolve(window.AdminServices);
            return;
        }
        
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (window.AdminServices) {
                clearInterval(checkInterval);
                resolve(window.AdminServices);
            } else if (Date.now() - startTime > maxWait) {
                clearInterval(checkInterval);
                reject(new Error('AdminServices not available'));
            }
        }, 100);
    });
}

// Initialize after AdminServices is ready
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await waitForAdminServices();
        console.log('✅ AdminServices ready');
        // Original initialization code will run here
    } catch (error) {
        console.error('❌ AdminServices not available:', error);
    }
});
`;
            content = checkCode + '\n' + content;
        }
        
        // Apply each conversion
        fileConfig.conversions.forEach(conv => {
            const matches = content.match(conv.from) || [];
            if (matches.length > 0) {
                // For now, just add a comment to guide manual conversion
                // Actual conversion would need more context-aware replacements
                console.log(`  ⚠️  Found ${matches.length} instance(s) of ${conv.api} - needs manual review`);
                converted += matches.length;
            }
        });
        
        if (converted > 0) {
            console.log(`  ℹ️  Total: ${converted} patterns found`);
            totalConverted += converted;
        } else {
            console.log(`  ✅ No changes needed or already converted`);
        }
        
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
    }
});

console.log('\n' + '='.repeat(80));
console.log(`\n📊 SUMMARY: Found ${totalConverted} patterns that need conversion\n`);

// Instead of auto-converting (which might break things), let's create new versions
console.log('Creating example converted versions...\n');

// Example for quanlydanhmuc.js
const quanlydanhmucConverted = `
// CONVERTED TO USE ADMINSERVICES
// Đảm bảo AdminServices đã được load trong HTML trước file này

let categories = [];
let catCurrentPage = 1;
const catPageSize = 6;
let editingCategoryId = null;

// Load categories using AdminServices
async function loadCategories() {
    try {
        const response = await AdminServices.getCategories();
        categories = Array.isArray(response) ? response : [];
        renderCategoriesWithPagination(categories, catCurrentPage);
    } catch (error) {
        console.error('❌ Lỗi tải danh mục:', error);
        showToast('Không thể tải danh mục: ' + error.message, 'error');
    }
}

// Create category using AdminServices
async function createCategory(formData) {
    try {
        const result = await AdminServices.createCategory(formData);
        showToast('Tạo danh mục thành công!', 'success');
        await loadCategories();
        return result;
    } catch (error) {
        console.error('❌ Lỗi tạo danh mục:', error);
        showToast('Không thể tạo danh mục: ' + error.message, 'error');
        throw error;
    }
}

// Update category using AdminServices
async function updateCategory(categoryId, formData) {
    try {
        const result = await AdminServices.updateCategory(categoryId, formData);
        showToast('Cập nhật danh mục thành công!', 'success');
        await loadCategories();
        return result;
    } catch (error) {
        console.error('❌ Lỗi cập nhật danh mục:', error);
        showToast('Không thể cập nhật danh mục: ' + error.message, 'error');
        throw error;
    }
}

// Delete category using AdminServices
async function deleteCategory(categoryId) {
    if (!confirm('Bạn có chắc muốn xóa danh mục này?')) {
        return;
    }
    
    try {
        await AdminServices.deleteCategory(categoryId);
        showToast('Xóa danh mục thành công!', 'success');
        await loadCategories();
    } catch (error) {
        console.error('❌ Lỗi xóa danh mục:', error);
        showToast('Không thể xóa danh mục: ' + error.message, 'error');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Wait for AdminServices
        if (!window.AdminServices) {
            await new Promise((resolve, reject) => {
                let count = 0;
                const interval = setInterval(() => {
                    if (window.AdminServices) {
                        clearInterval(interval);
                        resolve();
                    }
                    if (count++ > 50) {
                        clearInterval(interval);
                        reject(new Error('AdminServices not available'));
                    }
                }, 100);
            });
        }
        
        console.log('✅ AdminServices available');
        await loadCategories();
        
    } catch (error) {
        console.error('❌ Initialization error:', error);
        showToast('Không thể khởi tạo trang', 'error');
    }
});
`;

fs.writeFileSync('EXAMPLE_quanlydanhmuc_converted.js', quanlydanhmucConverted);
console.log('✅ Created: EXAMPLE_quanlydanhmuc_converted.js');

// Example for campaigns.js
const campaignsConverted = `
// CONVERTED TO USE ADMINSERVICES
// Đảm bảo AdminServices đã được load trong HTML trước file này

const tableBody = document.getElementById('campaign-table-body');
let editingId = null;

// Load campaigns using AdminServices
async function loadCampaigns() {
    try {
        const campaigns = await AdminServices.getCampaigns();
        renderCampaigns(campaigns);
    } catch (error) {
        console.error('❌ Lỗi tải chiến dịch:', error);
        showToast('Không thể tải chiến dịch: ' + error.message, 'error');
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Lỗi tải dữ liệu</td></tr>';
    }
}

// Create campaign using AdminServices
async function createCampaign(formData) {
    try {
        const result = await AdminServices.createCampaign(formData);
        showToast('Tạo chiến dịch thành công!', 'success');
        await loadCampaigns();
        return result;
    } catch (error) {
        console.error('❌ Lỗi tạo chiến dịch:', error);
        showToast('Không thể tạo chiến dịch: ' + error.message, 'error');
        throw error;
    }
}

// Update campaign using AdminServices
async function updateCampaign(campaignId, formData) {
    try {
        const result = await AdminServices.updateCampaign(campaignId, formData);
        showToast('Cập nhật chiến dịch thành công!', 'success');
        await loadCampaigns();
        return result;
    } catch (error) {
        console.error('❌ Lỗi cập nhật chiến dịch:', error);
        showToast('Không thể cập nhật chiến dịch: ' + error.message, 'error');
        throw error;
    }
}

// Delete campaign using AdminServices
async function deleteCampaign(campaignId) {
    if (!confirm('Bạn có chắc muốn xóa chiến dịch này?')) {
        return;
    }
    
    try {
        await AdminServices.deleteCampaign(campaignId);
        showToast('Xóa chiến dịch thành công!', 'success');
        await loadCampaigns();
    } catch (error) {
        console.error('❌ Lỗi xóa chiến dịch:', error);
        showToast('Không thể xóa chiến dịch: ' + error.message, 'error');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Wait for AdminServices
        if (!window.AdminServices) {
            await new Promise((resolve, reject) => {
                let count = 0;
                const interval = setInterval(() => {
                    if (window.AdminServices) {
                        clearInterval(interval);
                        resolve();
                    }
                    if (count++ > 50) {
                        clearInterval(interval);
                        reject(new Error('AdminServices not available'));
                    }
                }, 100);
            });
        }
        
        console.log('✅ AdminServices available');
        await loadCampaigns();
        
    } catch (error) {
        console.error('❌ Initialization error:', error);
        showToast('Không thể khởi tạo trang', 'error');
    }
});
`;

fs.writeFileSync('EXAMPLE_campaigns_converted.js', campaignsConverted);
console.log('✅ Created: EXAMPLE_campaigns_converted.js');

console.log('\n' + '='.repeat(80));
console.log('\n📋 ACTION REQUIRED:\n');
console.log('The files need manual review and update because they have complex logic.');
console.log('I\'ve created example converted versions for reference:');
console.log('  - EXAMPLE_quanlydanhmuc_converted.js');
console.log('  - EXAMPLE_campaigns_converted.js');
console.log('\nKey changes needed:');
console.log('  1. Replace fetch() calls with AdminServices methods');
console.log('  2. Add async/await error handling');
console.log('  3. Add success/error messages with showToast()');
console.log('  4. Ensure AdminServices is loaded before using');
console.log('\n' + '='.repeat(80));

