
   const BASE_URL = 'https://server-shelf-stacker.onrender.com';

   const STATUS_MAP = {
     "Pending": "Chờ xác nhận",
     "Processing": "Đang xử lý",
     "Shipped": "Đang giao",
     "Delivered": "Đã giao",
     "Cancelled": "Đã huỷ"
   };

   function getFullImageURL(path) {
     if (!path) return 'https://via.placeholder.com/60x80?text=No+Image';
     if (path.startsWith('http')) return path;
     return BASE_URL + path;
   }

   async function loadOrders(orderId = '') {
     const token = localStorage.getItem('authToken');
     if (!token) return (window.location.href = 'login.html');

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
       renderOrders(window._loadedOrders);
     } catch (error) {
       console.error('[Load orders error]:', error);
       showNotification('error', 'Bạn không có quyền truy cập hoặc phiên đăng nhập đã hết hạn');
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
           </td>
         </tr>
       `;
     }).join('');

     addOrderEventListeners();
   }

   function addOrderEventListeners() {
     document.querySelectorAll('.btn-detail').forEach(btn => {
       btn.addEventListener('click', () => {
         const orderId = btn.closest('tr').dataset.id;
         const order = window._loadedOrders.find(o => o._id === orderId);
         if (order) showOrderDetails(order);
       });
     });

     document.querySelectorAll('.btn-update').forEach(btn => {
       btn.addEventListener('click', () => {
         const orderId = btn.closest('tr').dataset.id;
         const order = window._loadedOrders.find(o => o._id === orderId);
         if (!order) return;

         const modal = document.getElementById('updateStatusModal');
         modal.dataset.orderId = order._id;
         document.getElementById('modalOrderCode').innerText = order.order_id;

         const status = order.order_status || 'Pending';
         document.getElementById('statusSelect').value = status;
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
       const newStatus = document.getElementById('statusSelect').value;

       const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
       if (!newStatus || !validStatuses.includes(newStatus)) {
         showNotification('error', 'Trạng thái không hợp lệ.');
         return;
       }

       const token = localStorage.getItem('authToken');
       if (!token) {
         showNotification('error', 'Chưa đăng nhập.');
         return (window.location.href = 'login.html');
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
         console.error('[Cập nhật lỗi]:', err);
         showNotification('error', '❌ ' + err.message);
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
       const rawImage = book.thumbnail || book.main_image?.[0];
       const image = getFullImageURL(rawImage);

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

   function searchOrders(keyword) {
     if (!keyword) {
       loadOrders();
       return;
     }

     const filteredOrders = window._loadedOrders.filter(order => {
       const code = (order.order_id || order._id || '').toLowerCase();
       const customerName = (order.user_id?.username || '').toLowerCase();
       return code.includes(keyword.toLowerCase()) || customerName.includes(keyword.toLowerCase());
     });

     renderOrders(filteredOrders);
   }

   document.getElementById('order-search').addEventListener('input', debounce((e) => {
     const keyword = e.target.value.trim();
     searchOrders(keyword);
   }, 300));

   document.getElementById('btn-order-search').addEventListener('click', () => {
     const keyword = document.getElementById('order-search').value.trim();
     searchOrders(keyword);
   });

   function exportToExcel() {
     console.log("Exporting to Excel..."); // Log để debug
     const orders = window._loadedOrders || [];
     if (!orders.length) {
       showNotification('error', 'Không có dữ liệu để xuất.');
       return;
     }

     const statusFilter = document.querySelector('.search-filter select').value.toLowerCase();
     const dateInputs = document.querySelectorAll('.search-filter input[type="date"]');
     const startDate = dateInputs[0].value ? new Date(dateInputs[0].value) : null;
     const endDate = dateInputs[1].value ? new Date(dateInputs[1].value) : null;

     let filteredOrders = orders;

     if (statusFilter && statusFilter !== "-- trạng thái --") {
       const statusMap = {
         'pending': 'Pending',
         'processing': 'Processing',
         'shipped': 'Shipped',
         'delivered': 'Delivered',
         'cancelled': 'Cancelled'
       };
       const statusKey = statusMap[statusFilter];
       if (statusKey) {
         filteredOrders = filteredOrders.filter(order => order.order_status === statusKey);
       }
     }

     if (startDate && endDate) {
       filteredOrders = filteredOrders.filter(order => {
         const orderDate = new Date(order.order_date || order.createdAt);
         return !isNaN(orderDate) && orderDate >= startDate && orderDate <= endDate;
       });
     } else if (startDate) {
       filteredOrders = filteredOrders.filter(order => {
         const orderDate = new Date(order.order_date || order.createdAt);
         return !isNaN(orderDate) && orderDate >= startDate;
       });
     } else if (endDate) {
       filteredOrders = filteredOrders.filter(order => {
         const orderDate = new Date(order.order_date || order.createdAt);
         return !isNaN(orderDate) && orderDate <= endDate;
       });
     }

     if (!filteredOrders.length) {
       showNotification('error', 'Không có đơn hàng nào khớp với bộ lọc.');
       return;
     }

     // Prepare data for Excel
     const data = filteredOrders.map(order => {
       const code = order.order_id || order._id || 'Không rõ';
       const customerName = order.user_id?.username || 'Không rõ';
       const createdAt = order.order_date || order.createdAt || '';
       const formattedDate = createdAt
         ? new Date(createdAt).toLocaleString()
         : 'Chưa rõ';
       const status = STATUS_MAP[order.order_status] || 'Chưa rõ';
       const total = order.total_amount?.toLocaleString() || '0';
       
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

     // Create a new workbook and worksheet
     const ws = XLSX.utils.json_to_sheet(data);
     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, 'Orders');

     // Force download with .xlsx extension
     const fileName = `orders_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
     console.log("Saving file:", fileName); // Log tên file
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

     const styleSheet = document.styleSheets[0];
     styleSheet.insertRule(`
       @keyframes slideIn {
         from { transform: translateX(100%); opacity: 0; }
         to { transform: translateX(0); opacity: 1; }
       }
     `, styleSheet.cssRules.length);
     styleSheet.insertRule(`
       @keyframes fadeOut {
         from { opacity: 1; }
         to { opacity: 0; }
       }
     `, styleSheet.cssRules.length);

     setTimeout(() => {
       notification.style.opacity = '0';
       setTimeout(() => {
         document.body.removeChild(notification);
       }, 500);
     }, 2500);
   }

   window.onload = () => {
     const savedAvatar = localStorage.getItem('userAvatar');
     if (savedAvatar) {
       document.getElementById('sidebarAvatar').src = savedAvatar;
       document.getElementById('headerAvatar').src = savedAvatar;
     }
     const uploadDialog = document.getElementById('uploadDialog');
     uploadDialog.removeAttribute('open');
     document.querySelector('.btn-export').addEventListener('click', exportToExcel);
   };

   const uploadDialog = document.getElementById('uploadDialog');
   const uploadMessage = document.getElementById('uploadMessage');
   const uploadButton = document.getElementById('uploadButton');
   const cancelButton = document.getElementById('cancelButton');
   const sidebarAvatar = document.getElementById('sidebarAvatar');

   document.getElementById('settingsLink').onclick = () => {
     document.getElementById('mainSidebar').classList.add('hidden');
     document.getElementById('settingsSidebar').classList.remove('hidden');
   };

   document.getElementById('backButton').onclick = () => {
     document.getElementById('settingsSidebar').classList.add('hidden');
     document.getElementById('mainSidebar').classList.remove('hidden');
   };

   document.getElementById('logoutButton').onclick = () => {
     fetch('login')
       .then(res => {
         if (res.ok) {
           localStorage.removeItem('userAvatar');
           alert('Đã đăng xuất, chuyển hướng đến trang đăng nhập.');
           window.location.href = 'login';
         } else {
           alert('Không tìm thấy file login.html, vui lòng tạo file này.');
         }
       })
       .catch(() => {
         alert('Không thể kiểm tra file login. Có thể đường dẫn sai hoặc server chưa chạy.');
       });
   };

   sidebarAvatar.onclick = () => {
     uploadDialog.showModal();
     resetUploadDialog();
   };

   cancelButton.onclick = () => {
     uploadDialog.close();
     resetUploadDialog();
   };

   uploadDialog.addEventListener('close', () => {
     resetUploadDialog();
   });

   function resetUploadDialog() {
     document.getElementById('avatarUpload').value = '';
     uploadMessage.style.display = 'none';
     uploadMessage.textContent = '';
     uploadMessage.className = 'notification';
     uploadButton.disabled = false;
     uploadButton.textContent = 'Tải lên';
   }

   uploadButton.onclick = async () => {
     const fileInput = document.getElementById('avatarUpload');
     const file = fileInput.files[0];

     if (!file) {
       alert('Vui lòng chọn một ảnh.');
       return;
     }

     if (!file.type.startsWith('image/')) {
       alert('Vui lòng chọn một file ảnh hợp lệ.');
       return;
     }

     const token = localStorage.getItem('authToken');
     const userId = localStorage.getItem('userId');

     if (!token) {
       alert('Bạn chưa đăng nhập hoặc token không hợp lệ. Vui lòng đăng nhập lại.');
       return;
     }

     if (!userId) {
       alert('Thiếu userId. Vui lòng đăng nhập lại.');
       return;
     }

     uploadButton.disabled = true;
     uploadButton.textContent = 'Đang tải...';

     try {
       const formData = new FormData();
       formData.append('avatar', file);
       formData.append('userId', userId);

       const response = await fetch('https://server-shelf-stacker.onrender.com/api/user-upload/avatar', {
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

       uploadMessage.style.display = 'block';
       uploadMessage.textContent = 'Đã cập nhật ảnh đại diện thành công!';
       uploadMessage.className = 'notification success-message';

       setTimeout(() => {
         uploadDialog.close();
         resetUploadDialog();
       }, 2000);
     } catch (error) {
       uploadMessage.style.display = 'block';
       uploadMessage.textContent = 'Lỗi: ' + error.message;
       uploadMessage.className = 'notification error-message';
       uploadButton.disabled = false;
       uploadButton.textContent = 'Tải lên';
     }
   };

   loadOrders();
