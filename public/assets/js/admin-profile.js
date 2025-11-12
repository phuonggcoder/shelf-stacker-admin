/**
 * Admin Profile Management
 * Handles user profile CRUD, email/phone verification, password change
 */

// Wait for AdminServices to be ready
function waitForAdminServices(maxWait = 5000) {
    return new Promise((resolve, reject) => {
        if (window.AdminServices) {
            resolve();
            return;
        }
        
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (window.AdminServices) {
                clearInterval(checkInterval);
                resolve();
            } else if (Date.now() - startTime > maxWait) {
                clearInterval(checkInterval);
                reject(new Error('AdminServices timeout'));
            }
        }, 100);
    });
}

let currentUserData = null;
let emailChangeRequested = false;
let phoneChangeRequested = false;
let phoneChangeStep = null; // 'verify_old_phone' hoặc 'verify_new_phone'
let phoneChangeData = null; // Lưu thông tin phone change request

document.addEventListener('DOMContentLoaded', async function() {
    console.log('📋 [Profile] DOMContentLoaded - Initializing profile page...');
    
    try {
        await waitForAdminServices();
        console.log('✅ [Profile] AdminServices ready');
        await initProfilePage();
    } catch (error) {
        console.error('❌ [Profile] Error initializing:', error);
        showError('Không thể tải AdminServices. Vui lòng reload trang.');
    }
});

