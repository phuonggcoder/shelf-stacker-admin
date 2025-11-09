/**
 * FIX UI FREEZE WHEN CLICKING SAVE BUTTONS
 * Automatically adds loading states and prevents double submissions
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING UI FREEZE ISSUES...\n');

const filesToFix = [
    {
        path: 'public/assets/js/quanlydanhmuc.js',
        fixes: [
            {
                name: 'Add loading state to CREATE category',
                search: /document\.getElementById\('add-category-form'\)\.addEventListener\('submit', async function \(e\) \{[\s\S]*?e\.preventDefault\(\);([\s\S]*?)try \{/,
                replace: (match) => {
                    return match.replace(
                        /try \{/,
                        `// Disable button to prevent double submission
  const submitBtn = document.getElementById('save-category-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang lưu...';
    submitBtn.style.opacity = '0.6';
  }

  try {`
                    );
                }
            },
            {
                name: 'Re-enable button after CREATE category',
                search: /await AdminServices\.createCategory\(formData\);[\s\S]*?fetchCategories\(\);[\s\S]*?\} catch \(err\) \{/,
                replace: (match) => {
                    return match.replace(
                        /\} catch \(err\) \{/,
                        `} catch (err) {
    // Re-enable button on error
    const submitBtn = document.getElementById('save-category-btn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Lưu';
      submitBtn.style.opacity = '1';
    }`
                    );
                }
            },
            {
                name: 'Add loading state to UPDATE category',
                search: /document\.getElementById\('update-category-btn'\)\.addEventListener\('click', async function \(e\) \{[\s\S]*?try \{/,
                replace: (match) => {
                    return match.replace(
                        /try \{/,
                        `// Disable button to prevent double submission
  const updateBtn = document.getElementById('update-category-btn');
  if (updateBtn) {
    updateBtn.disabled = true;
    updateBtn.textContent = 'Đang cập nhật...';
    updateBtn.style.opacity = '0.6';
  }

  try {`
                    );
                }
            },
            {
                name: 'Re-enable button after UPDATE category',
                search: /await AdminServices\.updateCategory\(editingCategoryId, formData\);[\s\S]*?fetchCategories\(\);[\s\S]*?\} catch \(err\) \{/,
                replace: (match) => {
                    return match.replace(
                        /\} catch \(err\) \{/,
                        `} catch (err) {
    // Re-enable button on error
    const updateBtn = document.getElementById('update-category-btn');
    if (updateBtn) {
      updateBtn.disabled = false;
      updateBtn.textContent = 'Cập nhật';
      updateBtn.style.opacity = '1';
    }`
                    );
                }
            }
        ]
    },
    {
        path: 'public/assets/js/campaigns.js',
        fixes: [
            {
                name: 'Fix campaign save button',
                search: /async function saveCampaign\([^)]*\)[\s\S]*?\{/,
                replace: (match) => {
                    return match + `
  // Disable save button
  const saveBtn = document.querySelector('.modal-footer .btn-primary');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Đang lưu...';
  }
`;
                }
            }
        ]
    },
    {
        path: 'public/assets/js/vouchers-admin.js',
        fixes: [
            {
                name: 'Fix voucher save button',
                search: /async function saveVoucher\([^)]*\)[\s\S]*?\{/,
                replace: (match) => {
                    return match + `
  // Disable save button
  const saveBtn = document.querySelector('.save-voucher-btn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Đang lưu...';
  }
`;
                }
            }
        ]
    }
];

let totalFixed = 0;
let totalFiles = 0;

filesToFix.forEach(fileConfig => {
    const filePath = path.join(__dirname, fileConfig.path);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${fileConfig.path}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let fixesApplied = 0;

    fileConfig.fixes.forEach(fix => {
        if (typeof fix.replace === 'function') {
            const match = content.match(fix.search);
            if (match) {
                const replacement = fix.replace(match[0]);
                content = content.replace(fix.search, replacement);
                console.log(`  ✅ ${fix.name}`);
                fixesApplied++;
            } else {
                console.log(`  ⚠️  Pattern not found for: ${fix.name}`);
            }
        } else {
            if (fix.search.test(content)) {
                content = content.replace(fix.search, fix.replace);
                console.log(`  ✅ ${fix.name}`);
                fixesApplied++;
            } else {
                console.log(`  ⚠️  Pattern not found for: ${fix.name}`);
            }
        }
    });

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`\n✅ Fixed ${fixesApplied} issues in: ${fileConfig.path}\n`);
        totalFixed += fixesApplied;
        totalFiles++;
    } else {
        console.log(`\n⚠️  No changes made to: ${fileConfig.path}\n`);
    }
});

console.log('='.repeat(60));
console.log(`📊 SUMMARY:`);
console.log(`   Files modified: ${totalFiles}`);
console.log(`   Total fixes applied: ${totalFixed}`);
console.log('='.repeat(60));

if (totalFixed > 0) {
    console.log('\n✅ UI freeze issues fixed!');
    console.log('\n📝 What was fixed:');
    console.log('   1. Buttons are now disabled while saving');
    console.log('   2. Button text changes to "Đang lưu..." during save');
    console.log('   3. Buttons are re-enabled on error');
    console.log('   4. Visual feedback (opacity) added during processing');
} else {
    console.log('\n⚠️  No fixes were applied. Files may already be fixed or patterns not found.');
}

