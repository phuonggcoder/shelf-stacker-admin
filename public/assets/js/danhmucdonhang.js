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

function getFullImageURL(path) {
  if (!path) return 'https://via.placeholder.com/60x80?text=No+Image';
  if (path.startsWith('http')) return path.replace('https://server-shelf-stacker.onrender.com', 'https://server-shelf-stacker-w1ds.onrender.com');
  return BASE_URL + path;
}

function isValidStatusTransition(currentStatus, newStatus, order) {
  // Nếu là trả hàng thì cho phép lên đã hoàn tiền
  if (currentStatus === 'Returned') {
    return newStatus === 'Refunded' || newStatus === 'Returned';
  }
  // Nếu là chờ xác nhận thì cho phép lên chờ lấy hàng hoặc đã hoàn tiền với đơn COD
  if (currentStatus === 'Pending') {
    const isCOD = order?.payment_method === 'COD';
    return newStatus === 'AwaitingPickup' || (newStatus === 'Refunded' && isCOD) || newStatus === 'Pending';
  }
  // Các trạng thái khác chỉ cho phép giữ nguyên
  return currentStatus === newStatus;
}

async function loadOrders(orderId = '') {
  const token = localStorage.getItem('authToken');
  if (!token) {
    showNotification('error', 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
    window.location.href = 'login.html';
    return;
  }

  let url = BASE_URL + '/api/orders';
  if (orderId) url += `/${orderId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      }
    });

    if (!response.ok) throw new Error('Token hết hạn hoặc không hợp lệ');

    const data = await response.json();
    window._loadedOrders = orderId ? [data] : data.orders || [];
    console.log('Loaded orders:', window._loadedOrders);
    filterOrdersByStatus('all');
    updateNotificationBell();

    // Thông báo popup đơn mới nhất
    const pendingOrders = window._loadedOrders.filter(order =>
      order.order_status === 'Pending' || order.order_status === 'Processing'
    );
    if (pendingOrders.length > 0) {
      // Sắp xếp mới nhất lên đầu
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
            <i class="fas fa-box-open" style="font-size:22px;color:#0ea5e9;"></i>
            <span>
              Đơn hàng mới!<br>
              Mã đơn <b>${code}</b>, thời gian <b>${formattedDate}</b>, trạng thái <b>${status}</b> cần được xác nhận!
            </span>
          </span>`
        );
      }
    }
  } catch (error) {
    console.error('[Load orders error]:', error);
    showNotification('error', 'Bạn không có quyền truy cập hoặc phiên đăng nhập đã hết hạn');
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
  }
}

function updateNotificationBell() {
  const orders = window._loadedOrders || [];
  const filteredOrders = orders.filter(order =>
    order.order_status === 'Pending' || order.order_status === 'Processing'
  );
  const notificationBadge = document.getElementById('notificationBadge');
  if (notificationBadge) {
    notificationBadge.textContent = filteredOrders.length;
    notificationBadge.style.display = filteredOrders.length > 0 ? 'inline-block' : 'none';
  }

  const notificationDropdown = document.getElementById('notificationDropdown');
  if (notificationDropdown) {
    if (filteredOrders.length === 0) {
      notificationDropdown.innerHTML = '<div style="padding: 16px; text-align: center; color: #888;">Không có đơn hàng mới cần xác nhận.</div>';
    } else {
      notificationDropdown.innerHTML = filteredOrders.map(order => {
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

        // Thêm data-status để biết trạng thái khi click
        return `
          <div class="notification-item" data-status="${statusKey}" style="padding:14px 10px; border-bottom:1px solid #eee; border-radius:8px; margin-bottom:8px; background:#f8f9fa; cursor:pointer;">
            <div style="font-size:15px; color:#0ea5e9; font-weight:500;">
              <i class="fas fa-box-open" style="margin-right:6px;"></i>
              Đơn hàng có mã <b>${code}</b>, thời gian <b>${formattedDate}</b>, trạng thái <b>${status}</b> cần được xác nhận!
            </div>
          </div>
        `;
      }).join('');

      // Thêm sự kiện click cho từng thông báo
      setTimeout(() => {
        document.querySelectorAll('.notification-item').forEach(item => {
          item.onclick = function() {
            const status = this.getAttribute('data-status');
            setActiveTab(status);
            filterOrdersByStatus(status);
            // Đóng dropdown sau khi click
            notificationDropdown.classList.remove('active');
          };
        });
      }, 0);
    }
  }
}

