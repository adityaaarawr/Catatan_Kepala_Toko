/**
 * ==================================================================
 * 1. EVENT LISTENER: LOGIN FORM
 * ==================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    // Memastikan form login ada sebelum menjalankan script
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            // Mencegah refresh halaman saat form dikirim
            e.preventDefault();

            // Deklarasi variabel elemen
            const btn = document.querySelector('.btn-login');
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;

            // --- TAHAP 1: LOADING STATE ---
            // Mengubah status tombol menjadi loading agar tidak diklik berkali-kali
            btn.classList.add('is-loading');
            btn.innerHTML = "VERIFYING..."; 
            btn.disabled = true;

            // --- TAHAP 2: SIMULASI VERIFIKASI ---
            // Simulasi proses pengecekan ke database (delay 2 detik)
            setTimeout(() => {
                // Mengembalikan status tombol
                btn.classList.remove('is-loading');
                btn.innerHTML = "SIGN IN";
                btn.disabled = false;

                // --- TAHAP 3: VALIDASI USER ---
                // Mengecek kredensial berdasarkan 4 akun yang tersedia
                const isAdmin = (user === "admin" && pass === "admin123");
                const isKTTM = (user === "kepalatokotm" && pass === "kttm321");
                const isKTRJ = (user === "kepalatokorj" && pass === "ktrj789");
                const isKTOL = (user === "kepalatokool" && pass === "ktol987");

                if (isAdmin || isKTTM || isKTRJ || isKTOL) {
                    // Login Sukses
                    showNotification('success', 'Berhasil', 'Data valid! Mengalihkan...');
                    
                    // Simpan status login di storage browser
                    localStorage.setItem('isLoggedIn', 'true');

                    // Tunggu 1.5 detik agar user sempat membaca notifikasi sebelum pindah halaman
                    setTimeout(() => {
                        window.location.href = "home.php"; 
                    }, 1500);
                } else {
                    // Login Gagal
                    showNotification('error', 'Gagal', 'Username atau Password salah!');
                }
            }, 2000);
        });
    }
});

/**
 * ==================================================================
 * 2. FUNGSI: SHOW NOTIFICATION (TOAST)
 * ==================================================================
 */
function showNotification(type, title, message) {
    const container = document.getElementById('notification-container');
    
    // Reset container agar notifikasi tidak bertumpuk jika diklik berulang kali
    container.innerHTML = '';

    // Membuat elemen div notifikasi baru
    const toast = document.createElement('div');
    const icon = type === 'success' ? '✓' : '✕';
    
    // Memberikan class 'notification success' atau 'notification error'
    toast.className = `notification ${type}`;
    
    // Memasukkan konten teks dan ikon ke dalam elemen
    toast.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-content">
            <span class="notification-title">${title}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;

    // Memasukkan elemen ke dalam DOM
    container.appendChild(toast);

    // --- TAHAP ANIMASI ---
    // Memberikan class 'show' sedikit tertunda agar animasi transisi CSS berjalan
    setTimeout(() => toast.classList.add('show'), 10);

    // --- TAHAP PENGHAPUSAN ---
    // Notifikasi akan hilang otomatis setelah 5 detik
    setTimeout(() => {
        toast.classList.remove('show');
        // Memberikan waktu animasi tutup selesai sebelum elemen dihapus permanen
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}