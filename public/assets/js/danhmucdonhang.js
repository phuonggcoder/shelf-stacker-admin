const STATUS_MAP = {
  "Pending": "Chờ xác nhận",
  "Shipped": "Đã giao"
};


const REV_MAP = Object.fromEntries(Object.entries(STATUS_MAP).map(([k, v]) => [v, k]));


async function loadOrders(orderId = '') {
  const token = localStorage.getItem('authToken');
  if (!token) return (window.location.href = 'login.html');

  let url = 'https://server-shelf-stacker.onrender.com/api/orders';
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
    renderOrders(window._loadedOrders);
  } catch (error) {
    console.error(error);
    alert('Bạn không có quyền truy cập hoặc phiên đăng nhập đã hết hạn');
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
  }
}

function renderOrders(orders) {
  const tbody = document.getElementById('orders-body');
  if (!orders || orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Không có đơn hàng</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(order => {
    const book = order.order_items?.[0]?.book_id || {};
    const image = book.thumbnail?.trim() !== ''
      ? book.thumbnail
      : (book.cover_image?.[0] || 'https://via.placeholder.com/60x80?text=No+Image');

    const code = order.order_id || order._id || 'Không rõ';
    const customerName = order.user_id?.username || 'Không rõ';
    const createdAt = order.order_date || order.createdAt || '';
    const total = order.total_amount?.toLocaleString() || '0';
    const status = STATUS_MAP[order.order_status] || 'Chưa rõ';

    const formattedDate = createdAt
      ? new Date(createdAt).toLocaleTimeString() + ' ' + new Date(createdAt).toLocaleDateString()
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
          <button class="btn-confirm">Xác nhận</button>
          <button class="btn-return">Trả hàng</button>
        </td>
      </tr>
    `;
  }).join('');

  addOrderEventListeners();
}

function addOrderEventListeners() {
  document.querySelectorAll('.btn-detail').forEach((btn, index) => {
    btn.addEventListener('click', () => {
      const order = window._loadedOrders?.[index];
      if (order) showOrderDetails(order);
    });
  });

  document.querySelectorAll('.btn-update').forEach((btn, index) => {
    btn.addEventListener('click', () => {
      const order = window._loadedOrders?.[index];
      if (!order) return;

      const modal = document.getElementById('updateStatusModal');
      modal.dataset.orderId = order._id;
      document.getElementById('modalOrderCode').innerText = order.order_id;

      const viStatus = STATUS_MAP[order.order_status] || 'Chờ xác nhận';
      document.getElementById('statusSelect').value = viStatus;
      modal.style.display = 'flex';
    });
  });
}

function closeUpdateModal() {
  document.getElementById('updateStatusModal').style.display = 'none';
}

setTimeout(() => {
  document.getElementById('btnSaveStatus').addEventListener('click', async () => {
    const modal = document.getElementById('updateStatusModal');
    const orderId = modal.dataset.orderId;
    const viStatus = document.getElementById('statusSelect').value;
    const newStatus = REV_MAP[viStatus];
    const token = localStorage.getItem('authToken');

    if (!token) {
      alert('Chưa đăng nhập.');
      return (window.location.href = 'login.html');
    }

    try {
      const response = await fetch(`https://server-shelf-stacker.onrender.com/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({ order_status: newStatus })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Lỗi cập nhật');
      alert('✅ Cập nhật trạng thái thành công');
      closeUpdateModal();
      loadOrders(); // Tải lại đơn hàng để cập nhật trạng thái
    } catch (err) {
      console.error('[Cập nhật lỗi]:', err);
      alert('❌ ' + err.message);
    }
  });
}, 100);

function showOrderDetails(order) {
  const contentEl = document.getElementById('orderDetailsContent');
  const items = order.order_items || [];

  const rows = items.map(item => {
    const book = item.book_id || {};
    const title = book.title || 'Không rõ';
    const quantity = item.quantity || 0;
    const price = item.price || 0;
    const image = book.thumbnail || book.cover_image?.[0] || 'https://via.placeholder.com/60x80?text=No+Image';

    return `
      <div style="display:flex; gap:10px; margin-bottom:10px;">
        <img src="${image}" alt="${title}" style="width:60px; height:80px; object-fit:cover; border-radius:4px;">
        <div>
          <strong>${title}</strong><br>
          Số lượng: ${quantity}<br>
          Giá: ${price.toLocaleString()}₫
        </div>
      </div>
    `;
  }).join('');

  const customer = order.user_id || {};
  const total = order.total_amount?.toLocaleString() || '0';
  const createdAt = new Date(order.createdAt).toLocaleString();

  contentEl.innerHTML = `
    <p><strong>Mã đơn hàng:</strong> ${order.order_id}</p>
    <p><strong>Khách hàng:</strong> ${customer.username || 'Không rõ'}</p>
    <p><strong>Ngày tạo:</strong> ${createdAt}</p>
    <p><strong>Trạng thái:</strong> ${STATUS_MAP[order.order_status] || order.order_status}</p>
    <p><strong>Tổng tiền:</strong> ${total}₫</p>
    <hr />
    <h4>Sản phẩm:</h4>
    ${rows || '<p>Không có sản phẩm</p>'}
  `;

  document.getElementById('orderDetailsModal').style.display = 'flex';
}

function closeOrderDetailsModal() {
  document.getElementById('orderDetailsModal').style.display = 'none';
}

document.getElementById('btn-order-search').addEventListener('click', () => {
  const keyword = document.getElementById('order-search').value.trim();
  loadOrders(keyword);
});

loadOrders();
