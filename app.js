const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://shelf-stacker-admin.vercel.app', 'https://server-shelf-stacker-w1ds.onrender.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Add Content Security Policy
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "img-src 'self' data: https: http:; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; " +
        "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
        "font-src 'self' https://cdnjs.cloudflare.com; " +
        "connect-src 'self' http://localhost:3000 https://server-shelf-stacker-w1ds.onrender.com https://www.google.com"
    );
    next();
});

// Global error handlers
process.on('unhandledRejection', (err, promise) => {
    console.error('❌ Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});

// Middleware to check authentication
const checkAuth = (req, res, next) => {
    const publicPaths = ['/login', '/assets', '/components'];
    const isPublicPath = publicPaths.some(path => req.path.startsWith(path));
    
    if (isPublicPath) {
        return next();
    }

    // For API requests, check Authorization header
    if (req.path.startsWith('/api')) {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
    }
    // For page requests, we'll let them through and let client-side JS handle auth
    // The client-side code will check localStorage and redirect if needed
    
    next();
};

// Khai báo thư mục public chứa file tĩnh (css, js, img)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/components', express.static(path.join(__dirname, 'public', 'components')));

// Dashboard API Routes
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        // TODO: Replace with actual database queries
        const stats = {
            newOrders: 25,
            ordersChange: 15,
            totalVouchers: 150,
            vouchersChange: -5,
            newUsers: 42,
            usersChange: 20,
            revenue: 25000000,
            revenueChange: 12
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/dashboard/activities', async (req, res) => {
    try {
        // TODO: Replace with actual database queries
        const activities = [
            {
                type: 'order',
                message: 'Đơn hàng mới #1234 từ Nguyễn Văn A',
                timestamp: new Date()
            },
            {
                type: 'user',
                message: 'Người dùng mới đăng ký: tranb@email.com',
                timestamp: new Date(Date.now() - 900000)
            }
        ];
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/dashboard/orders-chart', async (req, res) => {
    try {
        const period = req.query.period || 'week';
        let labels, values;

        switch (period) {
            case 'week':
                labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
                values = [12, 19, 15, 25, 22, 30, 18];
                break;
            case 'month':
                labels = Array.from({length: 30}, (_, i) => i + 1);
                values = Array.from({length: 30}, () => Math.floor(Math.random() * 40) + 10);
                break;
            case 'year':
                labels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
                values = Array.from({length: 12}, () => Math.floor(Math.random() * 300) + 100);
                break;
        }

        res.json({ labels, values });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ==================== Main Admin Routes ====================
// Dashboard
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

// Products Management
app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'products.html'));
});

// Categories Management
app.get('/categories', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'categories.html'));
});

// Orders Management
app.get('/orders', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'orders.html'));
});

// Vouchers Management
app.get('/vouchers', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'vouchers.html'));
});

// Users Management
app.get('/users', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'users.html'));
});

// Notifications Management
app.get('/notifications', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'notifications.html'));
});

// Reports
app.get('/reports', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'reports.html'));
});

// Settings
app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'settings.html'));
});

// Profile
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});

// Parse JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// ==================== Legacy Routes (for backward compatibility) ====================
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/quanlydanhmuc', (req, res) => res.sendFile(path.join(__dirname, 'views', 'quanlydanhmuc.html')));
app.get('/danhgiasanpham', (req, res) => res.sendFile(path.join(__dirname, 'views', 'danhgiasanpham.html')));
app.get('/quanlynguoidung', (req, res) => res.sendFile(path.join(__dirname, 'views', 'quanlynguoidung.html')));
app.get('/danhmucdonhang', (req, res) => res.sendFile(path.join(__dirname, 'views', 'danhmucdonhang.html')));
app.get('/trashbooks', (req, res) => res.sendFile(path.join(__dirname, 'views', 'trashbooks.html')));
app.get('/danhmucdaxoa', (req, res) => res.sendFile(path.join(__dirname, 'views', 'danhmucdaxoa.html')));
app.get('/campaigns', (req, res) => res.sendFile(path.join(__dirname, 'views', 'campaigns.html')));
app.get('/thongbao', (req, res) => res.sendFile(path.join(__dirname, 'views', 'thongbao.html')));
app.get('/notification-admin', (req, res) => res.sendFile(path.join(__dirname, 'views', 'notification-admin.html')));

// NOTE: This project is a frontend/admin console only.
// All voucher-related APIs are provided by an external backend service.
// The frontend JS uses `public/assets/js/config.js` -> `base_url` to call that API.

// ==================== Root Route ====================
// Redirect to login if not authenticated, otherwise to dashboard
app.get('/', (req, res) => {
  // Check if user has token in cookie or will be checked client-side
  res.redirect('/login');
});

// Note: Authentication is handled client-side via localStorage token check
// The checkAuth middleware only validates API requests, not HTML page requests

const PORT = 3000;
// Lightweight proxy for legacy admin API paths -> external backend
const https = require('https');
const EXTERNAL_API = 'server-shelf-stacker-w1ds.onrender.com';

