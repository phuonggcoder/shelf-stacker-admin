const BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';
let allUsers = [];
let currentPage = 1;
const USERS_PER_PAGE = 15;
let currentUserId = null;
let currentUserIsActive = true;
let lastNotifiedOrderId = null;

function getToken() {
  return localStorage.getItem('authToken') || '';
}

// Load dialog khóa người dùng
async function loadLockUserDialogHTML() {
  try {
    const res = await fetch('components/dialogs/dialog-lock-user.html');
    if (!res.ok) throw new Error('Không thể tải dialog khóa người dùng');
    const html = await res.text();
    document.body.insertAdjacentHTML('beforeend', html);

    document.querySelector('#dialog-lock-user .cancel-btn')
      .addEventListener('click', cancelLockUser);
    document.querySelector('#dialog-lock-user .confirm-btn')
      .addEventListener('click', confirmLockUser);
  } catch (err) {
    console.error('Lỗi khi tải dialog khóa người dùng:', err);
    showNotification('error', 'Lỗi tải dialog xác nhận khóa người dùng! Vui lòng thử lại.');
  }
}

// Load dialog thông báo thành công
async function loadSuccessDialogHTML() {
  try {
    const res = await fetch('components/dialogs/success-dialog.html');
    if (!res.ok) throw new Error('Không thể tải dialog thành công');
    const html = await res.text();
    document.body.insertAdjacentHTML('beforeend', html);

    document.querySelector('#success-dialog .btn-ok')
      .addEventListener('click', () => {
        document.getElementById('success-dialog').style.display = 'none';
      });
  } catch (err) {
    console.error('Lỗi khi tải dialog thành công:', err);
    showNotification('error', 'Lỗi tải dialog thành công! Vui lòng thử lại.');
  }
}

// Hiển thị dialog thành công
function showSuccessDialog(message = 'Thao tác thành công!') {
  const dialog = document.getElementById('success-dialog');
  if (!dialog) return;

  dialog.querySelector('.success-message').textContent = message;
  dialog.style.display = 'flex';
}

// Mở dialog xác nhận khóa/mở khóa
function showLockUserDialog(userId, isActive) {
  currentUserId = userId;
  currentUserIsActive = isActive;

  const dialog = document.getElementById('dialog-lock-user');
  if (!dialog) return;

  document.getElementById('lock-user-message').textContent =
    isActive ? 'Bạn có chắc muốn khóa người dùng này?' : 'Bạn có chắc muốn mở khóa người dùng này?';

  dialog.style.display = 'flex';
}

function cancelLockUser() {
  document.getElementById('dialog-lock-user').style.display = 'none';
  currentUserId = null;
}

// Xác nhận khóa/mở khóa người dùng
async function confirmLockUser() {
  try {
    const res = await fetch(`${BASE_URL}/auth/users/${currentUserId}/lock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
      },
      body: JSON.stringify({ isActive: !currentUserIsActive })
    });

    if (res.ok) {
      showSuccessDialog(`${currentUserIsActive ? 'Khóa' : 'Mở khóa'} người dùng thành công!`);
      fetchUsers();
    } else {
      const err = await res.json();
      showNotification('error', `Thất bại: ${err.message || 'Lỗi không xác định!'}`);
    }
  } catch (err) {
    showNotification('error', 'Lỗi kết nối! Vui lòng kiểm tra internet.');
  } finally {
    document.getElementById('dialog-lock-user').style.display = 'none';
    currentUserId = null;
  }
}

// Lấy danh sách người dùng
async function fetchUsers() {
  const tbody = document.getElementById('user-table-body');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Đang tải...</td></tr>';
  try {
    const res = await fetch(`${BASE_URL}/auth/users`, {
      headers: {
        'Authorization': 'Bearer ' + getToken()
      }
    });
    if (!res.ok) {
      const error = await res.json();
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Lỗi tải dữ liệu: ${error.message || 'Vui lòng thử lại sau.'}</td></tr>`;
      return;
    }
    const data = await res.json();
    allUsers = Array.isArray(data) ? data : [];
    filterAndRenderUsers();
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Lỗi kết nối server! Vui lòng kiểm tra internet.</td></tr>';
  }
}

