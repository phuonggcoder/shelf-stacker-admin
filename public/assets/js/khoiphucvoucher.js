const apiURL = 'https://server-shelf-stacker-w1ds.onrender.com/api/vouchers';
const deletedAPI = 'https://server-shelf-stacker-w1ds.onrender.com/api/vouchers/deleted';
const restoreAPI = id => `${apiURL}/restore/${id}`;
const orderApiURL = 'https://server-shelf-stacker-w1ds.onrender.com/api/orders';
const trashVoucherGrid = document.getElementById('trashVoucherGrid');

let currentRestoreVoucherId = null;
let lastNotifiedOrderId = null;

function getToken() {
  return localStorage.getItem('authToken') || '';
}

// Notification system
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

  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 500);
  }, 2500);
}

// Fetch orders for notifications
async function fetchOrders() {
  const token = getToken();
  if (!token) {
    showNotification('error', 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
    return [];
  }

  try {
    const response = await fetch(orderApiURL, {
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
    return ordersData.orders || [];
  } catch (error) {
    showNotification('error', 'Lỗi khi tải đơn hàng: ' + error.message);
    return [];
  }
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
        item.onclick = function() {
          const orderId = this.getAttribute('data-id');
          goToOrderDetails(orderId);
          dropdown.classList.remove('active');
        };
      });
    }, 0);
  }
}

// Handle new order notifications
async function handleOrderNotifications() {
  const orders = await fetchOrders();
  const pendingOrders = orders.filter(order =>
    order.order_status === 'Pending' || order.order_status === 'Processing'
  );

  if (pendingOrders.length > 0) {
    pendingOrders.sort((a, b) => new Date(b.order_date || b.createdAt) - new Date(a.order_date || a.createdAt));
    const newestOrder = pendingOrders[0];
    if (lastNotifiedOrderId !== newestOrder._id) {
      lastNotifiedOrderId = newestOrder._id;
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

  renderNotifications(orders);
}

// Toggle notification dropdown
function toggleNotificationDropdown() {
  const dropdown = document.getElementById('notificationDropdown');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
}

function goToOrderDetails(orderId) {
  window.location.href = 'danhmucdonhang';
}

// Load dialog xác nhận khôi phục
async function loadRestoreDialogHTML() {
  try {
    const res = await fetch('/components/dialogs/confirm-restore-dialog.html');
    if (!res.ok) throw new Error('Không thể tải dialog xác nhận khôi phục');
    const html = await res.text();
    document.body.insertAdjacentHTML('beforeend', html);

    document.querySelector('#confirm-restore-dialog .btn-cancel')
      .addEventListener('click', () => {
        document.getElementById('confirm-restore-dialog').style.display = 'none';
        currentRestoreVoucherId = null;
      });

    document.querySelector('#confirm-restore-dialog .btn-ok')
      .addEventListener('click', () => {
        if (currentRestoreVoucherId) {
          sendRestoreRequest(currentRestoreVoucherId);
          document.getElementById('confirm-restore-dialog').style.display = 'none';
          currentRestoreVoucherId = null;
        }
      });
  } catch (err) {
    console.error('Lỗi khi tải dialog xác nhận:', err);
    showNotification('error', 'Không thể hiển thị dialog xác nhận khôi phục.');
  }
}

// Load dialog thông báo thành công
async function loadSuccessDialogHTML() {
  try {
    const res = await fetch('/components/dialogs/success-restore-dialog.html');
    if (!res.ok) throw new Error('Không thể tải dialog thành công');
    const html = await res.text();
    document.body.insertAdjacentHTML('beforeend', html);

    const closeBtn = document.getElementById('close-success-restore');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        const dialog = document.getElementById('success-restore-dialog');
        if (dialog) dialog.style.display = 'none';
      });
    } else {
      console.error('Không tìm thấy nút đóng dialog thành công!');
    }
  } catch (err) {
    console.error('Lỗi khi tải dialog thành công:', err);
    showNotification('error', 'Không thể hiển thị dialog thành công.');
  }
}

function showSuccessDialog() {
  const dialog = document.getElementById('success-restore-dialog');
  if (dialog) {
    dialog.style.display = 'flex';
  }
}

