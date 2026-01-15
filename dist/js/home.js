/**
 * =================================================================
 * 1. FUNGSI UTILITAS: NOTIFIKASI & UI SIDEBAR
 * =================================================================
 */

const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('main');
const toggleBtn = document.querySelector('#toggle-btn');

/**
 * window.showNotification
 * Menampilkan pesan pop-up (Toast) di pojok layar
 */
window.showNotification = function (message, type = 'info') {
    let container = document.getElementById('notification-container');

    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    // Tambahkan class 'show' segera untuk memicu animasi masuk
    notification.className = `notification-toast ${type}`;

    const iconMap = {
        'success': 'fa-check-circle',
        'error': 'fa-times-circle',
        'info': 'fa-info-circle'
    };

    const icon = iconMap[type] || iconMap['info'];
    notification.innerHTML = `
        <i class="fas ${icon}"></i> 
        <span class="notification-message">${message}</span>
    `;

    container.appendChild(notification);

    // Timeout untuk menghilangkan notifikasi
    setTimeout(() => {
        notification.classList.add('hide-notification');
        
        // Gunakan setTimeout sebagai fallback jika transitionend gagal
        const removeElement = () => {
            if (notification.parentNode) {
                notification.remove();
            }
        };

        notification.addEventListener('transitionend', removeElement, { once: true });
        // Fallback 500ms (durasi animasi) jika transitionend tidak terpicu
        setTimeout(removeElement, 500); 
    }, 3000);
}

/**
 * adjustMainContentMargin
 * Menyesuaikan lebar margin konten utama berdasarkan status sidebar (Desktop Only)
 */
function adjustMainContentMargin() {
    if (!sidebar || !mainContent) return;
    if (window.innerWidth > 768) {
        sidebar.classList.contains('hide')
            ? mainContent.classList.add('sidebar-collapsed')
            : mainContent.classList.remove('sidebar-collapsed');
    } else {
        mainContent.classList.remove('sidebar-collapsed');
    }
}

// Sinkronisasi ulang saat ukuran layar berubah
window.addEventListener('resize', adjustMainContentMargin);

/**
 * =================================================================
 * 2. LOGIKA MODAL (OPEN, CLOSE, VIEW, EDIT)
 * =================================================================
 */

/**
 * window.openModal
 * Menyiapkan form untuk penambahan data baru
 */
window.openModal = function () {
    console.log("openModal dipanggil");

    modal = modal || document.getElementById('modal');
    noteForm = noteForm || document.getElementById('noteForm');
    modalTitle = modalTitle || document.getElementById('modal-title');

    if (!modal || !noteForm || !modalTitle) {
        console.error("Modal elements not found!");
        return;
    }

    modalTitle.textContent = "TAMBAH CATATAN";
    noteForm.reset();
    noteForm.dataset.noteId = 0; // Menandakan ini data baru (ID: 0)
    noteForm.dataset.editId = "";

    // Set limit tanggal maksimal adalah hari ini
    const inputDate = document.getElementById('inputDate');
    if (inputDate) {
        const today = new Date().toISOString().split('T')[0];
        inputDate.value = today;
        inputDate.setAttribute('max', today);
    }

    window.updateDivisi(); // Reset tampilan divisi
    modal.style.display = 'flex';

    const statusLabel = document.getElementById('optionalStatus');
    if(statusLabel){
        statusLabel.innerText = "*Wajib isi Catatan atau lampirkan File";
        statusLabel.style.color = "#e74c3c";
    }

}

/**
 * window.closeModal & window.closeViewModal
 */
window.closeModal = function () {
    modal = modal || document.getElementById('modal');
    if (modal) {
        modal.style.display = 'none';
        showNotification("Input dibatalkan", "info");
    }
}

window.closeViewModal = function () {
    console.log("closeViewModal dipanggil");
    viewModal = viewModal || document.getElementById('viewModal');
    if (viewModal) viewModal.style.display = 'none';
};

/**
 * window.openViewModal
 * Menampilkan detail lengkap satu catatan secara read-only
 */
window.openviewModal = function(tr){
    document.getElementById("viewInputer").innerText  = tr.dataset.inputer || "-";
    document.getElementById("viewToko").innerText     = tr.dataset.toko || "-";
    document.getElementById("viewKaryawan").innerText = tr.dataset.karyawan || "-";
    document.getElementById("viewTopik").innerText    = tr.dataset.topik || "-";
    document.getElementById("viewDivisi").innerText   = tr.dataset.divisi || "-";
    document.getElementById("viewDate").innerText     = tr.dataset.tanggal || "-";
    document.getElementById("viewCatatan").innerText  = tr.dataset.catatan || "-";

    const file = tr.dataset.file;
    const lampiran = document.getElementById("viewLampiran");
    const previewBox = document.querySelector(".preview-box");

    if(file){
        lampiran.innerHTML = `<a href="uploads/${file}" target="_blank">Download File</a>`;
        previewBox.innerHTML = `<img src="uploads/${file}" style="max-width:100%;border-radius:8px">`;
    } else {
        lampiran.innerText = "Tidak ada lampiran";
        previewBox.innerText = "Tidak ada file terlampir";
    }

    document.getElementById("viewModal").style.display = "flex";
}

