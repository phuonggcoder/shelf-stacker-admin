// Notification Admin Panel - Main JavaScript File

// Global variables
let templates = [];
let scheduledNotifications = [];
let notificationHistory = [];
let currentPage = 1;
let totalPages = 1;
let currentFilter = 'all';
let charts = {};

// Sample Templates Data (50+ templates)
const SAMPLE_TEMPLATES = {
  // User Event Templates (18 templates)
  userEventTemplates: [
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
  ],

  // Shipper Event Templates (32 templates)
  shipperEventTemplates: [
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
  ]
};

// API Configuration
const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';
// For local development, use: 'http://localhost:3000'

// API Endpoints
const API_ENDPOINTS = {
    // Template Management
    TEMPLATES: '/api/notification-templates',
    TEMPLATE_BY_ID: (id) => `/api/notification-templates/${id}`,
    
    // Send Notifications
    SEND: '/api/noti/send',
    SEND_ALL: '/api/noti/send-all',
    SEND_MULTICAST: '/api/noti/send-multicast',
    SEND_EVENT: '/api/noti/send-event',
    
    // Scheduled Notifications
    SCHEDULE: '/api/noti/schedule',
    SCHEDULED: '/api/noti/scheduled',
    CANCEL_SCHEDULED: (id) => `/api/noti/scheduled/${id}`,
    
    // Specialized Notifications
    ORDER_NOTIFICATION: '/api/noti/order',
    PAYMENT_NOTIFICATION: '/api/noti/payment',
    MARKETING_NOTIFICATION: '/api/noti/marketing',
    PROMOTION_NOTIFICATION: '/api/noti/promotion',
    
    // Analytics & Stats
    STATS: '/api/noti/stats',
    UPLOAD_IMAGE: '/api/noti/upload-image',
    
    // History
    HISTORY: '/api/notification/history'
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
async function initializeApp() {
    try {
        showLoading(true);
        
        // Setup navigation
        setupNavigation();
        
        // Setup event listeners
        setupEventListeners();
        
        // Load initial data
        await Promise.all([
            loadDashboardData(),
            loadTemplates(),
            loadScheduledNotifications(),
            loadNotificationHistory()
        ]);
        
        // Initialize charts
        initializeCharts();
        
        showLoading(false);
        
        // Show success message
        showMessage('Notification Admin Panel loaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showMessage('Error loading application data', 'error');
        showLoading(false);
    }
}

// Setup navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Show corresponding section
            const targetSection = this.getAttribute('data-section');
            showSection(targetSection);
        });
    });
}

// Show section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Load section-specific data
        switch(sectionId) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'templates':
                loadTemplates();
                break;
            case 'scheduled':
                loadScheduledNotifications();
                break;
            case 'history':
                loadNotificationHistory();
                break;
            case 'analytics':
                loadAnalytics();
                break;
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Template form
    const templateForm = document.getElementById('template-form-modal');
    if (templateForm) {
        templateForm.addEventListener('submit', handleTemplateSubmit);
    }
    
    // Notification type selector
    const typeCards = document.querySelectorAll('.type-card');
    typeCards.forEach(card => {
        card.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            selectNotificationType(type);
        });
    });
    
    // Recipient type radio buttons
    setupRecipientTypeListeners();
    
    // Form submissions
    setupFormSubmissions();
    
    // Search and filter listeners
    setupSearchAndFilters();
    
    // Image upload listeners
    setupImageUploadListeners();
    
    // Modal close events
    setupModalListeners();
}

// Setup recipient type listeners
function setupRecipientTypeListeners() {
    const recipientTypes = ['recipient-type', 'template-recipient-type', 'scheduled-recipient-type'];
    
    recipientTypes.forEach(type => {
        const radios = document.querySelectorAll(`input[name="${type}"]`);
        radios.forEach(radio => {
            radio.addEventListener('change', function() {
                const value = this.value;
                const formId = this.closest('form').id;
                toggleUserSelector(value, formId);
            });
        });
    });
}

