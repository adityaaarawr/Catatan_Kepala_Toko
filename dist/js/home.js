/**
 * =================================================================
 * 1. DEKLARASI VARIABEL GLOBAL
 * =================================================================
 */
let modal, viewModal, modalTitle, noteForm, tableBody, searchBar;
let deleteTargetId = null;

/**
 * =================================================================
 * 2. FUNGSI UTILITAS: NOTIFIKASI & UI SIDEBAR
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

/**
 * =================================================================
 * 3. LOGIKA MODAL (OPEN, CLOSE, VIEW, EDIT)
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
 * Menutup modal form dan modal view
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

    const lampiran = document.getElementById("viewLampiran");
    const previewBox = document.querySelector(".preview-box");

    lampiran.innerHTML = "";
    previewBox.innerHTML = "";

    let files = [];

    try {
        files = JSON.parse(tr.dataset.file || "[]");
    } catch(e){
        files = [];
    }

    if(files.length > 0){

        files.forEach(file => {
            const fileUrl = "uploads/" + file;
            const ext = file.split('.').pop().toLowerCase();

            // link
            lampiran.innerHTML += `
                <div>
                    <a href="${fileUrl}" target="_blank">${file}</a>
                </div>
            `;

            // preview
            if(["jpg","jpeg","png","webp","gif"].includes(ext)){
                previewBox.innerHTML += `
                    <a href="${fileUrl}" target="_blank">
                        <img src="${fileUrl}" 
                             style="max-width:100%;border-radius:10px;margin-bottom:10px;cursor:zoom-in;">
                    </a>
                `;
            }
            else if(["mp4","webm","ogg"].includes(ext)){
                previewBox.innerHTML += `
                    <video src="${fileUrl}" controls 
                           style="max-width:100%;border-radius:10px;margin-bottom:10px;"></video>
                `;
            }
        });

    } else {
        lampiran.innerHTML = "<i>Tidak ada lampiran</i>";
        previewBox.innerHTML = "<i>Tidak ada file</i>";
    }

    document.getElementById("viewModal").style.display = "flex";
}

/**
 * window.openEditModal
 * Mengambil data lama dan memasukkannya kembali ke form untuk diedit
 */
window.openEditModal = function(btn, e){
    if(e) e.stopPropagation();

    const tr   = btn.closest("tr");
    const form = document.getElementById("noteForm");

    const idNote     = tr.dataset.id;
    const idToko     = tr.dataset.toko_id;
    const idKaryawan = tr.dataset.karyawan_id;
    const idDivisi   = tr.dataset.divisi_id;
    const idTopik    = tr.dataset.topik_id;
    const tanggal    = tr.dataset.tanggal;
    const catatan    = tr.dataset.catatan;
    const filesRaw   = tr.dataset.file; // ex: '["a.jpg","b.pdf"]'

    document.getElementById("modal-title").innerText = "EDIT CATATAN";
    form.dataset.editId = idNote || "";

    // ===== SET VALUE FORM =====
    document.getElementById("inputToko").value = idToko || "";
    document.getElementById("inputKaryawan").value = idKaryawan || "";

    updateDivisi(); 
    const divisiEl = document.getElementById("divisi_id");
    if(divisiEl) divisiEl.value = idDivisi || "";

    document.getElementById("inputTopik").value   = idTopik || "";
    document.getElementById("inputDate").value    = tanggal || "";
    document.getElementById("inputCatatan").value = catatan || "";

    // ===== RESET INPUT FILE (biar bisa pilih file baru) =====
    const fileInput = document.getElementById("inputFile");
    if(fileInput) fileInput.value = "";

    // ===== TAMPILKAN FILE LAMA =====
    const oldFilesBox = document.getElementById("oldFilesBox");
    if(oldFilesBox){
        oldFilesBox.innerHTML = "<b>File sebelumnya:</b><br>";

        let files = [];
        if(filesRaw){
            try {
                files = JSON.parse(filesRaw);
            } catch(err){
                console.error("Format data-file tidak valid:", err);
            }
        }

        if(files.length){
            files.forEach(file => {
                oldFilesBox.innerHTML += `
                    <div class="old-file-item" style="margin:4px 0;">
                        <label style="cursor:pointer;">
                            <input type="checkbox" name="delete_files[]" value="${file}">
                            <span> Hapus</span>
                        </label>
                        &nbsp;|&nbsp;
                        <a href="uploads/${file}" target="_blank">${file}</a>
                    </div>
                `;
            });
        } else {
            oldFilesBox.innerHTML += "<i>Tidak ada file</i>";
        }
    }

    if(typeof checkOptionalFields === "function") checkOptionalFields();
    document.getElementById("modal").style.display = "flex";
}

/**
 * =================================================================
 * 4. FUNGSI AUTO-FILL & VALIDASI FORM
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

/**
 * initSearchKaryawan
 * Inisialisasi fitur pencarian pada dropdown karyawan
 */
