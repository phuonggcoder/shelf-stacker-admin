if (!localStorage.getItem('authToken')) {
      const loginDialog = document.getElementById('loginDialog');
      if (loginDialog) loginDialog.showModal();
    }

    function toggleMenu(id) {
      const el = document.getElementById(id);
      if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }

    // Sidebar toggle
    const settingsLink = document.getElementById('settingsLink');
    if (settingsLink) {
      settingsLink.addEventListener('click', () => {
        const mainSidebar = document.getElementById('mainSidebar');
        const settingsSidebar = document.getElementById('settingsSidebar');
        if (mainSidebar) mainSidebar.classList.add('hidden');
        if (settingsSidebar) settingsSidebar.classList.remove('hidden');
      });
    }

    const backButton = document.getElementById('backButton');
    if (backButton) {
      backButton.addEventListener('click', () => {
        const settingsSidebar = document.getElementById('settingsSidebar');
        const mainSidebar = document.getElementById('mainSidebar');
        if (settingsSidebar) settingsSidebar.classList.add('hidden');
        if (mainSidebar) mainSidebar.classList.remove('hidden');
      });
    }

    // Show edit profile dialog
    const editProfileButton = document.getElementById('editProfileButton');
    if (editProfileButton) {
      editProfileButton.addEventListener('click', () => {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const editFullName = document.getElementById('editFullName');
        const editPhoneNumber = document.getElementById('editPhoneNumber');
        const editBirthDate = document.getElementById('editBirthDate');
        const editGender = document.getElementById('editGender');
        const editEmail = document.getElementById('editEmail');
        const editUsername = document.getElementById('editUsername');
        const editProfileDialog = document.getElementById('editProfileDialog');

        if (editFullName) editFullName.value = userData.full_name || '';
        if (editPhoneNumber) editPhoneNumber.value = userData.phone_number || '';
        if (editBirthDate) editBirthDate.value = userData.birth_date || '1990-01-01';
        if (editGender) editGender.value = userData.gender || 'male';
        if (editEmail) editEmail.value = userData.email || '';
        if (editUsername) editUsername.value = userData.username || '';
        if (editProfileDialog) editProfileDialog.showModal();
      });
    }

    // Cancel edit profile
    const cancelProfileButton = document.getElementById('cancelProfileButton');
    if (cancelProfileButton) {
      cancelProfileButton.addEventListener('click', () => {
        const editProfileDialog = document.getElementById('editProfileDialog');
        if (editProfileDialog) editProfileDialog.close();
      });
    }

    // Save profile changes
    const saveProfileButton = document.getElementById('saveProfileButton');
    if (saveProfileButton) {
      saveProfileButton.addEventListener('click', () => {
        const fullName = document.getElementById('editFullName')?.value;
        const phoneNumber = document.getElementById('editPhoneNumber')?.value;
        const birthDate = document.getElementById('editBirthDate')?.value;
        const gender = document.getElementById('editGender')?.value;
        const email = document.getElementById('editEmail')?.value;
        const username = document.getElementById('editUsername')?.value;
        const editProfileMessage = document.getElementById('editProfileMessage');
        const editProfileDialog = document.getElementById('editProfileDialog');

        const data = {
          full_name: fullName,
          phone_number: phoneNumber,
          birth_date: birthDate,
          gender: gender,
          email: email,
          username: username
        };

        const token = localStorage.getItem('authToken');

        fetch('https://server-shelf-stacker-w1ds.onrender.com/auth/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
          if (editProfileMessage) {
            if (data.message === 'User updated successfully') {
              localStorage.setItem('userData', JSON.stringify(data.user));
              editProfileMessage.textContent = 'Cập nhật thông tin thành công';
              editProfileMessage.className = 'notification';
              setTimeout(() => {
                if (editProfileDialog) editProfileDialog.close();
              }, 2000);
            } else {
              editProfileMessage.textContent = 'Cập nhật thất bại: ' + (data.error || 'Lỗi không xác định');
              editProfileMessage.className = 'notification error-message';
            }
            editProfileMessage.style.display = 'block';
            setTimeout(() => {
              if (editProfileMessage) editProfileMessage.style.display = 'none';
            }, 3000);
          }
        })
        .catch(error => {
          if (editProfileMessage) {
            editProfileMessage.textContent = 'Lỗi: ' + error.message;
            editProfileMessage.className = 'notification error-message';
            editProfileMessage.style.display = 'block';
            setTimeout(() => {
              if (editProfileMessage) editProfileMessage.style.display = 'none';
            }, 3000);
          }
        });
      });
    }

    // Login functionality
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userAvatar');
        localStorage.removeItem('userId');
        const loginDialog = document.getElementById('loginDialog');
        if (loginDialog) loginDialog.showModal();
      });
    }

    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
      loginButton.addEventListener('click', () => {
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;
        const loginMessage = document.getElementById('loginMessage');
        const loginDialog = document.getElementById('loginDialog');

        const data = {
          email: email,
          password: password
        };

        fetch('https://server-shelf-stacker-w1ds.onrender.com/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
          if (loginMessage) {
            if (data.message === 'Login successful') {
              localStorage.setItem('authToken', data.access_token);
              loginMessage.textContent = 'Đăng nhập thành công';
              loginMessage.className = 'notification';
              if (loginDialog) loginDialog.close();
              location.reload();
            } else {
              loginMessage.textContent = 'Đăng nhập thất bại: ' + (data.error || 'Lỗi không xác định');
              loginMessage.className = 'notification error-message';
            }
            loginMessage.style.display = 'block';
            setTimeout(() => {
              if (loginMessage) loginMessage.style.display = 'none';
            }, 3000);
          }
        })
        .catch(error => {
          if (loginMessage) {
            loginMessage.textContent = 'Lỗi: ' + error.message;
            loginMessage.className = 'notification error-message';
            loginMessage.style.display = 'block';
            setTimeout(() => {
              if (loginMessage) loginMessage.style.display = 'none';
            }, 3000);
          }
        });
      });
    }

    // Avatar upload
    const uploadDialog = document.getElementById('uploadDialog');
    const uploadMessage = document.getElementById('uploadMessage');
    const uploadButton = document.getElementById('uploadButton');
    const cancelButton = document.getElementById('cancelButton');
    const sidebarAvatar = document.getElementById('sidebarAvatar');

    if (sidebarAvatar) {
      sidebarAvatar.onclick = () => {
        if (uploadDialog) {
          uploadDialog.showModal();
          resetUploadDialog();
        }
      };
    }

    if (cancelButton) {
      cancelButton.onclick = () => {
        if (uploadDialog) uploadDialog.close();
      };
    }

    if (uploadDialog) {
      uploadDialog.addEventListener('close', () => {
        resetUploadDialog();
      });
    }

    function resetUploadDialog() {
      const avatarUpload = document.getElementById('avatarUpload');
      if (avatarUpload) avatarUpload.value = '';
      if (uploadMessage) {
        uploadMessage.style.display = 'none';
        uploadMessage.textContent = '';
        uploadMessage.className = 'notification';
      }
      if (uploadButton) {
        uploadButton.disabled = false;
        uploadButton.textContent = 'Tải lên';
      }
    }

    if (uploadButton) {
      uploadButton.onclick = async (event) => {
        event.preventDefault();
        const fileInput = document.getElementById('avatarUpload');
        const file = fileInput?.files[0];

        if (!file) {
          alert('Vui lòng chọn một ảnh.');
          return;
        }

        if (!file.type.startsWith('image/')) {
          alert('Vui lòng chọn một file ảnh hợp lệ.');
          return;
        }

        const token = localStorage.getItem('authToken');
        const userId = localStorage.getItem('userId');

        if (!token) {
          alert('Bạn chưa đăng nhập hoặc token không hợp lệ. Vui lòng đăng nhập lại.');
          return;
        }

        if (!userId) {
          alert('Thiếu userId. Vui lòng đăng nhập lại.');
          return;
        }

        if (uploadButton) {
          uploadButton.disabled = true;
          uploadButton.textContent = 'Đang tải...';
        }

        try {
          const formData = new FormData();
          formData.append('userId', userId);
          formData.append('avatar', file);

          const response = await fetch('https://server-shelf-stacker-w1ds.onrender.com/api/user-upload/avatar', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });

          if (!response.ok) {
            let errorMsg = 'Lỗi khi tải ảnh lên';
            try {
              const errData = await response.json();
              if (errData.message) errorMsg = errData.message;
            } catch {}
            throw new Error(errorMsg);
          }

          const data = await response.json();

          const imageUrl = data.avatar || URL.createObjectURL(file);

          const sidebarAvatar = document.getElementById('sidebarAvatar');
          const headerAvatar = document.getElementById('headerAvatar');
          if (sidebarAvatar) sidebarAvatar.src = imageUrl;
          if (headerAvatar) headerAvatar.src = imageUrl;

          localStorage.setItem('userAvatar', imageUrl);

          if (uploadMessage) {
            uploadMessage.style.display = 'block';
            uploadMessage.textContent = 'Đã cập nhật ảnh đại diện thành công!';
            uploadMessage.className = 'notification success-message';
          }

          setTimeout(() => {
            if (uploadDialog) uploadDialog.close();
          }, 2000);

        } catch (error) {
          if (uploadMessage) {
            uploadMessage.style.display = 'block';
            uploadMessage.textContent = 'Lỗi: ' + error.message;
            uploadMessage.className = 'notification error-message';
          }
          if (uploadButton) {
            uploadButton.disabled = false;
            uploadButton.textContent = 'Tải lên';
          }
        }
      };
    }

    // Load user data on page load
    window.onload = () => {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const savedAvatar = localStorage.getItem('userAvatar');
      const sidebarAvatar = document.getElementById('sidebarAvatar');
      const headerAvatar = document.getElementById('headerAvatar');
      
      if (sidebarAvatar && savedAvatar) {
        sidebarAvatar.src = savedAvatar;
      }
      if (headerAvatar && savedAvatar) {
        headerAvatar.src = savedAvatar;
      }
      fetchStats();
    };

    async function fetchStats() {
      const defaultData = {
        totalOrders: 234,
        totalRevenue: 30700686,
        statusStats: {
          OutForDelivery: 10,
          Shipped: 8,
          Pending: 122,
          AwaitingPickup: 5,
          Cancelled: 55,
          Processing: 16,
          Delivered: 13,
          null: 5
        },
        paymentStats: {
          MOMO: 1,
          PAYOS: 10,
          COD: 128,
          ZALOPAY: 95
        },
        successCount: 13,
        failedCount: 55
      };

      const token = localStorage.getItem('authToken');
      let data = defaultData;

      if (token) {
        try {
          const response = await fetch('https://server-shelf-stacker-w1ds.onrender.com/api/orders/stats/summary', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            data = await response.json();
          } else {
            throw new Error('Failed to fetch stats');
          }
        } catch (error) {
          console.error('Error fetching stats:', error.message);
          const notification = document.createElement('div');
          notification.className = 'notification error-message';
          notification.textContent = 'Lỗi khi tải thống kê: ' + error.message;
          notification.style.display = 'block';
          const statsSection = document.querySelector('.stats');
          if (statsSection) statsSection.prepend(notification);
          setTimeout(() => notification.remove(), 5000);
        }
      } else {
        console.error('No auth token found. Using default data.');
      }

      const totalOrders = document.getElementById('totalOrders');
      const totalRevenue = document.getElementById('totalRevenue');
      const successCount = document.getElementById('successCount');
      const failedCount = document.getElementById('failedCount');

      if (totalOrders) totalOrders.textContent = data.totalOrders || 0;
      if (totalRevenue) totalRevenue.textContent = (data.totalRevenue || 0).toLocaleString('vi-VN') + ' ₫';
      if (successCount) successCount.textContent = data.successCount || 0;
      if (failedCount) failedCount.textContent = data.failedCount || 0;

      const statusLabels = Object.keys(data.statusStats).map(key => key === 'null' ? 'Không xác định' : {
        Cancelled: 'Hủy',
        Delivered: 'Đã giao',
        Shipped: 'Đang giao',
        Processing: 'Đang xử lý',
        Pending: 'Chờ xử lý',
        AwaitingPickup: 'Chờ nhận hàng'
      }[key] || key);

      const statusChartConfig = {
        type: 'pie',
        data: {
          labels: statusLabels,
          datasets: [{
            data: Object.values(data.statusStats || {}),
            backgroundColor: ['#ff4d4f', '#28a745', '#38bdf8', '#ffc107', '#0ea5e9', '#d9d9d9', '#6c63ff'],
            borderColor: ['#fff'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
              labels: { font: { size: 14 }, color: '#333' }
            },
            title: { display: false }
          }
        }
      };

      const paymentLabels = Object.keys(data.paymentStats).map(key => {
        if (key === 'null') return 'Không xác định';
        if (key === 'COD') return 'Thanh toán khi nhận hàng';
        if (key === 'ZALOPAY') return 'ZaloPay';
        if (key === 'MOMO') return 'Momo';
        if (key === 'VNPAY') return 'VNPay';
        if (key === 'BANK') return 'Chuyển khoản';
        if (key === 'PAYPAL') return 'Paypal';
        if (key === 'PAYOS') return 'PayOS';
        return key;
      });

      const paymentChartConfig = {
        type: 'doughnut',
        data: {
          labels: paymentLabels,
          datasets: [{
            data: Object.values(data.paymentStats || {}),
            backgroundColor: [
              '#0ea5e9', // COD
              '#ff4d4f', // ZALOPAY
              '#ffc107', // MOMO
              '#6c63ff', // VNPAY
              '#28a745', // BANK
              '#f59e42', // PAYPAL
              '#d9d9d9', // PAYOS
              '#d9d9d9'  // Không xác định
            ],
            borderColor: ['#fff'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
              labels: { font: { size: 15 }, color: '#222' }
            },
            title: { display: false }
          }
        }
      };

      const statusChartElement = document.getElementById('statusChart');
      const paymentChartElement = document.getElementById('paymentChart');

      if (statusChartElement) {
        new Chart(statusChartElement, statusChartConfig);
      }
      if (paymentChartElement) {
        new Chart(paymentChartElement, paymentChartConfig);
      }
    }
