const uploadDialog = document.getElementById('uploadDialog');

document.getElementById('settingsLink').onclick = () => {
    document.getElementById('mainSidebar').classList.add('hidden');  // ẩn sidebar chính
    document.getElementById('settingsSidebar').classList.remove('hidden');  // hiện sidebar cài đặt
};

document.getElementById('backButton').onclick = () => {
    document.getElementById('settingsSidebar').classList.add('hidden');  // ẩn sidebar cài đặt
    document.getElementById('mainSidebar').classList.remove('hidden');  // hiện sidebar chính
};

document.getElementById('logoutButton').onclick = () => {
    fetch('login')
        .then(res => {
            if (res.ok) {
                alert('Đã đăng xuất, chuyển hướng đến trang đăng nhập.');
                window.location.href = 'login';
            } else {
                alert('Không tìm thấy file login.html, vui lòng tạo file này.');
            }
        })
        .catch(() => {
            alert('Không thể kiểm tra file login. Có thể đường dẫn sai hoặc server chưa chạy.');
        });
};

document.getElementById('changeAvatarButton').onclick = () => {
    uploadDialog.showModal();  // mở hộp thoại chọn ảnh
    const uploadMsg = document.getElementById('uploadMessage');
    uploadMsg.style.display = 'none';  // ẩn thông báo cũ nếu có
    uploadMsg.textContent = '';
    uploadMsg.className = '';
};

document.getElementById('uploadButton').onclick = async () => {
    const fileInput = document.getElementById('avatarUpload');
    const file = fileInput.files[0];

    if (!file) {
        alert('Vui lòng chọn một ảnh.');
        return;
    }

    if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn một file ảnh hợp lệ.');
        return;
    }

    // Lấy token và userId từ localStorage
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
        alert('Bạn chưa đăng nhập hoặc token/userId không hợp lệ. Vui lòng đăng nhập lại.');
        return;
    }

    // Hiển thị loading
    const uploadBtn = document.getElementById('uploadButton');
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Đang tải...';

    try {
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('avatar', file);
        formData.append('avatar_url', ''); // nếu API yêu cầu

        console.log('Gửi lên API với token:', token);

       const response = await fetch('https://server-shelf-stacker.onrender.com/api/user-upload/avatar', {
    method: 'POST',
    body: formData,
    headers: {
        'Authorization': `Bearer ${token}`
    }
});


        if (response.ok) {
            const result = await response.json();

            if (result.avatar) {
                document.getElementById('sidebarAvatar').src = result.avatar;
                document.getElementById('headerAvatar').src = result.avatar;
            } else {
                // Nếu API không trả avatar, hiển thị tạm ảnh local
                const reader = new FileReader();
                reader.onload = () => {
                    document.getElementById('sidebarAvatar').src = reader.result;
                    document.getElementById('headerAvatar').src = reader.result;
                };
                reader.readAsDataURL(file);
            }

            const uploadMsg = document.getElementById('uploadMessage');
            uploadMsg.style.display = 'block';
            uploadMsg.textContent = 'Đã cập nhật ảnh đại diện thành công!';
            uploadMsg.className = 'success-message';

            // Đóng dialog sau 2 giây
            setTimeout(() => {
                uploadDialog.close();
            }, 2000);

        } else {
            let errorText = 'Lỗi khi tải ảnh lên';
            try {
                const errorResult = await response.json();
                if (errorResult.message) errorText = errorResult.message;
            } catch {
                // Không parse được JSON lỗi, giữ nguyên errorText
            }
            throw new Error(errorText);
        }

    } catch (error) {
        console.error('Lỗi upload avatar:', error);

        const uploadMsg = document.getElementById('uploadMessage');
        uploadMsg.style.display = 'block';
        uploadMsg.textContent = 'Lỗi: ' + error.message;
        uploadMsg.className = 'error-message';

    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Tải lên';
        // Reset lại file input nếu cần
        fileInput.value = '';
    }
};

document.getElementById('cancelButton').onclick = () => {
    uploadDialog.close();
};

uploadDialog.addEventListener('close', () => {
    const fileInput = document.getElementById('avatarUpload');
    fileInput.value = '';
    const uploadMsg = document.getElementById('uploadMessage');
    uploadMsg.style.display = 'none';
    uploadMsg.textContent = '';
    uploadMsg.className = '';
});
