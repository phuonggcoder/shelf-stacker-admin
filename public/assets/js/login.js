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
          window.location.href = 'home';
        } else {
          errorMsg.textContent = data.message || 'Tên người dùng hoặc mật khẩu không đúng.';
        }
      } catch (error) {
        errorMsg.textContent = 'Không thể kết nối đến máy chủ. Vui lòng thử lại.';
        console.error(error);
      }
    });