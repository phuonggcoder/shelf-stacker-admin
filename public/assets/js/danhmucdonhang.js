const BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

const STATUS_MAP = {
  Pending: 'Chờ xác nhận',
  Processing: 'Đang xử lý',
  Shipped: 'Đang giao',
  Delivered: 'Đã giao',
  Cancelled: 'Đã huỷ'
};

function getFullImageURL(path) {
  if (!path) return 'https://via.placeholder.com/60x80?text=No+Image';
  if (path.startsWith('http')) return path.replace('https://server-shelf-stacker.onrender.com', 'https://server-shelf-stacker-w1ds.onrender.com');
  return BASE_URL + path;
}

// Hàm kiểm tra chuyển đổi trạng thái hợp lệ
function isValidStatusTransition(currentStatus, newStatus) {
  const validTransitions = {
    Pending: ['Processing', 'Cancelled'],
    Processing: ['Shipped', 'Cancelled'],
    Shipped: ['Delivered', 'Cancelled'],
    Delivered: ['Cancelled'],
    Cancelled: []
  };
  return validTransitions[currentStatus]?.includes(newStatus) || false;
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
  } catch (error) {
    console.error('[Load orders error]:', error);
    showNotification('error', 'Bạn không có quyền truy cập hoặc phiên đăng nhập đã hết hạn');
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
  }
}

function renderOrders(orders) {
  const tbody = document.getElementById('orders-body');
  if (!tbody) {
    console.error('Không tìm thấy phần tử orders-body');
    return;
  }

  if (!orders || orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Không có đơn hàng</td></tr>';
    return;
  }

  const invalidOrderIds = ['ORD1752049496563O9ZR9', 'ORD1752050362983MPP15'];
  const filteredOrders = orders.filter(order => !invalidOrderIds.includes(order.order_id || order._id));

  if (!filteredOrders || filteredOrders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Không có đơn hàng</td></tr>';
    return;
  }

  tbody.innerHTML = filteredOrders.map(order => {
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

    return `
      <tr data-id="${order._id}">
        <td><img src="${image}" alt="Ảnh bìa" class="thumb" /></td>
        <td>${code}</td>
        <td>${customerName}</td>
        <td>${formattedDate}</td>
        <td>${status}</td>
        <td>${total}₫</td>
        <td class="actions">
          <button class="btn-detail">Chi tiết</button>
          <button class="btn-update">Cập nhật</button>
        </td>
      </tr>
    `;
  }).join('');

  addOrderEventListeners();
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
    // Vô hiệu hóa các trạng thái không hợp lệ
    Array.from(statusSelect.options).forEach(option => {
      option.disabled = !isValidStatusTransition(status, option.value) && option.value !== status;
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

      const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
      if (!newStatus || !validStatuses.includes(newStatus)) {
        showNotification('error', 'Trạng thái không hợp lệ.');
        return;
      }

      // Kiểm tra tính hợp lệ của chuyển đổi trạng thái
      if (!isValidStatusTransition(currentStatus, newStatus)) {
        showNotification('error', `Không thể chuyển từ ${STATUS_MAP[currentStatus]} sang ${STATUS_MAP[newStatus]}.`);
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

        // Hiển thị thông báo thành công
        showNotification('success', '✅ Cập nhật trạng thái thành công');

        // Nếu chuyển sang Cancelled từ Delivered, hiển thị thông báo hoàn tiền
        if (newStatus === 'Cancelled' && currentStatus === 'Delivered') {
          showNotification('success', '📩 Đơn hàng đã bị hủy, hệ thống sẽ xử lý hoàn tiền.');
        }

        closeUpdateModal();
        await loadOrders();
      } catch (err) {
        console.error('[Cập nhật lỗi]:', err);
        showNotification('error', '❌ ' + err.message);
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
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
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
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
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
  text.textContent = message;
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
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        const status = button.dataset.status;
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
      fetch('login')
        .then(res => {
          if (res.ok) {
            localStorage.removeItem('userAvatar');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userId');
            showNotification('success', 'Đăng xuất thành công!');
            setTimeout(() => {
              window.location.href = 'login.html';
            }, 1000);
          } else {
            showNotification('error', 'Không tìm thấy trang đăng nhập.');
          }
        })
        .catch(() => {
          showNotification('error', 'Lỗi khi đăng xuất. Vui lòng thử lại.');
        });
    };
  }

  loadOrders();
};