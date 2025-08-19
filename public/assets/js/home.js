// Chặn truy cập nếu chưa đăng nhập
if (!localStorage.getItem('authToken')) {
  window.location.href = 'login';
}

function toggleMenu(id) {
  const el = document.getElementById(id);
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

// Sidebar toggle
document.getElementById('settingsLink').addEventListener('click', () => {
  document.getElementById('mainSidebar').classList.add('hidden');
  document.getElementById('settingsSidebar').classList.remove('hidden');
});

document.getElementById('backButton').addEventListener('click', () => {
  document.getElementById('settingsSidebar').classList.add('hidden');
  document.getElementById('mainSidebar').classList.remove('hidden');
});

// Đăng xuất: xóa authToken và chuyển về trang đăng nhập
document.getElementById('logoutButton').addEventListener('click', () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userAvatar');
  localStorage.removeItem('userId');
  window.location.href = 'login';
});

document.getElementById('loginButton').addEventListener('click', () => {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  const data = {
    email: email,
    password: password
  };

  fetch('https://server-shelf-stacker-w1ds.onrender.com/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })  
  .then(response => response.json())
  .then(data => {
    const messageDiv = document.getElementById('loginMessage');
    if (data.message === 'Login successful') {
      localStorage.setItem('authToken', data.access_token); // Đúng key!
      messageDiv.textContent = 'Đăng nhập thành công';
      messageDiv.className = 'notification';
      document.getElementById('loginDialog').close();
      location.reload();
    } else {
      messageDiv.textContent = 'Đăng nhập thất bại: ' + (data.error || 'Lỗi không xác định');
      messageDiv.className = 'notification error-message';
    }
    messageDiv.style.display = 'block';
    setTimeout(() => messageDiv.style.display = 'none', 3000);
  })
  .catch(error => {
    document.getElementById('loginMessage').textContent = 'Lỗi: ' + error.message;
    document.getElementById('loginMessage').className = 'notification error-message';
    document.getElementById('loginMessage').style.display = 'block';
    setTimeout(() => document.getElementById('loginMessage').style.display = 'none', 3000);
  });
});

// Update user info
window.onload = () => {
  const userData = JSON.parse(localStorage.getItem('userData'));
  if (userData) {
    document.getElementById('fullName').value = userData.full_name || '';
    document.getElementById('phoneNumber').value = userData.phone_number || '';
    document.getElementById('birthDate').value = userData.birth_date || '1990-01-01';
    document.getElementById('gender').value = userData.gender || 'male';
    document.getElementById('email').value = userData.email || '';
    document.getElementById('username').value = userData.username || '';
  }
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  const savedAvatar = localStorage.getItem('userAvatar');
  if (sidebarAvatar && savedAvatar) {
    sidebarAvatar.src = savedAvatar;
  }
  const headerAvatar = document.getElementById('headerAvatar');
  if (headerAvatar && savedAvatar) {
    headerAvatar.src = savedAvatar;
  }
  fetchStats();
};

document.getElementById('updateButton').addEventListener('click', () => {
  const fullName = document.getElementById('fullName').value;
  const phoneNumber = document.getElementById('phoneNumber').value;
  const birthDate = document.getElementById('birthDate').value;
  const gender = document.getElementById('gender').value;
  const email = document.getElementById('email').value;
  const username = document.getElementById('username').value;

  const data = {
    full_name: fullName,
    phone_number: phoneNumber,
    birth_date: birthDate,
    gender: gender,
    email: email,
    username: username
  };

  const token = localStorage.getItem('authToken');

  fetch('https://server-shelf-stacker-w1ds.onrender.com/auth/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => {
    const messageDiv = document.getElementById('updateMessage');
    if (data.message === 'User updated successfully') {
      localStorage.setItem('userData', JSON.stringify(data.user)); // Update local storage with new data
      messageDiv.textContent = 'Cập nhật thông tin thành công';
      messageDiv.className = 'notification';
    } else {
      messageDiv.textContent = 'Cập nhật thất bại: ' + (data.error || 'Lỗi không xác định');
      messageDiv.className = 'notification error-message';
    }
    messageDiv.style.display = 'block';
    setTimeout(() => messageDiv.style.display = 'none', 3000);
  })
  .catch(error => {
    document.getElementById('updateMessage').textContent = 'Lỗi: ' + error.message;
    document.getElementById('updateMessage').className = 'notification error-message';
    document.getElementById('updateMessage').style.display = 'block';
    setTimeout(() => document.getElementById('updateMessage').style.display = 'none', 3000);
  });
});

// Avatar upload and stats fetching
const uploadDialog = document.getElementById('uploadDialog');
const uploadMessage = document.getElementById('uploadMessage');
const uploadButton = document.getElementById('uploadButton');
const cancelButton = document.getElementById('cancelButton');
const sidebarAvatar = document.getElementById('sidebarAvatar');