function goToOrderDetails(orderId) {
  window.location.href = 'danhmucdonhang';
  setTimeout(() => {
    const order = window._loadedOrders.find(o => o._id === orderId);
    if (order) {
      showOrderDetails(order);
      const tabButtons = document.querySelectorAll('.tab-button');
      tabButtons.forEach(btn => btn.classList.remove('active'));
      const activeTab = document.querySelector(`.tab-button[data-status="${order.order_status}"]`) || 
                        document.querySelector('.tab-button[data-status="all"]');
      if (activeTab) activeTab.classList.add('active');
      filterOrdersByStatus(order.order_status || 'all');
    }
  }, 100);
}

function toggleNotificationDropdown() {
  const dropdown = document.getElementById('notificationDropdown');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
}

function renderOrders(orders) {
  const tbody = document.getElementById('orders-body');
  if (!tbody) return;

  if (!orders || orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Không có đơn hàng</td></tr>';
    renderOrderPagination(1, 1);
    return;
  }

  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
  if (currentOrderPage > totalPages) currentOrderPage = totalPages;
  if (currentOrderPage < 1) currentOrderPage = 1;
  const startIdx = (currentOrderPage - 1) * ORDERS_PER_PAGE;
  const endIdx = startIdx + ORDERS_PER_PAGE;
  const ordersToShow = orders.slice(startIdx, endIdx);

  tbody.innerHTML = ordersToShow.map(order => {
    const book = order.order_items?.[0]?.book_id || {};
    const rawImage = book.thumbnail?.trim() || book.main_image?.[0];
    const image = getFullImageURL(rawImage);

    const code = order.order_id || order._id || 'Không rõ';
    const customerName = order.user_id?.username || 'Không rõ';
    const createdAt = order.order_date || order.createdAt || '';
    const total = order.total_amount?.toLocaleString('vi-VN') || '0';
    const status = STATUS_MAP[order.order_status] || 'Chưa rõ';

    const formattedDate = createdAt
      ? new Date(createdAt).toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      : 'Chưa rõ';

    const shipper = order.assigned_shipper_id;
    const shipperName = shipper
      ? `<span class="shipper-link" data-order-id="${order._id}" style="color:#0ea5e9;cursor:pointer;text-decoration:underline;">${shipper.full_name || shipper.username || shipper.phone_number || 'Chưa nhận'}</span>`
      : 'Chưa nhận';

    return `
      <tr data-id="${order._id}">
        <td><img src="${image}" alt="Ảnh bìa" class="thumb" /></td>
        <td>${code}</td>
        <td>${customerName}</td>
        <td>${formattedDate}</td>
        <td>${status}</td>
        <td>${total}₫</td>
        <td>${shipperName}</td> <!-- Hiển thị shipper nhận -->
        <td class="actions">
          <button class="btn-detail">Chi tiết</button>
          <button class="btn-update">Cập nhật</button>
        </td>
      </tr>
    `;
  }).join('');

  addOrderEventListeners();
  renderOrderPagination(currentOrderPage, totalPages);
}

function addOrderEventListeners() {
  document.querySelectorAll('.btn-detail').forEach(btn => {
    btn.removeEventListener('click', handleDetailClick);
    btn.addEventListener('click', handleDetailClick);
  });

  document.querySelectorAll('.btn-update').forEach(btn => {
    btn.removeEventListener('click', handleUpdateClick);
    btn.addEventListener('click', handleUpdateClick);
  });

  document.querySelectorAll('.shipper-link').forEach(link => {
    link.onclick = function() {
      const orderId = this.dataset.orderId;
      if (orderId) showShipperDetails(orderId);
    };
  });
}

function handleDetailClick() {
  const orderId = this.closest('tr').dataset.id;
  const order = window._loadedOrders.find(o => o._id === orderId);
  if (order) showOrderDetails(order);
}

