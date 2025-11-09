const BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

let categories = [];
let catCurrentPage = 1;
const catPageSize = 6;
let editingCategoryId = null;
let lastNotifiedOrderId = null;

function getToken() {
  return localStorage.getItem('authToken') || '';
}

// Vietnamese locale-aware comparison
function vietnameseCompare(a, b) {
  const viCollator = new Intl.Collator('vi', { sensitivity: 'base' });
  return viCollator.compare(a, b);
}

// Hàm render danh mục với phân trang
function renderCategoriesWithPagination(categoriesArr, page = 1) {
  const tbody = document.getElementById('category-table-body');
  const totalPages = Math.ceil(categoriesArr.length / catPageSize);
  if (page > totalPages && totalPages > 0) page = totalPages;
  if (page < 1) page = 1;
  catCurrentPage = page;

  const start = (page - 1) * catPageSize;
  const end = start + catPageSize;
  const pageCategories = categoriesArr.slice(start, end);

  tbody.innerHTML = '';
  if (pageCategories.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Không có dữ liệu</td></tr>';
    renderCategoryPagination(page, totalPages);
    return;
  }

  pageCategories.forEach(cat => {
    tbody.innerHTML += `
      <tr>
        <td><img src="${cat.image || '../img/default.jpg'}" alt="thumb" class="thumb" /></td>
        <td>${cat.name || ''}</td>
        <td>${cat.description || ''}</td>
        <td>${cat.isVisible === false ? 'Ẩn' : 'Hiển thị'}</td>
        <td class="actions">
          <button class="action-btn btn-update"
            data-id="${cat._id}"
            data-name="${cat.name || ''}"
            data-slug="${cat.slug || ''}"
            data-image="${cat.image || ''}"
            data-description="${cat.description || ''}"
            data-status="${cat.isVisible === false ? 'false' : 'true'}"
          >Sửa</button>
          <button class="action-btn btn-return" data-id="${cat._id}">Xóa</button>
          <button class="action-btn btn-confirm" data-isvisible="${cat.isVisible}">${cat.isVisible === false ? 'Hiển thị' : 'Ẩn'}</button>
        </td>
      </tr>
    `;
  });

  renderCategoryPagination(page, totalPages);
}

