# 🔧 Frontend API Response Fix Guide

## Vấn Đề

Frontend không hiển thị đúng dữ liệu vì response format từ API không nhất quán.

## Giải Pháp

Cập nhật các file frontend để xử lý đúng các response format khác nhau từ API.

---

## Response Formats Theo Tài Liệu

### 1. Orders API

```json
{
  "orders": [...],
  "total": 1000,
  "page": 1,
  "limit": 20,
  "pages": 50
}
```

### 2. Books API

```json
{
  "books": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "pages": 25
  }
}
```

### 3. Vouchers API

```json
{
  "success": true,
  "vouchers": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

### 4. Dashboard Stats API

```json
{
  "success": true,
  "data": {
    "totalOrders": 1000,
    "totalRevenue": 50000000,
    ...
  }
}
```

---

## Helper Functions

Thêm các helper functions vào các file frontend để normalize response:

```javascript
// Helper để extract data từ response
function extractData(response, dataKey) {
  if (!response) return [];

  // Nếu response là array, trả về luôn
  if (Array.isArray(response)) {
    return response;
  }

  // Nếu có dataKey (orders, books, vouchers, etc.)
  if (dataKey && response[dataKey]) {
    return response[dataKey];
  }

  // Nếu có data field
  if (response.data) {
    return Array.isArray(response.data) ? response.data : [response.data];
  }

  // Nếu response là object nhưng không có dataKey, trả về empty array
  return [];
}

