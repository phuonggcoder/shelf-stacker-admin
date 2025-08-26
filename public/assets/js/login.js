document.getElementById('loginBtn').addEventListener('click', async function () {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorMsg = document.getElementById('errorMsg');
  const toast = document.getElementById('toast');

  errorMsg.textContent = '';

  if (!email || !password) {
    errorMsg.textContent = 'Vui lòng nhập đầy đủ email và mật khẩu.';
    return;
  }

  try {
    const response = await fetch('https://server-shelf-stacker-w1ds.onrender.com/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Hiển thị thông báo thành công
      toast.textContent = 'Đăng nhập thành công!';
      toast.classList.add('show');
      
      // Lưu dữ liệu vào localStorage
      localStorage.setItem('authToken', data.access_token);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userData', JSON.stringify(data.user));

      // Ẩn thông báo sau 2 giây và chuyển hướng
      setTimeout(() => {
        toast.classList.remove('show');
        window.location.href = 'home';
      }, 2000);
    } else {
      errorMsg.textContent = data.message || 'Email hoặc mật khẩu không đúng.';
    }
  } catch (error) {
    errorMsg.textContent = 'Không thể kết nối đến máy chủ. Vui lòng thử lại.';
    console.error(error);
  }
});