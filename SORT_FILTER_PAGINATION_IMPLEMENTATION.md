# 📊 Tài Liệu Triển Khai Sort/Filter/Pagination

## ✅ Đã Áp Dụng

Tài liệu này mô tả các thay đổi đã được áp dụng vào `AdminServices.js` để hỗ trợ đầy đủ sort, filter và pagination theo tài liệu API.

---

## 📋 Các Methods Đã Cập Nhật

### 1. Orders Management

#### `getOrders(params)`

- ✅ Pagination: `page` (default: 1), `limit` (default: 20)
- ✅ Filter: `status`, `user_id`, `shipper_id`
- ✅ Response: `{ orders: [...], total, page, limit, pages }`

**Ví dụ sử dụng:**

```javascript
await AdminServices.getOrders({
  page: 1,
  limit: 20,
  status: "Delivered",
  user_id: "507f1f77bcf86cd799439011",
});
```

#### `getOrdersByPaymentMethod(params)`

- ✅ Required: `payment_method` (COD, BANK_TRANSFER, MOMO, ZALOPAY, VNPAY, PAYOS)
- ✅ Pagination: `page` (default: 1), `limit` (default: 20)

#### `getShipperAssignments(params)`

- ✅ Pagination: `page` (default: 1), `limit` (default: 20)
- ✅ Filter: `status`

#### `getShipperPerformance(params)`

- ✅ Filter: `shipper_id`, `start_date` (YYYY-MM-DD), `end_date` (YYYY-MM-DD)

#### `getShipperOrders(shipperId, params)`

- ✅ Pagination: `page` (default: 1), `limit` (default: 20)
- ✅ Filter: `status`
- ✅ Response: `{ shipper: {...}, orders: [...], pagination: {...}, stats: [...] }`

---

### 2. Books Management

#### `getBooks(params)`

- ✅ Pagination: `page` (default: 1), `limit` (default: 20)
- ✅ Filter: `category`, `status` (in_stock, out_of_stock), `search`
- ✅ Response: `{ books: [...], pagination: { page, limit, total, pages } }`

**Ví dụ sử dụng:**

```javascript
await AdminServices.getBooks({
  page: 1,
  limit: 20,
  category: "507f1f77bcf86cd799439011",
  status: "in_stock",
  search: "tiểu thuyết",
});
```

---

### 3. Categories Management

#### `getCategories(params)`

- ✅ Filter: `visible` ("true" hoặc "false")
- ✅ Response: Array of categories

**Ví dụ sử dụng:**

```javascript
await AdminServices.getCategories({
  visible: "true",
});
```

---

### 4. Vouchers Management

#### `getVouchers(params)`

- ✅ Pagination: `page` (default: 1), `limit` (default: 10)
- ✅ Filter: `search`, `voucher_type` (discount, shipping), `status` (active, inactive)
- ✅ Response: `{ success: true, vouchers: [...], pagination: { page, limit, total, pages } }`

**Ví dụ sử dụng:**

```javascript
await AdminServices.getVouchers({
  page: 1,
  limit: 10,
  voucher_type: "discount",
  status: "active",
  search: "SUMMER",
});
```

---

### 5. Users Management

#### `getShippers(params)`

- ✅ Pagination: `page` (default: 1), `limit` (default: 50, min: 1, max: 100)
- ✅ Filter: `verified` (boolean), `isActive` (boolean)
- ✅ Response: `{ success: true, total, page, limit, users: [...] }`

**Ví dụ sử dụng:**

```javascript
await AdminServices.getShippers({
  page: 1,
  limit: 50,
  verified: true,
  isActive: true,
});
```

#### `getShippersList(params)`

- ✅ Pagination: `page` (default: 1), `limit` (default: 20)
- ✅ Response: `{ shippers: [...], pagination: { page, limit, total, pages } }`

---

### 6. Refund Management

#### `getRefundRequests(params)`

- ✅ Pagination: `page` (default: 1), `limit` (default: 20)
- ✅ Filter: `status` (pending, processing, completed, failed)
- ✅ Response: `{ orders: [...], pagination: { page, limit, total, pages } }`

**Ví dụ sử dụng:**

```javascript
await AdminServices.getRefundRequests({
  page: 1,
  limit: 20,
  status: "pending",
});
```

---

### 7. Reviews Management

#### `getProductReviews(productId, params)` ⭐ NEW

- ✅ Pagination: `page` (default: 1), `limit` (default: 10)
- ✅ Sort: `sort` (latest, highest, lowest - default: latest)
- ✅ Filter: `hasImage` (boolean)
- ✅ Response: `{ reviews: [...], pagination: {...}, summary: {...} }`

**Ví dụ sử dụng:**

```javascript
await AdminServices.getProductReviews("507f1f77bcf86cd799439011", {
  page: 1,
  limit: 10,
  sort: "highest",
  hasImage: true,
});
```

#### `getUserReviews(userId, params)` ⭐ NEW

- ✅ Pagination: `page` (default: 1), `limit` (default: 10)
- ✅ Response: `{ reviews: [...], pagination: {...} }`

#### `getMyReviews(params)` ⭐ NEW

- ✅ Pagination: `page` (default: 1), `limit` (default: 10)
- ✅ Response: `{ reviews: [...], pagination: {...} }`

---

### 8. Notifications Management

#### `getNotificationTemplates(params)`

- ✅ Pagination: `page` (default: 1), `limit` (default: 10)
- ✅ Filter: `type`, `event`
- ✅ Response: `{ success: true, templates: [...], pagination: {...} }`

#### `getScheduledNotifications(params)`

