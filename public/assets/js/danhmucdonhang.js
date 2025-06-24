 async function loadOrders() {
      const token = localStorage.getItem('authToken');
      if (!token) {
        window.location.href = 'login.html';
        return;
      }

      try {
        const response = await fetch('https://server-shelf-stacker.onrender.com/api/orders', {
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
        renderOrders(data.orders || []); // Giả sử API trả về { orders: [...] }
      } catch (error) {
        console.error(error);
        alert('Bạn không có quyền truy cập hoặc phiên đăng nhập đã hết hạn');
        localStorage.removeItem('authToken');
        window.location.href = 'login.html';
      }
    }

    function renderOrders(orders) {
      const tbody = document.getElementById('orders-body');
      if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Không có đơn hàng</td></tr>';
        return;
      }

      tbody.innerHTML = orders.map(order => `
        <tr>
          <td><img src="${order.image || '../img/sample1.jpg'}" alt="Sản phẩm" class="thumb" /></td>
          <td>${order.code}</td>
          <td>${order.customerName}</td>
          <td>${order.orderDate}</td>
          <td>${order.status}</td>
          <td>${order.total}₫</td>
          <td class="actions">
            <button class="btn-detail">Chi tiết</button>
            <button class="btn-update">Cập nhật</button>
            <button class="btn-confirm">Xác nhận</button>
            <button class="btn-return">Trả hàng</button>
          </td>
        </tr>
      `).join('');
    }

    // Load khi trang mở
    loadOrders();