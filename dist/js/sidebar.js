/**
 * Global Sidebar & UI Handler
 * Pastikan file ini di-load di semua halaman via footer.php
 */

document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('toggle-btn');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('main');

    // Pastikan mencari ikon di dalam toggleBtn
    const icon = toggleBtn ? toggleBtn.querySelector('i') : null;

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();

            // 1. Toggle class hide pada sidebar
            sidebar.classList.toggle('hide');

            // 2. Toggle class pada main content
            if (mainContent) {
                mainContent.classList.toggle('sidebar-collapsed');
            }

            // 3. LOGIKA GANTI IKON
            if (icon) {
                if (sidebar.classList.contains('hide')) {
                    // Jika sidebar tertutup, tampilkan hamburger
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    // Jika sidebar terbuka, tampilkan silang
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }

    // Penanganan klik di luar sidebar untuk mobile
    document.addEventListener('click', function(event) {
        if (sidebar && window.innerWidth <= 768) {
            const isClickInsideSidebar = sidebar.contains(event.target);
            const isClickOnToggle = toggleBtn ? toggleBtn.contains(event.target) : false;

            if (!isClickInsideSidebar && !isClickOnToggle && !sidebar.classList.contains('hide')) {
                sidebar.classList.add('hide');
                
                // Kembalikan ikon ke hamburger saat menutup otomatis
                if (icon) {
                    icon.classList.replace('fa-times', 'fa-bars');
                }
            }
        }
    });

    // 3. MENANGANI ACTIVE STATE (Opsional jika PHP tidak mengirim class active)
    const currentPath = window.location.pathname.split("/").pop();
    const menuItems = document.querySelectorAll('.menu-list li a');

    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPath) {
            item.parentElement.classList.add('active');
        }
    });

    // 4. LOGOUT CONFIRMATION
    const logoutBtn = document.getElementById('btnLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Apakah Anda yakin ingin logout?')) {
                window.location.href = 'login.php';
            }
        });
    }
});