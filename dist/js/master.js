/* ==========================================================================
   MASTER MANAGEMENT SYSTEM - master.js
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. STATE & DATABASE (SIMULASI)
   -------------------------------------------------------------------------- */

// Counter ID Otomatis
let nextMasterId = 4;
let nextMasterUserRoleId = 4;
let nextMasterDivisiId = 3;
let nextMasterTopikId = 3;
let nextMasterKaryawanId = 4;

console.log("MASTER JS LOADED");

let masterTokoOptions = [];
let masterDivisiOptions = [];

async function loadMasterOptions() {
    // Ambil TOKO
    const tokoRes = await fetch("direct/get_master_toko.php?action=get");
    const tokoJson = await tokoRes.json();
    masterTokoOptions = tokoJson.data || [];

    // Ambil DIVISI
    const divRes = await fetch("direct/get_master_divisi.php?action=get");
    const divJson = await divRes.json();
    masterDivisiOptions = divJson.data || [];
}

/* --------------------------------------------------------------------------
   2. KONFIGURASI MASTER DATA MAP
   -------------------------------------------------------------------------- */

const masterDataMap = {
    'TOKO': {
        // data: dummyMasterToko,
        fields: ['NO', 'TGL DIBUAT', 'DIBUAT OLEH', 'NAMA TOKO', 'KODE', 'ACTION'],
        action: 'ADD TOKO',
        title: 'TOKO',
        modalFields: [
            { label: 'NAMA TOKO', key: 'namaToko', type: 'text' },
            { label: 'KODE', key: 'kode', type: 'text' },
        ],
        nextIdKey: 'nextMasterId'
    },
    'DIVISI': {
        // data: dummyMasterDivisi,
        fields: ['NO', 'TGL DIBUAT', 'DIBUAT OLEH', 'NAMA DIVISI', 'DESKRIPSI', 'TOKO', 'ACTION'],
        action: 'ADD DIVISI',
        title: 'DIVISI',
        modalFields: [
            { label: 'NAMA DIVISI', key: 'namaDivisi', type: 'text' },
            { label: 'DESKRIPSI', key: 'deskripsi', type: 'text' },
            { label: 'NAMA TOKO', key: 'nama_toko', type: 'select-db', source: 'toko' },
        ],
        nextIdKey: 'nextMasterDivisiId'
    },
    'TOPIK': {
        // data: dummyMasterTopik,
        fields: ['NO', 'TGL DIBUAT', 'DIBUAT OLEH', 'NAMA TOPIK', 'TOKO', 'DIVISI', 'ACTION'],
        action: 'ADD TOPIK',
        title: 'TOPIK',
        modalFields: [
            { label: 'NAMA TOPIK', key: 'namaTopik', type: 'text' },
            { label: 'NAMA TOKO', key: 'toko_id', type: 'select-db', source: 'toko' },
            { label: 'NAMA DIVISI', key: 'divisi_id', type: 'select-db', source: 'divisi' },
        ],
        nextIdKey: 'nextMasterTopikId'
    },
    'KARYAWAN': {
        // data: dummyMasterKaryawan,
        fields: ['NO', 'TGL DIBUAT', 'DIBUAT OLEH', 'NAMA KARYAWAN', 'TOKO', 'DIVISI', 'ACTION'],
        action: 'ADD KARYAWAN',
        title: 'KARYAWAN',
        modalFields: [
            { label: 'NAMA KARYAWAN', key: 'namaKaryawan', type: 'text' },
            { label: 'NAMA TOKO', key: 'toko_id', type: 'select-db', source: 'toko' },
            { label: 'NAMA DIVISI', key: 'divisi_id', type: 'select-db', source: 'divisi' },
        ],        
        nextIdKey: 'nextMasterKaryawanId'
    },
    'USER ROLE': {
        // data: dummyMasterUserRole,
        fields: ['NO', 'TGL DIBUAT', 'DIBUAT OLEH', 'NAMA ROLE', 'LIST KEYS', 'ACTION'],
        action: 'ADD USER ROLE',
        title: 'USER ROLE',
        modalFields: [
            { label: 'NAMA ROLE', key: 'namaRole', type: 'text' },
        ],
        nextIdKey: 'nextMasterUserRoleId'
    }
};

const AVAILABLE_KEYS = [
    'UPDATE TOKO', 'MANAGE USER', 'UPDATE ROLE', 'UPDATE DIVISI', 'UPDATE TOPIK', 'UPDATE KARYAWAN', 'VIEW NOTE', 'INPUT NOTE', 'UPDATE NOTE', 'DELETE NOTE'
];

/* --------------------------------------------------------------------------
   3. DOM ELEMENTS INITIALIZATION
   -------------------------------------------------------------------------- */

const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('main');
const toggleBtn = document.getElementById('toggle-btn');
const masterModal = document.getElementById('masterModal');
const masterTableBody = document.getElementById('masterTableBody');
const masterTableHeader = document.querySelector('.table-wrap table thead tr');
const btnAddToko = document.getElementById('btnAddToko');
const formMaster = document.getElementById('masterForm');
const masterSearch = document.getElementById('masterSearch');
const masterTabs = document.querySelectorAll('.master-tab');
const masterHeaderTitle = document.querySelector('.section-title');
const masterHeaderButtonText = document.querySelector('#btnAddMaster');
// const modalTitle = document.getElementById('modal-master-title');
const masterHeader = document.querySelector('.master-header');
const masterCard = document.querySelector('.table-card');
const tableDivider = document.querySelector('.table-divider');

// Global Status Variable
let currentMasterEditId = null; 
let activeMasterKey = null;
let isTokoMode = false;