// Hàm render phân trang danh mục (giống với đơn hàng)
function renderCategoryPagination(page, totalPages) {
  const pagination = document.getElementById('category-pagination');
  if (!pagination) return;
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let buttons = `
    <button id="prevCatPage" ${page === 1 ? 'disabled' : ''} class="page-circle-btn">
      <i class="fas fa-chevron-left"></i>
    </button>
  `;
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
    <button id="nextCatPage" ${page === totalPages ? 'disabled' : ''} class="page-circle-btn">
      <i class="fas fa-chevron-right"></i>
    </button>
  `;
  pagination.innerHTML = buttons;

  document.getElementById('prevCatPage').onclick = () => {
    if (page > 1) {
      catCurrentPage--;
      const keyword = document.getElementById('search-slug').value.trim();
      const status = document.getElementById('filter-status').value;
      const sortOrder = document.getElementById('sort-order').value;
      const customLetter = document.getElementById('custom-sort-letter').value.trim();
      const filtered = filterCategories(categories, keyword, status, sortOrder, customLetter);
      renderCategoriesWithPagination(filtered, catCurrentPage);
    }
  };
  document.getElementById('nextCatPage').onclick = () => {
    if (page < totalPages) {
      catCurrentPage++;
      const keyword = document.getElementById('search-slug').value.trim();
      const status = document.getElementById('filter-status').value;
      const sortOrder = document.getElementById('sort-order').value;
      const customLetter = document.getElementById('custom-sort-letter').value.trim();
      const filtered = filterCategories(categories, keyword, status, sortOrder, customLetter);
      renderCategoriesWithPagination(filtered, catCurrentPage);
    }
  };
  document.querySelectorAll('.page-btn').forEach(btn => {
    btn.onclick = function() {
      const gotoPage = Number(this.dataset.page);
      if (gotoPage !== page) {
        catCurrentPage = gotoPage;
        const keyword = document.getElementById('search-slug').value.trim();
        const status = document.getElementById('filter-status').value;
        const sortOrder = document.getElementById('sort-order').value;
        const customLetter = document.getElementById('custom-sort-letter').value.trim();
        const filtered = filterCategories(categories, keyword, status, sortOrder, customLetter);
        renderCategoriesWithPagination(filtered, catCurrentPage);
      }
    };
  });
}

// Fetch categories
async function fetchCategories() {
  const tbody = document.getElementById('category-table-body'); 
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Đang tải...</td></tr>';
  try {
    const data = await AdminServices.getCategories();
    categories = Array.isArray(data) ? data : [];
    const sortOrder = document.getElementById('sort-order').value;
    const customLetter = document.getElementById('custom-sort-letter').value.trim();
    const filtered = filterCategories(categories, '', '', sortOrder, customLetter);
    renderCategoriesWithPagination(filtered, 1);
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Lỗi tải dữ liệu</td></tr>';
    showNotification('error', 'Không thể tải danh mục: ' + err.message);
  }
}

// Fetch orders for notifications
async function fetchOrders() {
  const token = getToken();
  if (!token) {
    showNotification('error', 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
    return [];
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
    return ordersData.orders || [];
  } catch (error) {
    showNotification('error', 'Lỗi khi tải đơn hàng: ' + error.message);
    return [];
  }
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

    // Add click event for notification items
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

// Handle new order notifications
async function handleOrderNotifications() {
  const orders = await fetchOrders();
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

  renderNotifications(orders);
}

// Notification system
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

// Toggle notification dropdown
function toggleNotificationDropdown() {
  const dropdown = document.getElementById('notificationDropdown');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
}

// Event listeners for category actions
document.addEventListener('click', async function(e) {
  // Xóa danh mục
  if (e.target.classList.contains('btn-return')) {
    const id = e.target.getAttribute('data-id');
    if (await showConfirmDeleteDialog()) {
      try {
        await AdminServices.deleteCategory(id);
        showSuccessDeletebook();
        fetchCategories();
      } catch (err) {
        showErrorDialog('Xóa thất bại!', err.message || 'Lỗi không xác định.');
      }
    }
  }

  // Sửa danh mục
  if (e.target.classList.contains('btn-update')) {
    editingCategoryId = e.target.getAttribute('data-id');
    document.getElementById('cat-name').value = e.target.getAttribute('data-name') || '';
    document.getElementById('cat-slug').value = e.target.getAttribute('data-slug') || '';
    document.getElementById('cat-image').value = e.target.getAttribute('data-image') || '';

    updateImageSelection(e.target.getAttribute('data-image') || '');

    setTimeout(() => {
      initCatDescEditorIfNeeded().then(() => {
        if (catDescEditor) catDescEditor.setData(e.target.getAttribute('data-description') || '');
      });
    }, 0);

    document.getElementById('cat-status').value = e.target.getAttribute('data-status') === 'false' ? 'false' : 'true';
    document.getElementById('add-category-modal').style.display = 'flex';
    document.getElementById('save-category-btn').style.display = 'none';
    document.getElementById('update-category-btn').style.display = 'block';
  }

  // Ẩn/Hiển thị danh mục
  if (e.target.classList.contains('btn-confirm')) {
    const row = e.target.closest('tr');
    const id = row.querySelector('.btn-update').getAttribute('data-id');
    const currentVisible = e.target.getAttribute('data-isvisible') === 'true';
    
    if (!id) return;
    
    try {
      await AdminServices.updateCategory(id, { isVisible: !currentVisible });
      showUpdateBookSuccessDialog();
      fetchCategories();
    } catch (err) {
      showErrorDialog('Lỗi kết nối!', err.message || 'Lỗi không xác định.');
    }
  }
});

// Hàm lọc và sắp xếp danh mục
function filterCategories(categories, keyword, status, sortOrder, customLetter = '') {
  const lower = keyword.toLowerCase();
  let filtered = categories.filter(c =>
    ((c.name || '').toLowerCase().includes(lower) ||
    (c.slug || '').toLowerCase().includes(lower) ||
    (c.description || '').toLowerCase().includes(lower))
    && (
      status === '' ||
      (status === 'active' && c.isVisible !== false) ||
      (status === 'inactive' && c.isVisible === false)
    )
  );

  // Custom sorting logic
  if (sortOrder === 'custom' && customLetter) {
    const lowerCustomLetter = customLetter.toLowerCase();
    filtered.sort((a, b) => {
      const aName = (a.name || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();
      const aStartsWith = aName.startsWith(lowerCustomLetter) ? -1 : 1;
      const bStartsWith = bName.startsWith(lowerCustomLetter) ? -1 : 1;
      if (aStartsWith !== bStartsWith) {
        return aStartsWith - bStartsWith;
      }
      return vietnameseCompare(aName, bName);
    });
  } else {
    switch (sortOrder) {
      case 'name-asc':
        filtered.sort((a, b) => vietnameseCompare(a.name || '', b.name || ''));
        break;
      case 'name-desc':
        filtered.sort((a, b) => vietnameseCompare(b.name || '', a.name || ''));
        break;
      case 'created-asc':
        filtered.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        break;
      case 'created-desc':
        filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      default:
        filtered.sort((a, b) => vietnameseCompare(a.name || '', b.name || ''));
    }
  }

  return filtered;
}

// Search functionality
document.getElementById('btn-search').addEventListener('click', function() {
  const keyword = document.getElementById('search-slug').value.trim();
  const status = document.getElementById('filter-status').value;
  const sortOrder = document.getElementById('sort-order').value;
  const customLetter = document.getElementById('custom-sort-letter').value.trim();
  const filtered = filterCategories(categories, keyword, status, sortOrder, customLetter);
  renderCategoriesWithPagination(filtered, 1);
});

document.getElementById('search-slug').addEventListener('input', function() {
  const keyword = this.value;
  const status = document.getElementById('filter-status').value;
  const sortOrder = document.getElementById('sort-order').value;
  const customLetter = document.getElementById('custom-sort-letter').value.trim();
  const filtered = filterCategories(categories, keyword, status, sortOrder, customLetter);
  renderCategoriesWithPagination(filtered, 1);
});

document.getElementById('filter-status').addEventListener('change', function() {
  const keyword = document.getElementById('search-slug').value.trim();
  const status = this.value;
  const sortOrder = document.getElementById('sort-order').value;
  const customLetter = document.getElementById('custom-sort-letter').value.trim();
  const filtered = filterCategories(categories, keyword, status, sortOrder, customLetter);
  renderCategoriesWithPagination(filtered, 1);
});

document.getElementById('sort-order').addEventListener('change', function() {
  const customSortInput = document.getElementById('custom-sort-letter');
  customSortInput.style.display = this.value === 'custom' ? 'block' : 'none';
  const keyword = document.getElementById('search-slug').value.trim();
  const status = document.getElementById('filter-status').value;
  const sortOrder = this.value;
  const customLetter = customSortInput.value.trim();
  const filtered = filterCategories(categories, keyword, status, sortOrder, customLetter);
  renderCategoriesWithPagination(filtered, 1);
});

document.getElementById('custom-sort-letter').addEventListener('input', function() {
  const keyword = document.getElementById('search-slug').value.trim();
  const status = document.getElementById('filter-status').value;
  const sortOrder = document.getElementById('sort-order').value;
  const customLetter = this.value.trim();
  const filtered = filterCategories(categories, keyword, status, sortOrder, customLetter);
  renderCategoriesWithPagination(filtered, 1);
});

// Mở modal thêm danh mục
document.querySelector('.btn-export').addEventListener('click', function() {
  document.getElementById('add-category-modal').style.display = 'flex';
  document.getElementById('save-category-btn').style.display = 'block';
  document.getElementById('update-category-btn').style.display = 'none';
  editingCategoryId = null;
  document.getElementById('add-category-form').reset();
  setTimeout(() => {
    initCatDescEditorIfNeeded().then(() => {
      if (catDescEditor) catDescEditor.setData('');
    });
  }, 0);
});

// Đóng modal
document.getElementById('close-modal').onclick = function() {
  document.getElementById('add-category-modal').style.display = 'none';
  document.getElementById('save-category-btn').style.display = 'block';
  document.getElementById('update-category-btn').style.display = 'none';
  editingCategoryId = null;
  document.getElementById('add-category-form').reset();
};

// Thêm danh mục mới
document.getElementById('add-category-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  if (editingCategoryId) {
    showErrorDialog('Lỗi!', 'Đang ở chế độ sửa. Bấm nút cập nhật!');
    return;
  }

  const name = document.getElementById('cat-name').value.trim();
  const slug = document.getElementById('cat-slug').value.trim();
  await initCatDescEditorIfNeeded();
  const description = catDescEditor ? catDescEditor.getData() : '';
  const isVisible = document.getElementById('cat-status').value === 'true';

  if (!name || !slug) {
    showErrorDialog('Lỗi!', 'Vui lòng nhập tên danh mục và slug!');
    return;
  }

  // Disable button to prevent double submission
  const submitBtn = document.getElementById('save-category-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang lưu...';
    submitBtn.style.opacity = '0.6';
    submitBtn.style.cursor = 'not-allowed';
  }

  // Disable button to prevent double submission
  const submitBtn = document.getElementById('save-category-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang lưu...';
    submitBtn.style.opacity = '0.6';
  }

  try {
    const file = document.getElementById('cat-upload').files[0];
    const formData = new FormData();
    formData.append('name', name);
    formData.append('slug', slug);
    formData.append('description', description);
    formData.append('isVisible', isVisible.toString());
    
    if (file) {
      formData.append('image', file);
    }

    await AdminServices.createCategory(formData);
    showAddBookSuccessDialog();
    document.getElementById('add-category-modal').style.display = 'none';
    this.reset();
    document.getElementById('preview-image').style.display = 'none';
    fetchCategories();
  } catch (err) {
    // Re-enable button on error
    const submitBtn = document.getElementById('save-category-btn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Lưu';
      submitBtn.style.opacity = '1';
    }
    showErrorDialog('Lỗi!', err.message || 'Lỗi kết nối hoặc server không phản hồi');
  } finally {
    // Always re-enable button
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Lưu';
      submitBtn.style.opacity = '1';
      submitBtn.style.cursor = 'pointer';
    }
  }
});

// Cập nhật danh mục
document.getElementById('update-category-btn').addEventListener('click', async function (e) {
  e.preventDefault();
  if (!editingCategoryId) return;

  const name = document.getElementById('cat-name').value.trim();
  const slug = document.getElementById('cat-slug').value.trim();
  await initCatDescEditorIfNeeded();
  const description = catDescEditor ? catDescEditor.getData() : '';
  const isVisible = document.getElementById('cat-status').value === 'true';

  if (!name || !slug) {
    showErrorDialog('Lỗi!', 'Vui lòng nhập tên danh mục và slug!');
    return;
  }

  // Disable button to prevent double submission
  const updateBtn = document.getElementById('update-category-btn');
  if (updateBtn) {
    updateBtn.disabled = true;
    updateBtn.textContent = 'Đang cập nhật...';
    updateBtn.style.opacity = '0.6';
  }

  try {
    const file = document.getElementById('cat-upload').files[0];
    const formData = new FormData();
    formData.append('name', name);
    formData.append('slug', slug);
    formData.append('description', description);
    formData.append('isVisible', isVisible);
    
    if (file) {
      formData.append('image', file);
    }

    const result = await AdminServices.updateCategory(editingCategoryId, formData);
    showUpdateBookSuccessDialog();
    
    const idx = categories.findIndex(cat => cat._id === editingCategoryId);
    if (idx !== -1) {
      categories[idx] = { ...categories[idx], ...result };
    }
    
    const sortOrder = document.getElementById('sort-order').value;
    const customLetter = document.getElementById('custom-sort-letter').value.trim();
    const filtered = filterCategories(categories, '', '', sortOrder, customLetter);
    renderCategoriesWithPagination(filtered, catCurrentPage);
    resetCategoryForm();
  } catch (err) {
    showErrorDialog('Lỗi!', err.message || 'Lỗi kết nối!');
  } finally {
    // Always re-enable button
    if (updateBtn) {
      updateBtn.disabled = false;
      updateBtn.textContent = 'Cập nhật';
      updateBtn.style.opacity = '1';
      updateBtn.style.cursor = 'pointer';
    }
  }
});

// CKEditor initialization
let catDescEditor = null;
let catDescEditorPromise = null;

function initCatDescEditorIfNeeded() {
  if (!catDescEditorPromise) {
    catDescEditorPromise = ClassicEditor.create(document.querySelector('#cat-desc'))
      .then(editor => {
        catDescEditor = editor;
        return editor;
      })
      .catch(error => {
        console.error(error);
      });
  }
  return catDescEditorPromise;
}

// Upload image functionality
const inputFile = document.getElementById('cat-upload');

document.getElementById('btn-select-image').addEventListener('click', function() {
  inputFile.click();
});

inputFile.onchange = function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const preview = document.getElementById('preview-image');
      preview.src = e.target.result;
      preview.style.display = 'block';
      showDeleteImageButton(preview);
    };
    reader.readAsDataURL(file);
  }
};

function updateImageSelection(url) {
  const preview = document.getElementById('preview-image');
  
  if (url) {
    preview.src = url;
    preview.style.display = 'block';
    showDeleteImageButton(preview);
  } else {
    preview.src = '';
    preview.style.display = 'none';
    const btn = document.getElementById('delete-image-btn');
    if (btn) btn.style.display = 'none';
  }
}

function showDeleteImageButton(preview) {
  let btn = document.getElementById('delete-image-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'delete-image-btn';
    btn.textContent = '×';
    btn.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      background: red;
      color: white;
      border: none;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      font-size: 14px;
      cursor: pointer;
    `;
    btn.onclick = () => {
      document.getElementById('cat-upload').value = '';
      preview.src = '';
      preview.style.display = 'none';
      btn.style.display = 'none';
    };

    const wrapper = ensurePreviewWrapper(preview);
    wrapper.appendChild(btn);
  }
  btn.style.display = 'block';
}