async function initProfilePage() {
    console.log('🚀 [Profile] Initializing profile page...');
    try {
        showLoading();
        await loadUserProfile();
        await checkEmailVerificationStatus();
        await validateToken();
        setupEventListeners();
        console.log('✅ [Profile] Profile page initialized successfully');
    } catch (error) {
        console.error('❌ [Profile] Error initializing profile page:', error);
        showError('Không thể tải thông tin người dùng: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function loadUserProfile() {
    console.log('📥 [Profile] Loading user profile...');
    try {
        if (!window.AdminServices) {
            throw new Error('AdminServices is not available');
        }
        
        const response = await window.AdminServices.getMyProfile();
        console.log('📦 [Profile] Profile response received:', response);
        
        // Handle different response formats
        let user = response;
        if (response && response.data) {
            user = response.data;
        } else if (response && response.user) {
            user = response.user;
        }
        
        if (!user) {
            throw new Error('Không nhận được dữ liệu người dùng');
        }
        
        currentUserData = user;
        console.log('✅ [Profile] User data loaded:', user);
        console.log('📋 [Profile] User fields:', {
            full_name: user.full_name,
            fullName: user.fullName,
            email: user.email,
            phone_number: user.phone_number,
            phoneNumber: user.phoneNumber,
            gender: user.gender,
            username: user.username,
            birth_date: user.birth_date,
            birthDate: user.birthDate
        });
        
        // Populate form fields - handle both snake_case and camelCase
        const fullNameEl = document.getElementById('fullName');
        const emailEl = document.getElementById('email');
        const phoneNumberEl = document.getElementById('phoneNumber');
        const genderEl = document.getElementById('gender');
        const usernameEl = document.getElementById('username');
        const birthDateEl = document.getElementById('birthDate');
        
        if (fullNameEl) {
            fullNameEl.value = user.full_name || user.fullName || '';
            console.log('📝 [Profile] Set fullName to:', fullNameEl.value);
        }
        if (emailEl) {
            emailEl.value = user.email || '';
            console.log('📝 [Profile] Set email to:', emailEl.value);
        }
        if (phoneNumberEl) {
            phoneNumberEl.value = user.phone_number || user.phoneNumber || '';
            console.log('📝 [Profile] Set phoneNumber to:', phoneNumberEl.value);
        }
        if (genderEl) {
            genderEl.value = user.gender || '';
            console.log('📝 [Profile] Set gender to:', genderEl.value);
        }
        if (usernameEl) {
            usernameEl.value = user.username || '';
            console.log('📝 [Profile] Set username to:', usernameEl.value);
        }
        
        if (birthDateEl && user.birth_date) {
            try {
                const birthDate = new Date(user.birth_date);
                if (!isNaN(birthDate.getTime())) {
                    birthDateEl.value = birthDate.toISOString().split('T')[0];
                }
            } catch (e) {
                console.warn('⚠️ [Profile] Invalid birth_date format:', user.birth_date);
            }
        }
        
        // Load avatar
        const avatarImage = document.getElementById('avatarImage');
        const avatarIcon = document.getElementById('avatarIcon');
        if (user.avatar) {
            if (avatarImage) {
                avatarImage.src = user.avatar;
                avatarImage.style.display = 'block';
            }
            if (avatarIcon) {
                avatarIcon.style.display = 'none';
            }
        } else {
            if (avatarImage) avatarImage.style.display = 'none';
            if (avatarIcon) avatarIcon.style.display = 'block';
        }
        
        // Update last login
        const lastLoginEl = document.getElementById('lastLogin');
        if (lastLoginEl && user.last_login) {
            try {
                const lastLogin = new Date(user.last_login);
                if (!isNaN(lastLogin.getTime())) {
                    // Format date
                    const formatted = lastLogin.toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    lastLoginEl.textContent = formatted;
                }
            } catch (e) {
                console.warn('⚠️ [Profile] Invalid last_login format:', user.last_login);
                lastLoginEl.textContent = 'Không có thông tin';
            }
        }
        
        console.log('✅ [Profile] Form fields populated');
    } catch (error) {
        console.error('❌ [Profile] Error loading user profile:', error);
        throw new Error('Không thể tải thông tin: ' + error.message);
    }
}

async function checkEmailVerificationStatus() {
    console.log('📧 [Profile] Checking email verification status...');
    try {
        const response = await window.AdminServices.getEmailVerificationStatus();
        console.log('📦 [Profile] Email verification status response:', response);
        
        // Handle different response formats
        let status = response;
        if (response && response.data) {
            status = response.data;
        }
        
        const statusEl = document.getElementById('emailVerificationStatus');
        const sendBtn = document.getElementById('sendVerificationEmailBtn');
        const resendBtn = document.getElementById('resendVerificationEmailBtn');
        
        if (!statusEl) {
            console.warn('⚠️ [Profile] emailVerificationStatus element not found');
            return;
        }
        
        if (status && status.isEmailVerified) {
            statusEl.innerHTML = '<i class="fas fa-check-circle" style="color: var(--success);"></i> Email đã được xác thực';
            if (sendBtn) sendBtn.style.display = 'none';
            if (resendBtn) resendBtn.style.display = 'none';
        } else {
            statusEl.innerHTML = '<i class="fas fa-times-circle" style="color: var(--danger);"></i> Email chưa được xác thực';
            if (sendBtn) sendBtn.style.display = 'inline-block';
            if (resendBtn) resendBtn.style.display = 'none';
        }
        console.log('✅ [Profile] Email verification status updated');
    } catch (error) {
        console.error('❌ [Profile] Error checking email verification status:', error);
        const statusEl = document.getElementById('emailVerificationStatus');
        if (statusEl) {
            statusEl.innerHTML = '<i class="fas fa-exclamation-triangle" style="color: var(--warning);"></i> Không thể kiểm tra trạng thái';
        }
    }
}

async function validateToken() {
    console.log('🔐 [Profile] Validating token...');
    try {
        const response = await window.AdminServices.validateToken();
        console.log('📦 [Profile] Token validation response:', response);
        
        // Handle different response formats
        let result = response;
        if (response && response.data) {
            result = response.data;
        }
        
        const statusEl = document.getElementById('tokenStatus');
        if (!statusEl) {
            console.warn('⚠️ [Profile] tokenStatus element not found');
            return;
        }
        
        if (result && result.valid) {
            statusEl.innerHTML = '<i class="fas fa-check-circle" style="color: var(--success);"></i> Token hợp lệ';
            if (result.token_info && result.token_info.expires_at) {
                try {
                    const expiresAt = new Date(result.token_info.expires_at);
                    if (!isNaN(expiresAt.getTime())) {
                        const formatted = expiresAt.toLocaleString('vi-VN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        statusEl.innerHTML += `<br><small>Hết hạn: ${formatted}</small>`;
                    }
                } catch (e) {
                    console.warn('⚠️ [Profile] Invalid expires_at format:', result.token_info.expires_at);
                }
            }
        } else {
            statusEl.innerHTML = '<i class="fas fa-times-circle" style="color: var(--danger);"></i> Token không hợp lệ';
        }
        console.log('✅ [Profile] Token validation completed');
    } catch (error) {
        console.error('❌ [Profile] Error validating token:', error);
        const statusEl = document.getElementById('tokenStatus');
        if (statusEl) {
            statusEl.innerHTML = '<i class="fas fa-exclamation-triangle" style="color: var(--warning);"></i> Không thể kiểm tra token';
        }
    }
}

function setupEventListeners() {
    console.log('🔧 [Profile] Setting up event listeners...');
    
    // Save profile
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', saveProfile);
        console.log('✅ [Profile] Save profile button listener added');
    } else {
        console.warn('⚠️ [Profile] saveProfileBtn not found');
    }
    
    // Avatar upload
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');
    
    if (changeAvatarBtn && avatarInput) {
        changeAvatarBtn.addEventListener('click', () => avatarInput.click());
        console.log('✅ [Profile] Change avatar button listener added');
    }
    
    if (avatarInput) {
        avatarInput.addEventListener('change', handleAvatarUpload);
        console.log('✅ [Profile] Avatar input listener added');
    }
    
    if (avatarPreview) {
        avatarPreview.addEventListener('click', () => {
            if (avatarInput) avatarInput.click();
        });
        avatarPreview.addEventListener('mouseenter', function() {
            const overlay = this.querySelector('.avatar-overlay');
            if (overlay) overlay.style.display = 'flex';
        });
        avatarPreview.addEventListener('mouseleave', function() {
            const overlay = this.querySelector('.avatar-overlay');
            if (overlay) overlay.style.display = 'none';
        });
        console.log('✅ [Profile] Avatar preview listeners added');
    }
    
    // Email verification
    const checkEmailStatusBtn = document.getElementById('checkEmailStatusBtn');
    const sendVerificationEmailBtn = document.getElementById('sendVerificationEmailBtn');
    const resendVerificationEmailBtn = document.getElementById('resendVerificationEmailBtn');
    const verifyEmailBtn = document.getElementById('verifyEmailBtn');
    
    if (checkEmailStatusBtn) {
        checkEmailStatusBtn.addEventListener('click', checkEmailVerificationStatus);
        console.log('✅ [Profile] Check email status button listener added');
    }
    if (sendVerificationEmailBtn) {
        sendVerificationEmailBtn.addEventListener('click', sendEmailVerification);
        console.log('✅ [Profile] Send verification email button listener added');
    }
    if (resendVerificationEmailBtn) {
        resendVerificationEmailBtn.addEventListener('click', resendEmailVerification);
        console.log('✅ [Profile] Resend verification email button listener added');
    }
    if (verifyEmailBtn) {
        verifyEmailBtn.addEventListener('click', verifyEmail);
        console.log('✅ [Profile] Verify email button listener added');
    }
    
    // Email change
    const requestEmailChangeBtn = document.getElementById('requestEmailChangeBtn');
    const verifyEmailChangeBtn = document.getElementById('verifyEmailChangeBtn');
    const cancelEmailChangeBtn = document.getElementById('cancelEmailChangeBtn');
    
    if (requestEmailChangeBtn) {
        requestEmailChangeBtn.addEventListener('click', requestEmailChange);
        console.log('✅ [Profile] Request email change button listener added');
    }
    if (verifyEmailChangeBtn) {
        verifyEmailChangeBtn.addEventListener('click', verifyEmailChange);
        console.log('✅ [Profile] Verify email change button listener added');
    }
    if (cancelEmailChangeBtn) {
        cancelEmailChangeBtn.addEventListener('click', () => {
            const form = document.getElementById('emailChangeOTPForm');
            if (form) form.style.display = 'none';
            emailChangeRequested = false;
        });
        console.log('✅ [Profile] Cancel email change button listener added');
    }
    
    // Phone verification
    const requestPhoneOTPBtn = document.getElementById('requestPhoneOTPBtn');
    const verifyPhoneOTPBtn = document.getElementById('verifyPhoneOTPBtn');
    const resendPhoneOTPBtn = document.getElementById('resendPhoneOTPBtn');
    
    if (requestPhoneOTPBtn) {
        requestPhoneOTPBtn.addEventListener('click', requestPhoneOTP);
        console.log('✅ [Profile] Request phone OTP button listener added');
    }
    if (verifyPhoneOTPBtn) {
        verifyPhoneOTPBtn.addEventListener('click', verifyPhoneOTP);
        console.log('✅ [Profile] Verify phone OTP button listener added');
    }
    if (resendPhoneOTPBtn) {
        resendPhoneOTPBtn.addEventListener('click', requestPhoneOTP);
        console.log('✅ [Profile] Resend phone OTP button listener added');
    }
    
    // Password change
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', changePassword);
        console.log('✅ [Profile] Change password button listener added');
    }
    
    // Token validation
    const validateTokenBtn = document.getElementById('validateTokenBtn');
    if (validateTokenBtn) {
        validateTokenBtn.addEventListener('click', validateToken);
        console.log('✅ [Profile] Validate token button listener added');
    }
    
    // Form submit handlers
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveProfile();
        });
        console.log('✅ [Profile] Profile form submit listener added');
    }
    
    const emailChangeForm = document.getElementById('emailChangeForm');
    if (emailChangeForm) {
        emailChangeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            requestEmailChange();
        });
        console.log('✅ [Profile] Email change form submit listener added');
    }
    
    const passwordChangeForm = document.getElementById('passwordChangeForm');
    if (passwordChangeForm) {
        passwordChangeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            changePassword();
        });
        console.log('✅ [Profile] Password change form submit listener added');
    }
    
    console.log('✅ [Profile] All event listeners setup completed');
}

