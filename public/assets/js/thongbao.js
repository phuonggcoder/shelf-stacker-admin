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
    window.location.href = '/login'; // Chuyển hướng đến trang đăng nhập
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
    userIdLabel.style.display = 'none';
    userIdInput.style.display = 'none';
    userIdsLabel.style.display = 'none';
    userIdsInput.style.display = 'none';
    orderIdLabel.style.display = 'none';
    orderIdInput.style.display = 'none';
    orderStatusLabel.style.display = 'none';
    orderStatusSelect.style.display = 'none';
    paymentStatusLabel.style.display = 'none';
    paymentStatusSelect.style.display = 'none';
    paymentMethodLabel.style.display = 'none';
    paymentMethodSelect.style.display = 'none';
    amountLabel.style.display = 'none';
    amountInput.style.display = 'none';
    discountLabel.style.display = 'none';
    discountInput.style.display = 'none';
    validUntilLabel.style.display = 'none';
    validUntilInput.style.display = 'none';

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
        userIdLabel.style.display = 'block';
        userIdInput.style.display = 'block';
        orderIdLabel.style.display = 'block';
        orderIdInput.style.display = 'block';
        orderStatusLabel.style.display = 'block';
        orderStatusSelect.style.display = 'block';
        amountLabel.style.display = 'block';
        amountInput.style.display = 'block';
        messageInput.placeholder = 'Ví dụ: Đơn hàng {orderID} trạng thái {orderStatus}';
        titleInput.placeholder = 'Ví dụ: Cập nhật đơn hàng';
        break;
      case 'payment':
        userIdLabel.style.display = 'block';
        userIdInput.style.display = 'block';
        orderIdLabel.style.display = 'block';
        orderIdInput.style.display = 'block';
        paymentStatusLabel.style.display = 'block';
        paymentStatusSelect.style.display = 'block';
        paymentMethodLabel.style.display = 'block';
        paymentMethodSelect.style.display = 'block';
        amountLabel.style.display = 'block';
        amountInput.style.display = 'block';
        messageInput.placeholder = 'Ví dụ: Thanh toán {paymentStatus} cho đơn hàng {orderID}';
        titleInput.placeholder = 'Ví dụ: Cập nhật thanh toán';
        break;
      case 'marketing':
      case 'promotion':
        userIdLabel.style.display = 'block';
        userIdInput.style.display = 'block';
        userIdInput.placeholder = 'Nhập User ID (để trống để gửi tất cả)';
        if (this.value === 'promotion') {
          discountLabel.style.display = 'block';
          discountInput.style.display = 'block';
          validUntilLabel.style.display = 'block';
          validUntilInput.style.display = 'block';
          messageInput.placeholder = 'Ví dụ: Khuyến mãi giảm giá {discount}% đến {validUntil}';
          titleInput.placeholder = 'Ví dụ: Ưu đãi đặc biệt';
        }
        break;
      case 'urgent':
        // Không cần thêm trường, gửi đến tất cả
        break;
    }
  });

  // Xử lý gửi thông báo
  document.getElementById('sendNotification').addEventListener('click', async function() {
    const type = document.getElementById('notificationType').value;
    const userId = document.getElementById('userId').value;
    const userIds = document.getElementById('userIds').value;
    const orderId = document.getElementById('orderId').value;
    const orderStatus = document.getElementById('orderStatus').value;
    const paymentStatus = document.getElementById('paymentStatus').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const amount = document.getElementById('amount').value;
    const discount = document.getElementById('discount').value;
    const validUntil = document.getElementById('validUntil').value;
    const title = document.getElementById('notificationTitle').value;
    let message = document.getElementById('notificationMessage').value;
    const imageFile = document.getElementById('imageFile').files[0];
    const imageUrlInput = document.getElementById('imageUrl').value;
    const statusDiv = document.getElementById('notificationStatus');
    const historyTable = document.getElementById('notificationHistory');

    // Kiểm tra dữ liệu đầu vào
    if (!title || !message) {
      statusDiv.style.display = 'block';
      statusDiv.classList.add('error-message');
      statusDiv.textContent = 'Vui lòng nhập tiêu đề và nội dung thông báo';
      return;
    }

    if (type === 'byUserId' && !userId) {
      statusDiv.style.display = 'block';
      statusDiv.classList.add('error-message');
      statusDiv.textContent = 'Vui lòng nhập User ID';
      return;
    }

    if (type === 'multicast' && !userIds) {
      statusDiv.style.display = 'block';
      statusDiv.classList.add('error-message');
      statusDiv.textContent = 'Vui lòng nhập danh sách User ID';
      return;
    }

    if (type === 'order' && (!userId || !orderId || !orderStatus)) {
      statusDiv.style.display = 'block';
      statusDiv.classList.add('error-message');
      statusDiv.textContent = 'Vui lòng nhập User ID, Order ID và trạng thái đơn hàng';
      return;
    }

    if (type === 'payment' && (!userId || !orderId || !paymentStatus || !paymentMethod)) {
      statusDiv.style.display = 'block';
      statusDiv.classList.add('error-message');
      statusDiv.textContent = 'Vui lòng nhập User ID, Order ID, trạng thái thanh toán và phương thức thanh toán';
      return;
    }

    if (type === 'promotion' && (discount && !validUntil)) {
      statusDiv.style.display = 'block';
      statusDiv.classList.add('error-message');
      statusDiv.textContent = 'Vui lòng nhập thời hạn hiệu lực cho khuyến mãi';
      return;
    }

    // Xử lý upload hình ảnh
    let imageUrl = null;
    if (imageFile || imageUrlInput) {
      const formData = new FormData();
      if (imageFile) {
        formData.append('imageFile', imageFile);
      }
      if (imageUrlInput) {
        formData.append('imageUrl', imageUrlInput);
      }
      try {
        const response = await fetch(`${BASE_URL}/api/notifications/upload-image`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        const result = await response.json();
        if (result.success) {
          imageUrl = result.url;
        } else {
          statusDiv.style.display = 'block';
          statusDiv.classList.add('error-message');
          statusDiv.textContent = result.message;
          return;
        }
      } catch (error) {
        statusDiv.style.display = 'block';
        statusDiv.classList.add('error-message');
        statusDiv.textContent = 'Lỗi khi upload hình ảnh: ' + error.message;
        return;
      }
    }

    // Xử lý thông báo
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
        body.userId = userId;
        body.orderId = orderId;
        body.orderStatus = orderStatus;
        body.amount = amount;
        message = message.replace('{orderID}', orderId).replace('{orderStatus}', orderStatus);
        break;
      case 'payment':
        endpoint = `${BASE_URL}/api/notifications/payment`;
        body.userId = userId;
        body.orderId = orderId;
        body.paymentStatus = paymentStatus;
        body.paymentMethod = paymentMethod;
        body.amount = amount;
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
        body.discount = discount;
        body.validUntil = validUntil;
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
        statusDiv.textContent = result.message;

        // Thêm vào lịch sử thông báo
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
        document.getElementById('notificationTitle').value = '';
        document.getElementById('notificationMessage').value = '';
        document.getElementById('userId').value = '';
        document.getElementById('userIds').value = '';
        document.getElementById('orderId').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('discount').value = '';
        document.getElementById('validUntil').value = '';
        document.getElementById('imageFile').value = '';
        document.getElementById('imageUrl').value = '';

        // Ẩn thông báo trạng thái sau 3 giây
        setTimeout(() => {
          statusDiv.style.display = 'none';
        }, 3000);
      } else {
        statusDiv.style.display = 'block';
        statusDiv.classList.add('error-message');
        statusDiv.textContent = result.message;
      }
    } catch (error) {
      statusDiv.style.display = 'block';
      statusDiv.classList.add('error-message');
      statusDiv.textContent = 'Lỗi khi gửi thông báo: ' + error.message;
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
        statusDiv.textContent = result.message;
      }
    } catch (error) {
      statusDiv.style.display = 'block';
      statusDiv.classList.add('error-message');
      statusDiv.textContent = 'Lỗi khi lấy thống kê: ' + error.message;
    }
  });
});