// Tambahkan ini di bagian paling atas master.js atau home.js
let modal = document.getElementById('masterModal');
let modalTitle = document.getElementById('modal-master-title');
let masterForm = document.getElementById('masterForm');



/* --------------------------------------------------------------------------
   4. UTILITY FUNCTIONS (NOTIFIKASI)
   -------------------------------------------------------------------------- */

function showNotification(type, message) {
    let notificationContainer = document.querySelector('#notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        document.body.appendChild(notificationContainer);
    }

    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;

    let icon = '';
    if (type === 'success') icon = '<i class="fas fa-check-circle"></i>';
    if (type === 'error') icon = '<i class="fas fa-exclamation-circle"></i>';
    if (type === 'info') icon = '<i class="fas fa-info-circle"></i>';

    toast.innerHTML = `
        ${icon}
        <div class="notification-message">${message}</div>
    `;

    notificationContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.add('hide-notification');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
}

function toggleMasterContent(show = false) {
    if (masterHeader) masterHeader.style.visibility = show ? 'visible' : 'hidden';
    if (masterCard) masterCard.style.display = show ? 'block' : 'none';
    
    // Gunakan pengecekan if agar tidak error jika tableDivider null
    if (tableDivider) {
        tableDivider.style.display = show ? 'block' : 'none';
    }
    
    if (!show && masterHeaderTitle) {
        masterHeaderTitle.textContent = "SILAKAN PILIH KATEGORI MASTER";
    }
}

/* --------------------------------------------------------------------------
   5. MODAL FORM GENERATOR & HANDLER
   -------------------------------------------------------------------------- */

