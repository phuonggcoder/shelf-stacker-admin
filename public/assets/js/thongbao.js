document.addEventListener('DOMContentLoaded', () => {
  const BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

  // Kiểm tra token đăng nhập
  const authToken = localStorage.getItem('authToken');
  const sendButton = document.getElementById('sendNotification');
  const viewStatsButton = document.getElementById('viewStats');
  const statusDiv = document.getElementById('notificationStatus');
  const logoutButton = document.getElementById('logoutButton');

  if (!authToken) {
    sendButton.disabled = true;
    viewStatsButton.disabled = true;
    statusDiv.style.display = 'block';
    statusDiv.classList.add('error-message');
    statusDiv.textContent = 'Vui lòng đăng nhập để gửi thông báo';
    return;
  }

  // Xử lý đăng xuất
  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    window.location.href = '/login';
  });

  // Xử lý hiển thị các trường dựa trên loại thông báo
  document.getElementById('notificationType').addEventListener('change', function () {
    const userIdLabel = document.getElementById('userIdLabel');
    const userIdInput = document.getElementById('userId');
    const userIdsLabel = document.getElementById('userIdsLabel');
    const userIdsInput = document.getElementById('userIds');
    const orderIdLabel = document.getElementById('orderIdLabel');
    const orderIdInput = document.getElementById('orderId');
    const orderStatusLabel = document.getElementById('orderStatusLabel');
    const orderStatusSelect = document.getElementById('orderStatus');
    const paymentStatusLabel = document.getElementById('paymentStatusLabel');
    const paymentStatusSelect = document.getElementById('paymentStatus');
    const paymentMethodLabel = document.getElementById('paymentMethodLabel');
    const paymentMethodSelect = document.getElementById('paymentMethod');
    const amountLabel = document.getElementById('amountLabel');
    const amountInput = document.getElementById('amount');
    const discountLabel = document.getElementById('discountLabel');
    const discountInput = document.getElementById('discount');
    const validUntilLabel = document.getElementById('validUntilLabel');
    const validUntilInput = document.getElementById('validUntil');
    const messageInput = document.getElementById('notificationMessage');
    const titleInput = document.getElementById('notificationTitle');

    // Ẩn tất cả các trường bổ sung trước
    [
      userIdLabel, userIdInput, userIdsLabel, userIdsInput, orderIdLabel, orderIdInput, orderStatusLabel, orderStatusSelect,
      paymentStatusLabel, paymentStatusSelect, paymentMethodLabel, paymentMethodSelect, amountLabel, amountInput,
      discountLabel, discountInput, validUntilLabel, validUntilInput
    ].forEach(el => el.style.display = 'none');

    // Cập nhật placeholder mặc định
    messageInput.placeholder = 'Nhập nội dung thông báo';
    titleInput.placeholder = 'Nhập tiêu đề thông báo';

    switch (this.value) {
      case 'byUserId':
        userIdLabel.style.display = 'block';
        userIdInput.style.display = 'block';
        messageInput.placeholder = 'Ví dụ: Chào mừng bạn quay trở lại!';
        titleInput.placeholder = 'Ví dụ: Đăng nhập thành công';
        break;
      case 'multicast':
        userIdsLabel.style.display = 'block';
        userIdsInput.style.display = 'block';
        messageInput.placeholder = 'Ví dụ: Cập nhật mới từ hệ thống!';
        titleInput.placeholder = 'Ví dụ: Thông báo hệ thống';
        break;
      case 'order':
        [userIdLabel, userIdInput, orderIdLabel, orderIdInput, orderStatusLabel, orderStatusSelect, amountLabel, amountInput]
          .forEach(el => el.style.display = 'block');
        messageInput.placeholder = 'Ví dụ: Đơn hàng {orderID} trạng thái {orderStatus}';
        titleInput.placeholder = 'Ví dụ: Cập nhật đơn hàng';
        break;
      case 'payment':
        [userIdLabel, userIdInput, orderIdLabel, orderIdInput, paymentStatusLabel, paymentStatusSelect, paymentMethodLabel,
          paymentMethodSelect, amountLabel, amountInput].forEach(el => el.style.display = 'block');
        messageInput.placeholder = 'Ví dụ: Thanh toán {paymentStatus} cho đơn hàng {orderID}';
        titleInput.placeholder = 'Ví dụ: Cập nhật thanh toán';
        break;
      case 'marketing':
        userIdLabel.style.display = 'block';
        userIdInput.style.display = 'block';
        userIdInput.placeholder = 'Nhập User ID (để trống để gửi tất cả)';
        messageInput.placeholder = 'Ví dụ: Flash Sale - Giảm giá 70% cho tất cả sách!';
        titleInput.placeholder = 'Ví dụ: Ưu đãi đặc biệt';
        break;
      case 'promotion':
        [userIdLabel, userIdInput, discountLabel, discountInput, validUntilLabel, validUntilInput]
          .forEach(el => el.style.display = 'block');
        userIdInput.placeholder = 'Nhập User ID (để trống để gửi tất cả)';
        messageInput.placeholder = 'Ví dụ: Khuyến mãi giảm giá {discount}% đến {validUntil}';
        titleInput.placeholder = 'Ví dụ: Ưu đãi đặc biệt';
        break;
      case 'system':
        messageInput.placeholder = 'Ví dụ: Hệ thống sẽ bảo trì từ 2:00 - 4:00 sáng mai';
        titleInput.placeholder = 'Ví dụ: Thông báo hệ thống';
        break;
    }
  });

  // Xử lý gửi thông báo
  document.getElementById('sendNotification').addEventListener('click', async function () {
    const sendButton = document.getElementById('sendNotification');
    sendButton.disabled = true; // Disable nút khi bắt đầu gửi

    const type = document.getElementById('notificationType').value;
    const userId = document.getElementById('userId').value.trim();
    const userIds = document.getElementById('userIds').value.trim();
    const orderId = document.getElementById('orderId').value.trim();
    const orderStatus = document.getElementById('orderStatus').value;
    const paymentStatus = document.getElementById('paymentStatus').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const amount = document.getElementById('amount').value.trim();
    const discount = document.getElementById('discount').value.trim();
    const validUntil = document.getElementById('validUntil').value.trim();
    const title = document.getElementById('notificationTitle').value.trim();
    let message = document.getElementById('notificationMessage').value.trim();
    const imageFile = document.getElementById('imageFile').files[0];
    const imageUrlInput = document.getElementById('imageUrl').value.trim();
    const statusDiv = document.getElementById('notificationStatus');
    const historyTable = document.getElementById('notificationHistory');
    const formData = new FormData();

    // Kiểm tra dữ liệu đầu vào
    const validationRules = {
      'byUserId': () => !userId,
      'multicast': () => !userIds,
      'order': () => !userId || !orderId || !orderStatus,
      'payment': () => !userId || !orderId || !paymentStatus || !paymentMethod,
      'promotion': () => discount && !validUntil,
      'marketing': () => false,
      'system': () => false
    };

    if (!title || !message) {
      statusDiv.style.display = 'block';
      statusDiv.classList.add('error-message');
      statusDiv.textContent = 'Vui lòng nhập tiêu đề và nội dung thông báo';
      return;
    }

    if (validationRules[type]?.()) {
      statusDiv.style.display = 'block';
      statusDiv.classList.add('error-message');
      statusDiv.textContent = {
        'byUserId': 'Vui lòng nhập User ID',
        'multicast': 'Vui lòng nhập danh sách User ID',
        'order': 'Vui lòng nhập User ID, Order ID và trạng thái đơn hàng',
        'payment': 'Vui lòng nhập User ID, Order ID, trạng thái thanh toán và phương thức thanh toán',
        'promotion': 'Vui lòng nhập thời hạn hiệu lực cho khuyến mãi'
      }[type] || 'Dữ liệu không hợp lệ';
      return;
    }

    // Validate image file size (5MB limit)
    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      statusDiv.style.display = 'block';
      statusDiv.classList.add('error-message');
      statusDiv.textContent = 'Hình ảnh không được vượt quá 5MB';
      return;
    }

    // Chuẩn bị payload hoặc form-data
    let endpoint = `${BASE_URL}/api/noti/send`;
    let isJsonPayload = false;
    let payload = {};

    switch (type) {
      case 'byUserId':
        endpoint = `${BASE_URL}/api/noti/send`;
        isJsonPayload = true;
        payload = {
          userId,
          title,
          message,
          event: 'login_success',
          type: 'immediate',
          data: { foo: 'bar' }
        };
        break;
      case 'multicast':
        endpoint = `${BASE_URL}/api/noti/send-multicast`;
        formData.append('userids', userIds);
        formData.append('title', title);
        formData.append('message', message);
        formData.append('type', 'system');
        formData.append('event', 'system_notification');
        formData.append('data', JSON.stringify({ foo: 'bar' }));
        if (imageFile) formData.append('imageFile', imageFile);
        if (imageUrlInput) formData.append('image', imageUrlInput);
        break;
      case 'system':
        endpoint = `${BASE_URL}/api/noti/send-all`;
        formData.append('title', title);
        formData.append('message', message);
        formData.append('type', 'system');
        formData.append('event', 'system_notification');
        formData.append('data', JSON.stringify({ foo: 'bar' }));
        if (imageFile) formData.append('imageFile', imageFile);
        if (imageUrlInput) formData.append('image', imageUrlInput);
        break;
      case 'order':
        endpoint = `${BASE_URL}/api/noti/order`;
        formData.append('userId', userId);
        formData.append('orderId', orderId);
        formData.append('orderStatus', orderStatus);
        formData.append('amount', amount);
        formData.append('title', title);
        formData.append('message', message);
        formData.append('event', 'order_success');
        if (imageFile) formData.append('imageFile', imageFile);
        if (imageUrlInput) formData.append('image', imageUrlInput);
        break;
      case 'payment':
        endpoint = `${BASE_URL}/api/noti/payment`;
        formData.append('userId', userId);
        formData.append('orderId', orderId);
        formData.append('paymentStatus', paymentStatus);
        formData.append('paymentMethod', paymentMethod);
        formData.append('amount', amount);
        formData.append('title', title);
        formData.append('message', message);
        formData.append('event', 'payment_status');
        if (imageFile) formData.append('imageFile', imageFile);
        if (imageUrlInput) formData.append('image', imageUrlInput);
        break;
      case 'marketing':
        endpoint = `${BASE_URL}/api/noti/marketing`;
        if (userId) formData.append('userId', userId);
        formData.append('title', title);
        formData.append('message', message);
        formData.append('event', 'marketing_notification');
        formData.append('data', JSON.stringify({ foo: 'bar' }));
        if (imageFile) formData.append('imageFile', imageFile);
        if (imageUrlInput) formData.append('image', imageUrlInput);
        break;
      case 'promotion':
        endpoint = `${BASE_URL}/api/noti/promotion`;
        if (userId) formData.append('userId', userId);
        formData.append('title', title);
        formData.append('message', message.replace('{discount}', discount || '').replace('{validUntil}', validUntil || ''));
        formData.append('discount', discount);
        formData.append('event', 'promotion_notification');
        let validUntilValue = '';
        if (validUntil) {
          if (/^\d{4}-\d{2}-\d{2}$/.test(validUntil)) {
            validUntilValue = validUntil;
          } else {
            const d = new Date(validUntil);
            if (!isNaN(d.getTime())) validUntilValue = d.toISOString().slice(0, 10);
          }
        }
        formData.append('validUntil', validUntilValue);
        formData.append('data', JSON.stringify({ foo: 'bar' }));
        if (imageFile) formData.append('imageFile', imageFile);
        if (imageUrlInput) formData.append('image', imageUrlInput);
        break;
    }

    // Gửi yêu cầu đến API
    try {
      const headers = { 'Authorization': `Bearer ${authToken}` };
      const options = {
        method: 'POST',
        headers,
        body: isJsonPayload ? JSON.stringify(payload) : formData
      };

      if (isJsonPayload) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(endpoint, options);
      const result = await response.json();

      if (result.success) {
        statusDiv.style.display = 'block';
        statusDiv.classList.remove('error-message');
        statusDiv.textContent = result.message || 'Gửi thông báo thành công';

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${new Date().toLocaleString()}</td>
          <td>${type === 'system' ? 'Hệ thống' : type === 'byUserId' ? 'Theo User ID' : type === 'multicast' ? 'Nhiều User' : type.charAt(0).toUpperCase() + type.slice(1)}</td>
          <td>${userId || userIds || 'Tất cả'}</td>
          <td>${title}</td>
          <td>${message}</td>
          <td>${result.image ? `<img src="${result.image}" style="max-width: 50px;" />` : 'Không'}</td>
          <td>Đã gửi</td>
        `;
        historyTable.prepend(row);

        // Xóa nội dung sau khi gửi
        [
          document.getElementById('notificationTitle'), document.getElementById('notificationMessage'),
          document.getElementById('userId'), document.getElementById('userIds'), document.getElementById('orderId'),
          document.getElementById('orderStatus'), document.getElementById('paymentStatus'), document.getElementById('paymentMethod'),
          document.getElementById('amount'), document.getElementById('discount'), document.getElementById('validUntil'),
          document.getElementById('imageFile'), document.getElementById('imageUrl')
        ].forEach(el => el.value = '');

        setTimeout(() => {
          statusDiv.style.display = 'none';
          sendButton.disabled = false; // Enable lại nút sau khi gửi thành công
        }, 3000);
      } else {
        statusDiv.style.display = 'block';
        statusDiv.classList.add('error-message');
        statusDiv.textContent = result.message || 'Gửi thông báo thất bại';
        sendButton.disabled = false; // Enable lại nút nếu gửi thất bại
      }
    } catch (error) {
      statusDiv.style.display = 'block';
      statusDiv.classList.add('error-message');
      statusDiv.textContent = `Lỗi khi gửi thông báo: ${error.message}`;
      sendButton.disabled = false; // Enable lại nút nếu có lỗi
    }
  });

  // Xử lý xem thống kê
  document.getElementById('viewStats').addEventListener('click', async function () {
    try {
      const response = await fetch(`${BASE_URL}/api/noti/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const result = await response.json();

      const statusDiv = document.getElementById('notificationStatus');
      if (result.success && result.stats) {
        // Map tiếng Anh sang tiếng Việt
        const viMap = {
          waiting: 'Đang chờ',
          active: 'Đang hoạt động',
          completed: 'Hoàn thành',
          failed: 'Thất bại',
          totalJobs: 'Tổng số thông báo',
          rateLimitSize: 'Giới hạn tốc độ',
          status: 'Trạng thái'
        };
        let html = `<b>Thống kê thông báo:</b><br>`;
        for (const [key, value] of Object.entries(result.stats)) {
          const viKey = viMap[key] || key;
          html += `<div><b>${viKey}:</b> ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}</div>`;
        }
        statusDiv.style.display = 'block';
        statusDiv.classList.remove('error-message');
        statusDiv.innerHTML = html;
      } else {
        statusDiv.style.display = 'block';
        statusDiv.classList.add('error-message');
        statusDiv.textContent = result.message || 'Lấy thống kê thất bại';
      }
    } catch (error) {
      const statusDiv = document.getElementById('notificationStatus');
      statusDiv.style.display = 'block';
      statusDiv.classList.add('error-message');
      statusDiv.textContent = `Lỗi khi lấy thống kê: ${error.message}`;
    }
  });

  // Xử lý upload avatar
  const uploadDialog = document.getElementById('uploadDialog');
  const uploadMessage = document.getElementById('uploadMessage');
  const uploadButton = document.getElementById('uploadButton');
  const cancelButton = document.getElementById('cancelButton');
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  const headerAvatar = document.getElementById('headerAvatar');

  // Load avatar from localStorage
  const savedAvatar = localStorage.getItem('userAvatar');
  if (savedAvatar) {
    sidebarAvatar.src = savedAvatar;
    headerAvatar.src = savedAvatar;
  }

  document.getElementById('settingsLink').onclick = () => {
    document.getElementById('mainSidebar').classList.add('hidden');
    document.getElementById('settingsSidebar').classList.remove('hidden');
  };

  document.getElementById('backButton').onclick = () => {
    document.getElementById('settingsSidebar').classList.add('hidden');
    document.getElementById('mainSidebar').classList.remove('hidden');
  };

  sidebarAvatar.onclick = () => {
    uploadDialog.showModal();
    resetUploadDialog();
  };

  cancelButton.onclick = () => {
    uploadDialog.close();
    resetUploadDialog();
  };

  uploadDialog.addEventListener('close', () => {
    resetUploadDialog();
  });

  function resetUploadDialog() {
    document.getElementById('avatarUpload').value = '';
    uploadMessage.style.display = 'none';
    uploadMessage.textContent = '';
    uploadMessage.className = 'notification';
    uploadButton.disabled = false;
    uploadButton.textContent = 'Tải lên';
  }

  uploadButton.onclick = async () => {
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

    if (file.size > 5 * 1024 * 1024) {
      alert('Hình ảnh không được vượt quá 5MB.');
      return;
    }

    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    if (!token) {
      alert('Bạn chưa đăng nhập hoặc token không hợp lệ. Vui lòng đăng nhập lại.');
      return;
    }

    if (!userId) {
      alert('Thiếu userId. Vui lòng đăng nhập lại.');
      return;
    }

    uploadButton.disabled = true;
    uploadButton.textContent = 'Đang tải...';

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('userId', userId);

      const response = await fetch(`${BASE_URL}/api/user-upload/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        let errorMsg = 'Lỗi khi tải ảnh lên';
        try {
          const errData = await response.json();
          if (errData.message) errorMsg = errData.message;
        } catch {}
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const imageUrl = data.avatar || URL.createObjectURL(file);

      sidebarAvatar.src = imageUrl;
      headerAvatar.src = imageUrl;
      localStorage.setItem('userAvatar', imageUrl);

      uploadMessage.style.display = 'block';
      uploadMessage.textContent = 'Đã cập nhật ảnh đại diện thành công!';
      uploadMessage.className = 'notification success-message';

      setTimeout(() => {
        uploadDialog.close();
        resetUploadDialog();
      }, 2000);
    } catch (error) {
      uploadMessage.style.display = 'block';
      uploadMessage.textContent = 'Lỗi: ' + error.message;
      uploadMessage.className = 'notification error-message';
      uploadButton.disabled = false;
      uploadButton.textContent = 'Tải lên';
    }
  };

  window.toggleMenu = function(menuId) {
    const menu = document.getElementById(menuId);
    if (!menu) return;
    menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
  };
});