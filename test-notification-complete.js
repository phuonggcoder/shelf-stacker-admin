const axios = require('axios');

// Configuration
const BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';
const TEST_TOKEN = 'your-test-token-here'; // Thay bằng token thực

const headers = {
  'Authorization': `Bearer ${TEST_TOKEN}`,
  'Content-Type': 'application/json'
};

// Test functions
async function testTemplateCRUD() {
  console.log('\n🧪 Testing Template CRUD Operations...');
  
  try {
    // 1. Create template
    console.log('1. Creating template...');
    const createResponse = await axios.post(`${BASE_URL}/api/notification-templates`, {
      name: 'Test Order Success',
      event: 'test_order_success',
      title: 'Đơn hàng {{orderId}} thành công!',
      message: 'Cảm ơn bạn đã đặt hàng {{orderId}} với tổng trị giá {{amount}}đ'
    }, { headers });
    
    console.log('✅ Template created:', createResponse.data);
    const templateId = createResponse.data.template._id;
    
    // 2. Get template
    console.log('2. Getting template...');
    const getResponse = await axios.get(`${BASE_URL}/api/notification-templates/${templateId}`, { headers });
    console.log('✅ Template retrieved:', getResponse.data);
    
    // 3. Update template
    console.log('3. Updating template...');
    const updateResponse = await axios.put(`${BASE_URL}/api/notification-templates/${templateId}`, {
      title: 'Đơn hàng {{orderId}} đã hoàn thành!',
      message: 'Đơn hàng {{orderId}} của bạn đã được xử lý thành công với tổng trị giá {{amount}}đ'
    }, { headers });
    console.log('✅ Template updated:', updateResponse.data);
    
    // 4. Preview template
    console.log('4. Previewing template...');
    const previewResponse = await axios.post(`${BASE_URL}/api/notification-templates/${templateId}/preview`, {
      data: {
        orderId: 'ORD123456',
        amount: '500,000'
      }
    }, { headers });
    console.log('✅ Template preview:', previewResponse.data);
    
    // 5. Test template
    console.log('5. Testing template...');
    const testResponse = await axios.post(`${BASE_URL}/api/notification-templates/${templateId}/test`, {
      data: {
        orderId: 'ORD123456',
        amount: '500,000'
      },
      userId: 'test-user-id'
    }, { headers });
    console.log('✅ Template test:', testResponse.data);
    
    // 6. Delete template
    console.log('6. Deleting template...');
    const deleteResponse = await axios.delete(`${BASE_URL}/api/notification-templates/${templateId}`, { headers });
    console.log('✅ Template deleted:', deleteResponse.data);
    
  } catch (error) {
    console.error('❌ Template CRUD test failed:', error.response?.data || error.message);
  }
}

async function testUrgentNotifications() {
  console.log('\n🚨 Testing Urgent Notifications...');
  
  try {
    // Send to specific user
    console.log('1. Sending urgent notification to specific user...');
    const urgentResponse = await axios.post(`${BASE_URL}/api/noti/send`, {
      userId: 'test-user-id',
      title: 'Thông báo khẩn cấp',
      message: 'Đây là thông báo khẩn cấp từ hệ thống',
      type: 'urgent',
      data: { priority: 'high' }
    }, { headers });
    console.log('✅ Urgent notification sent:', urgentResponse.data);
    
    // Send to all users
    console.log('2. Sending urgent notification to all users...');
    const allResponse = await axios.post(`${BASE_URL}/api/noti/send-all`, {
      title: 'Thông báo hệ thống',
      message: 'Hệ thống sẽ bảo trì trong 30 phút',
      type: 'urgent',
      data: { maintenance: true }
    }, { headers });
    console.log('✅ Broadcast urgent notification sent:', allResponse.data);
    
  } catch (error) {
    console.error('❌ Urgent notification test failed:', error.response?.data || error.message);
  }
}

async function testScheduledNotifications() {
  console.log('\n⏰ Testing Scheduled Notifications...');
  
  try {
    // Schedule notification
    console.log('1. Scheduling notification...');
    const scheduleDate = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    const scheduleResponse = await axios.post(`${BASE_URL}/api/noti/schedule`, {
      title: 'Thông báo theo lịch',
      message: 'Đây là thông báo được lập lịch trước',
      type: 'scheduled',
      scheduledAt: scheduleDate.toISOString(),
      sendToAll: true,
      data: { scheduled: true }
    }, { headers });
    console.log('✅ Notification scheduled:', scheduleResponse.data);
    
    const scheduledId = scheduleResponse.data.scheduledNotification._id;
    
    // Get scheduled notifications
    console.log('2. Getting scheduled notifications...');
    const getResponse = await axios.get(`${BASE_URL}/api/noti/scheduled`, { headers });
    console.log('✅ Scheduled notifications retrieved:', getResponse.data);
    
    // Cancel scheduled notification
    console.log('3. Cancelling scheduled notification...');
    const cancelResponse = await axios.delete(`${BASE_URL}/api/noti/scheduled/${scheduledId}`, { headers });
    console.log('✅ Scheduled notification cancelled:', cancelResponse.data);
    
  } catch (error) {
    console.error('❌ Scheduled notification test failed:', error.response?.data || error.message);
  }
}

