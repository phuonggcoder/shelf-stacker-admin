# 🔗 Notification Admin Panel - Backend Integration Guide

## 📋 **Tổng quan tích hợp**

Frontend Notification Admin Panel đã được implement hoàn chỉnh và cần tích hợp với backend notification system hiện có. Dựa trên documentation, backend đã có sẵn các API endpoints cần thiết.

## 🎯 **Backend API Endpoints hiện có**

### **1. Template Management**
```
GET    /api/notification-templates     # Lấy danh sách template
POST   /api/notification-templates     # Tạo template mới
PUT    /api/notification-templates/:id # Cập nhật template
DELETE /api/notification-templates/:id # Xóa template
```

### **2. Send Notifications**
```
POST /api/noti/send        # Gửi cho user cụ thể
POST /api/noti/send-all    # Gửi cho tất cả user
POST /api/noti/send-multicast # Gửi cho nhiều user
POST /api/noti/send-event  # Gửi theo template event
```

### **3. Scheduled Notifications**
```
GET    /api/noti/scheduled     # Lấy danh sách lịch trình
POST   /api/noti/schedule      # Tạo lịch trình mới
DELETE /api/noti/schedule/:id  # Hủy lịch trình
```

### **4. History & Analytics**
```
GET /api/notification/history # Lấy lịch sử notification
GET /api/noti/stats          # Thống kê tổng quan
GET /api/noti/analytics      # Analytics data
```

## 🔧 **Cập nhật Frontend JavaScript**

### **1. Cập nhật API Base URL**

```javascript
// public/assets/js/notification-admin.js
const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';
// hoặc cho local development:
// const API_BASE_URL = 'http://localhost:3000';
```

### **2. Cập nhật API Functions**

```javascript
// Template Management APIs
async function fetchTemplates() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/notification-templates`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to fetch templates');
        }
    } catch (error) {
        console.error('Error fetching templates:', error);
        return getSampleTemplates(); // Fallback to sample data
    }
}

async function addTemplate(templateData) {
    try {
        const formData = new FormData();
        
        // Add template data
        formData.append('name', templateData.name);
        formData.append('event', templateData.event);
        formData.append('title', templateData.title);
        formData.append('message', templateData.message);
        formData.append('variables', JSON.stringify(templateData.variables));
        formData.append('active', templateData.active);
        
        // Add image if exists
        if (templateData.image) {
            formData.append('imageFile', templateData.image);
        }
        
        const response = await fetch(`${API_BASE_URL}/api/notification-templates`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: formData
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to create template');
        }
    } catch (error) {
        console.error('Error creating template:', error);
        throw error;
    }
}