function handleUpdateClick() {
  const orderId = this.closest('tr').dataset.id;
  const order = window._loadedOrders.find(o => o._id === orderId);
  if (!order) return;

  const modal = document.getElementById('updateStatusModal');
  if (!modal) {
    showNotification('error', 'Không tìm thấy modal cập nhật trạng thái.');
    return;
  }

  modal.dataset.orderId = order._id;
  document.getElementById('modalOrderCode').innerText = order.order_id || 'Không rõ';

  const status = order.order_status || 'Pending';
  const statusSelect = document.getElementById('statusSelect');
  if (statusSelect) {
    statusSelect.value = status;
    Array.from(statusSelect.options).forEach(option => {
      option.disabled = !isValidStatusTransition(status, option.value, order) && option.value !== status;
    });
  }
  modal.style.display = 'flex';
}

function closeUpdateModal() {
  const modal = document.getElementById('updateStatusModal');
  if (modal) modal.style.display = 'none';
}

setTimeout(() => {
  const btnSaveStatus = document.getElementById('btnSaveStatus');
  if (btnSaveStatus) {
    btnSaveStatus.addEventListener('click', async () => {
      const modal = document.getElementById('updateStatusModal');
      const orderId = modal.dataset.orderId;
      const statusSelect = document.getElementById('statusSelect');
      if (!statusSelect) {
        showNotification('error', 'Không tìm thấy trường chọn trạng thái.');
        return;
      }
      const newStatus = statusSelect.value;
      const order = window._loadedOrders.find(o => o._id === orderId);
      const currentStatus = order?.order_status;

      const validStatuses = [
        'Pending', 'AwaitingPickup', 'OutForDelivery',
        'Delivered', 'Returned', 'Cancelled', 'Refunded'
      ];
      if (!newStatus || !validStatuses.includes(newStatus)) {
        showNotification('error', 'Trạng thái không hợp lệ.');
        return;
      }

      if (!isValidStatusTransition(currentStatus, newStatus, order)) {
        showNotification('error', `Không thể chuyển từ ${STATUS_MAP[currentStatus] || currentStatus} sang ${STATUS_MAP[newStatus] || newStatus}.`);
        return;
      }

      const token = localStorage.getItem('authToken');
      if (!token) {
        showNotification('error', 'Chưa đăng nhập.');
        window.location.href = 'login.html';
        return;
      }

      try {
        const response = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token
          },
          body: JSON.stringify({ order_status: newStatus })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Lỗi cập nhật trạng thái');

        showNotification('success', '✅ Cập nhật trạng thái thành công');

        closeUpdateModal();
        await loadOrders();
      } catch (err) {
        showNotification('error', '❌ ' + (err.message || 'Có lỗi xảy ra, vui lòng thử lại!'));
      }
    });
  }
}, 100);

function showOrderDetails(order) {
  const contentEl = document.getElementById('orderDetailsContent');
  if (!contentEl) {
    showNotification('error', 'Không tìm thấy modal chi tiết đơn hàng.');
    return;
  }

  const items = order.order_items || [];
  const rows = items.map(item => {
    const book = item.book_id || {};
    const title = book.title || 'Không rõ';
    const quantity = item.quantity || 0;
    const price = item.price || 0;
    const rawImage = book.thumbnail || book.main_image?.[0];
    const image = getFullImageURL(rawImage);

    return `
      <div style="display:flex; gap:10px; margin-bottom:10px;">
        <img src="${image}" alt="${title}" style="width:60px; height:80px; object-fit:cover; border-radius:4px;">
        <div>
          <strong>${title}</strong><br>
          Số lượng: ${quantity}<br>
          Giá: ${price.toLocaleString('vi-VN')}₫
        </div>
      </div>
    `;
  }).join('');

  const customer = order.user_id || {};
  const total = order.total_amount?.toLocaleString('vi-VN') || '0';
  const createdAt = order.createdAt
    ? new Date(order.createdAt).toLocaleString('vi-VN')
    : 'Chưa rõ';

  contentEl.innerHTML = `
    <p><strong>Mã đơn hàng:</strong> ${order.order_id || 'Không rõ'}</p>
    <p><strong>Khách hàng:</strong> ${customer.username || 'Không rõ'}</p>
    <p><strong>Ngày tạo:</strong> ${createdAt}</p>
    <p><strong>Trạng thái:</strong> ${STATUS_MAP[order.order_status] || order.order_status}</p>
    <p><strong>Tổng tiền:</strong> ${total}₫</p>
    <hr />
    <h4>Sản phẩm:</h4>
    ${rows || '<p>Không có sản phẩm</p>'}
  `;

  const orderDetailsModal = document.getElementById('orderDetailsModal');
  if (orderDetailsModal) {
    orderDetailsModal.style.display = 'flex';
  }
}

