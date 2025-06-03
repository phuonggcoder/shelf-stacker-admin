const express = require('express');
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'home.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'views', 'register.html')));
app.get('/detail', (req, res) => res.sendFile(path.join(__dirname, 'views', 'detail.html')));

app.get('/danhgia', (req, res) => res.sendFile(path.join(__dirname, 'views', 'danhgia.html')));
app.get('/danhgiasanpham', (req, res) =>
  res.sendFile(path.join(__dirname, 'views', 'danhgiasanpham.html'))
);


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});