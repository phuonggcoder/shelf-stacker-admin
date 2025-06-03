// server.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Hỗ trợ biến môi trường

// Serve static files từ thư mục 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Route trang chính
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
