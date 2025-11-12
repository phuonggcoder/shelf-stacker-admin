// Sidebar Test Script - Run this in browser console to test
(function() {
    console.log('🧪 [Sidebar Test] Starting test...');
    
    // Test 1: Check if sidebar exists
    const sidebar = document.getElementById('adminSidebar');
    console.log('Test 1 - Sidebar exists:', !!sidebar);
    if (sidebar) {
        console.log('  - Sidebar width:', sidebar.offsetWidth);
        console.log('  - Sidebar classes:', sidebar.className);
        console.log('  - Is collapsed:', sidebar.classList.contains('collapsed'));
    }
    
    // Test 2: Check if main content exists
    const adminMain = document.querySelector('.admin-main');
    console.log('Test 2 - Main content exists:', !!adminMain);
    if (adminMain) {
        const styles = window.getComputedStyle(adminMain);
        console.log('  - Margin left:', styles.marginLeft);
        console.log('  - Width:', styles.width);
        console.log('  - Computed margin left:', styles.marginLeft);
    }
    
    // Test 3: Check scrollbar
    const sidebarNav = document.querySelector('.sidebar-nav');
    console.log('Test 3 - Sidebar nav exists:', !!sidebarNav);
    if (sidebarNav) {
        const navStyles = window.getComputedStyle(sidebarNav);
        console.log('  - Overflow:', navStyles.overflow);
        console.log('  - Scrollbar width:', navStyles.scrollbarWidth);
        console.log('  - Has scrollbar:', sidebarNav.scrollHeight > sidebarNav.clientHeight);
    }
    
    // Test 4: Check localStorage
    const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    console.log('Test 4 - LocalStorage state:', { collapsed });
    
    // Test 5: Check body class
    console.log('Test 5 - Body has sidebar-collapsed class:', document.body.classList.contains('sidebar-collapsed'));
    
    // Test 6: Check toggle button
    const toggleBtn = document.getElementById('sidebarToggle');
    console.log('Test 6 - Toggle button exists:', !!toggleBtn);
    
    // Test 7: Manual toggle test
    if (toggleBtn && sidebar) {
        console.log('Test 7 - Manual toggle test available');
        console.log('  Run: document.getElementById("sidebarToggle").click() to test');
    }
    
    console.log('🧪 [Sidebar Test] Complete!');
    
    // Return test results
    return {
        sidebar: !!sidebar,
        adminMain: !!adminMain,
        sidebarNav: !!sidebarNav,
        toggleBtn: !!toggleBtn,
        collapsed: collapsed,
        bodyClass: document.body.classList.contains('sidebar-collapsed')
    };
})();


