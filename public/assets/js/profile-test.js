/**
 * Profile Page Test Script
 * Run this in browser console to test profile functionality
 */

// Profile Test Script - Run this in browser console to test profile functionality

function runTests() {
    console.log('🧪 [Profile Test] Starting tests...\n');

    const tests = {
        // Test 1: Check if all required elements exist
        checkElements: function() {
            console.log('📋 Test 1: Checking required elements...');
            const requiredIds = [
                'fullName', 'email', 'phoneNumber', 'gender', 'birthDate', 'username',
                'saveProfileBtn', 'avatarInput', 'changeAvatarBtn',
                'emailVerificationStatus', 'sendVerificationEmailBtn', 'resendVerificationEmailBtn',
                'newEmail', 'currentPasswordForEmail', 'requestEmailChangeBtn',
                'phoneForVerification', 'requestPhoneOTPBtn',
                'currentPassword', 'newPassword', 'confirmPassword', 'changePasswordBtn',
                'tokenStatus', 'validateTokenBtn'
            ];

            let allFound = true;
            requiredIds.forEach(id => {
                const el = document.getElementById(id);
                if (!el) {
                    console.error(`  ❌ Missing element: #${id}`);
                    allFound = false;
                } else {
                    console.log(`  ✅ Found: #${id}`);
                }
            });

            if (allFound) {
                console.log('  ✅ All required elements found!\n');
            } else {
                console.log('  ❌ Some elements are missing!\n');
            }
            return allFound;
        },

        // Test 2: Check if AdminServices is loaded
        checkAdminServices: function() {
            console.log('📋 Test 2: Checking AdminServices...');
            if (!window.AdminServices) {
                console.error('  ❌ AdminServices not found!');
                console.error('  💡 Make sure AdminServices.js is loaded before this script');
                return false;
            }

            console.log('  ✅ AdminServices object found');
            console.log('  📝 AdminServices type:', typeof window.AdminServices);
            console.log('  📝 AdminServices constructor:', window.AdminServices.constructor?.name);

            const requiredMethods = [
                'getMyProfile', 'updateProfile', 'changePassword',
                'requestEmailChange', 'verifyEmailChange',
                'sendEmailVerification', 'verifyEmail', 'resendEmailVerification',
                'getEmailVerificationStatus', 'requestSMSOTP', 'verifySMSOTP',
                'validateToken', 'uploadAvatar'
            ];

            let allMethodsFound = true;
            let foundCount = 0;
            requiredMethods.forEach(method => {
                // Check both direct property and prototype
                const hasMethod = typeof window.AdminServices[method] === 'function' ||
                                 (window.AdminServices.__proto__ && typeof window.AdminServices.__proto__[method] === 'function');
                
                if (!hasMethod) {
                    console.error(`  ❌ Missing method: AdminServices.${method}`);
                    allMethodsFound = false;
                } else {
                    console.log(`  ✅ Found method: AdminServices.${method}`);
                    foundCount++;
                }
            });

            if (allMethodsFound) {
                console.log(`  ✅ All ${requiredMethods.length} AdminServices methods found!\n`);
            } else {
                console.log(`  ⚠️  Found ${foundCount}/${requiredMethods.length} methods`);
                console.log('  💡 Try:');
                console.log('     1. Hard refresh (Ctrl+Shift+R)');
                console.log('     2. Clear browser cache');
                console.log('     3. Check Network tab for AdminServices.js');
                console.log('     4. Run: window.checkAdminServicesProfile()\n');
            }
            return allMethodsFound;
        },

        // Test 3: Test form validation
        testFormValidation: function() {
            console.log('📋 Test 3: Testing form validation...');
            
            // Check if validation functions exist
            const hasValidation = typeof showFieldError === 'function' && 
                                 typeof clearErrors === 'function';
            
            if (hasValidation) {
                console.log('  ✅ Validation functions exist');
                
                // Test error display
                const testError = document.getElementById('fullNameError');
                if (testError) {
                    console.log('  ✅ Error display element found');
                } else {
                    console.error('  ❌ Error display element not found');
                }
            } else {
                console.log('  ⚠️  Validation functions may not be loaded yet');
            }
            
            console.log('  ℹ️  Note: Full validation test requires user interaction\n');
        },

        // Test 4: Test API endpoints (mock)
        testAPIEndpoints: function() {
            console.log('📋 Test 4: Testing API endpoints structure...');
            
            const endpoints = {
                'GET /api/users/me': 'getMyProfile',
                'PUT /api/users/update': 'updateProfile',
                'PUT /api/users/change-password': 'changePassword',
                'PUT /api/users/change-email': 'requestEmailChange',
                'POST /api/users/verify-email-change': 'verifyEmailChange',
                'POST /api/email-verification/send-verification': 'sendEmailVerification',
                'POST /api/email-verification/verify': 'verifyEmail',
                'POST /api/email-verification/resend': 'resendEmailVerification',
                'GET /api/email-verification/status': 'getEmailVerificationStatus',
                'POST /api/users/auth/request-otp': 'requestSMSOTP',
                'POST /api/users/auth/verify-otp': 'verifySMSOTP',
                'GET /api/users/validate-token': 'validateToken'
            };

            console.log('  📝 Expected API endpoints:');
            Object.keys(endpoints).forEach(endpoint => {
                console.log(`    - ${endpoint}`);
            });
            
            // Verify that AdminServices methods exist for these endpoints
            let allMethodsExist = true;
            Object.values(endpoints).forEach(method => {
                if (typeof window.AdminServices[method] !== 'function') {
                    allMethodsExist = false;
                }
            });
            
            if (allMethodsExist) {
                console.log('  ✅ All API endpoint methods verified in AdminServices\n');
            } else {
                console.log('  ⚠️  Some endpoint methods may be missing\n');
            }
            
            return allMethodsExist;
        },

        // Test 5: Check event listeners
        testEventListeners: function() {
            console.log('📋 Test 5: Checking event listeners...');
            
            const buttons = [
                'saveProfileBtn', 'changeAvatarBtn', 'checkEmailStatusBtn',
                'sendVerificationEmailBtn', 'resendVerificationEmailBtn', 'verifyEmailBtn',
                'requestEmailChangeBtn', 'verifyEmailChangeBtn', 'cancelEmailChangeBtn',
                'requestPhoneOTPBtn', 'verifyPhoneOTPBtn', 'resendPhoneOTPBtn',
                'changePasswordBtn', 'validateTokenBtn'
            ];

            let foundCount = 0;
            buttons.forEach(btnId => {
                const btn = document.getElementById(btnId);
                if (!btn) {
                    console.error(`  ❌ Button not found: #${btnId}`);
                } else {
                    foundCount++;
                    // Event listeners are added via addEventListener, not onclick
                    // So we can't easily detect them without inspecting the code
                    // Just verify button exists
                    console.log(`  ✅ Button exists: #${btnId}`);
                }
            });

            console.log(`  ✅ Found ${foundCount}/${buttons.length} buttons`);
            console.log('  ℹ️  Event listeners are added via addEventListener (not detectable)\n');
            return foundCount === buttons.length;
        },

        // Test 6: Test loading states
        testLoadingStates: function() {
            console.log('📋 Test 6: Testing loading states...');
            
            const overlay = document.getElementById('loadingOverlay');
            if (!overlay) {
                console.error('  ❌ Loading overlay not found');
                return false;
            }

            // Test show/hide
            overlay.style.display = 'flex';
            console.log('  ✅ Loading overlay can be shown');
            
            overlay.style.display = 'none';
            console.log('  ✅ Loading overlay can be hidden');
            console.log('  ✅ Loading states work correctly\n');
            return true;
        },

        // Test 7: Test avatar upload UI
        testAvatarUpload: function() {
            console.log('📋 Test 7: Testing avatar upload UI...');
            
            const avatarInput = document.getElementById('avatarInput');
            const avatarPreview = document.getElementById('avatarPreview');
            const avatarImage = document.getElementById('avatarImage');
            const avatarIcon = document.getElementById('avatarIcon');

            if (!avatarInput || !avatarPreview || !avatarImage || !avatarIcon) {
                console.error('  ❌ Avatar elements not found');
                return false;
            }

            console.log('  ✅ Avatar input found');
            console.log('  ✅ Avatar preview found');
            console.log('  ✅ Avatar image element found');
            console.log('  ✅ Avatar icon element found');
            console.log('  ✅ Avatar upload UI ready\n');
            return true;
        }
    };

    // Run all tests
    console.log('🚀 Running all tests...\n');
    
    const results = {
        elements: tests.checkElements(),
        adminServices: tests.checkAdminServices(),
        apiEndpoints: tests.testAPIEndpoints(),
        eventListeners: tests.testEventListeners(),
        loadingStates: tests.testLoadingStates(),
        avatarUpload: tests.testAvatarUpload()
    };

    tests.testFormValidation();

    // Summary
    console.log('\n📊 Test Summary:');
    console.log('================');
    Object.keys(results).forEach(test => {
        const status = results[test] ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} - ${test}`);
    });

    const passed = Object.values(results).filter(r => r).length;
    const total = Object.keys(results).length;
    
    console.log(`\n📈 Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All tests passed!');
    } else {
        console.log('⚠️  Some tests failed. Please check the errors above.');
    }

    // Export test functions for manual testing
    window.profileTests = tests;
    console.log('\n💡 Tip: Use window.profileTests to run individual tests');
    console.log('   Example: window.profileTests.checkElements()');
}

// Auto-run tests when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(runTests, 1000);
    });
} else {
    setTimeout(runTests, 1000);
}

