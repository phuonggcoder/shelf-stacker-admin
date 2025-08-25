const base_url = 'https://server-shelf-stacker-w1ds.onrender.com';
// Nếu test local, bạn chỉ cần đổi lại:
// const base_url = 'http://localhost:3000';

function getToken() {
  return localStorage.getItem('authToken') || '';
}

let trashCategoriesData = [];
let lastNotifiedOrderId = null;

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
    const response = await fetch(`${base_url}/api/orders`, {
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

async function fetchTrashCategories() {
  const grid = document.getElementById('trashCategoryGrid');
  grid.innerHTML = '<p>Đang tải...</p>';
  try {
    const token = getToken();
    if (!token) {
      showNotification('error', 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
      window.location.href = 'login';
      return;
    }

    const res = await fetch(`${base_url}/api/categories/trash/all`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) {
      grid.innerHTML = '<p>Lỗi tải dữ liệu! Vui lòng thử lại sau.</p>';
      return;
    }
    trashCategoriesData = await res.json();
    renderTrashCategories(trashCategoriesData);
  } catch (err) {
    grid.innerHTML = '<p>Lỗi kết nối server! Vui lòng kiểm tra kết nối internet.</p>';
    showNotification('error', 'Lỗi kết nối server! Vui lòng kiểm tra kết nối internet.');
  }
}

function filterTrashCategories(keyword) {
  keyword = keyword.trim().toLowerCase();
  if (!keyword) {
    renderTrashCategories(trashCategoriesData);
    return;
  }
  const filtered = trashCategoriesData.filter(cat =>
    (cat.name && cat.name.toLowerCase().includes(keyword)) ||
    (cat.slug && cat.slug.toLowerCase().includes(keyword))
  );
  renderTrashCategories(filtered);
}

async function checkCategoryHasProducts(categoryId) {
  try {
    const token = getToken();
    const res = await fetch(`${base_url}/api/books/category/${categoryId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) {
      throw new Error('Lỗi khi kiểm tra sản phẩm trong danh mục.');
    }
    const data = await res.json();
    return Array.isArray(data.books) && data.books.length > 0;
  } catch (err) {
    console.error('Lỗi kiểm tra sản phẩm:', err);
    showNotification('error', 'Lỗi khi kiểm tra sản phẩm trong danh mục.');
    return true; // Nếu lỗi, không cho xóa
  }
}

function renderTrashCategories(categories) {
  const grid = document.getElementById('trashCategoryGrid');
  grid.innerHTML = '';
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    grid.innerHTML = '<p>Không có danh mục đã xóa gần đây.</p>';
    return;
  }
  categories.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'category-card product-card';
    card.innerHTML = `
      <div class="category-info info">
        <p><b>ID:</b> ${cat._id || ''}</p>
        <h3>${cat.name || ''}</h3>
        <p><b>Slug:</b> ${cat.slug || ''}</p>
        <p><b>Mô tả:</b> <span>${cat.description || ''}</span></p>
        ${cat.image ? `<p><b>Ảnh:</b> <img src="${cat.image.replace('https://server-shelf-stacker.onrender.com', 'https://server-shelf-stacker-w1ds.onrender.com')}" alt="Ảnh danh mục" style="max-width:60px;max-height:60px;border-radius:4px;border:1px solid #ccc;vertical-align:middle;" onerror="this.style.display='none'"></p>` : ''}
        <p><b>Hiển thị:</b> ${cat.isVisible ? 'Có' : 'Không'}</p>
        <p><b>Ngày tạo:</b> ${cat.createdAt ? new Date(cat.createdAt).toLocaleString() : ''}</p>
        <p><b>Ngày cập nhật:</b> ${cat.updatedAt ? new Date(cat.updatedAt).toLocaleString() : ''}</p>
        <p><b>Ngày xóa:</b> ${cat.deletedAt ? new Date(cat.deletedAt).toLocaleString() : ''}</p>
      </div>
      <div class="actions">
        <button class="restore-btn" data-id="${cat._id}"><i class="fa fa-undo"></i> Khôi phục</button>
        <button class="force-delete-btn" data-id="${cat._id}"><i class="fa fa-trash"></i> Xóa vĩnh viễn</button>
      </div>
    `;
    grid.appendChild(card);
  });

  // Sự kiện khôi phục
  document.querySelectorAll('.restore-btn').forEach(btn => {
    btn.onclick = async function() {
      const id = this.getAttribute('data-id');
      if (await showConfirmDeleteDialog('Bạn có chắc chắn muốn khôi phục danh mục này?')) {
        try {
          const res = await fetch(`${base_url}/api/categories/${id}/restore`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          if (!res.ok) {
            const error = await res.json();
            showNotification('error', error.message || 'Khôi phục thất bại! Vui lòng thử lại sau hoặc liên hệ admin.');
            return;
          }
          showUpdateBookSuccessDialog();
          fetchTrashCategories();
          showNotification('success', 'Khôi phục danh mục thành công!');
        } catch (err) {
          showNotification('error', 'Lỗi kết nối! Vui lòng kiểm tra kết nối internet và thử lại.');
        }
      }
    };
  });

  // Sự kiện xóa cứng
  document.querySelectorAll('.force-delete-btn').forEach(btn => {
    btn.onclick = async function() {
      const id = this.getAttribute('data-id');
      if (await showConfirmDeleteDialog('Bạn có chắc chắn muốn xóa vĩnh viễn danh mục này? Hành động này không thể hoàn tác!')) {
        try {
          const hasProducts = await checkCategoryHasProducts(id);
          if (hasProducts) {
            showNotification('error', 'Danh mục này vẫn còn chứa sản phẩm. Vui lòng xóa hoặc chuyển các sản phẩm trước khi xóa vĩnh viễn.');
            return;
          }

          const res = await fetch(`${base_url}/api/categories/${id}/force`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (!res.ok) {
            const error = await res.json();
            showNotification('error', error.message || 'Xóa vĩnh viễn thất bại! Vui lòng thử lại sau hoặc liên hệ admin.');
            return;
          }
          showSuccessDeletebook();
          fetchTrashCategories();
          showNotification('success', 'Xóa vĩnh viễn danh mục thành công!');
        } catch (err) {
          showNotification('error', 'Lỗi kết nối! Vui lòng kiểm tra kết nối internet và thử lại.');
        }
      }
    };
  });
}

// Dialog functions
function showSuccessDeletebook() {
  const dialog = document.createElement('div');
  dialog.id = 'dialog-success-delete-book';
  dialog.style.cssText = 'position: fixed; inset: 0; z-index: 9999; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-family: \'Segoe UI\', sans-serif;';
  dialog.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 24px 32px; max-width: 360px; width: 100%; text-align: center;">
      <img src="https://img.icons8.com/color/48/000000/ok--v1.png" alt="ok">
      <h3 style="margin-top: 12px; font-size: 18px;">Đã xóa vĩnh viễn danh mục thành công!</h3>
      <button onclick="closeDeleteDialog()" style="margin-top: 20px; padding: 8px 24px; background: #00cfff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">OK</button>
    </div>
  `;
  document.body.appendChild(dialog);
  setTimeout(() => dialog.style.display = 'flex', 0);
}

function showErrorDialog(title, message) {
  const dialog = document.createElement('div');
  dialog.id = 'dialog-error';
  dialog.style.cssText = 'position: fixed; inset: 0; z-index: 9999; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-family: \'Segoe UI\', sans-serif;';
  dialog.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 24px 32px; max-width: 360px; width: 100%; text-align: center;">
      <img src="https://img.icons8.com/color/48/000000/error.png" alt="error">
      <h3 style="margin-top: 12px; font-size: 18px;">${title}</h3>
      <p style="color: #d32f2f;">${message}</p>
      <button onclick="this.parentElement.parentElement.style.display='none'" style="margin-top: 20px; padding: 8px 24px; background: #ff4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">OK</button>
    </div>
  `;
  document.body.appendChild(dialog);
  setTimeout(() => dialog.style.display = 'flex', 0);
}

function showAddBookSuccessDialog() {
  const dialog = document.createElement('div');
  dialog.id = 'dialog-success-add-book';
  dialog.style.cssText = 'position: fixed; inset: 0; z-index: 9999; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-family: \'Segoe UI\', sans-serif;';
  dialog.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 24px 32px; max-width: 360px; width: 100%; text-align: center;">
      <img src="https://img.icons8.com/color/48/000000/ok--v1.png" alt="ok">
      <h3 style="font-size: 18px; margin-bottom: 24px;">Thêm danh mục thành công!</h3>
      <div style="display: flex; justify-content: space-around;">
        <button onclick="closeAddBookDialog()" style="padding: 8px 24px; background: #e0e0e0; color: #000; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Quay lại</button>
        <button onclick="closeAddBookDialog()" style="padding: 8px 24px; background: #00cfff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Xác nhận</button>
      </div>
    </div>
  `;
  document.body.appendChild(dialog);
  setTimeout(() => dialog.style.display = 'flex', 0);
}

function showUpdateBookSuccessDialog() {
  const dialog = document.createElement('div');
  dialog.id = 'dialog-success-update-book';
  dialog.style.cssText = 'position: fixed; inset: 0; z-index: 9999; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-family: \'Segoe UI\', sans-serif;';
  dialog.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 24px 32px; max-width: 360px; width: 100%; text-align: center;">
      <img src="https://img.icons8.com/color/48/000000/ok--v1.png" alt="ok">
      <h3 style="font-size: 18px; margin-bottom: 20px;">Khôi phục danh mục thành công!</h3>
      <button onclick="closeUpdateBookDialog()" style="padding: 8px 24px; background: #00cfff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">OK</button>
    </div>
  `;
  document.body.appendChild(dialog);
  setTimeout(() => dialog.style.display = 'flex', 0);
}

function showConfirmDeleteDialog(message = 'Bạn có chắc muốn thực hiện hành động này?') {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.id = 'confirm-delete-overlay';
    overlay.style.cssText = 'position: fixed; inset: 0; z-index: 9998; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-family: \'Segoe UI\', sans-serif;';
    overlay.innerHTML = `
      <div style="background: white; border-radius: 12px; padding: 16px 20px; max-width: 360px; width: 100%; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); text-align: left;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <img src="https://img.icons8.com/fluency/24/delete-sign.png" alt="delete-icon" />
          <span style="font-size: 15px;">${message}</span>
        </div>
        <div style="height: 2px; background-color: #00cfff; margin-bottom: 16px;"></div>
        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <button id="btn-cancel-delete" style="padding: 6px 16px; background: #ffecec; color: #f44336; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Hủy</button>
          <button id="btn-ok-delete" style="padding: 6px 16px; background: #00cfff; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#btn-cancel-delete').onclick = () => { document.body.removeChild(overlay); resolve(false); };
    overlay.querySelector('#btn-ok-delete').onclick = () => { document.body.removeChild(overlay); resolve(true); };
  });
}

function closeDeleteDialog() {
  const dialog = document.getElementById('dialog-success-delete-book');
  if (dialog) {
    dialog.style.display = 'none';
    document.body.removeChild(dialog);
    fetchTrashCategories();
  }
}

function closeAddBookDialog() {
  const dialog = document.getElementById('dialog-success-add-book');
  if (dialog) {
    dialog.style.display = 'none';
    document.body.removeChild(dialog);
  }
}

function closeUpdateBookDialog() {
  const dialog = document.getElementById('dialog-success-update-book');
  if (dialog) {
    dialog.style.display = 'none';
    document.body.removeChild(dialog);
    fetchTrashCategories();
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

  fetchTrashCategories();
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

  document.getElementById('btn-search-trash').onclick = () => {
    const keyword = document.getElementById('search-trash-category').value;
    filterTrashCategories(keyword);
  };

  document.getElementById('search-trash-category').onkeyup = (e) => {
    if (e.key === 'Enter') {
      filterTrashCategories(e.target.value);
    }
  };

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
        showNotification('error', 'Bạn chưa đăng nhập hoặc token không hợp lệ.');
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

        const response = await fetch(`${base_url}/api/user-upload/avatar`, {
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