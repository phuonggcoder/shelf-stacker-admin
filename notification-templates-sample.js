// Notification Templates Sample
// Chứa 50+ template mẫu cho User Events và Shipper Events

// User Event Templates (18 templates)
const userEventTemplates = [
  // 1. Order Events (5 templates)
  {
    name: 'Order Created',
    event: 'order_created',
    title: 'Đơn hàng {{orderId}} đã được tạo!',
    message: 'Cảm ơn bạn đã đặt hàng {{orderId}}. Chúng tôi đang xử lý đơn hàng của bạn với tổng trị giá {{amount}}đ.',
    type: 'order',
    active: true
  },
  {
    name: 'Order Confirmed',
    event: 'order_confirmed',
    title: 'Đơn hàng {{orderId}} đã được xác nhận!',
    message: 'Đơn hàng {{orderId}} của bạn đã được xác nhận và sẽ được giao trong {{estimatedDelivery}} ngày.',
    type: 'order',
    active: true
  },
  {
    name: 'Order Shipped',
    event: 'order_shipped',
    title: 'Đơn hàng {{orderId}} đang được giao!',
    message: 'Đơn hàng {{orderId}} đã được {{shipperName}} nhận và đang giao đến bạn. Mã vận đơn: {{trackingCode}}.',
    type: 'order',
    active: true
  },
  {
    name: 'Order Delivered',
    event: 'order_delivered',
    title: 'Đơn hàng {{orderId}} đã được giao thành công!',
    message: 'Đơn hàng {{orderId}} đã được giao thành công. Cảm ơn bạn đã sử dụng {{appName}}!',
    type: 'order',
    active: true
  },
  {
    name: 'Order Cancelled',
    event: 'order_cancelled',
    title: 'Đơn hàng {{orderId}} đã bị hủy',
    message: 'Đơn hàng {{orderId}} đã bị hủy do {{cancelReason}}. Số tiền {{amount}}đ sẽ được hoàn lại.',
    type: 'order',
    active: true
  },

  // 2. Payment Events (3 templates)
  {
    name: 'Payment Success',
    event: 'payment_success',
    title: 'Thanh toán thành công cho đơn hàng {{orderId}}!',
    message: 'Thanh toán {{amount}}đ cho đơn hàng {{orderId}} bằng {{paymentMethod}} đã thành công.',
    type: 'payment',
    active: true
  },
  {
    name: 'Payment Failed',
    event: 'payment_failed',
    title: 'Thanh toán thất bại cho đơn hàng {{orderId}}',
    message: 'Thanh toán {{amount}}đ cho đơn hàng {{orderId}} thất bại do {{failReason}}. Vui lòng thử lại.',
    type: 'payment',
    active: true
  },
  {
    name: 'Payment Refunded',
    event: 'payment_refunded',
    title: 'Hoàn tiền cho đơn hàng {{orderId}}',
    message: 'Đã hoàn tiền {{amount}}đ cho đơn hàng {{orderId}} do {{refundReason}}.',
    type: 'payment',
    active: true
  },

  // 3. Account Events (3 templates)
  {
    name: 'Account Created',
    event: 'account_created',
    title: 'Chào mừng bạn đến với {{appName}}!',
    message: 'Xin chào {{name}}! Tài khoản của bạn đã được tạo thành công. Sử dụng mã {{promoCode}} để được giảm giá 10% cho đơn hàng đầu tiên.',
    type: 'account',
    active: true
  },
  {
    name: 'Password Reset',
    event: 'password_reset',
    title: 'Đặt lại mật khẩu',
    message: 'Mật khẩu của bạn đã được đặt lại thành công. Nếu bạn không thực hiện hành động này, vui lòng liên hệ hỗ trợ.',
    type: 'account',
    active: true
  },
  {
    name: 'Email Verified',
    event: 'email_verified',
    title: 'Email đã được xác thực!',
    message: 'Email {{email}} của bạn đã được xác thực thành công. Bây giờ bạn có thể sử dụng đầy đủ tính năng của {{appName}}.',
    type: 'account',
    active: true
  },

  // 4. Promotion Events (2 templates)
  {
    name: 'Promotion Created',
    event: 'promotion_created',
    title: '{{promotionTitle}} - Giảm giá {{discount}}!',
    message: 'Khuyến mãi đặc biệt! {{promotionTitle}} với mã {{promoCode}} giảm {{discount}}. Có hiệu lực đến {{validUntil}}.',
    type: 'promotion',
    active: true
  },
  {
    name: 'Birthday Promotion',
    event: 'birthday_promotion',
    title: 'Chúc mừng sinh nhật {{name}}!',
    message: 'Chúc mừng sinh nhật {{name}}! Sử dụng mã {{promoCode}} để được giảm {{discount}} cho tất cả sản phẩm trong {{validDays}} ngày tới.',
    type: 'promotion',
    active: true
  },

  // 5. Review Events (2 templates)
  {
    name: 'Review Request',
    event: 'review_request',
    title: 'Đánh giá sản phẩm {{productName}}',
    message: 'Bạn đã mua {{productName}} trong đơn hàng {{orderId}}. Hãy đánh giá để nhận mã giảm giá {{discountCode}} cho lần mua tiếp theo.',
    type: 'review',
    active: true
  },
  {
    name: 'Review Thank You',
    event: 'review_thank_you',
    title: 'Cảm ơn đánh giá của bạn!',
    message: 'Cảm ơn bạn đã đánh giá {{productName}}! Sử dụng mã {{discountCode}} để được giảm giá 5% cho lần mua tiếp theo.',
    type: 'review',
    active: true
  },

  // 6. Wishlist Events (1 template)
  {
    name: 'Wishlist Item On Sale',
    event: 'wishlist_sale',
    title: '{{productName}} trong danh sách yêu thích giảm giá!',
    message: '{{productName}} trong danh sách yêu thích của bạn đã giảm từ {{oldPrice}}đ xuống {{newPrice}}đ (giảm {{discount}}).',
    type: 'wishlist',
    active: true
  },

  // 7. Cart Events (1 template)
  {
    name: 'Cart Abandonment',
    event: 'cart_abandonment',
    title: 'Bạn có {{itemCount}} sản phẩm trong giỏ hàng',
    message: 'Bạn có {{itemCount}} sản phẩm trị giá {{totalAmount}}đ trong giỏ hàng. Sử dụng mã {{discountCode}} để được giảm giá 10%.',
    type: 'cart',
    active: true
  },

  // 8. System Events (2 templates)
  {
    name: 'System Maintenance',
    event: 'system_maintenance',
    title: '{{appName}} sẽ bảo trì',
    message: '{{appName}} sẽ bảo trì từ {{startTime}} đến {{endTime}}. Xin lỗi vì sự bất tiện này.',
    type: 'system',
    active: true
  },
  {
    name: 'Welcome Back',
    event: 'welcome_back',
    title: 'Chào mừng bạn quay lại {{appName}}!',
    message: 'Chào {{name}}! Chúng tôi có {{newProductCount}} sản phẩm mới và {{promotionCount}} khuyến mãi đang chờ bạn.',
    type: 'system',
    active: true
  }
];

