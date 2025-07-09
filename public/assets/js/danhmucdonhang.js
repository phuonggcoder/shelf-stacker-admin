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

  document.querySelectorAll('.btn-update').forEach(btn => {
    btn.addEventListener('click', function () {
      const orderCode = this.closest('tr').children[1].innerText;
      alert('🛠️ Cập nhật đơn hàng: ' + orderCode);
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

// ✅ Hiển thị chi tiết đơn hàng trong popup
function showOrderDetails(order) {
  const book = order.order_items?.[0]?.book_id || {};
  const payment = order.payment_id || {};
  const address = order.address_id || {};

  const image = book.thumbnail || book.cover_image?.[0] || 'https://via.placeholder.com/60x80?text=No+Image';

  const html = `
    <div style="font-size: 14px; line-height: 1.6;">
      <div><span style="font-weight: bold;">📦 Mã đơn hàng:</span> ${order.order_id}</div>
      <div><span style="font-weight: bold;">👤 Khách hàng:</span> ${order.user_id?.username} (${order.user_id?.email})</div>
      <div><span style="font-weight: bold;">📚 Sản phẩm:</span> ${book.title} - ${book.author}</div>
      <div><img src="${image}" alt="Ảnh bìa" style="margin: 8px 0; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.2);" width="80"></div>
      <div><span style="font-weight: bold;">💰 Giá:</span> ${book.price?.toLocaleString()}₫ × ${order.order_items[0]?.quantity}</div>
      <div><span style="font-weight: bold;">🧮 Tổng tiền:</span> ${order.total_amount?.toLocaleString()}₫</div>
      <div><span style="font-weight: bold;">📍 Địa chỉ:</span> ${address.receiver_name} - ${address.phone_number}</div>
      <div style="padding-left: 1em;">${address.address_detail}, ${address.ward}, ${address.district}, ${address.province}</div>
      <div><span style="font-weight: bold;">💳 Thanh toán:</span> ${payment.payment_method} - ${payment.payment_status}</div>
      <div><span style="font-weight: bold;">🕒 Ngày đặt:</span> ${new Date(order.order_date).toLocaleString()}</div>
      <div><span style="font-weight: bold;">🔄 Trạng thái:</span> ${order.order_status}</div>
    </div>
  `;

  const modal = document.createElement('div');
  modal.innerHTML = `
    <div style="
      background: white;
      padding: 25px;
      border-radius: 12px;
      max-width: 500px;
      width: 90%;
      margin: 60px auto;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      font-family: 'Segoe UI', sans-serif;
    ">
      <h2 style="text-align: center; margin-bottom: 15px; color: #333;">📝 Chi tiết đơn hàng</h2>
      ${html}
      <div style="text-align: center; margin-top: 20px;">
        <button onclick="this.closest('.modal-overlay').remove()" style="
          background: #007bff;
          color: white;
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        ">Đóng</button>
      </div>
    </div>
  `;

  Object.assign(modal.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  });
  modal.classList.add('modal-overlay');
  document.body.appendChild(modal);
}

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