// Toggle user selector based on recipient type
function toggleUserSelector(recipientType, formId) {
    const userSelectors = {
        'urgent-form': {
            specific: 'user-selector',
            multiple: 'multiple-users'
        },
        'template-form': {
            specific: 'template-user-selector',
            multiple: 'template-multiple-users'
        },
        'scheduled-form': {
            specific: 'scheduled-user-selector',
            multiple: 'scheduled-multiple-users'
        }
    };
    
    const selectors = userSelectors[formId];
    if (!selectors) return;
    
    // Hide all selectors
    Object.values(selectors).forEach(selectorId => {
        const element = document.getElementById(selectorId);
        if (element) element.classList.add('hidden');
    });
    
    // Show appropriate selector
    const targetSelectorId = selectors[recipientType];
    if (targetSelectorId) {
        const element = document.getElementById(targetSelectorId);
        if (element) element.classList.remove('hidden');
    }
}

// Setup form submissions
function setupFormSubmissions() {
    // Urgent notification form
    const urgentForm = document.getElementById('urgent-form');
    if (urgentForm) {
        urgentForm.addEventListener('submit', handleUrgentNotificationSubmit);
    }
    
    // Template notification form
    const templateForm = document.getElementById('template-form');
    if (templateForm) {
        templateForm.addEventListener('submit', handleTemplateNotificationSubmit);
    }
    
    // Scheduled notification form
    const scheduledForm = document.getElementById('scheduled-form');
    if (scheduledForm) {
        scheduledForm.addEventListener('submit', handleScheduledNotificationSubmit);
    }
}

// Setup search and filters
function setupSearchAndFilters() {
    // Template search
    const templateSearch = document.getElementById('template-search');
    if (templateSearch) {
        templateSearch.addEventListener('input', debounce(filterTemplates, 300));
    }
    
    // Template filter buttons
    const templateFilterBtns = document.querySelectorAll('[data-filter]');
    templateFilterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            applyTemplateFilter(filter);
        });
    });
    
    // Scheduled search
    const scheduledSearch = document.getElementById('scheduled-search');
    if (scheduledSearch) {
        scheduledSearch.addEventListener('input', debounce(filterScheduled, 300));
    }
    
    // History search
    const historySearch = document.getElementById('history-search');
    if (historySearch) {
        historySearch.addEventListener('input', debounce(filterHistory, 300));
    }
}

// Setup image upload listeners
function setupImageUploadListeners() {
    const imageInputs = ['urgent-image', 'template-image', 'scheduled-image'];
    
    imageInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('change', function() {
                handleImageChange(this, inputId.replace('-image', '-image-preview'));
            });
        }
    });
}

// Setup modal listeners
function setupModalListeners() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this);
            }
        });
    });
}

// Select notification type
function selectNotificationType(type) {
    // Remove active class from all type cards
    document.querySelectorAll('.type-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Add active class to selected card
    const selectedCard = document.querySelector(`[data-type="${type}"]`);
    if (selectedCard) {
        selectedCard.classList.add('active');
    }
    
    // Hide all forms
    document.querySelectorAll('.notification-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Show selected form
    const targetForm = document.getElementById(`${type}-form`);
    if (targetForm) {
        targetForm.classList.add('active');
    }
    
    // Load template selector if template type
    if (type === 'template') {
        loadTemplateSelector();
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.STATS}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            const stats = await response.json();
            updateDashboardStats(stats);
        } else {
            throw new Error('Failed to load dashboard stats');
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Use sample data for demo
        updateDashboardStats(getSampleStats());
    }
}

// Update dashboard statistics
function updateDashboardStats(stats) {
    document.getElementById('urgent-count').textContent = stats.urgentSentToday || 0;
    document.getElementById('scheduled-count').textContent = stats.scheduledActive || 0;
    document.getElementById('template-count').textContent = stats.activeTemplates || 0;
    document.getElementById('success-rate').textContent = `${stats.successRate || 0}%`;
}

// Load templates
async function loadTemplates() {
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TEMPLATES}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            templates = data.templates || data;
        } else {
            throw new Error('Failed to load templates');
        }
    } catch (error) {
        console.error('Error loading templates:', error);
        templates = getSampleTemplates();
    }
    
    renderTemplates();
}