function ensurePreviewWrapper(preview) {
  let wrapper = document.getElementById('preview-wrapper');
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.id = 'preview-wrapper';
    wrapper.style.cssText = 'position: relative; display: inline-block;';
    preview.parentNode.insertBefore(wrapper, preview);
    wrapper.appendChild(preview);
  }
  return wrapper;
}

function resetCategoryForm() {
  document.getElementById('add-category-form').reset();
  
  if (catDescEditor) catDescEditor.setData('');
  
  const preview = document.getElementById('preview-image');
  preview.src = '';
  preview.style.display = 'none';
  
  const deleteBtn = document.getElementById('delete-image-btn');
  if (deleteBtn) deleteBtn.style.display = 'none';
  
  document.getElementById('add-category-modal').style.display = 'none';
  document.getElementById('save-category-btn').style.display = 'block';
  document.getElementById('update-category-btn').style.display = 'none';
  
  editingCategoryId = null;
}

// Dialog functions
function showSuccessDeletebook() {
  const dialog = document.createElement('div');
  dialog.id = 'dialog-success-delete-book';
  dialog.style.cssText = 'position: fixed; inset: 0; z-index: 9999; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-family: \'Segoe UI\', sans-serif;';
  dialog.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 24px 32px; max-width: 360px; width: 100%; text-align: center;">
      <img src="https://img.icons8.com/color/48/000000/ok--v1.png" alt="ok">
      <h3 style="margin-top: 12px; font-size: 18px;">Đã xóa danh mục thành công!</h3>
      <button onclick="closeDeleteDialog()" style="margin-top: 20px; padding: 8px 24px; background: #00cfff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">OK</button>
    </div>
  `;
  document.body.appendChild(dialog);
  setTimeout(() => dialog.style.display = 'flex', 0);
}

function showErrorDialog(title, message) {
  const dialog = document.createElement('div');
  dialog.id = 'dialog-error';
  dialog.style.cssText = 'position: fixed; inset: 0; z-index: 9999; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-family: \'Segoe UI\', sans-serif;';
  dialog.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 24px 32px; max-width: 360px; width: 100%; text-align: center;">
      <img src="https://img.icons8.com/color/48/000000/error.png" alt="error">
      <h3 style="margin-top: 12px; font-size: 18px;">${title}</h3>
      <p style="color: #d32f2f;">${message}</p>
      <button onclick="this.parentElement.parentElement.style.display='none'" style="margin-top: 20px; padding: 8px 24px; background: #ff4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">OK</button>
    </div>
  `;
  document.body.appendChild(dialog);
  setTimeout(() => dialog.style.display = 'flex', 0);
}

