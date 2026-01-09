/**
 * =================================================================
 * 0. DATA DUMMY & KONFIGURASI GLOBAL
 * =================================================================
 */

// let dummyDataNotes = {
//     1: {
//         id: 1,
//         inputer: 'Bambang',
//         toko: 'toyomatsu',
//         karyawan: 'Rudi',
//         divisi: 'Kurir',
//         topik: 'Gagal Kirim',
//         date: '2025-01-15',
//         catatan: 'Kurir gagal kirim customer A.',
//         file: true
//     },
//     2: {
//         id: 2,
//         inputer: 'Sujarwo',
//         toko: 'robin jaya',
//         karyawan: 'Dina',
//         divisi: 'Mekanik',
//         topik: 'Kedisiplinan',
//         date: '2025-01-20',
//         catatan: 'Terlihat berserakan tools dibawah meja.',
//         file: false
//     }
// };

// // Counter untuk ID catatan berikutnya
// let nextNoteId = 3;

// Referensi Elemen DOM
// let modal, viewModal, modalTitle, noteForm, tableBody, searchBar;
// const inputerDefault = 'Administrator'; // Nama default untuk pencatat baru

// console.log("home.js dimuat");
// console.log("Data dummyNotes:", dummyDataNotes);

/**
 * =================================================================
 * 1. FUNGSI UTILITAS: NOTIFIKASI & UI SIDEBAR
 * =================================================================
 */

const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('main');
const toggleBtn = document.querySelector('toggle-btn');

/**
 * window.showNotification
 * Menampilkan pesan pop-up (Toast) di pojok layar
 */