/**
 * window.openEditModal
 * Mengambil data lama dan memasukkannya kembali ke form untuk diedit
 */
window.openEditModal = function(btn){
    event.stopPropagation();
    const tr = btn.closest("tr");

    document.getElementById("modal-title").innerText = "EDIT CATATAN";

    const form = document.getElementById("noteForm");
    form.dataset.editId = tr.dataset.id;

    document.getElementById("inputToko").value     = tr.dataset.toko_id || "";
    document.getElementById("inputDate").value     = tr.dataset.tanggal || "";
    document.getElementById("inputCatatan").value  = tr.dataset.catatan || "";
    document.getElementById("inputKaryawan").value = tr.dataset.karyawan_id || "";

    updateDivisi();
    checkOptionalFields();

    document.getElementById("modal").style.display = "flex";
}



/**
 * =================================================================
 * 3. OPERASI DATA (SAVE, AUTO-FILL, DELETE)
 * =================================================================
 */

/**
 * window.updateDivisi
 * Otomatis mengisi kolom Divisi saat nama karyawan dipilih
 */

window.updateDivisi = function () {
    const select = document.getElementById('inputKaryawan');
    const divisiText = document.getElementById('inputDivisi');
    const divisiHidden = document.getElementById('divisi_id');

    if (!select || !divisiText || !divisiHidden) return;

    const opt = select.options[select.selectedIndex];

    if (!opt || !opt.value) {
        divisiText.value = '';
        divisiHidden.value = '';
        return;
    }

    divisiText.value = opt.dataset.divisiNama || '-';
    divisiHidden.value = opt.dataset.divisiId || '';
}

function initSearchKaryawan() {
    const input = document.getElementById("searchKaryawanInput");
    const select = document.getElementById("inputKaryawan");

    // ✅ kalau salah satu tidak ada, hentikan
    if (!input || !select) return;

    input.addEventListener('input', function () {
        const keyword = this.value.toLowerCase();

        Array.from(select.options).forEach((opt, i) => {
            if (i === 0) return; // skip "Pilih Karyawan"

            const text = opt.dataset.search || opt.textContent.toLowerCase();
            opt.style.display = text.includes(keyword) ? '' : 'none';
        });
    });
}


/**
 * checkOptionalFields
 * Memvalidasi apakah user sudah mengisi Catatan ATAU mengupload File
 */
function checkOptionalFields() {
    const catatanEl = document.getElementById('inputCatatan');
    const fileEl = document.getElementById('inputFile');
    const statusLabel = document.getElementById('optionalStatus');

    if (!catatanEl || !fileEl || !statusLabel) return;

    const hasCatatan = catatanEl.value.trim() !== "";
    const hasFile = fileEl.files.length > 0;

    if (hasCatatan || hasFile) {
        statusLabel.innerText = "✓ Salah satu sudah terpenuhi";
        statusLabel.style.color = "#27ae60";
    } else {
        statusLabel.innerText = "*Wajib isi Catatan atau lampirkan File";
        statusLabel.style.color = "#e74c3c";
    }
}

/**
 * window.saveNote
 */