// Gọi API để lấy danh sách voucher đã xóa gần đây
async function fetchDeletedVouchers() {
  try {
    const token = getToken();
    if (!token) {
      showNotification('error', 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
      window.location.href = 'login.html';
      return;
    }

    const res = await fetch(deletedAPI, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error(`Lỗi khi gọi API: ${res.status}`);

    const data = await res.json();
    renderDeletedVouchers(data);
  } catch (err) {
    console.error('Lỗi khi tải voucher đã xóa:', err);
    trashVoucherGrid.innerHTML = '<p style="color:red;text-align:center;">Không tải được dữ liệu đã xóa.</p>';
  }
}

// Hiển thị danh sách voucher đã xóa
function renderDeletedVouchers(vouchers) {
  if (!vouchers.length) {
    trashVoucherGrid.innerHTML = '<p style="text-align:center;">Không có voucher đã xóa.</p>';
    return;
  }

  trashVoucherGrid.innerHTML = '';
  vouchers.forEach(v => {
    const discountTypeLabel = v.discount_type === 'order' ? 'Mã giảm giá' : 'Mã vận chuyển';
    const voucherTypeLabel = v.voucher_type === 'percentage' ? 'Phần trăm' : 'Giảm cố định';
    const div = document.createElement('div');
    div.className = 'voucher-card';
    div.innerHTML = `
      <div class="voucher-id">${v.voucher_id}</div>
      <div>Loại giảm giá: ${discountTypeLabel}</div>
      <div>Loại voucher: ${voucherTypeLabel}</div>
      <div>Giảm: ${v.voucher_type === 'percentage' ? v.discount_value + '%' : v.discount_value.toLocaleString('vi-VN') + ' VNĐ'}</div>
      <div>Đơn tối thiểu: ${v.min_order_value.toLocaleString('vi-VN')} VNĐ</div>
      <div>Lượt dùng: ${v.usage_limit}</div>
      <div>Dùng tối đa/1 người: ${v.max_per_user}</div>
      <button class="restore-btn" onclick="confirmRestoreVoucher('${v._id}')">Khôi phục</button>
    `;
    trashVoucherGrid.appendChild(div);
  });
}

// Hiển thị dialog xác nhận khôi phục
function confirmRestoreVoucher(id) {
  currentRestoreVoucherId = id;
  const dialog = document.getElementById('confirm-restore-dialog');
  if (dialog) {
    dialog.style.display = 'flex';
  }
}

// Gửi yêu cầu khôi phục voucher
async function sendRestoreRequest(id) {
  try {
    const token = getToken();
    const res = await fetch(restoreAPI(id), {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error('Khôi phục thất bại');

    const data = await res.json();
    fetchDeletedVouchers();
    showSuccessDialog();
    showNotification('success', 'Khôi phục voucher thành công!');
  } catch (err) {
    console.error('Lỗi khôi phục:', err);
    showNotification('error', 'Lỗi khi khôi phục voucher.');
  }
}

// Khởi động
window.onload = () => {
  const savedAvatar = localStorage.getItem('userAvatar');
  if (savedAvatar) {
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    const headerAvatar = document.getElementById('headerAvatar');
    if (sidebarAvatar) sidebarAvatar.src = savedAvatar.replace('https://server-shelf-stacker.onrender.com', 'https://server-shelf-stacker-w1ds.onrender.com');
    if (headerAvatar) headerAvatar.src = savedAvatar.replace('https://server-shelf-stacker.onrender.com', 'https://server-shelf-stacker-w1ds.onrender.com');
  }

  const uploadDialog = document.getElementById('uploadDialog');
  uploadDialog.removeAttribute('open');

  loadRestoreDialogHTML();
  loadSuccessDialogHTML();
  fetchDeletedVouchers();
  handleOrderNotifications();

  const notificationBell = document.querySelector('.notification-bell');
  if (notificationBell) {
    notificationBell.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleNotificationDropdown();
    });
  }

  document.addEventListener('click', function (event) {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown && dropdown.classList.contains('active')) {
      if (!event.target.closest('.notification-bell')) {
        dropdown.classList.remove('active');
      }
    }
  });

  const settingsLink = document.getElementById('settingsLink');
  if (settingsLink) {
    settingsLink.addEventListener('click', () => {
      document.getElementById('mainSidebar').classList.add('hidden');
      document.getElementById('settingsSidebar').classList.remove('hidden');
    });
  }

  const backButton = document.getElementById('backButton');
  if (backButton) {
    backButton.addEventListener('click', () => {
      document.getElementById('settingsSidebar').classList.add('hidden');
      document.getElementById('mainSidebar').classList.remove('hidden');
    });
  }

  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userAvatar');
      localStorage.removeItem('userId');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    });
  }

  const sidebarAvatar = document.getElementById('sidebarAvatar');
  if (sidebarAvatar) {
    sidebarAvatar.onclick = () => {
      uploadDialog.showModal();
      resetUploadDialog();
    };
  }

  const cancelButton = document.getElementById('cancelButton');
  if (cancelButton) {
    cancelButton.onclick = () => {
      uploadDialog.close();
      resetUploadDialog();
    };
  }

  uploadDialog.addEventListener('close', () => {
    resetUploadDialog();
  });

  const uploadButton = document.getElementById('uploadButton');
  if (uploadButton) {
    uploadButton.onclick = async () => {
      const fileInput = document.getElementById('avatarUpload');
      const file = fileInput.files[0];

      if (!file) {
        showNotification('error', 'Vui lòng chọn một ảnh.');
        return;
      }

      if (!file.type.startsWith('image/')) {
        showNotification('error', 'Vui lòng chọn một file ảnh hợp lệ.');
        return;
      }

      const token = getToken();
      const userId = localStorage.getItem('userId');

      if (!token) {
        showNotification('error', 'Bạn chưa đăng nhập hoặc token không hợp lệ. Vui lòng đăng nhập lại.');
        return;
      }

      if (!userId) {
        showNotification('error', 'Thiếu userId. Vui lòng đăng nhập lại.');
        return;
      }

      uploadButton.disabled = true;
      uploadButton.textContent = 'Đang tải...';

      try {
        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('userId', userId);

        const response = await fetch('https://server-shelf-stacker-w1ds.onrender.com/api/user-upload/avatar', {
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

        document.getElementById('sidebarAvatar').src = imageUrl;
        document.getElementById('headerAvatar').src = imageUrl;

        localStorage.setItem('userAvatar', imageUrl);

        showNotification('success', 'Đã cập nhật ảnh đại diện thành công!');

        setTimeout(() => {
          uploadDialog.close();
          resetUploadDialog();
        }, 2000);
      } catch (error) {
        showNotification('error', 'Lỗi: ' + error.message);
        uploadButton.disabled = false;
        uploadButton.textContent = 'Tải lên';
      }
    };
  }

  function resetUploadDialog() {
    document.getElementById('avatarUpload').value = '';
    const uploadMessage = document.getElementById('uploadMessage');
    uploadMessage.style.display = 'none';
    uploadMessage.textContent = '';
    uploadMessage.className = 'notification';
    uploadButton.disabled = false;
    uploadButton.textContent = 'Tải lên';
  }
};

function toggleMenu(id) {
  const el = document.getElementById(id);
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}