window.showNotification = function (message, type = 'info') {
    console.log(`Notification: ${message} (${type})`);

    let container = document.getElementById('notification-container');

    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
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

    setTimeout(() => {
        notification.classList.add('hide-notification');
        notification.addEventListener('transitionend', () => notification.remove());
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

    // Set limit tanggal maksimal adalah hari ini
    const inputDate = document.getElementById('inputDate');
    if (inputDate) {
        const today = new Date().toISOString().split('T')[0];
        inputDate.value = today;
        inputDate.setAttribute('max', today);
    }

    window.updateDivisi(); // Reset tampilan divisi
    modal.style.display = 'flex';
}

/**
 * window.closeModal & window.closeViewModal
 */
window.closeModal = function () {
    console.log("closeModal dipanggil");
    modal = modal || document.getElementById('modal');
    if (modal) modal.style.display = 'none';
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
window.openviewModal = function (noteId) {
    console.log(`openviewModal dipanggil untuk id: ${noteId}`);

    viewModal = viewModal || document.getElementById('viewModal');
    const data = dummyDataNotes[noteId];

    if (!data) {
        console.error(`Data dengan id ${noteId} tidak ditemukan!`);
        return;
    }

    if (!viewModal) {
        console.error("View modal tidak ditemukan!");
        return;
    }

    // Format tanggal ke gaya Indonesia
    const dateObj = new Date(data.date + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Helper intern: Isi teks elemen berdasarkan ID
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setText('viewInputer', data.inputer);
    setText('viewToko', data.toko.toUpperCase());
    setText('viewKaryawan', data.karyawan.charAt(0).toUpperCase() + data.karyawan.slice(1));
    setText('viewTopik', data.topik.charAt(0).toUpperCase() + data.topik.slice(1));
    setText('viewDivisi', data.divisi);
    setText('viewDate', formattedDate);
    setText('viewCatatan', data.catatan || '(Tidak ada catatan)');

    // Cek status lampiran
    const lampiran = document.getElementById('viewLampiran');
    if (lampiran) {
        lampiran.innerHTML = data.file
            ? '<span class="text-success">Terlampir</span>'
            : '<span class="text-muted">Tidak ada lampiran</span>';
    }

    // Preview gambar (jika ada)
    const previewBox = document.getElementById('viewPreview');
    if (previewBox) {
        previewBox.innerHTML = data.file
            ? '<p><i class="fas fa-file-alt fa-2x"></i><br>File terlampir</p>'
            : 'Tidak ada file gambar terlampir.';
    }

    viewModal.style.display = 'flex';
}

/**
 * window.openEditModal
 * Mengambil data lama dan memasukkannya kembali ke form untuk diedit
 */
window.openEditModal = function (noteId) {
    console.log(`openEditModal dipanggil untuk id: ${noteId}`);

    modal = modal || document.getElementById('modal');
    noteForm = noteForm || document.getElementById('noteForm');
    modalTitle = modalTitle || document.getElementById('modal-title');

    const data = dummyDataNotes[noteId];
    if (!data || !modal || !noteForm) {
        showNotification("Data tidak ditemukan!", 'error');
        return;
    }

    modalTitle.textContent = "EDIT CATATAN";
    noteForm.dataset.noteId = noteId;

    const fill = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };

    fill('inputToko', data.toko);
    fill('inputKaryawan', data.karyawan);
    fill('inputDivisi', data.divisi);
    fill('inputTopik', data.topik);
    fill('inputDate', data.date);
    fill('inputCatatan', data.catatan || '');

    modal.style.display = 'flex';
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
    const inputKaryawan = document.getElementById('inputKaryawan');
    const inputDivisi = document.getElementById('inputDivisi');
    if (!inputKaryawan || !inputDivisi) return;

    const val = inputKaryawan.value.toLowerCase();
    let divisi = '';

    if (val.includes('rudi')) divisi = 'Kurir';
    else if (val.includes('dina')) divisi = 'Mekanik';
    else if (val.includes('roni')) divisi = 'Sales';
    else if (val.includes('didik')) divisi = 'Sales';
    else divisi = '-';

    inputDivisi.value = divisi;
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
    console.log("saveNote dipanggil");

    modal = modal || document.getElementById('modal');
    noteForm = noteForm || document.getElementById('noteForm');

    const noteId = parseInt(noteForm.dataset.noteId) || 0;

    const toko = document.getElementById('inputToko').value;
    const karyawan = document.getElementById('inputKaryawan').value;
    const divisi = document.getElementById('inputDivisi').value;
    const topik = document.getElementById('inputTopik').value;
    const date = document.getElementById('inputDate').value;
    const catatan = document.getElementById('inputCatatan').value.trim();
    const hasFile = document.getElementById('inputFile').files.length > 0;

    if (!noteForm.checkValidity()) {
        noteForm.reportValidity();
        return;
    }

    if (catatan === "" && !hasFile) {
        showNotification("Isi Catatan atau lampirkan File!", 'error');
        return;
    }

    try {
        if (noteId === 0) {
            const newId = nextNoteId++;
            dummyDataNotes[newId] = {
                id: newId,
                inputer: inputerDefault,
                toko, karyawan, divisi, topik, date, catatan,
                file: hasFile
            };
            showNotification("Catatan berhasil ditambahkan!", "success");
        } else {
            if (dummyDataNotes[noteId]) {
                dummyDataNotes[noteId] = {
                    ...dummyDataNotes[noteId],
                    toko, karyawan, divisi, topik, date, catatan,
                    file: hasFile || dummyDataNotes[noteId].file
                };
                showNotification("Perubahan berhasil disimpan!", "success");
            }
        }

        window.closeModal();
        window.renderTable();
        window.applyFilters();

    } catch (error) {
        console.error("Save error:", error);
        showNotification("Gagal menyimpan data", "error");
    }
}

/**
 * window.deleteNote
 */
window.deleteNote = function (noteId) {
    const id = parseInt(noteId);
    const dataToDelete = dummyDataNotes[id];
    if (!dataToDelete) return;

    const tokoName = dataToDelete.toko.toUpperCase();
    if (confirm(`Hapus catatan Toko ${tokoName}? Aksi ini permanen.`)) {
        delete dummyDataNotes[id];
        showNotification(`Catatan Toko ${tokoName} dihapus.`, 'error');
        window.renderTable();
        window.applyFilters();
    }
}

/**
 * =================================================================
 * 4. LOGIKA TABEL (RENDER & FILTERING)
 * =================================================================
 */

window.renderTable = function () {
    tableBody = tableBody || document.getElementById('noteTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    const sortedIds = Object.keys(dummyDataNotes);

    // 👉 HANDLER JIKA BELUM ADA CATATAN
    if (sortedIds.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    } else {
        if (emptyState) emptyState.style.display = 'none';
    }
    
    sort((a, b) => parseInt(a) - parseInt(b));
    let counter = 1;

    sortedIds.forEach(id => {
        const data = dummyDataNotes[id];
        const formattedDate = data.date.substring(0, 10).replace(/-/g, '/');
        const formattedKaryawan = data.karyawan.charAt(0).toUpperCase() + data.karyawan.slice(1);
        const formattedDivisi = data.divisi.charAt(0).toUpperCase() + data.divisi.slice(1);
        const formattedTopik = data.topik.charAt(0).toUpperCase() + data.topik.slice(1);

        const fileIcon = data.file
            ? '<i class="fas fa-paperclip" style="color:#4a47ff" title="File terlampir"></i>'
            : '<i class="far fa-times-circle" style="color:#e74c3c" title="Tidak ada file"></i>';

        const shortCatatan = data.catatan.length > 30
            ? data.catatan.substring(0, 30) + '...'
            : data.catatan;

        const row = document.createElement('tr');
        row.classList.add('accordion-row');

        row.innerHTML = `
            <td data-label="NO">${counter++}</td> 
            <td data-label="TANGGAL">${formattedDate}</td>    
            <td data-label="INPUTER">${data.inputer}</td>
            <td data-label="TOKO">${data.toko.toUpperCase()}</td>
            <td data-label="KARYAWAN">${formattedKaryawan}</td>
            <td data-label="DIVISI">${formattedDivisi}</td>
            <td data-label="TOPIK">${formattedTopik}</td>
            <td data-label="CATATAN" title="${data.catatan}">${shortCatatan}</td>
            <td data-label="FILE">${fileIcon}</td>
            <td data-label="ACTION" class="action-cell">
                <span class="action-icons-wrapper">
                    <span class="edit-btn" onclick="event.stopPropagation(); openEditModal(${data.id})">
                        <i class="fas fa-edit"></i>
                    </span>
                    <span class="delete-btn" onclick="event.stopPropagation(); deleteNote(${data.id})">
                        <i class="fas fa-trash"></i>
                    </span>
                </span>
            </td>
            <td class="expand-trigger">
                <button class="btn-detail-toggle">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </td>
        `;

        const btnToggle = row.querySelector('.btn-detail-toggle');
        if (btnToggle) {
            btnToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                row.classList.toggle('is-open');
                const icon = btnToggle.querySelector('i');
                icon.style.transform = row.classList.contains('is-open') ? 'rotate(180deg)' : 'rotate(0deg)';
            });
        }

        row.addEventListener('click', (e) => {
            if (!e.target.closest('.action-cell') &&
                !e.target.closest('.expand-trigger') &&
                !e.target.closest('.edit-btn') &&
                !e.target.closest('.delete-btn') &&
                window.innerWidth > 768) {
                window.openviewModal(data.id);
            }
        });

        tableBody.appendChild(row);
    });
}

window.applyFilters = function () {
    searchBar = searchBar || document.getElementById('searchBar');
    tableBody = tableBody || document.getElementById('noteTableBody');
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

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 10) return;

        const rowData = {
            tanggal: cells[1]?.textContent.toLowerCase().trim() || '',
            inputer: cells[2]?.textContent.toLowerCase().trim() || '',
            toko: cells[3]?.textContent.toLowerCase().trim() || '',
            karyawan: cells[4]?.textContent.toLowerCase().trim() || '',
            divisi: cells[5]?.textContent.toLowerCase().trim() || '',
            topik: cells[6]?.textContent.toLowerCase().trim() || '',
            allText: row.textContent.toLowerCase()
        };

        const matchSpecific =
            (!f.tanggal || rowData.tanggal.includes(f.tanggal)) &&
            (!f.inputer || rowData.inputer.includes(f.inputer)) &&
            (!f.toko || rowData.toko.includes(f.toko)) &&
            (!f.karyawan || rowData.karyawan.includes(f.karyawan)) &&
            (!f.divisi || rowData.divisi.includes(f.divisi)) &&
            (!f.topik || rowData.topik.includes(f.topik));

        const matchSearch = !searchTerm || rowData.allText.includes(searchTerm);
        row.style.display = (matchSpecific && matchSearch) ? '' : 'none';
    });

    const emptyState = document.getElementById('emptyState');
    let visibleCount = 0;

    rows.forEach(row => {
    if (matchSpecific && matchSearch) {
        row.style.display = '';
        visibleCount++;
    } else {
        row.style.display = 'none';
    }
    });

    if (emptyState) {
    emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    }

};

/**
 * =================================================================
 * 5. INISIALISASI & DOM READY
 * =================================================================
 */

function initApplication() {
    modal = document.getElementById('modal');
    viewModal = document.getElementById('viewModal');
    modalTitle = document.getElementById('modal-title');
    noteForm = document.getElementById('noteForm');
    tableBody = document.getElementById('noteTableBody');
    searchBar = document.getElementById('searchBar');

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

    window.renderTable();
    adjustMainContentMargin();
}

document.addEventListener('DOMContentLoaded', initApplication);

window.debugApp = function () {
    console.log("dummyDataNotes:", dummyDataNotes);
    window.renderTable();
}