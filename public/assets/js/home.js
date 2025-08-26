const BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

const STATUS_MAP = {
  Pending: 'Chờ xác nhận',
  AwaitingPickup: 'Chờ lấy hàng',
  OutForDelivery: 'Chờ giao hàng',
  Delivered: 'Đã giao',
  Returned: 'Trả hàng',
  Cancelled: 'Đã huỷ',
  Refunded: 'Đã hoàn tiền'
};

if (!localStorage.getItem('authToken')) {
  const loginDialog = document.getElementById('loginDialog');
  if (loginDialog) loginDialog.showModal();
}

function toggleMenu(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

// Sidebar toggle
const settingsLink = document.getElementById('settingsLink');
if (settingsLink) {
  settingsLink.addEventListener('click', () => {
    const mainSidebar = document.getElementById('mainSidebar');
    const settingsSidebar = document.getElementById('settingsSidebar');
    if (mainSidebar) mainSidebar.classList.add('hidden');
    if (settingsSidebar) settingsSidebar.classList.remove('hidden');
  });
}

const backButton = document.getElementById('backButton');
if (backButton) {
  backButton.addEventListener('click', () => {
    const settingsSidebar = document.getElementById('settingsSidebar');
    const mainSidebar = document.getElementById('mainSidebar');
    if (settingsSidebar) settingsSidebar.classList.add('hidden');
    if (mainSidebar) mainSidebar.classList.remove('hidden');
  });
}

// Show edit profile dialog
const editProfileButton = document.getElementById('editProfileButton');
if (editProfileButton) {
  editProfileButton.addEventListener('click', async () => {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId'); // Đúng là id

    if (!token || !userId) {
      showNotification('error', 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/auth/users/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success && result.user) {
        const userData = result.user;
        document.getElementById('editFullName').value = userData.full_name || '';
        document.getElementById('editPhoneNumber').value = userData.phone_number || '';
        document.getElementById('editBirthDate').value = userData.birth_date ? userData.birth_date.slice(0, 10) : '1990-01-01';
        document.getElementById('editGender').value = userData.gender || 'male';
        document.getElementById('editEmail').value = userData.email || '';
        document.getElementById('editUsername').value = userData.username || '';
        document.getElementById('editProfileDialog').showModal();
      } else {
        showNotification('error', 'Không lấy được thông tin người dùng.');
      }
    } catch (err) {
      showNotification('error', 'Lỗi khi lấy thông tin người dùng.');
    }
  });
}

// Cancel edit profile
const cancelProfileButton = document.getElementById('cancelProfileButton');
if (cancelProfileButton) {
  cancelProfileButton.addEventListener('click', () => {
    const editProfileDialog = document.getElementById('editProfileDialog');
    if (editProfileDialog) editProfileDialog.close();
  });
}

// Save profile changes
const saveProfileButton = document.getElementById('saveProfileButton');
if (saveProfileButton) {
  saveProfileButton.addEventListener('click', async () => {
    const fullName = document.getElementById('editFullName')?.value;
    const phoneNumber = document.getElementById('editPhoneNumber')?.value;
    const birthDate = document.getElementById('editBirthDate')?.value;
    const gender = document.getElementById('editGender')?.value;
    const email = document.getElementById('editEmail')?.value;
    const username = document.getElementById('editUsername')?.value;
    const editProfileMessage = document.getElementById('editProfileMessage');
    const editProfileDialog = document.getElementById('editProfileDialog');
    const token = localStorage.getItem('authToken');

    const data = {
      full_name: fullName,
      phone_number: phoneNumber,
      birth_date: birthDate,
      gender: gender,
      email: email,
      username: username
    };

    if (!token) {
      showNotification('error', 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
      return;
    }

    try {
      // SỬA ĐÚNG ĐƯỜNG DẪN API
      const response = await fetch(`${BASE_URL}/auth/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (editProfileMessage) {
        if (result.success) {
          localStorage.setItem('userData', JSON.stringify(result.user));
          editProfileMessage.textContent = 'Cập nhật thông tin thành công';
          editProfileMessage.className = 'notification';
          setTimeout(() => {
            if (editProfileDialog) editProfileDialog.close();
          }, 2000);
        } else {
          editProfileMessage.textContent = 'Cập nhật thất bại: ' + (result.message || 'Lỗi không xác định');
          editProfileMessage.className = 'notification error-message';
        }
        editProfileMessage.style.display = 'block';
        setTimeout(() => {
          if (editProfileMessage) editProfileMessage.style.display = 'none';
        }, 3000);
      }
    } catch (error) {
      if (editProfileMessage) {
        editProfileMessage.textContent = 'Lỗi: ' + error.message;
        editProfileMessage.className = 'notification error-message';
        editProfileMessage.style.display = 'block';
        setTimeout(() => {
          if (editProfileMessage) editProfileMessage.style.display = 'none';
        }, 3000);
      }
    }
  });
}

// Login functionality
const logoutButton = document.getElementById('logoutButton');
if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userAvatar');
    localStorage.removeItem('userId');
    localStorage.removeItem('userData');
    window.location.href = '/login'; // Chuyển về trang đăng nhập
    // Nếu không có trang login, dùng location.reload();
    // location.reload();
  });
}

const loginButton = document.getElementById('loginButton');
if (loginButton) {
  loginButton.addEventListener('click', () => {
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    const loginMessage = document.getElementById('loginMessage');
    const loginDialog = document.getElementById('loginDialog');

    const data = {
      email: email,
      password: password
    };

    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(response => response.json())
      .then(data => {
        if (loginMessage) {
          if (data.access_token && data.user && data.user._id) {
            // Sửa lại điều kiện này cho chắc chắn
            localStorage.setItem('authToken', data.access_token);
            localStorage.setItem('userId', data.user._id);
            localStorage.setItem('userData', JSON.stringify(data.user));
            loginMessage.textContent = 'Đăng nhập thành công';
            loginMessage.className = 'notification';
            if (loginDialog) loginDialog.close();
            location.reload();
          } else {
            loginMessage.textContent = 'Đăng nhập thất bại: ' + (data.error || 'Lỗi không xác định');
            loginMessage.className = 'notification error-message';
          }
          loginMessage.style.display = 'block';
          setTimeout(() => {
            if (loginMessage) loginMessage.style.display = 'none';
          }, 3000);
        }
      })
      .catch(error => {
        if (loginMessage) {
          loginMessage.textContent = 'Lỗi: ' + error.message;
          loginMessage.className = 'notification error-message';
          loginMessage.style.display = 'block';
          setTimeout(() => {
            if (loginMessage) loginMessage.style.display = 'none';
          }, 3000);
        }
      });
  });
}

// Avatar upload
const uploadDialog = document.getElementById('uploadDialog');
const uploadMessage = document.getElementById('uploadMessage');
const uploadButton = document.getElementById('uploadButton');
const cancelButton = document.getElementById('cancelButton');
const sidebarAvatar = document.getElementById('sidebarAvatar');

if (sidebarAvatar) {
  sidebarAvatar.onclick = () => {
    if (uploadDialog) {
      uploadDialog.showModal();
      resetUploadDialog();
    }
  };
}

if (cancelButton) {
  cancelButton.onclick = () => {
    if (uploadDialog) uploadDialog.close();
  };
}

if (uploadDialog) {
  uploadDialog.addEventListener('close', () => {
    resetUploadDialog();
  });
}

function resetUploadDialog() {
  const avatarUpload = document.getElementById('avatarUpload');
  if (avatarUpload) avatarUpload.value = '';
  if (uploadMessage) {
    uploadMessage.style.display = 'none';
    uploadMessage.textContent = '';
    uploadMessage.className = 'notification';
  }
  if (uploadButton) {
    uploadButton.disabled = false;
    uploadButton.textContent = 'Tải lên';
  }
}

if (uploadButton) {
  uploadButton.onclick = async (event) => {
    event.preventDefault();
    const fileInput = document.getElementById('avatarUpload');
    const file = fileInput?.files[0];

    if (!file) {
      showNotification('error', 'Vui lòng chọn một ảnh.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Vui lòng chọn một file ảnh hợp lệ.');
      return;
    }

    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    if (!token) {
      showNotification('error', 'Bạn chưa đăng nhập hoặc token không hợp lệ. Vui lòng đăng nhập lại.');
      return;
    }

    if (!userId) {
      showNotification('error', 'Thiếu userId. Vui lòng đăng nhập lại.');
      return;
    }

    if (uploadButton) {
      uploadButton.disabled = true;
      uploadButton.textContent = 'Đang tải...';
    }

    try {
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('avatar', file);

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

      const sidebarAvatar = document.getElementById('sidebarAvatar');
      const headerAvatar = document.getElementById('headerAvatar');
      if (sidebarAvatar) sidebarAvatar.src = imageUrl;
      if (headerAvatar) headerAvatar.src = imageUrl;

      localStorage.setItem('userAvatar', imageUrl);

      showNotification('success', 'Đã cập nhật ảnh đại diện thành công!');

      setTimeout(() => {
        if (uploadDialog) uploadDialog.close();
      }, 2000);
    } catch (error) {
      showNotification('error', 'Lỗi: ' + error.message);
      if (uploadButton) {
        uploadButton.disabled = false;
        uploadButton.textContent = 'Tải lên';
      }
    }
  };
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

function toggleNotificationDropdown() {
  const dropdown = document.getElementById('notificationDropdown');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
}

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
        item.onclick = function() {
          const orderId = this.getAttribute('data-id');
          goToOrderDetails(orderId);
          dropdown.classList.remove('active');
        };
      });
    }, 0);
  }
}

// Load user data and stats on page load
let lastNotifiedOrderId = null;

async function fetchStats() {
  // Dữ liệu mặc định từ BE bạn gửi
  const defaultData = {
    totalOrders: 237,
    totalRevenue: 32036686,
    statusStats: {
      Cancelled: 55,
      Processing: 16,
      Pending: 121,
      Shipped: 8,
      OutForDelivery: 15,
      null: 5,
      Delivered: 17
    },
    paymentStats: {
      ZALOPAY: 96,
      COD: 130,
      PAYOS: 10
    },
    successCount: 17,
    failedCount: 55
  };

  const token = localStorage.getItem('authToken');
  let data = defaultData;
  let orders = [];

  if (token) {
    try {
      const [statsResponse, ordersResponse] = await Promise.all([
        fetch(`${BASE_URL}/api/orders/stats/summary`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${BASE_URL}/api/orders`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!statsResponse.ok || !ordersResponse.ok) {
        throw new Error('Failed to fetch stats or orders');
      }

      data = await statsResponse.json();
      const ordersData = await ordersResponse.json();
      orders = ordersData.orders || [];
    } catch (error) {
      console.error('Error fetching stats:', error.message);
      showNotification('error', 'Lỗi khi tải thống kê: ' + error.message);
    }
  } else {
    console.error('No auth token found. Using default data.');
    showNotification('error', 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
  }

  // Hiển thị số liệu lên dashboard
  const totalOrders = document.getElementById('totalOrders');
  const totalRevenue = document.getElementById('totalRevenue');
  const successCount = document.getElementById('successCount');
  const failedCount = document.getElementById('failedCount');

  if (totalOrders) totalOrders.textContent = data.totalOrders || 0;
  if (totalRevenue) totalRevenue.textContent = (data.totalRevenue || 0).toLocaleString('vi-VN') + ' ₫';
  if (successCount) successCount.textContent = data.successCount || 0;
  if (failedCount) failedCount.textContent = data.failedCount || 0;

  // Dịch trạng thái đơn hàng sang tiếng Việt
  const statusLabels = Object.keys(data.statusStats).map(key => {
    if (key === 'null') return 'Không xác định';
    if (key === 'Cancelled') return 'Đã huỷ';
    if (key === 'Delivered') return 'Đã giao';
    if (key === 'Shipped') return 'Đang giao';
    if (key === 'Processing') return 'Đang xử lý';
    if (key === 'Pending') return 'Chờ xác nhận';
    if (key === 'OutForDelivery') return 'Chờ giao hàng';
    return key;
  });

  const statusChart = {
    type: 'pie',
    data: {
      labels: statusLabels,
      datasets: [{
        data: Object.values(data.statusStats || {}),
        backgroundColor: ['#ff4d4f', '#28a745', '#38bdf8', '#ffc107', '#0ea5e9', '#d9d9d9', '#6c63ff'],
        borderColor: ['#fff'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { size: 14 }, color: '#333' }
        },
        title: { display: false }
      }
    }
  };

  // Dịch phương thức thanh toán sang tiếng Việt
  const paymentLabels = Object.keys(data.paymentStats).map(key => {
    if (key === 'COD') return 'Thanh toán khi nhận hàng';
    if (key === 'ZALOPAY') return 'ZaloPay';
    if (key === 'PAYOS') return 'PayOS';
    if (key === 'null') return 'Không xác định';
    return key;
  });

  const paymentChart = {
    type: 'doughnut',
    data: {
      labels: paymentLabels,
      datasets: [{
        data: Object.values(data.paymentStats || {}),
        backgroundColor: [
          '#0ea5e9', // COD
          '#ff4d4f', // ZALOPAY
          '#d9d9d9', // PAYOS
          '#6c63ff', // Không xác định
        ],
        borderColor: ['#fff'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { size: 15 }, color: '#222' }
        },
        title: { display: false }
      }
    }
  };

  const statusChartElement = document.getElementById('statusChart');
  const paymentChartElement = document.getElementById('paymentChart');

  if (statusChartElement) {
    new Chart(statusChartElement, statusChart);
  }
  if (paymentChartElement) {
    new Chart(paymentChartElement, paymentChart);
  }

  // Handle notifications
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

window.onload = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const savedAvatar = localStorage.getItem('userAvatar');
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  const headerAvatar = document.getElementById('headerAvatar');

  if (sidebarAvatar && savedAvatar) {
    sidebarAvatar.src = savedAvatar.replace('https://server-shelf-stacker.onrender.com', 'https://server-shelf-stacker-w1ds.onrender.com');
  }
  if (headerAvatar && savedAvatar) {
    headerAvatar.src = savedAvatar.replace('https://server-shelf-stacker.onrender.com', 'https://server-shelf-stacker-w1ds.onrender.com');
  }

  fetchStats();
};