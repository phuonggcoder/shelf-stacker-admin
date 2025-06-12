const express = require('express');
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/home.html', (req, res) => res.sendFile(path.join(__dirname, 'views', 'home.html')));

app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/quanlydanhmuc.html', (req, res) => res.sendFile(path.join(__dirname, 'views', 'quanlydanhmuc.html')));
app.get('/danhgiasanpham.html', (req, res) => res.sendFile(path.join(__dirname, 'views', 'danhgiasanpham.html')));
app.get('/quanlynguoidung.html', (req, res) => res.sendFile(path.join(__dirname, 'views', 'quanlynguoidung.html')));
app.get('/danhgia.html', (req, res) => res.sendFile(path.join(__dirname, 'views', 'danhgia.html')));
app.get('/danhmucdonhang.html', (req, res) => res.sendFile(path.join(__dirname, 'views', 'danhmucdonhang.html')));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});