function closeOrderDetailsModal() {
  const modal = document.getElementById('orderDetailsModal');
  if (modal) modal.style.display = 'none';
}

function filterOrdersByStatus(status) {
  let filteredOrders = window._loadedOrders || [];

  if (status !== 'all') {
    filteredOrders = filteredOrders.filter(order => order.order_status === status);
  }

  const keyword = document.getElementById('order-search')?.value.trim() || '';
  if (keyword) {
    filteredOrders = filteredOrders.filter(order => {
      const code = (order.order_id || order._id || '').toLowerCase();
      const customerName = (order.user_id?.username || '').toLowerCase();
      return code.includes(keyword.toLowerCase()) || customerName.includes(keyword.toLowerCase());
    });
  }

  const statusFilter = document.getElementById('statusFilter')?.value.toLowerCase() || '';
  if (statusFilter && statusFilter !== '') {
    const statusMap = {
      pending: 'Pending',
      awaitingpickup: 'AwaitingPickup',
      outfordelivery: 'OutForDelivery',
      delivered: 'Delivered',
      returned: 'Returned',
      cancelled: 'Cancelled',
      refunded: 'Refunded'
    };
    const statusKey = statusMap[statusFilter];
    if (statusKey) {
      filteredOrders = filteredOrders.filter(order => order.order_status === statusKey);
    }
  }

  const startDate = document.getElementById('startDate')?.value
    ? new Date(document.getElementById('startDate').value)
    : null;
  const endDate = document.getElementById('endDate')?.value
    ? new Date(document.getElementById('endDate').value)
    : null;

  if (startDate && endDate && !isNaN(startDate) && !isNaN(endDate)) {
    filteredOrders = filteredOrders.filter(order => {
      const orderDate = new Date(order.order_date || order.createdAt);
      return !isNaN(orderDate) && orderDate >= startDate && orderDate <= endDate;
    });
  } else if (startDate && !isNaN(startDate)) {
    filteredOrders = filteredOrders.filter(order => {
      const orderDate = new Date(order.order_date || order.createdAt);
      return !isNaN(orderDate) && orderDate >= startDate;
    });
  } else if (endDate && !isNaN(endDate)) {
    filteredOrders = filteredOrders.filter(order => {
      const orderDate = new Date(order.order_date || order.createdAt);
      return !isNaN(orderDate) && orderDate <= endDate;
    });
  }

  // Sắp xếp theo chọn lọc mới nhất/cũ nhất
  const sortOrderEl = document.getElementById('sortOrder');
  const sortOrder = sortOrderEl ? sortOrderEl.value : 'desc';
  filteredOrders.sort((a, b) => {
    const dateA = new Date(a.order_date || a.createdAt || 0);
    const dateB = new Date(b.order_date || b.createdAt || 0);
    if (sortOrder === 'desc') return dateB - dateA; // Mới nhất lên đầu
    else return dateA - dateB; // Cũ nhất lên đầu
  });

  renderOrders(filteredOrders);
}

function searchOrders(keyword) {
  const activeTab = document.querySelector('.tab-button.active');
  const status = activeTab ? activeTab.dataset.status : 'all';
  filterOrdersByStatus(status);
}

