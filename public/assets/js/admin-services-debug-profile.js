/**
 * Debug script to check AdminServices profile methods
 * Run this in console to verify methods are available
 */

(function() {
    console.log('🔍 [AdminServices Debug] Checking profile methods...\n');
    
    // Wait for AdminServices to be ready
    function checkAdminServices() {
        if (!window.AdminServices) {
            console.error('❌ AdminServices not found!');
            return false;
        }
        
        console.log('✅ AdminServices object found');
        console.log('📋 Checking methods...\n');
        
        const profileMethods = [
            'getMyProfile',
            'updateProfile',
            'changePassword',
            'requestEmailChange',
            'verifyEmailChange',
            'sendEmailVerification',
            'verifyEmail',
            'resendEmailVerification',
            'getEmailVerificationStatus',
            'requestSMSOTP',
            'verifySMSOTP',
            'validateToken',
            'uploadAvatar'
        ];
        
        let found = 0;
        let missing = [];
        
        profileMethods.forEach(method => {
            if (typeof window.AdminServices[method] === 'function') {
                console.log(`✅ ${method}`);
                found++;
            } else {
                console.error(`❌ ${method} - NOT FOUND`);
                missing.push(method);
            }
        });
        
        console.log(`\n📊 Results: ${found}/${profileMethods.length} methods found`);
        
        if (missing.length > 0) {
            console.error('\n❌ Missing methods:', missing);
            console.log('\n💡 Solutions:');
            console.log('1. Hard refresh the page (Ctrl+Shift+R or Ctrl+F5)');
            console.log('2. Clear browser cache');
            console.log('3. Check if AdminServices.js file has been updated');
            console.log('4. Check Network tab to see which AdminServices.js is loaded');
        } else {
            console.log('\n🎉 All profile methods are available!');
        }
        
        // Check AdminServices prototype
        console.log('\n🔍 Checking AdminServices prototype...');
        const proto = Object.getPrototypeOf(window.AdminServices);
        console.log('Prototype methods:', Object.getOwnPropertyNames(proto).filter(name => 
            typeof proto[name] === 'function' && name !== 'constructor'
        ));
        
        return found === profileMethods.length;
    }
    
    // Run check
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(checkAdminServices, 500);
        });
    } else {
        setTimeout(checkAdminServices, 500);
    }
    
    // Export for manual check
    window.checkAdminServicesProfile = checkAdminServices;
    
    console.log('\n💡 Run window.checkAdminServicesProfile() to check again');
})();




