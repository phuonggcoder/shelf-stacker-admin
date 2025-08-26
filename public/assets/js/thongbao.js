const BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';
    let lastNotifiedOrderId = null;

    document.addEventListener('DOMContentLoaded', () => {
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
        localStorage.removeItem('userAvatar');
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
            } catch { }
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

      // Hàm hiển thị thông báo
      function showNotification(type, message) {
        const notification = document.createElement('div');
        notification.id = `notification-${Date.now()}`;
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: ${type === 'success' ? '#28a745' : '#dc3545'};
          color: white;
          padding: 15px 25px;
          border-radius: 5px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          z-index: 10000;
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'Segoe UI', sans-serif;
          animation: slideIn 0.3s ease, fadeOut 0.5s ease 2.5s forwards;
        `;

        const icon = document.createElement('span');
        icon.innerHTML = type === 'success'
          ? '<i class="fa fa-check-circle" style="font-size: 18px;"></i>'
          : '<i class="fa fa-exclamation-circle" style="font-size: 18px;"></i>';
        notification.appendChild(icon);

        const text = document.createElement('span');
        text.innerHTML = message;
        notification.appendChild(text);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
          background: none;
          border: none;
          color: white;
          font-size: 16px;
          cursor: pointer;
          margin-left: 15px;
          padding: 0 5px;
        `;
        closeBtn.onclick = () => {
          notification.style.display = 'none';
          document.body.removeChild(notification);
        };
        notification.appendChild(closeBtn);

        document.body.appendChild(notification);

        // Tự động ẩn sau 3 giây
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 500);
        }, 2500);
      }

      // Toggle notification dropdown
      function toggleNotificationDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
          dropdown.classList.toggle('active');
        }
      }

      // Handle click on notification bell
      const notificationBell = document.querySelector('.notification-bell');
      if (notificationBell) {
        notificationBell.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleNotificationDropdown();
        });
      }

      // Close dropdown when clicking outside
      document.addEventListener('click', function (event) {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown && dropdown.classList.contains('active')) {
          if (!event.target.closest('.notification-bell')) {
            dropdown.classList.remove('active');
          }
        }
      });

      // Go to order details page
      function goToOrderDetails(orderId) {
        window.location.href = 'danhmucdonhang';
      }

      // Render notifications
      function renderNotifications(orders) {
        const dropdown = document.getElementById('notificationDropdown');
        const badge = document.getElementById('notificationBadge');
        if (!dropdown || !badge) return;

        const filteredOrders = orders.filter(order =>
          order.order_status === 'Pending' || order.order_status === 'Processing'
        );

        badge.textContent = filteredOrders.length;
        badge.style.display = filteredOrders.length > 0 ? 'inline-block' : 'none';

        if (!filteredOrders.length) {
          dropdown.innerHTML = '<div style="padding: 16px; text-align: center; color: #888;">Không có đơn hàng mới cần xác nhận.</div>';
        } else {
          dropdown.innerHTML = filteredOrders.map(order => {
            const code = order.order_id || order._id || 'Không rõ';
            const statusKey = order.order_status;
            const status = statusKey === 'Pending'
              ? 'Đang chờ xác nhận'
              : statusKey === 'Processing'
                ? 'Đang xử lý'
                : 'Chưa rõ';
            const createdAt = order.order_date || order.createdAt || '';
            const formattedDate = createdAt
              ? new Date(createdAt).toLocaleString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })
              : 'Chưa rõ';

            return `
              <div class="notification-item" data-id="${order._id}" data-status="${statusKey}">
                <div>
                  <i class="fas fa-box-open" style="margin-right:6px;"></i>
                  Đơn hàng có mã <b>${code}</b>, thời gian <b>${formattedDate}</b>, trạng thái <b>${status}</b> cần được xác nhận!
                </div>
              </div>
            `;
          }).join('');

          // Add click event for notification items
          setTimeout(() => {
            document.querySelectorAll('.notification-item').forEach(item => {
              item.onclick = function () {
                const orderId = this.getAttribute('data-id');
                goToOrderDetails(orderId);
                dropdown.classList.remove('active');
              };
            });
          }, 0);
        }
      }

      // Fetch orders for notifications
      async function fetchOrdersForNotifications() {
        const token = localStorage.getItem('authToken');
        if (!token) {
          showNotification('error', 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
          return;
        }

        try {
          const response = await fetch(`${BASE_URL}/api/orders`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error('Không thể lấy dữ liệu đơn hàng');
          }

          const ordersData = await response.json();
          const orders = ordersData.orders || [];
          renderNotifications(orders);

          // Chỉ gửi thông báo nếu có đơn hàng mới chưa từng gửi
          const pendingOrders = orders.filter(order =>
            order.order_status === 'Pending' || order.order_status === 'Processing'
          );
          if (pendingOrders.length > 0) {
            pendingOrders.sort((a, b) => new Date(b.order_date || b.createdAt) - new Date(a.order_date || a.createdAt));
            const newestOrder = pendingOrders[0];
            const lastId = getLastNotifiedOrderId();

            // Nếu chưa từng gửi cho đơn hàng này thì gửi và lưu lại id
            if (lastId !== newestOrder._id) {
              setLastNotifiedOrderId(newestOrder._id);
              const code = newestOrder.order_id || newestOrder._id || 'Không rõ';
              const status = newestOrder.order_status === 'Pending'
                ? 'Đang chờ xác nhận'
                : newestOrder.order_status === 'Processing'
                  ? 'Đang xử lý'
                  : 'Chưa rõ';
              const createdAt = newestOrder.order_date || newestOrder.createdAt || '';
              const formattedDate = createdAt
                ? new Date(createdAt).toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })
                : 'Chưa rõ';

              showNotification(
                'success',
                `<span style="display:flex;align-items:center;gap:8px;">
                  <i class="fas fa-box-open" style="font-size:22px;color:#fff;"></i>
                  <span>
                    Đơn hàng mới!<br>
                    Mã đơn <b>${code}</b>, thời gian <b>${formattedDate}</b>, trạng thái <b>${status}</b> cần được xác nhận!
                  </span>
                </span>`
              );
            }
          }
        } catch (error) {
          showNotification('error', 'Lỗi khi tải dữ liệu đơn hàng: ' + error.message);
        }
      }

      // Gọi hàm lấy thông báo khi trang được tải
      fetchOrdersForNotifications();

      window.toggleMenu = function (menuId) {
        const menu = document.getElementById(menuId);
        if (!menu) return;
        menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
      };
    });

    // Thay biến lastNotifiedOrderId bằng hàm lấy/lưu từ localStorage
    function getLastNotifiedOrderId() {
      return localStorage.getItem('lastNotifiedOrderId');
    }
    function setLastNotifiedOrderId(id) {
      localStorage.setItem('lastNotifiedOrderId', id);
    }