function showAddBookSuccessDialog() {
  const dialog = document.createElement('div');
  dialog.id = 'dialog-success-add-book';
  dialog.style.cssText = 'position: fixed; inset: 0; z-index: 9999; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-family: \'Segoe UI\', sans-serif;';
  dialog.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 24px 32px; max-width: 360px; width: 100%; text-align: center;">
      <img src="https://img.icons8.com/color/48/000000/ok--v1.png" alt="ok">
      <h3 style="font-size: 18px; margin-bottom: 24px;">Thêm danh mục thành công!</h3>
      <div style="display: flex; justify-content: space-around;">
        <button onclick="closeAddBookDialog()" style="padding: 8px 24px; background: #e0e0e0; color: #000; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Quay lại</button>
        <button onclick="closeAddBookDialog()" style="padding: 8px 24px; background: #00cfff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Xác nhận</button>
      </div>
    </div>
  `;
  document.body.appendChild(dialog);
  setTimeout(() => dialog.style.display = 'flex', 0);
}

function showUpdateBookSuccessDialog() {
  const dialog = document.createElement('div');
  dialog.id = 'dialog-success-update-book';
  dialog.style.cssText = 'position: fixed; inset: 0; z-index: 9999; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-family: \'Segoe UI\', sans-serif;';
  dialog.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 24px 32px; max-width: 360px; width: 100%; text-align: center;">
      <img src="https://img.icons8.com/color/48/000000/ok--v1.png" alt="ok">
      <h3 style="font-size: 18px; margin-bottom: 20px;">Cập nhật danh mục thành công!</h3>
      <button onclick="closeUpdateBookDialog()" style="padding: 8px 24px; background: #00cfff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">OK</button>
    </div>
  `;
  document.body.appendChild(dialog);
  setTimeout(() => dialog.style.display = 'flex', 0);
}

