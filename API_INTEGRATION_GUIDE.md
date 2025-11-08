# ShelfStacker Admin - API and Integration Guide

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh JWT token

### Books Management
- `GET /api/books/admin` - List all books
- `POST /api/books/admin` - Create new book
- `GET /api/books/admin/:id` - Get book details
- `PUT /api/books/admin/:id` - Update book
- `DELETE /api/books/admin/:id` - Delete book

### Orders Management
- `GET /api/orders/admin` - List all orders
- `GET /api/orders/admin/:id` - Get order details
- `PUT /api/orders/admin/:id/status` - Update order status
- `POST /api/orders/:id/zalopay-refund` - Refund ZaloPay order
- `POST /api/orders/:id/payos-refund` - Refund PayOS order

### User Management
- `GET /api/users/admin` - List all users
- `GET /api/users/admin/:id` - Get user details
- `PUT /api/users/admin/:id/status` - Update user status

### Categories Management
- `GET /api/admin/categories` - List all categories
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category

### Vouchers Management
- `GET /api/vouchers` - List all vouchers
- `POST /api/vouchers` - Create voucher
- `GET /api/vouchers/admin/:id` - Get voucher details
- `PUT /api/vouchers/admin/:id` - Update voucher
- `DELETE /api/vouchers/admin/:id` - Delete voucher

### Notifications Management
- `GET /api/admin/notifications/templates` - List notification templates
- `POST /api/admin/notifications/templates` - Create template
- `PUT /api/admin/notifications/templates/:id` - Update template
- `DELETE /api/admin/notifications/templates/:id` - Delete template
- `POST /api/admin/notifications/send` - Send notification
- `POST /api/admin/notifications/schedule` - Schedule notification
- `GET /api/admin/notifications/scheduled` - List scheduled notifications
- `DELETE /api/admin/notifications/scheduled/:id` - Cancel scheduled notification
- `GET /api/admin/notifications/history` - View notification history

### Statistics and Reports
- `GET /api/admin/statistics/dashboard` - Dashboard statistics
- `GET /api/admin/reports/sales` - Sales reports
- `GET /api/admin/statistics/orders` - Order statistics
- `GET /api/admin/statistics/revenue/category` - Revenue by category
- `GET /api/admin/statistics/revenue/time` - Revenue by time period

## UI Components

### Tables
```javascript
const table = UILibrary.Table.create({
    headers: ['ID', 'Name', 'Price', 'Actions'],
    columns: [
        { key: 'id' },
        { key: 'name' },
        { key: 'price' },
        { 
            key: 'actions',
            render: (row) => `
                <button onclick="editItem(${row.id})">Edit</button>
                <button onclick="deleteItem(${row.id})">Delete</button>
            `
        }
    ],
    data: items
});
```

### Forms
```javascript
const form = UILibrary.Form.create({
    fields: [
        {
            name: 'title',
            label: 'Title',
            type: 'text',
            required: true,
            validation: (value) => {
                if (value.length < 3) return 'Title must be at least 3 characters';
                return null;
            }
        },
        {
            name: 'category',
            label: 'Category',
            type: 'select',
            options: [
                { value: '1', label: 'Fiction' },
                { value: '2', label: 'Non-Fiction' }
            ]
        }
    ],
    onSubmit: async (data) => {
        try {
            await api.createBook(data);
            showSuccess('Book created successfully');
        } catch (error) {
            showError(error.message);
        }
    }
});
```

### Modals
```javascript
const modal = UILibrary.Modal.create({
    title: 'Edit Book',
    content: form,
    buttons: [
        {
            text: 'Cancel',
            class: 'btn-secondary',
            onClick: () => modal.close()
        },
        {
            text: 'Save',
            class: 'btn-primary',
            onClick: () => form.submit()
        }
    ]
});
```

## Error Handling

Use the DataHandler utility for consistent error handling:

```javascript
try {
    const response = await api.createBook(data);
    DataHandler.handleApiResponse(response);
} catch (error) {
    const errorInfo = DataHandler.handleError(error);
    showError(errorInfo.message);
}
```

## Integration Testing

To run the API integration tests:

1. Start the development server:
```bash
npm run dev
```

2. Run the tests:
```bash
npm run test:api
```

The tests will check:
- Authentication flow
- CRUD operations for books
- Order management
- Category management
- Error handling

## Development Workflow

1. Use the UI Library components for consistent interface
2. Implement proper validation using DataHandler
3. Handle all API responses and errors appropriately
4. Test all changes using the integration tests
5. Document any API or UI changes

## Best Practices

1. Always use the UI Library components for consistency
2. Implement proper input validation
3. Handle loading states appropriately
4. Use proper error handling
5. Test all API integrations
6. Keep documentation updated