function exportToExcel() {
  console.log('Exporting to Excel...');
  const orders = window._loadedOrders || [];
  if (!orders.length) {
    showNotification('error', 'Không có dữ liệu để xuất.');
    return;
  }

  const activeTab = document.querySelector('.tab-button.active');
  const status = activeTab ? activeTab.dataset.status : 'all';
  let filteredOrders = status === 'all' ? orders : orders.filter(order => order.order_status === status);

  const statusFilter = document.getElementById('statusFilter')?.value.toLowerCase() || '';
  const startDate = document.getElementById('startDate')?.value
    ? new Date(document.getElementById('startDate').value)
    : null;
  const endDate = document.getElementById('endDate')?.value
    ? new Date(document.getElementById('endDate').value)
    : null;

  if (statusFilter && statusFilter !== '') {
    const statusMap = {
      pending: 'Pending',
      awaitingpickup: 'AwaitingPickup',
      outfordelivery: 'OutForDelivery',
      delivered: 'Delivered',
      returned: 'Returned',
      cancelled: 'Cancelled',
      refunded: 'Refunded'
    };
    const statusKey = statusMap[statusFilter];
    if (statusKey) {
      filteredOrders = filteredOrders.filter(order => order.order_status === statusKey);
    }
  }

  if (startDate && endDate && !isNaN(startDate) && !isNaN(endDate)) {
    filteredOrders = filteredOrders.filter(order => {
      const orderDate = new Date(order.order_date || order.createdAt);
      return !isNaN(orderDate) && orderDate >= startDate && orderDate <= endDate;
    });
  } else if (startDate && !isNaN(startDate)) {
    filteredOrders = filteredOrders.filter(order => {
      const orderDate = new Date(order.order_date || order.createdAt);
      return !isNaN(orderDate) && orderDate >= startDate;
    });
  } else if (endDate && !isNaN(endDate)) {
    filteredOrders = filteredOrders.filter(order => {
      const orderDate = new Date(order.order_date || order.createdAt);
      return !isNaN(orderDate) && orderDate <= endDate;
    });
  }

  if (!filteredOrders.length) {
    showNotification('error', 'Không có đơn hàng nào khớp với bộ lọc.');
    return;
  }

  const data = filteredOrders.map(order => {
    const code = order.order_id || order._id || 'Không rõ';
    const customerName = order.user_id?.username || 'Không rõ';
    const createdAt = order.order_date || order.createdAt || '';
    const formattedDate = createdAt
      ? new Date(createdAt).toLocaleString('vi-VN')
      : 'Chưa rõ';
    const status = STATUS_MAP[order.order_status] || 'Chưa rõ';
    const total = order.total_amount?.toLocaleString('vi-VN') || '0';

    const items = order.order_items?.map(item => {
      const book = item.book_id || {};
      const title = book.title || 'Không rõ';
      return `${title} (x${item.quantity})`;
    }).join('; ') || 'Không có sản phẩm';

    return {
      'Mã Đơn': code,
      'Người Mua': customerName,
      'Ngày Đặt': formattedDate,
      'Trạng Thái': status,
      'Tổng Tiền': `${total}₫`,
      'Sản Phẩm': items
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Orders');

  const fileName = `orders_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
  console.log('Saving file:', fileName);
  XLSX.writeFile(wb, fileName);

  showNotification('success', 'Xuất dữ liệu thành công!');
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

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

function setActiveTab(status) {
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.status === status);
  });
}

window.onload = () => {
  const savedAvatar = localStorage.getItem('userAvatar');
  if (savedAvatar) {
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    const headerAvatar = document.getElementById('headerAvatar');
    if (sidebarAvatar) sidebarAvatar.src = savedAvatar.replace('https://server-shelf-stacker.onrender.com', 'https://server-shelf-stacker-w1ds.onrender.com');
    if (headerAvatar) headerAvatar.src = savedAvatar.replace('https://server-shelf-stacker.onrender.com', 'https://server-shelf-stacker-w1ds.onrender.com');
  }

  const uploadDialog = document.getElementById('uploadDialog');
  if (uploadDialog) {
    uploadDialog.removeAttribute('open');
  }

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
      if (uploadDialog) {
        uploadDialog.close();
        resetUploadDialog();
      }
    };
  }

  if (uploadDialog) {
    uploadDialog.addEventListener('close', resetUploadDialog);
  }

  function resetUploadDialog() {
    const avatarUpload = document.getElementById('avatarUpload');
    const uploadMessage = document.getElementById('uploadMessage');
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
    uploadButton.onclick = async () => {
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

        const response = await fetch(`${BASE_URL}/api/user-upload/avatar`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
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
        const imageUrl = data.avatar.replace('https://server-shelf-stacker.onrender.com', 'https://server-shelf-stacker-w1ds.onrender.com') || URL.createObjectURL(file);

        const sidebarAvatar = document.getElementById('sidebarAvatar');
        const headerAvatar = document.getElementById('headerAvatar');
        if (sidebarAvatar) sidebarAvatar.src = imageUrl;
        if (headerAvatar) headerAvatar.src = imageUrl;
        localStorage.setItem('userAvatar', imageUrl);

        const uploadMessage = document.getElementById('uploadMessage');
        if (uploadMessage) {
          uploadMessage.style.display = 'block';
          uploadMessage.textContent = 'Đã cập nhật ảnh đại diện thành công!';
          uploadMessage.className = 'notification success-message';
        }

        setTimeout(() => {
          if (uploadDialog) {
            uploadDialog.close();
            resetUploadDialog();
          }
        }, 2000);
      } catch (error) {
        const uploadMessage = document.getElementById('uploadMessage');
        if (uploadMessage) {
          uploadMessage.style.display = 'block';
          uploadMessage.textContent = 'Lỗi: ' + error.message;
          uploadMessage.className = 'notification error-message';
        }
        if (uploadButton) {
          uploadButton.disabled = false;
          uploadButton.textContent = 'Tải lên';
        }
      }
    };
  }

  const btnExport = document.querySelector('.btn-export');
  if (btnExport) {
    btnExport.addEventListener('click', exportToExcel);
  }

  const tabButtons = document.querySelectorAll('.tab-button');
  if (tabButtons) {
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const status = button.dataset.status;
        setActiveTab(status);
        filterOrdersByStatus(status);
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) statusFilter.value = '';
      });
    });
  }

  const orderSearch = document.getElementById('order-search');
  if (orderSearch) {
    orderSearch.addEventListener('input', debounce(e => {
      const keyword = e.target.value.trim();
      searchOrders(keyword);
    }, 300));
  }

  const btnOrderSearch = document.getElementById('btn-order-search');
  if (btnOrderSearch) {
    btnOrderSearch.addEventListener('click', () => {
      const keyword = document.getElementById('order-search')?.value.trim() || '';
      searchOrders(keyword);
    });
  }

  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', debounce(() => {
      const activeTab = document.querySelector('.tab-button.active');
      const status = activeTab ? activeTab.dataset.status : 'all';
      filterOrdersByStatus(status);
    }, 300));
  }

  const startDate = document.getElementById('startDate');
  if (startDate) {
    startDate.addEventListener('change', debounce(() => {
      const activeTab = document.querySelector('.tab-button.active');
      const status = activeTab ? activeTab.dataset.status : 'all';
      filterOrdersByStatus(status);
    }, 300));
  }

  const endDate = document.getElementById('endDate');
  if (endDate) {
    endDate.addEventListener('change', debounce(() => {
      const activeTab = document.querySelector('.tab-button.active');
      const status = activeTab ? activeTab.dataset.status : 'all';
      filterOrdersByStatus(status);
    }, 300));
  }

  const notificationLink = document.getElementById('notificationLink');
  if (notificationLink) {
    notificationLink.addEventListener('click', (e) => {
      e.preventDefault();
      toggleNotificationDropdown();
    });
  }

  const settingsLink = document.getElementById('settingsLink');
  if (settingsLink) {
    settingsLink.onclick = () => {
      const mainSidebar = document.getElementById('mainSidebar');
      const settingsSidebar = document.getElementById('settingsSidebar');
      if (mainSidebar && settingsSidebar) {
        mainSidebar.classList.add('hidden');
        settingsSidebar.classList.remove('hidden');
      }
    };
  }

  const backButton = document.getElementById('backButton');
  if (backButton) {
    backButton.onclick = () => {
      const settingsSidebar = document.getElementById('settingsSidebar');
      const mainSidebar = document.getElementById('mainSidebar');
      if (settingsSidebar && mainSidebar) {
        settingsSidebar.classList.add('hidden');
        mainSidebar.classList.remove('hidden');
      }
    };
  }

  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.onclick = () => {
      localStorage.removeItem('userAvatar');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      showNotification('success', 'Đăng xuất thành công!');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    };
  }

  loadOrders();
};

function toggleMenu(id) {
  const el = document.getElementById(id);
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

let lastNotifiedOrderId = null;

document.getElementById('sortOrder').addEventListener('change', function() {
  const activeTab = document.querySelector('.tab-button.active');
  const status = activeTab ? activeTab.dataset.status : 'all';
  filterOrdersByStatus(status);
});

async function showShipperDetails(orderId) {
  const token = localStorage.getItem('authToken');
  if (!token) {
    showNotification('error', 'Bạn chưa đăng nhập.');
    return;
  }
  try {
    const response = await fetch(`${BASE_URL}/api/orders/${orderId}/shipper-details`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (!response.ok) throw new Error('Không lấy được dữ liệu shipper');
    const data = await response.json();
    const shipper = data.shipper_info;
    if (!shipper) {
      showNotification('error', 'Đơn hàng chưa được gán shipper.');
      return;
    }

    // Thống kê trạng thái đơn hàng
    let statsHtml = '<ul>';
    Object.entries(shipper.statistics.order_counts || {}).forEach(([status, count]) => {
      statsHtml += `<li>${STATUS_MAP[status] || status}: ${count}</li>`;
    });
    statsHtml += '</ul>';

    // Hiển thị thông tin shipper
    let html = `
      <div style="display:flex;gap:12px;align-items:center;">
        <img src="${shipper.avatar || '/assets/images/image.png'}" style="width:60px;height:60px;border-radius:50%;border:2px solid #0ea5e9;">
        <div>
          <b>${shipper.full_name || shipper.username}</b><br>
          SĐT: ${shipper.phone_number || ''}<br>
          Email: ${shipper.email || ''}<br>
          Ngày tạo: ${shipper.created_at ? new Date(shipper.created_at).toLocaleDateString('vi-VN') : ''}
        </div>
      </div>
      <hr>
      <h4>Thống kê:</h4>
      ${statsHtml}
      <p><strong>Đánh giá trung bình:</strong> ${shipper.statistics.average_rating ? shipper.statistics.average_rating.toFixed(2) : 'Chưa có'} (${shipper.statistics.total_ratings} lượt đánh giá)</p>
      <hr>
      <h4>Đơn hàng hiện tại:</h4>
      <ul>
        <li><b>Mã đơn:</b> ${data.order.order_id}</li>
        <li><b>Trạng thái:</b> ${STATUS_MAP[data.order.order_status] || data.order.order_status}</li>
        <li><b>Khách hàng:</b> ${data.order.customer.name || ''} (${data.order.customer.phone || ''})</li>
        <li><b>Địa chỉ giao hàng:</b> ${data.order.delivery_address || ''}</li>
        <li><b>Ghi chú shipper:</b> ${shipper.current_order.note || ''}</li>
        <li><b>Đánh giá shipper:</b> ${shipper.current_order.rating || 'Chưa có'} (${shipper.current_order.comment || ''})</li>
      </ul>
    `;

    // Hiển thị modal
    let modal = document.getElementById('shipperDetailsModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'shipperDetailsModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content" style="width:400px;">
          <span style="float:right;cursor:pointer;font-size:20px;" onclick="document.getElementById('shipperDetailsModal').style.display='none'">&times;</span>
          <div id="shipperDetailsContent"></div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    document.getElementById('shipperDetailsContent').innerHTML = html;
    modal.style.display = 'flex';
  } catch (err) {
    showNotification('error', err.message);
  }
}

function renderOrderPagination(page, totalPages) {
  const pagination = document.getElementById('order-pagination');
  if (!pagination) return;
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }
  let buttons = `
    <button id="prevOrderPage" ${page === 1 ? 'disabled' : ''} class="page-circle-btn">
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
    <button id="nextOrderPage" ${page === totalPages ? 'disabled' : ''} class="page-circle-btn">
      <i class="fas fa-chevron-right"></i>
    </button>
  `;
  pagination.innerHTML = buttons;

  document.getElementById('prevOrderPage').onclick = () => {
    if (page > 1) {
      currentOrderPage--;
      const activeTab = document.querySelector('.tab-button.active');
      const status = activeTab ? activeTab.dataset.status : 'all';
      filterOrdersByStatus(status);
    }
  };
  document.getElementById('nextOrderPage').onclick = () => {
    if (page < totalPages) {
      currentOrderPage++;
      const activeTab = document.querySelector('.tab-button.active');
      const status = activeTab ? activeTab.dataset.status : 'all';
      filterOrdersByStatus(status);
    }
  };
  document.querySelectorAll('.page-btn').forEach(btn => {
    btn.onclick = function() {
      const gotoPage = Number(this.dataset.page);
      if (gotoPage !== page) {
        currentOrderPage = gotoPage;
        const activeTab = document.querySelector('.tab-button.active');
        const status = activeTab ? activeTab.dataset.status : 'all';
        filterOrdersByStatus(status);
      }
    };
  });
}

let currentOrderPage = 1;
const ORDERS_PER_PAGE = 15;