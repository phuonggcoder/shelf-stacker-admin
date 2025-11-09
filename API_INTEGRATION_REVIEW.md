# 📋 API Integration Review - So sánh với tài liệu API mới

## 🔍 Tổng quan

Tài liệu này so sánh các API endpoints đã implement trong `AdminServices.js` với tài liệu API mới từ backend.

---

## ✅ 1. THỐNG KÊ & DASHBOARD

### 1.1. Dashboard Statistics ✅

- **Tài liệu**: `GET /api/admin/statistics/dashboard`
- **Code**: `getDashboardStats()` → `/api/admin/statistics/dashboard` ❌
- **Cần sửa**: Đổi endpoint thành `/api/admin/statistics/dashboard`

### 1.2. Order Statistics ✅

- **Tài liệu**: `GET /api/admin/statistics/orders`
- **Code**: `getOrderStatistics()` → `/api/admin/statistics/orders` ✅

### 1.3. Revenue by Time ✅

- **Tài liệu**: `GET /api/admin/statistics/revenue/time`
- **Code**: `getRevenueByTime()` → `/api/admin/statistics/revenue/time` ✅

### 1.4. Revenue by Category ✅

- **Tài liệu**: `GET /api/admin/statistics/revenue/category`
- **Code**: `getRevenueByCategory()` → `/api/admin/statistics/revenue/category` ✅

---

## ⚠️ 2. QUẢN LÝ ĐƠN HÀNG

### 2.1. Lấy Tất Cả Đơn Hàng ✅

- **Tài liệu**: `GET /api/orders`
- **Code**: `getOrders()` → `/api/orders` ✅

### 2.2. Cập Nhật Trạng Thái Đơn Hàng ⚠️

- **Tài liệu**: `PATCH /api/orders/:order_id/status` với body `{ "order_status": "Delivered" }`
- **Code**: `updateOrderStatus(id, status, note)` → `PATCH /api/orders/:id/status` với body `{ status, note }` ❌
- **Cần sửa**: Đổi body thành `{ order_status: status }` (bỏ note hoặc thêm vào query params)

### 2.3. Cập Nhật Phương Thức Thanh Toán ✅

- **Tài liệu**: `PATCH /api/orders/:order_id/payment-method` với body `{ "payment_method": "COD" }`
- **Code**: `updatePaymentMethod()` → `/api/orders/:id/payment-method` ✅

### 2.4. Hoàn Tiền ZaloPay ✅

- **Tài liệu**: `POST /api/orders/:id/zalopay-refund`
- **Code**: `refundZaloPayOrder()` ✅

### 2.5. Hoàn Tiền PayOS ✅

- **Tài liệu**: `POST /api/orders/:id/payos-refund`
- **Code**: `refundPayOSOrder()` ✅

### 2.6. Lấy Danh Sách Đơn Hàng Cần Hoàn Tiền ✅

- **Tài liệu**: `GET /api/admin/refund-requests`
- **Code**: `getRefundRequests()` → `/api/admin/refund-requests` ✅

### 2.7. Xử Lý Hoàn Tiền Thủ Công ✅

- **Tài liệu**: `POST /api/admin/refund/:order_id/process`
- **Code**: `processRefund()` ✅

### 2.8. Thống Kê Đơn Hàng Theo Trạng Thái ✅

- **Tài liệu**: `GET /api/admin/order-stats`
- **Code**: `getOrderStats()` → `/api/admin/order-stats` ✅

### 2.9. Lấy Đơn Hàng Sắp Hết Hạn ✅

- **Tài liệu**: `GET /api/admin/expiring-orders`
- **Code**: `getExpiringOrders()` ✅

### 2.10. Hủy Đơn Hàng Thủ Công ✅

- **Tài liệu**: `POST /api/admin/orders/:order_id/cancel`
- **Code**: `cancelOrder()` ✅

### 2.11. Lấy Thông Tin Shipper và Đơn Hàng ⚠️