function showConfirmDeleteDialog(message = 'Bạn có chắc muốn xóa danh mục này?') {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.id = 'confirm-delete-overlay';
    overlay.style.cssText = 'position: fixed; inset: 0; z-index: 9998; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; font-family: \'Segoe UI\', sans-serif;';
    overlay.innerHTML = `
      <div style="background: white; border-radius: 12px; padding: 16px 20px; max-width: 360px; width: 100%; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); text-align: left;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <img src="https://img.icons8.com/fluency/24/delete-sign.png" alt="delete-icon" />
          <span style="font-size: 15px;">${message}</span>
        </div>
        <div style="height: 2px; background-color: #00cfff; margin-bottom: 16px;"></div>
        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <button id="btn-cancel-delete" style="padding: 6px 16px; background: #ffecec; color: #f44336; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Hủy</button>
          <button id="btn-ok-delete" style="padding: 6px 16px; background: #00cfff; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#btn-cancel-delete').onclick = () => { document.body.removeChild(overlay); resolve(false); };
    overlay.querySelector('#btn-ok-delete').onclick = () => { document.body.removeChild(overlay); resolve(true); };
  });
}

function closeDeleteDialog() {
  const dialog = document.getElementById('dialog-success-delete-book');
  if (dialog) {
    dialog.style.display = 'none';
    document.body.removeChild(dialog);
    fetchCategories();
  }
}

function closeAddBookDialog() {
  const dialog = document.getElementById('dialog-success-add-book');
  if (dialog) {
    dialog.style.display = 'none';
    document.body.removeChild(dialog);
  }
}

function closeUpdateBookDialog() {
  const dialog = document.getElementById('dialog-success-update-book');
  if (dialog) {
    dialog.style.display = 'none';
    document.body.removeChild(dialog);
  }
}

function goToOrderDetails(orderId) {
  window.location.href = 'danhmucdonhang';
}

// Initialize
window.onload = () => {
  const savedAvatar = localStorage.getItem('userAvatar');
  if (savedAvatar) {
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    const headerAvatar = document.getElementById('headerAvatar');
    if (sidebarAvatar) sidebarAvatar.src = savedAvatar.replace('https://server-shelf-stacker.onrender.com', 'https://server-shelf-stacker-w1ds.onrender.com');
    if (headerAvatar) headerAvatar.src = savedAvatar.replace('https://server-shelf-stacker.onrender.com', 'https://server-shelf-stacker-w1ds.onrender.com');
  }

  const uploadDialog = document.getElementById('uploadDialog');
  uploadDialog.removeAttribute('open');

  fetchCategories();
  handleOrderNotifications();

  const notificationBell = document.querySelector('.notification-bell');
  if (notificationBell) {
    notificationBell.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleNotificationDropdown();
    });
  }

  document.addEventListener('click', function (event) {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown && dropdown.classList.contains('active')) {
      if (!event.target.closest('.notification-bell')) {
        dropdown.classList.remove('active');
      }
    }
  });

  const settingsLink = document.getElementById('settingsLink');
  if (settingsLink) {
    settingsLink.addEventListener('click', () => {
      document.getElementById('mainSidebar').classList.add('hidden');
      document.getElementById('settingsSidebar').classList.remove('hidden');
    });
  }

  const backButton = document.getElementById('backButton');
  if (backButton) {
    backButton.addEventListener('click', () => {
      document.getElementById('settingsSidebar').classList.add('hidden');
      document.getElementById('mainSidebar').classList.remove('hidden');
    });
  }

  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userAvatar');
      localStorage.removeItem('userId');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    });
  }

  const sidebarAvatar = document.getElementById('sidebarAvatar');
  if (sidebarAvatar) {
    sidebarAvatar.onclick = () => {
      uploadDialog.showModal();
      resetUploadDialog();
    };
  }

  const cancelButton = document.getElementById('cancelButton');
  if (cancelButton) {
    cancelButton.onclick = () => {
      uploadDialog.close();
      resetUploadDialog();
    };
  }

  uploadDialog.addEventListener('close', () => {
    resetUploadDialog();
  });

  const uploadButton = document.getElementById('uploadButton');
  if (uploadButton) {
    uploadButton.onclick = async () => {
      const fileInput = document.getElementById('avatarUpload');
      const file = fileInput.files[0];

      if (!file) {
        showNotification('error', 'Vui lòng chọn một ảnh.');
        return;
      }

      if (!file.type.startsWith('image/')) {
        showNotification('error', 'Vui lòng chọn một file ảnh hợp lệ.');
        return;
      }

      const token = getToken();
      const userId = localStorage.getItem('userId');

      if (!token) {
        showNotification('error', 'Bạn chưa đăng nhập hoặc token không hợp lệ. Vui lòng đăng nhập lại.');
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
            'Authorization': `Bearer ${token}`
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
        const imageUrl = data.avatar || URL.createObjectURL(file);

        document.getElementById('sidebarAvatar').src = imageUrl;
        document.getElementById('headerAvatar').src = imageUrl;

        localStorage.setItem('userAvatar', imageUrl);

        showNotification('success', 'Đã cập nhật ảnh đại diện thành công!');

        setTimeout(() => {
          uploadDialog.close();
          resetUploadDialog();
        }, 2000);
      } catch (error) {
        showNotification('error', 'Lỗi: ' + error.message);
        uploadButton.disabled = false;
        uploadButton.textContent = 'Tải lên';
      }
    };
  }

  function resetUploadDialog() {
    document.getElementById('avatarUpload').value = '';
    const uploadMessage = document.getElementById('uploadMessage');
    uploadMessage.style.display = 'none';
    uploadMessage.textContent = '';
    uploadMessage.className = 'notification';
    uploadButton.disabled = false;
    uploadButton.textContent = 'Tải lên';
  }
};