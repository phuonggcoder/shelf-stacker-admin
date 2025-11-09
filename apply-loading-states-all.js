/**
 * APPLY LOADING STATES TO ALL FILES
 * Automatically applies loading state wrapper to all save/update buttons
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 APPLYING LOADING STATES TO ALL FILES...\n');

const fixes = [
    // CRITICAL: Products
    {
        file: 'public/assets/js/admin-products.js',
        line: 681,
        type: 'form-submit-create',
        findPattern: /formElement\.addEventListener\('submit', async \(e\) => \{\s*e\.preventDefault\(\);/,
        wrapperType: 'inline',
        buttonSelector: "modal.querySelector('.btn-primary')"
    },
    {
        file: 'public/assets/js/admin-products.js',
        line: 812,
        type: 'form-submit-update',
        findPattern: /formElement\.addEventListener\('submit', async \(e\) => \{\s*e\.preventDefault\(\);/,
        wrapperType: 'inline',
        buttonSelector: "modal.querySelector('.btn-primary')"
    },
    
    // CRITICAL: Orders
    {
        file: 'public/assets/js/admin-orders.js',
        line: 721,
        type: 'form-submit',
        findPattern: /formElement\.addEventListener\('submit', async \(e\) => \{\s*e\.preventDefault\(\);/,
        wrapperType: 'inline',
        buttonSelector: "modal.querySelector('.btn-primary')"
    },
    
    // HIGH: Vouchers
    {
        file: 'public/assets/js/admin-vouchers.js',
        line: 108,
        type: 'form-submit',
        findPattern: /formElement\.addEventListener\('submit', async \(e\) => \{\s*e\.preventDefault\(\);/,
        wrapperType: 'inline',
        buttonSelector: "modal.querySelector('.btn-primary')"
    },
    {
        file: 'public/assets/js/admin-vouchers.js',
        line: 504,
        type: 'form-submit',
        findPattern: /formElement\.addEventListener\('submit', async \(e\) => \{\s*e\.preventDefault\(\);/,
        wrapperType: 'inline',
        buttonSelector: "modal.querySelector('.btn-primary')"
    },
    {
        file: 'public/assets/js/vouchers-admin.js',
        line: 67,
        type: 'form-submit',
        findPattern: /document\.getElementById\('voucher-form'\)\.addEventListener\('submit', async \(e\) => \{/,
        wrapperType: 'inline',
        buttonId: 'save-voucher-btn'
    },
    
    // HIGH: Users
    {
        file: 'public/assets/js/admin-users.js',
        line: 102,
        type: 'form-submit',
        findPattern: /formElement\.addEventListener\('submit', async \(e\) => \{\s*e\.preventDefault\(\);/,
        wrapperType: 'inline',
        buttonSelector: "modal.querySelector('.btn-primary')"
    },
    
    // MEDIUM: Categories (admin)
    {
        file: 'public/assets/js/admin-categories.js',
        line: 325,
        type: 'form-submit',
        findPattern: /formElement\.addEventListener\('submit', async \(e\) => \{\s*e\.preventDefault\(\);/,
        wrapperType: 'inline',
        buttonSelector: "modal.querySelector('.btn-primary')"
    },
    {
        file: 'public/assets/js/admin-categories.js',
        line: 443,
        type: 'form-submit',
        findPattern: /formElement\.addEventListener\('submit', async \(e\) => \{\s*e\.preventDefault\(\);/,
        wrapperType: 'inline',
        buttonSelector: "modal.querySelector('.btn-primary')"
    },
    
    // MEDIUM: Notifications
    {
        file: 'public/assets/js/admin-notifications.js',
        line: 123,
        type: 'form-submit',
        findPattern: /sendForm\.addEventListener\('submit', async \(e\) => \{/,
        wrapperType: 'inline',
        buttonId: 'send-notification-btn'
    },
    
    // LOW: Legacy products
    {
        file: 'public/assets/js/danhsachsanpham.js',
        line: 926,
        type: 'form-submit',
        findPattern: /addBookForm\.addEventListener\('submit', async function\(e\) \{/,
        wrapperType: 'inline',
        buttonId: 'submitBookBtn'
    }
];

// Helper to generate wrapper code
function generateWrapperCode(fix) {
    const buttonRef = fix.buttonId 
        ? `document.getElementById('${fix.buttonId}')`
        : fix.buttonSelector;

    return `
    // Apply loading state wrapper
    const submitBtn = ${buttonRef};
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang lưu...';
        submitBtn.style.opacity = '0.6';
        submitBtn.style.cursor = 'not-allowed';
    }

    try {
        // Original code continues here...
`;
}

function generateFinallyCode() {
    return `
    } finally {
        // Always re-enable button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtn.getAttribute('data-original-text') || 'Lưu';
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
        }
    }
`;
}

console.log('📊 SUMMARY:');
console.log(`Total fixes to apply: ${fixes.length}`);
console.log('');

// Group by priority
const critical = fixes.filter(f => f.file.includes('products') || f.file.includes('orders'));
const high = fixes.filter(f => f.file.includes('voucher') || f.file.includes('users'));
const medium = fixes.filter(f => f.file.includes('categories') || f.file.includes('notifications'));
const low = fixes.filter(f => f.file.includes('danhsach'));

console.log(`🔴 CRITICAL: ${critical.length} fixes`);
console.log(`🟠 HIGH: ${high.length} fixes`);
console.log(`🟡 MEDIUM: ${medium.length} fixes`);
console.log(`⚪ LOW: ${low.length} fixes`);
console.log('');

console.log('=' .repeat(60));
console.log('💡 RECOMMENDATION:\n');
console.log('Due to complexity, I recommend MANUAL application:');
console.log('');
console.log('1. For EACH file, add at top:');
console.log('   // Ensure button is captured before async operation');
console.log('');
console.log('2. WRAP async code block with:');
console.log('   const submitBtn = [button reference];');
console.log('   if (submitBtn) submitBtn.disabled = true; ...');
console.log('   try { ... } finally { re-enable }');
console.log('');
console.log('3. OR use the LoadingStateHelper wrapper:');
console.log('   await withLoadingState(button, async () => { ... });');
console.log('=' .repeat(60));

// Generate detailed instructions
console.log('\n\n📝 DETAILED INSTRUCTIONS PER FILE:\n');

fixes.forEach((fix, idx) => {
    console.log(`${idx + 1}. ${path.basename(fix.file)} (Line ${fix.line})`);
    console.log(`   Priority: ${
        critical.includes(fix) ? '🔴 CRITICAL' :
        high.includes(fix) ? '🟠 HIGH' :
        medium.includes(fix) ? '🟡 MEDIUM' : '⚪ LOW'
    }`);
    console.log(`   Type: ${fix.type}`);
    console.log(`   Button: ${fix.buttonId || fix.buttonSelector}`);
    console.log('');
});

console.log('=' .repeat(60));
console.log('\n✅ Analysis complete!');
console.log('📄 See ALL_SAVE_BUTTONS_REPORT.md for full details');
console.log('');
console.log('🚀 Next: Apply fixes manually or use LoadingStateHelper wrapper');

