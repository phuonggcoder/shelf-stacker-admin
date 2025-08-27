# 📋 Notification Templates Guide

## 🎯 **Tổng quan về Template Mẫu**

File `notification-templates-sample.js` chứa **50+ template mẫu** được thiết kế sẵn cho hệ thống notification, bao gồm:

- **👤 18 User Event Templates** - Cho khách hàng
- **🚚 32 Shipper Event Templates** - Cho shipper

---

## 👤 **USER EVENT TEMPLATES (18 templates)**

### **1. 📦 Order Events (5 templates)**
| Event | Template Name | Variables |
|-------|---------------|-----------|
| `order_created` | Order Created | `orderId`, `amount` |
| `order_confirmed` | Order Confirmed | `orderId`, `estimatedDelivery` |
| `order_shipped` | Order Shipped | `orderId`, `shipperName`, `trackingCode` |
| `order_delivered` | Order Delivered | `orderId`, `appName` |
| `order_cancelled` | Order Cancelled | `orderId`, `cancelReason`, `amount` |

### **2. 💳 Payment Events (3 templates)**
| Event | Template Name | Variables |
|-------|---------------|-----------|
| `payment_success` | Payment Success | `orderId`, `amount`, `paymentMethod` |
| `payment_failed` | Payment Failed | `orderId`, `amount`, `failReason` |
| `payment_refunded` | Payment Refunded | `orderId`, `amount`, `refundReason` |

### **3. 👤 Account Events (3 templates)**
| Event | Template Name | Variables |
|-------|---------------|-----------|
| `account_created` | Account Created | `name`, `appName`, `promoCode` |
| `password_reset` | Password Reset | - |
| `email_verified` | Email Verified | `email` |

### **4. 🎯 Promotion Events (2 templates)**
| Event | Template Name | Variables |
|-------|---------------|-----------|
| `promotion_created` | Promotion Created | `promotionTitle`, `discount`, `promoCode`, `validUntil` |
| `birthday_promotion` | Birthday Promotion | `name`, `discount`, `promoCode`, `validDays` |

### **5. ⭐ Review Events (2 templates)**
| Event | Template Name | Variables |
|-------|---------------|-----------|
| `review_request` | Review Request | `productName`, `orderId`, `discountCode` |
| `review_thank_you` | Review Thank You | `productName`, `discountCode` |

### **6. ❤️ Wishlist Events (1 template)**
| Event | Template Name | Variables |
|-------|---------------|-----------|
| `wishlist_sale` | Wishlist Item On Sale | `productName`, `discount`, `oldPrice`, `newPrice` |

### **7. 🛒 Cart Events (1 template)**
| Event | Template Name | Variables |
|-------|---------------|-----------|
| `cart_abandonment` | Cart Abandonment | `itemCount`, `totalAmount`, `discountCode` |

### **8. 🔧 System Events (2 templates)**
| Event | Template Name | Variables |
|-------|---------------|-----------|
| `system_maintenance` | System Maintenance | `appName`, `startTime`, `endTime` |
| `welcome_back` | Welcome Back | `name`, `appName`, `newProductCount`, `promotionCount` |

---

## 🚚 **SHIPPER EVENT TEMPLATES (32 templates)**

### **1. 📋 Order Assignment Events (3 templates)**
| Event | Template Name | Variables |
|-------|---------------|-----------|
| `order_assigned` | Order Assigned | `orderId`, `pickupAddress`, `deliveryAddress`, `amount` |
| `order_auto_assigned` | Order Auto Assigned | `orderId`, `deliveryAddress`, `amount` |
| `order_reassigned` | Order Reassigned | `orderId`, `reason`, `deliveryAddress` |

### **2. 📦 Pickup Events (3 templates)**
| Event | Template Name | Variables |
|-------|---------------|-----------|
| `pickup_reminder` | Pickup Reminder | `orderId`, `pickupAddress`, `pickupTime` |
| `pickup_confirmed` | Pickup Confirmed | `orderId`, `pickupTime`, `deliveryAddress` |
| `pickup_failed` | Pickup Failed | `orderId`, `reason` |

