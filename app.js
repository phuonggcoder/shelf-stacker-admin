const express = require('express');
const path = require('path');

const app = express();

// Khai báo thư mục public chứa file tĩnh (css, js, img)
app.use(express.static(path.join(__dirname, 'public')));

// Các route không cần .html
app.get('/home', (req, res) => res.sendFile(path.join(__dirname, 'views', 'home.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/quanlydanhmuc', (req, res) => res.sendFile(path.join(__dirname, 'views', 'quanlydanhmuc.html')));
app.get('/danhgiasanpham', (req, res) => res.sendFile(path.join(__dirname, 'views', 'danhgiasanpham.html')));
app.get('/quanlynguoidung', (req, res) => res.sendFile(path.join(__dirname, 'views', 'quanlynguoidung.html')));
app.get('/danhmucdonhang', (req, res) => res.sendFile(path.join(__dirname, 'views', 'danhmucdonhang.html')));
app.get('/trashbooks', (req, res) => res.sendFile(path.join(__dirname, 'views', 'trashbooks.html')));
app.get('/danhmucdaxoa', (req, res) => res.sendFile(path.join(__dirname, 'views', 'danhmucdaxoa.html')));
app.get('/voucher', (req, res) => res.sendFile(path.join(__dirname, 'views', 'voucher.html')));
app.get('/khoiphucvoucher', (req, res) => res.sendFile(path.join(__dirname, 'views', 'khoiphucvoucher.html')));
app.get('/campaigns', (req, res) => res.sendFile(path.join(__dirname, 'views', 'campaigns.html')));
app.get('/thongbao', (req, res) => res.sendFile(path.join(__dirname, 'views', 'thongbao.html')));
app.get('/notification-admin', (req, res) => res.sendFile(path.join(__dirname, 'views', 'notification-admin.html')));
app.get('/category-products', (req, res) => res.sendFile(path.join(__dirname, 'views', 'category-products.html')));
app.get('/admin-email-verification', (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin-email-verification.html')));

// Chuyển hướng trang chủ về /login
app.get('/', (req, res) => {
  res.redirect('/login');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
