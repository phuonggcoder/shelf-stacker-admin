document.addEventListener('DOMContentLoaded', function() {
    // Quantity controls
    const quantityBtns = document.querySelectorAll('.quantity-btn');
    const quantityInput = document.querySelector('.quantity-input');

    quantityBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            let currentValue = parseInt(quantityInput.value);
            
            if (this.textContent === '+') {
                if (currentValue < 10) {
                    quantityInput.value = currentValue + 1;
                }
            } else {
                if (currentValue > 1) {
                    quantityInput.value = currentValue - 1;
                }
            }
        });
    });

    // Tab functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Thumbnail functionality
    const thumbnails = document.querySelectorAll('.thumbnail');
    const mainImage = document.querySelector('.main-image');

    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', function() {
            thumbnails.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            // Replace old server URL with new one if present
            let newSrc = this.src.replace('https://server-shelf-stacker.onrender.com', 'https://server-shelf-stacker-w1ds.onrender.com');
            // Update image dimensions
            newSrc = newSrc.replace('w=80&h=80', 'w=500&h=600');
            mainImage.src = newSrc;
        });
    });

    // Add to cart button
    const addToCartBtn = document.querySelector('.btn-primary');
    addToCartBtn.addEventListener('click', function() {
        alert('Đã thêm sản phẩm vào giỏ hàng!');
    });
});