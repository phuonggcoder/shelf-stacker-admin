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

    if (!response.ok) {
      throw new Error('Token hết hạn hoặc không hợp lệ');
    }

    const data = await response.json();
    console.log('[DEBUG] Kết quả API:', data);

    if (orderId) {
      renderOrders(data ? [data] : []);
    } else {
      renderOrders(data.orders || []);
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
    const image = order.image || '../img/sample1.jpg';
    const code = order.code || order._id || 'Không rõ';
    const customerName = order.customerName || order.customer?.name || 'Chưa rõ';
    const createdAt = order.orderDate || order.createdAt || '';
    const status = order.status || 'Chưa rõ';
    const total = (order.total || order.totalAmount || 0).toLocaleString();

    const formattedDate = createdAt ? new Date(createdAt).toLocaleTimeString() + ' ' + new Date(createdAt).toLocaleDateString() : 'Chưa rõ';

    return `
      <tr>
        <td><img src="${image}" alt="Sản phẩm" class="thumb" /></td>
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
  document.querySelectorAll('.btn-detail').forEach(btn => {
    btn.addEventListener('click', function () {
      const orderCode = this.closest('tr').children[1].innerText;
      alert('📄 Chi tiết đơn hàng: ' + orderCode);
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
