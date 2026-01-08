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

// Data Master Dummy
const dummyMasterToko = {
    1: { id: 1, tglDibuat: '2025-01-10', dibuatOleh: 'Admin', namaToko: 'Toyomatsu', kode: 'TM' },
    2: { id: 2, tglDibuat: '2025-01-12', dibuatOleh: 'Admin', namaToko: 'Robin Jaya', kode: 'RJ' },
    3: { id: 3, tglDibuat: '2025-01-15', dibuatOleh: 'Manager', namaToko: 'Ikkou', kode: 'IK' },
};

const dummyMasterUserRole = {
    1: { id: 1, tglDibuat: '2025-01-01', dibuatOleh: 'SysAdmin', namaRole: 'Administrator', listKeys: ['UPDATE TOKO', 'MANAGE USER', 'UPDATE ROLE'] },
    2: { id: 2, tglDibuat: '2025-01-01', dibuatOleh: 'SysAdmin', namaRole: 'Manager', listKeys: ['UPDATE TOKO', 'MANAGE USER'] },
    3: { id: 3, tglDibuat: '2025-01-05', dibuatOleh: 'SysAdmin', namaRole: 'Staff', listKeys: ['UPDATE TOKO'] },
};

const dummyMasterDivisi = {
    1: { id: 1, tglDibuat: '2025-01-20', dibuatOleh: 'Admin', namaDivisi: 'Regular Staff', deskripsi: 'Staff reguler toko', namaToko: 'Toyomatsu' },
    2: { id: 2, tglDibuat: '2025-01-22', dibuatOleh: 'Manager', namaDivisi: 'Supervisor', deskripsi: 'Pengawas harian', namaToko: 'Robin Jaya' },
};

const dummyMasterTopik = {
    1: { id: 1, tglDibuat: '2025-02-01', dibuatOleh: 'Admin', namaTopik: 'Disiplin Waktu', namaToko: 'Toyomatsu', namaDivisi: 'Regular Staff' },
    2: { id: 2, tglDibuat: '2025-02-05', dibuatOleh: 'Manager', namaTopik: 'Kualitas Display', namaToko: 'Robin Jaya', namaDivisi: 'Supervisor' },
};

const dummyMasterKaryawan = {
    1: { id: 1, tglDibuat: '2024-12-01', dibuatOleh: 'Manager', namaKaryawan: 'Budi Santoso', namaToko: 'Toyomatsu', namaDivisi: 'Regular Staff' },
    2: { id: 2, tglDibuat: '2024-12-05', dibuatOleh: 'HRD', namaKaryawan: 'Citra Dewi', namaToko: 'Robin Jaya', namaDivisi: 'Supervisor' },
    3: { id: 3, tglDibuat: '2024-12-10', dibuatOleh: 'Kepala Toko', namaKaryawan: 'Fahri Ahmad', namaToko: 'Toyomatsu', namaDivisi: 'Regular Staff' },
};

/* --------------------------------------------------------------------------
   2. KONFIGURASI MASTER DATA MAP
   -------------------------------------------------------------------------- */