// Render danh sách người dùng
function renderUsers(users) {
  const tbody = document.getElementById('user-table-body');
  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Không có dữ liệu</td></tr>';
    renderPagination(1, 1);
    return;
  }

  const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;
  const startIdx = (currentPage - 1) * USERS_PER_PAGE;
  const endIdx = startIdx + USERS_PER_PAGE;
  const usersToShow = users.slice(startIdx, endIdx);

  tbody.innerHTML = '';
  usersToShow.forEach((user, idx) => {
    const address = user.address
      ? `<div><b>Địa chỉ:</b> ${user.address.street || ''}, ${user.address.ward || ''}, ${user.address.district || ''}, ${user.address.city || ''}, ${user.address.country || ''}</div>`
      : '<div><b>Địa chỉ:</b> Không có</div>';

    tbody.innerHTML += `
      <tr>
        <td>${user.full_name || user.username || ''}</td>
        <td>${user.email || ''}</td>
        <td>${user.phone_number || ''}</td>
        <td>
          <span style="color: ${user.isActive ? '#28a745' : '#FF0000'};">
            ${user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
          </span>
        </td>
        <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : ''}</td>
        <td class="actions">
          <button class="btn btn-detail" data-idx="${idx + startIdx}">Chi tiết</button>
          <button class="btn btn-lock-toggle" data-id="${user._id}" data-active="${user.isActive}">
            ${user.isActive ? 'Khóa' : 'Mở khóa'}
          </button>
          ${Array.isArray(user.roles) && user.roles.includes('shipper') ? `
            <button class="btn btn-shipper-toggle" data-id="${user._id}" data-verified="${!!user.shipper_verified}">
              ${user.shipper_verified ? 'Hủy duyệt Shipper' : 'Duyệt Shipper'}
            </button>
          ` : ''}
        </td>
      </tr>
      <tr class="user-detail-row" id="detail-row-${idx + startIdx}" style="display:none; background:#f8f9fa;">
        <td colspan="6" style="padding:12px 24px;">
          ${address}
          <div><b>Giới tính:</b> ${user.gender || 'Không rõ'}</div>
          <div><b>Đã xác thực email:</b> ${user.is_verified ? 'Có' : 'Chưa'}</div>
          <div><b>Quyền:</b> ${(user.roles || []).join(', ')}</div>
        </td>
      </tr>
    `;
  });

  renderPagination(currentPage, totalPages);
}

// Render phân trang
function renderPagination(page, totalPages) {
  const pagination = document.getElementById('pagination');
  if (!pagination) return;
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let buttons = `
    <button id="prevPage" ${page === 1 ? 'disabled' : ''} class="page-circle-btn">
      <i class="fas fa-chevron-left"></i>
    </button>
  `;

  // Hiển thị số trang (ví dụ: 1 ... 4 5 6 ... 10)
  let pageNumbers = '';
  const maxPages = 5;
  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, page + 2);
  if (end - start < maxPages - 1) {
    if (start === 1) end = Math.min(totalPages, start + maxPages - 1);
    else if (end === totalPages) start = Math.max(1, end - maxPages + 1);
  }
  if (start > 1) pageNumbers += `<span class="page-ellipsis">...</span>`;
  for (let i = start; i <= end; i++) {
    pageNumbers += `<button class="page-btn${i === page ? ' active' : ''}" data-page="${i}">${i}</button>`;
  }
  if (end < totalPages) pageNumbers += `<span class="page-ellipsis">...</span>`;
  buttons += pageNumbers;
  buttons += `
    <button id="nextPage" ${page === totalPages ? 'disabled' : ''} class="page-circle-btn">
      <i class="fas fa-chevron-right"></i>
    </button>
  `;
  pagination.innerHTML = buttons;

  // Thêm sự kiện cho nút Previous
  document.getElementById('prevPage').onclick = () => {
    if (page > 1) {
      currentPage--;
      filterAndRenderUsers();
    }
  };

  // Thêm sự kiện cho nút Next
  document.getElementById('nextPage').onclick = () => {
    if (page < totalPages) {
      currentPage++;
      filterAndRenderUsers();
    }
  };

  // Thêm sự kiện cho các nút số trang
  document.querySelectorAll('.page-btn').forEach(btn => {
    btn.onclick = function() {
      const gotoPage = Number(this.dataset.page);
      if (gotoPage !== page) {
        currentPage = gotoPage;
        filterAndRenderUsers();
      }
    };
  });
}