- **Tài liệu**: `GET /api/admin/shipper/:shipper_id/orders`
- **Code**: `getShipperOrders()` → `/api/admin/shipper/:shipperId/orders` ✅ (có thể cần kiểm tra lại)

### 2.12. Lấy Danh Sách Shipper Assignments ✅

- **Tài liệu**: `GET /api/orders/shipper-assignments`
- **Code**: `getShipperAssignments()` ✅

### 2.13. Lấy Đơn Hàng Theo Phương Thức Thanh Toán ✅

- **Tài liệu**: `GET /api/orders/by-payment-method`
- **Code**: `getOrdersByPaymentMethod()` ✅

### 2.14. Lấy Chi Tiết Shipper của Đơn Hàng ✅

- **Tài liệu**: `GET /api/orders/:id/shipper-details`
- **Code**: `getShipperDetails()` ✅

### 2.15. Thống Kê Hiệu Suất Shipper ✅

- **Tài liệu**: `GET /api/orders/shipper-performance`
- **Code**: `getShipperPerformance()` ✅

### 2.16. Thống Kê Phương Thức Thanh Toán ✅

- **Tài liệu**: `GET /api/orders/stats/payment-methods`
- **Code**: `getPaymentMethodStats()` ✅

### 2.17. Thống Kê Tổng Quan Đơn Hàng ✅

- **Tài liệu**: `GET /api/orders/stats/summary`
- **Code**: `getOrderStatsSummary()` ✅

---

## ⚠️ 3. QUẢN LÝ SÁCH

### 3.1. Tạo Sách Mới ❌

- **Tài liệu**: `POST /api/books` với `Content-Type: multipart/form-data`
- **Code**: `createBook(data)` → `POST /api/books` với `Content-Type: application/json` ❌
- **Cần sửa**: Đổi sang `multipart/form-data` và xử lý FormData

### 3.2. Lấy Danh Sách Sách (Admin) ✅

- **Tài liệu**: `GET /api/books/admin`
- **Code**: `getBooks()` → `/api/books/admin` ✅

### 3.3. Cập Nhật Sách ❌

- **Tài liệu**: `PUT /api/books/:id` với `Content-Type: multipart/form-data`
- **Code**: `updateBook(id, data)` → `PUT /api/books/:id` với `Content-Type: application/json` ❌
- **Cần sửa**: Đổi sang `multipart/form-data` và xử lý FormData

### 3.4. Xóa Sách (Soft Delete) ✅

- **Tài liệu**: `DELETE /api/books/:id`
- **Code**: `deleteBook()` ✅

### 3.5. Lấy Sách Đã Xóa ✅

- **Tài liệu**: `GET /api/books/trash/all`
- **Code**: `getTrashBooks()` ✅

### 3.6. Khôi Phục Sách ✅

- **Tài liệu**: `PATCH /api/books/:id/restore`
- **Code**: `restoreBook()` ✅

### 3.7. Xóa Vĩnh Viễn Sách ✅

- **Tài liệu**: `DELETE /api/books/:id/force`
- **Code**: `forceDeleteBook()` ✅

---

## ⚠️ 4. QUẢN LÝ DANH MỤC

### 4.1. Tạo Danh Mục Mới ❌

- **Tài liệu**: `POST /api/categories` với `Content-Type: multipart/form-data`
- **Code**: `createCategory(data)` → `POST /api/categories` với `Content-Type: application/json` ❌
- **Cần sửa**: Đổi sang `multipart/form-data` và xử lý FormData

### 4.2. Cập Nhật Danh Mục ❌

- **Tài liệu**: `PUT /api/categories/:id` với `Content-Type: multipart/form-data`
- **Code**: `updateCategory(id, data)` → `PUT /api/categories/:id` với `Content-Type: application/json` ❌
- **Cần sửa**: Đổi sang `multipart/form-data` và xử lý FormData

