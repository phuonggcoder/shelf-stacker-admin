window.onload = () => {
  const savedAvatar = localStorage.getItem('userAvatar');
  if (savedAvatar) {
    document.getElementById('sidebarAvatar').src = savedAvatar;
    document.getElementById('headerAvatar').src = savedAvatar;
  }
  fetchStats();
};

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
  fetch('login')
    .then(res => {
      if (res.ok) {
        localStorage.removeItem('userAvatar');
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
  event.preventDefault(); // Prevent default form submission if inside a form
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
    totalOrders: 79,
    totalRevenue: 8018406,
    statusStats: {
      Cancelled: 21,
      Delivered: 3,
      Shipped: 2,
      Processing: 1,
      Pending: 47,
      null: 5
    },
    paymentStats: {
      COD: 30,
      ZALOPAY: 25,
      MOMO: 24,
      null: 0
    },
    successCount: 3,
    failedCount: 21
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

  const paymentLabels = Object.keys(data.paymentStats).map(key => key === 'null' ? 'Không xác định' : key);

  const paymentChartConfig = {
    type: 'doughnut',
    data: {
      labels: paymentLabels,
      datasets: [{
        data: Object.values(data.paymentStats || {}),
        backgroundColor: ['#ff4d4f', '#0ea5e9', '#28a745', '#d9d9d9'],
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

  const statusChartElement = document.getElementById('statusChart');
  const paymentChartElement = document.getElementById('paymentChart');

  if (statusChartElement) {
    new Chart(statusChartElement, statusChartConfig);
  }
  if (paymentChartElement) {
    new Chart(paymentChartElement, paymentChartConfig);
  }
}