/**
 * ==================================================================
 * 1. EVENT LISTENER: LOGIN FORM
 * ==================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault(); // <<< INI WAJIB PALING ATAS

        const btn  = document.querySelector('.btn-login');
        const user = document.getElementById('username').value.trim();
        const pass = document.getElementById('password').value.trim();

        if(!user || !pass){
            showNotification('error','Gagal','Username dan password wajib diisi');
            return;
        }

        btn.classList.add('is-loading');
        btn.innerHTML = "VERIFYING...";
        btn.disabled = true;

        try {
            let res = await fetch('routines/index.php', {
                method: 'POST',
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ user, pass })
            });

            let text = await res.text();
            console.log("SERVER RESPONSE:", text);

            let data = JSON.parse(text);

            btn.classList.remove('is-loading');
            btn.innerHTML = "SIGN IN";
            btn.disabled = false;

            if (data.status === true) {
                showNotification('success','Berhasil','Login berhasil, mengalihkan...');
            
                setTimeout(() => {
                    if (data.redirect) {
                        location.href = data.redirect;
                    } else {
                        location.href = "home.php";
                    }
                }, 1200);
            
            } else {
                showNotification('error','Gagal', data.message || 'Login gagal');
            }
            

        } catch (err) {
            console.error("LOGIN ERROR:", err);

            btn.classList.remove('is-loading');
            btn.innerHTML = "SIGN IN";
            btn.disabled = false;

            showNotification('error','Error','Server error / response tidak valid');
        }
    });
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