async function saveProfile() {
    console.log('💾 [Profile] Saving profile...');
    const btn = document.getElementById('saveProfileBtn');
    if (!btn) {
        showError('Không tìm thấy nút lưu');
        return;
    }
    
    const originalText = btn.innerHTML;
    
    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
        
        clearErrors();
        
        const fullNameEl = document.getElementById('fullName');
        const phoneNumberEl = document.getElementById('phoneNumber');
        const genderEl = document.getElementById('gender');
        const birthDateEl = document.getElementById('birthDate');
        
        // Get values and log for debugging
        const fullName = fullNameEl ? fullNameEl.value.trim() : '';
        const phoneNumber = phoneNumberEl ? phoneNumberEl.value.trim() : '';
        const gender = genderEl ? genderEl.value : '';
        const birthDate = birthDateEl && birthDateEl.value ? birthDateEl.value : undefined;
        
        console.log('📋 [Profile] Form values:', {
            fullName,
            phoneNumber,
            gender,
            birthDate,
            fullNameEl: fullNameEl ? 'exists' : 'missing',
            phoneNumberEl: phoneNumberEl ? 'exists' : 'missing',
            genderEl: genderEl ? 'exists' : 'missing',
            birthDateEl: birthDateEl ? 'exists' : 'missing'
        });
        
        // Kiểm tra phone_number có thay đổi không
        const currentPhone = currentUserData?.phone_number || '';
        const newPhone = phoneNumber.trim();
        const phoneChanged = currentPhone !== newPhone;
        
        // Nếu phone_number thay đổi, không lưu trực tiếp mà hiện dialog confirm
        if (phoneChanged) {
            // Hiện dialog confirm
            const confirmed = await showPhoneChangeConfirmDialog(currentPhone, newPhone);
            if (!confirmed) {
                // User hủy, reset phone number về giá trị cũ
                const phoneNumberEl = document.getElementById('phoneNumber');
                if (phoneNumberEl) {
                    phoneNumberEl.value = currentPhone;
                }
                btn.disabled = false;
                btn.innerHTML = originalText;
                return;
            }
            
            // User đồng ý, gửi yêu cầu thay đổi phone
            try {
                showLoading();
                const phoneChangeResponse = await window.AdminServices.requestPhoneChange(newPhone);
                console.log('📦 [Profile] Phone change request response:', phoneChangeResponse);
                
                phoneChangeRequested = true;
                phoneChangeStep = phoneChangeResponse.step;
                phoneChangeData = phoneChangeResponse;
                
                // Hiển thị form nhập OTP
                showPhoneChangeOTPDialog(phoneChangeResponse);
                
                // Không lưu phone_number vào profile, đợi xác thực OTP
                // Reset phone number về giá trị cũ trong form
                const phoneNumberEl = document.getElementById('phoneNumber');
                if (phoneNumberEl) {
                    phoneNumberEl.value = currentPhone;
                }
                
                btn.disabled = false;
                btn.innerHTML = originalText;
                hideLoading();
                return; // Không tiếp tục lưu profile
            } catch (error) {
                console.error('❌ [Profile] Error requesting phone change:', error);
                showError('Không thể gửi yêu cầu thay đổi số điện thoại: ' + error.message);
                // Reset phone number về giá trị cũ
                const phoneNumberEl = document.getElementById('phoneNumber');
                if (phoneNumberEl) {
                    phoneNumberEl.value = currentPhone;
                }
                btn.disabled = false;
                btn.innerHTML = originalText;
                hideLoading();
                return;
            }
        }
        
        // Nếu phone_number không thay đổi, tiếp tục lưu profile bình thường
        const updateData = {
            full_name: fullName,
            // KHÔNG gửi phone_number nếu không thay đổi hoặc đã xử lý ở trên
            gender: gender,
            birth_date: birthDate
        };
        
        // Remove undefined, null, or empty string fields
        const cleanedData = {};
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && updateData[key] !== null && updateData[key] !== '') {
                cleanedData[key] = updateData[key];
            }
        });
        
        console.log('📤 [Profile] Sending update data:', cleanedData);
        
        if (!cleanedData.full_name) {
            showFieldError('fullName', 'Tên đầy đủ là bắt buộc');
            btn.disabled = false;
            btn.innerHTML = originalText;
            return;
        }
        
        const response = await window.AdminServices.updateProfile(cleanedData);
        console.log('📦 [Profile] Update profile response:', response);
        console.log('📦 [Profile] Response type:', typeof response);
        console.log('📦 [Profile] Response keys:', response ? Object.keys(response) : 'null');
        
        // Backend trả về: { message: "User updated successfully", user: {...} }
        // AdminServices.request() sẽ trả về toàn bộ response vì không có format { success: true, data: {...} }
        
        let updatedUser = null;
        if (response && response.user) {
            // Format: { message: "...", user: {...} }
            updatedUser = response.user;
            console.log('✅ [Profile] Extracted user from response.user');
        } else if (response && !response.message && !response.success && typeof response === 'object') {
            // Format: Direct user object (nếu backend trả về user trực tiếp)
            updatedUser = response;
            console.log('✅ [Profile] Response is direct user object');
        } else if (response && response.data) {
            // Format: { data: {...} } hoặc { success: true, data: {...} }
            updatedUser = response.data.user || response.data;
            console.log('✅ [Profile] Extracted user from response.data');
        }
        
        if (updatedUser) {
            currentUserData = { ...currentUserData, ...updatedUser };
            console.log('✅ [Profile] Updated user data:', currentUserData);
        } else {
            console.warn('⚠️ [Profile] Could not extract user from response:', response);
            // Vẫn show success nếu có message
            if (response && response.message) {
                console.log('ℹ️ [Profile] Response has message but no user data, will reload profile');
            }
        }
        
        showSuccess('Cập nhật thông tin thành công!');
        // Reload profile to get latest data from server
        await loadUserProfile();
    } catch (error) {
        console.error('❌ [Profile] Error saving profile:', error);
        showError('Không thể cập nhật thông tin: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
        showFieldError('avatarError', 'Vui lòng chọn file ảnh');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showFieldError('avatarError', 'Kích thước ảnh không được vượt quá 5MB');
        return;
    }
    
    try {
        showLoading();
        clearFieldError('avatarError');
        
        // Upload avatar
        const avatarUrl = await window.AdminServices.uploadAvatar(file);
        console.log('📤 [Profile] Avatar uploaded:', avatarUrl);
        
        // Update profile with new avatar URL
        await window.AdminServices.updateProfile({ avatar: avatarUrl });
        console.log('✅ [Profile] Profile updated with new avatar');
        
        // Update UI
        const avatarImage = document.getElementById('avatarImage');
        const avatarIcon = document.getElementById('avatarIcon');
        avatarImage.src = avatarUrl;
        avatarImage.style.display = 'block';
        avatarIcon.style.display = 'none';
        
        showSuccess('Cập nhật ảnh đại diện thành công!');
    } catch (error) {
        showFieldError('avatarError', 'Không thể upload ảnh: ' + error.message);
    } finally {
        hideLoading();
        e.target.value = '';
    }
}