### 4.3. Xóa Danh Mục (Soft Delete) ✅

- **Tài liệu**: `DELETE /api/categories/:id`
- **Code**: `deleteCategory()` ✅

### 4.4. Lấy Danh Mục Đã Xóa ✅

- **Tài liệu**: `GET /api/categories/trash/all`
- **Code**: `getTrashCategories()` ✅

### 4.5. Khôi Phục Danh Mục ✅

- **Tài liệu**: `PATCH /api/categories/:id/restore`
- **Code**: `restoreCategory()` ✅

### 4.6. Xóa Vĩnh Viễn Danh Mục ✅

- **Tài liệu**: `DELETE /api/categories/:id/force`
- **Code**: `forceDeleteCategory()` ✅

---

## ✅ 5. QUẢN LÝ VOUCHER

### 5.1. Tạo Voucher Mới ✅

- **Tài liệu**: `POST /api/vouchers`
- **Code**: `createVoucher()` ✅

### 5.2. Lấy Danh Sách Voucher ✅

- **Tài liệu**: `GET /api/vouchers`
- **Code**: `getVouchers()` ✅

### 5.3. Lấy Chi Tiết Voucher ✅

- **Tài liệu**: `GET /api/vouchers/admin/:id`
- **Code**: `getVoucher()` ✅

### 5.4. Cập Nhật Voucher ✅

- **Tài liệu**: `PUT /api/vouchers/admin/:id`
- **Code**: `updateVoucher()` ✅

### 5.5. Xóa Voucher (Soft Delete) ✅

- **Tài liệu**: `DELETE /api/vouchers/admin/:id`
- **Code**: `deleteVoucher()` ✅

---

## ✅ 6. QUẢN LÝ NGƯỜI DÙNG

### 6.1. Lấy Danh Sách Người Dùng ✅

- **Tài liệu**: `GET /api/users/users`
- **Code**: `getUsers()` ✅

### 6.2. Lấy Danh Sách Shipper ✅

- **Tài liệu**: `GET /api/users/shippers` hoặc `/api/users/users/shippers`
- **Code**: `getShippers()` → `/api/users/shippers` ✅

### 6.3. Tạo Người Dùng Mới ✅

- **Tài liệu**: `POST /api/users/admin/create`
- **Code**: `createUser()` ✅

### 6.4. Khóa/Mở Khóa Người Dùng ✅

- **Tài liệu**: `PATCH /api/users/users/:userId/lock` với body `{ "isActive": false }`
- **Code**: `lockUser(id, isActive)` ✅

---

## ✅ 7. QUẢN LÝ SHIPPER

### 7.1. Lấy Danh Sách Tất Cả Shipper ✅

- **Tài liệu**: `GET /api/admin/shippers`
- **Code**: `getShippersList()` ✅

---

## ⚠️ 8. QUẢN LÝ CAMPAIGN

### 8.1. Tạo Campaign Mới ⚠️

- **Tài liệu**: `POST /api/campaigns` với `Content-Type: multipart/form-data`
- **Code**: `createCampaign(data)` → `POST /api/campaigns` với `Content-Type: application/json` ❌
- **Cần sửa**: Đổi sang `multipart/form-data`

### 8.2. Cập Nhật Campaign ⚠️

- **Tài liệu**: `PUT /api/campaigns/:id` với `Content-Type: multipart/form-data`
- **Code**: `updateCampaign(id, data)` → `PUT /api/campaigns/:id` với `Content-Type: application/json` ❌
- **Cần sửa**: Đổi sang `multipart/form-data`

### 8.3. Xóa Ảnh Khỏi Campaign ✅

- **Tài liệu**: `DELETE /api/campaigns/:id/images`
- **Code**: `deleteCampaignImage()` ✅

### 8.4. Xóa Campaign (Soft Delete) ✅

- **Tài liệu**: `DELETE /api/campaigns/:id`
- **Code**: `deleteCampaign()` ✅

