const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000'; // Có thể đổi thành production URL
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGFhZDJjZDVhMmI4NWZlZjJlMjNhNzQiLCJ1c2VybmFtZSI6ImJpbmhhbnZvaWRvaSIsInJvbGVzIjpbImFkbWluIl0sImlhdCI6MTc1NjI2NzE0MywiZXhwIjoxNzU2MjgxNTQzfQ.3tZnagFj7Wuvs81SAuCFaDxMFAvfe3t_OTTwmjlVUM4';

const headers = {
  'Authorization': `Bearer ${TEST_TOKEN}`,
  'Content-Type': 'application/json'
};

// Function to send notification to specific user
async function sendToUser(userId, title, message, type = 'urgent', image = null, data = {}) {
  try {
    console.log(`👤 Sending notification to user: ${userId}`);
    console.log(`📋 Title: ${title}`);
    console.log(`📋 Message: ${message}`);
    console.log(`📋 Type: ${type}`);
    
    const notificationData = {
      userId,
      title,
      message,
      type,
      data
    };
    
    if (image) {
      notificationData.image = image;
    }
    
    const response = await axios.post(`${BASE_URL}/api/noti/send`, notificationData, { headers });
    
    if (response.status === 429) {
      console.log('⚠️ Rate limit exceeded. Please wait 30 seconds before sending another notification.');
      console.log('📋 Response:', response.data);
      return { success: false, message: 'Rate limit exceeded' };
    } else if (response.data.success) {
      console.log('✅ Notification sent to user successfully!');
      console.log('📋 Response:', response.data);
      return { success: true, data: response.data };
    } else {
      console.log('❌ Failed to send notification:', response.data.message);
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    console.log('❌ Error sending notification:', error.response?.data?.message || error.message);
    return { success: false, message: error.message };
  }
}

// Function to send notification to multiple users
async function sendToMultipleUsers(userIds, title, message, type = 'urgent', image = null, data = {}) {
  try {
    console.log(`👥 Sending notification to ${userIds.length} users...`);
    console.log(`📋 Title: ${title}`);
    console.log(`📋 Message: ${message}`);
    console.log(`📋 Type: ${type}`);
    
    const notificationData = {
      userIds,
      title,
      message,
      type,
      data
    };
    
    if (image) {
      notificationData.image = image;
    }
    
    const response = await axios.post(`${BASE_URL}/api/noti/send-multicast`, notificationData, { headers });
    
    if (response.status === 429) {
      console.log('⚠️ Rate limit exceeded. Please wait 30 seconds before sending another notification.');
      console.log('📋 Response:', response.data);
      return { success: false, message: 'Rate limit exceeded' };
    } else if (response.data.success) {
      console.log('✅ Notification sent to multiple users successfully!');
      console.log('📋 Response:', response.data);
      return { success: true, data: response.data };
    } else {
      console.log('❌ Failed to send notification:', response.data.message);
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    console.log('❌ Error sending notification:', error.response?.data?.message || error.message);
    return { success: false, message: error.message };
  }
}

// Function to send notification to all users
async function sendToAllUsers(title, message, type = 'urgent', image = null, data = {}) {
  try {
    console.log('🌍 Sending notification to ALL users...');
    console.log(`📋 Title: ${title}`);
    console.log(`📋 Message: ${message}`);
    console.log(`📋 Type: ${type}`);
    
    const notificationData = {
      title,
      message,
      type,
      data
    };
    
    if (image) {
      notificationData.image = image;
    }
    
    const response = await axios.post(`${BASE_URL}/api/noti/send-all`, notificationData, { headers });
    
    if (response.status === 429) {
      console.log('⚠️ Rate limit exceeded. Please wait 30 seconds before sending another notification.');
      console.log('📋 Response:', response.data);
      return { success: false, message: 'Rate limit exceeded' };
    } else if (response.data.success) {
      console.log('✅ Notification sent to all users successfully!');
      console.log('📋 Response:', response.data);
      return { success: true, data: response.data };
    } else {
      console.log('❌ Failed to send notification:', response.data.message);
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    console.log('❌ Error sending notification:', error.response?.data?.message || error.message);
    return { success: false, message: error.message };
  }
}

// Function to send urgent notification to specific user
async function sendUrgentToUser(userId, title, message, image = null) {
  return await sendToUser(userId, title, message, 'urgent', image, { priority: 'high' });
}

// Function to send urgent notification to multiple users
async function sendUrgentToMultipleUsers(userIds, title, message, image = null) {
  return await sendToMultipleUsers(userIds, title, message, 'urgent', image, { priority: 'high' });
}

// Function to send urgent notification to all users
async function sendUrgentToAllUsers(title, message, image = null) {
  return await sendToAllUsers(title, message, 'urgent', image, { priority: 'high' });
}

// Function to send system notification
async function sendSystemNotification(title, message, image = null, target = 'all') {
  const data = { category: 'system' };
  
  if (target === 'all') {
    return await sendToAllUsers(title, message, 'system', image, data);
  } else if (Array.isArray(target)) {
    return await sendToMultipleUsers(target, title, message, 'system', image, data);
  } else {
    return await sendToUser(target, title, message, 'system', image, data);
  }
}

// Function to send marketing notification
async function sendMarketingNotification(title, message, image = null, promotionData = {}, target = 'all') {
  const data = { 
    category: 'marketing',
    ...promotionData
  };
  
  if (target === 'all') {
    return await sendToAllUsers(title, message, 'marketing', image, data);
  } else if (Array.isArray(target)) {
    return await sendToMultipleUsers(target, title, message, 'marketing', image, data);
  } else {
    return await sendToUser(target, title, message, 'marketing', image, data);
  }
}

// Function to send promotion notification
async function sendPromotionNotification(title, message, image = null, discount = null, target = 'all') {
  const data = { category: 'promotion' };
  if (discount) data.discount = discount;
  
  if (target === 'all') {
    return await sendToAllUsers(title, message, 'promotion', image, data);
  } else if (Array.isArray(target)) {
    return await sendToMultipleUsers(target, title, message, 'promotion', image, data);
  } else {
    return await sendToUser(target, title, message, 'promotion', image, data);
  }
}

// Function to send maintenance notification
async function sendMaintenanceNotification(title, message, duration = null, target = 'all') {
  const data = { category: 'maintenance' };
  if (duration) data.duration = duration;
  
  if (target === 'all') {
    return await sendToAllUsers(title, message, 'system', null, data);
  } else if (Array.isArray(target)) {
    return await sendToMultipleUsers(target, title, message, 'system', null, data);
  } else {
    return await sendToUser(target, title, message, 'system', null, data);
  }
}

// Interactive function to send custom notification
async function sendCustomNotification() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('🚨 CUSTOM NOTIFICATION SENDER');
  console.log('=============================');
  
  try {
    // Get target type
    const targetType = await new Promise(resolve => {
      rl.question('Choose target:\n1. Specific User\n2. Multiple Users\n3. All Users\nEnter choice (1-3): ', resolve);
    });
    
    // Get notification type
    const type = await new Promise(resolve => {
      rl.question('Choose notification type:\n1. Urgent\n2. System\n3. Marketing\n4. Promotion\n5. Maintenance\nEnter choice (1-5): ', resolve);
    });
    
    // Get title
    const title = await new Promise(resolve => {
      rl.question('Enter notification title: ', resolve);
    });
    
    // Get message
    const message = await new Promise(resolve => {
      rl.question('Enter notification message: ', resolve);
    });
    
    // Get image URL (optional)
    const imageUrl = await new Promise(resolve => {
      rl.question('Enter image URL (optional, press Enter to skip): ', resolve);
    });
    
    let target = 'all';
    
    // Get target based on target type
    if (targetType === '1') {
      target = await new Promise(resolve => {
        rl.question('Enter user ID: ', resolve);
      });
    } else if (targetType === '2') {
      const userIdsInput = await new Promise(resolve => {
        rl.question('Enter user IDs (comma separated): ', resolve);
      });
      target = userIdsInput.split(',').map(id => id.trim());
    }
    
    let result = null;
    
    switch (type) {
      case '1':
        if (target === 'all') {
          result = await sendUrgentToAllUsers(title, message, imageUrl || null);
        } else if (Array.isArray(target)) {
          result = await sendUrgentToMultipleUsers(target, title, message, imageUrl || null);
        } else {
          result = await sendUrgentToUser(target, title, message, imageUrl || null);
        }
        break;
      case '2':
        result = await sendSystemNotification(title, message, imageUrl || null, target);
        break;
      case '3':
        result = await sendMarketingNotification(title, message, imageUrl || null, {}, target);
        break;
      case '4':
        const discount = await new Promise(resolve => {
          rl.question('Enter discount percentage (optional): ', resolve);
        });
        result = await sendPromotionNotification(title, message, imageUrl || null, discount || null, target);
        break;
      case '5':
        const duration = await new Promise(resolve => {
          rl.question('Enter maintenance duration (optional): ', resolve);
        });
        result = await sendMaintenanceNotification(title, message, duration || null, target);
        break;
      default:
        console.log('❌ Invalid choice');
        rl.close();
        return;
    }
    
    if (result && result.success) {
      console.log('✅ Custom notification sent successfully!');
    } else {
      console.log('❌ Failed to send custom notification');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// Predefined notification templates
const notificationTemplates = {
  urgent: {
    title: '🚨 Thông báo khẩn cấp!',
    message: 'Hệ thống đang gặp sự cố kỹ thuật. Vui lòng thử lại sau 30 phút.',
    type: 'urgent'
  },
  maintenance: {
    title: '🔧 Bảo trì hệ thống',
    message: 'Hệ thống sẽ bảo trì từ 22:00 đến 06:00 ngày mai. Xin lỗi vì sự bất tiện.',
    type: 'system'
  },
  promotion: {
    title: '🎯 Khuyến mãi đặc biệt!',
    message: 'Giảm giá 50% cho tất cả sản phẩm trong 24 giờ tới. Mua ngay kẻo hết!',
    type: 'promotion'
  },
  marketing: {
    title: '📢 Thông báo mới',
    message: 'Khám phá bộ sưu tập mới nhất với thiết kế độc đáo.',
    type: 'marketing'
  }
};

// Function to send predefined notifications
async function sendPredefinedNotification(templateName, target = 'all') {
  const template = notificationTemplates[templateName];
  if (!template) {
    console.log('❌ Template not found');
    return;
  }
  
  if (target === 'all') {
    return await sendToAllUsers(template.title, template.message, template.type);
  } else if (Array.isArray(target)) {
    return await sendToMultipleUsers(target, template.title, template.message, template.type);
  } else {
    return await sendToUser(target, template.title, template.message, template.type);
  }
}

// Main function
async function main() {
  console.log('🚨 SEND NOTIFICATION TOOL');
  console.log('=========================');
  console.log(`🌐 API URL: ${BASE_URL}\n`);
  
  const args = process.argv.slice(2);
  
  if (args.includes('--urgent-all')) {
    await sendUrgentToAllUsers('🚨 Thông báo khẩn cấp!', 'Hệ thống đang gặp sự cố kỹ thuật.');
  } else if (args.includes('--urgent-user')) {
    const userId = args[args.indexOf('--urgent-user') + 1];
    if (userId) {
      await sendUrgentToUser(userId, '🚨 Thông báo khẩn cấp!', 'Hệ thống đang gặp sự cố kỹ thuật.');
    } else {
      console.log('❌ Please provide user ID: --urgent-user <userId>');
    }
  } else if (args.includes('--urgent-multiple')) {
    const userIds = args[args.indexOf('--urgent-multiple') + 1];
    if (userIds) {
      const userIdArray = userIds.split(',').map(id => id.trim());
      await sendUrgentToMultipleUsers(userIdArray, '🚨 Thông báo khẩn cấp!', 'Hệ thống đang gặp sự cố kỹ thuật.');
    } else {
      console.log('❌ Please provide user IDs: --urgent-multiple <userId1,userId2,userId3>');
    }
  } else if (args.includes('--maintenance')) {
    await sendMaintenanceNotification('🔧 Bảo trì hệ thống', 'Hệ thống sẽ bảo trì từ 22:00 đến 06:00 ngày mai.');
  } else if (args.includes('--promotion')) {
    await sendPromotionNotification('🎯 Khuyến mãi đặc biệt!', 'Giảm giá 50% cho tất cả sản phẩm trong 24 giờ tới.');
  } else if (args.includes('--marketing')) {
    await sendMarketingNotification('📢 Thông báo mới', 'Khám phá bộ sưu tập mới nhất với thiết kế độc đáo.');
  } else if (args.includes('--custom')) {
    await sendCustomNotification();
  } else {
    console.log('Usage:');
    console.log('  node send-all-notification.js --urgent-all                    # Send urgent notification to all users');
    console.log('  node send-all-notification.js --urgent-user <userId>          # Send urgent notification to specific user');
    console.log('  node send-all-notification.js --urgent-multiple <userIds>     # Send urgent notification to multiple users');
    console.log('  node send-all-notification.js --maintenance                   # Send maintenance notification to all users');
    console.log('  node send-all-notification.js --promotion                     # Send promotion notification to all users');
    console.log('  node send-all-notification.js --marketing                     # Send marketing notification to all users');
    console.log('  node send-all-notification.js --custom                        # Interactive mode');
    console.log('');
    console.log('Examples:');
    console.log('  node send-all-notification.js --urgent-all');
    console.log('  node send-all-notification.js --urgent-user 68aad2cd5a2b85fef2e23a74');
    console.log('  node send-all-notification.js --urgent-multiple "68aad2cd5a2b85fef2e23a74,68aad2cd5a2b85fef2e23a75"');
    console.log('  node send-all-notification.js --custom');
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  sendToUser,
  sendToMultipleUsers,
  sendToAllUsers,
  sendUrgentToUser,
  sendUrgentToMultipleUsers,
  sendUrgentToAllUsers,
  sendSystemNotification,
  sendMarketingNotification,
  sendPromotionNotification,
  sendMaintenanceNotification,
  sendCustomNotification,
  sendPredefinedNotification
};