async function sendEmailVerification() {
    console.log('📧 [Profile] Sending email verification...');
    try {
        showLoading();
        const emailEl = document.getElementById('email');
        const email = emailEl ? emailEl.value : '';
        
        if (!email) {
            showError('Vui lòng nhập email');
            return;
        }
        
        await window.AdminServices.sendEmailVerification(email, 'registration');
        showSuccess('Email xác thực đã được gửi. Vui lòng kiểm tra hộp thư của bạn.');
        
        const form = document.getElementById('emailVerificationForm');
        const sendBtn = document.getElementById('sendVerificationEmailBtn');
        const resendBtn = document.getElementById('resendVerificationEmailBtn');
        
        if (form) form.style.display = 'block';
        if (sendBtn) sendBtn.style.display = 'none';
        if (resendBtn) resendBtn.style.display = 'inline-block';
    } catch (error) {
        console.error('❌ [Profile] Error sending email verification:', error);
        showError('Không thể gửi email xác thực: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function resendEmailVerification() {
    console.log('📧 [Profile] Resending email verification...');
    try {
        showLoading();
        await window.AdminServices.resendEmailVerification();
        showSuccess('Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.');
    } catch (error) {
        console.error('❌ [Profile] Error resending email verification:', error);
        showError('Không thể gửi lại email: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function verifyEmail() {
    console.log('📧 [Profile] Verifying email...');
    const tokenEl = document.getElementById('emailVerificationToken');
    const token = tokenEl ? tokenEl.value.trim() : '';
    
    if (!token) {
        showFieldError('emailVerificationError', 'Vui lòng nhập mã xác thực');
        return;
    }
    
    try {
        showLoading();
        clearFieldError('emailVerificationError');
        await window.AdminServices.verifyEmail(token, 'registration');
        showSuccess('Email đã được xác thực thành công!');
        
        const form = document.getElementById('emailVerificationForm');
        if (form) form.style.display = 'none';
        
        await checkEmailVerificationStatus();
    } catch (error) {
        console.error('❌ [Profile] Error verifying email:', error);
        showFieldError('emailVerificationError', error.message);
    } finally {
        hideLoading();
    }
}

async function requestEmailChange() {
    console.log('📧 [Profile] Requesting email change...');
    const newEmailEl = document.getElementById('newEmail');
    const currentPasswordEl = document.getElementById('currentPasswordForEmail');
    
    const newEmail = newEmailEl ? newEmailEl.value.trim() : '';
    const currentPassword = currentPasswordEl ? currentPasswordEl.value : '';
    
    clearErrors();
    
    if (!newEmail) {
        showFieldError('newEmailError', 'Vui lòng nhập email mới');
        return;
    }
    
    if (!currentPassword) {
        showFieldError('currentPasswordForEmailError', 'Vui lòng nhập mật khẩu hiện tại');
        return;
    }
    
    try {
        showLoading();
        const response = await window.AdminServices.requestEmailChange(newEmail, currentPassword);
        console.log('📦 [Profile] Email change request response:', response);
        
        // Kiểm tra response có step và requires_verification không
        if (response.step === 'verify_emails' && response.requires_verification) {
            showSuccess(response.message || 'Mã OTP đã được gửi đến cả email cũ và email mới. Vui lòng kiểm tra và nhập mã OTP.');
            
            const form = document.getElementById('emailChangeOTPForm');
            if (form) {
                form.style.display = 'block';
                
                // Cập nhật thông tin email trong form
                const oldEmailLabel = form.querySelector('label[for="oldEmailOtp"]');
                const newEmailLabel = form.querySelector('label[for="newEmailOtp"]');
                if (oldEmailLabel && response.old_email) {
                    oldEmailLabel.textContent = `OTP từ email cũ (${response.old_email})`;
                }
                if (newEmailLabel && response.new_email) {
                    newEmailLabel.textContent = `OTP từ email mới (${response.new_email})`;
                }
                
                // Cập nhật instructions nếu có
                const instructionsEl = form.querySelector('.info-message');
                if (instructionsEl && response.instructions) {
                    instructionsEl.innerHTML = `<i class="fas fa-info-circle"></i> ${response.instructions}`;
                }
            }
            emailChangeRequested = true;
        } else {
            // Fallback: hiển thị form OTP nếu không có step
            showSuccess('Mã OTP đã được gửi đến cả email cũ và email mới. Vui lòng kiểm tra và nhập mã OTP.');
            const form = document.getElementById('emailChangeOTPForm');
            if (form) form.style.display = 'block';
            emailChangeRequested = true;
        }
    } catch (error) {
        console.error('❌ [Profile] Error requesting email change:', error);
        showError('Không thể gửi yêu cầu đổi email: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function verifyEmailChange() {
    console.log('📧 [Profile] Verifying email change...');
    const oldEmailOtpEl = document.getElementById('oldEmailOtp');
    const newEmailOtpEl = document.getElementById('newEmailOtp');
    
    const oldEmailOtp = oldEmailOtpEl ? oldEmailOtpEl.value.trim() : '';
    const newEmailOtp = newEmailOtpEl ? newEmailOtpEl.value.trim() : '';
    
    clearErrors();
    
    if (!oldEmailOtp) {
        showFieldError('oldEmailOtpError', 'Vui lòng nhập OTP từ email cũ');
        return;
    }
    
    if (!newEmailOtp) {
        showFieldError('newEmailOtpError', 'Vui lòng nhập OTP từ email mới');
        return;
    }
    
    try {
        showLoading();
        await window.AdminServices.verifyEmailChange(oldEmailOtp, newEmailOtp);
        showSuccess('Đổi email thành công!');
        
        const form = document.getElementById('emailChangeOTPForm');
        const newEmailEl = document.getElementById('newEmail');
        const currentPasswordEl = document.getElementById('currentPasswordForEmail');
        
        if (form) form.style.display = 'none';
        if (newEmailEl) newEmailEl.value = '';
        if (currentPasswordEl) currentPasswordEl.value = '';
        
        emailChangeRequested = false;
        await loadUserProfile();
    } catch (error) {
        console.error('❌ [Profile] Error verifying email change:', error);
        showError('Không thể xác thực đổi email: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function requestPhoneOTP() {
    console.log('📱 [Profile] Requesting phone OTP...');
    const phoneEl = document.getElementById('phoneForVerification');
    const phone = phoneEl ? phoneEl.value.trim() : '';
    
    clearErrors();
    
    if (!phone) {
        showFieldError('phoneForVerificationError', 'Vui lòng nhập số điện thoại');
        return;
    }
    
    try {
        showLoading();
        await window.AdminServices.requestSMSOTP(phone);
        showSuccess('Mã OTP đã được gửi đến số điện thoại của bạn.');
        
        const form = document.getElementById('phoneOTPForm');
        const otpEl = document.getElementById('phoneOtp');
        
        if (form) form.style.display = 'block';
        if (otpEl) {
            otpEl.value = '';
            otpEl.focus();
        }
    } catch (error) {
        console.error('❌ [Profile] Error requesting phone OTP:', error);
        showError('Không thể gửi OTP: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function verifyPhoneOTP() {
    console.log('📱 [Profile] Verifying phone OTP...');
    const phoneEl = document.getElementById('phoneForVerification');
    const otpEl = document.getElementById('phoneOtp');
    
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const otp = otpEl ? otpEl.value.trim() : '';
    
    clearErrors();
    
    if (!otp || otp.length !== 4) {
        showFieldError('phoneOtpError', 'Vui lòng nhập mã OTP 4 số');
        return;
    }
    
    try {
        showLoading();
        await window.AdminServices.verifySMSOTP(phone, otp);
        showSuccess('Xác thực số điện thoại thành công!');
        
        const form = document.getElementById('phoneOTPForm');
        if (form) form.style.display = 'none';
        if (phoneEl) phoneEl.value = '';
        
        await loadUserProfile();
    } catch (error) {
        console.error('❌ [Profile] Error verifying phone OTP:', error);
        showFieldError('phoneOtpError', error.message);
    } finally {
        hideLoading();
    }
}

async function changePassword() {
    console.log('🔐 [Profile] Changing password...');
    const currentPasswordEl = document.getElementById('currentPassword');
    const newPasswordEl = document.getElementById('newPassword');
    const confirmPasswordEl = document.getElementById('confirmPassword');
    
    const currentPassword = currentPasswordEl ? currentPasswordEl.value : '';
    const newPassword = newPasswordEl ? newPasswordEl.value : '';
    const confirmPassword = confirmPasswordEl ? confirmPasswordEl.value : '';
    
    clearErrors();
    
    if (!currentPassword) {
        showFieldError('currentPasswordError', 'Vui lòng nhập mật khẩu hiện tại');
        return;
    }
    
    if (!newPassword) {
        showFieldError('newPasswordError', 'Vui lòng nhập mật khẩu mới');
        return;
    }
    
    if (newPassword.length < 6) {
        showFieldError('newPasswordError', 'Mật khẩu phải có ít nhất 6 ký tự');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showFieldError('confirmPasswordError', 'Mật khẩu xác nhận không khớp');
        return;
    }
    
    try {
        showLoading();
        await window.AdminServices.changePassword(currentPassword, newPassword);
        showSuccess('Đổi mật khẩu thành công!');
        
        if (currentPasswordEl) currentPasswordEl.value = '';
        if (newPasswordEl) newPasswordEl.value = '';
        if (confirmPasswordEl) confirmPasswordEl.value = '';
    } catch (error) {
        console.error('❌ [Profile] Error changing password:', error);
        showError('Không thể đổi mật khẩu: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Helper functions
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

function showSuccess(message) {
    // Try to use showToast from admin-layout.js
    if (typeof showToast === 'function') {
        showToast(message, 'success');
    } else if (window.showToast) {
        window.showToast(message, 'success');
    } else {
        // Fallback to alert
        alert('✓ ' + message);
    }
}

function showError(message) {
    // Try to use showToast from admin-layout.js
    if (typeof showToast === 'function') {
        showToast(message, 'error');
    } else if (window.showToast) {
        window.showToast(message, 'error');
    } else {
        // Fallback to alert
        alert('✗ ' + message);
    }
}

function showFieldError(fieldId, message) {
    const errorEl = document.getElementById(fieldId + 'Error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

function clearFieldError(fieldId) {
    const errorEl = document.getElementById(fieldId + 'Error');
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
    }
}

function clearErrors() {
    document.querySelectorAll('.form-error').forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
}

// ==================== Phone Change Dialogs ====================

/**
 * Hiển thị dialog xác nhận thay đổi số điện thoại
 * @param {string} currentPhone - Số điện thoại hiện tại
 * @param {string} newPhone - Số điện thoại mới
 * @returns {Promise<boolean>} true nếu user đồng ý, false nếu hủy
 */
function showPhoneChangeConfirmDialog(currentPhone, newPhone) {
    return new Promise((resolve) => {
        const isAdding = !currentPhone || currentPhone.trim() === '';
        const title = isAdding ? 'Thêm số điện thoại' : 'Đổi số điện thoại';
        const message = isAdding 
            ? `Bạn có muốn thêm số điện thoại <strong>${newPhone}</strong> không?<br><br>Mã OTP sẽ được gửi đến số điện thoại này để xác thực.`
            : `Bạn có muốn đổi số điện thoại từ <strong>${currentPhone}</strong> sang <strong>${newPhone}</strong> không?<br><br>Mã OTP sẽ được gửi đến cả số điện thoại cũ và số mới để xác thực.`;
        
        const modal = document.createElement('div');
        modal.className = 'admin-modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div class="admin-modal" style="
                background: white;
                border-radius: 8px;
                padding: 2rem;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            ">
                <h3 style="margin: 0 0 1rem 0; font-size: 1.5rem; color: #1f2937;">
                    <i class="fas fa-phone me-2"></i>${title}
                </h3>
                <div style="margin-bottom: 1.5rem; color: #4b5563; line-height: 1.6;">
                    ${message}
                </div>
                <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
                    <button class="btn btn-secondary" id="phoneChangeCancelBtn" style="min-width: 100px;">
                        <i class="fas fa-times"></i> Hủy
                    </button>
                    <button class="btn btn-primary" id="phoneChangeConfirmBtn" style="min-width: 100px;">
                        <i class="fas fa-check"></i> Đồng ý
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const cancelBtn = modal.querySelector('#phoneChangeCancelBtn');
        const confirmBtn = modal.querySelector('#phoneChangeConfirmBtn');
        
        cancelBtn.addEventListener('click', () => {
            modal.remove();
            resolve(false);
        });
        
        confirmBtn.addEventListener('click', () => {
            modal.remove();
            resolve(true);
        });
        
        // Đóng khi click outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve(false);
            }
        });
    });
}

/**
 * Hiển thị dialog nhập OTP cho phone change
 * @param {Object} response - Response từ requestPhoneChange
 */
function showPhoneChangeOTPDialog(response) {
    console.log('📱 [Profile] Showing phone change OTP dialog:', response);
    
    const step = response.step;
    const isOldPhoneStep = step === 'verify_old_phone';
    const isNewPhoneStep = step === 'verify_new_phone';
    
    const modal = document.createElement('div');
    modal.className = 'admin-modal-overlay';
    modal.id = 'phoneChangeOTPModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    let title, message, otpFields;
    
    if (isOldPhoneStep) {
        title = 'Xác thực số điện thoại cũ';
        message = `Mã OTP đã được gửi đến số điện thoại hiện tại <strong>${response.old_phone}</strong>. Vui lòng nhập mã OTP để tiếp tục.`;
        otpFields = `
            <div class="form-group" style="margin-bottom: 1rem">
                <label class="form-label">OTP từ số điện thoại cũ (${response.old_phone})</label>
                <input
                    type="text"
                    id="phoneChangeOldOtp"
                    class="form-input"
                    placeholder="Nhập mã OTP 4 số"
                    maxlength="4"
                    style="
                        font-size: 1.5rem;
                        text-align: center;
                        letter-spacing: 0.5rem;
                    "
                />
                <div class="form-error" id="phoneChangeOldOtpError"></div>
            </div>
        `;
    } else if (isNewPhoneStep) {
        title = 'Xác thực số điện thoại mới';
        const phone = response.phone || response.new_phone;
        message = `Mã OTP đã được gửi đến số điện thoại mới <strong>${phone}</strong>. Vui lòng nhập mã OTP để hoàn tất.`;
        otpFields = `
            <div class="form-group" style="margin-bottom: 1rem">
                <label class="form-label">OTP từ số điện thoại mới (${phone})</label>
                <input
                    type="text"
                    id="phoneChangeNewOtp"
                    class="form-input"
                    placeholder="Nhập mã OTP 4 số"
                    maxlength="4"
                    style="
                        font-size: 1.5rem;
                        text-align: center;
                        letter-spacing: 0.5rem;
                    "
                />
                <div class="form-error" id="phoneChangeNewOtpError"></div>
            </div>
        `;
    } else {
        // Fallback: hiển thị cả 2 trường nếu không rõ step
        title = 'Xác thực số điện thoại';
        message = `Mã OTP đã được gửi đến số điện thoại. Vui lòng nhập mã OTP.`;
        otpFields = `
            ${response.old_phone ? `
            <div class="form-group" style="margin-bottom: 1rem">
                <label class="form-label">OTP từ số điện thoại cũ (${response.old_phone})</label>
                <input
                    type="text"
                    id="phoneChangeOldOtp"
                    class="form-input"
                    placeholder="Nhập mã OTP 4 số"
                    maxlength="4"
                    style="font-size: 1.5rem; text-align: center; letter-spacing: 0.5rem;"
                />
                <div class="form-error" id="phoneChangeOldOtpError"></div>
            </div>
            ` : ''}
            <div class="form-group" style="margin-bottom: 1rem">
                <label class="form-label">OTP từ số điện thoại mới (${response.phone || response.new_phone})</label>
                <input
                    type="text"
                    id="phoneChangeNewOtp"
                    class="form-input"
                    placeholder="Nhập mã OTP 4 số"
                    maxlength="4"
                    style="font-size: 1.5rem; text-align: center; letter-spacing: 0.5rem;"
                />
                <div class="form-error" id="phoneChangeNewOtpError"></div>
            </div>
        `;
    }
    
    modal.innerHTML = `
        <div class="admin-modal" style="
            background: white;
            border-radius: 8px;
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        ">
            <h3 style="margin: 0 0 1rem 0; font-size: 1.5rem; color: #1f2937;">
                <i class="fas fa-sms me-2"></i>${title}
            </h3>
            <div style="
                margin-bottom: 1.5rem;
                padding: 0.75rem;
                background: var(--info, #3b82f6);
                color: white;
                border-radius: var(--radius-md, 6px);
            ">
                <i class="fas fa-info-circle"></i> ${message}
            </div>
            <form id="phoneChangeOTPForm" onsubmit="event.preventDefault(); return false;">
                ${otpFields}
                <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem;">
                    <button type="button" class="btn btn-secondary" id="phoneChangeOTPCancelBtn" style="min-width: 100px;">
                        <i class="fas fa-times"></i> Hủy
                    </button>
                    <button type="submit" class="btn btn-primary" id="phoneChangeOTPVerifyBtn" style="min-width: 100px;">
                        <i class="fas fa-check"></i> Xác thực
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus vào input OTP
    const otpInput = modal.querySelector('#phoneChangeOldOtp') || modal.querySelector('#phoneChangeNewOtp');
    if (otpInput) {
        setTimeout(() => otpInput.focus(), 100);
    }
    
    // Event listeners
    const cancelBtn = modal.querySelector('#phoneChangeOTPCancelBtn');
    const verifyBtn = modal.querySelector('#phoneChangeOTPVerifyBtn');
    const form = modal.querySelector('#phoneChangeOTPForm');
    
    cancelBtn.addEventListener('click', () => {
        phoneChangeRequested = false;
        phoneChangeStep = null;
        phoneChangeData = null;
        modal.remove();
    });
    
    form.addEventListener('submit', async () => {
        await verifyPhoneChangeOTP(modal);
    });
    
    verifyBtn.addEventListener('click', async () => {
        await verifyPhoneChangeOTP(modal);
    });
    
    // Đóng khi click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            phoneChangeRequested = false;
            phoneChangeStep = null;
            phoneChangeData = null;
            modal.remove();
        }
    });
}

/**
 * Xác thực OTP cho phone change
 * @param {HTMLElement} modal - Modal element
 */
async function verifyPhoneChangeOTP(modal) {
    console.log('📱 [Profile] Verifying phone change OTP...');
    
    const oldOtpEl = modal.querySelector('#phoneChangeOldOtp');
    const newOtpEl = modal.querySelector('#phoneChangeNewOtp');
    
    let otp = '';
    if (phoneChangeStep === 'verify_old_phone' && oldOtpEl) {
        otp = oldOtpEl.value.trim();
    } else if (phoneChangeStep === 'verify_new_phone' && newOtpEl) {
        otp = newOtpEl.value.trim();
    } else if (newOtpEl) {
        otp = newOtpEl.value.trim();
    }
    
    // Clear errors
    const errorEls = modal.querySelectorAll('.form-error');
    errorEls.forEach(el => el.textContent = '');
    
    if (!otp || otp.length !== 4) {
        const errorEl = oldOtpEl ? modal.querySelector('#phoneChangeOldOtpError') : modal.querySelector('#phoneChangeNewOtpError');
        if (errorEl) {
            errorEl.textContent = 'Vui lòng nhập mã OTP 4 số';
        }
        return;
    }
    
    try {
        showLoading();
        const verifyBtn = modal.querySelector('#phoneChangeOTPVerifyBtn');
        if (verifyBtn) {
            verifyBtn.disabled = true;
            verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xác thực...';
        }
        
        const response = await window.AdminServices.verifyPhoneChange(otp);
        console.log('📦 [Profile] Phone change verify response:', response);
        
        // Kiểm tra nếu cần xác thực bước tiếp theo
        if (response.step === 'verify_new_phone') {
            // Đã xác thực số cũ, cần xác thực số mới
            phoneChangeStep = 'verify_new_phone';
            phoneChangeData = response;
            
            showSuccess('Xác thực số điện thoại cũ thành công. Mã OTP đã được gửi đến số điện thoại mới.');
            
            // Cập nhật dialog để hiển thị form nhập OTP số mới
            modal.remove();
            showPhoneChangeOTPDialog(response);
        } else {
            // Hoàn tất xác thực
            showSuccess(response.message || 'Thay đổi số điện thoại thành công!');
            
            phoneChangeRequested = false;
            phoneChangeStep = null;
            phoneChangeData = null;
            modal.remove();
            
            // Reload profile để lấy số điện thoại mới
            await loadUserProfile();
        }
    } catch (error) {
        console.error('❌ [Profile] Error verifying phone change OTP:', error);
        const errorEl = oldOtpEl ? modal.querySelector('#phoneChangeOldOtpError') : modal.querySelector('#phoneChangeNewOtpError');
        if (errorEl) {
            errorEl.textContent = error.message || 'Mã OTP không đúng hoặc đã hết hạn';
        }
    } finally {
        hideLoading();
        const verifyBtn = modal.querySelector('#phoneChangeOTPVerifyBtn');
        if (verifyBtn) {
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = '<i class="fas fa-check"></i> Xác thực';
        }
    }
}