// Helper để extract pagination từ response
function extractPagination(response, defaultPage = 1, defaultLimit = 20) {
  if (!response) {
    return {
      page: defaultPage,
      limit: defaultLimit,
      total: 0,
      pages: 1,
      totalPages: 1,
    };
  }

  // Nếu có pagination object
  if (response.pagination) {
    return {
      page: response.pagination.page || defaultPage,
      limit: response.pagination.limit || defaultLimit,
      total: response.pagination.total || 0,
      pages: response.pagination.pages || response.pagination.totalPages || 1,
      totalPages:
        response.pagination.totalPages || response.pagination.pages || 1,
    };
  }

  // Nếu có pagination fields trực tiếp
  if (response.page || response.total) {
    return {
      page: response.page || defaultPage,
      limit: response.limit || defaultLimit,
      total: response.total || 0,
      pages:
        response.pages ||
        response.totalPages ||
        Math.ceil((response.total || 0) / (response.limit || defaultLimit)),
      totalPages:
        response.totalPages ||
        response.pages ||
        Math.ceil((response.total || 0) / (response.limit || defaultLimit)),
    };
  }

  // Default
  return {
    page: defaultPage,
    limit: defaultLimit,
    total: 0,
    pages: 1,
    totalPages: 1,
  };
}
```

---

## Cập Nhật Các File Frontend

### 1. admin-orders.js

Thay đổi trong `loadOrders()`:

```javascript
async function loadOrders() {
  showLoading();

  try {
    if (!window.AdminServices) {
      throw new Error("AdminServices is not loaded");
    }

    const params = {
      page: currentPage,
      limit: pageSize,
    };

    if (filters.status) params.status = filters.status;
    if (filters.user_id) params.user_id = filters.user_id;
    if (filters.shipper_id) params.shipper_id = filters.shipper_id;

    console.log("📦 Loading orders with params:", params);
    const response = await window.AdminServices.getOrders(params);
    console.log("📦 Orders response received:", response);

    // Extract orders và pagination
    const orders = extractData(response, "orders");
    const paginationData = extractPagination(response, currentPage, pageSize);

    if (orders.length > 0) {
      renderOrders(orders);
      updatePagination(paginationData);
    } else {
      renderOrders([]);
      updatePagination(paginationData);
    }
  } catch (error) {
    console.error("Error loading orders:", error);
    showToast(
      "Không thể tải danh sách đơn hàng: " + (error.message || ""),
      "error"
    );
    renderOrders([]);
    updatePagination({
      page: 1,
      limit: pageSize,
      total: 0,
      pages: 1,
      totalPages: 1,
    });
  } finally {
    hideLoading();
  }
}
```

### 2. admin-products.js

Thay đổi trong `loadProducts()`:

```javascript
async function loadProducts() {
  showLoading();

  try {
    if (!window.AdminServices) {
      throw new Error("AdminServices is not loaded");
    }

    const params = {
      page: currentPage,
      limit: pageSize,
    };

    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.status) {
      params.status = filters.status;
    } else if (filters.stock) {
      params.status = filters.stock;
    }

    console.log("📚 Loading books with params:", params);
    const response = await window.AdminServices.getBooks(params);
    console.log("📚 Books response received:", response);

    // Extract books và pagination
    const books = extractData(response, "books");
    const paginationData = extractPagination(response, currentPage, pageSize);

    if (books.length > 0) {
      renderProducts(books);
      updatePagination(paginationData);
    } else {
      renderProducts([]);
      updatePagination(paginationData);
    }
  } catch (error) {
    console.error("Error loading products:", error);
    showToast(
      "Không thể tải danh sách sản phẩm: " + (error.message || ""),
      "error"
    );
    renderProducts([]);
    updatePagination({
      page: 1,
      limit: pageSize,
      total: 0,
      pages: 1,
      totalPages: 1,
    });
  } finally {
    hideLoading();
  }
}
```

### 3. admin-vouchers.js

Thay đổi trong `loadVouchers()`:

```javascript
async function loadVouchers() {
  showLoading();
  try {
    if (!window.AdminServices) {
      throw new Error("AdminServices is not loaded");
    }

    const params = {
      page: currentPage,
      limit: pageSize,
    };
    if (filters.search) params.search = filters.search;
    if (filters.voucher_type) params.voucher_type = filters.voucher_type;
    if (filters.status) params.status = filters.status;

    console.log("🎫 Loading vouchers with params:", params);
    const response = await window.AdminServices.getVouchers(params);
    console.log("🎫 Vouchers response received:", response);

    // Extract vouchers và pagination
    const vouchers = extractData(response, "vouchers");
    const paginationData = extractPagination(response, currentPage, pageSize);

    if (vouchers.length > 0) {
      renderVouchers(vouchers);
      updatePagination(paginationData);
    } else {
      renderVouchers([]);
      updatePagination(paginationData);
    }
  } catch (error) {
    console.error("Error loading vouchers:", error);
    showToast(
      "Không thể tải danh sách vouchers: " + (error.message || ""),
      "error"
    );
    renderVouchers([]);
    updatePagination({
      page: 1,
      limit: pageSize,
      total: 0,
      pages: 1,
      totalPages: 1,
    });
  } finally {
    hideLoading();
  }
}
```

### 4. admin-dashboard.js

Thay đổi trong `loadDashboardStats()`:

```javascript
async function loadDashboardStats() {
  try {
    if (!window.AdminServices) {
      console.error("AdminServices is not loaded");
      updateStatsCards({
        totalOrders: 0,
        totalRevenue: 0,
        activeUsers: 0,
        pendingOrders: 0,
      });
      return;
    }

    console.log("📊 Loading dashboard stats...");
    const stats = await window.AdminServices.getDashboardStats();
    console.log("📊 Dashboard stats received:", stats);

    // Stats có thể là object trực tiếp hoặc trong data field
    const statsData =
      stats && typeof stats === "object" && !Array.isArray(stats)
        ? stats
        : { totalOrders: 0, totalRevenue: 0, activeUsers: 0, pendingOrders: 0 };

    updateStatsCards(statsData);
  } catch (error) {
    console.error("❌ Error loading stats:", error);
    updateStatsCards({
      totalOrders: 0,
      totalRevenue: 0,
      activeUsers: 0,
      pendingOrders: 0,
    });
  }
}
```

---

## Checklist

- [x] Sửa AdminServices.request() để không extract data sai
- [ ] Thêm helper functions vào các file frontend
- [ ] Cập nhật admin-orders.js
- [ ] Cập nhật admin-products.js
- [ ] Cập nhật admin-vouchers.js
- [ ] Cập nhật admin-dashboard.js
- [ ] Test tất cả các trang

---

**Ngày tạo**: 2024-12-19
