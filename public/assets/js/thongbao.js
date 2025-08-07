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
  document.getElementById('notificationType').addEventListener('change', function() {
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
    [userIdLabel, userIdInput, userIdsLabel, userIdsInput, orderIdLabel, orderIdInput, orderStatusLabel, orderStatusSelect,
      paymentStatusLabel, paymentStatusSelect, paymentMethodLabel, paymentMethodSelect, amountLabel, amountInput,
      discountLabel, discountInput, validUntilLabel, validUntilInput].forEach(el => el.style.display = 'none');

    // Cập nhật placeholder mặc định
    messageInput.placeholder = 'Nhập nội dung thông báo';
    titleInput.placeholder = 'Nhập tiêu đề thông báo';

    switch (this.value) {
      case 'byUserId':
        userIdLabel.style.display = 'block';
        userIdInput.style.display = 'block';
        break;
      case 'multicast':
        userIdsLabel.style.display = 'block';
        userIdsInput.style.display = 'block';
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
      case 'promotion':
        userIdLabel.style.display = 'block';
        userIdInput.style.display = 'block';
        userIdInput.placeholder = 'Nhập User ID (để trống để gửi tất cả)';
        if (this.value === 'promotion') {
          [discountLabel, discountInput, validUntilLabel, validUntilInput].forEach(el => el.style.display = 'block');
          messageInput.placeholder = 'Ví dụ: Khuyến mãi giảm giá {discount}% đến {validUntil}';
          titleInput.placeholder = 'Ví dụ: Ưu đãi đặc biệt';
        }
        break;
      case 'urgent':
        break;
    }
  });

  // Xử lý gửi thông báo
  document.getElementById('sendNotification').addEventListener('click', async function() {
    const type = document.getElementById('notificationType').value;
    const userId = document.getElementById('userId').value.trim();
    const userIds = document.getElementById('userIds').value.trim();
    const orderId = document.getElementById('orderId').value.trim();
    const orderStatus = document.getElementById('orderStatus').value;
    const paymentStatus = document.getElementById('paymentStatus').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const amount = document.getElementById('amount').value.trim();
    const discount = document.getElementById('discount').value.trim();
    const validUntil = document.getElementById('validUntil').value;
    const title = document.getElementById('notificationTitle').value.trim();
    let message = document.getElementById('notificationMessage').value.trim();
    const imageFile = document.getElementById('imageFile').files[0];
    const imageUrlInput = document.getElementById('imageUrl').value.trim();
    const statusDiv = document.getElementById('notificationStatus');
    const historyTable = document.getElementById('notificationHistory');

    // Kiểm tra dữ liệu đầu vào
    if (!title || !message) {
      statusDiv.style.display = 'block';
      statusDiv.classList.add('error-message');
      statusDiv.textContent = 'Vui lòng nhập tiêu đề và nội dung thông báo';
      return;
    }

    const validationRules = {
      'byUserId': () => !userId,
      'multicast': () => !userIds,
      'order': () => !userId || !orderId || !orderStatus,
      'payment': () => !userId || !orderId || !paymentStatus || !paymentMethod,
      'promotion': () => discount && !validUntil
    };

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

    // Xử lý upload hình ảnh
    let imageUrl = null;
    if (imageFile || imageUrlInput) {
      const formData = new FormData();
      if (imageFile) formData.append('imageFile', imageFile);
      if (imageUrlInput) formData.append('imageUrl', imageUrlInput);
      try {
        const response = await fetch(`${BASE_URL}/api/notifications/upload-image`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        const result = await response.json();
        if (result.success) imageUrl = result.url;
        else {
          statusDiv.style.display = 'block';
          statusDiv.classList.add('error-message');
          statusDiv.textContent = result.message || 'Lỗi upload hình ảnh';
          return;
        }
      } catch (error) {
        statusDiv.style.display = 'block';
        statusDiv.classList.add('error-message');
        statusDiv.textContent = `Lỗi khi upload hình ảnh: ${error.message}`;
        return;
      }
    }

    // Chuẩn bị body cho request
    let endpoint = `${BASE_URL}/api/notifications/send`;
    let body = { title, message, image: imageUrl };

    switch (type) {
      case 'urgent':
        endpoint = `${BASE_URL}/api/notifications/send-all`;
        body.type = 'system';
        break;
      case 'byUserId':
        body.userId = userId;
        body.type = 'system';
        break;
      case 'multicast':
        endpoint = `${BASE_URL}/api/notifications/send-multicast`;
        body.userIds = userIds.split(',').map(id => id.trim());
        body.type = 'system';
        break;
      case 'order':
        endpoint = `${BASE_URL}/api/notifications/order`;
        Object.assign(body, { userId, orderId, orderStatus, amount });
        message = message.replace('{orderID}', orderId).replace('{orderStatus}', orderStatus);
        break;
      case 'payment':
        endpoint = `${BASE_URL}/api/notifications/payment`;
        Object.assign(body, { userId, orderId, paymentStatus, paymentMethod, amount });
        message = message.replace('{orderID}', orderId).replace('{paymentStatus}', paymentStatus);
        break;
      case 'marketing':
        endpoint = `${BASE_URL}/api/notifications/marketing`;
        if (userId) body.userId = userId;
        body.type = 'marketing';
        break;
      case 'promotion':
        endpoint = `${BASE_URL}/api/notifications/promotion`;
        if (userId) body.userId = userId;
        Object.assign(body, { discount, validUntil });
        message = message.replace('{discount}', discount || '').replace('{validUntil}', validUntil || '');
        break;
    }

    // Gửi yêu cầu đến API
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(body)
      });
      const result = await response.json();

      if (result.success) {
        statusDiv.style.display = 'block';
        statusDiv.classList.remove('error-message');
        statusDiv.textContent = result.message || 'Gửi thông báo thành công';

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${new Date().toLocaleString()}</td>
          <td>${type === 'urgent' ? 'Khẩn' : type === 'byUserId' ? 'Theo User ID' : type === 'multicast' ? 'Nhiều User' : type.charAt(0).toUpperCase() + type.slice(1)}</td>
          <td>${userId || userIds || 'Tất cả'}</td>
          <td>${title}</td>
          <td>${message}</td>
          <td>${imageUrl ? `<img src="${imageUrl}" style="max-width: 50px;" />` : 'Không'}</td>
          <td>Đã gửi</td>
        `;
        historyTable.prepend(row);

        // Xóa nội dung sau khi gửi
        [document.getElementById('notificationTitle'), document.getElementById('notificationMessage'),
         document.getElementById('userId'), document.getElementById('userIds'), document.getElementById('orderId'),
         document.getElementById('amount'), document.getElementById('discount'), document.getElementById('validUntil'),
         document.getElementById('imageFile'), document.getElementById('imageUrl')]
          .forEach(el => el.value = '');

        setTimeout(() => statusDiv.style.display = 'none', 3000);
      } else {
        statusDiv.style.display = 'block';
        statusDiv.classList.add('error-message');
        statusDiv.textContent = result.message || 'Gửi thông báo thất bại';
      }
    } catch (error) {
      statusDiv.style.display = 'block';
      statusDiv.classList.add('error-message');
      statusDiv.textContent = `Lỗi khi gửi thông báo: ${error.message}`;
    }
  });

  // Xử lý xem thống kê
  document.getElementById('viewStats').addEventListener('click', async function() {
    try {
      const response = await fetch(`${BASE_URL}/api/notifications/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const result = await response.json();

      if (result.success) {
        statusDiv.style.display = 'block';
        statusDiv.classList.remove('error-message');
        statusDiv.textContent = `Thống kê: ${JSON.stringify(result.stats, null, 2)}`;
      } else {
        statusDiv.style.display = 'block';
        statusDiv.classList.add('error-message');
        statusDiv.textContent = result.message || 'Lấy thống kê thất bại';
      }
    } catch (error) {
      statusDiv.style.display = 'block';
      statusDiv.classList.add('error-message');
      statusDiv.textContent = `Lỗi khi lấy thống kê: ${error.message}`;
    }
  });
});