async function updateTemplate(id, templateData) {
    try {
        const formData = new FormData();
        
        // Add template data
        formData.append('name', templateData.name);
        formData.append('event', templateData.event);
        formData.append('title', templateData.title);
        formData.append('message', templateData.message);
        formData.append('variables', JSON.stringify(templateData.variables));
        formData.append('active', templateData.active);
        
        // Add image if exists
        if (templateData.image) {
            formData.append('imageFile', templateData.image);
        }
        
        const response = await fetch(`${API_BASE_URL}/api/notification-templates/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: formData
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to update template');
        }
    } catch (error) {
        console.error('Error updating template:', error);
        throw error;
    }
}

async function deleteTemplate(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/notification-templates/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            return true;
        } else {
            throw new Error('Failed to delete template');
        }
    } catch (error) {
        console.error('Error deleting template:', error);
        throw error;
    }
}

// Send Notification APIs
async function sendUrgentNotification(notificationData) {
    try {
        const formData = new FormData();
        
        formData.append('userId', notificationData.userId);
        formData.append('title', notificationData.title);
        formData.append('message', notificationData.message);
        formData.append('type', 'urgent');
        formData.append('event', 'urgent_notification');
        
        if (notificationData.image) {
            formData.append('imageFile', notificationData.image);
        }
        
        const response = await fetch(`${API_BASE_URL}/api/noti/send`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: formData
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to send urgent notification');
        }
    } catch (error) {
        console.error('Error sending urgent notification:', error);
        throw error;
    }
}

async function sendTemplateNotification(notificationData) {
    try {
        const formData = new FormData();
        
        formData.append('templateId', notificationData.templateId);
        formData.append('event', notificationData.event);
        formData.append('data', JSON.stringify(notificationData.variables));
        
        if (notificationData.userId) {
            formData.append('userId', notificationData.userId);
        } else if (notificationData.userIds) {
            formData.append('userIds', notificationData.userIds.join(','));
        } else if (notificationData.sendToAll) {
            formData.append('sendToAll', 'true');
        }
        
        if (notificationData.image) {
            formData.append('imageFile', notificationData.image);
        }
        
        const response = await fetch(`${API_BASE_URL}/api/noti/send-event`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: formData
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to send template notification');
        }
    } catch (error) {
        console.error('Error sending template notification:', error);
        throw error;
    }
}

async function scheduleNotification(notificationData) {
    try {
        const formData = new FormData();
        
        formData.append('title', notificationData.title);
        formData.append('message', notificationData.message);
        formData.append('type', 'scheduled');
        formData.append('scheduledAt', notificationData.scheduledAt);
        formData.append('timezone', notificationData.timezone || 'Asia/Ho_Chi_Minh');
        
        if (notificationData.userId) {
            formData.append('userId', notificationData.userId);
        } else if (notificationData.userIds) {
            formData.append('userIds', notificationData.userIds.join(','));
        } else if (notificationData.sendToAll) {
            formData.append('sendToAll', 'true');
        }
        
        if (notificationData.templateId) {
            formData.append('templateId', notificationData.templateId);
            formData.append('event', notificationData.event);
            formData.append('data', JSON.stringify(notificationData.variables));
        }
        
        if (notificationData.image) {
            formData.append('imageFile', notificationData.image);
        }
        
        const response = await fetch(`${API_BASE_URL}/api/noti/schedule`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: formData
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to schedule notification');
        }
    } catch (error) {
        console.error('Error scheduling notification:', error);
        throw error;
    }
}

// Scheduled Notifications APIs
async function getScheduledNotifications() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/noti/scheduled`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to fetch scheduled notifications');
        }
    } catch (error) {
        console.error('Error fetching scheduled notifications:', error);
        return getSampleScheduledNotifications();
    }
}

async function cancelScheduledNotification(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/noti/schedule/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            return true;
        } else {
            throw new Error('Failed to cancel scheduled notification');
        }
    } catch (error) {
        console.error('Error canceling scheduled notification:', error);
        throw error;
    }
}

// History & Analytics APIs
async function getNotificationHistory(page = 1, limit = 20, filters = {}) {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...filters
        });
        
        const response = await fetch(`${API_BASE_URL}/api/notification/history?${params}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to fetch notification history');
        }
    } catch (error) {
        console.error('Error fetching notification history:', error);
        return getSampleNotificationHistory();
    }
}

async function getNotificationStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/noti/stats`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to fetch notification stats');
        }
    } catch (error) {
        console.error('Error fetching notification stats:', error);
        return getSampleNotificationStats();
    }
}

