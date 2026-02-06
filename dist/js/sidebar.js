document.addEventListener('DOMContentLoaded', function () {

    const toggleBtn   = document.getElementById('toggle-btn');
    const sidebar     = document.querySelector('.sidebar');
    const mainContent =
        document.getElementById('mainContent') ||
        document.querySelector('main');

    const icon = toggleBtn ? toggleBtn.querySelector('i') : null;

    /* =========================
       DEFAULT STATE (COLLAPSED)
    ========================== */
    if (sidebar) sidebar.classList.add('hide');
    if (mainContent) mainContent.classList.add('sidebar-collapsed');
    if (icon) icon.className = 'fas fa-bars';

    /* =========================
       SIDEBAR TOGGLE
    ========================== */
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            sidebar.classList.toggle('hide');

            if (mainContent) {
                mainContent.classList.toggle('sidebar-collapsed');
            }

            if (icon) {
                icon.className = sidebar.classList.contains('hide')
                    ? 'fas fa-bars'
                    : 'fas fa-times';
            }
        });
    }

    /* =========================
       AUTO OPEN SIDEBAR
       FOR NORMAL MENU
    ========================== */
    document.querySelectorAll('.menu-list > li > a').forEach(link => {
        link.addEventListener('click', function () {

            // jika sidebar tertutup → buka dulu
            if (sidebar.classList.contains('hide')) {
                sidebar.classList.remove('hide');

                if (mainContent) {
                    mainContent.classList.remove('sidebar-collapsed');
                }

                if (icon) icon.className = 'fas fa-times';
            }
        });
    });

    /* =========================
       CLICK OUTSIDE (MOBILE)
    ========================== */
    document.addEventListener('click', function (event) {
        if (!sidebar || window.innerWidth > 768) return;
    
        const isInsideSidebar = sidebar.contains(event.target);
        const isToggleBtn    = toggleBtn && toggleBtn.contains(event.target);
    
        if (!isInsideSidebar && !isToggleBtn) {
            sidebar.classList.add('mobile-hidden');
        }
    });
    
    /* =========================
       ACTIVE STATE
    ========================== */
    const currentPath = window.location.pathname.split('/').pop();

    document.querySelectorAll('.menu-list li a').forEach(link => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;

        if (href === currentPath) {
            link.closest('li').classList.add('active');
        }
    });

    /* =========================
       LOGOUT
    ========================== */
    const logoutBtn = document.getElementById('btnLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (confirm('Apakah Anda yakin ingin logout?')) {
                window.location.href = 'login.php';
            }
        });
    }
});