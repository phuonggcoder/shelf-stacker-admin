document.getElementById('loginBtn').addEventListener('click', async function () {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorMsg = document.getElementById('errorMsg');

  errorMsg.textContent = '';

  if (!username || !password) {
    errorMsg.textContent = 'Vui lòng nhập đầy đủ tên người dùng và mật khẩu.';
    return;
  }

  try {
    const response = await fetch('https://server-shelf-stacker.onrender.com/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      if (data.user && data.user.id) {
        localStorage.setItem('userId', data.user.id);  // Sửa từ _id thành id
      }

      window.location.href = 'home';  // hoặc đường dẫn trang chính
    } else {
      errorMsg.textContent = data.message || 'Tên người dùng hoặc mật khẩu không đúng.';
    }
  } catch (error) {
    errorMsg.textContent = 'Không thể kết nối đến máy chủ. Vui lòng thử lại.';
    console.error(error);
  }
});