### **3. 🚚 Delivery Events (4 templates)**
| Event | Template Name | Variables |
|-------|---------------|-----------|
| `delivery_started` | Delivery Started | `orderId`, `deliveryAddress`, `estimatedTime` |
| `delivery_in_progress` | Delivery In Progress | `orderId`, `deliveryAddress`, `customerName`, `customerPhone` |
| `delivery_completed` | Delivery Completed | `orderId`, `deliveryAddress`, `deliveryTime` |
| `delivery_failed` | Delivery Failed | `orderId`, `reason` |

### **4. 📞 Customer Contact Events (2 templates)**
| Event | Template Name | Variables |
|-------|---------------|-----------|
| `customer_contact` | Customer Contact | `orderId`, `customerName`, `customerPhone`, `contactReason` |
| `customer_not_available` | Customer Not Available | `orderId` |

### **5. 💰 Payment Events (2 templates)**
| Event | Template Name | Variables |
|-------|---------------|-----------|
| `cash_payment_received` | Cash Payment Received | `orderId`, `amount` |
| `payment_issue` | Payment Issue | `orderId`, `amount`, `issueReason` |

### **6. ⭐ Rating Events (2 templates)**
| Event | Template Name | Variables |
|-------|---------------|-----------|
| `customer_rating` | Customer Rating | `orderId`, `stars`, `comment` |
| `rating_reminder` | Rating Reminder | `orderId` |

### **7. 💵 Earnings Events (2 templates)**
| Event | Template Name | Variables |
|-------|---------------|-----------|
| `earnings_update` | Earnings Update | `weeklyEarnings`, `completedOrders`, `bonus` |
| `bonus_earned` | Bonus Earned | `bonusAmount`, `orderCount` |

### **8. 📅 Schedule Events (2 templates)**
| Event | Template Name | Variables |
|-------|---------------|-----------|
| `schedule_reminder` | Schedule Reminder | `startTime`, `endTime`, `date` |
| `schedule_change` | Schedule Change | `newStartTime`, `newEndTime`, `date` |

### **9. 🔧 System Events (3 templates)**
| Event | Template Name | Variables |
|-------|---------------|-----------|
| `app_update` | App Update | - |
| `maintenance_notice` | Maintenance Notice | `startTime`, `endTime` |
| `weather_alert` | Weather Alert | `area` |

### **10. 📊 Performance Events (2 templates)**
| Event | Template Name | Variables |
|-------|---------------|-----------|
| `performance_review` | Performance Review | `completedOrders`, `averageRating`, `onTimeDelivery` |
| `performance_warning` | Performance Warning | `completedOrders`, `averageRating` |

---

## 🔧 **Template Variables System**

### **Hỗ trợ 2 cú pháp:**
```javascript
// Cú pháp 1: {{variable}}
"Đơn hàng {{orderId}} thành công!"

// Cú pháp 2: ${variable}
"Đơn hàng ${orderId} thành công!"
```

### **Các biến phổ biến:**

#### **📦 Order Variables:**
- `{{orderId}}` - Mã đơn hàng
- `{{amount}}` - Tổng trị giá đơn hàng
- `{{estimatedDelivery}}` - Thời gian giao hàng dự kiến
- `{{pickupAddress}}` - Địa chỉ nhận hàng
- `{{deliveryAddress}}` - Địa chỉ giao hàng
- `{{trackingCode}}` - Mã vận đơn
- `{{cancelReason}}` - Lý do hủy đơn hàng

#### **💳 Payment Variables:**
- `{{paymentMethod}}` - Phương thức thanh toán
- `{{failReason}}` - Lý do thanh toán thất bại
- `{{refundReason}}` - Lý do hoàn tiền

#### **👤 User Variables:**
- `{{name}}` - Tên người dùng
- `{{email}}` - Email người dùng
- `{{appName}}` - Tên ứng dụng
- `{{promoCode}}` - Mã khuyến mãi

#### **🚚 Shipper Variables:**
- `{{shipperName}}` - Tên shipper
- `{{customerName}}` - Tên khách hàng
- `{{customerPhone}}` - Số điện thoại khách hàng
- `{{pickupTime}}` - Thời gian nhận hàng
- `{{deliveryTime}}` - Thời gian giao hàng