- ✅ Pagination: `page` (default: 1), `limit` (default: 20)
- ✅ Filter: `status`, `type`, `startDate` (YYYY-MM-DD), `endDate` (YYYY-MM-DD)
- ✅ Response: `{ scheduledNotifications: [...], total, page, limit }`

#### `getAdminScheduledNotifications(params)`

- ✅ Pagination: `page` (default: 1), `limit` (default: 10)
- ✅ Filter: `type`, `status` (pending, sent, cancelled, failed)
- ✅ Response: `{ success: true, notifications: [...], pagination: {...} }`

#### `getInstantNotifications(params)`

- ✅ Pagination: `page` (default: 1), `limit` (default: 10)
- ✅ Filter: `type`, `status`
- ✅ Response: `{ success: true, notifications: [...], pagination: {...} }`

#### `getRecipientsUsers(params)`

- ✅ Pagination: `page` (default: 1), `limit` (default: 20)
- ✅ Filter: `search` (username, email, full_name - case-insensitive)
- ✅ Response: `{ success: true, users: [...], pagination: {...} }`

#### `getRecipientsShippers(params)`

- ✅ Pagination: `page` (default: 1), `limit` (default: 20)
- ✅ Filter: `search` (username, email, full_name - case-insensitive)
- ✅ Response: `{ success: true, shippers: [...], pagination: {...} }`

---

### 9. Notification History

#### `getNotificationHistory(params)`

- ✅ Pagination: `page` (default: 1), `limit` (default: 20)
- ✅ Filter: `recipientType`, `recipientId`, `status`, `type`, `category`, `startDate`, `endDate`
- ✅ Sort: `sortBy` (default: sentAt), `sortOrder` (asc, desc - default: desc)
- ✅ Response: `{ success: true, data: [...], pagination: { page, limit, total, totalPages } }`

**Ví dụ sử dụng:**

```javascript
await AdminServices.getNotificationHistory({
  page: 1,
  limit: 20,
  recipientType: "user",
  status: "sent",
  sortBy: "sentAt",
  sortOrder: "desc",
  startDate: "2024-01-01",
  endDate: "2024-12-31",
});
```

---

## 📝 Ghi Chú Quan Trọng

### 1. Pagination

- **page**: Bắt đầu từ `1` (không phải `0`)
- **limit**: Số lượng items mỗi trang
- Tất cả methods đều có default values cho `page` và `limit`

### 2. Filter

- Hầu hết các filter đều **case-insensitive** (không phân biệt hoa thường)
- Date range filter sử dụng format `YYYY-MM-DD`
- Boolean filters: `true` hoặc `false` (không phải string)

### 3. Sort

- **Notification History**: Hỗ trợ `sortBy` và `sortOrder`
- **Reviews**: Hỗ trợ `sort` với các giá trị: `latest`, `highest`, `lowest`
- Các endpoints khác: Mặc định sort theo `createdAt` giảm dần (mới nhất trước)

### 4. Response Format

Có 2 format phổ biến:

**Format 1** (với pagination object):

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

**Format 2** (flat structure):

```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "pages": 5
}
```

---

## 🔧 Best Practices cho Frontend

### Pagination Component:

```javascript
const [pagination, setPagination] = useState({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0,
});

const fetchData = async (page = 1, filters = {}) => {
  const params = {
    page,
    limit: pagination.limit,
    ...filters,
  };

  const response = await AdminServices.getOrders(params);

  // Handle different response formats
  if (response.pagination) {
    setPagination(response.pagination);
    return response.orders || response.data;
  } else {
    setPagination({
      page: response.page || 1,
      limit: response.limit || 20,
      total: response.total || 0,
      pages:
        response.pages ||
        Math.ceil((response.total || 0) / (response.limit || 20)),
    });
    return response.orders || response.data || response;
  }
};
```

### Filter Component:

```javascript
const [filters, setFilters] = useState({
  status: "",
  search: "",
  category: "",
  startDate: "",
  endDate: "",
});

const applyFilters = () => {
  // Remove empty filters
  const activeFilters = Object.entries(filters)
    .filter(
      ([key, value]) => value !== "" && value !== null && value !== undefined
    )
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

  fetchData(1, activeFilters);
};
```

### Sort Component:

```javascript
const [sort, setSort] = useState({
  sortBy: "createdAt",
  sortOrder: "desc",
});

const applySort = (field, order = "desc") => {
  setSort({ sortBy: field, sortOrder: order });
  fetchData(1, { ...filters, sortBy: field, sortOrder: order });
};
```

---

## ✅ Checklist Implementation

- [x] Orders - getOrders()
- [x] Orders - getOrdersByPaymentMethod()
- [x] Orders - getShipperAssignments()
- [x] Orders - getShipperPerformance()
- [x] Orders - getShipperOrders()
- [x] Books - getBooks()
- [x] Categories - getCategories()
- [x] Vouchers - getVouchers()
- [x] Users - getShippers()
- [x] Users - getShippersList()
- [x] Refund - getRefundRequests()
- [x] Reviews - getProductReviews() ⭐ NEW
- [x] Reviews - getUserReviews() ⭐ NEW
- [x] Reviews - getMyReviews() ⭐ NEW
- [x] Notifications - getNotificationTemplates()
- [x] Notifications - getScheduledNotifications()
- [x] Notifications - getAdminScheduledNotifications()
- [x] Notifications - getInstantNotifications()
- [x] Notifications - getRecipientsUsers()
- [x] Notifications - getRecipientsShippers()
- [x] Notification History - getNotificationHistory()

---

**Ngày tạo**: 2024-12-19  
**Trạng thái**: ✅ Hoàn thành