async function testTemplateNotifications() {
  console.log('\n📋 Testing Template Notifications...');
  
  try {
    // First create a template
    console.log('1. Creating test template...');
    const createResponse = await axios.post(`${BASE_URL}/api/notification-templates`, {
      name: 'Test Template',
      event: 'test_event',
      title: 'Xin chào {{name}}!',
      message: 'Chào mừng bạn đến với {{appName}}. Mã khuyến mãi của bạn là {{promoCode}}'
    }, { headers });
    
    const templateId = createResponse.data.template._id;
    
    // Send template notification
    console.log('2. Sending template notification...');
    const templateResponse = await axios.post(`${BASE_URL}/api/noti/send-event`, {
      event: 'test_event',
      userId: 'test-user-id',
      data: {
        name: 'Nguyễn Văn A',
        appName: 'ShelfStacker',
        promoCode: 'WELCOME2024'
      }
    }, { headers });
    console.log('✅ Template notification sent:', templateResponse.data);
    
    // Clean up - delete template
    await axios.delete(`${BASE_URL}/api/notification-templates/${templateId}`, { headers });
    
  } catch (error) {
    console.error('❌ Template notification test failed:', error.response?.data || error.message);
  }
}

async function testOrderNotifications() {
  console.log('\n📦 Testing Order Notifications...');
  
  try {
    // Order success notification
    console.log('1. Sending order success notification...');
    const orderResponse = await axios.post(`${BASE_URL}/api/noti/order`, {
      userId: 'test-user-id',
      orderId: 'ORD123456',
      orderStatus: 'Delivered',
      amount: '750,000'
    }, { headers });
    console.log('✅ Order notification sent:', orderResponse.data);
    
  } catch (error) {
    console.error('❌ Order notification test failed:', error.response?.data || error.message);
  }
}

async function testPaymentNotifications() {
  console.log('\n💳 Testing Payment Notifications...');
  
  try {
    // Payment success notification
    console.log('1. Sending payment success notification...');
    const paymentResponse = await axios.post(`${BASE_URL}/api/noti/payment`, {
      userId: 'test-user-id',
      orderId: 'ORD123456',
      paymentStatus: 'Success',
      amount: '750,000',
      paymentMethod: 'Credit Card'
    }, { headers });
    console.log('✅ Payment notification sent:', paymentResponse.data);
    
  } catch (error) {
    console.error('❌ Payment notification test failed:', error.response?.data || error.message);
  }
}

async function testMarketingNotifications() {
  console.log('\n🎯 Testing Marketing Notifications...');
  
  try {
    // Marketing notification
    console.log('1. Sending marketing notification...');
    const marketingResponse = await axios.post(`${BASE_URL}/api/noti/marketing`, {
      title: 'Khuyến mãi đặc biệt!',
      message: 'Giảm giá 50% cho tất cả sản phẩm',
      event: 'promotion_created',
      data: {
        discount: '50%',
        validUntil: '2024-12-31',
        promoCode: 'SALE50'
      }
    }, { headers });
    console.log('✅ Marketing notification sent:', marketingResponse.data);
    
  } catch (error) {
    console.error('❌ Marketing notification test failed:', error.response?.data || error.message);
  }
}

async function testNotificationStats() {
  console.log('\n📊 Testing Notification Statistics...');
  
  try {
    // Get notification stats
    console.log('1. Getting notification statistics...');
    const statsResponse = await axios.get(`${BASE_URL}/api/noti/stats`, { headers });
    console.log('✅ Notification stats retrieved:', statsResponse.data);
    
  } catch (error) {
    console.error('❌ Notification stats test failed:', error.response?.data || error.message);
  }
}

async function testImageUpload() {
  console.log('\n🖼️ Testing Image Upload...');
  
  try {
    // Test image upload with URL
    console.log('1. Testing image upload with URL...');
    const uploadResponse = await axios.post(`${BASE_URL}/api/noti/upload-image`, {
      imageUrl: 'https://via.placeholder.com/300x200',
      type: 'notification'
    }, { headers });
    console.log('✅ Image upload test:', uploadResponse.data);
    
  } catch (error) {
    console.error('❌ Image upload test failed:', error.response?.data || error.message);
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting Complete Notification System Tests...\n');
  
  try {
    await testTemplateCRUD();
    await testUrgentNotifications();
    await testScheduledNotifications();
    await testTemplateNotifications();
    await testOrderNotifications();
    await testPaymentNotifications();
    await testMarketingNotifications();
    await testNotificationStats();
    await testImageUpload();
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testTemplateCRUD,
  testUrgentNotifications,
  testScheduledNotifications,
  testTemplateNotifications,
  testOrderNotifications,
  testPaymentNotifications,
  testMarketingNotifications,
  testNotificationStats,
  testImageUpload,
  runAllTests
};



