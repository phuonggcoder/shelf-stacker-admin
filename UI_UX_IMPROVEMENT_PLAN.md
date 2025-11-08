# UI/UX Improvement Plan

## Voucher Management Improvements

### Current Issues
1. Voucher creation form missing fields:
   - max_per_user
   - start_date
   - end_date
   - Proper validation for voucher_id format (A-Z0-9)
   
2. API Integration Issues:
   - No proper error handling for API responses
   - Missing loading states during API calls
   - No validation messages matching API requirements

### Proposed Changes
1. Update `vouchers-admin.html`:
```html
<form id="voucher-form">
  <label>Voucher Code (A-Z0-9 only)
    <input name="voucher_id" pattern="[A-Z0-9]+" required>
  </label>
  
  <label>Maximum Uses Per User
    <input name="max_per_user" type="number" min="1" required>
  </label>
  
  <label>Start Date
    <input name="start_date" type="datetime-local" required>
  </label>
  
  <label>End Date
    <input name="end_date" type="datetime-local" required>
  </label>
  
  <!-- Add more fields -->
</form>
```

2. Add proper loading states and error handling:
```html
<div class="loading-indicator" id="api-loading">
  Processing...
</div>

<div class="error-message" id="api-error">
</div>
```

## Order Management Improvements

### Current Issues
1. Missing refund UI:
   - No dedicated buttons for ZaloPay/PayOS refunds
   - No confirmation dialogs
   - No status feedback

2. Filtering capabilities:
   - Missing date range filter
   - Missing status filter
   - No search by order ID

### Proposed Changes
1. Add refund controls to order view:
```html
<div class="refund-controls">
  <button class="btn-refund zalopay">
    Refund via ZaloPay
  </button>
  
  <button class="btn-refund payos">
    Refund via PayOS
  </button>
  
  <div class="refund-confirmation-dialog">
    <!-- Add confirmation UI -->
  </div>
</div>
```

2. Add filtering controls:
```html
<div class="order-filters">
  <input type="date" class="date-filter" name="start_date">
  <input type="date" class="date-filter" name="end_date">
  
  <select name="status">
    <option value="">All Statuses</option>
    <option value="pending">Pending</option>
    <option value="processing">Processing</option>
    <option value="completed">Completed</option>
    <option value="refunded">Refunded</option>
  </select>
  
  <input type="text" name="order_id" placeholder="Search by Order ID">
</div>
```

## General UI/UX Improvements

1. Add loading states for all API calls
2. Implement toast notifications for success/error messages
3. Add field validation matching API requirements
4. Implement responsive design fixes
5. Add keyboard shortcuts for common actions
6. Implement real-time updates where applicable

## Implementation Priority

1. Critical Fixes:
   - Add missing form fields
   - Implement proper error handling
   - Add refund UI components

2. Important Improvements:
   - Add filtering capabilities
   - Implement loading states
   - Add validation

3. Nice-to-have:
   - Keyboard shortcuts
   - Real-time updates
   - Dark mode support

## Testing Checklist

For each change:
1. Test API integration
2. Verify error handling
3. Test responsive design
4. Verify accessibility
5. Test cross-browser compatibility

## Next Steps

1. Create tickets for each improvement
2. Prioritize critical fixes
3. Update API integration tests
4. Implement changes incrementally
5. Test thoroughly before deployment