---

## 🚀 **Cách sử dụng**

### **1. Tạo tất cả template mẫu:**
```bash
# Cập nhật token admin trong file
node create-notification-templates.js
```

### **2. Sử dụng trong code:**
```javascript
const { getTemplateByEvent, getTemplateVariables } = require('./notification-templates-sample');

// Lấy template theo event
const template = getTemplateByEvent('order_created');

// Lấy danh sách variables cho event
const variables = getTemplateVariables('order_created');
```

### **3. Gửi notification với template:**
```javascript
// Gửi notification theo template
await axios.post('/api/noti/send-event', {
  event: 'order_created',
  userId: 'user123',
  data: {
    orderId: 'ORD123456',
    amount: '500,000'
  }
});
```

---

## 📝 **Ví dụ sử dụng thực tế**

### **User Event - Order Created:**
```javascript
// Template
{
  name: 'Order Created',
  event: 'order_created',
  title: 'Đơn hàng {{orderId}} đã được tạo!',
  message: 'Cảm ơn bạn đã đặt hàng {{orderId}}. Chúng tôi đang xử lý đơn hàng của bạn với tổng trị giá {{amount}}đ.'
}

// Data
{
  orderId: 'ORD123456',
  amount: '750,000'
}

// Kết quả
// Title: "Đơn hàng ORD123456 đã được tạo!"
// Message: "Cảm ơn bạn đã đặt hàng ORD123456. Chúng tôi đang xử lý đơn hàng của bạn với tổng trị giá 750,000đ."
```

### **Shipper Event - Order Assigned:**
```javascript
// Template
{
  name: 'Order Assigned',
  event: 'order_assigned',
  title: 'Đơn hàng mới được giao: {{orderId}}',
  message: 'Bạn được giao đơn hàng {{orderId}} từ {{pickupAddress}} đến {{deliveryAddress}}. Tổng trị giá: {{amount}}đ.'
}

// Data
{
  orderId: 'ORD123456',
  pickupAddress: '123 Đường ABC, Quận 1, TP.HCM',
  deliveryAddress: '456 Đường XYZ, Quận 2, TP.HCM',
  amount: '750,000'
}

// Kết quả
// Title: "Đơn hàng mới được giao: ORD123456"
// Message: "Bạn được giao đơn hàng ORD123456 từ 123 Đường ABC, Quận 1, TP.HCM đến 456 Đường XYZ, Quận 2, TP.HCM. Tổng trị giá: 750,000đ."
```

---

## 🎯 **Lợi ích của Template System**

### **✅ Cho Developer:**
- **Tiết kiệm thời gian** - Không cần viết lại template
- **Tính nhất quán** - Đảm bảo format thống nhất
- **Dễ bảo trì** - Chỉ cần sửa một chỗ
- **Tái sử dụng** - Dùng lại cho nhiều event

### **✅ Cho Admin:**
- **Dễ quản lý** - Tất cả template ở một nơi
- **Preview trước** - Xem trước kết quả
- **Test dễ dàng** - Thử nghiệm với data thực
- **Tùy chỉnh linh hoạt** - Sửa đổi theo nhu cầu

### **✅ Cho User:**
- **Trải nghiệm tốt** - Notification đẹp và rõ ràng
- **Thông tin đầy đủ** - Tất cả thông tin cần thiết
- **Tính cá nhân hóa** - Sử dụng tên và thông tin riêng

---

## 🔄 **Workflow sử dụng**

1. **Setup:** Chạy script tạo template mẫu
2. **Customize:** Chỉnh sửa template theo brand
3. **Test:** Preview và test với data thực
4. **Deploy:** Sử dụng trong production
5. **Monitor:** Theo dõi hiệu quả và cập nhật

---

## 📊 **Thống kê Template**

- **Tổng cộng:** 50 templates
- **User Events:** 18 templates
- **Shipper Events:** 32 templates
- **Variables:** 40+ biến khác nhau
- **Events:** 50+ loại event

**🎉 Hệ thống template đã sẵn sàng sử dụng cho toàn bộ ứng dụng!**

