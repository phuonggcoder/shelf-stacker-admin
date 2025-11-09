/**
 * DETAILED UX CHECKER
 * Kiểm tra chi tiết các vấn đề UX/UI nhỏ hơn
 */

const fs = require('fs');

const JS_FILES = [
    'public/assets/js/admin-dashboard.js',
    'public/assets/js/admin-products.js',
    'public/assets/js/admin-orders.js',
    'public/assets/js/admin-users.js',
    'public/assets/js/admin-categories.js',
    'public/assets/js/admin-vouchers.js',
    'public/assets/js/admin-notifications.js',
    'public/assets/js/admin-settings.js',
    'public/assets/js/admin-reports.js',
    'public/assets/js/campaigns.js'
];

class DetailedUXChecker {
    constructor() {
        this.issues = [];
        this.recommendations = [];
    }

    readFile(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf-8');
        } catch (error) {
            return null;
        }
    }

    checkFile(filePath) {
        const content = this.readFile(filePath);
        if (!content) return;

        const fileName = filePath.split('/').pop();
        console.log(`\n🔍 Checking: ${fileName}`);

        const fileIssues = [];
        const fileRecs = [];

        // 1. Console.log trong production
        const consoleLogs = (content.match(/console\.log\(/g) || []).length;
        if (consoleLogs > 5) {
            fileIssues.push(`Too many console.log (${consoleLogs}) - should be removed in production`);
        }

        // 2. Empty catch blocks
        const emptyCatchPattern = /catch\s*\([^)]*\)\s*\{\s*\}/g;
        const emptyCatches = (content.match(emptyCatchPattern) || []).length;
        if (emptyCatches > 0) {
            fileIssues.push(`${emptyCatches} empty catch block(s) - should handle errors properly`);
        }

        // 3. Hardcoded strings (should use i18n or constants)
        const hardcodedErrors = [
            /showToast\(['"].*?['"],\s*['"]error['"]\)/g,
            /alert\(['"].*?['"]\)/g
        ];
        let hardcodedCount = 0;
        hardcodedErrors.forEach(pattern => {
            const matches = content.match(pattern) || [];
            hardcodedCount += matches.length;
        });
        if (hardcodedCount > 10) {
            fileRecs.push(`Many hardcoded error messages (${hardcodedCount}) - consider using message constants`);
        }

        // 4. Missing loading indicators
        const apiCalls = (content.match(/AdminServices\./g) || []).length;
        const loadingCalls = (content.match(/showLoading|loading|spinner/gi) || []).length;
        if (apiCalls > 0 && loadingCalls === 0) {
            fileIssues.push(`No loading indicators despite ${apiCalls} API calls`);
        } else if (apiCalls > loadingCalls * 2) {
            fileRecs.push(`Few loading indicators (${loadingCalls}) for ${apiCalls} API calls`);
        }

        // 5. Missing try-catch
        const asyncFunctions = (content.match(/async\s+function\s+\w+/g) || []).length;
        const tryCatchBlocks = (content.match(/try\s*\{/g) || []).length;
        if (asyncFunctions > tryCatchBlocks + 2) {
            fileIssues.push(`Some async functions (${asyncFunctions}) may lack try-catch (${tryCatchBlocks})`);
        }

        // 6. Missing return statements in promise chains
        const promiseChains = content.match(/\.then\s*\([^)]*\)\s*\{[^}]*\}/g) || [];
        let missingReturns = 0;
        promiseChains.forEach(chain => {
            if (!chain.includes('return') && chain.length > 50) {
                missingReturns++;
            }
        });
        if (missingReturns > 0) {
            fileRecs.push(`${missingReturns} promise chain(s) might be missing return statements`);
        }

        // 7. No debounce for search
        if (content.includes('search') || content.includes('filter')) {
            if (!content.includes('debounce') && !content.includes('setTimeout') && !content.includes('searchTimeout')) {
                fileRecs.push('Search/filter without debounce - may cause performance issues');
            }
        }

        // 8. Missing pagination reset on filter
        if (content.includes('filter') || content.includes('search')) {
            if (!content.includes('currentPage = 1') && !content.includes('page = 1')) {
                fileRecs.push('Filter/search should reset pagination to page 1');
            }
        }

        // 9. No confirmation for delete actions
        if (content.includes('delete') || content.includes('Delete')) {
            if (!content.includes('confirm') && !content.includes('showConfirmDialog')) {
                fileRecs.push('Delete actions should have confirmation dialog');
            }
        }

        // 10. Missing success messages
        const updateCalls = (content.match(/update|create|delete/gi) || []).length;
        const successMessages = (content.match(/showToast.*success|showSuccess/gi) || []).length;
        if (updateCalls > 0 && successMessages < updateCalls * 0.3) {
            fileRecs.push(`Few success messages (${successMessages}) for ${updateCalls} CRUD operations`);
        }

        // 11. No input validation
        if (content.includes('form') || content.includes('submit')) {
            if (!content.includes('validate') && !content.includes('required') && !content.includes('trim()')) {
                fileRecs.push('Form submission without validation');
            }
        }

        // 12. Memory leaks - missing event listener cleanup
        if (content.includes('addEventListener')) {
            if (!content.includes('removeEventListener') && !content.includes('AbortController')) {
                fileRecs.push('Event listeners without cleanup - may cause memory leaks');
            }
        }

        // 13. No error boundary
        if (apiCalls > 5 && !content.includes('window.onerror') && !content.includes('ErrorBoundary')) {
            fileRecs.push('Many API calls but no global error handling');
        }

        // 14. Accessibility issues
        if (!content.includes('aria-') && !content.includes('role=')) {
            fileRecs.push('No ARIA attributes - may have accessibility issues');
        }

        // 15. No retry logic for failed requests
        if (apiCalls > 0 && !content.includes('retry') && !content.includes('RefreshToken')) {
            fileRecs.push('No retry logic for failed API requests');
        }

        if (fileIssues.length > 0) {
            console.log('  ❌ Issues:');
            fileIssues.forEach(issue => {
                console.log(`     - ${issue}`);
                this.issues.push({ file: fileName, issue });
            });
        }

        if (fileRecs.length > 0) {
            console.log('  💡 Recommendations:');
            fileRecs.forEach(rec => {
                console.log(`     - ${rec}`);
                this.recommendations.push({ file: fileName, recommendation: rec });
            });
        }

        if (fileIssues.length === 0 && fileRecs.length === 0) {
            console.log('  ✅ Looks good!');
        }
    }

    checkAll() {
        console.log('🔍 DETAILED UX/UI CHECK\n');
        console.log('='.repeat(80));

        JS_FILES.forEach(file => {
            this.checkFile(file);
        });

        this.printSummary();
        this.saveReport();
    }

    printSummary() {
        console.log('\n\n' + '='.repeat(80));
        console.log('📊 SUMMARY');
        console.log('='.repeat(80));

        console.log(`\n❌ Total Issues: ${this.issues.length}`);
        console.log(`💡 Total Recommendations: ${this.recommendations.length}`);

        if (this.issues.length > 0) {
            // Group issues by type
            const issueTypes = {};
            this.issues.forEach(({ issue }) => {
                const type = issue.split(' - ')[0];
                issueTypes[type] = (issueTypes[type] || 0) + 1;
            });

            console.log('\n\n❌ TOP ISSUES:');
            Object.entries(issueTypes)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .forEach(([type, count]) => {
                    console.log(`  ${count}x ${type}`);
                });
        }

        if (this.recommendations.length > 0) {
            // Group recommendations by type
            const recTypes = {};
            this.recommendations.forEach(({ recommendation }) => {
                const type = recommendation.split(' - ')[0];
                recTypes[type] = (recTypes[type] || 0) + 1;
            });

            console.log('\n\n💡 TOP RECOMMENDATIONS:');
            Object.entries(recTypes)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .forEach(([type, count]) => {
                    console.log(`  ${count}x ${type}`);
                });
        }

        // Priority recommendations
        console.log('\n\n🎯 HIGH PRIORITY FIXES:');
        const highPriority = [
            'empty catch block',
            'No loading indicators',
            'async functions.*lack try-catch',
            'Delete actions should have confirmation'
        ];

        let foundHighPriority = false;
        this.issues.forEach(({ file, issue }) => {
            if (highPriority.some(pattern => new RegExp(pattern, 'i').test(issue))) {
                console.log(`  - [${file}] ${issue}`);
                foundHighPriority = true;
            }
        });

        if (!foundHighPriority) {
            console.log('  ✅ None - all critical issues are handled!');
        }

        // Overall score
        const totalChecks = JS_FILES.length * 15; // 15 checks per file
        const issuesWeight = this.issues.length * 2;
        const recsWeight = this.recommendations.length;
        const score = Math.max(0, 100 - (issuesWeight + recsWeight) / totalChecks * 100);

        console.log('\n\n📊 OVERALL UX SCORE:');
        console.log(`  ${score.toFixed(2)}/100`);
        
        if (score >= 90) {
            console.log('  🎉 Excellent! UX is in great shape.');
        } else if (score >= 75) {
            console.log('  ✅ Good! Just a few improvements needed.');
        } else if (score >= 60) {
            console.log('  ⚠️  Fair. Several improvements recommended.');
        } else {
            console.log('  ❌ Needs work. Many issues to address.');
        }
    }

    saveReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalFiles: JS_FILES.length,
                totalIssues: this.issues.length,
                totalRecommendations: this.recommendations.length
            },
            issues: this.issues,
            recommendations: this.recommendations
        };

        fs.writeFileSync('DETAILED_UX_REPORT.json', JSON.stringify(report, null, 2));
        console.log('\n\n💾 Report saved: DETAILED_UX_REPORT.json');
    }
}

const checker = new DetailedUXChecker();
checker.checkAll();