const masterDataMap = {
    'TOKO': {
        data: dummyMasterToko,
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
        data: dummyMasterDivisi,
        fields: ['NO', 'TGL DIBUAT', 'DIBUAT OLEH', 'NAMA DIVISI', 'DESKRIPSI', 'TOKO', 'ACTION'],
        action: 'ADD DIVISI',
        title: 'GROUP',
        modalFields: [
            { label: 'NAMA DIVISI', key: 'namaDivisi', type: 'text' },
            { label: 'DESKRIPSI', key: 'deskripsi', type: 'text' },
            { label: 'NAMA TOKO', key: 'namaToko', type: 'select', options: ['TOYOMATSU', 'ROBIN JAYA', 'ONLINE', 'HIKOMI', 'IKKOU'] },
        ],
        nextIdKey: 'nextMasterDivisiId'
    },
    'TOPIK': {
        data: dummyMasterTopik,
        fields: ['NO', 'TGL DIBUAT', 'DIBUAT OLEH', 'NAMA TOPIK', 'TOKO', 'DIVISI', 'ACTION'],
        action: 'ADD TOPIK',
        title: 'TOPIK',
        modalFields: [
            { label: 'NAMA TOPIK', key: 'namaTopik', type: 'text' },
            { label: 'NAMA TOKO', key: 'namaToko', type: 'select', options: ['TOYOMATSU', 'ROBIN JAYA', 'ONLINE', 'HIKOMI', 'IKKOU'] },
            { label: 'NAMA DIVISI', key: 'namaDivisi', type: 'select', options: ['IT', 'ACCOUNTING', 'SALES', 'ADMIN COUNTER', 'KASIR'] },
        ],
        nextIdKey: 'nextMasterTopikId'
    },
    'KARYAWAN': {
        data: dummyMasterKaryawan,
        fields: ['NO', 'TGL DIBUAT', 'DIBUAT OLEH', 'NAMA KARYAWAN', 'TOKO', 'DIVISI', 'ACTION'],
        action: 'ADD KARYAWAN',
        title: 'KARYAWAN',
        modalFields: [
            { label: 'NAMA KARYAWAN', key: 'namaKaryawan', type: 'text' },
            { label: 'NAMA TOKO', key: 'namaToko', type: 'select', options: ['TOYOMATSU', 'ROBIN JAYA', 'ONLINE', 'HIKOMI', 'IKKOU'] },
            { label: 'NAMA DIVISI', key: 'namaDivisi', type: 'select', options: ['IT', 'ACCOUNTING', 'SALES', 'ADMIN COUNTER', 'KASIR'] },
        ],
        nextIdKey: 'nextMasterKaryawanId'
    },
    'USER ROLE': {
        data: dummyMasterUserRole,
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
    'UPDATE TOKO', 'MANAGE USER', 'UPDATE ROLE', 'MANAGE DIVISI',
    'MANAGE KARYAWAN', 'MANAGE TOPIK', 'CREATE CATATAN',
    'EDIT CATATAN', 'DELETE CATATAN', 'VIEW CATATAN'
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
const modalTitle = document.getElementById('modal-master-title');
const masterHeader = document.querySelector('.master-header');
const masterCard = document.querySelector('.table-card');
const tableDivider = document.querySelector('.table-divider');

// Global Status Variable
let currentMasterEditId = null;
let activeMasterKey = null;



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

        if (field.type === 'select') {
            formHTML += `
            <select id="modalInput-${field.key}" name="${field.key}" class="modal-select" required style="width:100%; height:40px; margin-bottom:15px; border-radius:4px; border:1px solid #ccc; padding: 0 10px;">
                <option value="">-- Pilih ${field.label} --</option>
                ${field.options.map(opt => `<option value="${opt}" ${value.toString().toUpperCase() === opt.toString().toUpperCase() ? 'selected' : ''}>${opt}</option>`).join('')}
            </select>`;
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
    let dataToEdit = id !== null && masterConfig.data[id] ? masterConfig.data[id] : null;

    modalTitle.textContent = dataToEdit ? `EDIT ${masterConfig.title}` : masterConfig.action;
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
    } else {
        const id = window[config.nextIdKey]++;
        config.data[id] = { id, tglDibuat: today, dibuatOleh: 'Admin', ...newData };
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
    const currentData = masterConfig.data;

    masterTableHeader.innerHTML = masterConfig.fields.map(field => `<th>${field}</th>`).join('');
    masterTableBody.innerHTML = '';

    const masterIds = Object.keys(currentData).sort((a, b) => parseInt(a) - parseInt(b));
    let counter = 1;

    if (masterIds.length === 0) {
        masterTableBody.innerHTML = `<tr><td colspan="${masterConfig.fields.length}" style="text-align: center; color: var(--muted-text);">Data Master ${activeMasterKey} kosong.</td></tr>`;
        return;
    }

    masterIds.forEach(id => {
        const data = currentData[id];
        const row = document.createElement('tr');
        let cellContent = `<td data-label="NO">${counter++}</td>`;

        switch (activeMasterKey) {
            case 'TOKO':
                cellContent += `<td data-label="TGL DIBUAT">${data.tglDibuat}</td><td data-label="DIBUAT OLEH">${data.dibuatOleh}</td><td data-label="NAMA TOKO">${data.namaToko}</td><td data-label="KODE">${data.kode}</td>`;
                break;
            case 'USER ROLE':
                const keysDisplay = (data.listKeys || []).map(key => {
                    if (key.includes(':')) {
                        const parts = key.split(':');
                        return `${parts[0]}${parts[1] ? ` (${parts[1]})` : ''}`;
                    }
                    return key;
                }).join(', ');
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
                <button class="action-btn edit-btn" onclick="event.stopPropagation(); openMasterModal(${data.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="event.stopPropagation(); deleteMasterData(${data.id})" title="Hapus">
                    <i class="fas fa-trash"></i>
                </button>
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

/* --------------------------------------------------------------------------
   8. TAB NAVIGATION LOGIC
   -------------------------------------------------------------------------- */

   function switchMasterTab(key) {
    const cleanKey = key.trim(); // Menghapus spasi yang tidak terlihat
    
    toggleMasterContent(true);
    
    // Sesuaikan active class dengan trim juga
    masterTabs.forEach(tab => {
        const tabText = tab.innerText || tab.textContent;
        tab.classList.toggle('active', tab.textContent.trim() === cleanKey);
    });
    
    activeMasterKey = cleanKey;
    const config = masterDataMap[cleanKey];
    
    if (config) {
        masterHeaderTitle.textContent = config.title;
        const addButton = document.getElementById('btnAddMaster');
        if (addButton) {
            addButton.innerHTML = `<i class="fas fa-plus"></i> ${config.action}`;
        }
        if (masterSearch) masterSearch.value = '';
        renderMasterTable();
    }
}

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
});

