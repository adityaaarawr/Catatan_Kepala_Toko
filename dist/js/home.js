// ============================================
// FLEX ROLE: Popup akses ditolak
// ============================================
function showAccessDenied(message) {
    // Hapus popup lama kalau ada
    const old = document.getElementById('accessDeniedPopup');
    if (old) old.remove();

    const popup = document.createElement('div');
    popup.id = 'accessDeniedPopup';
    popup.style.cssText = `
        position:fixed;top:0;left:0;width:100%;height:100%;
        background:rgba(0,0,0,0.5);z-index:99999;
        display:flex;align-items:center;justify-content:center;
    `;
    popup.innerHTML = `
        <div style="background:#fff;border-radius:12px;padding:32px 28px;max-width:380px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.2);">
            <div style="font-size:2.5rem;margin-bottom:12px;">🔒</div>
            <h3 style="margin:0 0 10px;color:#e74c3c;font-size:1.1rem;">Akses Ditolak</h3>
            <p style="color:#555;margin:0 0 20px;font-size:0.9rem;">${message}</p>
            <button onclick="document.getElementById('accessDeniedPopup').remove()"
                style="background:#e74c3c;color:#fff;border:none;padding:10px 28px;border-radius:6px;cursor:pointer;font-size:0.9rem;font-weight:bold;">
                OK
            </button>
        </div>
    `;
    document.body.appendChild(popup);
    // Auto-close setelah 5 detik
    setTimeout(() => { if (popup.parentNode) popup.remove(); }, 5000);
}

/**
 * =================================================================
 * 1. DEKLARASI VARIABEL GLOBAL
 * =================================================================
 * FIXED: Hanya satu variabel untuk delete ID
 */
let modal, viewModal, modalTitle, noteForm, tableBody, searchBar;
let deleteTargetId = null; // Hanya satu variabel untuk menyimpan ID yang akan dihapus

/**
 * =================================================================
 * 2. FUNGSI UTILITAS: NOTIFIKASI & UI SIDEBAR
 * =================================================================
 */

const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('main');
const toggleBtn = document.querySelector('#toggle-btn');

