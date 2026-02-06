/**
 * =================================================================
 * 1. DEKLARASI VARIABEL GLOBAL
 * =================================================================
 * PROBLEM: Variabel dideklarasikan di dua tempat berbeda
 */
let modal, viewModal, modalTitle, noteForm, tableBody, searchBar;
let deleteTargetId = null; // 🔴 Variabel ganda: juga ada deleteId di line 278

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
 * PROBLEM: Tidak ada CSS untuk class 'hide-notification'
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
 * PROBLEM: Nama fungsi tidak konsisten (openviewModal vs openViewModal)
 * =================================================================
 */

/**
 * window.openModal
 * Menyiapkan form untuk penambahan data baru
 * PROBLEM: Tidak ada loading indicator saat fetch API
 */
window.openModal = function () {
    console.log("openModal dipanggil");

    const modal = document.getElementById('modal');
    const noteForm = document.getElementById('noteForm');
    const modalTitle = document.getElementById('modal-title');

    if (!modal || !noteForm || !modalTitle) {
        console.error("Modal elements not found!");
        return;
    }

    // ===== SET MODE TAMBAH =====
    modalTitle.textContent = "TAMBAH CATATAN";
    noteForm.reset();
    noteForm.dataset.noteId = 0;
    noteForm.dataset.editId = "";

    // ===== RESET DROPDOWN API =====
    document.getElementById("inputToko").innerHTML = '<option value="">Loading toko...</option>';
    document.getElementById("inputKaryawan").innerHTML = '<option value="">Pilih Karyawan</option>';
    document.getElementById("inputDivisi").value = "";
    document.getElementById("divisi_id").value = "";

    // ===== SET DATE DEFAULT =====
    const inputDate = document.getElementById('inputDate');
    if (inputDate) {
        const today = new Date().toISOString().split('T')[0];
        inputDate.value = today;
        inputDate.setAttribute('max', today);
    }

    // ===== LOAD TOKO DARI API =====
    if (typeof loadToko === "function") {
        loadToko();
    }
    

    // ===== TAMPILKAN MODAL (INI YANG KURANG) =====
    modal.classList.add("show");
    modal.style.display = "flex"; // jaga-jaga kalau pakai display none
    
};

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
 * window.openviewModal
 * Menampilkan detail lengkap satu catatan secara read-only
 * PROBLEM: Nama fungsi typo (openviewModal, harusnya openViewModal)
 */
window.openviewModal = async function(tr){

    // pastikan master API sudah ada
    if (!window.masterAPI || masterAPI.karyawan.length === 0) {
        await loadMasterAPI();
    }

    const toko   = tr.dataset.toko_id || "";
    const karId  = tr.dataset.karyawan_id || "";
    const divisi = tr.dataset.divisi_id || "";

    const kar = masterAPI.karyawan.find(k => k.id == karId);

    document.getElementById("viewInputer").innerText  = tr.dataset.inputer || "-";
    document.getElementById("viewTopik").innerText    = tr.dataset.topik || "-";
    document.getElementById("viewDate").innerText     = tr.dataset.tanggal || "-";
    document.getElementById("viewCatatan").innerText  = tr.dataset.catatan || "-";

    // ====== FIX UTAMA ======
    document.getElementById("viewToko").innerText = 
        kar ? kar.toko.toUpperCase() : (toko ? toko.toUpperCase() : "-");

    document.getElementById("viewKaryawan").innerText = 
        kar ? kar.nama.toUpperCase() : ("ID " + karId + " TIDAK ADA DI API");

    document.getElementById("viewDivisi").innerText = 
        kar ? kar.divisi.toUpperCase() : (divisi ? divisi.toUpperCase() : "-");
    // =======================


    // ================= FILE (TIDAK DIUBAH) =================
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

            lampiran.innerHTML += `
                <div>
                    <a href="${fileUrl}" target="_blank">${file}</a>
                </div>
            `;

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
    // =======================================================

    document.getElementById("viewModal").style.display = "flex";
}

/**
 * window.openEditModal
 * Mengambil data lama dan memasukkannya kembali ke form untuk diedit
 * PROBLEM: Tidak ada error handling jika API gagal load
 */
