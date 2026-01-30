const toggleBtn = document.getElementById('toggle-btn');
const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('main');
const icon = toggleBtn ? toggleBtn.querySelector('i') : null;

/* === TOGGLE SIDEBAR === */
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

/* === KLIK DI LUAR SIDEBAR (MOBILE) === */
document.addEventListener('click', function (event) {
    if (
        window.innerWidth <= 768 &&
        sidebar &&
        !sidebar.classList.contains('hide') &&
        !sidebar.contains(event.target) &&
        !toggleBtn.contains(event.target)
    ) {
        sidebar.classList.add('hide');
        if (icon) icon.className = 'fas fa-bars';
    }
});

/* === LOGOUT === */
const logoutBtn = document.getElementById('btnLogout');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (confirm('Apakah Anda yakin ingin logout?')) {
            window.location.href = 'login.php';
        }
    });
}

