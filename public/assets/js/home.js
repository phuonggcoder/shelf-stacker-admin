
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
          alert('Đã đăng xuất, chuyển hướng đến trang đăng nhập.');  // đăng xuất thành công
          window.location.href = 'login';  // chuyển trang
        } else {
          alert('Không tìm thấy file login.html, vui lòng tạo file này.');  // file không tồn tại
        }
      })
      .catch(() => {
        alert('Không thể kiểm tra file login. Có thể đường dẫn sai hoặc server chưa chạy.');  // lỗi gọi fetch
      });
  };

  document.getElementById('changeAvatarButton').onclick = () => {
    uploadDialog.showModal();  // mở hộp thoại chọn ảnh
    document.getElementById('uploadMessage').style.display = 'none';  // ẩn thông báo cũ nếu có
  };

  document.getElementById('uploadButton').onclick = () => {
    const file = document.getElementById('avatarUpload').files[0];  // lấy file được chọn

    if (!file) {
      alert('Vui lòng chọn một ảnh.');  // không có file thì thông báo
      return;
    }

    const reader = new FileReader();  // tạo đối tượng FileReader để đọc ảnh

    reader.onload = () => {
      document.getElementById('sidebarAvatar').src = reader.result;  // cập nhật ảnh sidebar
      document.getElementById('headerAvatar').src = reader.result;  // cập nhật ảnh header
      document.getElementById('uploadMessage').style.display = 'block';  // hiện thông báo đã tải ảnh

      // nếu muốn gọi API upload ảnh thì viết thêm fetch ở đây
    };

    reader.readAsDataURL(file);  // đọc file thành chuỗi base64
  };

