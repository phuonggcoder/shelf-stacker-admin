document.getElementById('loginBtn').addEventListener('click', async function () {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorMsg = document.getElementById('errorMsg');

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
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      if (data.user && data.user.id) {
        localStorage.setItem('userId', data.user.id);
      }

      window.location.href = 'home';
    } else {
      errorMsg.textContent = data.message || 'Email hoặc mật khẩu không đúng.';
    }
  } catch (error) {
    errorMsg.textContent = 'Không thể kết nối đến máy chủ. Vui lòng thử lại.';
    console.error(error);
  }
});