### 8.5. Thêm Voucher Vào Campaign ✅

- **Tài liệu**: `POST /api/campaigns/:id/vouchers`
- **Code**: `addVouchersToCampaign()` ✅

---

## ⚠️ 9. QUẢN LÝ THANH TOÁN

### 9.1. Lấy Tất Cả Thanh Toán ✅

- **Tài liệu**: `GET /api/payments`
- **Code**: `getPayments()` ✅

### 9.2. Lấy Chi Tiết Thanh Toán ✅

- **Tài liệu**: `GET /api/payments/:id`
- **Code**: Cần thêm method `getPayment(id)`

### 9.3. Tạo Thanh Toán Mới ✅

- **Tài liệu**: `POST /api/payments`
- **Code**: `createPayment()` ✅

---

## ✅ 10. QUẢN LÝ ĐÁNH GIÁ

### 10.1. Xóa Đánh Giá ✅

- **Tài liệu**: `DELETE /api/v1/review/:reviewId`
- **Code**: `deleteReview()` → `/api/review/:reviewId` ⚠️ (thiếu `/v1`)

---

## ⚠️ 11. QUẢN LÝ THÔNG BÁO (ADMIN NOTIFICATIONS)

### 11.1. Template Management ⚠️

- **Tài liệu**: `/api/v1/admin/notification-templates`
- **Code**: `/api/admin/notification-templates` ❌ (thiếu `/v1`)
- **Cần sửa**: Thêm `/v1` vào tất cả notification endpoints

### 11.2. Dynamic Notifications ⚠️

- **Tài liệu**: `POST /api/v1/admin/dynamic-notifications/send`
- **Code**: `/api/admin/dynamic-notifications/send` ❌ (thiếu `/v1`)

### 11.3. Scheduled Notifications ⚠️

- **Tài liệu**: `/api/v1/admin/scheduled-notifications`
- **Code**: `/api/admin/scheduled-notifications` ❌ (thiếu `/v1`)

### 11.4. Instant Notifications ⚠️

- **Tài liệu**: `/api/v1/admin/instant-notifications`
- **Code**: `/api/admin/instant-notifications` ❌ (thiếu `/v1`)

### 11.5. Recipient Management ⚠️

- **Tài liệu**: `/api/v1/admin/recipients/users` và `/api/v1/admin/recipients/shippers`
- **Code**: `/api/admin/recipients/users` và `/api/admin/recipients/shippers` ❌ (thiếu `/v1`)

### 11.6. Statistics & Dashboard ⚠️

- **Tài liệu**: `/api/v1/admin/notification-stats` và `/api/v1/admin/notification-events`
- **Code**: `/api/admin/notification-stats` và `/api/admin/notification-events` ❌ (thiếu `/v1`)

---

## ⚠️ 12. QUẢN LÝ THÔNG BÁO SHIPPER

### 12.1. Kiểm Tra Trạng Thái Firebase ⚠️

- **Tài liệu**: `GET /api/v1/shipper-notifications/status`
- **Code**: `/api/admin/shipper-notifications/status` ❌ (sai path và thiếu `/v1`)

### 12.2-12.7. Các endpoints khác ⚠️

- **Tài liệu**: `/api/v1/shipper-notifications/*`
- **Code**: `/api/admin/shipper-notifications/*` ❌ (sai path và thiếu `/v1`)

---

## ⚠️ 13. LỊCH SỬ THÔNG BÁO

### 13.1. Lấy Lịch Sử Thông Báo ⚠️

- **Tài liệu**: `GET /api/notification-history`
- **Code**: `/api/admin/notifications/history` ❌ (sai path)

### 13.2. Lấy Thống Kê Thông Báo ⚠️

- **Tài liệu**: `GET /api/notification-history/stats`
- **Code**: `/api/admin/notifications/history/stats` ❌ (sai path)

