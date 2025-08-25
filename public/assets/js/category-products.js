const apiURL = 'https://server-shelf-stacker-w1ds.onrender.com/api/categories';
const bookAPI = 'https://server-shelf-stacker-w1ds.onrender.com/api/books';
const orderAPI = 'https://server-shelf-stacker-w1ds.onrender.com/api/orders';
const rawToken = localStorage.getItem('authToken');
if (!rawToken) {
  alert('Bạn chưa đăng nhập!');
  window.location.href = 'login.html';
}
const token = `Bearer ${rawToken}`;
let lastNotifiedOrderId = null;

async function fetchCategoriesWithBooks() {
  try {
    const res = await fetch(apiURL, { headers: { 'Authorization': token } });
    if (!res.ok) throw new Error('Không thể tải danh mục');
    const categoriesData = await res.json();
    const categories = Array.isArray(categoriesData.categories) ? categoriesData.categories : categoriesData;
    const container = document.getElementById('category-list');
    container.innerHTML = '<div>Đang tải...</div>';

    let html = '';
    for (const cat of categories) {
      const booksRes = await fetch(`${bookAPI}/category/${cat._id}`, { headers: { 'Authorization': token } });
      let books = [];
      if (booksRes.ok) {
        books = await booksRes.json();
        if (books.books) books = books.books;
      }
      html += `
        <div class="category-card">
          <div class="category-header">
            <img src="${cat.image || '/assets/images/default-category.png'}" alt="Ảnh danh mục" />
            <div>
              <div class="category-title">${cat.name}</div>
              <div class="category-count">${books.length} sách</div>
            </div>
            <button class="btn-show-products" style="margin-left:auto;padding:6px 16px;border-radius:8px;background:#007bff;color:#fff;border:none;cursor:pointer;font-size:14px;">Xem chi tiết</button>
          </div>
          <div class="books-list" style="display:none;">
            ${books.map(book => `
              <div class="book-card">
                <img src="${book.thumbnail || '/assets/images/default-thumbnail.png'}" alt="Ảnh sách" />
                <div class="book-info">
                  <div class="book-title">${book.title}</div>
                  <div class="book-author">Tác giả: ${book.author || 'N/A'}</div>
                  <div class="book-desc">${book.description ? book.description.replace(/<[^>]+>/g, '').slice(0, 80) + '...' : ''}</div>
                  <div class="book-meta">Giá: ${book.price ? book.price.toLocaleString('vi-VN') + '₫' : 'N/A'} | Kho: ${book.stock || 0}</div>
                  <div class="book-pub">NXB: ${book.publisher || 'N/A'} | Ngôn ngữ: ${book.language || 'N/A'}</div>
                  <div class="book-date">Ngày xuất bản: ${book.publication_date ? new Date(book.publication_date).toLocaleDateString('vi-VN') : 'N/A'}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    container.innerHTML = html;

    document.querySelectorAll('.btn-show-products').forEach(btn => {
      btn.onclick = function() {
        const booksList = this.closest('.category-card').querySelector('.books-list');
        if (booksList) {
          const isHidden = booksList.style.display === 'none';
          booksList.style.display = isHidden ? 'grid' : 'none';
          this.textContent = isHidden ? 'Ẩn chi tiết' : 'Xem chi tiết';
        }
      };
    });
  } catch (error) {
    showNotification('error', 'Lỗi khi tải danh mục: ' + error.message);
    document.getElementById('category-list').innerHTML = '<div style="text-align:center;color:#dc3545;">Lỗi tải dữ liệu.</div>';
  }
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
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 500);
  }, 2500);
}

function toggleNotificationDropdown() {
  const dropdown = document.getElementById('notificationDropdown');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
}

const notificationBell = document.querySelector('.notification-bell');
if (notificationBell) {
  notificationBell.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleNotificationDropdown();
  });
}

document.addEventListener('click', function(event) {
  const dropdown = document.getElementById('notificationDropdown');
  if (dropdown && dropdown.classList.contains('active')) {
    if (!event.target.closest('.notification-bell')) {
      dropdown.classList.remove('active');
    }
  }
});

function goToOrderDetails(orderId) {
  window.location.href = 'danhmucdonhang';
}

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

async function fetchOrdersForNotifications() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    showNotification('error', 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
    return;
  }

  try {
    const response = await fetch(orderAPI, {
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

document.addEventListener('DOMContentLoaded', function() {
  fetchCategoriesWithBooks();
  fetchOrdersForNotifications();
});