// Tìm kiếm và lọc người dùng
function filterAndRenderUsers() {
  const keyword = document.querySelector('.search-filter .input').value.trim().toLowerCase();
  const status = document.querySelector('.search-filter .select').value;
  const activeRoleTab = document.querySelector('.role-tabs .user-tab.active');
  const roleType = activeRoleTab ? activeRoleTab.getAttribute('data-type') : 'user';

  let filtered = allUsers.filter(u => {
    const matchesKeyword = ((u.full_name || u.username || '') + ' ' + (u.email || '') + ' ' + (u.phone_number || '')).toLowerCase().includes(keyword);
    return matchesKeyword;
  });

  if (status === 'active') filtered = filtered.filter(u => u.isActive);
  if (status === 'locked') filtered = filtered.filter(u => !u.isActive);

  if (roleType === 'user') {
    filtered = filtered.filter(u => !Array.isArray(u.roles) || (Array.isArray(u.roles) && !u.roles.includes('admin') && !u.roles.includes('shipper')));
  } else if (roleType === 'admin') {
    filtered = filtered.filter(u => Array.isArray(u.roles) && u.roles.includes('admin'));
  } else if (roleType === 'shipper') {
    filtered = filtered.filter(u => Array.isArray(u.roles) && u.roles.includes('shipper'));
  }

  renderUsers(filtered);
}

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
  } catch (error) {
    showNotification('error', 'Lỗi khi tải dữ liệu đơn hàng: ' + error.message);
  }
}

