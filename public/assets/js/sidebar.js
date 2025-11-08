class Sidebar {
    constructor() {
        this.initSidebar();
        this.bindEvents();
    }

    initSidebar() {
        const currentPath = window.location.pathname;
        const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
        
        sidebarLinks.forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
                const parent = link.closest('li');
                if (parent) {
                    parent.classList.add('open');
                }
            }
        });
    }

    bindEvents() {
        const menuItems = document.querySelectorAll('.sidebar-menu li');
        menuItems.forEach(item => {
            const link = item.querySelector('a');
            const submenu = item.querySelector('.sidebar-submenu');
            
            if (submenu) {
                link.addEventListener('click', (e) => {
                    if (e.target.getAttribute('href') === '#') {
                        e.preventDefault();
                        item.classList.toggle('open');
                    }
                });
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.sidebar = new Sidebar();
});