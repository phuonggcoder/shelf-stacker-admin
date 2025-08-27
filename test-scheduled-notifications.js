const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000'; // Có thể đổi thành production URL
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGFhZDJjZDVhMmI4NWZlZjJlMjNhNzQiLCJ1c2VybmFtZSI6ImJpbmhhbnZvaWRvaSIsInJvbGVzIjpbImFkbWluIl0sImlhdCI6MTc1NjI2NzE0MywiZXhwIjoxNzU2MjgxNTQzfQ.3tZnagFj7Wuvs81SAuCFaDxMFAvfe3t_OTTwmjlVUM4';

const headers = {
  'Authorization': `Bearer ${TEST_TOKEN}`,
  'Content-Type': 'application/json'
};

// Test functions
async function testScheduledNotificationCRUD() {
  console.log('\n🧪 Testing Scheduled Notification CRUD Operations...');
  
  try {
    // 1. Create scheduled notification
    console.log('1. Creating scheduled notification...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // 9:00 AM tomorrow
    
    const createData = {
      title: 'Test Scheduled Notification',
      message: 'This is a test scheduled notification that will be sent tomorrow at 9:00 AM',
      type: 'scheduled',
      sendAt: tomorrow.toISOString(),
      recipients: {
        type: 'all'
      },
      data: {
        category: 'test',
        priority: 'normal'
      }
    };
    
    const createResponse = await axios.post(`${BASE_URL}/api/noti/schedule`, createData, { headers });
    
    if (createResponse.data.success) {
      console.log('✅ Scheduled notification created:', createResponse.data);
      const scheduledId = createResponse.data.data._id;
      
      // 2. Get scheduled notification
      console.log('2. Getting scheduled notification...');
      const getResponse = await axios.get(`${BASE_URL}/api/noti/scheduled/${scheduledId}`, { headers });
      console.log('✅ Scheduled notification retrieved:', getResponse.data);
      
      // 3. Update scheduled notification
      console.log('3. Updating scheduled notification...');
      const updateData = {
        title: 'Updated Test Scheduled Notification',
        message: 'This is an updated test scheduled notification',
        sendAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
      };
      
      const updateResponse = await axios.put(`${BASE_URL}/api/noti/scheduled/${scheduledId}`, updateData, { headers });
      console.log('✅ Scheduled notification updated:', updateResponse.data);
      
      // 4. Get all scheduled notifications
      console.log('4. Getting all scheduled notifications...');
      const getAllResponse = await axios.get(`${BASE_URL}/api/noti/scheduled?page=1&limit=10`, { headers });
      console.log('✅ All scheduled notifications:', getAllResponse.data);
      
      // 5. Delete scheduled notification
      console.log('5. Deleting scheduled notification...');
      const deleteResponse = await axios.delete(`${BASE_URL}/api/noti/scheduled/${scheduledId}`, { headers });
      console.log('✅ Scheduled notification deleted:', deleteResponse.data);
      
    } else {
      console.log('❌ Failed to create scheduled notification:', createResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Scheduled notification CRUD test failed:', error.response?.data || error.message);
  }
}

async function testScheduledNotificationTypes() {
  console.log('\n⏰ Testing Different Scheduled Notification Types...');
  
  try {
    const testCases = [
      {
        name: 'Immediate (5 minutes from now)',
        sendAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        type: 'scheduled'
      },
      {
        name: 'Tomorrow morning',
        sendAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        type: 'reminder'
      },
      {
        name: 'Next week',
        sendAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'event'
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`Creating ${testCase.name} notification...`);
      
      const notificationData = {
        title: `Test ${testCase.name}`,
        message: `This is a test notification scheduled for ${testCase.name}`,
        type: testCase.type,
        sendAt: testCase.sendAt,
        recipients: {
          type: 'all'
        }
      };
      
      const response = await axios.post(`${BASE_URL}/api/noti/schedule`, notificationData, { headers });
      
      if (response.data.success) {
        console.log(`✅ ${testCase.name} notification created successfully`);
      } else {
        console.log(`❌ Failed to create ${testCase.name} notification:`, response.data.message);
      }
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.error('❌ Scheduled notification types test failed:', error.response?.data || error.message);
  }
}

async function testScheduledNotificationRecipients() {
  console.log('\n👥 Testing Scheduled Notification Recipients...');
  
  try {
    const recipientTypes = [
      {
        name: 'All Users',
        recipients: { type: 'all' }
      },
      {
        name: 'Specific User',
        recipients: { 
          type: 'specific', 
          userIds: ['68aad2cd5a2b85fef2e23a74'] 
        }
      },
      {
        name: 'Multiple Users',
        recipients: { 
          type: 'multiple', 
          userIds: ['68aad2cd5a2b85fef2e23a74', '68aad2cd5a2b85fef2e23a75'] 
        }
      }
    ];
    
    for (const recipientType of recipientTypes) {
      console.log(`Testing ${recipientType.name}...`);
      
      const notificationData = {
        title: `Test ${recipientType.name}`,
        message: `This is a test notification for ${recipientType.name}`,
        type: 'scheduled',
        sendAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
        recipients: recipientType.recipients
      };
      
      const response = await axios.post(`${BASE_URL}/api/noti/schedule`, notificationData, { headers });
      
      if (response.data.success) {
        console.log(`✅ ${recipientType.name} notification created successfully`);
      } else {
        console.log(`❌ Failed to create ${recipientType.name} notification:`, response.data.message);
      }
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.error('❌ Scheduled notification recipients test failed:', error.response?.data || error.message);
  }
}

async function testScheduledNotificationFilters() {
  console.log('\n🔍 Testing Scheduled Notification Filters...');
  
  try {
    const filters = [
      { name: 'All', filter: 'all' },
      { name: 'Pending', filter: 'pending' },
      { name: 'Sent', filter: 'sent' },
      { name: 'Cancelled', filter: 'cancelled' }
    ];
    
    for (const filter of filters) {
      console.log(`Testing ${filter.name} filter...`);
      
      const response = await axios.get(`${BASE_URL}/api/noti/scheduled?page=1&limit=10&filter=${filter.filter}`, { headers });
      
      if (response.data.success) {
        console.log(`✅ ${filter.name} filter: ${response.data.data.notifications?.length || 0} notifications found`);
      } else {
        console.log(`❌ Failed to get ${filter.name} filter:`, response.data.message);
      }
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
  } catch (error) {
    console.error('❌ Scheduled notification filters test failed:', error.response?.data || error.message);
  }
}

async function testScheduledNotificationValidation() {
  console.log('\n✅ Testing Scheduled Notification Validation...');
  
  try {
    const invalidCases = [
      {
        name: 'Past date',
        data: {
          title: 'Test Past Date',
          message: 'This should fail',
          sendAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
          recipients: { type: 'all' }
        },
        shouldFail: true
      },
      {
        name: 'Missing title',
        data: {
          message: 'This should fail',
          sendAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          recipients: { type: 'all' }
        },
        shouldFail: true
      },
      {
        name: 'Missing message',
        data: {
          title: 'Test Missing Message',
          sendAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          recipients: { type: 'all' }
        },
        shouldFail: true
      },
      {
        name: 'Invalid recipient type',
        data: {
          title: 'Test Invalid Recipient',
          message: 'This should fail',
          sendAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          recipients: { type: 'invalid' }
        },
        shouldFail: true
      }
    ];
    
    for (const testCase of invalidCases) {
      console.log(`Testing ${testCase.name}...`);
      
      try {
        const response = await axios.post(`${BASE_URL}/api/noti/schedule`, testCase.data, { headers });
        
        if (testCase.shouldFail) {
          console.log(`❌ ${testCase.name} should have failed but succeeded`);
        } else {
          console.log(`✅ ${testCase.name} succeeded as expected`);
        }
      } catch (error) {
        if (testCase.shouldFail) {
          console.log(`✅ ${testCase.name} failed as expected:`, error.response?.data?.message || error.message);
        } else {
          console.log(`❌ ${testCase.name} failed unexpectedly:`, error.response?.data?.message || error.message);
        }
      }
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
  } catch (error) {
    console.error('❌ Scheduled notification validation test failed:', error.response?.data || error.message);
  }
}

async function testScheduledNotificationBulkOperations() {
  console.log('\n📦 Testing Scheduled Notification Bulk Operations...');
  
  try {
    // Create multiple scheduled notifications
    console.log('Creating multiple scheduled notifications...');
    
    const notifications = [];
    for (let i = 1; i <= 5; i++) {
      const sendAt = new Date(Date.now() + (i * 30 * 60 * 1000)); // Every 30 minutes
      
      notifications.push({
        title: `Bulk Test Notification ${i}`,
        message: `This is bulk test notification number ${i}`,
        type: 'scheduled',
        sendAt: sendAt.toISOString(),
        recipients: { type: 'all' }
      });
    }
    
    const createdNotifications = [];
    
    for (const notification of notifications) {
      const response = await axios.post(`${BASE_URL}/api/noti/schedule`, notification, { headers });
      
      if (response.data.success) {
        createdNotifications.push(response.data.data._id);
        console.log(`✅ Created notification: ${notification.title}`);
      } else {
        console.log(`❌ Failed to create notification: ${notification.title}`);
      }
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Get all scheduled notifications
    console.log('Getting all scheduled notifications...');
    const getAllResponse = await axios.get(`${BASE_URL}/api/noti/scheduled?page=1&limit=20`, { headers });
    
    if (getAllResponse.data.success) {
      console.log(`✅ Found ${getAllResponse.data.data.notifications?.length || 0} scheduled notifications`);
    }
    
    // Clean up - delete created notifications
    console.log('Cleaning up created notifications...');
    for (const notificationId of createdNotifications) {
      try {
        await axios.delete(`${BASE_URL}/api/noti/scheduled/${notificationId}`, { headers });
        console.log(`✅ Deleted notification: ${notificationId}`);
      } catch (error) {
        console.log(`❌ Failed to delete notification: ${notificationId}`);
      }
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
  } catch (error) {
    console.error('❌ Scheduled notification bulk operations test failed:', error.response?.data || error.message);
  }
}

async function testScheduledNotificationWorker() {
  console.log('\n⚙️ Testing Scheduled Notification Worker...');
  
  try {
    // Create a notification scheduled for 2 minutes from now
    console.log('Creating notification scheduled for 2 minutes from now...');
    
    const sendAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now
    
    const notificationData = {
      title: 'Worker Test Notification',
      message: 'This notification should be processed by the worker in 2 minutes',
      type: 'scheduled',
      sendAt: sendAt.toISOString(),
      recipients: { type: 'all' }
    };
    
    const response = await axios.post(`${BASE_URL}/api/noti/schedule`, notificationData, { headers });
    
    if (response.data.success) {
      console.log('✅ Worker test notification created successfully');
      console.log(`⏰ Notification scheduled for: ${sendAt.toLocaleString()}`);
      console.log('🔄 The worker should process this notification automatically');
      
      // Wait for 3 minutes to see if the worker processes it
      console.log('⏳ Waiting 3 minutes to check if worker processed the notification...');
      
      setTimeout(async () => {
        try {
          const checkResponse = await axios.get(`${BASE_URL}/api/noti/scheduled/${response.data.data._id}`, { headers });
          
          if (checkResponse.data.success) {
            const notification = checkResponse.data.data;
            console.log(`📊 Notification status: ${notification.status}`);
            console.log(`📅 Sent at: ${notification.sentAt || 'Not sent yet'}`);
            
            if (notification.status === 'sent') {
              console.log('✅ Worker successfully processed the notification!');
            } else {
              console.log('⚠️ Worker has not processed the notification yet');
            }
          }
        } catch (error) {
          console.log('❌ Failed to check notification status:', error.response?.data?.message || error.message);
        }
      }, 3 * 60 * 1000); // 3 minutes
      
    } else {
      console.log('❌ Failed to create worker test notification:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Scheduled notification worker test failed:', error.response?.data || error.message);
  }
}

// Main function
async function main() {
  console.log('⏰ SCHEDULED NOTIFICATIONS TEST SUITE');
  console.log('=====================================');
  console.log(`🌐 API URL: ${BASE_URL}\n`);
  
  const args = process.argv.slice(2);
  
  if (args.includes('--crud')) {
    await testScheduledNotificationCRUD();
  } else if (args.includes('--types')) {
    await testScheduledNotificationTypes();
  } else if (args.includes('--recipients')) {
    await testScheduledNotificationRecipients();
  } else if (args.includes('--filters')) {
    await testScheduledNotificationFilters();
  } else if (args.includes('--validation')) {
    await testScheduledNotificationValidation();
  } else if (args.includes('--bulk')) {
    await testScheduledNotificationBulkOperations();
  } else if (args.includes('--worker')) {
    await testScheduledNotificationWorker();
  } else if (args.includes('--all')) {
    await testScheduledNotificationCRUD();
    await testScheduledNotificationTypes();
    await testScheduledNotificationRecipients();
    await testScheduledNotificationFilters();
    await testScheduledNotificationValidation();
    await testScheduledNotificationBulkOperations();
    await testScheduledNotificationWorker();
  } else {
    console.log('Usage:');
    console.log('  node test-scheduled-notifications.js --crud        # Test CRUD operations');
    console.log('  node test-scheduled-notifications.js --types       # Test different types');
    console.log('  node test-scheduled-notifications.js --recipients  # Test recipient types');
    console.log('  node test-scheduled-notifications.js --filters     # Test filters');
    console.log('  node test-scheduled-notifications.js --validation  # Test validation');
    console.log('  node test-scheduled-notifications.js --bulk        # Test bulk operations');
    console.log('  node test-scheduled-notifications.js --worker      # Test worker processing');
    console.log('  node test-scheduled-notifications.js --all         # Run all tests');
    console.log('');
    console.log('Examples:');
    console.log('  node test-scheduled-notifications.js --crud');
    console.log('  node test-scheduled-notifications.js --all');
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testScheduledNotificationCRUD,
  testScheduledNotificationTypes,
  testScheduledNotificationRecipients,
  testScheduledNotificationFilters,
  testScheduledNotificationValidation,
  testScheduledNotificationBulkOperations,
  testScheduledNotificationWorker
};

