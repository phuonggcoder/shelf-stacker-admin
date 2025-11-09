/**
 * Find all save/update buttons that need loading states
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 SCANNING FOR SAVE/UPDATE BUTTONS...\n');

const jsDir = path.join(__dirname, 'public', 'assets', 'js');
const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));

const results = [];

files.forEach(file => {
    const filePath = path.join(jsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const found = [];
    
    // Pattern 1: addEventListener('click', async function
    const clickPattern = /addEventListener\(['"]click['"],\s*async\s+function/g;
    // Pattern 2: addEventListener('submit', async function
    const submitPattern = /addEventListener\(['"]submit['"],\s*async\s*(?:function|\()/g;
    // Pattern 3: async function save/update/create/delete
    const asyncFuncPattern = /async\s+function\s+(save|update|create|delete|add|edit|handle\w+Save|handle\w+Update)/gi;
    
    let match;
    
    // Find click handlers
    let idx = 0;
    while ((match = clickPattern.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        const contextStart = Math.max(0, match.index - 200);
        const contextEnd = Math.min(content.length, match.index + 500);
        const context = content.substring(contextStart, contextEnd);
        
        // Check if it has button/save/update
        if (context.match(/(save|update|lưu|cập\s*nhật|thêm)/i)) {
            // Check if already has .disabled or loading state
            if (!context.match(/\.disabled\s*=\s*true/)) {
                found.push({
                    line: lineNum,
                    type: 'click handler',
                    snippet: lines.slice(lineNum - 1, lineNum + 5).join('\n')
                });
            }
        }
    }
    
    // Find submit handlers
    while ((match = submitPattern.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        const contextStart = Math.max(0, match.index - 100);
        const contextEnd = Math.min(content.length, match.index + 500);
        const context = content.substring(contextStart, contextEnd);
        
        // Check if already has loading state
        if (!context.match(/\.disabled\s*=\s*true/)) {
            found.push({
                line: lineNum,
                type: 'submit handler',
                snippet: lines.slice(lineNum - 1, lineNum + 5).join('\n')
            });
        }
    }
    
    if (found.length > 0) {
        results.push({
            file: file,
            issues: found
        });
    }
});

console.log('='.repeat(60));
console.log('📊 SCAN RESULTS\n');

if (results.length === 0) {
    console.log('✅ No issues found! All save buttons have loading states.\n');
} else {
    console.log(`⚠️  Found ${results.length} files with potential issues:\n`);
    
    results.forEach(result => {
        console.log(`\n📄 ${result.file}`);
        console.log('-'.repeat(60));
        result.issues.forEach((issue, idx) => {
            console.log(`\n  Issue ${idx + 1}: Line ${issue.line} (${issue.type})`);
            console.log(`  Snippet:`);
            console.log(`    ${issue.snippet.split('\n').slice(0, 3).join('\n    ')}`);
        });
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`\n⚠️  TOTAL: ${results.reduce((sum, r) => sum + r.issues.length, 0)} potential issues found`);
    console.log('\n💡 Recommendation: Add loading states to these handlers');
    console.log('   - Disable button before async operation');
    console.log('   - Change button text to "Đang lưu..." or "Đang cập nhật..."');
    console.log('   - Re-enable in finally block');
}

console.log('\n' + '='.repeat(60));

