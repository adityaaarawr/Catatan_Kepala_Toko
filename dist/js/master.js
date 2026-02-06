/* ==========================================================================
   MASTER MANAGEMENT SYSTEM - master.js
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. STATE & DATABASE (SIMULASI)
   -------------------------------------------------------------------------- */

   console.log("MASTER JS LOADED");

   let masterTokoOptions = [];
   let masterDivisiOptions = [];
   let currentMasterEditId = null;
   let activeMasterKey = null;
   let isTokoMode = false;
   
   // Pagination variables
   let currentPage = 1;
   let rowsPerPage = 10;
   let totalPages = 1;
   
   /* --------------------------------------------------------------------------
      2. DATA LOADING FUNCTIONS
      -------------------------------------------------------------------------- */
   
   async function loadMasterTokoOptions() {
       try {
           const res = await fetch("api/get_master_toko.php?action=get");
           const json = await res.json();
   
           if (json.status) {
               masterTokoOptions = json.data;
           } else {
               masterTokoOptions = [];
           }
       } catch (e) {
           console.error("Gagal load toko:", e);
           masterTokoOptions = [];
       }
   }
   
   async function loadMasterDivisiOptions() {
       try {
           const res = await fetch("api/api_divisi.php");
           const json = await res.json();
           console.log("DIVISI API RESPONSE:", json);
   
           if (Array.isArray(json)) {
               masterDivisiOptions = json;
           } else if (json.data && Array.isArray(json.data)) {
               masterDivisiOptions = json.data;
           } else {
               masterDivisiOptions = [];
           }
       } catch (e) {
           console.error("Gagal load divisi:", e);
           masterDivisiOptions = [];
       }
   }
   
   /* --------------------------------------------------------------------------
      3. KONFIGURASI MASTER DATA MAP
      -------------------------------------------------------------------------- */
   
   const AVAILABLE_KEYS = [
       'UPDATE TOKO', 'MANAGE USER', 'UPDATE ROLE', 'UPDATE DIVISI', 'UPDATE TOPIK', 
       'UPDATE KARYAWAN', 'VIEW NOTE', 'INPUT NOTE', 'UPDATE NOTE', 'DELETE NOTE'
   ];
   
   const masterDataMap = {
       'TOKO': {
           fields: ['NO', 'TGL DIBUAT', 'DIBUAT OLEH', 'NAMA TOKO', 'LOKASI', 'KODE', 'ACTION'],
           action: 'ADD TOKO',
           title: 'TOKO',
           modalFields: [
               { label: 'NAMA TOKO', key: 'nama_toko', type: 'text' },
               { label: 'LOKASI', key: 'lokasi', type: 'text' },
               { label: 'KODE', key: 'kode', type: 'text' },
           ],
           nextIdKey: 'nextMasterId'
       },
       'DIVISI': {
           isApi: true,
           fields: ['NO', 'TGL DIBUAT', 'DIBUAT OLEH', 'NAMA DIVISI', 'POSISI', 'TOKO', 'ACTION'],
           action: 'ADD DIVISI',
           title: 'DIVISI',
           modalFields: [
               { label: 'NAMA DIVISI', key: 'nama_divisi', type: 'text' },
               { label: 'POSISI', key: 'posisi', type: 'text' },
               { label: 'NAMA TOKO', key: 'toko_id', type: 'select-db', source: 'toko' },
           ],
           nextIdKey: 'nextMasterDivisiId'
       },
       'TOPIK': {
           isApi: true,
           fields: ['NO', 'TGL DIBUAT', 'DIBUAT OLEH', 'NAMA TOPIK', 'TOKO', 'DIVISI', 'ACTION'],
           action: 'ADD TOPIK',
           title: 'TOPIK',
           modalFields: [
               { label: 'NAMA TOPIK', key: 'nama_topik', type: 'text' },
               { label: 'NAMA TOKO', key: 'toko_id', type: 'select-db', source: 'toko' },
               { label: 'NAMA DIVISI', key: 'divisi_id', type: 'select-db', source: 'divisi' },
           ],
           nextIdKey: 'nextMasterTopikId'
       },
       'KARYAWAN': {
           isApi: true,
           fields: ['NO', 'TGL DIBUAT', 'DIBUAT OLEH', 'NAMA KARYAWAN', 'TOKO', 'DIVISI', 'ACTION'],
           action: 'ADD KARYAWAN',
           title: 'KARYAWAN',
           modalFields: [
               { label: 'NAMA KARYAWAN', key: 'nama_karyawan', type: 'text' },
               { label: 'NAMA TOKO', key: 'toko_id', type: 'select-db', source: 'toko' },
               { label: 'NAMA DIVISI', key: 'divisi_id', type: 'select-db', source: 'divisi' },
           ],        
           nextIdKey: 'nextMasterKaryawanId'
       },
       'USER ROLE': {
           isApi: true,
           fields: ['NO', 'TGL DIBUAT', 'DIBUAT OLEH', 'NAMA ROLE', 'LIST KEYS', 'ACTION'],
           action: 'ADD USER ROLE',
           title: 'USER ROLE',
           modalFields: [
               { label: 'NAMA ROLE', key: 'namaRole', type: 'text' },
           ],
           nextIdKey: 'nextMasterUserRoleId'
       }
   };
   
   /* --------------------------------------------------------------------------
      4. DOM ELEMENTS INITIALIZATION
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
   const masterHeader = document.querySelector('.master-header');
   const masterCard = document.querySelector('.table-card');
   const tableDivider = document.querySelector('.table-divider');
   const modal = document.getElementById('masterModal');
   const modalTitle = document.getElementById('modal-master-title');
   
   /* --------------------------------------------------------------------------
      5. UTILITY FUNCTIONS
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
       
       if (tableDivider) {
           tableDivider.style.display = show ? 'block' : 'none';
       }
       
       if (!show && masterHeaderTitle) {
           masterHeaderTitle.textContent = "SILAKAN PILIH KATEGORI MASTER";
       }
   }
   
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
   
   /* --------------------------------------------------------------------------
      6. MODAL FORM GENERATOR & HANDLER
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
           let value = data ? (data[field.key] ?? '') : '';
       
           formHTML += `
               <label style="display:block; margin-bottom:5px; font-weight:bold; font-size:0.9rem;">
                   ${field.label}
               </label>
           `;
       
           if (field.type === 'select-db') {
               let options = [];
               let labelKey = '';
       
               if (field.source === 'toko') {
                   options = masterTokoOptions;
                   labelKey = 'nama_toko';
               }
       
               if (field.source === 'divisi') {
                   options = masterDivisiOptions;
                   labelKey = 'nama_divisi';
               }
       
               formHTML += `
                   <select id="modalInput-${field.key}" name="${field.key}" class="modal-select" required>
                       <option value="">-- Pilih ${field.label} --</option>
                       ${options.map(opt => `
                           <option 
                               value="${opt.id ?? opt}" 
                               ${String(value) === String(opt.id ?? opt) ? 'selected' : ''}
                           >
                               ${opt[labelKey] ?? opt.nama ?? opt.label ?? opt}
                           </option>
                       `).join('')}
                   </select>
               `;
           } else {
               formHTML += `
                   <input 
                       type="${field.type}" 
                       id="modalInput-${field.key}" 
                       name="${field.key}" 
                       value="${value}" 
                       required
                       style="width:100%; height:40px; margin-bottom:15px; padding:0 10px; box-sizing:border-box; border:1px solid #ccc; border-radius:4px;"
                   >
               `;
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
      7. CRUD FUNCTIONS
      -------------------------------------------------------------------------- */
   
   window.openMasterModal = async function(id = null) {
       if (!activeMasterKey) {
           showNotification('error', 'Pilih master yang akan diedit/ditambahkan.');
           return;
       }
   
       const masterConfig = masterDataMap[activeMasterKey];
       currentMasterEditId = id;
   
       await loadMasterTokoOptions();
       await loadMasterDivisiOptions();
   
       modalTitle.textContent = id ? `EDIT ${masterConfig.title}` : masterConfig.action;
       
       // Jika edit, load data dari API
       if (id !== null) {
           let dataToEdit = null;
           switch (activeMasterKey) {
               case 'TOKO':
                   dataToEdit = await getTokoDetail(id);
                   break;
               case 'DIVISI':
                   dataToEdit = await getDivisiDetail(id);
                   break;
               case 'TOPIK':
                   dataToEdit = await getTopikDetail(id);
                   break;
               case 'KARYAWAN':
                   dataToEdit = await getKaryawanDetail(id);
                   break;
               case 'USER ROLE':
                   dataToEdit = await getRoleDetail(id);
                   break;
           }
           renderModalForm(dataToEdit);
       } else {
           renderModalForm();
       }
   
       if (masterModal) masterModal.style.display = 'flex';
   }
   
   window.closeMasterModal = function() {
       if (masterModal) masterModal.style.display = 'none';
       currentMasterEditId = null;
       if (formMaster) formMaster.innerHTML = '';
   }
   
   window.saveMasterData = function() {
       if (!activeMasterKey) {
           showNotification('error', 'Master belum dipilih.');
           return;
       }
   
       switch (activeMasterKey) {
           case 'TOKO':
               saveToko(currentMasterEditId || null);
               return false;
           case 'DIVISI':
               saveDivisi(currentMasterEditId || null);
               return false;
           case 'TOPIK':
               saveTopik(currentMasterEditId || null);
               return false;
           case 'KARYAWAN':
               saveKaryawan(currentMasterEditId || null);
               return false;
           case 'USER ROLE':
               saveUserRole(currentMasterEditId || null);
               return false;
           default:
               showNotification('error', 'Master tidak dikenali');
               return false;
       }
   }
   
   window.deleteMasterData = function(id) {
       if (!activeMasterKey || !confirm(`Anda yakin ingin menghapus data ini?`)) return;
       
       switch (activeMasterKey) {
           case 'TOKO':
               deleteToko(id);
               break;
           case 'DIVISI':
               deleteDivisi(id);
               break;
           case 'TOPIK':
               deleteTopik(id);
               break;
           case 'KARYAWAN':
               deleteKaryawan(id);
               break;
           case 'USER ROLE':
               deleteRole(id);
               break;
       }
   }
   
   /* --------------------------------------------------------------------------
      8. TABLE MANAGEMENT FUNCTIONS
      -------------------------------------------------------------------------- */
   
   function renderMasterTable() {
       if (!masterTableBody || !masterTableHeader || !activeMasterKey) return;
   
       const masterConfig = masterDataMap[activeMasterKey];
       masterTableHeader.innerHTML = masterConfig.fields.map(field => `<th>${field}</th>`).join('');
   
       const phpRows = document.querySelectorAll('.master-row');
       const targetType = activeMasterKey.toLowerCase().replace(' ', '-');
   
       if (phpRows.length > 0) {
           let hasDataVisible = false;
           phpRows.forEach(row => {
               if (row.getAttribute('data-type') === targetType) {
                   row.style.display = 'table-row';
                   hasDataVisible = true;
               } else {
                   row.style.display = 'none';
               }
           });
   
           if (hasDataVisible) {
               filterMasterTable();
               return;
           }
       }
   
       masterTableBody.innerHTML = '';
       
       // Data akan di-load dari API, tampilkan loading
       masterTableBody.innerHTML = `<tr><td colspan="${masterConfig.fields.length}" style="text-align: center; color: var(--muted-text);">Loading data...</td></tr>`;
   }
   
   function filterMasterTable() {
       if (!masterTableBody || !masterSearch) return;
   
       const searchTerm = masterSearch.value.toLowerCase().trim();
       const rows = masterTableBody.querySelectorAll('tr');
       let visibleCount = 0;
   
       rows.forEach(row => {
           if (row.querySelector('td[colspan]')) return;
   
           const text = row.innerText.toLowerCase();
           if (searchTerm === "") {
               row.style.display = "";
               visibleCount++;
           } else if (text.includes(searchTerm)) {
               row.style.display = "";
               visibleCount++;
           } else {
               row.style.display = "none";
           }
       });
   
       const emptyRow = masterTableBody.querySelector('.empty-row');
       if (emptyRow) {
           emptyRow.style.display = visibleCount === 0 ? "" : "none";
       }
   }
   
   function switchMasterTab(key) {
       activeMasterKey = key.toUpperCase();
       const targetType = key.toLowerCase().replace(' ', '-');
   
       masterTabs.forEach(t => {
           t.classList.toggle('active', t.getAttribute('data-type') === targetType);
       });
   
       const config = masterDataMap[activeMasterKey];
       if (config) {
           masterHeaderTitle.textContent = config.title;
           masterHeaderButtonText.innerHTML = `<i class="fas fa-plus"></i> ${config.action}`;
           
           const headerRow = document.getElementById('masterTableHead');
           if (headerRow) {
               headerRow.innerHTML = `<tr>${config.fields.map(f => `<th>${f}</th>`).join('')}</tr>`;
           }
       }
   
       toggleMasterContent(true);
       renderMasterTable();
   }
   
   /* --------------------------------------------------------------------------
      9. PAGINATION FUNCTIONS
      -------------------------------------------------------------------------- */
   
   function updateTableFooter() {
       if (!activeMasterKey) return;
   
       const config = masterDataMap[activeMasterKey];
       const dataCount = Object.keys(config.data || {}).length;
   
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
       updateTableFooter();
   }
   
   function changeRowsPerPage(value) {
       rowsPerPage = parseInt(value);
       currentPage = 1;
       updateTableFooter();
   }
   
   /* --------------------------------------------------------------------------
      10. API FUNCTIONS - TOKO
      -------------------------------------------------------------------------- */
   
   async function getTokoDetail(id) {
       try {
           const res = await fetch(`api/get_master_toko.php?action=detail&id=${id}`);
           const json = await res.json();
           if (json.status && json.data) {
               return {
                   id: json.data.id,
                   nama_toko: json.data.nama_toko,
                   lokasi: json.data.lokasi,
                   kode: json.data.kode,
                   tglDibuat: json.data.created_at,
                   dibuatOleh: json.data.username
               };
           }
       } catch (err) {
           console.error("Get toko detail error:", err);
       }
       return null;
   }
   
   async function loadMasterToko() {
    try {
        if ($.fn.DataTable.isDataTable('#master-table-all')) {
            $('#master-table-all').DataTable().destroy();
        }
        
        const res = await fetch("api/get_master_toko.php?action=get");
        const json = await res.json();

        if (!json.status) {
            showNotification('error', json.message || "Gagal load data");
            return;
        }

        const tbody = document.getElementById("masterTableBody");
        tbody.innerHTML = "";

        if (!json.data || json.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Data toko kosong.</td></tr>`;
            return;
        }

        json.data.forEach((row, i) => {
            const tr = document.createElement('tr');
            tr.className = 'master-row';
            tr.dataset.type = 'toko';
            tr.innerHTML = `
                <td>${i + 1}</td>
                <td>${row.created_at ? row.created_at.split(' ')[0] : '-'}</td>                                       
                <td>${row.username || '-'}</td>
                <td>${row.nama_toko}</td>
                <td>${row.lokasi}</td>                       
                <td>${row.kode}</td>
                <td class="action-cell">
                    <div class="action-buttons-container">
                        <button class="action-btn edit-btn" onclick="editToko(${row.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteToko(${row.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Inisialisasi DataTable dengan perbaikan alignment
        $("#master-table-all").DataTable({
            "responsive": true,
            "lengthChange": false,
            "autoWidth": false, // Tetap false
            "paging": true,
            "pageLength": 10,
            "searching": false,
            "ordering": false,
            "info": true,
            "columnDefs": [
                { "className": "dt-center", "targets": "_all" } // Menyelaraskan semua kolom ke tengah (opsional, sesuaikan kebutuhan)
            ],
            "initComplete": function() {
                // Memaksa penyesuaian kolom setelah tabel digambar
                $(this).DataTable().columns.adjust();
            }
        });

    } catch (err) {
        console.error(err);
        showNotification("error", "Gagal connect ke server");
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
           showNotification(json.status ? "success" : "error", json.message);
   
           if(json.status) loadMasterToko();
       } catch (err) {
           console.error(err);
           showNotification("error", "Server error");
       }
   }
   
   async function editToko(id) {
       currentMasterEditId = id;
       openMasterModal(id);
   }
   
   async function saveToko(id = null) {
       try {
           const elNama = document.getElementById("modalInput-nama_toko");
           const elKode = document.getElementById("modalInput-kode");
           const elLokasi = document.getElementById("modalInput-lokasi");
   
           if (!elNama || !elKode || !elLokasi) {
               showNotification("error", "Form tidak lengkap");
               return;
           }
   
           const nama = elNama.value.trim();
           const kode = elKode.value.trim();
           const lokasi = elLokasi.value.trim();
   
           if (!nama || !kode || !lokasi) {
               showNotification("error", "Nama, kode, dan lokasi wajib diisi");
               return;
           }
   
           const fd = new FormData();
           fd.append("nama_toko", nama);
           fd.append("kode", kode);
           fd.append("lokasi", lokasi);
   
           let url = "api/get_master_toko.php?action=add";
   
           if (id) {
               url = "api/get_master_toko.php?action=edit";
               fd.append("id", id);
           }
   
           const res = await fetch(url, {
               method: "POST",
               body: fd
           });
   
           const json = await res.json();
           showNotification(json.status ? "success" : "error", json.message);
   
           if (json.status) {
               closeMasterModal();
               loadMasterToko();
           }
       } catch (err) {
           console.error("Save toko error:", err);
           showNotification("error", "Server error");
       }
   }
   
   /* --------------------------------------------------------------------------
      11. API FUNCTIONS - DIVISI
      -------------------------------------------------------------------------- */
   
   async function getDivisiDetail(id) {
       try {
           const res = await fetch(`api/get_master_divisi.php?action=detail&id=${id}`);
           const json = await res.json();
           if (json.status && json.data) {
               return {
                   id: json.data.id,
                   nama_divisi: json.data.nama_divisi,
                   posisi: json.data.posisi,
                   toko_id: json.data.toko_id,
                   tglDibuat: json.data.created_at,
                   dibuatOleh: json.data.username
               };
           }
       } catch (err) {
           console.error("Get divisi detail error:", err);
       }
       return null;
   }
   
   async function loadMasterDivisi() {
       try {
           if ($.fn.DataTable.isDataTable('#master-table-all')) {
               $('#master-table-all').DataTable().destroy();
           }
           
           const res = await fetch("api/get_master_divisi.php?action=get");
           const json = await res.json();
   
           const tbody = document.getElementById("masterTableBody");
           tbody.innerHTML = "";
   
           if (!json.status || !Array.isArray(json.data) || json.data.length === 0) {
               tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Data divisi kosong.</td></tr>`;
               return;
           }
   
           json.data.forEach((row, i) => {
               const tr = document.createElement('tr');
               tr.className = 'master-row';
               tr.dataset.type = 'divisi';
               tr.innerHTML = `
                   <td>${i + 1}</td>
                   <td>${row.created_at ? row.created_at.split(' ')[0] : '-'}</td>
                   <td>${row.username || '-'}</td>
                   <td>${row.nama_divisi || '-'}</td>
                   <td>${row.posisi || '-'}</td>
                   <td>${row.nama_toko || '-'}</td>
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
               `;
               tbody.appendChild(tr);
           });
   
           $("#master-table-all").DataTable({
               "responsive": true,
               "lengthChange": false,
               "autoWidth": false,
               "paging": true,
               "pageLength": 10,
               "searching": false,
               "ordering": false,
               "info": true,
               "columnDefs": [
                { "className": "dt-center", "targets": "_all" } // Menyelaraskan semua kolom ke tengah (opsional, sesuaikan kebutuhan)
                ],
                "initComplete": function() {
                    // Memaksa penyesuaian kolom setelah tabel digambar
                    $(this).DataTable().columns.adjust();
                }
           });
   
       } catch (err) {
           console.error("Load divisi error:", err);
           showNotification("error", "Gagal mengambil data divisi");
       }
   }
   
   async function deleteDivisi(id) {
       if (!confirm("Yakin mau hapus divisi ini?")) return;
   
       try {
           const fd = new FormData();
           fd.append("id", id);
   
           const res = await fetch("api/get_master_divisi.php?action=delete", {
               method: "POST",
               body: fd
           });
   
           const json = await res.json();
           showNotification(json.status ? "success" : "error", json.message);
           loadMasterDivisi();
       } catch (err) {
           console.error("Delete divisi error:", err);
           showNotification("error", "Gagal menghapus divisi");
       }
   }
   
   async function editDivisi(id) {
       currentMasterEditId = id;
       openMasterModal(id);
   }
   
   async function saveDivisi(id = null) {
       try {
           const namaDivisiEl = document.getElementById("modalInput-nama_divisi");
           const posisiEl = document.getElementById("modalInput-posisi");
           const tokoEl = document.getElementById("modalInput-toko_id");
   
           if (!namaDivisiEl || !tokoEl) {
               showNotification("error", "Form divisi tidak lengkap");
               return;
           }
   
           const namaDivisi = namaDivisiEl.value.trim();
           const posisi = posisiEl ? posisiEl.value.trim() : "";
           const tokoId = tokoEl.value;
   
           if (!namaDivisi || !tokoId) {
               showNotification("error", "Nama divisi dan toko wajib diisi");
               return;
           }
   
           const fd = new FormData();
           fd.append("nama_divisi", namaDivisi);
           fd.append("posisi", posisi);
           fd.append("toko_id", tokoId);
   
           let url = "api/get_master_divisi.php?action=add";
   
           if (id) {
               url = "api/get_master_divisi.php?action=edit";
               fd.append("id", id);
           }
   
           const res = await fetch(url, { method: "POST", body: fd });
   
           if (!res.ok) {
               throw new Error("HTTP Error " + res.status);
           }
   
           const json = await res.json();
   
           if (!json.status) {
               showNotification("error", json.message || "Gagal menyimpan divisi");
               return;
           }
   
           showNotification("success", json.message || "Divisi berhasil disimpan");
           closeMasterModal();
           loadMasterDivisi();
           loadMasterDivisiOptions();
   
       } catch (err) {
           console.error("Save divisi error:", err);
           showNotification("error", "Terjadi kesalahan saat menyimpan divisi");
       }
   }
   
   /* --------------------------------------------------------------------------
      12. API FUNCTIONS - TOPIK
      -------------------------------------------------------------------------- */
   
   async function getTopikDetail(id) {
       try {
           const res = await fetch(`api/get_master_topik.php?action=detail&id=${id}`);
           const json = await res.json();
           if (json.status && json.data) {
               return {
                   id: json.data.id,
                   nama_topik: json.data.nama_topik,
                   toko_id: json.data.toko_id,
                   divisi_id: json.data.divisi_id,
                   tglDibuat: json.data.created_at,
                   dibuatOleh: json.data.username
               };
           }
       } catch (err) {
           console.error("Get topik detail error:", err);
       }
       return null;
   }
   
   async function loadMasterTopik() {
       try {
            loadMasterDivisiOptions()
            if ($.fn.DataTable.isDataTable('#master-table-all')) {
               $('#master-table-all').DataTable().destroy();
            }
           
           const res = await fetch("api/get_master_topik.php?action=get");
           const result = await res.json();
   
           if (!result.status) {
               console.error("API error:", result);
               showNotification("error", result.message || "Gagal load data topik");
               return;
           }
   
           const data = result.data;
           const tbody = document.getElementById("masterTableBody");
           tbody.innerHTML = "";
   
           if (!Array.isArray(data) || data.length === 0) {
               tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Data topik kosong.</td></tr>`;
               return;
           }
   
           data.forEach((row, i) => {
               var topikName = "";
               const tr = document.createElement('tr');
               tr.className = 'master-row';
               tr.dataset.type = 'topik';
               topikName = masterDivisiOptions[row.divisi_id];
               console.log(topikName);
               tr.innerHTML = `
                   <td>${i + 1}</td>
                   <td>${row.created_at ? row.created_at.split(' ')[0] : '-'}</td>
                   <td>${row.username ?? '-'}</td>
                   <td>${row.nama_topik ?? '-'}</td>
                   <td>${row.nama_toko ?? '-'}</td>
                   <td>${topikName ?? '-'}</td>
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
               `;
               tbody.appendChild(tr);
           });
   
           $("#master-table-all").DataTable({
               "responsive": true,
               "lengthChange": false,
               "autoWidth": false,
               "paging": true,
               "pageLength": 10,
               "searching": false,
               "ordering": false,
               "info": true,
               "columnDefs": [
                { "className": "dt-center", "targets": "_all" } // Menyelaraskan semua kolom ke tengah (opsional, sesuaikan kebutuhan)
                ],
                "initComplete": function() {
                    // Memaksa penyesuaian kolom setelah tabel digambar
                    $(this).DataTable().columns.adjust();
                }
           });
       } catch (err) {
           console.error("Load master topik gagal:", err);
           showNotification("error", "Gagal load data topik");
       }
   }
   
   async function deleteTopik(id) {
       if (!confirm("Yakin mau hapus topik ini?")) return;
   
       try {
           const fd = new FormData();
           fd.append("id", id);
   
           const res = await fetch("api/get_master_topik.php?action=delete", {
               method: "POST",
               body: fd
           });
   
           const json = await res.json();
           showNotification(json.status ? "success" : "error", json.message);
           loadMasterTopik();
       } catch (err) {
           console.error("Delete topik error:", err);
           showNotification("error", "Gagal menghapus topik");
       }
   }
   
   async function editTopik(id) {
       currentMasterEditId = id;
       openMasterModal(id);
   }
   
   async function saveTopik(id = null) {
       try {
           const namaTopik = document.getElementById('modalInput-nama_topik')?.value.trim();
           const tokoId = document.getElementById('modalInput-toko_id')?.value;
           const e = document.getElementById('modalInput-divisi_id');

            var value = e.selectedIndex;
            var text = e.options[e.selectedIndex].text;
   
           if (!namaTopik || !tokoId || !value) {
               showNotification('error', 'Nama topik, toko, dan divisi wajib diisi');
               return;
           }

   
           const fd = new FormData();
           fd.append("nama_topik", namaTopik);
           fd.append("toko_id", tokoId);
           fd.append("divisi_id", value - 1);
           fd.append("username", "ADMIN");
   
           let url = "api/get_master_topik.php?action=add";
   
           if (id) {
               url = "api/get_master_topik.php?action=edit";
               fd.append("id", id);
           }
   
           const res = await fetch(url, {
               method: "POST",
               body: fd
           });
   
           const json = await res.json();
   
           if (!json.status) {
               showNotification("error", json.message || "Gagal menyimpan topik");
               return;
           }
   
           showNotification("success", json.message || "Topik berhasil disimpan");
           closeMasterModal();
           loadMasterTopik();
   
       } catch (err) {
           console.error("SAVE TOPIK ERROR:", err);
           showNotification("error", "Terjadi kesalahan server");
       }
   }
   
   /* --------------------------------------------------------------------------
      13. API FUNCTIONS - KARYAWAN
      -------------------------------------------------------------------------- */
   
   async function getKaryawanDetail(id) {
       try {
           const res = await fetch(`api/get_master_karyawan.php?action=detail&id=${id}`);
           const json = await res.json();
           if (json.status && json.data) {
               return {
                   id: json.data.id,
                   nama_karyawan: json.data.nama_karyawan,
                   toko_id: json.data.toko_id,
                   divisi_id: json.data.divisi_id,
                   tglDibuat: json.data.created_at,
                   dibuatOleh: json.data.username               
               };
           }
       } catch (err) {
           console.error("Get karyawan detail error:", err);
       }
       return null;
   }
   
   async function loadMasterKaryawan() {
       try {
           if ($.fn.DataTable.isDataTable('#master-table-all')) {
               $('#master-table-all').DataTable().destroy();
           }
           
           const res = await fetch("api/get_master_karyawan.php?action=get");
           const json = await res.json();
   
           const tbody = document.getElementById("masterTableBody");
           tbody.innerHTML = "";
   
           if (!json.status || !Array.isArray(json.data) || json.data.length === 0) {
               tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Data karyawan kosong.</td></tr>`;
               return;
           }
   
           json.data.forEach((row, i) => {
               const tr = document.createElement('tr');
               tr.className = 'master-row';
               tr.dataset.type = 'karyawan';
               tr.innerHTML = `
                   <td>${i + 1}</td>
                   <td>${row.created_at ? row.created_at.split(' ')[0] : '-'}</td>
                   <td>${row.username || '-'}</td>
                   <td>${row.nama_karyawan || '-'}</td>
                   <td>${row.nama_toko || '-'}</td>
                   <td>${row.nama_divisi || '-'}</td>
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
               `;
               tbody.appendChild(tr);
           });
   
           $("#master-table-all").DataTable({
               "responsive": true,
               "lengthChange": false,
               "autoWidth": false,
               "paging": true,
               "pageLength": 10,
               "searching": false,
               "ordering": false,
               "info": true,
               "columnDefs": [
                { "className": "dt-center", "targets": "_all" } // Menyelaraskan semua kolom ke tengah (opsional, sesuaikan kebutuhan)
                ],
                "initComplete": function() {
                    // Memaksa penyesuaian kolom setelah tabel digambar
                    $(this).DataTable().columns.adjust();
                }
           });
   
       } catch (err) {
           console.error("Load karyawan error:", err);
           showNotification("error", "Gagal mengambil data karyawan");
       }
   }
   
   async function deleteKaryawan(id) {
       if (!confirm("Yakin mau hapus karyawan ini?")) return;
   
       try {
           const fd = new FormData();
           fd.append("id", id);
   
           const res = await fetch("api/get_master_karyawan.php?action=delete", {
               method: "POST",
               body: fd
           });
   
           const json = await res.json();
           showNotification(json.status ? "success" : "error", json.message);
           loadMasterKaryawan();
       } catch (err) {
           console.error("Delete karyawan error:", err);
           showNotification("error", "Gagal menghapus karyawan");
       }
   }
   
   async function editKaryawan(id) {
       currentMasterEditId = id;
       openMasterModal(id);
   }
   
   async function saveKaryawan(id = null) {
       try {
           const namaKaryawan = document.getElementById("modalInput-nama_karyawan")?.value.trim();
           const tokoId = document.getElementById("modalInput-toko_id")?.value;
           const divisiId = document.getElementById("modalInput-divisi_id")?.value;
   
           if (!namaKaryawan || !tokoId || !divisiId) {
               showNotification("error", "Semua field wajib diisi");
               return;
           }
   
           const fd = new FormData();
           fd.append("nama_karyawan", namaKaryawan);
           fd.append("toko_id", tokoId);
           fd.append("divisi_id", divisiId);
           fd.append("username", "ADMIN");
   
           let url = "api/get_master_karyawan.php?action=add";
   
           if (id) {
               url = "api/get_master_karyawan.php?action=edit";
               fd.append("id", id);
           }
   
           const res = await fetch(url, { method: "POST", body: fd });
           const json = await res.json();
   
           if (!json.status) {
               showNotification("error", json.message || "Gagal menyimpan karyawan");
               return;
           }
   
           showNotification("success", json.message || "Karyawan berhasil disimpan");
           closeMasterModal();
           loadMasterKaryawan();
   
       } catch (err) {
           console.error("Save karyawan error:", err);
           showNotification("error", "Terjadi kesalahan saat menyimpan karyawan");
       }
   }
   
   /* --------------------------------------------------------------------------
      14. API FUNCTIONS - USER ROLE
      -------------------------------------------------------------------------- */
   
   async function getRoleDetail(id) {
       try {
           const res = await fetch(`api/get_user_role.php?action=detail&id=${id}`);
           const json = await res.json();
           if (json.status && json.data) {
               const permissions = json.data.permissions || '';
               const listKeys = permissions.split(',').map(key => key.trim()).filter(key => key);
               return {
                   id: json.data.id,
                   namaRole: json.data.role_name,
                   listKeys: listKeys,
                   tglDibuat: json.data.created_at,
                   dibuatOleh: json.data.username
               };
           }
       } catch (err) {
           console.error("Get role detail error:", err);
       }
       return null;
   }
   
   async function loadRoleTable() {
       try {
           if ($.fn.DataTable.isDataTable('#master-table-all')) {
               $('#master-table-all').DataTable().destroy();
           }
           
           const response = await fetch('api/get_user_role.php?action=get');
           const result = await response.json();
   
           const tbody = document.getElementById("masterTableBody");
           tbody.innerHTML = "";
   
           if (!result.status || !Array.isArray(result.data) || result.data.length === 0) {
               tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Data role kosong.</td></tr>`;
               return;
           }
   
           result.data.forEach((row, index) => {
               const tr = document.createElement('tr');
               tr.className = 'master-row';
               tr.dataset.type = 'user-role';
               tr.innerHTML = `
                   <td>${index + 1}</td>
                   <td>${row.created_at ? row.created_at.split(' ')[0] : '-'}</td>
                   <td>${row.username || '-'}</td>
                   <td>${row.role_name}</td>
                   <td><small>${row.permissions || '-'}</small></td>
                   <td class="action-cell">
                       <div class="action-buttons-container">
                           <button class="action-btn edit-btn" onclick="editRole(${row.id})">
                               <i class="fas fa-edit"></i>
                           </button>
                           <button class="action-btn delete-btn" onclick="deleteRole(${row.id})">
                               <i class="fas fa-trash"></i>
                           </button>
                       </div>
                   </td>
               `;
               tbody.appendChild(tr);
           });
   
           $("#master-table-all").DataTable({
               "responsive": true,
               "lengthChange": false,
               "autoWidth": false,
               "paging": true,
               "pageLength": 10,
               "searching": false,
               "ordering": false,
               "info": true,
               "columnDefs": [
                { "className": "dt-center", "targets": "_all" } // Menyelaraskan semua kolom ke tengah (opsional, sesuaikan kebutuhan)
                ],
                "initComplete": function() {
                    // Memaksa penyesuaian kolom setelah tabel digambar
                    $(this).DataTable().columns.adjust();
                }
           });
       } catch (error) {
           console.error("Gagal memuat data role:", error);
           showNotification("error", "Gagal load data role");
       }
   }
   
    async function saveUserRole() {
        try {
            const namaRole = document.getElementById('modalInput-namaRole')?.value.trim();
            
            if (!namaRole) {
                showNotification('error', 'Nama Role tidak boleh kosong');
                return;
            }
            const selectedKeys = [];

            document.querySelectorAll('.key-check:checked').forEach(cb => {
                const keyName = cb.value.trim();
            
                const keyId = keyName.toLowerCase().replace(/\s+/g, '_');
                const valueInput = document.getElementById(`input_val_${keyId}`);
                const extraVal = valueInput?.value.trim();
            
                selectedKeys.push({
                    key: keyName,
                    value: extraVal
                });
            });
            
            const fd = new FormData();
            fd.append('role_name', namaRole);
            fd.append('keys', JSON.stringify(selectedKeys));
            
    
            let url = 'api/get_user_role.php?action=add';
            if (currentMasterEditId) {
                url = 'api/get_user_role.php?action=edit';
                fd.append('id', currentMasterEditId);
            }
    
            const res = await fetch(url, {
                method: 'POST',
                body: fd
            });
            
            const data = await res.json();
    
            if (data.status) {
                showNotification('success', data.message || 'Role berhasil disimpan');
                closeMasterModal();
                loadRoleTable();
            } else {
                showNotification('error', data.message || 'Gagal menyimpan role');
            }
        } catch (error) {
            console.error("Save role error:", error);
            showNotification('error', 'Terjadi kesalahan sistem');
        }
    }
   
   async function deleteRole(id) {
       if (!confirm('Yakin ingin menghapus role ini?')) return;
   
       try {
           const fd = new FormData();
           fd.append('id', id);
   
           const res = await fetch('api/get_user_role.php?action=delete', {
               method: 'POST',
               body: fd
           });
           
           const data = await res.json();
           
           if (data.status) {
               showNotification('success', data.message || 'Role berhasil dihapus');
               loadRoleTable();
           } else {
               showNotification('error', data.message || 'Gagal menghapus role');
           }
       } catch (error) {
           console.error("Delete role error:", error);
           showNotification('error', 'Gagal menghapus data');
       }
   }
   
   async function editRole(id) {
       currentMasterEditId = id;
       openMasterModal(id);
   }
   
   /* --------------------------------------------------------------------------
      15. INITIALIZATION & EVENT LISTENERS
      -------------------------------------------------------------------------- */
   
   document.addEventListener('DOMContentLoaded', () => {
       // 1. Pastikan konten tersembunyi saat awal load
       toggleMasterContent(false);
   
       // 2. Setup sidebar toggle
       if (toggleBtn) {
           toggleBtn.addEventListener('click', (e) => {
               e.preventDefault();
               sidebar.classList.toggle('hide');
               adjustMainContentMargin();
           });
       }
   
       // 3. Setup tab navigation
       document.querySelectorAll(".master-tab").forEach(tab => {
           tab.addEventListener("click", () => {
               masterTabs.forEach(t => t.classList.remove('active'));
               tab.classList.add('active');
               
               const key = tab.textContent.trim().toUpperCase();
               switchMasterTab(key);
   
               // Load data berdasarkan tab yang dipilih
               switch(key) {
                   case "DIVISI":
                       loadMasterDivisi();
                       break;
                   case "TOKO":
                       loadMasterToko();
                       break;
                   case "TOPIK":
                       loadMasterTopik();
                       break;
                   case "KARYAWAN":
                       loadMasterKaryawan();
                       break;
                   case "USER ROLE":
                       loadRoleTable();
                       break;
               }
           });
       });
   
       // 4. Setup add button
       const addButton = document.getElementById('btnAddMaster');
       if (addButton) {
           addButton.addEventListener('click', () => {
               if (activeMasterKey) {
                   currentMasterEditId = null;
                   openMasterModal(null);
               } else {
                   showNotification('info', 'Silakan pilih Master dahulu.');
               }
           });
       }
   
       // 5. Setup search
       if (masterSearch) masterSearch.addEventListener('input', filterMasterTable);
   
       // 6. Setup pagination
       const prevPageBtn = document.getElementById('prevPage');
       const nextPageBtn = document.getElementById('nextPage');
       const showRowsSelect = document.getElementById('showRows');
   
       if (prevPageBtn) prevPageBtn.addEventListener('click', () => goToPage(currentPage - 1));
       if (nextPageBtn) nextPageBtn.addEventListener('click', () => goToPage(currentPage + 1));
       if (showRowsSelect) showRowsSelect.addEventListener('change', (e) => changeRowsPerPage(e.target.value));
   
       // 7. Setup window resize handler
       window.addEventListener('resize', adjustMainContentMargin);
       
       console.log("System Ready: Silakan pilih kategori master.");
   });
   
   // Expose functions to global scope
   window.editToko = editToko;
   window.deleteToko = deleteToko;
   window.editDivisi = editDivisi;
   window.deleteDivisi = deleteDivisi;
   window.editTopik = editTopik;
   window.deleteTopik = deleteTopik;
   window.editKaryawan = editKaryawan;
   window.deleteKaryawan = deleteKaryawan;
   window.editRole = editRole;
   window.deleteRole = deleteRole;