function renderModalForm(data = null) {
    const config = masterDataMap[activeMasterKey];
    if (!config || !formMaster) return;

    let formHTML = '';

    // 1. Header Info
    if (data && (data.tglDibuat || data.dibuatOleh)) {
        formHTML += `
        <div style="display: flex; gap: 25px; margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px; border: 1px solid #ddd;">
            <div style="font-size: 0.9rem;">
                <span style="font-weight: bold; color: #666; display: block; font-size: 0.7rem; text-transform: uppercase;">Tanggal Dibuat</span>
                ${data.tglDibuat || '-'}
            </div>
            <div style="font-size: 0.9rem;">
                <span style="font-weight: bold; color: #666; display: block; font-size: 0.7rem; text-transform: uppercase;">Dibuat Oleh</span>
                ${data.dibuatOleh || '-'}
            </div>
        </div>`;
    }

    // 2. Render Field Biasa
    config.modalFields.forEach(field => {
        let value = data ? (data[field.key] || '') : '';
        formHTML += `<label style="display:block; margin-bottom:5px; font-weight:bold; font-size: 0.9rem;">${field.label}</label>`;
        
            if (field.type === 'select-db') {

                let options = [];
                if (field.source === 'toko') options = masterTokoOptions;
                if (field.source === 'divisi') options = masterDivisiOptions;
            
                formHTML += `
                    <select id="modalInput-${field.key}" class="modal-select" required>
                        <option value="">-- Pilih ${field.label} --</option>
                        ${options.map(opt => `
                            <option value="${opt.id}" ${data && data[field.key] == opt.id ? 'selected' : ''}>
                                ${opt.nama_toko || opt.nama_divisi}
                            </option>
                        `).join('')}
                    </select>
                `;
        } else {
            formHTML += `<input type="${field.type}" id="modalInput-${field.key}" name="${field.key}" value="${value}" required style="width:100%; height:40px; margin-bottom:15px; padding: 0 10px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px;">`;
        }
    });

    // 3. Logika Khusus USER ROLE
    if (activeMasterKey === 'USER ROLE') {
        const currentKeysData = (data && Array.isArray(data.listKeys)) ? data.listKeys : [];

        formHTML += `
        <div class="permission-wrapper" style="margin-top: 10px; border: 1px solid #ccc; border-radius: 4px;">
            <div id="btnToggleKeys" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; background: #eee; cursor: pointer; border-bottom: 3px solid #ccc;">
                <span style="font-weight: bold; font-size: 0.85rem;">
                    <i class="fas fa-key" style="margin-right: 8px; color: #555;"></i> LIST OF KEYS (PERMISSIONS)
                </span>
                <i class="fas fa-chevron-down" id="arrowIcon" style="transition: 0.3s;"></i>
            </div>

            <div id="keysDropdownContent" style="display: none; background: #fff;">
                <div style="padding: 10px; text-align: right; border-bottom: 1px solid #f0f0f0;">
                    <button type="button" id="selectAllKeys" style="background: none; border: 1px solid #ccc; padding: 3px 8px; border-radius: 3px; font-size: 0.7rem; cursor: pointer;">SELECT ALL</button>
                </div>
                
                <div style="max-height: 250px; overflow-y: auto; padding: 0 15px;">
                    ${AVAILABLE_KEYS.map(key => {
                        const keyId = key.toLowerCase().replace(/\s+/g, '_');
                        const matchingKey = currentKeysData.find(k => k.split(':')[0].toUpperCase() === key.toUpperCase());
                        const isChecked = !!matchingKey;
                        const existingValue = matchingKey && matchingKey.includes(':') ? matchingKey.split(':')[1] : '';

                        return `
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee;">
                            <div style="display: flex; align-items: center;">
                                <input type="checkbox" id="check_${keyId}" class="key-check" value="${key}" ${isChecked ? 'checked' : ''} style="width:16px; height:16px; margin-right: 10px; cursor:pointer;">
                                <label for="check_${keyId}" style="font-size: 0.85rem; cursor:pointer;">${key}</label>
                            </div>
                            <div id="box_val_${keyId}" style="opacity: ${isChecked ? '1' : '0.3'}; pointer-events: ${isChecked ? 'auto' : 'none'};">
                                <input type="text" id="input_val_${keyId}" placeholder="..." value="${existingValue}" 
                                    style="width: 100%; padding: 5px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 0.8rem;">
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        </div>`;
    }

    // 4. Action Buttons
    formHTML += `
        <div class="modal-actions" style="margin-top:20px; display:flex; gap:10px; justify-content:flex-end;">
            <button type="button" class="cancel-btn" onclick="closeMasterModal()" 
                style="padding:10px 20px; border:1px solid black; background:#6b7280; color:white; border-radius:4px; cursor:pointer; font-weight:bold;">
                BATAL
            </button>
            <button type="submit" class="save-btn" style="padding:10px 25px; background:#113F67; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">
                SIMPAN
            </button>
        </div>`;

    formMaster.innerHTML = formHTML;

    // Event Listeners for Permission UI
    if (activeMasterKey === 'USER ROLE') {
        const btnToggle = document.getElementById('btnToggleKeys');
        const content = document.getElementById('keysDropdownContent');
        const arrow = document.getElementById('arrowIcon');
        const allChecks = document.querySelectorAll('.key-check');

        btnToggle.onclick = () => {
            const isHidden = content.style.display === 'none';
            content.style.display = isHidden ? 'block' : 'none';
            arrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
        };

        allChecks.forEach(check => {
            check.onchange = function() {
                const keyId = this.id.replace('check_', '');
                const valBox = document.getElementById(`box_val_${keyId}`);
                if (this.checked) {
                    valBox.style.opacity = '1';
                    valBox.style.pointerEvents = 'auto';
                } else {
                    valBox.style.opacity = '0.3';
                    valBox.style.pointerEvents = 'none';
                    document.getElementById(`input_val_${keyId}`).value = '';
                }
            };
        });

        document.getElementById('selectAllKeys').onclick = function() {
            const firstState = !allChecks[0].checked;
            allChecks.forEach(c => {
                c.checked = firstState;
                c.dispatchEvent(new Event('change'));
            });
            this.textContent = firstState ? 'DESELECT ALL' : 'SELECT ALL';
        };
    }

    formMaster.onsubmit = (e) => {
        e.preventDefault();
        saveMasterData();
    };
}

/* --------------------------------------------------------------------------
   6. CRUD LOGIC
   -------------------------------------------------------------------------- */

   window.openMasterModal = function(id = null) {   
    if (!activeMasterKey) {
        showNotification('error', 'Pilih master yang akan diedit/ditambahkan.');
        return;
    }

    const masterConfig = masterDataMap[activeMasterKey];
    currentMasterEditId = id;

    let dataToEdit = null;
    if (id !== null && masterConfig.data && masterConfig.data[id]) {
        dataToEdit = masterConfig.data[id];
    }

    modalTitle.textContent = id ? `EDIT ${masterConfig.title}` : masterConfig.action;
    renderModalForm(dataToEdit);

    if (masterModal) masterModal.style.display = 'flex';
}


window.closeMasterModal = function() {
    if (masterModal) masterModal.style.display = 'none';
    currentMasterEditId = null;
    if (formMaster) formMaster.innerHTML = '';
}

window.saveMasterData = function() {
    const config = masterDataMap[activeMasterKey];
    if (!config) return;

    const today = new Date().toISOString().substring(0, 10);
    const newData = {};
    let formValid = true;

    config.modalFields.forEach(field => {
        const inputElement = document.getElementById(`modalInput-${field.key}`);
        if (inputElement) {
            const val = inputElement.value.trim();
            if (val === '') {
                showNotification('error', `Field "${field.label}" wajib diisi.`);
                formValid = false;
            }
            newData[field.key] = val;
        }
    });

    if (!formValid) return;

    if (activeMasterKey === 'USER ROLE') {
        const checkedCheckboxes = document.querySelectorAll('.key-check:checked');
        if (checkedCheckboxes.length === 0) {
            showNotification('error', 'Pilih minimal satu KEY!');
            return;
        }

        const selectedKeys = [];
        checkedCheckboxes.forEach(checkbox => {
            const key = checkbox.value;
            const keyId = key.toLowerCase().replace(/\s+/g, '_');
            const valueInput = document.getElementById(`input_val_${keyId}`);
            const value = valueInput ? valueInput.value.trim() : '';
            selectedKeys.push(value ? `${key}:${value}` : key);
        });
        newData.listKeys = selectedKeys;
    }

    if (currentMasterEditId) {
        config.data[currentMasterEditId] = { ...config.data[currentMasterEditId], ...newData };
        showNotification('success', `${config.title} berhasil diperbarui.`);
    }else {

        if (!config.data) {
            config.data = {};
        }
    
        if (typeof window[config.nextIdKey] !== 'number') {
            window[config.nextIdKey] = 1;
        }
    
        const id = window[config.nextIdKey]++;
    
        config.data[id] = { 
            id, 
            tglDibuat: today, 
            dibuatOleh: 'Admin', 
            ...newData 
        };

        saveUserRole();
    
        showNotification('success', `${config.title} berhasil ditambahkan.`);
    }

    closeMasterModal();
    renderMasterTable();
}

window.deleteMasterData = function(id) {
    if (!activeMasterKey) return;
    const config = masterDataMap[activeMasterKey];

    if (confirm(`Anda yakin ingin menghapus ${config.title} ini?`)) {
        if (config.data[id]) {
            delete config.data[id];
            showNotification('error', `${config.title} berhasil dihapus.`);
            renderMasterTable();
        }
    }
}

/* --------------------------------------------------------------------------
   7. TABLE RENDERING & FILTERING
   -------------------------------------------------------------------------- */

   function renderMasterTable() {
    if (!masterTableBody || !masterTableHeader || !activeMasterKey) return;

    const masterConfig = masterDataMap[activeMasterKey];
    
    // 1. Update Header Tabel (Selalu update agar kolomnya pas)
    masterTableHeader.innerHTML = masterConfig.fields.map(field => `<th>${field}</th>`).join('');

    // 2. CEK DATA DARI PHP (Baris yang sudah ada di HTML)
    const phpRows = document.querySelectorAll('.master-row');
    const targetType = activeMasterKey.toLowerCase();

    // Jika ada baris dari PHP, kita lakukan filtering (Show/Hide)
    if (phpRows.length > 0) {
        let hasDataVisible = false;

        phpRows.forEach(row => {
            if (row.getAttribute('data-type') === targetType) {
                row.style.display = 'table-row'; // Tampilkan jika tipe master cocok
                hasDataVisible = true;
            } else {
                row.style.display = 'none'; // Sembunyikan yang lain
            }
        });

        // Jika data PHP ditemukan untuk kategori ini, berhenti di sini (jangan render dummy)
        if (hasDataVisible) {
            filterMasterTable(); // Jalankan fungsi search/filter jika ada
            return; 
        }
    }

    // 3. LOGIKA RENDER DUMMY (Hanya jalan jika data PHP tidak ada)
    // Kosongkan body tabel hanya jika kita akan merender data dari variabel JS (Dummy)
    masterTableBody.innerHTML = '';
    
    const currentData = masterConfig.data;
    const masterIds = Object.keys(currentData).sort((a, b) => parseInt(a) - parseInt(b));
    let counter = 1;

    if (masterIds.length === 0) {
        masterTableBody.innerHTML = `<tr><td colspan="${masterConfig.fields.length}" style="text-align: center; color: var(--muted-text);">Data Master ${activeMasterKey} kosong.</td></tr>`;
        return;
    }

    masterIds.forEach(id => {
        const data = currentData[id];
        const row = document.createElement('tr');
        row.className = `master-row ${targetType}-row`; // Beri class agar konsisten
        row.setAttribute('data-type', targetType);
        
        let cellContent = `<td data-label="NO">${counter++}</td>`;

        // Switch case Anda tetap sama untuk menentukan isi kolom
        switch (activeMasterKey) {
            case 'TOKO':
                cellContent += `<td data-label="TGL DIBUAT">${data.tglDibuat}</td><td data-label="DIBUAT OLEH">${data.dibuatOleh}</td><td data-label="NAMA TOKO">${data.namaToko}</td><td data-label="KODE">${data.kode}</td>`;
                break;
            case 'USER ROLE':
                const keysDisplay = (data.listKeys || []).map(key => key.includes(':') ? key.split(':').join(' (') + ')' : key).join(', ');
                cellContent += `<td data-label="TGL DIBUAT">${data.tglDibuat}</td><td data-label="DIBUAT OLEH">${data.dibuatOleh}</td><td data-label="NAMA ROLE">${data.namaRole}</td><td data-label="LIST KEYS">${keysDisplay}</td>`;
                break;
            case 'DIVISI':
                cellContent += `<td data-label="TGL DIBUAT">${data.tglDibuat}</td><td data-label="DIBUAT OLEH">${data.dibuatOleh}</td><td data-label="NAMA DIVISI">${data.namaDivisi}</td><td data-label="DESKRIPSI">${data.deskripsi}</td><td data-label="TOKO">${data.namaToko || data.toko}</td>`;
                break;
            case 'TOPIK':
            case 'KARYAWAN':
                const nameKey = activeMasterKey === 'TOPIK' ? 'namaTopik' : 'namaKaryawan';
                cellContent += `<td data-label="TGL DIBUAT">${data.tglDibuat || 'N/A'}</td><td data-label="DIBUAT OLEH">${data.dibuatOleh || 'N/A'}</td><td data-label="${activeMasterKey}">${data[nameKey] || 'N/A'}</td><td data-label="TOKO">${data.namaToko || data.toko}</td><td data-label="DIVISI">${data.namaDivisi || data.divisi}</td>`;
                break;
        }

        cellContent += `
        <td data-label="ACTION" class="action-cell">
            <div class="action-buttons-container">
                <button class="action-btn edit-btn" onclick="event.stopPropagation(); openMasterModal(${data.id})" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" onclick="event.stopPropagation(); deleteMasterData(${data.id})" title="Hapus"><i class="fas fa-trash"></i></button>
            </div>
        </td>`;

        row.innerHTML = cellContent;
        masterTableBody.appendChild(row);
    });

    filterMasterTable();
}

function filterMasterTable() {
    if (!masterTableBody) return;
    const currentTableRows = masterTableBody.querySelectorAll('tr');
    if (currentTableRows.length === 0) return;

    const searchTerm = masterSearch ? masterSearch.value.toLowerCase().trim() : '';
    currentTableRows.forEach(row => {
        if (row.querySelector('td[colspan]')) return;
        const rowText = Array.from(row.querySelectorAll('td')).map(cell => cell.textContent.toLowerCase()).join(' ');
        row.style.display = (searchTerm && !rowText.includes(searchTerm)) ? 'none' : '';
    });
}

function checkMasterEmptyState() {
    const rows = document.querySelectorAll('#masterTableBody tr');
    const emptyState = document.getElementById('masterEmptyState');

    let visible = 0;
    rows.forEach(row => {
        if (row.style.display !== 'none') visible++;
    });

    if (emptyState) {
        emptyState.style.display = visible === 0 ? 'block' : 'none';
    }
}

/* --------------------------------------------------------------------------
   8. TAB NAVIGATION LOGIC
   -------------------------------------------------------------------------- */

   function switchMasterTab(key) {
    activeMasterKey = key.toUpperCase();
    const targetType = key.toLowerCase().replace(' ', '-');

    // 1. Update UI Tab
    masterTabs.forEach(t => {
        t.classList.toggle('active', t.getAttribute('data-type') === targetType);
    });

    // 2. Update Header Tabel & Tombol Add secara Dinamis
    const config = masterDataMap[activeMasterKey];
    if (config) {
        masterHeaderTitle.textContent = config.title;
        masterHeaderButtonText.innerHTML = `<i class="fas fa-plus"></i> ${config.action}`;
        
        // Render Header
        const headerRow = document.getElementById('masterTableHead');
        headerRow.innerHTML = `<tr>${config.fields.map(f => `<th>${f}</th>`).join('')}</tr>`;
    }

    // 3. Filter Baris PHP & Reset Nomor Urut
    const allRows = document.querySelectorAll('.master-row');
    let visibleCount = 0;

    allRows.forEach(row => {
        if (row.getAttribute('data-type') === targetType) {
            row.style.display = 'table-row';
            visibleCount++;
            // Update kolom nomor (selalu kolom pertama)
            row.querySelector('td:first-child').textContent = visibleCount;
        } else {
            row.style.display = 'none';
        }
    });

    toggleMasterContent(true);
}

// 3. Inisialisasi saat halaman siap
document.addEventListener('DOMContentLoaded', () => {
    // Jalankan Tab Toko secara default
    switchMasterTab('TOKO');

    // Pasang event listener pada tab
    document.querySelectorAll('.master-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchMasterTab(tab.textContent.trim());
        });
    });
});


/* --------------------------------------------------------------------------
   9. PAGINATION FUNCTIONS
   -------------------------------------------------------------------------- */

    let currentPage = 1;
    let rowsPerPage = 10;
    let totalPages = 1;

    function updateTableFooter() {
        if (!activeMasterKey) return;

        const config = masterDataMap[activeMasterKey];
        const dataCount = Object.keys(config.data).length;

        totalPages = Math.ceil(dataCount / rowsPerPage);
        const startRow = ((currentPage - 1) * rowsPerPage) + 1;
        let endRow = Math.min(currentPage * rowsPerPage, dataCount);

        const elements = {
            start: document.getElementById('startRow'),
            end: document.getElementById('endRow'),
            total: document.getElementById('totalRows'),
            info: document.getElementById('pageInfo'),
            prev: document.getElementById('prevPage'),  
            next: document.getElementById('nextPage')
        };

        if (elements.start) elements.start.textContent = startRow;
        if (elements.end) elements.end.textContent = endRow;
        if (elements.total) elements.total.textContent = dataCount;
        if (elements.info) elements.info.textContent = `Page ${currentPage} of ${totalPages}`;
        if (elements.prev) elements.prev.disabled = currentPage === 1;
        if (elements.next) elements.next.disabled = currentPage === totalPages;

        const tableFooter = document.getElementById('masterTableFoot');
        if (tableFooter) tableFooter.style.display = dataCount > 0 ? 'table-footer-group' : 'none';
    }

    function goToPage(page) {
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        renderMasterTable();
        updateTableFooter();
    }

    function changeRowsPerPage(value) {
        rowsPerPage = parseInt(value);
        currentPage = 1;
        renderMasterTable();
        updateTableFooter();
    }

/* --------------------------------------------------------------------------
   10. INITIALIZATION & GLOBAL EVENTS
   -------------------------------------------------------------------------- */
   const allRows = document.querySelectorAll(".master-row");

   // sembunyikan semua data dulu
   allRows.forEach(row => row.style.display = "none");
   
   // set default ke TOKO
   switchMasterTab("TOKO");

   document.addEventListener('DOMContentLoaded', () => {
    // 1. Pastikan konten tersembunyi saat awal load
    toggleMasterContent(false);

    // 2. Event Listeners untuk Tab
    masterTabs.forEach(tab => {
        tab.classList.remove('active');

        tab.addEventListener('click', () => {
            // Hapus class active dari semua tab sebelum pindah
            masterTabs.forEach(t => t.classList.remove('active'));
            switchMasterTab(tab.textContent);
        });
    });

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

    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sidebar.classList.toggle('hide');
            adjustMainContentMargin();
        });
    }

    window.addEventListener('resize', adjustMainContentMargin);

    const addButton = document.getElementById('btnAddMaster');
    if (addButton) {
        addButton.addEventListener('click', () => {
            activeMasterKey ? openMasterModal(null) : showNotification('info', 'Silakan pilih Master dahulu.');
        });
    }

    if (masterSearch) masterSearch.addEventListener('input', filterMasterTable);

    // Pagination Listeners
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const showRowsSelect = document.getElementById('showRows');

    if (prevPageBtn) prevPageBtn.addEventListener('click', () => goToPage(currentPage - 1));
    if (nextPageBtn) nextPageBtn.addEventListener('click', () => goToPage(currentPage + 1));
    if (showRowsSelect) showRowsSelect.addEventListener('change', (e) => changeRowsPerPage(e.target.value));

    // Responsive Setup
    window.addEventListener('resize', () => {
        if (activeMasterKey) renderMasterTable();
    });

    // 3. BAGIAN PENTING: Jangan panggil switchMasterTab di sini
    // Cukup biarkan kosong agar user harus memilih tab dulu
    console.log("System Ready: Silakan pilih kategori master.");

    document.addEventListener("DOMContentLoaded", async () => {
        await loadMasterOptions();   // 🔥 INI PENTING
    });
    
      
});

// LOAD API //
window.masterAPI = {
    toko: [],
    divisi: [],
};

async function loadMasterAPI() {
    try {
        const [tokoRes, divisiRes] = await Promise.all([
            fetch("https://toyomatsu.ddns.net/master/api/?toko=true"),
            fetch("https://toyomatsu.ddns.net/master/api/?divisi=true"),
        ]);

        const tokoJson = await tokoRes.json();
        const divisiJson = await divisiRes.json();

        masterAPI.toko   = tokoJson.data || tokoJson || [];
        masterAPI.divisi = divisiJson.data || divisiJson || [];

        console.log("MASTER API:", masterAPI);
    } catch (e) {
        console.error("Gagal load master API", e);
    }
}


/*-------------------
    GET MASTER TOKO
-------------------*/
async function loadMasterToko() {
    try {
        const res = await fetch("api/get_master_toko.php?action=get");
        const json = await res.json();

        if (!json.status) {
            showNotification(json.message || "Gagal load data", "error");
            return;
        }

        const tbody = document.getElementById("masterTableBody");
        tbody.innerHTML = "";

        json.data.forEach((row, i) => {
            tbody.innerHTML += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${row.created_at ? row.created_at.split(' ')[0] : '-'}</td>
                    <td>${row.nama_toko}</td>
                    <td>${row.kode}</td>
                    <td class="action-cell">
                        <button class="action-btn edit-btn" onclick="editToko(${row.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteToko(${row.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error(err);
        showNotification("Gagal konek ke server", "error");
    }
}

async function deleteToko(id) {
    if (!confirm("Yakin mau hapus toko ini?")) return;

    try {
        const fd = new FormData();
        fd.append("id", id);

        const res = await fetch("api/get_master_toko.php?action=delete", {
            method: "POST",
            body: fd
        });

        const json = await res.json();
        showNotification(json.message, json.status ? "success" : "error");

        if(json.status) loadMasterToko();

    } catch (err) {
        console.error(err);
        showNotification("Server error", "error");
    }
}


async function editToko(id) {
    try {
        const res = await fetch("api/get_master_toko.php?action=detail&id=" + id);
        const json = await res.json();

        if(!json.status){
            showNotification("Data tidak ditemukan", "error");
            return;
        }

        const data = json.data;

        activeMasterKey = "TOKO";
        currentMasterEditId = id;

        openMasterModal(id);

        setTimeout(() => {
            document.getElementById("modalInput-namaToko").value = data.nama_toko;
            document.getElementById("modalInput-kode").value = data.kode;

            document.querySelector("#masterForm").onsubmit = (e) => {
                e.preventDefault();
                saveToko(id);
            };
        }, 100);

    } catch(err){
        console.error(err);
        showNotification("Gagal load detail toko", "error");
    }
}

async function saveToko(id = null) {
    const nama = document.getElementById("modalInput-namaToko").value.trim();
    const kode = document.getElementById("modalInput-kode").value.trim();

    if(!nama || !kode){
        showNotification("Nama & kode wajib diisi", "error");
        return;
    }

    const fd = new FormData();
    fd.append("nama_toko", nama);
    fd.append("kode", kode);

    let url = "api/get_master_toko.php?action=add";
    if (id) {
        url = "api/get_master_toko.php?action=edit";
        fd.append("id", id);
    }

    try {
        const res = await fetch(url, { method: "POST", body: fd });
        const json = await res.json();

        showNotification(json.message, json.status ? "success" : "error");

        if(json.status){
            closeMasterModal();
            loadMasterToko();
        }

    } catch(err){
        console.error(err);
        showNotification("Server error", "error");
    }
}

/*---------------------
    GET MASTER DIVISI
-----------------------*/

async function loadMasterDivisi() {
    const res = await fetch("api/get_master_divisi.php?action=get");
    const json = await res.json();
    const data = json.data;


    const tbody = document.getElementById("masterTableBody");
    tbody.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Data divisi kosong.</td></tr>`;
        return;
    }

    data.forEach((row, i) => {
        tbody.innerHTML += `
            <tr class="master-row" data-type="divisi">
                <td>${i + 1}</td>
                <td>${row.created_at ? row.created_at.split(' ')[0] : '-'}</td>
                <td>${row.username ?? '-'}</td>
                <td>${row.nama_divisi}</td>
                <td>${row.deskripsi ?? '-'}</td>
                <td>${row.nama_toko ?? '-'}</td>
                <td class="action-cell">
                    <div class="action-buttons-container">
                        <button class="action-btn edit-btn" onclick="editDivisi(${row.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteDivisi(${row.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
}

async function deleteDivisi(id) {
    if (!confirm("Yakin mau hapus divisi ini?")) return;

    const fd = new FormData();
    fd.append("id", id);

    const res = await fetch("api/get_master_divisi.php?action=delete", {
        method: "POST",
        body: fd
    });

    const json = await res.json();
    showNotification(json.status ? "success" : "error", "Divisi berhasil dihapus");
    loadMasterDivisi();
}

async function editDivisi(id) {
    const res = await fetch("api/get_master_divisi.php?action=detail&id=" + id);
    const json = await res.json();
    const data = json.data; // WAJIB

    activeMasterKey = "DIVISI";
    currentMasterEditId = id;

    openMasterModal(id);

    setTimeout(() => {
        document.getElementById("modalInput-namaDivisi").value = data.nama_divisi;
        document.getElementById("modalInput-deskripsi").value  = data.deskripsi;
        document.getElementById("modalInput-toko_id").value = data.toko_id;

        document.getElementById("masterForm").onsubmit = (e) => {
            e.preventDefault();
            saveDivisi(id);
        };
    }, 200);
}


async function saveDivisi(id = null) {
    const fd = new FormData();
    fd.append("nama_divisi", document.getElementById("modalInput-namaDivisi").value);
    fd.append("deskripsi", document.getElementById("modalInput-deskripsi").value);
    fd.append("toko_id", document.getElementById("modalInput-namaToko").value);
    fd.append("user_id", 1); // nanti ganti dari session

    let url = "api/get_master_divisi.php?action=add";

    if (id) {
        url = "api/get_master_divisi.php?action=edit";
        fd.append("id", id);
    }

    const res = await fetch(url, { method: "POST", body: fd });
    const json = await res.json();

    showNotification(json.status ? "success" : "error", "Divisi berhasil disimpan");
    closeMasterModal();
    switchMasterTab("DIVISI");
    loadMasterDivisi();
}

/*---------------------
    GET MASTER TOPIK
-----------------------*/
async function loadMasterTopik() {
    const res = await fetch("api/get_master_topik.php?action=get");
    const data = await res.json();

    const tbody = document.getElementById("masterTableBody");
    tbody.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Data topik kosong.</td></tr>`;
        return;
    }

    data.forEach((row, i) => {
        tbody.innerHTML += `
            <tr class="master-row" data-type="topik">
                <td>${i + 1}</td>
                <td>${row.created_at ? row.created_at.split(' ')[0] : '-'}</td>
                <td>${row.username ?? '-'}</td>
                <td>${row.nama_topik}</td>
                <td>${row.nama_toko ?? '-'}</td>
                <td>${row.nama_divisi ?? '-'}</td>
                <td class="action-cell">
                    <div class="action-buttons-container">
                        <button class="action-btn edit-btn" onclick="editTopik(${row.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteTopik(${row.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
}

async function deleteTopik(id) {
    if (!confirm("Yakin mau hapus topik ini?")) return;

    const fd = new FormData();
    fd.append("id", id);

    const res = await fetch("api/get_master_topik.php?action=delete", {
        method: "POST",
        body: fd
    });

    const json = await res.json();
    showNotification(json.status ? "success" : "error", "Topik berhasil dihapus");
    loadMasterTopik();
}

async function editTopik(id) {
    const res = await fetch("api/get_master_topik.php?action=detail&id=" + id);
    const json = await res.json();
    const data = json.data;

    activeMasterKey = "TOPIK";
    currentMasterEditId = id;

    openMasterModal(id);

    setTimeout(() => {
        document.getElementById("modalInput-namaTopik").value  = data.nama_topik;
        document.getElementById("modalInput-toko_id").value = data.toko_id;
        document.getElementById("modalInput-divisi_id").value = data.divisi_id;

        document.getElementById("masterForm").onsubmit = (e) => {
            e.preventDefault();
            saveTopik(id);
        };
    }, 200);
}


async function saveTopik(id = null) {
    const fd = new FormData();
    fd.append("nama_topik", document.getElementById("modalInput-namaTopik").value);
    fd.append("toko_id", document.getElementById("modalInput-namaToko").value);
    fd.append("divisi_id", document.getElementById("modalInput-namaDivisi").value);
    fd.append("user_id", 1); // nanti ganti session

    let url = "api/get_master_topik.php?action=add";

    if (id) {
        url = "api/get_master_topik.php?action=edit";
        fd.append("id", id);
    }

    const res = await fetch(url, { method: "POST", body: fd });
    const json = await res.json();

    showNotification(json.status ? "success" : "error", "Topik berhasil disimpan");
    closeMasterModal();
    switchMasterTab("TOPIK");
    loadMasterTopik();
}

/*----------------------
    GET MASTER KARYAWAN
------------------------*/
async function loadMasterKaryawan() {
    const res = await fetch("api/get_master_karyawan.php?action=get");
    const data = await res.json();

    const tbody = document.getElementById("masterTableBody");
    tbody.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Data karyawan kosong.</td></tr>`;
        return;
    }

    data.forEach((row, i) => {
        tbody.innerHTML += `
            <tr class="master-row" data-type="karyawan">
                <td>${i + 1}</td>
                <td>${row.created_at ? row.created_at.split(' ')[0] : '-'}</td>
                <td>${row.username ?? '-'}</td>
                <td>${row.nama_karyawan}</td>
                <td>${row.nama_toko ?? '-'}</td>
                <td>${row.nama_divisi ?? '-'}</td>
                <td class="action-cell">
                    <div class="action-buttons-container">
                        <button class="action-btn edit-btn" onclick="editKaryawan(${row.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteKaryawan(${row.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
}

async function deleteKaryawan(id) {
    if (!confirm("Yakin mau hapus karyawan ini?")) return;

    const fd = new FormData();
    fd.append("id", id);

    const res = await fetch("api/get_master_karyawan.php?action=delete", {
        method: "POST",
        body: fd
    });

    const json = await res.json();
    showNotification(json.status ? "success" : "error", "Karyawan berhasil dihapus");
    loadMasterKaryawan();
}

async function editKaryawan(id) {
    const res = await fetch("api/get_master_karyawan.php?action=detail&id=" + id);
    const json = await res.json();
    const data = json.data;

    activeMasterKey = "KARYAWAN";
    currentMasterEditId = id;

    openMasterModal(id);

    setTimeout(() => {
        document.getElementById("modalInput-namaKaryawan").value = data.nama_karyawan;
        document.getElementById("modalInput-toko_id").value = data.toko_id;
        document.getElementById("modalInput-divisi_id").value = data.divisi_id;

        document.getElementById("masterForm").onsubmit = (e) => {
            e.preventDefault();
            saveKaryawan(id);
        };
    }, 200);
}


async function saveKaryawan(id = null) {
    const fd = new FormData();
    fd.append("nama_karyawan", document.getElementById("modalInput-namaKaryawan").value);
    fd.append("toko_id", document.getElementById("modalInput-namaToko").value);
    fd.append("divisi_id", document.getElementById("modalInput-namaDivisi").value);
    fd.append("user_id", 1);

    let url = "api/get_master_karyawan.php?action=add";

    if (id) {
        url = "api/get_master_karyawan.php?action=edit";
        fd.append("id", id);
    }

    const res = await fetch(url, { method: "POST", body: fd });
    const json = await res.json();

    showNotification(json.status ? "success" : "error", "Karyawan berhasil disimpan");
    closeMasterModal();
    switchMasterTab("KARYAWAN");
    loadMasterKaryawan();
}

/*----------------------
    GET USER ROLE 
------------------------*/
/**
 * Memuat data Role ke dalam tabel Master
 */
async function loadRoleTable() {
    try {
        const response = await fetch('api/get_user_role.php?action=get');
        const result = await response.json();

        if (result.status) {
            const tableBody = document.querySelector('#masterTable tbody');
            tableBody.innerHTML = '';

            result.data.forEach((row, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${created_at}</td>
                    <td>${username}</td>
                    <td>${row.nama_role}</td>
                    <td><small>${row.permissions || '-'}</small></td>
                    <td>
                        <button class="edit-btn" onclick="editRole(${row.id})"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" onclick="deleteRole(${row.id})"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error("Gagal memuat data role:", error);
    }
}

/**
 * Fungsi untuk menyimpan (Add/Edit) Role
 */
async function saveUserRole() {
    // const roleId = document.getElementById('role_id_input').value; // Hidden input untuk ID
    var namaRole = document.getElementById('modalInput-namaRole').value;
    var roleId = 1;
    console.log(namaRole)
    
    // Ambil semua ID dari checkbox permission yang dicentang
    const selectedKeys = [];
    document.querySelectorAll('.key-check:checked').forEach(cb => {
        selectedKeys.push(cb.value);
        console.log(cb.value);
    });

    if (!namaRole) {
        showNotification('error', 'Nama Role tidak boleh kosong');
        return;
    }

    try {
        const ress = await fetch(`api/getCountRole.php`);
        const datas = await ress.json();
        // console.log(datas);
        roleId += datas.data.id_last
    } catch (error) {
        showNotification('error', 'Terjadi kesalahan sistem');
    }

    console.log(roleId);

    const formData = new FormData();
    formData.append('role_id', roleId);
    formData.append('role_name', namaRole);
    // Append keys satu per satu agar PHP membacanya sebagai array
    selectedKeys.forEach(key => formData.append('keys[]', key));
    console.log(selectedKeys);

    try {
        const res = await fetch(`api/get_user_role.php?action=add`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (data.status) {
            showNotification('success', data.message);
            closeMasterModal(); // Tutup modal
            loadRoleTable();    // Refresh tabel
        } else {
            showNotification('error', data.message);
        }
    } catch (error) {
        showNotification('error', 'Terjadi kesalahan sistem');
    }
}

/**
 * Menghapus Role
 */
async function deleteRole(id) {
    if (!confirm('Yakin ingin menghapus role ini?')) return;

    const formData = new FormData();
    formData.append('id', id);

    try {
        const res = await fetch('api/get_user_role.php?action=delete', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.status) {
            showNotification('success', 'Role dihapus');
            loadRoleTable();
        }
    } catch (error) {
        showNotification('error', 'Gagal menghapus data');
    }
}

/**
 * Fungsi yang dipanggil saat tombol Edit di tabel diklik
 */
async function editRole(id) {
    try {
        // 1. Ambil detail data dari server
        const res = await fetch(`api/get_user_role.php?action=detail&id=${id}`);
        const result = await res.json();

        if (result.status) {
            const role = result.data;

            // 2. Buka modal Master (pastikan activeMasterKey adalah 'USER ROLE')
            openMasterModal(null); 
            
            // Ubah judul modal dan teks tombol
            document.querySelector('.modal-title').innerText = "EDIT USER ROLE";
            document.querySelector('.save-btn').innerText = "UPDATE";

            // 3. Isi input Nama Role dan ID Role (Hidden)
            // Di master.php pastikan ada input: <input type="hidden" id="role_id_input">
            const idInput = document.getElementById('role_id_input');
            if(idInput) idInput.value = role.id;
            
            document.getElementById('nama_role_input').value = role.nama_role;

            // 4. Centang Checkbox sesuai permission yang dimiliki (keys)
            // Reset semua checkbox dulu
            document.querySelectorAll('.permission-checkbox').forEach(cb => cb.checked = false);
            
            // Centang yang sesuai
            role.keys.forEach(keyId => {
                const checkbox = document.querySelector(`.permission-checkbox[value="${keyId}"]`);
                if (checkbox) checkbox.checked = true;
            });

        } else {
            showNotification('error', result.message);
        }
    } catch (error) {
        console.error("Error editRole:", error);
        showNotification('error', "Gagal mengambil data detail");
    }
}