window.saveNote = function () {
    const form = document.getElementById('noteForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const catatan = document.getElementById('inputCatatan').value.trim();
    const hasFile = document.getElementById('inputFile').files.length > 0;

    if (!catatan && !hasFile) {
        showNotification("Isi catatan atau lampirkan file!", "error");
        return;
    }

    const formData = new FormData(form);
    const editId = form.dataset.editId;

    if(editId){
        formData.append("ajax_update", "1");
        formData.append("id", editId);
    } else {
        formData.append("ajax_save", "1");
    }

    const btn = document.querySelector('.save-btn');
    btn.disabled = true;
    btn.innerText = "MENYIMPAN...";

    fetch("home.php", { method: "POST", body: formData })
    .then(res => res.text())
    .then(res => {
        if (res.trim() === "success") {
            showNotification(editId ? "Catatan berhasil diupdate" : "Catatan berhasil disimpan", "success");
            closeModal();
            setTimeout(() => location.reload(), 600);
        } else {
            showNotification(res, "error");
            btn.disabled = false;
            btn.innerText = "SIMPAN";
        }
    })
    .catch(() => {
        showNotification("Gagal terhubung ke server", "error");
        btn.disabled = false;
        btn.innerText = "SIMPAN";
    });
}

/**
 * window.deleteNote
 */
window.deleteNote = function(id){
    if(!confirm("Yakin hapus catatan ini?")) return;

    const fd = new FormData();
    fd.append("ajax_delete", "1");
    fd.append("id", id);

    fetch("home.php", { method:"POST", body:fd })
    .then(res => res.text())
    .then(res => {
        if(res.trim() === "success"){
            showNotification("Catatan dihapus", "success");
            setTimeout(() => location.reload(), 500);
        } else {
            showNotification("Gagal menghapus data", "error");
        }
    });
}

/**
 * =================================================================
 * 4. LOGIKA TABEL (RENDER & FILTERING)
 * =================================================================
 */

window.applyFilters = function () {
    tableBody = tableBody || document.getElementById('noteTableBody');
    searchBar = searchBar || document.getElementById('searchBar');
    if (!tableBody) return;

    const rows = tableBody.querySelectorAll('tr');
    const searchTerm = searchBar ? searchBar.value.toLowerCase().trim() : '';

    const getVal = (placeholderText) => {
        const el = document.querySelector(`#filterCard input[placeholder="${placeholderText}"]`);
        return el ? el.value.toLowerCase().trim() : '';
    };

    const f = {
        tanggal: getVal("TANGGAL"),
        inputer: getVal("INPUTER"),
        toko: getVal("TOKO"),
        divisi: getVal("DIVISI"),
        topik: getVal("TOPIK"),
        karyawan: getVal("KARYAWAN")
    };

    let visibleCount = 0;

    rows.forEach(row => {

        const rowData = {
            tanggal: cells[1]?.innerText.toLowerCase() || '',
            inputer: cells[2]?.innerText.toLowerCase() || '',
            toko: cells[3]?.innerText.toLowerCase() || '',
            karyawan: cells[4]?.innerText.toLowerCase() || '',
            divisi: cells[5]?.innerText.toLowerCase() || '',
            topik: cells[6]?.innerText.toLowerCase() || '',
            allText: row.innerText.toLowerCase()
        };
        
        const matchSpecific =
            (!f.tanggal || rowData.tanggal.includes(f.tanggal)) &&
            (!f.inputer || rowData.inputer.includes(f.inputer)) &&
            (!f.toko || rowData.toko.includes(f.toko)) &&
            (!f.karyawan || rowData.karyawan.includes(f.karyawan)) &&
            (!f.divisi || rowData.divisi.includes(f.divisi)) &&
            (!f.topik || rowData.topik.includes(f.topik));
    
        const matchSearch = !searchTerm || rowData.allText.includes(searchTerm);
    
        if (matchSpecific && matchSearch) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    }
};

/**
 * =================================================================
 * 5. INISIALISASI & DOM READY
 * =================================================================
 */
let modal, viewModal, modalTitle, noteForm, tableBody, searchBar;

function initApplication() {
    modal = document.getElementById('modal');
    viewModal = document.getElementById('viewModal');
    modalTitle = document.getElementById('modal-title');
    noteForm = document.getElementById('noteForm');
    tableBody = document.getElementById('noteTableBody');
    searchBar = document.getElementById('searchBar');
    initSearchKaryawan();


    const btnToggleSidebar = document.getElementById('toggle-btn');
    if (btnToggleSidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            sidebar.classList.toggle('hide');
            adjustMainContentMargin();
        });
    }

    const btnToggleFilter = document.getElementById('btnToggleFilter');
    const filterCard = document.getElementById('filterCard');
    if (btnToggleFilter && filterCard) {
        btnToggleFilter.addEventListener('click', () => {
            filterCard.classList.toggle('hide-filter');
        });
    }

    [modal, viewModal].forEach(m => {
        if (m) {
            m.addEventListener('click', (e) => {
                if (e.target === m) m.style.display = 'none';
            });
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
            window.closeModal();
            window.closeViewModal();
        }
    });

    if (searchBar) {
        searchBar.addEventListener('input', window.applyFilters);
    }

    document.querySelectorAll('#filterCard input').forEach(el => {
        el.addEventListener('input', window.applyFilters);
    });

    const inputCatatan = document.getElementById('inputCatatan');
    const inputFile = document.getElementById('inputFile');
    if (inputCatatan) inputCatatan.addEventListener('input', checkOptionalFields);
    if (inputFile) inputFile.addEventListener('change', checkOptionalFields);

    adjustMainContentMargin();
}

document.addEventListener('DOMContentLoaded', initApplication);