// Sự kiện chính
document.addEventListener('DOMContentLoaded', () => {
  loadLockUserDialogHTML();
  loadSuccessDialogHTML();
  fetchUsers();
  fetchOrdersForNotifications();

  document.querySelector('.search-filter .input').addEventListener('input', () => {
    currentPage = 1;
    filterAndRenderUsers();
  });
  document.querySelector('.search-filter .select').addEventListener('change', () => {
    currentPage = 1;
    filterAndRenderUsers();
  });

  document.getElementById('btnAddAdmin').onclick = () => {
    document.getElementById('adminEmail').value = '';
    document.getElementById('adminFullName').value = '';
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
    document.getElementById('addAdminDialog').showModal();
  };

  document.getElementById('cancelAddAdmin').onclick = () => {
    document.getElementById('addAdminDialog').close();
  };

  document.getElementById('addAdminForm').onsubmit = async (e) => {
    e.preventDefault();

    const email = document.getElementById('adminEmail').value.trim();
    const fullName = document.getElementById('adminFullName').value.trim();
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value.trim();

    if (!email || !fullName || !username || !password) {
      document.getElementById('addAdminMessage').textContent = 'Vui lòng điền đầy đủ thông tin.';
      document.getElementById('addAdminMessage').style.display = 'block';
      return;
    }

    document.getElementById('addAdminMessage').style.display = 'none';

    const token = localStorage.getItem('authToken');

    if (!token) {
      showNotification('error', 'Bạn chưa đăng nhập hoặc token không hợp lệ. Vui lòng đăng nhập lại.');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/users/admin/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, full_name: fullName, username, password, roles: ['admin'] })
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMsg = data.message || 'Lỗi khi thêm admin';
        throw new Error(errorMsg);
      }

      document.getElementById('addAdminMessage').textContent = 'Thêm admin thành công!';
      document.getElementById('addAdminMessage').style.display = 'block';

      document.getElementById('adminEmail').value = '';
      document.getElementById('adminFullName').value = '';
      document.getElementById('adminUsername').value = '';
      document.getElementById('adminPassword').value = '';

      setTimeout(() => {
        document.getElementById('addAdminDialog').close();
        document.querySelectorAll('.user-tab').forEach(t => t.classList.remove('active'));
        const adminTab = document.querySelector('.user-tab[data-type="admin"]');
        if (adminTab) adminTab.classList.add('active');
        fetchUsers();
        setTimeout(() => filterAndRenderUsersByTab('admin'), 400);
      }, 1000);

    } catch (error) {
      document.getElementById('addAdminMessage').textContent = 'Lỗi: ' + error.message;
      document.getElementById('addAdminMessage').style.display = 'block';
    }
  };

  document.querySelectorAll('.user-tab').forEach(tab => {
    tab.onclick = function() {
      const group = this.parentElement;
      group.querySelectorAll('.user-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      currentPage = 1;
      filterAndRenderUsers();
    };
  });

  document.getElementById('user-table-body').addEventListener('click', function (e) {
    if (e.target.classList.contains('btn-detail')) {
      const idx = e.target.getAttribute('data-idx');
      const detailRow = document.getElementById('detail-row-' + idx);
      if (detailRow.style.display === 'none') {
        detailRow.style.display = '';
        e.target.textContent = 'Ẩn chi tiết';
      } else {
        detailRow.style.display = 'none';
        e.target.textContent = 'Chi tiết';
      }
    }

    if (e.target.classList.contains('btn-lock-toggle')) {
      const id = e.target.getAttribute('data-id');
      const isActive = e.target.getAttribute('data-active') === 'true';
      showLockUserDialog(id, isActive);
    }

    if (e.target.classList.contains('btn-shipper-toggle')) {
      const id = e.target.getAttribute('data-id');
      const verified = e.target.getAttribute('data-verified') === 'true';
      const confirmMsg = verified ? 'Bạn có chắc muốn hủy duyệt shipper này?' : 'Bạn có chắc muốn duyệt shipper này?';
      if (!confirm(confirmMsg)) return;

      const token = getToken();
      if (!token) {
        showNotification('error', 'Bạn chưa đăng nhập hoặc token không hợp lệ.');
        return;
      }

      const payload = { shipper_verified: !verified };
      if (verified === true) {
        payload.clearDeviceTokensOnUnverify = true;
      }

      fetch(`${BASE_URL}/auth/users/${id}/shipper-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(payload)
      }).then(async res => {
        const resText = await res.text().catch(() => '');
        let resJson = {};
        try { resJson = resText ? JSON.parse(resText) : {}; } catch(e) { /* not JSON */ }
        if (res.ok) {
          showSuccessDialog('Cập nhật trạng thái shipper thành công');
          fetchUsers();
        } else {
          console.error('Shipper status update failed', { status: res.status, bodyText: resText, bodyJson: resJson });
          showNotification('error', `Thất bại: ${resJson.message || resJson.error || resText || 'Lỗi server'}`);
        }
      }).catch(err => {
        console.error('Error updating shipper status:', err);
        showNotification('error', 'Lỗi khi cập nhật trạng thái shipper');
      });
    }
  });
});

function filterAndRenderUsersByTab(type) {
  const tab = document.querySelector(`.role-tabs .user-tab[data-type="${type}"]`);
  if (tab) {
    document.querySelectorAll('.role-tabs .user-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  }
  filterAndRenderUsers();
}