// Render templates
function renderTemplates() {
    const grid = document.getElementById('templates-grid');
    if (!grid) return;
    
    // Update template statistics
    updateTemplateStats();
    
    if (templates.length === 0) {
        grid.innerHTML = `
            <div class="no-data">
                <i class="fas fa-inbox"></i>
                <p>No templates found</p>
                <div class="no-data-actions">
                    <button class="btn-primary" onclick="createSampleTemplates()">
                        <i class="fas fa-plus"></i> Create Sample Templates
                    </button>
                    <button class="btn-secondary" onclick="openTemplateModal()">
                        <i class="fas fa-plus"></i> Create Custom Template
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = templates.map(template => `
        <div class="template-card">
            <div class="template-header">
                <div class="template-name">${template.name}</div>
                <div class="template-event">${template.event}</div>
            </div>
            <div class="template-content">
                <div class="template-title">${template.title}</div>
                <div class="template-message">${template.message}</div>
                ${template.image ? `<img src="${template.image}" alt="Template Image" class="template-image">` : ''}
                <div class="template-actions">
                    <button class="btn-secondary" onclick="editTemplate('${template._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-secondary" onclick="testTemplate('${template._id}')">
                        <i class="fas fa-flask"></i> Test
                    </button>
                    <button class="btn-danger" onclick="deleteTemplate('${template._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Update template statistics
function updateTemplateStats() {
    const userTemplateCount = document.getElementById('user-template-count');
    const shipperTemplateCount = document.getElementById('shipper-template-count');
    const totalTemplateCount = document.getElementById('total-template-count');
    
    if (userTemplateCount) {
        const userTemplates = templates.filter(t => 
            SAMPLE_TEMPLATES.userEventTemplates.some(sample => sample.event === t.event)
        );
        userTemplateCount.textContent = userTemplates.length;
    }
    
    if (shipperTemplateCount) {
        const shipperTemplates = templates.filter(t => 
            SAMPLE_TEMPLATES.shipperEventTemplates.some(sample => sample.event === t.event)
        );
        shipperTemplateCount.textContent = shipperTemplates.length;
    }
    
    if (totalTemplateCount) {
        totalTemplateCount.textContent = templates.length;
    }
}

// Filter templates
function filterTemplates() {
    const searchTerm = document.getElementById('template-search').value.toLowerCase();
    const filteredTemplates = templates.filter(template => 
        template.name.toLowerCase().includes(searchTerm) ||
        template.event.toLowerCase().includes(searchTerm) ||
        template.title.toLowerCase().includes(searchTerm)
    );
    
    renderFilteredTemplates(filteredTemplates);
}

// Apply template filter
function applyTemplateFilter(filter) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    let filteredTemplates = templates;
    
    if (filter !== 'all') {
        filteredTemplates = templates.filter(template => 
            template.event.includes(filter)
        );
    }
    
    renderFilteredTemplates(filteredTemplates);
}

// Render filtered templates
function renderFilteredTemplates(filteredTemplates) {
    const grid = document.getElementById('templates-grid');
    if (!grid) return;
    
    if (filteredTemplates.length === 0) {
        grid.innerHTML = `
            <div class="no-data">
                <i class="fas fa-search"></i>
                <p>No templates match your search</p>
            </div>
        `;
        return;
    }
    
    // Reuse the same rendering logic
    const originalTemplates = templates;
    templates = filteredTemplates;
    renderTemplates();
    templates = originalTemplates;
}

// Load scheduled notifications
async function loadScheduledNotifications() {
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SCHEDULED}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            scheduledNotifications = data.scheduledNotifications || data;
        } else {
            throw new Error('Failed to load scheduled notifications');
        }
    } catch (error) {
        console.error('Error loading scheduled notifications:', error);
        scheduledNotifications = getSampleScheduledNotifications();
    }
    
    renderScheduledNotifications();
}