window.openEditModal = async function(btn, e){
    if(e) e.stopPropagation();

    if (!window.masterAPI || !masterAPI.karyawan || masterAPI.karyawan.length === 0) {
        await loadMasterAPI();
    }

    loadToko(); // pastikan dropdown toko terisi

    const tr   = btn.closest("tr");
    const form = document.getElementById("noteForm");

    const idNote     = tr.dataset.id;
    const idKaryawan = tr.dataset.karyawan_id;
    const idTopik    = tr.dataset.topik_id;
    const tanggal    = tr.dataset.tanggal;
    const catatan    = tr.dataset.catatan;
    const filesRaw   = tr.dataset.file;

    document.getElementById("modal-title").innerText = "EDIT CATATAN";
    form.dataset.editId = idNote || "";

    const tokoEl   = document.getElementById("inputToko");
    const karEl    = document.getElementById("inputKaryawan");

    // ====== AMBIL DATA KARYAWAN DARI API ======
    const kar = getKaryawanById(idKaryawan);

    if(kar){

        // ================= TOKO =================
        tokoEl.value = kar.toko; // ⚠️ NAMA TOKO
        await loadKaryawanByToko(kar.toko);

        // ================= KARYAWAN =================
        karEl.value = kar.id;

        // ================= DIVISI =================
        updateDivisi(); // auto ambil dari data-divisi

    } else {
        console.warn("Karyawan tidak ditemukan di masterAPI");
    }

    // ================= FIELD LAIN =================
    document.getElementById("inputTopik").value   = idTopik || "";
    document.getElementById("inputDate").value    = tanggal || "";
    document.getElementById("inputCatatan").value = catatan || "";

    // ================= FILE (TIDAK DIUBAH) =================
    const fileInput = document.getElementById("inputFile");
    if(fileInput) fileInput.value = "";

    const oldFilesBox = document.getElementById("oldFilesBox");
    if(oldFilesBox){
        oldFilesBox.innerHTML = "<b>File sebelumnya:</b><br>";

        let files = [];
        if(filesRaw){
            try { files = JSON.parse(filesRaw); } catch(err){}
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
 * initSearchKaryawan
 * Inisialisasi fitur pencarian pada dropdown karyawan
 * PROBLEM: Tidak ada debounce untuk performa
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
 * PROBLEM: Logika delete duplikat (dua implementasi berbeda)
 * =================================================================
 */

/**
 * window.saveNote
 * Menyimpan atau mengupdate catatan ke server
 * PROBLEM: URL 'home.php' hardcoded, tidak fleksibel
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
 * PROBLEM: Variabel deleteId shadowing variabel global deleteTargetId
 */
let deleteId = null; // 🔴 GANDA: sudah ada deleteTargetId di line 6

window.deleteNote = function(id, e){
    if(e) e.stopPropagation();

    deleteTargetId = id;
    document.getElementById("confirmModal").style.display = "flex";
}

/**
 * 🔴 PROBLEM BESAR: Implementasi delete dua kali dengan logika berbeda
 * Ada di line 278-313 dan line 357-382
 */

// Implementasi pertama (mungkin tidak terpakai)
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
 * PROBLEM: Tidak ada debounce, bisa lambat pada tabel besar
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
 * PROBLEM: Dua DOMContentLoaded listener (line 423 dan 478)
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

    // Setup konfirmasi delete - 🔴 IMPLEMENTASI KEDUA
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

/**
 * =================================================================
 * 8. MASTER API MANAGEMENT
 * PROBLEM: DataTable initialization di dalam fungsi loadToko (line 452)
 * =================================================================
 */

// LOAD API // 
let masterAPI = {
    toko: [],
    karyawan: []
};

async function loadMasterAPI() {
    const res = await fetch("routines/base_api.php");
    const data = await res.json();
    masterAPI = data;
}

function loadToko() {
    const tokoSelect = document.getElementById("inputToko");
    tokoSelect.innerHTML = `<option value="">Pilih Toko</option>`;

    masterAPI.toko.forEach(t => {
        tokoSelect.innerHTML += `<option value="${t}">${t.toUpperCase()}</option>`;
    });

    // 🔴 PROBLEM: DataTable initialization tidak seharusnya di sini
    $("#master-table-all").DataTable({
        "responsive": true,
        "lengthChange": false,
        "autoWidth": false,
        "paging": true,
        "pageLength": 10,
        "searching": false,
        "info": true,
        "ordering": false
    })
}

function loadKaryawanByToko(namaToko) {
    const karSelect = document.getElementById("inputKaryawan");
    karSelect.innerHTML = `<option value="">Pilih Karyawan</option>`;

    masterAPI.karyawan
        .filter(k => k.toko === namaToko)
        .forEach(k => {
            karSelect.innerHTML += `
                <option 
                    value="${k.id}" 
                    data-divisi="${k.divisi}">
                    ${k.nama.toUpperCase()}
                </option>`;
        });
}

function getKaryawanById(id) {
    return masterAPI.karyawan.find(k => k.id == id);
}

document.getElementById("inputToko").addEventListener("change", function () {
    document.getElementById("inputDivisi").value = "";
    document.getElementById("divisi_id").value = "";

    if (this.value) {
        loadKaryawanByToko(this.value);
    }
});

function updateDivisi() {
    const kar = document.querySelector("#inputKaryawan option:checked");
    if (!kar) return;

    document.getElementById("inputDivisi").value = kar.dataset.divisi || "-";
    document.getElementById("divisi_id").value = kar.dataset.divisi || "";
}

// 🔴 DOMContentLoaded kedua - HARUSNYA SATU SAJA
document.addEventListener("DOMContentLoaded", async () => {
    await loadMasterAPI();
});