### 13.3. Xóa Lịch Sử Cũ ⚠️

- **Tài liệu**: `POST /api/notification-history/clean-old`
- **Code**: `/api/admin/notifications/history/clean-old` ❌ (sai path)

### 13.4. Xuất Lịch Sử Thông Báo ⚠️

- **Tài liệu**: `POST /api/notification-history/export`
- **Code**: `/api/admin/notifications/history/export` ❌ (sai path)

---

## ⚠️ 14. SCHEDULED NOTIFICATIONS

### 14.1. Lấy Danh Sách Scheduled Notifications ⚠️

- **Tài liệu**: `GET /api/scheduled-notifications`
- **Code**: `/api/admin/scheduled-notifications` ❌ (sai path)

### 14.2. Tạo Scheduled Notification ⚠️

- **Tài liệu**: `POST /api/scheduled-notifications` với `multipart/form-data`
- **Code**: `/api/admin/scheduled-notifications` với `application/json` ❌ (sai path và content-type)

### 14.3-14.5. Các endpoints khác ⚠️

- **Tài liệu**: `/api/scheduled-notifications/*`
- **Code**: `/api/admin/scheduled-notifications/*` ❌ (sai path)

---

## ✅ 15. CKEDITOR UPLOAD

### 15.1-15.4. Các endpoints CKEditor ✅

- **Tài liệu**: `/api/ckeditor/*`
- **Code**: Chưa có implementation, cần thêm

---

## 📝 TÓM TẮT CÁC VẤN ĐỀ CẦN SỬA

### 🔴 Critical Issues (Cần sửa ngay):

1. **Dashboard Statistics**: Endpoint sai → `/api/admin/statistics/dashboard`
2. **Books/Categories/Campaigns**: Cần đổi từ JSON sang `multipart/form-data` cho create/update
3. **Order Status Update**: Body sai → `{ order_status }` thay vì `{ status }`
4. **Notification Endpoints**: Thiếu `/v1` trong path
5. **Notification History**: Path sai → `/api/notification-history` thay vì `/api/admin/notifications/history`
6. **Scheduled Notifications**: Path sai → `/api/scheduled-notifications` thay vì `/api/admin/scheduled-notifications`
7. **Shipper Notifications**: Path sai → `/api/v1/shipper-notifications` thay vì `/api/admin/shipper-notifications`
8. **Review Delete**: Thiếu `/v1` → `/api/v1/review/:reviewId`

### 🟡 Medium Issues (Nên sửa):

1. **Payment Get Detail**: Thiếu method `getPayment(id)`
2. **CKEditor Upload**: Chưa có implementation

### 🟢 Minor Issues (Có thể bỏ qua):

1. Một số endpoints có thể có version khác nhau, cần test thực tế

---

## 🔧 HƯỚNG DẪN SỬA

### 1. Sửa Dashboard Statistics:

```javascript
async getDashboardStats() {
    return this.request('/api/admin/statistics/dashboard');
}
```

### 2. Sửa Books/Categories/Campaigns để hỗ trợ multipart/form-data:

Cần tạo helper method để xử lý FormData và update các methods create/update.

### 3. Sửa Order Status Update:

```javascript
async updateOrderStatus(id, orderStatus, note = '') {
    return this.request(`/api/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ order_status: orderStatus, note })
    });
}
```

### 4. Sửa Notification Endpoints:

Thêm `/v1` vào tất cả notification endpoints.

### 5. Sửa Notification History:

Đổi path từ `/api/admin/notifications/history` → `/api/notification-history`

### 6. Sửa Scheduled Notifications:

Đổi path từ `/api/admin/scheduled-notifications` → `/api/scheduled-notifications`

### 7. Sửa Shipper Notifications:

Đổi path từ `/api/admin/shipper-notifications` → `/api/v1/shipper-notifications`

---

**Ngày tạo**: 2024-12-19
**Trạng thái**: Đang chờ sửa