// Render scheduled notifications
function renderScheduledNotifications() {
    const list = document.getElementById('scheduled-list');
    if (!list) return;
    
    if (scheduledNotifications.length === 0) {
        list.innerHTML = `
            <div class="no-data">
                <i class="fas fa-clock"></i>
                <p>No scheduled notifications</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = scheduledNotifications.map(scheduled => `
        <div class="scheduled-item">
            <div class="scheduled-info">
                <h4>${scheduled.title}</h4>
                <p><strong>Scheduled for:</strong> ${new Date(scheduled.scheduledAt).toLocaleString()}</p>
                <p><strong>Type:</strong> ${scheduled.type}</p>
                <p><strong>Status:</strong> ${scheduled.status}</p>
                <p><strong>Recipients:</strong> ${scheduled.userId || scheduled.userIds ? 'Specific Users' : 'All Users'}</p>
            </div>
            <div class="scheduled-actions">
                <button class="btn-secondary" onclick="editScheduled('${scheduled._id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-danger" onclick="cancelScheduled('${scheduled._id}')">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </div>
        </div>
    `).join('');
}

// Load notification history
async function loadNotificationHistory(page = 1, filters = {}) {
    try {
        const queryParams = new URLSearchParams({
            page: page,
            limit: 20,
            ...filters
        });
        
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.HISTORY}?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            notificationHistory = data.notifications || [];
            currentPage = page;
            totalPages = Math.ceil(data.total / data.limit);
            
            updateHistoryStats(data);
            renderNotificationHistory();
            renderPagination();
        } else {
            throw new Error('Failed to load notification history');
        }
    } catch (error) {
        console.error('Error loading notification history:', error);
        notificationHistory = getSampleNotificationHistory();
        renderNotificationHistory();
    }
}

// Update history statistics
function updateHistoryStats(data) {
    document.getElementById('total-sent').textContent = data.total || 0;
    document.getElementById('history-success-rate').textContent = `${data.successRate || 0}%`;
    document.getElementById('total-failed').textContent = data.failed || 0;
}

// Render notification history
function renderNotificationHistory() {
    const list = document.getElementById('history-list');
    if (!list) return;
    
    if (notificationHistory.length === 0) {
        list.innerHTML = `
            <div class="no-data">
                <i class="fas fa-history"></i>
                <p>No notification history found</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = notificationHistory.map(notification => `
        <div class="history-item ${notification.status}">
            <div class="history-header">
                <div>
                    <div class="history-title">${notification.title}</div>
                    <div class="history-message">${notification.message}</div>
                    <div class="history-meta">
                        <span><i class="fas fa-user"></i> ${notification.userId || 'All Users'}</span>
                        <span><i class="fas fa-tag"></i> ${notification.type}</span>
                        <span><i class="fas fa-clock"></i> ${new Date(notification.sendAt).toLocaleString()}</span>
                        <span><i class="fas fa-circle"></i> ${notification.status}</span>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="btn-secondary" onclick="viewNotificationDetails('${notification._id}')">
                        <i class="fas fa-eye"></i> Details
                    </button>
                    <button class="btn-secondary" onclick="resendNotification('${notification._id}')">
                        <i class="fas fa-redo"></i> Resend
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Render pagination
function renderPagination() {
    const pagination = document.getElementById('history-pagination');
    if (!pagination) return;
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i> Previous
        </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
                <button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += '<span>...</span>';
        }
    }
    
    // Next button
    paginationHTML += `
        <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            Next <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    pagination.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    if (page >= 1 && page <= totalPages) {
        loadNotificationHistory(page);
    }
}

// Handle urgent notification submit
async function handleUrgentNotificationSubmit(e) {
    e.preventDefault();
    
    try {
        showLoading(true);
        
        const formData = new FormData();
        formData.append('title', document.getElementById('urgent-title').value);
        formData.append('message', document.getElementById('urgent-message').value);
        formData.append('type', 'urgent');
        
        const recipientType = document.querySelector('input[name="recipient-type"]:checked').value;
        
        if (recipientType === 'specific') {
            formData.append('userId', document.getElementById('user-id').value);
        } else if (recipientType === 'multiple') {
            formData.append('userIds', document.getElementById('user-ids').value);
        } else {
            formData.append('all', 'true');
        }
        
        const imageFile = document.getElementById('urgent-image').files[0];
        if (imageFile) {
            formData.append('imageFile', imageFile);
        }
        
        const response = await fetch('/api/noti/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            showMessage('Urgent notification sent successfully!', 'success');
            e.target.reset();
            document.getElementById('urgent-image-preview').innerHTML = '';
        } else {
            throw new Error('Failed to send urgent notification');
        }
    } catch (error) {
        console.error('Error sending urgent notification:', error);
        showMessage('Error sending urgent notification', 'error');
    } finally {
        showLoading(false);
    }
}

// Handle template notification submit
async function handleTemplateNotificationSubmit(e) {
    e.preventDefault();
    
    try {
        showLoading(true);
        
        const selectedTemplate = document.querySelector('.template-option.selected');
        if (!selectedTemplate) {
            showMessage('Please select a template', 'warning');
            return;
        }
        
        const templateId = selectedTemplate.getAttribute('data-id');
        const formData = new FormData();
        formData.append('event', selectedTemplate.getAttribute('data-event'));
        
        const recipientType = document.querySelector('input[name="template-recipient-type"]:checked').value;
        
        if (recipientType === 'specific') {
            formData.append('userId', document.getElementById('template-user-id').value);
        } else if (recipientType === 'multiple') {
            formData.append('userIds', document.getElementById('template-user-ids').value);
        } else {
            formData.append('all', 'true');
        }
        
        // Add template variables
        const variableInputs = document.querySelectorAll('#template-variables input');
        const variables = {};
        variableInputs.forEach(input => {
            variables[input.name] = input.value;
        });
        formData.append('data', JSON.stringify(variables));
        
        const response = await fetch('/api/noti/send-event', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            showMessage('Template notification sent successfully!', 'success');
            e.target.reset();
        } else {
            throw new Error('Failed to send template notification');
        }
    } catch (error) {
        console.error('Error sending template notification:', error);
        showMessage('Error sending template notification', 'error');
    } finally {
        showLoading(false);
    }
}

// Handle scheduled notification submit
async function handleScheduledNotificationSubmit(e) {
    e.preventDefault();
    
    try {
        showLoading(true);
        
        const formData = new FormData();
        formData.append('title', document.getElementById('scheduled-title').value);
        formData.append('message', document.getElementById('scheduled-message').value);
        formData.append('type', 'scheduled');
        
        const date = document.getElementById('schedule-date').value;
        const time = document.getElementById('schedule-time').value;
        const scheduledAt = new Date(`${date}T${time}`).toISOString();
        formData.append('scheduledAt', scheduledAt);
        
        const recipientType = document.querySelector('input[name="scheduled-recipient-type"]:checked').value;
        
        if (recipientType === 'specific') {
            formData.append('userId', document.getElementById('scheduled-user-id').value);
        } else if (recipientType === 'multiple') {
            formData.append('userIds', document.getElementById('scheduled-user-ids').value);
        } else {
            formData.append('all', 'true');
        }
        
        const imageFile = document.getElementById('scheduled-image').files[0];
        if (imageFile) {
            formData.append('imageFile', imageFile);
        }
        
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SCHEDULE}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            showMessage('Notification scheduled successfully!', 'success');
            e.target.reset();
            document.getElementById('scheduled-image-preview').innerHTML = '';
            loadScheduledNotifications();
        } else {
            throw new Error('Failed to schedule notification');
        }
    } catch (error) {
        console.error('Error scheduling notification:', error);
        showMessage('Error scheduling notification', 'error');
    } finally {
        showLoading(false);
    }
}

