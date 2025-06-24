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

    if (orderId) {
      // Khi tìm theo ID, API trả về 1 đơn => đưa vào mảng để render
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

function renderOrders(orders) {
  const tbody = document.getElementById('orders-body');
  if (!orders || orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Không có đơn hàng</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(order => `
    <tr>
      <td><img src="${order.image || '../img/sample1.jpg'}" alt="Sản phẩm" class="thumb" /></td>
      <td>${order.code || ''}</td>
      <td>${order.customerName || ''}</td>
      <td>${order.orderDate || ''}</td>
      <td>${order.status || ''}</td>
      <td>${order.total || 0}₫</td>
      <td class="actions">
        <button class="btn-detail">Chi tiết</button>
        <button class="btn-update">Cập nhật</button>
        <button class="btn-confirm">Xác nhận</button>
        <button class="btn-return">Trả hàng</button>
      </td>
    </tr>
  `).join('');
}

// Load toàn bộ khi mở trang
loadOrders();

// Tìm kiếm theo ID (ví dụ gắn với nút tìm kiếm)
document.getElementById('btn-search-order').addEventListener('click', function() {
  const orderId = document.getElementById('input-order-id').value.trim();
  if (orderId) {
    loadOrders(orderId);
  } else {
    loadOrders(); // Nếu không nhập ID, load tất cả
  }
});