document.getElementById('settingsLink').onclick = () => {
  document.getElementById('mainSidebar').classList.add('hidden');
  document.getElementById('settingsSidebar').classList.remove('hidden');
};

document.getElementById('backButton').onclick = () => {
  document.getElementById('settingsSidebar').classList.add('hidden');
  document.getElementById('mainSidebar').classList.remove('hidden');
};

document.getElementById('logoutButton').onclick = () => {
  localStorage.removeItem('token');
  document.getElementById('loginDialog').showModal();
};

sidebarAvatar.onclick = () => {
  uploadDialog.showModal();
  resetUploadDialog();
};

cancelButton.onclick = () => {
  uploadDialog.close();
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

uploadButton.onclick = async (event) => {
  event.preventDefault();
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
    formData.append('userId', userId);
    formData.append('avatar', file);

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

    uploadMessage.style.display = 'block';
    uploadMessage.textContent = 'Đã cập nhật ảnh đại diện thành công!';
    uploadMessage.className = 'notification success-message';

    setTimeout(() => {
      uploadDialog.close();
    }, 2000);

  } catch (error) {
    uploadMessage.style.display = 'block';
    uploadMessage.textContent = 'Lỗi: ' + error.message;
    uploadMessage.className = 'notification error-message';
    uploadButton.disabled = false;
    uploadButton.textContent = 'Tải lên';
  }
};

async function fetchStats() {
  const defaultData = {
    totalOrders: 229,
    totalRevenue: 30248226,
    statusStats: {
      Cancelled: 54,
      Processing: 16,
      Pending: 131,
      Shipped: 8,
      AwaitingPickup: 2,
      null: 5,
      Delivered: 13
    },
    paymentStats: {
      ZALOPAY: 95,
      PAYOS: 10,
      MOMO: 1,
      COD: 123
    },
    successCount: 13,
    failedCount: 54
  };

  const token = localStorage.getItem('authToken');
  let data = defaultData;

  if (token) {
    try {
      const response = await fetch('https://server-shelf-stacker-w1ds.onrender.com/api/orders/stats/summary', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        data = await response.json();
      } else {
        throw new Error('Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error.message);
      const notification = document.createElement('div');
      notification.className = 'notification error-message';
      notification.textContent = 'Lỗi khi tải thống kê: ' + error.message;
      notification.style.display = 'block';
      document.querySelector('.stats').prepend(notification);
      setTimeout(() => notification.remove(), 5000);
    }
  } else {
    console.error('No auth token found. Using default data.');
  }

  document.getElementById('totalOrders').textContent = data.totalOrders || 0;
  document.getElementById('totalRevenue').textContent = (data.totalRevenue || 0).toLocaleString('vi-VN') + ' ₫';
  document.getElementById('successCount').textContent = data.successCount || 0;
  document.getElementById('failedCount').textContent = data.failedCount || 0;

  const statusLabels = Object.keys(data.statusStats).map(key => key === 'null' ? 'Không xác định' : {
    Cancelled: 'Hủy',
    Delivered: 'Đã giao',
    Shipped: 'Đang giao',
    Processing: 'Đang xử lý',
    Pending: 'Chờ xử lý'
  }[key] || key);

  const statusChartConfig = {
    type: 'pie',
    data: {
      labels: statusLabels,
      datasets: [{
        data: Object.values(data.statusStats || {}),
        backgroundColor: ['#ff4d4f', '#28a745', '#38bdf8', '#ffc107', '#0ea5e9', '#d9d9d9'],
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

  const paymentLabels = Object.keys(data.paymentStats).map(key => {
    if (key === 'null') return 'Không xác định';
    if (key === 'COD') return 'Thanh toán khi nhận hàng';
    if (key === 'ZALOPAY') return 'ZaloPay';
    if (key === 'MOMO') return 'Momo';
    if (key === 'VNPAY') return 'VNPay';
    if (key === 'BANK') return 'Chuyển khoản';
    if (key === 'PAYPAL') return 'Paypal';
    return key;
  });

  const paymentChartConfig = {
    type: 'doughnut',
    data: {
      labels: paymentLabels,
      datasets: [{
        data: Object.values(data.paymentStats || {}),
        backgroundColor: [
          '#0ea5e9', // COD - xanh dương
          '#ff4d4f', // ZALOPAY - đỏ
          '#ffc107', // MOMO - vàng
          '#6c63ff', // VNPAY - tím
          '#28a745', // Chuyển khoản - xanh lá
          '#f59e42', // Paypal - cam
          '#d9d9d9'  // Không xác định - xám
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
    new Chart(statusChartElement, statusChartConfig);
  }
  if (paymentChartElement) {
    new Chart(paymentChartElement, paymentChartConfig);
  }
}