// Template Helper Functions
function getTemplateByEvent(event) {
  const allTemplates = [...SAMPLE_TEMPLATES.userEventTemplates, ...SAMPLE_TEMPLATES.shipperEventTemplates];
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

function getAllSampleTemplates() {
  return [...SAMPLE_TEMPLATES.userEventTemplates, ...SAMPLE_TEMPLATES.shipperEventTemplates];
}

function getUserSampleTemplates() {
  return SAMPLE_TEMPLATES.userEventTemplates;
}

function getShipperSampleTemplates() {
  return SAMPLE_TEMPLATES.shipperEventTemplates;
}

// Create sample templates in database
async function createSampleTemplates() {
  try {
    showLoading(true);
    showMessage('Creating sample templates...', 'info');
    
    const allTemplates = getAllSampleTemplates();
    const results = [];
    
    for (let i = 0; i < allTemplates.length; i++) {
      const template = allTemplates[i];
      console.log(`[${i + 1}/${allTemplates.length}] Creating: ${template.name}`);
      
      try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TEMPLATES}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(template)
        });
        
        if (response.ok) {
          const result = await response.json();
          results.push({ success: true, template: result.template });
          console.log(`✅ Created: ${template.name} (${template.event})`);
        } else {
          const errorData = await response.json();
          results.push({ success: false, error: errorData.message, template });
          console.log(`❌ Failed: ${template.name} - ${errorData.message}`);
        }
      } catch (error) {
        results.push({ success: false, error: error.message, template });
        console.log(`❌ Error: ${template.name} - ${error.message}`);
      }
      
      // Add small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Show summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    showMessage(`Sample templates created: ${successful} successful, ${failed} failed`, 'success');
    
    // Reload templates
    await loadTemplates();
    
    return results;
  } catch (error) {
    console.error('Error creating sample templates:', error);
    showMessage('Error creating sample templates', 'error');
    return [];
  } finally {
    showLoading(false);
  }
}