// Shipper Event Templates (32 templates)
const shipperEventTemplates = [
  // 1. Order Assignment Events (3 templates)
  {
    name: 'Order Assigned',
    event: 'order_assigned',
    title: 'Đơn hàng mới được giao: {{orderId}}',
    message: 'Bạn được giao đơn hàng {{orderId}} từ {{pickupAddress}} đến {{deliveryAddress}}. Tổng trị giá: {{amount}}đ.',
    type: 'assignment',
    active: true
  },
  {
    name: 'Order Auto Assigned',
    event: 'order_auto_assigned',
    title: 'Đơn hàng tự động giao: {{orderId}}',
    message: 'Đơn hàng {{orderId}} đã được tự động giao cho bạn. Địa chỉ giao: {{deliveryAddress}}. Tổng trị giá: {{amount}}đ.',
    type: 'assignment',
    active: true
  },
  {
    name: 'Order Reassigned',
    event: 'order_reassigned',
    title: 'Đơn hàng được giao lại: {{orderId}}',
    message: 'Đơn hàng {{orderId}} đã được giao lại cho bạn do {{reason}}. Địa chỉ giao: {{deliveryAddress}}.',
    type: 'assignment',
    active: true
  },

  // 2. Pickup Events (3 templates)
  {
    name: 'Pickup Reminder',
    event: 'pickup_reminder',
    title: 'Nhắc nhở nhận hàng: {{orderId}}',
    message: 'Đơn hàng {{orderId}} cần được nhận tại {{pickupAddress}} lúc {{pickupTime}}. Vui lòng đến đúng giờ.',
    type: 'pickup',
    active: true
  },
  {
    name: 'Pickup Confirmed',
    event: 'pickup_confirmed',
    title: 'Đã nhận hàng: {{orderId}}',
    message: 'Đơn hàng {{orderId}} đã được nhận thành công lúc {{pickupTime}}. Đang giao đến {{deliveryAddress}}.',
    type: 'pickup',
    active: true
  },
  {
    name: 'Pickup Failed',
    event: 'pickup_failed',
    title: 'Nhận hàng thất bại: {{orderId}}',
    message: 'Không thể nhận đơn hàng {{orderId}} do {{reason}}. Vui lòng liên hệ hỗ trợ.',
    type: 'pickup',
    active: true
  },

  // 3. Delivery Events (4 templates)
  {
    name: 'Delivery Started',
    event: 'delivery_started',
    title: 'Bắt đầu giao hàng: {{orderId}}',
    message: 'Đang giao đơn hàng {{orderId}} đến {{deliveryAddress}}. Dự kiến giao lúc {{estimatedTime}}.',
    type: 'delivery',
    active: true
  },
  {
    name: 'Delivery In Progress',
    event: 'delivery_in_progress',
    title: 'Đang giao hàng: {{orderId}}',
    message: 'Đang giao đơn hàng {{orderId}} đến {{deliveryAddress}}. Khách hàng: {{customerName}} ({{customerPhone}}).',
    type: 'delivery',
    active: true
  },
  {
    name: 'Delivery Completed',
    event: 'delivery_completed',
    title: 'Giao hàng thành công: {{orderId}}',
    message: 'Đơn hàng {{orderId}} đã được giao thành công đến {{deliveryAddress}} lúc {{deliveryTime}}.',
    type: 'delivery',
    active: true
  },
  {
    name: 'Delivery Failed',
    event: 'delivery_failed',
    title: 'Giao hàng thất bại: {{orderId}}',
    message: 'Không thể giao đơn hàng {{orderId}} do {{reason}}. Vui lòng thử lại sau.',
    type: 'delivery',
    active: true
  },

  // 4. Customer Contact Events (2 templates)
  {
    name: 'Customer Contact',
    event: 'customer_contact',
    title: 'Liên hệ khách hàng: {{orderId}}',
    message: 'Cần liên hệ khách hàng {{customerName}} ({{customerPhone}}) cho đơn hàng {{orderId}} về {{contactReason}}.',
    type: 'contact',
    active: true
  },
  {
    name: 'Customer Not Available',
    event: 'customer_not_available',
    title: 'Khách hàng không có mặt: {{orderId}}',
    message: 'Khách hàng không có mặt khi giao đơn hàng {{orderId}}. Vui lòng thử lại sau.',
    type: 'contact',
    active: true
  },

  // 5. Payment Events (2 templates)
  {
    name: 'Cash Payment Received',
    event: 'cash_payment_received',
    title: 'Đã nhận tiền mặt: {{orderId}}',
    message: 'Đã nhận {{amount}}đ tiền mặt cho đơn hàng {{orderId}}. Giao dịch hoàn tất.',
    type: 'payment',
    active: true
  },
  {
    name: 'Payment Issue',
    event: 'payment_issue',
    title: 'Vấn đề thanh toán: {{orderId}}',
    message: 'Có vấn đề với thanh toán {{amount}}đ cho đơn hàng {{orderId}}: {{issueReason}}. Vui lòng liên hệ hỗ trợ.',
    type: 'payment',
    active: true
  },

  // 6. Rating Events (2 templates)
  {
    name: 'Customer Rating',
    event: 'customer_rating',
    title: 'Đánh giá từ khách hàng: {{orderId}}',
    message: 'Khách hàng đã đánh giá {{stars}} sao cho đơn hàng {{orderId}}: "{{comment}}".',
    type: 'rating',
    active: true
  },
  {
    name: 'Rating Reminder',
    event: 'rating_reminder',
    title: 'Nhắc nhở đánh giá: {{orderId}}',
    message: 'Đơn hàng {{orderId}} đã được giao. Hãy đánh giá khách hàng để cải thiện dịch vụ.',
    type: 'rating',
    active: true
  },

  // 7. Earnings Events (2 templates)
  {
    name: 'Earnings Update',
    event: 'earnings_update',
    title: 'Cập nhật thu nhập tuần',
    message: 'Thu nhập tuần này: {{weeklyEarnings}}đ từ {{completedOrders}} đơn hàng. Thưởng: {{bonus}}đ.',
    type: 'earnings',
    active: true
  },
  {
    name: 'Bonus Earned',
    event: 'bonus_earned',
    title: 'Nhận thưởng: {{bonusAmount}}đ',
    message: 'Chúc mừng! Bạn đã nhận thưởng {{bonusAmount}}đ cho việc hoàn thành {{orderCount}} đơn hàng xuất sắc.',
    type: 'earnings',
    active: true
  },

  // 8. Schedule Events (2 templates)
  {
    name: 'Schedule Reminder',
    event: 'schedule_reminder',
    title: 'Nhắc nhở lịch làm việc',
    message: 'Lịch làm việc ngày {{date}}: {{startTime}} - {{endTime}}. Vui lòng đến đúng giờ.',
    type: 'schedule',
    active: true
  },
  {
    name: 'Schedule Change',
    event: 'schedule_change',
    title: 'Thay đổi lịch làm việc',
    message: 'Lịch làm việc ngày {{date}} đã thay đổi: {{newStartTime}} - {{newEndTime}}. Vui lòng cập nhật.',
    type: 'schedule',
    active: true
  },

  // 9. System Events (3 templates)
  {
    name: 'App Update',
    event: 'app_update',
    title: 'Cập nhật ứng dụng',
    message: 'Phiên bản mới của ứng dụng đã có sẵn. Vui lòng cập nhật để có trải nghiệm tốt nhất.',
    type: 'system',
    active: true
  },
  {
    name: 'Maintenance Notice',
    event: 'maintenance_notice',
    title: 'Thông báo bảo trì hệ thống',
    message: 'Hệ thống sẽ bảo trì từ {{startTime}} đến {{endTime}}. Xin lỗi vì sự bất tiện này.',
    type: 'system',
    active: true
  },
  {
    name: 'Weather Alert',
    event: 'weather_alert',
    title: 'Cảnh báo thời tiết: {{area}}',
    message: 'Cảnh báo thời tiết xấu tại khu vực {{area}}. Vui lòng cẩn thận khi giao hàng.',
    type: 'system',
    active: true
  },

  // 10. Performance Events (2 templates)
  {
    name: 'Performance Review',
    event: 'performance_review',
    title: 'Đánh giá hiệu suất tuần',
    message: 'Tuần này: {{completedOrders}} đơn hàng, đánh giá trung bình {{averageRating}} sao, giao hàng đúng giờ {{onTimeDelivery}}%.',
    type: 'performance',
    active: true
  },
  {
    name: 'Performance Warning',
    event: 'performance_warning',
    title: 'Cảnh báo hiệu suất',
    message: 'Hiệu suất tuần này thấp: {{completedOrders}} đơn hàng, đánh giá {{averageRating}} sao. Vui lòng cải thiện.',
    type: 'performance',
    active: true
  },

  // 11. Additional Shipper Events (8 templates)
  {
    name: 'Order Priority',
    event: 'order_priority',
    title: 'Đơn hàng ưu tiên: {{orderId}}',
    message: 'Đơn hàng {{orderId}} được đánh dấu ưu tiên. Vui lòng giao hàng càng sớm càng tốt.',
    type: 'priority',
    active: true
  },
  {
    name: 'Route Optimization',
    event: 'route_optimization',
    title: 'Tối ưu lộ trình giao hàng',
    message: 'Lộ trình giao hàng đã được tối ưu. Bạn có thể tiết kiệm thời gian và nhiên liệu.',
    type: 'route',
    active: true
  },
  {
    name: 'Fuel Reminder',
    event: 'fuel_reminder',
    title: 'Nhắc nhở nhiên liệu',
    message: 'Nhiên liệu xe của bạn sắp hết. Vui lòng đổ xăng để đảm bảo giao hàng đúng giờ.',
    type: 'vehicle',
    active: true
  },
  {
    name: 'Vehicle Maintenance',
    event: 'vehicle_maintenance',
    title: 'Nhắc nhở bảo dưỡng xe',
    message: 'Xe của bạn cần bảo dưỡng định kỳ. Vui lòng sắp xếp lịch bảo dưỡng sớm.',
    type: 'vehicle',
    active: true
  },
  {
    name: 'Insurance Reminder',
    event: 'insurance_reminder',
    title: 'Nhắc nhở bảo hiểm',
    message: 'Bảo hiểm xe của bạn sắp hết hạn. Vui lòng gia hạn để đảm bảo an toàn.',
    type: 'insurance',
    active: true
  },
  {
    name: 'Training Available',
    event: 'training_available',
    title: 'Khóa đào tạo mới có sẵn',
    message: 'Có khóa đào tạo mới về kỹ năng giao hàng. Tham gia để nâng cao hiệu suất.',
    type: 'training',
    active: true
  },
  {
    name: 'Support Available',
    event: 'support_available',
    title: 'Hỗ trợ 24/7',
    message: 'Đội ngũ hỗ trợ luôn sẵn sàng giúp đỡ bạn. Liên hệ khi cần thiết.',
    type: 'support',
    active: true
  },
  {
    name: 'Community Event',
    event: 'community_event',
    title: 'Sự kiện cộng đồng shipper',
    message: 'Có sự kiện gặp gỡ cộng đồng shipper vào cuối tuần. Tham gia để kết nối và chia sẻ kinh nghiệm.',
    type: 'community',
    active: true
  }
];

