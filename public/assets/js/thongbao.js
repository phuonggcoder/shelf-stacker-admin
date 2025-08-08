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
    const title = document.getElementById('notificationTitle').value.trim();
    let message = document.getElementById('notificationMessage').value.trim();
    const imageFile = document.getElementById('imageFile').files[0];
    const imageUrlInput = document.getElementById('imageUrl').value.trim();
    const statusDiv = document.getElementById('notificationStatus');
    const historyTable = document.getElementById('notificationHistory');
    const formData = new FormData(); // Chỉ khai báo 1 lần ở đây

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

    // Theo User ID (JSON)
    if (type === 'byUserId') {
      const payload = {
        userId: userId,
        title: title,
        message: message,
        type: 'immediate'
      };

      try {
        const response = await fetch(`${BASE_URL}/api/noti/send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (result.success) {
          statusDiv.style.display = 'block';
          statusDiv.classList.remove('error-message');
          statusDiv.textContent = result.message || 'Gửi thông báo thành công';

          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${new Date().toLocaleString()}</td>
            <td>Theo User ID</td>
            <td>${userId}</td>
            <td>${title}</td>
            <td>${message}</td>
            <td>${result.image ? `<img src="${result.image}" style="max-width: 50px;" />` : 'Không'}</td>
            <td>Đã gửi</td>
          `;
          historyTable.prepend(row);

          [document.getElementById('notificationTitle'), document.getElementById('notificationMessage'),
           document.getElementById('userId'), document.getElementById('imageFile'), document.getElementById('imageUrl')]
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
      return;
    }

    // Nhiều User (form-data)
    if (type === 'multicast') {
      const userIds = document.getElementById('userIds').value.trim();
      formData.append('userids', userIds);
      formData.append('title', title);
      formData.append('message', message);
      formData.append('type', 'system');
      formData.append('data', JSON.stringify({ foo: 'bar' }));
      if (imageFile) formData.append('imageFile', imageFile);
      if (imageUrlInput) formData.append('image', imageUrlInput);

      try {
        const response = await fetch(`${BASE_URL}/api/noti/send-multicast`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: formData
        });
        const result = await response.json();

        if (result.success) {
          statusDiv.style.display = 'block';
          statusDiv.classList.remove('error-message');
          statusDiv.textContent = result.message || 'Gửi thông báo thành công';

          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${new Date().toLocaleString()}</td>
            <td>Nhiều User</td>
            <td>${userIds}</td>
            <td>${title}</td>
            <td>${message}</td>
            <td>${result.image ? `<img src="${result.image}" style="max-width: 50px;" />` : 'Không'}</td>
            <td>Đã gửi</td>
          `;
          historyTable.prepend(row);

          [document.getElementById('notificationTitle'), document.getElementById('notificationMessage'),
           document.getElementById('userIds'), document.getElementById('imageFile'), document.getElementById('imageUrl')]
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
      return;
    }

    // Gửi tất cả người dùng (form-data)
    if (type === 'urgent') {
      formData.append('title', title);
      formData.append('message', message);
      formData.append('type', 'system');
      formData.append('data', JSON.stringify({ foo: 'bar' }));
      if (imageFile) formData.append('imageFile', imageFile);
      if (imageUrlInput) formData.append('image', imageUrlInput);

      try {
        const response = await fetch(`${BASE_URL}/api/noti/send-all`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: formData
        });
        const result = await response.json();

        if (result.success) {
          statusDiv.style.display = 'block';
          statusDiv.classList.remove('error-message');
          statusDiv.textContent = result.message || 'Gửi thông báo thành công';

          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${new Date().toLocaleString()}</td>
            <td>Khẩn</td>
            <td>Tất cả</td>
            <td>${title}</td>
            <td>${message}</td>
            <td>${result.image ? `<img src="${result.image}" style="max-width: 50px;" />` : 'Không'}</td>
            <td>Đã gửi</td>
          `;
          historyTable.prepend(row);

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

    // Chuẩn bị form-data cho request
    let endpoint = `${BASE_URL}/api/notifications/send`;
    formData.append('title', title);
    formData.append('message', message);

    // XÓA 2 DÒNG NÀY ĐỂ KHÔNG append file ở ngoài switch
    // if (imageFile) formData.append('imageFile', imageFile);
    // if (imageUrlInput) formData.append('image', imageUrlInput);

    switch (type) {
      case 'urgent':
        endpoint = `${BASE_URL}/api/noti/send-all`;
        formData.append('type', 'system');
        break;
      case 'byUserId':
        formData.append('userId', userId);
        formData.append('type', 'immediate');
        break;
      case 'multicast':
        const userIds = document.getElementById('userIds').value.trim();
        formData.append('userids', userIds); // chú ý: userids (chuỗi, phân cách bằng dấu phẩy)
        formData.append('title', title);
        formData.append('message', message);
        formData.append('type', 'system');
        formData.append('data', JSON.stringify({ foo: 'bar' }));
        if (imageFile) formData.append('imageFile', imageFile);
        if (imageUrlInput) formData.append('image', imageUrlInput);

        try {
          const response = await fetch(`${BASE_URL}/api/noti/send-multicast`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`
            },
            body: formData
          });
          const result = await response.json();

          if (result.success) {
            statusDiv.style.display = 'block';
            statusDiv.classList.remove('error-message');
            statusDiv.textContent = result.message || 'Gửi thông báo thành công';

            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${new Date().toLocaleString()}</td>
              <td>Nhiều User</td>
              <td>${userIds}</td>
              <td>${title}</td>
              <td>${message}</td>
              <td>${result.image ? `<img src="${result.image}" style="max-width: 50px;" />` : 'Không'}</td>
              <td>Đã gửi</td>
            `;
            historyTable.prepend(row);

            [document.getElementById('notificationTitle'), document.getElementById('notificationMessage'),
             document.getElementById('userIds'), document.getElementById('imageFile'), document.getElementById('imageUrl')]
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
        return;
      case 'order':
        endpoint = `${BASE_URL}/api/noti/order`;
        formData.append('userId', userId);
        formData.append('orderId', orderId);
        formData.append('orderStatus', orderStatus);
        formData.append('amount', amount);
        formData.append('title', title);
        formData.append('message', message);
        if (imageFile && imageFile instanceof File) {
          formData.append('imageFile', imageFile);
        }
        break;
      case 'payment':
        endpoint = `${BASE_URL}/api/noti/payment`;
        formData.append('userId', userId);
        formData.append('orderId', orderId);
        formData.append('paymentStatus', paymentStatus);
        formData.append('amount', amount);
        formData.append('paymentMethod', paymentMethod);
        formData.append('title', title);
        formData.append('message', message);
        if (imageFile && imageFile instanceof File) {
          formData.append('imageFile', imageFile);
        }
        break;
      case 'marketing':
        endpoint = `${BASE_URL}/api/noti/marketing`;
        if (userId) formData.append('userId', userId);
        formData.append('title', title);
        formData.append('message', message);
        formData.append('data', JSON.stringify({ foo: 'bar' }));
        if (imageFile && imageFile instanceof File) {
          formData.append('imageFile', imageFile);
        }
        if (imageUrlInput) {
          formData.append('image', imageUrlInput);
        }
        break;
      case 'promotion':
        endpoint = `${BASE_URL}/api/noti/promotion`;
        if (userId) formData.append('userId', userId);
        formData.append('title', title);
        formData.append('message', message.replace('{discount}', discount || '').replace('{validUntil}', validUntil || ''));
        formData.append('discount', discount);

        // Xử lý validUntil: lấy đúng giá trị từ input type="date" hoặc "datetime-local"
        let validUntilValue = '';
        if (validUntil) {
          // Nếu là dạng yyyy-mm-dd thì dùng luôn, nếu là datetime-local thì cắt lấy yyyy-mm-dd
          if (/^\d{4}-\d{2}-\d{2}$/.test(validUntil)) {
            validUntilValue = validUntil;
          } else {
            const d = new Date(validUntil);
            if (!isNaN(d.getTime())) validUntilValue = d.toISOString().slice(0, 10);
          }
        }
        formData.append('validUntil', validUntilValue);

        formData.append('data', JSON.stringify({ foo: 'bar' }));

        // Chỉ append file nếu thực sự có file
        if (imageFile && imageFile instanceof File) {
          formData.append('imageFile', imageFile);
        }
        if (imageUrlInput) {
          formData.append('image', imageUrlInput);
        }
        break;
    }

    // Gửi yêu cầu đến API
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
          // KHÔNG đặt Content-Type, để browser tự set multipart/form-data
        },
        body: formData
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
          <td>${result.image ? `<img src="${result.image}" style="max-width: 50px;" />` : 'Không'}</td>
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