function initSearchKaryawan() {
    const input = document.getElementById("searchKaryawanInput");
    const select = document.getElementById("inputKaryawan");

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
 * =================================================================
 * 5. OPERASI DATA (SAVE, DELETE)
 * =================================================================
 */

/**
 * window.saveNote
 * Menyimpan atau mengupdate catatan ke server
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
 * Menampilkan konfirmasi dan menghapus catatan
 */
let deleteId = null;

window.deleteNote = function(id, e){
    if(e) e.stopPropagation();

    deleteTargetId = id;
    document.getElementById("confirmModal").style.display = "flex";
}

document.getElementById("confirmCancel").onclick = function(){
    deleteId = null;
    document.getElementById("confirmModal").style.display = "none";
}

document.getElementById("confirmDelete").onclick = function(){
    if(!deleteId) return;

    const formData = new FormData();
    formData.append("ajax_delete", "1");
    formData.append("id", deleteId);

    fetch(window.location.href, {
        method: "POST",
        body: formData
    })
    .then(res => res.text())
    .then(res => {
        console.log(res);

        if(res.trim() === "success"){
            showNotification("Catatan berhasil dihapus ✅");
            setTimeout(() => location.reload(), 600);
        } else {
            showNotification("Gagal menghapus data ❌<br>" + res, "error");
        }
    })
    .catch(err => {
        console.error(err);
        showNotification("Terjadi kesalahan server ⚠️", "error");
    });

    document.getElementById("confirmModal").style.display = "none";
}

/**
 * =================================================================
 * 6. LOGIKA TABEL (RENDER & FILTERING)
 * =================================================================
 */

/**
 * window.applyFilters
 * Menerapkan filter pada tabel berdasarkan input pencarian
 */
window.applyFilters = function () {
    tableBody = tableBody || document.getElementById('noteTableBody');
    searchBar = searchBar || document.getElementById('searchBar');
    if (!tableBody) return;

    const rows = tableBody.querySelectorAll('tr');
    const searchTerm = searchBar ? searchBar.value.toLowerCase().trim() : '';

    // Helper function untuk mendapatkan nilai filter
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
        const cells = row.querySelectorAll('td');
        
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
 * 7. INISIALISASI EVENT LISTENER & DOM READY
 * =================================================================
 */

/**
 * initApplication
 * Fungsi utama untuk inisialisasi seluruh aplikasi
 */
function initApplication() {
    // Inisialisasi variabel global
    modal = document.getElementById('modal');
    viewModal = document.getElementById('viewModal');
    modalTitle = document.getElementById('modal-title');
    noteForm = document.getElementById('noteForm');
    tableBody = document.getElementById('noteTableBody');
    searchBar = document.getElementById('searchBar');
    
    // Inisialisasi fitur pencarian karyawan
    initSearchKaryawan();

    // Setup toggle sidebar
    const btnToggleSidebar = document.getElementById('toggle-btn');
    if (btnToggleSidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            sidebar.classList.toggle('hide');
            adjustMainContentMargin();
        });
    }

    // Setup toggle filter card
    const btnToggleFilter = document.getElementById('btnToggleFilter');
    const filterCard = document.getElementById('filterCard');
    if (btnToggleFilter && filterCard) {
        btnToggleFilter.addEventListener('click', () => {
            filterCard.classList.toggle('hide-filter');
        });
    }

    // Setup close modal ketika klik di luar konten
    [modal, viewModal].forEach(m => {
        if (m) {
            m.addEventListener('click', (e) => {
                if (e.target === m) m.style.display = 'none';
            });
        }
    });

    // Setup event listener untuk Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
            window.closeModal();
            window.closeViewModal();
        }
    });

    // Setup filter events
    if (searchBar) {
        searchBar.addEventListener('input', window.applyFilters);
    }

    document.querySelectorAll('#filterCard input').forEach(el => {
        el.addEventListener('input', window.applyFilters);
    });

    // Setup validasi form real-time
    const inputCatatan = document.getElementById('inputCatatan');
    const inputFile = document.getElementById('inputFile');
    if (inputCatatan) inputCatatan.addEventListener('input', checkOptionalFields);
    if (inputFile) inputFile.addEventListener('change', checkOptionalFields);

    // Setup konfirmasi delete
    document.getElementById("confirmCancel").onclick = () => {
        document.getElementById("confirmModal").style.display = "none";
        deleteTargetId = null;
    };

    document.getElementById("confirmDelete").onclick = () => {
        if(!deleteTargetId) return;

        const fd = new FormData();
        fd.append("ajax_delete", "1");
        fd.append("id", deleteTargetId);

        fetch("home.php", { method:"POST", body:fd })
        .then(res => res.text())
        .then(res => {
            if(res.trim() === "success"){
                showNotification("Catatan berhasil dihapus", "success");
                setTimeout(() => location.reload(), 600);
            } else {
                showNotification("Gagal menghapus data", "error");
            }
        });

        document.getElementById("confirmModal").style.display = "none";
    };

    // Sinkronisasi ulang margin sidebar
    adjustMainContentMargin();
    
}

// Event listener untuk resize window
window.addEventListener('resize', adjustMainContentMargin);

// Inisialisasi aplikasi saat DOM siap
document.addEventListener('DOMContentLoaded', initApplication);