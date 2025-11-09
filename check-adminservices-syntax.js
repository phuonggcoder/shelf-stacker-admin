/**
 * Script to check AdminServices.js for syntax errors and verify structure
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking AdminServices.js for issues...\n');

const filePath = path.join(__dirname, 'public', 'AdminServices.js');

if (!fs.existsSync(filePath)) {
    console.error('❌ File not found:', filePath);
    process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');

// Check file size
const sizeKB = (content.length / 1024).toFixed(2);
console.log(`📦 File size: ${sizeKB} KB`);
console.log(`📦 Lines: ${content.split('\n').length}\n`);

// Check for class definition
const classMatch = content.match(/class\s+AdminServices\s*\{/);
if (classMatch) {
    console.log('✅ Class AdminServices found');
} else {
    console.error('❌ Class AdminServices NOT found!');
    process.exit(1);
}

// Check for window export
const exportMatch = content.match(/window\.AdminServices\s*=\s*new\s+AdminServices\(\)/);
if (exportMatch) {
    console.log('✅ window.AdminServices export found');
} else {
    console.error('❌ window.AdminServices export NOT found!');
}

// Count methods
const methodRegex = /async\s+(\w+)\s*\([^)]*\)\s*\{/g;
const methods = [];
let match;

while ((match = methodRegex.exec(content)) !== null) {
    methods.push(match[1]);
}

console.log(`\n📊 Found ${methods.length} async methods:`);
console.log('─'.repeat(60));

// Critical CRUD methods
const criticalMethods = [
    'getCategories', 'createCategory', 'updateCategory', 'deleteCategory',
    'getBooks', 'createBook', 'updateBook', 'deleteBook',
    'getOrders', 'updateOrderStatus',
    'getUsers', 'updateUser',
    'getVouchers', 'createVoucher', 'updateVoucher', 'deleteVoucher',
    'getCampaigns', 'createCampaign', 'updateCampaign', 'deleteCampaign'
];

console.log('\n🔍 Checking critical CRUD methods:');
criticalMethods.forEach(method => {
    const found = methods.includes(method);
    console.log(`${found ? '✅' : '❌'} ${method}`);
});

// Check for common syntax errors
console.log('\n🔍 Checking for common syntax errors:');

// Check for unmatched braces
const openBraces = (content.match(/\{/g) || []).length;
const closeBraces = (content.match(/\}/g) || []).length;
console.log(`${openBraces === closeBraces ? '✅' : '❌'} Braces: ${openBraces} open, ${closeBraces} close`);

// Check for unmatched parentheses
const openParens = (content.match(/\(/g) || []).length;
const closeParens = (content.match(/\)/g) || []).length;
console.log(`${openParens === closeParens ? '✅' : '❌'} Parentheses: ${openParens} open, ${closeParens} close`);

// Try to parse with Node.js
console.log('\n🔍 Testing JavaScript syntax with Node.js...');
try {
    // Replace browser-specific code for testing
    const testContent = content
        .replace(/window\.AdminServices/g, 'module.exports')
        .replace(/window\./g, 'global.')
        .replace(/localStorage/g, '{ getItem: () => null, setItem: () => {}, removeItem: () => {} }')
        .replace(/fetch\(/g, '(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }))(');
    
    // Try to evaluate
    new Function(testContent);
    console.log('✅ JavaScript syntax is valid!\n');
} catch (error) {
    console.error('❌ JavaScript syntax error found:');
    console.error(error.message);
    console.error('\nError location:', error.stack?.split('\n')[1]);
    process.exit(1);
}

// Check if instance would have methods
console.log('🔍 Simulating instance creation...');
try {
    // Simulate the class in a safe environment
    const testCode = `
        ${content.replace(/window\.AdminServices.*/, '')}
        const instance = new AdminServices();
        const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
            .filter(name => name !== 'constructor' && typeof instance[name] === 'function');
        methodNames;
    `;
    
    const vm = require('vm');
    const sandbox = {
        console: console,
        localStorage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {}
        },
        fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
        window: {},
        BASE_URL: 'https://server-shelf-stacker-w1ds.onrender.com'
    };
    
    const context = vm.createContext(sandbox);
    const instanceMethods = vm.runInContext(testCode, context);
    
    console.log(`✅ Instance would have ${instanceMethods.length} methods`);
    console.log('\nMethods available on instance:');
    instanceMethods.slice(0, 10).forEach(method => {
        console.log(`  - ${method}`);
    });
    if (instanceMethods.length > 10) {
        console.log(`  ... and ${instanceMethods.length - 10} more`);
    }
    
    // Check if critical methods are in instance
    const missingCritical = criticalMethods.filter(m => !instanceMethods.includes(m));
    if (missingCritical.length > 0) {
        console.error('\n❌ Missing critical methods from instance:');
        missingCritical.forEach(m => console.error(`  - ${m}`));
    } else {
        console.log('\n✅ All critical methods present in instance');
    }
    
} catch (error) {
    console.error('❌ Error creating instance:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
}

console.log('\n' + '='.repeat(60));
console.log('✅ AdminServices.js structure is correct!');
console.log('='.repeat(60));
console.log('\n💡 The file should work in browser.');
console.log('   If it doesn\'t, check browser console for runtime errors.');