// Explicit mappings for common admin actions so FE can call legacy routes
app.post('/api/v1/admin/vouchers/:id/archive', express.json(), (req, res) => {
  // Translate to PUT /api/vouchers/:id { is_deleted: true }
  const id = req.params.id;
  const body = { is_deleted: true };
  const headers = { 'Content-Type': 'application/json' };
  if (req.headers && req.headers.authorization) headers['Authorization'] = req.headers.authorization;
  const options = {
    hostname: EXTERNAL_API,
    path: `/api/vouchers/${id}`,
    method: 'PUT',
    headers
  };
  const proxyReq = https.request(options, proxyRes => {
    res.statusCode = proxyRes.statusCode;
    proxyRes.pipe(res);
  }).on('error', err => res.status(502).json({ message: 'Bad Gateway', error: err.message }));
  proxyReq.write(JSON.stringify(body)); proxyReq.end();
});

app.post('/api/v1/admin/vouchers/:id/restore', express.json(), (req, res) => {
  // Translate to PUT /api/vouchers/:id { is_deleted: false }
  const id = req.params.id;
  const body = { is_deleted: false };
  const headers = { 'Content-Type': 'application/json' };
  if (req.headers && req.headers.authorization) headers['Authorization'] = req.headers.authorization;
  const options = {
    hostname: EXTERNAL_API,
    path: `/api/vouchers/${id}`,
    method: 'PUT',
    headers
  };
  const proxyReq = https.request(options, proxyRes => {
    res.statusCode = proxyRes.statusCode;
    proxyRes.pipe(res);
  }).on('error', err => res.status(502).json({ message: 'Bad Gateway', error: err.message }));
  proxyReq.write(JSON.stringify(body)); proxyReq.end();
});

app.delete('/api/v1/admin/vouchers/:id/hard', (req, res) => {
  // Translate to DELETE /api/vouchers/:id
  const id = req.params.id;
  const headers = {};
  if (req.headers && req.headers.authorization) headers['Authorization'] = req.headers.authorization;
  const options = {
    hostname: EXTERNAL_API,
    path: `/api/vouchers/${id}`,
    method: 'DELETE',
    headers
  };
  const proxyReq = https.request(options, proxyRes => {
    res.statusCode = proxyRes.statusCode;
    proxyRes.pipe(res);
  }).on('error', err => res.status(502).json({ message: 'Bad Gateway', error: err.message }));
  proxyReq.end();
});

app.use('/api/v1/admin/vouchers', (req, res) => {
  try {
    // Build path on external API
    const targetPath = req.originalUrl.replace(/^\/api\/v1\/admin\/vouchers/, '/api/vouchers');
    const options = {
      hostname: EXTERNAL_API,
      path: targetPath,
      method: req.method,
      headers: { ...req.headers }
    };
    // Remove hop-by-hop headers that should not be forwarded
    delete options.headers['host'];
    delete options.headers['content-length'];
    const proxyReq = https.request(options, proxyRes => {
      res.statusCode = proxyRes.statusCode;
      // copy response headers
      Object.entries(proxyRes.headers).forEach(([k, v]) => res.setHeader(k, v));
      proxyRes.pipe(res);
    });
    proxyReq.on('error', err => {
      res.status(502).json({ message: 'Bad Gateway', error: err.message });
    });
    // forward body (JSON)
    if (req.body && Object.keys(req.body).length) {
      const body = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(body));
      proxyReq.write(body);
      proxyReq.end();
    } else {
      // pipe raw for other methods without parsed JSON
      if (req.readable) req.pipe(proxyReq); else proxyReq.end();
    }
  } catch (err) {
    res.status(500).json({ message: 'Proxy error', error: err.message });
  }
});

// Statistics API proxy - forward to external backend
app.use('/api/admin/statistics', (req, res) => {
  try {
    // Build path on external API (keep the same path)
    const targetPath = req.originalUrl;
    const options = {
      hostname: EXTERNAL_API,
      path: targetPath,
      method: req.method,
      headers: { ...req.headers }
    };
    // Remove hop-by-hop headers that should not be forwarded
    delete options.headers['host'];
    delete options.headers['content-length'];
    
    const proxyReq = https.request(options, proxyRes => {
      res.statusCode = proxyRes.statusCode;
      // copy response headers
      Object.entries(proxyRes.headers).forEach(([k, v]) => res.setHeader(k, v));
      proxyRes.pipe(res);
    });
    
    proxyReq.on('error', err => {
      res.status(502).json({ message: 'Bad Gateway', error: err.message });
    });
    
    // forward body (JSON) if present
    if (req.body && Object.keys(req.body).length) {
      const body = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(body));
      proxyReq.write(body);
      proxyReq.end();
    } else {
      // pipe raw for other methods without parsed JSON
      if (req.readable) req.pipe(proxyReq); else proxyReq.end();
    }
  } catch (err) {
    res.status(500).json({ message: 'Proxy error', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
