// Tooltip Test Script
(function() {
    console.log('🧪 [Tooltip Test] Starting...');
    
    // Wait for sidebar to load
    setTimeout(() => {
        const sidebar = document.getElementById('adminSidebar');
        if (!sidebar) {
            console.error('❌ Sidebar not found');
            return;
        }
        
        const isCollapsed = sidebar.classList.contains('collapsed');
        console.log('📐 Sidebar collapsed:', isCollapsed);
        
        if (!isCollapsed) {
            console.log('⚠️ Sidebar is not collapsed. Please collapse it first.');
            return;
        }
        
        // Test tooltips
        const tooltips = document.querySelectorAll('.sidebar-tooltip');
        console.log('🔍 Found tooltips:', tooltips.length);
        
        tooltips.forEach((tooltip, index) => {
            const parent = tooltip.parentElement;
            const text = tooltip.textContent.trim();
            console.log(`Tooltip ${index + 1}: "${text}"`, {
                parent: parent?.tagName,
                parentClass: parent?.className,
                display: window.getComputedStyle(tooltip).display,
                visibility: window.getComputedStyle(tooltip).visibility,
                opacity: window.getComputedStyle(tooltip).opacity,
                zIndex: window.getComputedStyle(tooltip).zIndex,
                position: window.getComputedStyle(tooltip).position
            });
        });
        
        // Test hover on first nav link
        const firstNavLink = document.querySelector('.admin-sidebar.collapsed .nav-link');
        if (firstNavLink) {
            console.log('🖱️ Testing hover on first nav link...');
            const tooltip = firstNavLink.querySelector('.sidebar-tooltip');
            if (tooltip) {
                firstNavLink.addEventListener('mouseenter', () => {
                    console.log('✅ Mouse entered nav link');
                    setTimeout(() => {
                        const styles = window.getComputedStyle(tooltip);
                        console.log('📊 Tooltip styles after hover:', {
                            display: styles.display,
                            visibility: styles.visibility,
                            opacity: styles.opacity,
                            transform: styles.transform,
                            left: styles.left,
                            top: styles.top
                        });
                    }, 250);
                });
            }
        }
        
        console.log('🧪 [Tooltip Test] Complete!');
        console.log('💡 Hover over any nav item to test tooltip');
    }, 1000);
})();