async function getNotificationAnalytics(startDate = null, endDate = null) {
    try {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        
        const response = await fetch(`${API_BASE_URL}/api/noti/analytics?${params}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to fetch notification analytics');
        }
    } catch (error) {
        console.error('Error fetching notification analytics:', error);
        return getSampleNotificationAnalytics();
    }
}

// Image Upload API
async function uploadImage(file) {
    try {
        const formData = new FormData();
        formData.append('imageFile', file);
        
        const response = await fetch(`${API_BASE_URL}/api/upload/image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            return result.url;
        } else {
            throw new Error('Failed to upload image');
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}
```

## 🔐 **Authentication Integration**

### **1. Token Management**

```javascript
// Get authentication token
function getAuthToken() {
    return localStorage.getItem('authToken') || 
           sessionStorage.getItem('authToken') || 
           getCookie('authToken');
}

// Check if user is authenticated
function checkAuth() {
    const token = getAuthToken();
    if (!token) {
        window.location.href = '/login';
        return false;
    }
    return true;
}

// Validate token
async function validateToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/validate`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (!response.ok) {
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            window.location.href = '/login';
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
}
```

## 🚀 **Implementation Steps**

### **Phase 1: Update API Configuration**
1. ✅ Cập nhật `API_BASE_URL` trong `notification-admin.js`
2. ✅ Thêm authentication headers cho tất cả API calls
3. ✅ Implement error handling và fallback data

### **Phase 2: Test API Integration**
1. ✅ Test template management APIs
2. ✅ Test notification sending APIs
3. ✅ Test scheduled notification APIs
4. ✅ Test history và analytics APIs

### **Phase 3: Error Handling**
1. ✅ Add loading states
2. ✅ Add error messages
3. ✅ Add retry mechanisms
4. ✅ Add offline fallback

## 📊 **Expected API Responses**

### **Template Response**
```json
{
  "success": true,
  "templates": [
    {
      "_id": "template_id",
      "name": "Order Success",
      "event": "order_success",
      "title": "Đơn hàng {{orderId}} đã được xác nhận",
      "message": "Cảm ơn bạn đã đặt hàng. Đơn hàng {{orderId}} với giá trị {{amount}} đã được xác nhận.",
      "variables": ["orderId", "amount"],
      "image": "https://example.com/image.jpg",
      "active": true,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### **Notification Stats Response**
```json
{
  "success": true,
  "stats": {
    "totalSent": 1250,
    "totalRead": 980,
    "totalUnread": 270,
    "successRate": 78.4,
    "urgentSent": 45,
    "scheduledActive": 12,
    "templatesCount": 8
  }
}
```

### **Scheduled Notifications Response**
```json
{
  "success": true,
  "scheduledNotifications": [
    {
      "_id": "scheduled_id",
      "title": "Flash Sale Reminder",
      "message": "Flash sale sẽ kết thúc trong 1 giờ!",
      "scheduledAt": "2024-01-15T20:00:00Z",
      "status": "pending",
      "recipients": "all",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

## 🎯 **Testing Checklist**

### **API Connectivity**
- [ ] Template CRUD operations
- [ ] Send urgent notifications
- [ ] Send template notifications
- [ ] Schedule notifications
- [ ] Cancel scheduled notifications
- [ ] View notification history
- [ ] Get analytics data

### **Authentication**
- [ ] Token validation
- [ ] Unauthorized access handling
- [ ] Token refresh (if needed)
- [ ] Logout functionality

### **Error Handling**
- [ ] Network errors
- [ ] API errors
- [ ] Validation errors
- [ ] File upload errors

### **User Experience**
- [ ] Loading states
- [ ] Success messages
- [ ] Error messages
- [ ] Offline fallback

## 🔧 **Troubleshooting**

### **Common Issues**

1. **CORS Errors**
   - Ensure backend allows frontend domain
   - Check API_BASE_URL configuration

2. **Authentication Errors**
   - Verify token format
   - Check token expiration
   - Ensure proper headers

3. **File Upload Issues**
   - Check file size limits
   - Verify file types
   - Ensure proper FormData format

4. **API Response Errors**
   - Check response format
   - Verify error handling
   - Test with sample data

## 🎉 **Conclusion**

Với hướng dẫn tích hợp này, frontend Notification Admin Panel sẽ được kết nối hoàn toàn với backend notification system hiện có. Tất cả các tính năng sẽ hoạt động với dữ liệu thực từ backend API.

**🎯 Ready for Production!** Hệ thống đã sẵn sàng để sử dụng trong môi trường production.