// Helper functions
function getTemplateByEvent(event) {
  const allTemplates = [...userEventTemplates, ...shipperEventTemplates];
  return allTemplates.find(template => template.event === event);
}

function getTemplateVariables(event) {
  const template = getTemplateByEvent(event);
  if (!template) return [];
  
  const variables = new Set();
  const text = template.title + ' ' + template.message;
  
  // Extract ${variable} and {{variable}}
  const matches = text.match(/\$\{(\w+)\}|\{\{(\w+)\}\}/g);
  if (matches) {
    matches.forEach(match => {
      const variable = match.replace(/\$\{(\w+)\}/, '$1').replace(/\{\{(\w+)\}\}/, '$1');
      variables.add(variable);
    });
  }
  
  return Array.from(variables);
}

function getAllTemplates() {
  return [...userEventTemplates, ...shipperEventTemplates];
}

function getUserTemplates() {
  return userEventTemplates;
}

function getShipperTemplates() {
  return shipperEventTemplates;
}

function createAllTemplates() {
  return getAllTemplates();
}

module.exports = {
  userEventTemplates,
  shipperEventTemplates,
  getTemplateByEvent,
  getTemplateVariables,
  getAllTemplates,
  getUserTemplates,
  getShipperTemplates,
  createAllTemplates
};



