/**
 * Email Service Test & Debug Utility
 * 
 * Script để test và debug email service cho chức năng đổi email
 * 
 * Cách sử dụng:
 * 1. Mở browser console
 * 2. Load script này vào console hoặc include vào HTML
 * 3. Gọi các function test
 */

class EmailServiceTester {
    constructor() {
        this.baseUrl = 'https://server-shelf-stacker-w1ds.onrender.com';
        this.token = localStorage.getItem('admin_token') || localStorage.getItem('authToken');
    }

    /**
     * Test 1: Kiểm tra cấu hình email service
     */
    async testEmailConfig() {
        console.log('🔍 [EmailServiceTester] Testing email configuration...');
        
        try {
            // Note: Backend endpoint này có thể không tồn tại, đây chỉ là ví dụ
            const response = await fetch(`${this.baseUrl}/api/admin/email-config`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ [EmailServiceTester] Email config:', data);
                return data;
            } else {
                console.warn('⚠️ [EmailServiceTester] Email config endpoint not available');
                return null;
            }
        } catch (error) {
            console.error('❌ [EmailServiceTester] Error checking email config:', error);
            return null;
        }
    }

    /**
     * Test 2: Test gửi email đổi email
     */
    async testRequestEmailChange(newEmail, currentPassword) {
        console.log('📧 [EmailServiceTester] Testing request email change...');
        console.log('📧 [EmailServiceTester] Parameters:', {
            newEmail,
            currentPassword: '***',
            timestamp: new Date().toISOString()
        });

        if (!newEmail || !currentPassword) {
            console.error('❌ [EmailServiceTester] newEmail and currentPassword are required');
            return;
        }

        try {
            const startTime = Date.now();
            
            const response = await fetch(`${this.baseUrl}/api/users/change-email`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ newEmail, currentPassword })
            });

            const duration = Date.now() - startTime;
            
            console.log('📧 [EmailServiceTester] Response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                duration: `${duration}ms`,
                timestamp: new Date().toISOString()
            });

            const data = await response.json().catch(() => ({}));
            
            console.log('📧 [EmailServiceTester] Response data:', data);

            if (response.ok) {
                console.log('✅ [EmailServiceTester] Email change request successful:', {
                    success: data.success,
                    message: data.message,
                    old_email: data.old_email,
                    new_email: data.new_email,
                    expiresIn: data.expiresIn
                });
            } else {
                console.error('❌ [EmailServiceTester] Email change request failed:', {
                    status: response.status,
                    message: data.message || data.msg || data.error,
                    error: data
                });
            }

            return { response, data, duration };
        } catch (error) {
            console.error('❌ [EmailServiceTester] Error requesting email change:', {
                message: error.message,
                name: error.name,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    /**
     * Test 3: Test verify email change
     */
    async testVerifyEmailChange(oldEmailOtp, newEmailOtp) {
        console.log('📧 [EmailServiceTester] Testing verify email change...');
        console.log('📧 [EmailServiceTester] Parameters:', {
            oldEmailOtpLength: oldEmailOtp?.length || 0,
            newEmailOtpLength: newEmailOtp?.length || 0,
            timestamp: new Date().toISOString()
        });

        if (!oldEmailOtp || !newEmailOtp) {
            console.error('❌ [EmailServiceTester] oldEmailOtp and newEmailOtp are required');
            return;
        }

        try {
            const startTime = Date.now();
            
            const response = await fetch(`${this.baseUrl}/api/users/verify-email-change`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ oldEmailOtp, newEmailOtp })
            });

            const duration = Date.now() - startTime;
            
            console.log('📧 [EmailServiceTester] Response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                duration: `${duration}ms`,
                timestamp: new Date().toISOString()
            });

            const data = await response.json().catch(() => ({}));
            
            console.log('📧 [EmailServiceTester] Response data:', data);

            if (response.ok) {
                console.log('✅ [EmailServiceTester] Email change verification successful:', {
                    success: data.success,
                    message: data.message,
                    hasData: !!data.data
                });
            } else {
                console.error('❌ [EmailServiceTester] Email change verification failed:', {
                    status: response.status,
                    message: data.message || data.msg || data.error,
                    error: data
                });
            }

            return { response, data, duration };
        } catch (error) {
            console.error('❌ [EmailServiceTester] Error verifying email change:', {
                message: error.message,
                name: error.name,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    /**
     * Test 4: Kiểm tra server health
     */
    async testServerHealth() {
        console.log('🔍 [EmailServiceTester] Testing server health...');
        
        try {
            const startTime = Date.now();
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET'
            });
            const duration = Date.now() - startTime;
            
            console.log('📊 [EmailServiceTester] Server health:', {
                status: response.status,
                ok: response.ok,
                duration: `${duration}ms`,
                timestamp: new Date().toISOString()
            });

            if (response.ok) {
                const data = await response.json().catch(() => ({}));
                console.log('✅ [EmailServiceTester] Server is healthy:', data);
            } else {
                console.warn('⚠️ [EmailServiceTester] Server health check returned non-OK status');
            }

            return { response, duration };
        } catch (error) {
            console.error('❌ [EmailServiceTester] Server health check failed:', error);
            throw error;
        }
    }

    /**
     * Test 5: Kiểm tra network connectivity
     */
    async testNetworkConnectivity() {
        console.log('🔍 [EmailServiceTester] Testing network connectivity...');
        
        const tests = [
            { name: 'Base URL', url: this.baseUrl },
            { name: 'Gmail SMTP', url: 'https://smtp.gmail.com' }
        ];

        const results = [];

        for (const test of tests) {
            try {
                const startTime = Date.now();
                const response = await fetch(test.url, {
                    method: 'HEAD',
                    mode: 'no-cors'
                });
                const duration = Date.now() - startTime;
                
                results.push({
                    name: test.name,
                    url: test.url,
                    success: true,
                    duration: `${duration}ms`,
                    timestamp: new Date().toISOString()
                });
                
                console.log(`✅ [EmailServiceTester] ${test.name} is reachable (${duration}ms)`);
            } catch (error) {
                results.push({
                    name: test.name,
                    url: test.url,
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                
                console.error(`❌ [EmailServiceTester] ${test.name} is not reachable:`, error.message);
            }
        }

        return results;
    }

    /**
     * Test 6: Full test flow
     */
    async runFullTest(newEmail, currentPassword) {
        console.log('🚀 [EmailServiceTester] Running full test suite...');
        console.log('='.repeat(60));

        const results = {
            serverHealth: null,
            networkConnectivity: null,
            emailConfig: null,
            requestEmailChange: null,
            errors: []
        };

        try {
            // Test 1: Server Health
            console.log('\n📊 Test 1: Server Health');
            try {
                results.serverHealth = await this.testServerHealth();
            } catch (error) {
                results.errors.push({ test: 'serverHealth', error: error.message });
            }

            // Test 2: Network Connectivity
            console.log('\n📊 Test 2: Network Connectivity');
            try {
                results.networkConnectivity = await this.testNetworkConnectivity();
            } catch (error) {
                results.errors.push({ test: 'networkConnectivity', error: error.message });
            }

            // Test 3: Email Config
            console.log('\n📊 Test 3: Email Configuration');
            try {
                results.emailConfig = await this.testEmailConfig();
            } catch (error) {
                results.errors.push({ test: 'emailConfig', error: error.message });
            }

            // Test 4: Request Email Change (if credentials provided)
            if (newEmail && currentPassword) {
                console.log('\n📊 Test 4: Request Email Change');
                try {
                    results.requestEmailChange = await this.testRequestEmailChange(newEmail, currentPassword);
                } catch (error) {
                    results.errors.push({ test: 'requestEmailChange', error: error.message });
                }
            } else {
                console.log('\n⚠️ Test 4: Request Email Change - Skipped (no credentials provided)');
            }

        } catch (error) {
            console.error('❌ [EmailServiceTester] Full test suite failed:', error);
            results.errors.push({ test: 'fullTest', error: error.message });
        }

        console.log('\n' + '='.repeat(60));
        console.log('📋 [EmailServiceTester] Test Summary:');
        console.log(JSON.stringify(results, null, 2));

        return results;
    }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
    window.EmailServiceTester = EmailServiceTester;
    
    // Auto-create instance
    window.emailServiceTester = new EmailServiceTester();
    
    console.log('✅ EmailServiceTester loaded!');
    console.log('📝 Usage examples:');
    console.log('  - emailServiceTester.testServerHealth()');
    console.log('  - emailServiceTester.testNetworkConnectivity()');
    console.log('  - emailServiceTester.testRequestEmailChange("new@email.com", "password")');
    console.log('  - emailServiceTester.runFullTest("new@email.com", "password")');
}

