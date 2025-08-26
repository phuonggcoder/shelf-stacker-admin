# HƯỚNG DẪN IMPLEMENT THÔNG BÁO TEMPLATE VÀO FE WEB ADMIN

## 1. Thành phần cần thiết

### a. Danh sách sự kiện & template
- Các event: `login_success`, `order_created`, `payment_success`, ...
- API lấy template:
  - `GET /api/notification-templates`
  - `GET /api/notification-templates?event=order_created`

### b. Quản lý template
- Tạo mới: `POST /api/notification-templates`
- Sửa: `PUT /api/notification-templates/:id`
- Xóa: `DELETE /api/notification-templates/:id`
- Toggle trạng thái: `PATCH /api/notification-templates/:id`

### c. Gửi thông báo
- Gửi cho user: `POST /api/noti/send`
- Gửi cho tất cả: `POST /api/noti/send-all`
- Gửi theo event: `POST /api/noti/send-event`

### d. Lịch sử thông báo
- Lấy lịch sử: `GET /api/notification/user`
- Đánh dấu đã đọc: `PATCH /api/notification/user/:id/read`
- Xóa: `DELETE /api/notification/user/:id`

---

## 2. Hướng dẫn implement vào FE web admin

### a. Quản lý template notification
- Tạo bảng hiển thị danh sách template (event, title, message, image, type, active).
- Form tạo/sửa template gồm: event, title, message, image, active.
- Sử dụng API để CRUD template.
- Cho phép toggle trạng thái active/inactive.

### b. Gửi thông báo theo template
- Khi có sự kiện (ví dụ: đơn hàng mới), FE gọi API gửi thông báo theo event.
- FE truyền data động (orderId, username, ...), backend sẽ render nội dung template.

### c. Hiển thị lịch sử thông báo
- Tạo bảng lịch sử thông báo cho admin.
- Hiển thị: tiêu đề, nội dung, thời gian gửi, trạng thái đã đọc/chưa đọc, loại sự kiện.

### d. Giao diện gợi ý
- Sidebar: Quản lý template, Gửi notification, Lịch sử notification.
- Trang quản lý template: Bảng + Form CRUD.
- Trang gửi notification: Chọn event, nhập data, gửi.
- Trang lịch sử: Bảng lịch sử, filter theo event/type.

---

## 3. Ví dụ code FE (fetch API)

```js
// Lấy danh sách template
const templates = await fetch('/api/notification-templates').then(res => res.json());

// Tạo template mới
await fetch('/api/notification-templates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ event, title, message, image, active, type })
});

// Sửa template
await fetch(`/api/notification-templates/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title, message, image, active })
});

// Toggle trạng thái
await fetch(`/api/notification-templates/${id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ active: !currentStatus })
});

// Gửi thông báo theo event
await fetch('/api/noti/send-event', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ event, data })
});

// Lấy lịch sử
const history = await fetch('/api/notification/user').then(res => res.json());
```

---

## 4. Tham khảo thêm
- ADMIN_NOTIFICATION_GUIDE.md
- TEMPLATE_MANAGEMENT_GUIDE.md
- FRONTEND_ADMIN_IMPLEMENTATION_GUIDE.md
- Các router: adminNotificationRouter.js, notificationTemplateRouter.js
- Các service: adminNotificationService.js, dynamicNotification.js