// Create only user templates
async function createUserSampleTemplates() {
  try {
    showLoading(true);
    showMessage('Creating user sample templates...', 'info');
    
    const userTemplates = getUserSampleTemplates();
    const results = [];
    
    for (let i = 0; i < userTemplates.length; i++) {
      const template = userTemplates[i];
      console.log(`[${i + 1}/${userTemplates.length}] Creating: ${template.name}`);
      
      try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TEMPLATES}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(template)
        });
        
        if (response.ok) {
          const result = await response.json();
          results.push({ success: true, template: result.template });
          console.log(`✅ Created: ${template.name} (${template.event})`);
        } else {
          const errorData = await response.json();
          results.push({ success: false, error: errorData.message, template });
          console.log(`❌ Failed: ${template.name} - ${errorData.message}`);
        }
      } catch (error) {
        results.push({ success: false, error: error.message, template });
        console.log(`❌ Error: ${template.name} - ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    showMessage(`User templates created: ${successful} successful, ${failed} failed`, 'success');
    await loadTemplates();
    
    return results;
  } catch (error) {
    console.error('Error creating user templates:', error);
    showMessage('Error creating user templates', 'error');
    return [];
  } finally {
    showLoading(false);
  }
}

// Create only shipper templates
async function createShipperSampleTemplates() {
  try {
    showLoading(true);
    showMessage('Creating shipper sample templates...', 'info');
    
    const shipperTemplates = getShipperSampleTemplates();
    const results = [];
    
    for (let i = 0; i < shipperTemplates.length; i++) {
      const template = shipperTemplates[i];
      console.log(`[${i + 1}/${shipperTemplates.length}] Creating: ${template.name}`);
      
      try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TEMPLATES}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(template)
        });
        
        if (response.ok) {
          const result = await response.json();
          results.push({ success: true, template: result.template });
          console.log(`✅ Created: ${template.name} (${template.event})`);
        } else {
          const errorData = await response.json();
          results.push({ success: false, error: errorData.message, template });
          console.log(`❌ Failed: ${template.name} - ${errorData.message}`);
        }
      } catch (error) {
        results.push({ success: false, error: error.message, template });
        console.log(`❌ Error: ${template.name} - ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    showMessage(`Shipper templates created: ${successful} successful, ${failed} failed`, 'success');
    await loadTemplates();
    
    return results;
  } catch (error) {
    console.error('Error creating shipper templates:', error);
    showMessage('Error creating shipper templates', 'error');
    return [];
  } finally {
    showLoading(false);
  }
}

// Check existing templates and create missing ones
async function createMissingSampleTemplates() {
  try {
    showLoading(true);
    showMessage('Checking existing templates...', 'info');
    
    // Get existing templates
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TEMPLATES}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to check existing templates');
    }
    
    const data = await response.json();
    const existingTemplates = data.templates || [];
    const existingEvents = existingTemplates.map(t => t.event);
    
    // Get all sample templates
    const allSampleTemplates = getAllSampleTemplates();
    const missingTemplates = allSampleTemplates.filter(template => !existingEvents.includes(template.event));
    
    if (missingTemplates.length === 0) {
      showMessage('All sample templates already exist!', 'success');
      return [];
    }
    
    showMessage(`Creating ${missingTemplates.length} missing templates...`, 'info');
    
    const results = [];
    
    for (let i = 0; i < missingTemplates.length; i++) {
      const template = missingTemplates[i];
      console.log(`[${i + 1}/${missingTemplates.length}] Creating: ${template.name}`);
      
      try {
        const createResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TEMPLATES}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(template)
        });
        
        if (createResponse.ok) {
          const result = await createResponse.json();
          results.push({ success: true, template: result.template });
          console.log(`✅ Created: ${template.name} (${template.event})`);
        } else {
          const errorData = await createResponse.json();
          results.push({ success: false, error: errorData.message, template });
          console.log(`❌ Failed: ${template.name} - ${errorData.message}`);
        }
      } catch (error) {
        results.push({ success: false, error: error.message, template });
        console.log(`❌ Error: ${template.name} - ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    showMessage(`Missing templates created: ${successful} successful, ${failed} failed`, 'success');
    await loadTemplates();
    
    return results;
  } catch (error) {
    console.error('Error creating missing templates:', error);
    showMessage('Error creating missing templates', 'error');
    return [];
  } finally {
    showLoading(false);
  }
}

// Handle template submit
async function handleTemplateSubmit(e) {
    e.preventDefault();
    
    try {
        showLoading(true);
        
        const formData = new FormData();
        formData.append('name', document.getElementById('template-name').value);
        formData.append('event', document.getElementById('template-event').value);
        formData.append('title', document.getElementById('template-title').value);
        formData.append('message', document.getElementById('template-message').value);
        
        const imageFile = document.getElementById('template-image').files[0];
        if (imageFile) {
            formData.append('imageFile', imageFile);
        }
        
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TEMPLATES}`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            showMessage('Template created successfully!', 'success');
            closeTemplateModal();
            loadTemplates();
        } else {
            throw new Error('Failed to create template');
        }
    } catch (error) {
        console.error('Error creating template:', error);
        showMessage('Error creating template', 'error');
    } finally {
        showLoading(false);
    }
}

