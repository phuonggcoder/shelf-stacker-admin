// ✅ Tải danh sách đơn hàng từ API
async function loadOrders(orderId = '') {
  const token = localStorage.getItem('authToken');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  let url = 'https://server-shelf-stacker.onrender.com/api/orders';
  if (orderId) {
    url += `/${orderId}`;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    });

    if (!response.ok) throw new Error('Token hết hạn hoặc không hợp lệ');

    const data = await response.json();
    console.log('[DEBUG] Kết quả API:', data);

    if (orderId) {
      window._loadedOrders = data ? [data] : [];
      renderOrders(window._loadedOrders);
    } else {
      window._loadedOrders = data.orders || [];
      renderOrders(window._loadedOrders);
    }

  } catch (error) {
    console.error(error);
    alert('Bạn không có quyền truy cập hoặc phiên đăng nhập đã hết hạn');
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
  }
}

// ✅ Hiển thị danh sách đơn hàng
function renderOrders(orders) {
  const tbody = document.getElementById('orders-body');
  if (!orders || orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Không có đơn hàng</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(order => {
    const book = order.order_items?.[0]?.book_id || {};
    const image =
      book.thumbnail?.trim() !== ''
        ? book.thumbnail
        : (book.cover_image?.[0] || 'https://via.placeholder.com/60x80?text=No+Image');

    const code = order.order_id || order._id || 'Không rõ';
    const customerName = order.user_id?.username || 'Không rõ';
    const createdAt = order.order_date || order.createdAt || '';
    const status = order.order_status || 'Chưa rõ';
    const total = order.total_amount?.toLocaleString() || '0';

    const formattedDate = createdAt
      ? new Date(createdAt).toLocaleTimeString() + ' ' + new Date(createdAt).toLocaleDateString()
      : 'Chưa rõ';

    return `
      <tr>
        <td><img src="${image}" alt="Ảnh bìa" class="thumb" /></td>
        <td>${code}</td>
        <td>${customerName}</td>
        <td>${formattedDate}</td>
        <td>${status}</td>
        <td>${total}₫</td>
        <td class="actions">
          <button class="btn-detail">Chi tiết</button>
          <button class="btn-update">Cập nhật</button>
          <button class="btn-confirm">Xác nhận</button>
          <button class="btn-return">Trả hàng</button>
        </td>
      </tr>
    `;
  }).join('');

  addOrderEventListeners();
}

// ✅ Gán sự kiện cho các nút chức năng
function addOrderEventListeners() {
  document.querySelectorAll('.btn-detail').forEach((btn, index) => {
    btn.addEventListener('click', function () {
      const order = window._loadedOrders?.[index];
      if (order) {
        showOrderDetails(order);
      } else {
        alert('Không tìm thấy dữ liệu đơn hàng');
      }
    });
  });

  document.querySelectorAll('.btn-update').forEach((btn, index) => {
    btn.addEventListener('click', function () {
      const order = window._loadedOrders?.[index];
      if (!order) return alert('Không tìm thấy đơn hàng');

      const modal = document.getElementById('updateStatusModal');
      modal.dataset.orderId = order.order_id;
      document.getElementById('modalOrderCode').innerText = order.order_id;
      document.getElementById('statusSelect').value = order.order_status || 'Chờ xác nhận';
      modal.style.display = 'flex';
    });
  });

  document.querySelectorAll('.btn-confirm').forEach(btn => {
    btn.addEventListener('click', function () {
      const orderCode = this.closest('tr').children[1].innerText;
      alert('✅ Xác nhận đơn hàng: ' + orderCode);
    });
  });

  document.querySelectorAll('.btn-return').forEach(btn => {
    btn.addEventListener('click', function () {
      const orderCode = this.closest('tr').children[1].innerText;
      alert('↩️ Trả hàng đơn: ' + orderCode);
    });
  });
}

// ✅ Modal cập nhật trạng thái đơn hàng
const modalUpdateHTML = `
  <div id="updateStatusModal" class="modal-overlay" style="display:none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.4); justify-content: center; align-items: center; z-index: 9999;">
    <div class="modal-content" style="background: white; padding: 20px; border-radius: 10px; width: 300px;">
      <h3 style="text-align: center;">🔄 Cập nhật trạng thái</h3>
      <p><strong>Mã đơn hàng:</strong> <span id="modalOrderCode"></span></p>
      <label for="statusSelect">Trạng thái mới:</label>
      <select id="statusSelect" style="width: 100%; margin: 8px 0;">
        <option value="Chờ xác nhận">Chờ xác nhận</option>
        <option value="Đang giao">Đang giao</option>
        <option value="Đã giao">Đã giao</option>
        <option value="Đã huỷ">Đã huỷ</option>
        <option value="Trả hàng">Trả hàng</option>
      </select>
      <div style="text-align: right;">
        <button id="btnSaveStatus" style="background: #28a745; color: white; padding: 6px 12px; border: none; border-radius: 6px;">Lưu</button>
        <button onclick="closeUpdateModal()" style="margin-left: 10px; background: #ccc; padding: 6px 12px; border: none; border-radius: 6px;">Huỷ</button>
      </div>
    </div>
  </div>
`;
document.body.insertAdjacentHTML('beforeend', modalUpdateHTML);

function closeUpdateModal() {
  document.getElementById('updateStatusModal').style.display = 'none';
}

setTimeout(() => {
  document.getElementById('btnSaveStatus').addEventListener('click', async function () {
    const modal = document.getElementById('updateStatusModal');
    const orderId = modal.dataset.orderId;
    const newStatus = document.getElementById('statusSelect').value;

    const token = localStorage.getItem('authToken');
    if (!token) return alert('Chưa đăng nhập');

    try {
      const response = await fetch(`https://server-shelf-stacker.onrender.com/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();
      if (!response.ok) {
        console.warn('[Lỗi cập nhật]:', result);
        throw new Error(result.message || 'Cập nhật thất bại');
      }

      alert('✅ Đã cập nhật trạng thái đơn hàng');
      modal.style.display = 'none';
      loadOrders();
    } catch (err) {
      console.error(err);
      alert('❌ Lỗi khi cập nhật đơn hàng');
    }
  });
}, 100);

// ✅ Xử lý sự kiện tìm kiếm đơn hàng
document.getElementById('btn-order-search').addEventListener('click', function () {
  const orderId = document.getElementById('order-search').value.trim();
  if (orderId) {
    loadOrders(orderId);
  } else {
    loadOrders();
  }
});

// ✅ Gọi hàm khi mở trang
loadOrders();
