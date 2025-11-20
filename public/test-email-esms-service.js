/**
 * Email & ESMS Service Test & Debug Utility
 * 
 * Script để test và debug email service và ESMS service
 * 
 * Cách sử dụng:
 * 1. Mở browser console
 * 2. Load script này vào console hoặc include vào HTML
 * 3. Gọi các function test
 */

class EmailESMSServiceTester {
    constructor() {
        this.baseUrl = 'https://server-shelf-stacker-w1ds.onrender.com';
        this.token = localStorage.getItem('admin_token') || localStorage.getItem('authToken');
    }

    /**
     * Test 1: Kiểm tra cấu hình Email Service
     */
    async testEmailConfig() {
        console.log('🔍 [EmailESMSServiceTester] Testing email configuration...');
        
        try {
            // Test bằng cách gửi request đổi email (sẽ fail nhưng sẽ log config)
            const testEmail = 'test@example.com';
            const testPassword = 'test';
            
            console.log('📧 [EmailESMSServiceTester] Attempting to test email config...');
            
            // Note: Backend có thể có endpoint riêng để check config
            // Nếu không có, chúng ta sẽ test bằng cách gửi request thực tế
            const response = await fetch(`${this.baseUrl}/api/users/change-email`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ newEmail: testEmail, currentPassword: testPassword })
            });
            
            const data = await response.json().catch(() => ({}));
            
            // Phân tích response để xác định loại lỗi
            if (data.message) {
                const message = data.message.toLowerCase();
                
                if (message.includes('email') && (message.includes('config') || message.includes('not configured'))) {
                    console.error('❌ [EmailESMSServiceTester] Email configuration missing!');
                    console.error('❌ [EmailESMSServiceTester] Please set EMAIL_USER and EMAIL_PASSWORD in environment variables.');
                    return { configured: false, error: 'Email configuration missing' };
                }
                
                if (message.includes('timeout') || message.includes('etimedout')) {
                    console.error('❌ [EmailESMSServiceTester] Email service connection timeout!');
                    console.error('❌ [EmailESMSServiceTester] Check EMAIL_USER and EMAIL_PASSWORD configuration.');
                    console.error('💡 [EmailESMSServiceTester] Solution: Ensure EMAIL_USE_PORT_587=true (use port 587 with TLS)');
                    console.error('💡 [EmailESMSServiceTester] Solution: Check network connectivity and firewall settings');
                    return { configured: true, error: 'Connection timeout' };
                }
                
                if (message.includes('auth') || message.includes('eauth')) {
                    console.error('❌ [EmailESMSServiceTester] Email authentication failed!');
                    console.error('❌ [EmailESMSServiceTester] Check EMAIL_USER and EMAIL_PASSWORD (must be App Password).');
                    return { configured: true, error: 'Authentication failed' };
                }
            }
            
            console.log('✅ [EmailESMSServiceTester] Email service appears to be configured');
            return { configured: true };
        } catch (error) {
            console.error('❌ [EmailESMSServiceTester] Error checking email config:', error);
            return { configured: false, error: error.message };
        }
    }

    /**
     * Test 2: Test gửi email đổi email
     */
    async testRequestEmailChange(newEmail, currentPassword) {
        console.log('📧 [EmailESMSServiceTester] Testing request email change...');
        console.log('📧 [EmailESMSServiceTester] Parameters:', {
            newEmail,
            currentPassword: '***',
            timestamp: new Date().toISOString()
        });

        if (!newEmail || !currentPassword) {
            console.error('❌ [EmailESMSServiceTester] newEmail and currentPassword are required');
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
            
            console.log('📧 [EmailESMSServiceTester] Response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                duration: `${duration}ms`,
                timestamp: new Date().toISOString()
            });

            const data = await response.json().catch(() => ({}));
            
            console.log('📧 [EmailESMSServiceTester] Response data:', data);

            // Phân tích lỗi email service
            if (!response.ok) {
                const errorMessage = data.message || data.msg || data.error || '';
                
                if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('Connection timeout')) {
                    console.error('❌ [EmailESMSServiceTester] Email service connection timeout!');
                    console.error('❌ [EmailESMSServiceTester] Solution: Check EMAIL_USER and EMAIL_PASSWORD, or try again later.');
                    console.error('💡 [EmailESMSServiceTester] Solution: Ensure EMAIL_USE_PORT_587=true (use port 587 with TLS)');
                    console.error('💡 [EmailESMSServiceTester] Solution: Check network connectivity and firewall settings');
                    console.error('💡 [EmailESMSServiceTester] Solution: Backend will retry automatically (3 attempts)');
                } else if (errorMessage.includes('EAUTH') || errorMessage.includes('Authentication failed')) {
                    console.error('❌ [EmailESMSServiceTester] Email authentication failed!');
                    console.error('❌ [EmailESMSServiceTester] Solution: Check EMAIL_USER and EMAIL_PASSWORD (must be App Password from Gmail).');
                } else if (errorMessage.includes('ECONNECTION') || errorMessage.includes('Connection error')) {
                    console.error('❌ [EmailESMSServiceTester] Email connection error!');
                    console.error('❌ [EmailESMSServiceTester] Solution: Check network connection and firewall.');
                    console.error('💡 [EmailESMSServiceTester] Solution: Ensure EMAIL_USE_PORT_587=true (use port 587 with TLS)');
                } else {
                    console.error('❌ [EmailESMSServiceTester] Email change request failed:', {
                        status: response.status,
                        message: errorMessage,
                        error: data
                    });
                }
            } else {
                console.log('✅ [EmailESMSServiceTester] Email change request successful:', {
                    success: data.success,
                    message: data.message,
                    old_email: data.old_email,
                    new_email: data.new_email,
                    expiresIn: data.expiresIn
                });
            }

            return { response, data, duration };
        } catch (error) {
            console.error('❌ [EmailESMSServiceTester] Error requesting email change:', {
                message: error.message,
                name: error.name,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    /**
     * Test 3: Test gửi SMS OTP
     */
    async testRequestSMSOTP(phone) {
        console.log('📱 [EmailESMSServiceTester] Testing request SMS OTP...');
        console.log('📱 [EmailESMSServiceTester] Parameters:', {
            phone,
            timestamp: new Date().toISOString()
        });

        if (!phone) {
            console.error('❌ [EmailESMSServiceTester] phone is required');
            return;
        }

        try {
            const startTime = Date.now();
            
            // Clean phone number (normalize như backend)
            const cleanPhone = phone.replace(/\s+/g, '').replace(/[-()]/g, '').trim();
            
            // Validate phone number format (như backend)
            if (!/^0\d{9,10}$/.test(cleanPhone)) {
                console.error('❌ [EmailESMSServiceTester] Invalid phone number format!');
                console.error('❌ [EmailESMSServiceTester] Phone must start with 0 and have 10-11 digits');
                console.error('❌ [EmailESMSServiceTester] Original:', phone);
                console.error('❌ [EmailESMSServiceTester] Cleaned:', cleanPhone);
                return {
                    success: false,
                    error: 'Invalid phone number format',
                    original: phone,
                    cleaned: cleanPhone
                };
            }
            
            console.log('📱 [EmailESMSServiceTester] Phone number normalized:', {
                original: phone,
                cleaned: cleanPhone,
                valid: true
            });
            
            const response = await fetch(`${this.baseUrl}/api/users/auth/request-otp`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone: cleanPhone })
            });

            const duration = Date.now() - startTime;
            
            console.log('📱 [EmailESMSServiceTester] Response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                duration: `${duration}ms`,
                timestamp: new Date().toISOString()
            });

            const data = await response.json().catch(() => ({}));
            
            console.log('📱 [EmailESMSServiceTester] Response data:', data);

            // Phân tích lỗi ESMS service
            if (!response.ok) {
                const errorMessage = data.message || data.msg || data.error || '';
                
                if (errorMessage.includes('CodeResult') && errorMessage.includes('101')) {
                    console.error('❌ [EmailESMSServiceTester] ESMS authentication failed (CodeResult: 101)!');
                    console.error('❌ [EmailESMSServiceTester] Solution: Check ESMS_API_KEY and ESMS_SECRET_KEY in environment variables.');
                    console.error('💡 [EmailESMSServiceTester] Default credentials: API_KEY=BB19D3EA87F3AD9BFF23EC9BA621C6, SECRET_KEY=48D7E8E22AF7339A37881204EE6679');
                    console.error('💡 [EmailESMSServiceTester] Make sure API_KEY and SECRET_KEY are different');
                    console.error('💡 [EmailESMSServiceTester] Check credentials are set correctly in backend environment variables');
                } else if (errorMessage.includes('CodeResult') && errorMessage.includes('102')) {
                    console.error('❌ [EmailESMSServiceTester] ESMS insufficient balance (CodeResult: 102)!');
                    console.error('❌ [EmailESMSServiceTester] Solution: Top up your ESMS account balance.');
                    console.error('💡 [EmailESMSServiceTester] Contact ESMS: 0901.888.484');
                    console.error('💡 [EmailESMSServiceTester] Login to ESMS account and check balance');
                } else if (errorMessage.includes('CodeResult') && errorMessage.includes('103')) {
                    console.error('❌ [EmailESMSServiceTester] ESMS invalid brandname (CodeResult: 103)!');
                    console.error('❌ [EmailESMSServiceTester] Solution: Check ESMS_BRANDNAME configuration.');
                    console.error('💡 [EmailESMSServiceTester] Default brandname (test): Baotrixemay');
                    console.error('💡 [EmailESMSServiceTester] For production, register brandname with ESMS');
                    console.error('💡 [EmailESMSServiceTester] Contact ESMS: 0901.888.484');
                } else if (errorMessage.includes('INVALID_PHONE_FORMAT') || errorMessage.includes('phone') && errorMessage.includes('format')) {
                    console.error('❌ [EmailESMSServiceTester] Invalid phone number format!');
                    console.error('❌ [EmailESMSServiceTester] Phone must start with 0 and have 10-11 digits');
                    console.error('💡 [EmailESMSServiceTester] Example: 0559018408, 0123456789');
                } else {
                    console.error('❌ [EmailESMSServiceTester] SMS OTP request failed:', {
                        status: response.status,
                        message: errorMessage,
                        error: data
                    });
                }
            } else {
                console.log('✅ [EmailESMSServiceTester] SMS OTP request successful:', {
                    success: data.success,
                    message: data.message,
                    codeResult: data.CodeResult || 'N/A'
                });
                
                // Check if response contains ESMS CodeResult
                if (data.CodeResult === '100') {
                    console.log('✅ [EmailESMSServiceTester] ESMS CodeResult: 100 (Success)');
                } else if (data.CodeResult) {
                    console.warn('⚠️ [EmailESMSServiceTester] ESMS CodeResult:', data.CodeResult);
                    console.warn('⚠️ [EmailESMSServiceTester] Check ESMS response for details');
                }
            }

            return { response, data, duration };
        } catch (error) {
            console.error('❌ [EmailESMSServiceTester] Error requesting SMS OTP:', {
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
        console.log('🔍 [EmailESMSServiceTester] Testing server health...');
        
        try {
            const startTime = Date.now();
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET'
            });
            const duration = Date.now() - startTime;
            
            console.log('📊 [EmailESMSServiceTester] Server health:', {
                status: response.status,
                ok: response.ok,
                duration: `${duration}ms`,
                timestamp: new Date().toISOString()
            });

            if (response.ok) {
                const data = await response.json().catch(() => ({}));
                console.log('✅ [EmailESMSServiceTester] Server is healthy:', data);
            } else {
                console.warn('⚠️ [EmailESMSServiceTester] Server health check returned non-OK status');
            }

            return { response, duration };
        } catch (error) {
            console.error('❌ [EmailESMSServiceTester] Server health check failed:', error);
            throw error;
        }
    }

    /**
     * Test 5: Full test suite
     */
    async runFullTest(emailTestData = null, smsTestData = null) {
        console.log('🚀 [EmailESMSServiceTester] Running full test suite...');
        console.log('='.repeat(60));

        const results = {
            serverHealth: null,
            emailConfig: null,
            emailTest: null,
            smsTest: null,
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

            // Test 2: Email Config
            console.log('\n📊 Test 2: Email Configuration');
            try {
                results.emailConfig = await this.testEmailConfig();
            } catch (error) {
                results.errors.push({ test: 'emailConfig', error: error.message });
            }

            // Test 3: Email Test (if data provided)
            if (emailTestData && emailTestData.newEmail && emailTestData.currentPassword) {
                console.log('\n📊 Test 3: Email Service Test');
                try {
                    results.emailTest = await this.testRequestEmailChange(
                        emailTestData.newEmail,
                        emailTestData.currentPassword
                    );
                } catch (error) {
                    results.errors.push({ test: 'emailTest', error: error.message });
                }
            } else {
                console.log('\n⚠️ Test 3: Email Service Test - Skipped (no test data provided)');
            }

            // Test 4: SMS Test (if data provided)
            if (smsTestData && smsTestData.phone) {
                console.log('\n📊 Test 4: ESMS Service Test');
                try {
                    results.smsTest = await this.testRequestSMSOTP(smsTestData.phone);
                } catch (error) {
                    results.errors.push({ test: 'smsTest', error: error.message });
                }
            } else {
                console.log('\n⚠️ Test 4: ESMS Service Test - Skipped (no test data provided)');
            }

        } catch (error) {
            console.error('❌ [EmailESMSServiceTester] Full test suite failed:', error);
            results.errors.push({ test: 'fullTest', error: error.message });
        }

        console.log('\n' + '='.repeat(60));
        console.log('📋 [EmailESMSServiceTester] Test Summary:');
        console.log(JSON.stringify(results, null, 2));

        return results;
    }

    /**
     * Helper: Parse error message để hiển thị hướng dẫn cụ thể
     */
    parseError(errorMessage) {
        const message = (errorMessage || '').toLowerCase();
        
        const errorMap = {
            'etimedout': {
                type: 'Email Service - Connection Timeout',
                solution: 'Check EMAIL_USER and EMAIL_PASSWORD configuration, or try again later.',
                details: 'Email service connection timed out. This could be due to network issues, firewall blocking, or incorrect email configuration.'
            },
            'eauth': {
                type: 'Email Service - Authentication Failed',
                solution: 'Check EMAIL_USER and EMAIL_PASSWORD (must be App Password from Gmail).',
                details: 'Email authentication failed. Make sure you are using Gmail App Password, not regular password.'
            },
            'econnection': {
                type: 'Email Service - Connection Error',
                solution: 'Check network connection and firewall settings.',
                details: 'Cannot connect to email service. Check if port 465 or 587 is blocked by firewall.'
            },
            'coderesult.*101': {
                type: 'ESMS Service - Authentication Failed',
                solution: 'Check ESMS_API_KEY and ESMS_SECRET_KEY in environment variables.',
                details: 'ESMS authentication failed. Make sure API_KEY and SECRET_KEY are different and not using default credentials.'
            },
            'coderesult.*102': {
                type: 'ESMS Service - Insufficient Balance',
                solution: 'Top up your ESMS account balance.',
                details: 'ESMS account does not have sufficient balance to send SMS.'
            },
            'coderesult.*103': {
                type: 'ESMS Service - Invalid Brandname',
                solution: 'Check ESMS_BRANDNAME configuration.',
                details: 'ESMS brandname is invalid or not registered.'
            }
        };

        for (const [key, value] of Object.entries(errorMap)) {
            if (message.includes(key.replace('.*', '')) || new RegExp(key).test(message)) {
                return value;
            }
        }

        return null;
    }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
    window.EmailESMSServiceTester = EmailESMSServiceTester;
    
    // Auto-create instance
    window.emailESMSTester = new EmailESMSServiceTester();
    
    console.log('✅ EmailESMSServiceTester loaded!');
    console.log('📝 Usage examples:');
    console.log('  - emailESMSTester.testServerHealth()');
    console.log('  - emailESMSTester.testEmailConfig()');
    console.log('  - emailESMSTester.testRequestEmailChange("new@email.com", "password")');
    console.log('  - emailESMSTester.testRequestSMSOTP("0123456789")');
    console.log('  - emailESMSTester.runFullTest({ newEmail: "...", currentPassword: "..." }, { phone: "..." })');
}