function showNotification(message, type = "info") {
    let container = document.getElementById("notification-container");

    if (!container) {
        container = document.createElement("div");
        container.id = "notification-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `notification-toast ${type}`;

    const iconMap = {
        success: '<i class="fas fa-check-circle"></i>',
        error: '<i class="fas fa-exclamation-circle"></i>',
        info: '<i class="fas fa-info-circle"></i>'
    };

    toast.innerHTML = `
        ${iconMap[type] || iconMap.info}
        <div class="notification-message">${message}</div>
    `;

    container.appendChild(toast);

    // trigger animasi masuk
    setTimeout(() => toast.classList.add("show"), 10);

    // AUTO HIDE
    setTimeout(() => {
        toast.classList.remove("show");
        toast.classList.add("hide-notification");

        const removeToast = () => {
            if (toast.parentNode) toast.remove();
        };

        // remove saat animasi selesai
        toast.addEventListener("transitionend", removeToast, { once: true });

        // fallback kalau transition gagal
        setTimeout(removeToast, 500);
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
 * FIXED: Perbaikan typo openviewModal -> openViewModal
 * =================================================================
 */

/**
 * window.openModal
 * Menyiapkan form untuk penambahan data baru
 */
window.openModal = function () {
    // FLEX ROLE: cek izin input_note
    if (typeof userPerms !== 'undefined' && !userPerms.input_note) {
        showAccessDenied('Anda tidak memiliki akses untuk menambah catatan.');
        return;
    }
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
    document.getElementById("inputTopik").innerHTML = '<option value="">Pilih Toko dahulu</option>';
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

    // ===== TAMPILKAN MODAL =====
    modal.classList.add("show");
    modal.style.display = "flex";
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
 * window.openViewModal
 * Menampilkan detail lengkap satu catatan secara read-only
 * FIXED: Nama fungsi diperbaiki dari openviewModal menjadi openViewModal
 */
window.openViewModal = async function(element) {
    // 🔥 SUPPORT DESKTOP + MOBILE
    let dataSource = element.closest("tr");

    if (!dataSource) {
        dataSource = element.closest(".accordion-item");
    }

    if (!dataSource) {
        console.warn("Data source tidak ditemukan");
        return;
    }

    // pastikan master API sudah ada
    if (!window.masterAPI || masterAPI.karyawan.length === 0) {
        await loadMasterAPI();
    }

    const toko   = dataSource.dataset.toko_id || "";
    const karId  = dataSource.dataset.karyawan_id || "";
    const divisi = dataSource.dataset.divisi_id || "";

    const kar = masterAPI.karyawan.find(k => k.id == karId);

    document.getElementById("viewInputer").innerText  = dataSource.dataset.inputer || "-";
    document.getElementById("viewTopik").innerText    = dataSource.dataset.topik || "-";
    document.getElementById("viewDate").innerText     = dataSource.dataset.tanggal || "-";
    document.getElementById("viewCatatan").innerText  = dataSource.dataset.catatan || "-";

    // ====== DATA MASTER ======
    document.getElementById("viewToko").innerText = 
        kar ? kar.toko.toUpperCase() : (toko ? toko.toUpperCase() : "-");

    document.getElementById("viewKaryawan").innerText = 
        kar ? kar.nama.toUpperCase() : ("ID " + karId + " TIDAK ADA DI API");

    document.getElementById("viewDivisi").innerText = 
        kar ? kar.divisi.toUpperCase() : (divisi ? divisi.toUpperCase() : "-");

    // ================= FILE =================
    const lampiran = document.getElementById("viewLampiran");
    const previewBox = document.querySelector(".preview-box");

    lampiran.innerHTML = "";
    previewBox.innerHTML = "";

    let files = [];

    try {
        files = JSON.parse(dataSource.dataset.file || "[]");
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

    document.getElementById("viewModal").style.display = "flex";
}

// Alias untuk kompatibilitas ke belakang
window.openviewModal = window.openViewModal;

/**
 * window.openEditModal
 * Mengambil data lama dan memasukkannya kembali ke form untuk diedit
 */
window.openEditModal = async function(btn, e){
    if(e) e.stopPropagation();
    // FLEX ROLE: cek izin update_note
    if (typeof userPerms !== 'undefined' && !userPerms.update_note) {
        showAccessDenied('Anda tidak memiliki akses untuk mengubah catatan.');
        return;
    }

    if (!window.masterAPI || !masterAPI.karyawan || masterAPI.karyawan.length === 0) {
        await loadMasterAPI();
    }

    loadToko(); // pastikan dropdown toko terisi

    let dataSource = btn.closest("tr");

    // kalau tidak ada tr (mobile mode)
    if (!dataSource) {
        dataSource = btn.closest(".accordion-item");
    }

    if (!dataSource) {
        console.warn("Data source tidak ditemukan");
        return;
    }

    const form = document.getElementById("noteForm");

    const idNote     = dataSource.dataset.id;
    const idKaryawan = dataSource.dataset.karyawan_id;
    const idTopik    = dataSource.dataset.topik_id;
    const tanggal    = dataSource.dataset.tanggal;
    const catatan    = dataSource.dataset.catatan;
    const filesRaw   = dataSource.dataset.file;

    document.getElementById("modal-title").innerText = "EDIT CATATAN";
    form.dataset.editId = idNote || "";

    const tokoEl   = document.getElementById("inputToko");
    const karEl    = document.getElementById("inputKaryawan");

    // ====== AMBIL DATA KARYAWAN DARI API ======
    const kar = getKaryawanById(idKaryawan);

    if(kar){
        // ================= TOKO =================
        tokoEl.value = kar.toko;
        await loadKaryawanByToko(kar.toko);

        // ================= KARYAWAN =================
        karEl.value = kar.id;

        // ================= DIVISI =================
        updateDivisi();
    } else {
        console.warn("Karyawan tidak ditemukan di masterAPI");
    }

    // ================= FIELD LAIN =================
    await loadTopikByToko(kar.toko, idTopik);
    document.getElementById("inputDate").value    = tanggal || "";
    document.getElementById("inputCatatan").value = catatan || "";

    // ================= FILE =================
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
 */
function initSearchKaryawan() {
    const input = document.getElementById("searchKaryawanInput");
    const select = document.getElementById("inputKaryawan");

    if (!input || !select) return;

    let debounceTimer;
    input.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const keyword = this.value.toLowerCase();

            Array.from(select.options).forEach((opt, i) => {
                if (i === 0) return; // skip "Pilih Karyawan"
                const text = opt.dataset.search || opt.textContent.toLowerCase();
                opt.style.display = text.includes(keyword) ? '' : 'none';
            });
        }, 300); // Debounce 300ms
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
 * FIXED: Hanya satu implementasi delete dengan deleteTargetId
 * =================================================================
 */

window.saveNote = function () {
    // FLEX ROLE: cek izin input_note
    if (typeof userPerms !== 'undefined' && !userPerms.input_note) {
        showAccessDenied('Anda tidak memiliki akses untuk menyimpan catatan.');
        return;
    }
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
    .then(res => res.json())
    .then(res => {
        if (res.status === "success") {
            showNotification(editId ? "Catatan berhasil diupdate" : "Catatan berhasil disimpan", "success");
            console.log(res);
            setTimeout(() => location.reload(), 600);
        } else if (res.status === "forbidden") {
            closeModal();
            showAccessDenied(res.message || "Anda tidak memiliki akses untuk operasi ini.");
            btn.disabled = false;
            btn.innerText = "SIMPAN";
        } else {
            closeModal();
            showNotification(res, "error");
            btn.disabled = false;
            btn.innerText = "SIMPAN";
        }
    })
    .catch(() => {
        showNotification("Gagal terhubung ke server", "error");
        closeModal();
        btn.disabled = false;
        btn.innerText = "SIMPAN";
    });
}

/**
 * window.deleteNote
 * Menampilkan konfirmasi dan menghapus catatan
 * FIXED: Menggunakan deleteTargetId, bukan deleteId
 */
window.deleteNote = function(id, e){
    if(e) e.stopPropagation();
    // FLEX ROLE: cek izin delete_note
    if (typeof userPerms !== 'undefined' && !userPerms.delete_note) {
        showAccessDenied('Anda tidak memiliki akses untuk menghapus catatan.');
        return;
    }
    deleteTargetId = id;
    document.getElementById("confirmModal").style.display = "flex";
}

/**
 * =================================================================
 * 6. LOGIKA TABEL (RENDER & FILTERING)
 * =================================================================
 */

/**
 * window.applyFilters
 * Menerapkan filter pada tabel berdasarkan input pencarian
 * FIXED: Menambahkan debounce untuk performa
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
 * FIXED: Hanya satu DOMContentLoaded listener
 * =================================================================
 */

/**
 * initApplication
 * Fungsi utama untuk inisialisasi seluruh aplikasi
 */
async function initApplication() {
    // Load master API terlebih dahulu
    await loadMasterAPI();
    
    // Inisialisasi variabel global
    modal = document.getElementById('modal');
    viewModal = document.getElementById('viewModal');
    modalTitle = document.getElementById('modal-title');
    noteForm = document.getElementById('noteForm');
    tableBody = document.getElementById('noteTableBody');
    searchBar = document.getElementById('searchBar');
    
    // Inisialisasi fitur pencarian karyawan
    initSearchKaryawan();
    initDataTable();

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

    // Setup filter events dengan debounce
    let filterDebounceTimer;
    const filterHandler = () => {
        clearTimeout(filterDebounceTimer);
        filterDebounceTimer = setTimeout(window.applyFilters, 300);
    };

    if (searchBar) {
        searchBar.addEventListener('input', filterHandler);
    }

    document.querySelectorAll('#filterCard input').forEach(el => {
        el.addEventListener('input', filterHandler);
    });

    // Setup validasi form real-time
    const inputCatatan = document.getElementById('inputCatatan');
    const inputFile = document.getElementById('inputFile');
    if (inputCatatan) inputCatatan.addEventListener('input', checkOptionalFields);
    if (inputFile) inputFile.addEventListener('change', checkOptionalFields);

    // Setup konfirmasi delete - SATU IMPLEMENTASI
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
        .then(res => res.json())
        .then(data => {
            if(data.status === "success"){
                showNotification("Catatan berhasil dihapus", "success");
                setTimeout(() => location.reload(), 600);
            } else {
                showNotification("Gagal menghapus data", "error");
            }
        })
        .catch(() => {
            showNotification("Terjadi kesalahan server", "error");
        });

        document.getElementById("confirmModal").style.display = "none";
    };

    // Sinkronisasi ulang margin sidebar
    adjustMainContentMargin();
    
    // Inisialisasi mobile accordion
    if (window.innerWidth <= 768) {
        setTimeout(initMobileAccordion, 100);
    }
}

// Event listener untuk resize window
window.addEventListener('resize', function() {
    adjustMainContentMargin();
    if (window.innerWidth <= 768) {
        initMobileAccordion();
    } else {
        destroyMobileAccordion();
    }
});

// SATU DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', initApplication);

function initDataTable() {
    if ($.fn.DataTable.isDataTable('#master-table-all')) {
        $('#master-table-all').DataTable().destroy();
    }

    $('#master-table-all').DataTable({
        responsive: true,
        lengthChange: false,
        autoWidth: false,
        paging: true,
        pageLength: 10,
        searching: false,
        ordering: false,
        info: true,
        columnDefs: [
            { className: "dt-center", targets: "_all" }
        ]
    });
}

/**
 * =================================================================
 * 8. MASTER API MANAGEMENT
 * =================================================================
 */

// LOAD API // 
let masterAPI = {
    toko: [],
    karyawan: []
};

async function loadMasterAPI() {
    try {
        const res = await fetch("routines/base_api.php");
        const data = await res.json();
        masterAPI = data;
    } catch (error) {
        console.error("Gagal load master API:", error);
    }
}

function loadToko() {
    const tokoSelect = document.getElementById("inputToko");
    tokoSelect.innerHTML = `<option value="">Pilih Toko</option>`;

    masterAPI.toko.forEach(t => {
        tokoSelect.innerHTML += `<option value="${t}">${t.toUpperCase()}</option>`;
    });
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

async function loadTopikByToko(tokoId, selectedTopikId = null) {
    const topikSelect = document.getElementById("inputTopik");
    topikSelect.innerHTML = `<option value="">Loading topik...</option>`;
    topikSelect.disabled = true;

    if (!tokoId) {
        topikSelect.innerHTML = `<option value="">Pilih Toko dahulu</option>`;
        topikSelect.disabled = false;
        return;
    }

    try {
        const divisiId = document.getElementById("divisi_id").value || "";
        let url = `api/api_topik.php?toko_id=${encodeURIComponent(tokoId)}`;
        if (divisiId) url += `&divisi_id=${encodeURIComponent(divisiId)}`;

        const res = await fetch(url);
        const data = await res.json();

        topikSelect.innerHTML = `<option value="">Pilih Topik</option>`;

        if (data.status && data.data.length > 0) {
            data.data.forEach(tp => {
                const opt = document.createElement("option");
                opt.value = tp.id;
                opt.textContent = tp.nama_topik;
                if (selectedTopikId && tp.id == selectedTopikId) opt.selected = true;
                topikSelect.appendChild(opt);
            });
        } else {
            topikSelect.innerHTML = `<option value="">Tidak ada topik untuk toko ini</option>`;
        }
    } catch (e) {
        topikSelect.innerHTML = `<option value="">Gagal load topik</option>`;
        console.error("Error load topik:", e);
    }

    topikSelect.disabled = false;
}

document.getElementById("inputToko").addEventListener("change", function () {
    document.getElementById("inputDivisi").value = "";
    document.getElementById("divisi_id").value = "";
    document.getElementById("inputKaryawan").innerHTML = `<option value="">Pilih Karyawan</option>`;

    if (this.value) {
        loadKaryawanByToko(this.value);
        loadTopikByToko(this.value);
    } else {
        document.getElementById("inputTopik").innerHTML = `<option value="">Pilih Toko dahulu</option>`;
    }
});

function updateDivisi() {
    const kar = document.querySelector("#inputKaryawan option:checked");
    if (!kar) return;

    document.getElementById("inputDivisi").value = kar.dataset.divisi || "-";
    document.getElementById("divisi_id").value = kar.dataset.divisi || "";
}

/* ============================================================
   MOBILE ACCORDION RESPONSIVE TABLE
   ============================================================ */

function initMobileAccordion() {
    const tableWrap = document.querySelector('.table-wrap');
    const table = tableWrap?.querySelector('table');
    const tbody = table?.querySelector('tbody');

    if (!tableWrap || !table || !tbody) return;

    // Sembunyikan tabel
    table.style.display = 'none';

    // Sembunyikan info & paginate DataTables bawaan di mobile
    const dtWrapper = document.querySelector('.dataTables_wrapper');
    if (dtWrapper) {
        const dtInfo    = dtWrapper.querySelector('.dataTables_info');
        const dtPaginate = dtWrapper.querySelector('.dataTables_paginate');
        if (dtInfo)    dtInfo.style.display    = 'none';
        if (dtPaginate) dtPaginate.style.display = 'none';
    }

    let accordionContainer = tableWrap.querySelector('.mobile-accordion-container');

    if (!accordionContainer) {
        accordionContainer = document.createElement('div');
        accordionContainer.className = 'mobile-accordion-container';
        tableWrap.appendChild(accordionContainer);
    }

    accordionContainer.style.display = '';
    accordionContainer.innerHTML = '';

    const rows = Array.from(tbody.querySelectorAll('tr'));

    if (rows.length === 0) {
        accordionContainer.innerHTML = `
            <div class="mobile-accordion-empty">
                <i class="fas fa-inbox"></i>
                <p>Tidak ada data ditemukan</p>
            </div>
        `;
        renderMobileFooter(accordionContainer, { recordsTotal: 0 });
        return;
    }

    const headers = Array.from(table.querySelectorAll('th')).map(th =>
        th.textContent.trim()
    );

    rows.forEach((row, index) => {
        const cells = Array.from(row.querySelectorAll('td'));

        const rowData = {};
        cells.forEach((cell, i) => {
            if (headers[i]) {
                rowData[headers[i]] = cell.innerHTML;
            }
        });

        const item = createAccordionItem(index + 1, rowData);

        Object.keys(row.dataset).forEach(key => {
            item.dataset[key] = row.dataset[key];
        });

        accordionContainer.appendChild(item);
    });

    // Render info & pagination di bawah accordion
    const dtApi = $('#master-table-all').DataTable();
    const pageInfo = dtApi.page.info();
    renderMobileFooter(accordionContainer, pageInfo);
}

function renderMobileFooter(container, pageInfo) {
    // Hapus footer lama kalau ada
    const old = container.parentNode.querySelector('.mobile-dt-footer');
    if (old) old.remove();

    if (!pageInfo || pageInfo.recordsTotal === 0) return;

    const start   = pageInfo.start + 1;
    const end     = pageInfo.end;
    const total   = pageInfo.recordsTotal;
    const page    = pageInfo.page;
    const pages   = pageInfo.pages;

    const footer = document.createElement('div');
    footer.className = 'mobile-dt-footer';

    // Info text
    const info = document.createElement('div');
    info.className = 'mobile-dt-info';
    info.textContent = `Showing ${start} to ${end} of ${total} entries`;

    // Pagination
    const paginate = document.createElement('div');
    paginate.className = 'mobile-dt-paginate';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'mobile-dt-btn' + (page === 0 ? ' disabled' : '');
    prevBtn.textContent = '← Previous';
    prevBtn.disabled = page === 0;
    prevBtn.onclick = () => {
        $('#master-table-all').DataTable().page('previous').draw('page');
        setTimeout(initMobileAccordion, 50);
    };

    const nextBtn = document.createElement('button');
    nextBtn.className = 'mobile-dt-btn' + (page >= pages - 1 ? ' disabled' : '');
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = page >= pages - 1;
    nextBtn.onclick = () => {
        $('#master-table-all').DataTable().page('next').draw('page');
        setTimeout(initMobileAccordion, 50);
    };

    const pageNum = document.createElement('span');
    pageNum.className = 'mobile-dt-pagenum';
    pageNum.textContent = `${page + 1} / ${pages}`;

    paginate.appendChild(prevBtn);
    paginate.appendChild(pageNum);
    paginate.appendChild(nextBtn);

    footer.appendChild(info);
    footer.appendChild(paginate);
    container.parentNode.appendChild(footer);
}

function destroyMobileAccordion() {
    const tableWrap = document.querySelector('.table-wrap');
    const table = tableWrap?.querySelector('table');
    const accordionContainer = tableWrap?.querySelector('.mobile-accordion-container');

    if (table) table.style.display = '';
    if (accordionContainer) accordionContainer.style.display = 'none';
}

function createAccordionItem(rowNumber, rowData) {
    const item = document.createElement('div');
    item.className = 'accordion-item';

    const values = Object.values(rowData);
    const keys   = Object.keys(rowData);

    // Header: tampilkan TANGGAL (index 1) sebagai judul, INPUTER (index 2) sebagai subtitle
    const tanggal  = values[1] || '-';
    const inputer  = values[2] || '';
    const toko     = values[3] || '';

    // Build data rows (kiri: label, kanan: nilai) — skip NO (0) dan ACTION (last)
    let dataGridHTML = '<div class="accordion-data-grid">';

    keys.forEach((label, index) => {
        if (index === 0) return;                    // skip NO
        if (index === keys.length - 1) return;      // skip ACTION
        dataGridHTML += `
            <div class="data-row">
                <span class="data-label">${label}</span>
                <span class="data-value">${values[index]}</span>
            </div>
        `;
    });

    dataGridHTML += '</div>';

    // ACTION BUTTONS dari kolom terakhir
    const actionHTML = values[keys.length - 1] || '';

    item.innerHTML = `
        <div class="accordion-header">
            <div class="header-content">
                <span class="row-number">${rowNumber}</span>
                <div class="row-main-info">
                    <div class="row-title">${tanggal}</div>
                    <div class="row-subtitle">
                        <span><i class="fas fa-user" style="font-size:10px;opacity:.7;"></i> ${inputer}</span>
                    </div>
                </div>
            </div>
            <div class="accordion-toggle">
                <i class="fas fa-chevron-down"></i>
            </div>
        </div>

        <div class="accordion-body">
            ${dataGridHTML}
            <div class="accordion-actions">
                ${actionHTML}
            </div>
        </div>
    `;

    return item;
}

/* ============================================================
   ACCORDION TOGGLE
   ============================================================ */

document.addEventListener('click', function (e) {
    const header = e.target.closest('.accordion-header');
    if (!header) return;

    const item = header.closest('.accordion-item');
    const body = item.querySelector('.accordion-body');
    const icon = header.querySelector('.accordion-toggle i');

    document.querySelectorAll('.accordion-item.active').forEach(active => {
        if (active !== item) {
            active.classList.remove('active');
            active.querySelector('.accordion-body').style.maxHeight = '0';
            active.querySelector('.accordion-toggle i').style.transform = 'rotate(0deg)';
        }
    });

    if (item.classList.contains('active')) {
        item.classList.remove('active');
        body.style.maxHeight = '0';
        icon.style.transform = 'rotate(0deg)';
    } else {
        item.classList.add('active');
        body.style.maxHeight = body.scrollHeight + 'px';
        icon.style.transform = 'rotate(180deg)';
    }
});

/* ============================================================
   VIEW NOTE (MOBILE MODE)
   FIXED: Menggunakan openViewModal bukan openviewModal
   ============================================================ */

document.addEventListener('click', function (e) {
    // Jangan jalan kalau klik tombol action
    if (e.target.closest('.edit-btn') || 
        e.target.closest('.delete-btn') || 
        e.target.closest('.accordion-actions')) {
        return;
    }

    const item = e.target.closest('.accordion-item');
    if (!item) return;

    // kalau klik header saja
    if (!e.target.closest('.accordion-header')) return;

    // 🔥 buka view modal pakai dataset accordion
    if (typeof openViewModal === "function") {
        openViewModal(item);
    }
});

/* ============================================================
   ACTION BUTTON EVENT DELEGATION (EDIT SAFE)
   ============================================================ */

document.addEventListener('click', function (e) {
    const editBtn = e.target.closest('.edit-btn');
    if (!editBtn) return;

    e.stopPropagation();
    openEditModal(editBtn);
});

/* ============================================================
   REFRESH FUNCTION
   ============================================================ */

function refreshMobileAccordion() {
    if (window.innerWidth <= 768) {
        initMobileAccordion();
    }
}