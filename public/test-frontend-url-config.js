/**
 * Frontend URL Configuration Test Utility
 * 
 * Script để test và kiểm tra cấu hình FRONTEND_URL trong backend
 * 
 * Cách sử dụng:
 * 1. Mở browser console
 * 2. Load script này vào console hoặc include vào HTML
 * 3. Gọi các function test
 */

class FrontendURLTester {
    constructor() {
        this.baseUrl = 'https://server-shelf-stacker-w1ds.onrender.com';
        this.token = localStorage.getItem('admin_token') || localStorage.getItem('authToken');
    }

    /**
     * Test 1: Kiểm tra verification URL trong email response
     */
    async testVerificationURL() {
        console.log('🔍 [FrontendURLTester] Testing verification URL configuration...');
        
        try {
            // Test bằng cách gửi verification email
            const testEmail = 'test@example.com';
            
            console.log('📧 [FrontendURLTester] Attempting to send verification email...');
            
            const response = await fetch(`${this.baseUrl}/api/email-verification/send-verification`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    email: testEmail,
                    purpose: 'registration'
                })
            });
            
            const data = await response.json().catch(() => ({}));
            
            if (response.ok && data.verificationUrl) {
                const url = data.verificationUrl;
                console.log('✅ [FrontendURLTester] Verification URL received:', url);
                
                // Parse URL
                try {
                    const urlObj = new URL(url);
                    console.log('📊 [FrontendURLTester] URL Analysis:', {
                        protocol: urlObj.protocol,
                        host: urlObj.host,
                        hostname: urlObj.hostname,
                        pathname: urlObj.pathname,
                        search: urlObj.search,
                        hash: urlObj.hash,
                        origin: urlObj.origin
                    });
                    
                    // Check if URL is valid
                    if (urlObj.protocol === 'https:' || urlObj.protocol === 'http:') {
                        console.log('✅ [FrontendURLTester] URL protocol is valid');
                    } else {
                        console.warn('⚠️ [FrontendURLTester] URL protocol might be invalid:', urlObj.protocol);
                    }
                    
                    // Check if hostname is localhost or production domain
                    if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
                        console.warn('⚠️ [FrontendURLTester] Using localhost URL - might not work in production');
                    } else if (urlObj.hostname.includes('shelfstacker.com')) {
                        console.log('✅ [FrontendURLTester] Using production domain');
                    } else {
                        console.warn('⚠️ [FrontendURLTester] Using custom domain:', urlObj.hostname);
                    }
                    
                    return {
                        success: true,
                        url: url,
                        parsed: {
                            protocol: urlObj.protocol,
                            host: urlObj.host,
                            hostname: urlObj.hostname,
                            pathname: urlObj.pathname
                        }
                    };
                } catch (parseError) {
                    console.error('❌ [FrontendURLTester] Failed to parse URL:', parseError);
                    return {
                        success: false,
                        error: 'Failed to parse URL',
                        url: url
                    };
                }
            } else {
                console.error('❌ [FrontendURLTester] Failed to get verification URL:', data);
                return {
                    success: false,
                    error: data.message || 'Failed to send verification email'
                };
            }
        } catch (error) {
            console.error('❌ [FrontendURLTester] Error testing verification URL:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Test 2: Kiểm tra email change verification URL
     */
    async testEmailChangeVerificationURL(newEmail, currentPassword) {
        console.log('🔍 [FrontendURLTester] Testing email change verification URL...');
        
        if (!newEmail || !currentPassword) {
            console.error('❌ [FrontendURLTester] newEmail and currentPassword are required');
            return;
        }
        
        try {
            const response = await fetch(`${this.baseUrl}/api/users/change-email`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ newEmail, currentPassword })
            });
            
            const data = await response.json().catch(() => ({}));
            
            // Email change không trả về verification URL trực tiếp
            // Nhưng có thể kiểm tra response để xem có lỗi về FRONTEND_URL không
            if (response.ok) {
                console.log('✅ [FrontendURLTester] Email change request successful');
                console.log('📧 [FrontendURLTester] Check your email for OTP (not URL-based)');
                return { success: true, message: 'Email change uses OTP, not URL' };
            } else {
                const errorMessage = data.message || data.msg || '';
                
                if (errorMessage.includes('FRONTEND_URL') || errorMessage.includes('frontend')) {
                    console.error('❌ [FrontendURLTester] FRONTEND_URL configuration issue detected');
                    console.error('❌ [FrontendURLTester] Error:', errorMessage);
                    return {
                        success: false,
                        error: 'FRONTEND_URL configuration issue',
                        message: errorMessage
                    };
                }
                
                return { success: false, error: errorMessage };
            }
        } catch (error) {
            console.error('❌ [FrontendURLTester] Error testing email change:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Test 3: Validate URL format
     */
    validateURL(url) {
        console.log('🔍 [FrontendURLTester] Validating URL format...');
        
        if (!url) {
            console.error('❌ [FrontendURLTester] URL is required');
            return { valid: false, error: 'URL is required' };
        }
        
        try {
            const urlObj = new URL(url);
            
            const validation = {
                valid: true,
                protocol: urlObj.protocol,
                host: urlObj.host,
                hostname: urlObj.hostname,
                pathname: urlObj.pathname,
                issues: []
            };
            
            // Check protocol
            if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
                validation.issues.push('Protocol should be http: or https:');
            }
            
            // Check hostname
            if (!urlObj.hostname || urlObj.hostname === '') {
                validation.issues.push('Hostname is missing');
            }
            
            // Check for localhost in production
            if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
                validation.issues.push('Using localhost - might not work in production');
            }
            
            // Check for trailing slash in pathname
            if (urlObj.pathname.endsWith('/') && urlObj.pathname !== '/') {
                validation.issues.push('Pathname has trailing slash');
            }
            
            if (validation.issues.length > 0) {
                validation.valid = false;
                console.warn('⚠️ [FrontendURLTester] URL validation issues:', validation.issues);
            } else {
                console.log('✅ [FrontendURLTester] URL format is valid');
            }
            
            return validation;
        } catch (error) {
            console.error('❌ [FrontendURLTester] Invalid URL format:', error);
            return {
                valid: false,
                error: error.message,
                url: url
            };
        }
    }

    /**
     * Test 4: Suggest FRONTEND_URL values
     */
    suggestFrontendURL() {
        console.log('💡 [FrontendURLTester] Suggesting FRONTEND_URL values...');
        
        const suggestions = {
            production: [
                'https://shelfstacker.com',
                'https://www.shelfstacker.com',
                'https://app.shelfstacker.com'
            ],
            development: [
                'http://localhost:3000',
                'http://localhost:5173',
                'http://127.0.0.1:3000'
            ],
            staging: [
                'https://staging.shelfstacker.com',
                'https://dev.shelfstacker.com'
            ]
        };
        
        console.log('📋 [FrontendURLTester] Suggested FRONTEND_URL values:');
        console.log('Production:', suggestions.production);
        console.log('Development:', suggestions.development);
        console.log('Staging:', suggestions.staging);
        
        return suggestions;
    }

    /**
     * Test 5: Full test suite
     */
    async runFullTest() {
        console.log('🚀 [FrontendURLTester] Running full test suite...');
        console.log('='.repeat(60));
        
        const results = {
            verificationURL: null,
            urlValidation: null,
            suggestions: null,
            errors: []
        };
        
        try {
            // Test 1: Get verification URL
            console.log('\n📊 Test 1: Get Verification URL');
            try {
                results.verificationURL = await this.testVerificationURL();
                if (results.verificationURL && results.verificationURL.url) {
                    // Test 2: Validate URL
                    console.log('\n📊 Test 2: Validate URL Format');
                    results.urlValidation = this.validateURL(results.verificationURL.url);
                }
            } catch (error) {
                results.errors.push({ test: 'verificationURL', error: error.message });
            }
            
            // Test 3: Suggest URLs
            console.log('\n📊 Test 3: Suggest FRONTEND_URL Values');
            results.suggestions = this.suggestFrontendURL();
            
        } catch (error) {
            console.error('❌ [FrontendURLTester] Full test suite failed:', error);
            results.errors.push({ test: 'fullTest', error: error.message });
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('📋 [FrontendURLTester] Test Summary:');
        console.log(JSON.stringify(results, null, 2));
        
        return results;
    }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
    window.FrontendURLTester = FrontendURLTester;
    
    // Auto-create instance
    window.frontendURLTester = new FrontendURLTester();
    
    console.log('✅ FrontendURLTester loaded!');
    console.log('📝 Usage examples:');
    console.log('  - frontendURLTester.testVerificationURL()');
    console.log('  - frontendURLTester.validateURL("https://shelfstacker.com/verify/email/token")');
    console.log('  - frontendURLTester.suggestFrontendURL()');
    console.log('  - frontendURLTester.runFullTest()');
}