// Load template selector
function loadTemplateSelector() {
    const selector = document.getElementById('template-selector');
    if (!selector) return;
    
    if (templates.length === 0) {
        selector.innerHTML = `
            <div class="no-data">
                <p>No templates available</p>
                <button class="btn-primary" onclick="openTemplateModal()">
                    <i class="fas fa-plus"></i> Create Template
                </button>
            </div>
        `;
        return;
    }
    
    selector.innerHTML = templates.map(template => `
        <div class="template-option" data-id="${template._id}" data-event="${template.event}" onclick="selectTemplate('${template._id}')">
            <h4>${template.name}</h4>
            <p>${template.title}</p>
            <div class="event-tag">${template.event}</div>
        </div>
    `).join('');
}

// Select template
function selectTemplate(templateId) {
    // Remove selected class from all options
    document.querySelectorAll('.template-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Add selected class to chosen option
    const selectedOption = document.querySelector(`[data-id="${templateId}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
    
    // Load template variables
    loadTemplateVariables(templateId);
}

// Load template variables
function loadTemplateVariables(templateId) {
    const template = templates.find(t => t._id === templateId);
    if (!template) return;
    
    const variablesContainer = document.getElementById('template-variables');
    if (!variablesContainer) return;
    
    // Extract variables from template (simple regex for {{variable}})
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables = new Set();
    let match;
    
    while ((match = variableRegex.exec(template.title + template.message)) !== null) {
        variables.add(match[1]);
    }
    
    if (variables.size === 0) {
        variablesContainer.innerHTML = '<p>No variables found in this template</p>';
        return;
    }
    
    variablesContainer.innerHTML = Array.from(variables).map(variable => `
        <div class="variable-input">
            <label for="var-${variable}">${variable}:</label>
            <input type="text" id="var-${variable}" name="${variable}" placeholder="Enter value for ${variable}">
        </div>
    `).join('');
}

// Handle image change
function handleImageChange(input, previewId) {
    const file = input.files[0];
    const preview = document.getElementById(previewId);
    
    if (file && preview) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
}

// Open template modal
function openTemplateModal() {
    const modal = document.getElementById('template-modal');
    if (modal) {
        modal.style.display = 'block';
        document.getElementById('template-modal-title').textContent = 'Add New Template';
        document.getElementById('template-form-modal').reset();
        document.getElementById('template-image-preview').innerHTML = '';
    }
}

// Close template modal
function closeTemplateModal() {
    const modal = document.getElementById('template-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal
function closeModal(modal) {
    modal.style.display = 'none';
}

// Show loading
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

// Show message
function showMessage(message, type = 'info') {
    const container = document.getElementById('message-container');
    if (!container) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.innerHTML = `
        <i class="fas fa-${getMessageIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(messageElement);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        messageElement.remove();
    }, 5000);
}

// Get message icon
function getMessageIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

// Get auth token
function getAuthToken() {
    return localStorage.getItem('adminToken') || 'demo-token';
}

// Logout
function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
}

// Initialize charts
function initializeCharts() {
    // Activity chart
    const activityCtx = document.getElementById('activityChart');
    if (activityCtx) {
        charts.activity = new Chart(activityCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Notifications Sent',
                    data: [12, 19, 15, 25, 22, 30, 28],
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Type chart
    const typeCtx = document.getElementById('typeChart');
    if (typeCtx) {
        charts.type = new Chart(typeCtx, {
            type: 'doughnut',
            data: {
                labels: ['Urgent', 'Template', 'Scheduled'],
                datasets: [{
                    data: [30, 45, 25],
                    backgroundColor: ['#dc3545', '#007bff', '#fd7e14']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Load analytics
async function loadAnalytics() {
    try {
        const response = await fetch('/api/noti/analytics', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            const analytics = await response.json();
            updateAnalyticsCharts(analytics);
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Update analytics charts
function updateAnalyticsCharts(analytics) {
    // Update existing charts with real data
    if (charts.activity && analytics.activity) {
        charts.activity.data.labels = analytics.activity.labels;
        charts.activity.data.datasets[0].data = analytics.activity.data;
        charts.activity.update();
    }
    
    if (charts.type && analytics.types) {
        charts.type.data.labels = analytics.types.labels;
        charts.type.data.datasets[0].data = analytics.types.data;
        charts.type.update();
    }
}

// Generate report
function generateReport(type) {
    showMessage(`Generating ${type} report...`, 'info');
    
    // Simulate report generation
    setTimeout(() => {
        const link = document.createElement('a');
        link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(getSampleReportData())}`;
        link.download = `notification-report-${type}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        showMessage(`${type} report downloaded successfully!`, 'success');
    }, 2000);
}

// Utility functions
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

// Sample data functions
function getSampleStats() {
    return {
        urgentSentToday: 15,
        scheduledActive: 8,
        activeTemplates: 12,
        successRate: 95
    };
}

function getSampleTemplates() {
    return [
        {
            _id: '1',
            name: 'Order Success',
            event: 'order_success',
            title: 'Order {{orderId}} completed!',
            message: 'Your order {{orderId}} has been completed successfully!',
            image: null
        },
        {
            _id: '2',
            name: 'Payment Success',
            event: 'payment_success',
            title: 'Payment received for {{orderId}}',
            message: 'Payment of {{amount}} has been received for order {{orderId}}.',
            image: null
        }
    ];
}

function getSampleScheduledNotifications() {
    return [
        {
            _id: '1',
            title: 'Weekly Newsletter',
            scheduledAt: new Date(Date.now() + 86400000).toISOString(),
            type: 'newsletter',
            status: 'pending',
            userId: null
        }
    ];
}

function getSampleNotificationHistory() {
    return [
        {
            _id: '1',
            title: 'Order Completed',
            message: 'Your order #12345 has been completed successfully!',
            userId: 'user123',
            type: 'urgent',
            sendAt: new Date().toISOString(),
            status: 'sent'
        }
    ];
}

function getSampleReportData() {
    return `Date,Type,Recipients,Status
2024-01-01,Urgent,All Users,Sent
2024-01-01,Template,Specific Users,Sent
2024-01-02,Scheduled,All Users,Pending`;
}

// Action functions (to be implemented)
function editTemplate(id) {
    showMessage('Edit template functionality coming soon', 'info');
}

function testTemplate(id) {
    showMessage('Test template functionality coming soon', 'info');
}

function deleteTemplate(id) {
    if (confirm('Are you sure you want to delete this template?')) {
        showMessage('Delete template functionality coming soon', 'info');
    }
}

function editScheduled(id) {
    showMessage('Edit scheduled notification functionality coming soon', 'info');
}

function cancelScheduled(id) {
    if (confirm('Are you sure you want to cancel this scheduled notification?')) {
        showMessage('Cancel scheduled notification functionality coming soon', 'info');
    }
}

function viewNotificationDetails(id) {
    showMessage('View notification details functionality coming soon', 'info');
}

function resendNotification(id) {
    if (confirm('Are you sure you want to resend this notification?')) {
        showMessage('Resend notification functionality coming soon', 'info');
    }
}

function applyDateFilter() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (startDate && endDate) {
        loadNotificationHistory(1, {
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString()
        });
    }
}

function filterScheduled() {
    const searchTerm = document.getElementById('scheduled-search').value.toLowerCase();
    const filteredScheduled = scheduledNotifications.filter(scheduled => 
        scheduled.title.toLowerCase().includes(searchTerm) ||
        scheduled.type.toLowerCase().includes(searchTerm)
    );
    
    // Re-render with filtered data
    const originalScheduled = scheduledNotifications;
    scheduledNotifications = filteredScheduled;
    renderScheduledNotifications();
    scheduledNotifications = originalScheduled;
}

function filterHistory() {
    const searchTerm = document.getElementById('history-search').value.toLowerCase();
    const filteredHistory = notificationHistory.filter(notification => 
        notification.title.toLowerCase().includes(searchTerm) ||
        notification.message.toLowerCase().includes(searchTerm) ||
        notification.type.toLowerCase().includes(searchTerm)
    );
    
    // Re-render with filtered data
    const originalHistory = notificationHistory;
    notificationHistory = filteredHistory;
    renderNotificationHistory();
    notificationHistory = originalHistory;
}
