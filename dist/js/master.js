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
       // Prioritas: pakai serverTokoOptions yang sudah di-inject dari PHP (selalu ada)
       // Fallback: fetch dari API jika serverTokoOptions tidak tersedia
       if (typeof serverTokoOptions !== 'undefined' && serverTokoOptions.length > 0) {
           masterTokoOptions = serverTokoOptions;
           return;
       }
       try {
           const res = await fetch("routines/base_api.php");
           const json = await res.json();
           if (json.toko && Array.isArray(json.toko)) {
               masterTokoOptions = json.toko.map(nama => ({
                   id: nama,
                   nama_toko: nama
               }));
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
   
   // AVAILABLE_KEYS diisi dari API (role_key table, id >= 3)
   // Format: array of {id, role_key_name} dari database
   let AVAILABLE_KEYS = [];

   async function loadAvailableKeys() {
       try {
           const res = await fetch('api/get_user_role.php?action=permissions');
           const json = await res.json();
           if (json.status && Array.isArray(json.data) && json.data.length > 0) {
               AVAILABLE_KEYS = json.data; // [{id, role_key_name}, ...]
           }
       } catch (e) {
           console.warn('Gagal load keys dari API:', e);
           // Fallback hardcoded (nama sesuai DB)
           AVAILABLE_KEYS = [
               {id:3, role_key_name:'update_toko'},
               {id:4, role_key_name:'manage_user'},
               {id:5, role_key_name:'update_role'},
               {id:6, role_key_name:'update_divisi'},
               {id:7, role_key_name:'update_topik'},
               {id:8, role_key_name:'update_karyawan'},
               {id:9, role_key_name:'view_note'},
               {id:10, role_key_name:'input_note'},
               {id:11, role_key_name:'update_note'},
               {id:12, role_key_name:'delete_note'}
           ];
       }
   }
   
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
   
   /* --------------------------------------------------------------------------
      5b. CUSTOM SELECT DROPDOWN (pengganti <select> native agar tidak ke atas)
      -------------------------------------------------------------------------- */
   function initCustomSelects() {
       // Bersihkan dropdown lama yang mungkin tertinggal di body
       document.querySelectorAll('.custom-select-dropdown[data-detached]').forEach(d => d.remove());

       const wrappers = document.querySelectorAll('.custom-select-wrapper');
       if (!wrappers.length) return;

       wrappers.forEach(wrapper => {
           const trigger = wrapper.querySelector('.custom-select-trigger');
           const arrow   = trigger?.querySelector('.custom-select-arrow');
           const dropdown = wrapper.querySelector('.custom-select-dropdown');
           if (!trigger || !dropdown) return;

           // Pindahkan dropdown ke body agar tidak terpotong overflow parent
           dropdown.dataset.detached = 'true';
           document.body.appendChild(dropdown);

           function openDropdown() {
               // Tutup semua dropdown lain
               document.querySelectorAll('.custom-select-dropdown.open').forEach(d => {
                   if (d !== dropdown) {
                       d.classList.remove('open');
                       const tid = d.dataset.ownTrigger;
                       if (tid) document.getElementById(tid)
                           ?.querySelector('.custom-select-arrow')
                           ?.classList.remove('open');
                   }
               });

               // Posisikan tepat di bawah trigger (fixed)
               const rect = trigger.getBoundingClientRect();
               dropdown.style.position = 'fixed';
               dropdown.style.top      = (rect.bottom + 2) + 'px';
               dropdown.style.left     = rect.left + 'px';
               dropdown.style.width    = rect.width + 'px';
               dropdown.style.zIndex   = '999999';
               dropdown.dataset.ownTrigger = trigger.id;

               dropdown.classList.add('open');
               if (arrow) arrow.classList.add('open');
           }

           function closeDropdown() {
               dropdown.classList.remove('open');
               if (arrow) arrow.classList.remove('open');
           }

           trigger.addEventListener('click', function(e) {
               e.stopPropagation();
               dropdown.classList.contains('open') ? closeDropdown() : openDropdown();
           });

           // Pilih opsi
           dropdown.querySelectorAll('.custom-select-option').forEach(opt => {
               opt.addEventListener('click', function(e) {
                   e.stopPropagation();
                   const val   = this.dataset.value;
                   const label = this.textContent.trim();
                   const field = this.dataset.field;

                   // Update hidden input
                   const hiddenInput = document.getElementById('modalInput-' + field);
                   if (hiddenInput) {
                       hiddenInput.value = val;
                       console.log('[CustomSelect] Set modalInput-' + field + ' =', val);
                   }

                   // Update label trigger
                   const labelEl = document.getElementById('label-' + field);
                   if (labelEl) labelEl.textContent = label;

                   // Update selected state
                   dropdown.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('selected'));
                   this.classList.add('selected');

                   closeDropdown();
               });
           });
       });

       // Tutup saat klik di luar dropdown
       if (!window._customSelectOutsideHandler) {
           window._customSelectOutsideHandler = function(e) {
               document.querySelectorAll('.custom-select-dropdown.open').forEach(d => {
                   const tid = d.dataset.ownTrigger;
                   const trigEl = tid ? document.getElementById(tid) : null;
                   if (!d.contains(e.target) && trigEl && !trigEl.contains(e.target)) {
                       d.classList.remove('open');
                       trigEl.querySelector('.custom-select-arrow')?.classList.remove('open');
                   }
               });
           };
           document.addEventListener('click', window._customSelectOutsideHandler);
       }
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
       
               // Custom dropdown (mengganti <select> native agar tidak muncul ke atas)
               const selectedOpt = options.find(opt => String(opt.id ?? opt) === String(value));
               const selectedLabel = selectedOpt
                   ? (selectedOpt[labelKey] ?? selectedOpt.nama ?? selectedOpt.label ?? selectedOpt)
                   : `-- Pilih ${field.label} --`;

               formHTML += `
                   <input type="hidden" id="modalInput-${field.key}" name="${field.key}" value="${value}">
                   <div class="custom-select-wrapper" id="wrapper-${field.key}">
                       <div class="custom-select-trigger" id="trigger-${field.key}" data-field="${field.key}">
                           <span class="custom-select-label" id="label-${field.key}">${selectedLabel}</span>
                           <i class="fas fa-chevron-down custom-select-arrow" id="arrow-${field.key}"></i>
                       </div>
                       <div class="custom-select-dropdown" id="dropdown-${field.key}">
                           <div class="custom-select-option" data-value="" data-field="${field.key}">-- Pilih ${field.label} --</div>
                           ${options.map(opt => {
                               const optVal = opt.id ?? opt;
                               const optLabel = opt[labelKey] ?? opt.nama ?? opt.label ?? opt;
                               const isSelected = String(value) === String(optVal);
                               return `<div class="custom-select-option ${isSelected ? 'selected' : ''}" data-value="${optVal}" data-field="${field.key}">${optLabel}</div>`;
                           }).join('')}
                       </div>
                   </div>
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
   
       // 3. Logika Khusus USER ROLE - Flex Role dengan scope per key
       if (activeMasterKey === 'USER ROLE') {
           const currentKeysData   = (data && Array.isArray(data.listKeys)) ? data.listKeys : [];
           const currentKeyValues  = (data && data.keyValues) ? data.keyValues : {};

           // Semua key (update_toko s/d delete_note) menggunakan scope toko

           // Ambil daftar toko dari masterTokoOptions yang sudah di-load
           // Pastikan masterTokoOptions terisi - fallback ke serverTokoOptions jika masih kosong
           if (masterTokoOptions.length === 0 && typeof serverTokoOptions !== 'undefined') {
               masterTokoOptions = serverTokoOptions;
           }
           const tokoList = masterTokoOptions.map(t => t.nama_toko || t);
           console.log('[FlexRole] tokoList:', tokoList); // debug - hapus setelah confirmed OK

           const buildKeyRow = (keyObj) => {
               const dbKeyName   = keyObj.role_key_name;
               const keyLower    = dbKeyName.toLowerCase();
               const displayName = dbKeyName.toUpperCase().replace(/_/g, ' ');
               const keyType     = KEY_TYPE_MAP[keyLower] || 'none';
               const isChecked   = currentKeysData.some(k => k.trim().toLowerCase() === keyLower);
               const savedVal    = currentKeyValues[keyLower] || {};

               // ── Value section berdasarkan tipe ──
               let valueHTML = '';

               if (keyType === 'bool') {
                   // Tidak perlu value section (kehadiran key = true)
                   valueHTML = `<span style="font-size:0.72rem;color:#888;font-style:italic;">toggle only</span>`;

               } else if (keyType === 'scope') {
                   // Multi-select toko sebagai checkbox group
                   let savedScope = [];
                   if (savedVal.string) {
                       try { savedScope = JSON.parse(savedVal.string); } catch(e) { savedScope = [savedVal.string]; }
                   }
                   const allSelected = savedScope.length === 0; // kosong = semua (saat edit baru)
                   valueHTML = `
                   <div id="scope_${dbKeyName}" class="flex-scope-box" style="display:${isChecked?'block':'none'};margin-top:6px;padding:8px;background:#f9f9f9;border:1px solid #e0e0e0;border-radius:4px;">
                       <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                           <span style="font-size:0.72rem;font-weight:bold;color:#555;">SCOPE TOKO:</span>
                           <button type="button" onclick="toggleAllScopeToko('${dbKeyName}', this)"
                               style="font-size:0.65rem;padding:2px 7px;border:1px solid #aaa;background:#fff;border-radius:3px;cursor:pointer;">
                               ${savedScope.length===0?'DESELECT ALL':'SELECT ALL'}
                           </button>
                       </div>
                       <div style="display:flex;flex-wrap:wrap;gap:5px;">
                           ${tokoList.map(toko => {
                               const checked = savedScope.length === 0 || savedScope.includes(toko);
                               return `<label style="display:flex;align-items:center;gap:4px;font-size:0.75rem;background:#fff;border:1px solid #ddd;padding:3px 7px;border-radius:3px;cursor:pointer;">
                                   <input type="checkbox" class="scope-toko-check" data-key="${dbKeyName}" value="${toko}" ${checked?'checked':''} style="width:13px;height:13px;">
                                   ${toko}
                               </label>`;
                           }).join('')}
                       </div>
                   </div>`;

               } else if (keyType === 'datetime') {
                   const savedDt = savedVal.datetime || savedVal.string || '';
                   const isForever = savedDt === '' || savedDt === 'forever' || savedDt === null;
                   valueHTML = `
                   <div id="scope_${dbKeyName}" style="display:${isChecked?'block':'none'};margin-top:6px;">
                       <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                           <label style="display:flex;align-items:center;gap:4px;font-size:0.78rem;">
                               <input type="radio" name="expiry_type_${dbKeyName}" value="forever" ${isForever?'checked':''} onchange="toggleExpiryInput('${dbKeyName}', false)"> FOREVER
                           </label>
                           <label style="display:flex;align-items:center;gap:4px;font-size:0.78rem;">
                               <input type="radio" name="expiry_type_${dbKeyName}" value="date" ${!isForever?'checked':''} onchange="toggleExpiryInput('${dbKeyName}', true)"> SET DATE
                           </label>
                       </div>
                       <input type="datetime-local" id="expiry_input_${dbKeyName}"
                           value="${!isForever ? (savedDt||'') : ''}"
                           style="display:${!isForever?'block':'none'};margin-top:5px;width:100%;padding:5px;border:1px solid #ccc;border-radius:4px;font-size:0.8rem;box-sizing:border-box;">
                   </div>`;
               }

               return `
               <div class="flex-key-row" style="border:1px solid #e8e8e8;border-radius:6px;margin-bottom:8px;padding:10px 12px;background:#fff;">
                   <div style="display:flex;align-items:center;gap:10px;">
                       <input type="checkbox" id="check_${dbKeyName}" class="key-check"
                           value="${dbKeyName}" ${isChecked?'checked':''}
                           style="width:16px;height:16px;cursor:pointer;flex-shrink:0;"
                           onchange="onFlexKeyToggle(this)">
                       <label for="check_${dbKeyName}" style="font-weight:bold;font-size:0.85rem;cursor:pointer;flex:1;">${displayName}</label>
                       ${valueHTML}
                   </div>
               </div>`;
           };

           formHTML += `
           <div style="margin-top:12px;">
               <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                   <span style="font-weight:bold;font-size:0.88rem;color:#333;">
                       <i class="fas fa-key" style="margin-right:6px;color:#113F67;"></i> PERMISSIONS & SCOPE
                   </span>
                   <div style="display:flex;gap:6px;">
                       <button type="button" id="selectAllKeys"
                           style="font-size:0.72rem;padding:3px 10px;border:1px solid #113F67;color:#113F67;background:#fff;border-radius:3px;cursor:pointer;">
                           SELECT ALL
                       </button>
                       <button type="button" id="deselectAllKeys"
                           style="font-size:0.72rem;padding:3px 10px;border:1px solid #888;color:#888;background:#fff;border-radius:3px;cursor:pointer;">
                           CLEAR ALL
                       </button>
                   </div>
               </div>

               ${(() => {
                   // UPDATE TOKO: boolean toggle (tidak pakai scope toko)
                   const isUpdateTokoChecked = currentKeysData.some(k => k.toLowerCase() === 'update_toko');
                   const updateTokoSavedVal   = currentKeyValues['update_toko'] || {};
                   const updateTokoSavedScope = (() => { try { return JSON.parse(updateTokoSavedVal.string || 'null'); } catch(e) { return null; } })();
                   const updateTokoAllSelected = updateTokoSavedScope === null || (Array.isArray(updateTokoSavedScope) && updateTokoSavedScope.length === 0);

                   const updateTokoHTML = `
                   <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px 12px;margin-bottom:8px;">
                       <div style="display:flex;align-items:center;gap:10px;">
                           <input type="checkbox" id="check_update_toko" class="key-check"
                               value="update_toko" ${isUpdateTokoChecked?'checked':''}
                               style="width:16px;height:16px;cursor:pointer;flex-shrink:0;"
                               onchange="onFlexKeyToggle(this)">
                           <label for="check_update_toko" style="font-weight:bold;font-size:0.85rem;cursor:pointer;flex:1;">
                               <i class="fas fa-store" style="color:#16a34a;margin-right:5px;"></i>UPDATE TOKO
                           </label>
                           <span style="font-size:0.72rem;color:#6b7280;font-style:italic;">boolean + scope toko</span>
                       </div>
                       <div id="scope_update_toko" class="flex-scope-box"
                           style="display:${isUpdateTokoChecked?'block':'none'};margin-top:8px;padding:8px;background:rgba(255,255,255,0.7);border:1px solid #bbf7d0;border-radius:4px;">
                           <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                               <span style="font-size:0.72rem;font-weight:bold;color:#555;">
                                   SCOPE TOKO: <span style="font-weight:normal;color:#888;">(kosongkan = akses semua toko)</span>
                               </span>
                               <button type="button" onclick="toggleAllScopeToko('update_toko', this)"
                                   style="font-size:0.65rem;padding:2px 8px;border:1px solid #aaa;background:#fff;border-radius:3px;cursor:pointer;">
                                   ${updateTokoAllSelected ? 'DESELECT ALL' : 'SELECT ALL'}
                               </button>
                           </div>
                           <div style="display:flex;flex-wrap:wrap;gap:5px;">
                               ${tokoList.map(toko => {
                                   const chk = updateTokoAllSelected || (Array.isArray(updateTokoSavedScope) && updateTokoSavedScope.includes(toko));
                                   return '<label style="display:flex;align-items:center;gap:4px;font-size:0.75rem;background:#fff;border:1px solid #ddd;padding:3px 8px;border-radius:3px;cursor:pointer;white-space:nowrap;"><input type="checkbox" class="scope-toko-check" data-key="update_toko" value="' + toko + '" ' + (chk?'checked':'') + ' style="width:13px;height:13px;"> ' + toko + '</label>';
                               }).join('')}
                           </div>
                       </div>
                   </div>`;

                   // MANAGE USER: boolean only (toggle akses user management page)
                   const isManageUserChecked = currentKeysData.some(k => k.toLowerCase() === 'manage_user');
                   const manageUserHTML = `
                   <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:10px 12px;margin-bottom:8px;">
                       <div style="display:flex;align-items:center;gap:10px;">
                           <input type="checkbox" id="check_manage_user" class="key-check"
                               value="manage_user" ${isManageUserChecked?'checked':''}
                               style="width:16px;height:16px;cursor:pointer;flex-shrink:0;"
                               onchange="onFlexKeyToggle(this)">
                           <label for="check_manage_user" style="font-weight:bold;font-size:0.85rem;cursor:pointer;flex:1;">
                               <i class="fas fa-users-cog" style="color:#2563eb;margin-right:5px;"></i>MANAGE USER
                           </label>
                           <span style="font-size:0.72rem;color:#6b7280;font-style:italic;">toggle only</span>
                       </div>
                   </div>`;

                   // KEY LAIN: scope toko per-key (tanpa manage_user)
                   const scopeHTML = ['update_role','update_divisi','update_topik','update_karyawan','view_note','input_note','update_note','delete_note'].map(keyName => {
                   const isChecked  = currentKeysData.some(k => k.toLowerCase() === keyName);
                   const savedVal   = currentKeyValues[keyName] || {};
                   const savedScope = (() => { try { return JSON.parse(savedVal.string || 'null'); } catch(e) { return null; } })();
                   // null atau [] berarti semua toko diizinkan
                   const allSelected = savedScope === null || (Array.isArray(savedScope) && savedScope.length === 0);

                   const LABEL_MAP = {
                       'update_role'    : { icon: 'fa-user-shield',color: '#92400e', label: 'UPDATE ROLE',     bg: '#fefce8', border: '#fde68a' },
                       'update_divisi'  : { icon: 'fa-layer-group',color: '#92400e', label: 'UPDATE DIVISI',   bg: '#fefce8', border: '#fde68a' },
                       'update_topik'   : { icon: 'fa-tags',       color: '#92400e', label: 'UPDATE TOPIK',    bg: '#fefce8', border: '#fde68a' },
                       'update_karyawan': { icon: 'fa-id-badge',   color: '#92400e', label: 'UPDATE KARYAWAN', bg: '#fefce8', border: '#fde68a' },
                       'view_note'      : { icon: 'fa-eye',        color: '#7c3aed', label: 'VIEW NOTE',       bg: '#fdf4ff', border: '#e9d5ff' },
                       'input_note'     : { icon: 'fa-pen',        color: '#7c3aed', label: 'INPUT NOTE',      bg: '#fdf4ff', border: '#e9d5ff' },
                       'update_note'    : { icon: 'fa-pencil-alt', color: '#7c3aed', label: 'UPDATE NOTE',     bg: '#fdf4ff', border: '#e9d5ff' },
                       'delete_note'    : { icon: 'fa-trash',      color: '#7c3aed', label: 'DELETE NOTE',     bg: '#fdf4ff', border: '#e9d5ff' },
                   };
                   const meta = LABEL_MAP[keyName] || { icon:'fa-key', color:'#333', label: keyName.toUpperCase().replace(/_/g,' '), bg:'#fff', border:'#ccc' };

                   const tokoCheckboxes = tokoList.map(toko => {
                       const checked = allSelected || (Array.isArray(savedScope) && savedScope.includes(toko));
                       return `<label style="display:flex;align-items:center;gap:4px;font-size:0.75rem;background:#fff;border:1px solid #ddd;padding:3px 8px;border-radius:3px;cursor:pointer;white-space:nowrap;">
                           <input type="checkbox" class="scope-toko-check" data-key="${keyName}" value="${toko}" ${checked?'checked':''} style="width:13px;height:13px;">
                           ${toko}
                       </label>`;
                   }).join('');

                   const allCheckedNow = allSelected;

                   return `
                   <div style="background:${meta.bg};border:1px solid ${meta.border};border-radius:6px;padding:10px 12px;margin-bottom:8px;">
                       <div style="display:flex;align-items:center;gap:10px;">
                           <input type="checkbox" id="check_${keyName}" class="key-check"
                               value="${keyName}" ${isChecked?'checked':''}
                               style="width:16px;height:16px;cursor:pointer;flex-shrink:0;"
                               onchange="onFlexKeyToggle(this)">
                           <label for="check_${keyName}" style="font-weight:bold;font-size:0.85rem;cursor:pointer;flex:1;">
                               <i class="fas ${meta.icon}" style="color:${meta.color};margin-right:5px;"></i>${meta.label}
                           </label>
                       </div>
                       <div id="scope_${keyName}" class="flex-scope-box"
                           style="display:${isChecked?'block':'none'};margin-top:8px;padding:8px;background:rgba(255,255,255,0.7);border:1px solid ${meta.border};border-radius:4px;">
                           <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                               <span style="font-size:0.72rem;font-weight:bold;color:#555;">SCOPE TOKO:</span>
                               <button type="button" onclick="toggleAllScopeToko('${keyName}', this)"
                                   style="font-size:0.65rem;padding:2px 8px;border:1px solid #aaa;background:#fff;border-radius:3px;cursor:pointer;">
                                   ${allCheckedNow ? 'DESELECT ALL' : 'SELECT ALL'}
                               </button>
                           </div>
                           <div style="display:flex;flex-wrap:wrap;gap:5px;">
                               ${tokoCheckboxes}
                           </div>
                       </div>
                   </div>`;
               }).join('');

                   return updateTokoHTML + manageUserHTML + scopeHTML;
               })()}
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

       // Init custom dropdowns setelah HTML di-render
       initCustomSelects();

       // Event Listeners for Permission UI
       if (activeMasterKey === 'USER ROLE') {
           // SELECT ALL / CLEAR ALL
           document.getElementById('selectAllKeys')?.addEventListener('click', () => {
               document.querySelectorAll('.key-check').forEach(cb => {
                   cb.checked = true;
                   onFlexKeyToggle(cb);
               });
           });
           document.getElementById('deselectAllKeys')?.addEventListener('click', () => {
               document.querySelectorAll('.key-check').forEach(cb => {
                   cb.checked = false;
                   onFlexKeyToggle(cb);
               });
           });
       }
   
       formMaster.onsubmit = (e) => {
           e.preventDefault();
           saveMasterData();
       };
       
   }

   // Toggle tampilan scope box saat checkbox key di-toggle
   window.onFlexKeyToggle = function(cb) {
       const keyName  = cb.value;
       const scopeBox = document.getElementById('scope_' + keyName);
       if (scopeBox) scopeBox.style.display = cb.checked ? 'block' : 'none';
   };

   // Toggle semua scope toko checkbox
   window.toggleAllScopeToko = function(keyName, btn) {
       const checkboxes = document.querySelectorAll(`.scope-toko-check[data-key="${keyName}"]`);
       // Cek apakah semua sudah checked
       const allChecked = Array.from(checkboxes).every(c => c.checked);
       checkboxes.forEach(c => c.checked = !allChecked);
       btn.textContent = !allChecked ? 'DESELECT ALL' : 'SELECT ALL';
   };

   // Toggle datetime input untuk expiration date
   window.toggleExpiryInput = function(keyName, show) {
       const input = document.getElementById('expiry_input_' + keyName);
       if (input) input.style.display = show ? 'block' : 'none';
   };
   
   /* --------------------------------------------------------------------------
      7. CRUD FUNCTIONS
      -------------------------------------------------------------------------- */
   
      window.openMasterModal = async function (id = null) {
        if (!activeMasterKey) {
            showNotification('error', 'Pilih master yang akan diedit/ditambahkan.');
            return;
        }

        // FLEX ROLE: cek permission sebelum buka modal
        const _permKey = TAB_PERM_MAP[activeMasterKey];
        const _action  = activeMasterKey === 'USER ROLE' ? 'mengelola user role' : 'mengelola ' + activeMasterKey.toLowerCase();
        if (_permKey && !checkMasterPerm(_permKey, _action)) return;
    
        const masterConfig = masterDataMap[activeMasterKey];
        currentMasterEditId = id;
    
        await loadMasterTokoOptions();
        await loadMasterDivisiOptions();
    
        modalTitle.textContent = id
            ? `EDIT ${masterConfig.title}`
            : masterConfig.action;
    
        let dataToEdit = null;
    
        if (id !== null) { 
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
        }
    
        // 🔹 Render form dulu (WAJIB)
        renderModalForm(dataToEdit);
    
        // Flex role UI: checkbox & scope sudah di-apply langsung di renderModalForm
        // applyRolePermissions tidak dipanggil lagi untuk USER ROLE agar tidak override keyValues
    
        if (masterModal) masterModal.style.display = 'flex';
    };    

    function applyRolePermissions(permissionString = '') {
        // Dengan flex role UI baru, checkbox sudah di-apply langsung di renderModalForm
        // Fungsi ini dipertahankan sebagai fallback untuk kompatibilitas
        const roleKeys = permissionString.split(',').map(k => k.trim().toLowerCase());
        document.querySelectorAll('.key-check').forEach(cb => {
            const wasChecked = cb.checked;
            cb.checked = roleKeys.includes(cb.value.trim().toLowerCase());
            // Sync scope visibility
            if (cb.checked !== wasChecked) onFlexKeyToggle(cb);
        });
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

       // Filter tabel rows (desktop)
       const rows = masterTableBody.querySelectorAll('tr');
       let visibleCount = 0;
   
       rows.forEach(row => {
           if (row.querySelector('td[colspan]')) return;
           const text = row.innerText.toLowerCase();
           const visible = searchTerm === "" || text.includes(searchTerm);
           row.style.display = visible ? "" : "none";
           if (visible) visibleCount++;
       });
   
       const emptyRow = masterTableBody.querySelector('.empty-row');
       if (emptyRow) {
           emptyRow.style.display = visibleCount === 0 ? "" : "none";
       }

       // Filter accordion items (mobile)
       const accordionItems = document.querySelectorAll('.mobile-accordion-container .accordion-item');
       let accordionVisible = 0;
       accordionItems.forEach(item => {
           const text = item.innerText.toLowerCase();
           const visible = searchTerm === "" || text.includes(searchTerm);
           item.style.display = visible ? "" : "none";
           if (visible) accordionVisible++;
       });

       // Update empty state di mobile
       const mobileContainer = document.querySelector('.mobile-accordion-container');
       if (mobileContainer) {
           let emptyMsg = mobileContainer.querySelector('.mobile-empty-search');
           if (accordionVisible === 0 && accordionItems.length > 0) {
               if (!emptyMsg) {
                   emptyMsg = document.createElement('div');
                   emptyMsg.className = 'mobile-empty-search';
                   emptyMsg.style.cssText = 'text-align:center;padding:30px;color:var(--muted);font-size:0.9rem;';
                   emptyMsg.innerHTML = '<i class="fas fa-search" style="font-size:2rem;margin-bottom:10px;display:block;opacity:0.4;"></i>Tidak ada data ditemukan';
                   mobileContainer.appendChild(emptyMsg);
               }
               emptyMsg.style.display = '';
           } else if (emptyMsg) {
               emptyMsg.style.display = 'none';
           }
       }
   }
   
   function switchMasterTab(key) {
       activeMasterKey = key.toUpperCase();
       const targetType = key.toLowerCase().replace(' ', '-');

       // Destroy dulu sebelum apapun diubah
       destroyMobileAccordion();
       if ($.fn.DataTable.isDataTable('#master-table-all')) {
           $('#master-table-all').DataTable().destroy();
       }

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

           // FLEX ROLE: Tampilkan/sembunyikan tombol ADD sesuai permission tab aktif
           const addBtn = document.getElementById('btnAddMaster');
           if (addBtn && typeof masterPerms !== 'undefined') {
               const permKey = TAB_PERM_MAP[activeMasterKey];
               const hasPerm = !permKey || masterPerms[permKey];
               addBtn.style.display = hasPerm ? '' : 'none';
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
        destroyMobileAccordion();
        
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
                    <span class="action-cell">
                        <span class="edit-btn" onclick="editToko(${row.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </span>
                        <span class="delete-btn" onclick="deleteToko(${row.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </span>
                    </span>
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
                initMobileIfNeeded();
            }
        });

    } catch (err) {
        console.error(err);
        showNotification("error", "Gagal connect ke server");
    }
}
   
   async function deleteToko(id) {
       if (!checkMasterPerm('update_toko', 'menghapus toko')) return;
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
       if (!checkMasterPerm('update_toko', 'menyimpan toko')) return;
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
           destroyMobileAccordion();
           
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
                       <span class="action-cell">
                           ${(typeof masterPerms !== 'undefined' && masterPerms.update_divisi) ? `
                           <span class="edit-btn" onclick="editDivisi(${row.id})" title="Edit">
                               <i class="fas fa-edit"></i>
                           </span>
                           <span class="delete-btn" onclick="deleteDivisi(${row.id})" title="Delete">
                               <i class="fas fa-trash"></i>
                           </span>` : '<span style="color:#ccc;font-size:0.8rem;">-</span>'}
                       </span>
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
                    initMobileIfNeeded();
                }
           });
   
       } catch (err) {
           console.error("Load divisi error:", err);
           showNotification("error", "Gagal mengambil data divisi");
       }
   }
   
   async function deleteDivisi(id) {
       if (!checkMasterPerm('update_divisi', 'menghapus divisi')) return;
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
       if (!checkMasterPerm('update_divisi', 'menyimpan divisi')) return;
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
            await loadMasterDivisiOptions()
            if ($.fn.DataTable.isDataTable('#master-table-all')) {
               $('#master-table-all').DataTable().destroy();
            }
           destroyMobileAccordion();
           
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
               const tr = document.createElement('tr');
               tr.className = 'master-row';
               tr.dataset.type = 'topik';
               tr.innerHTML = `
                   <td>${i + 1}</td>
                   <td>${row.created_at ? row.created_at.split(' ')[0] : '-'}</td>
                   <td>${row.username ?? '-'}</td>
                   <td>${row.nama_topik ?? '-'}</td>
                   <td>${row.nama_toko ?? '-'}</td>
                   <td>${row.nama_divisi ?? '-'}</td>
                   <td class="action-cell">
                       <span class="action-cell">
                           ${(typeof masterPerms !== 'undefined' && masterPerms.update_topik) ? `
                           <span class="edit-btn" onclick="editTopik(${row.id})" title="Edit">
                               <i class="fas fa-edit"></i>
                           </span>
                           <span class="delete-btn" onclick="deleteTopik(${row.id})" title="Delete">
                               <i class="fas fa-trash"></i>
                           </span>` : '<span style="color:#ccc;font-size:0.8rem;">-</span>'}
                       </span>
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
                    initMobileIfNeeded();
                }
           });
       } catch (err) {
           console.error("Load master topik gagal:", err);
           showNotification("error", "Gagal load data topik");
       }
   }
   
   async function deleteTopik(id) {
       if (!checkMasterPerm('update_topik', 'menghapus topik')) return;
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
    if (!checkMasterPerm('update_topik', 'menyimpan topik')) return;
    try {
        const namaTopik = document.getElementById('modalInput-nama_topik')?.value.trim();
        const tokoNama  = document.getElementById('modalInput-toko_id')?.value;
        const divisiId  = document.getElementById('modalInput-divisi_id')?.value;

        console.log("[saveTopik] namaTopik:", namaTopik, "| tokoNama:", tokoNama, "| divisiId:", divisiId);

        if (!namaTopik || !tokoNama || !divisiId) {
            showNotification('error', 'Nama topik, toko, dan divisi wajib diisi');
            return;
        }

        const fd = new FormData();
        fd.append("nama_topik", namaTopik);
        fd.append("toko_nama", tokoNama);  // nama toko (string) - PHP simpan langsung ke varchar toko_id
        fd.append("divisi_id", divisiId);  // nama divisi (string) - PHP simpan langsung ke varchar divisi_id
        // Kirim user_id dari session PHP (diembed via inline script di master.php)
        if (typeof currentUserId !== 'undefined' && currentUserId) {
            fd.append("user_id", currentUserId);
        }

        let url = "api/get_master_topik.php?action=add";
        if (id) {
            url = "api/get_master_topik.php?action=edit";
            fd.append("id", id);
        }

        const res = await fetch(url, { method: "POST", body: fd });
        const json = await res.json();
        console.log("[saveTopik] server response:", json);

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
           destroyMobileAccordion();
           
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
                       <span class="action-cell">
                           ${(typeof masterPerms !== 'undefined' && masterPerms.update_karyawan) ? `
                           <span class="edit-btn" onclick="editKaryawan(${row.id})" title="Edit">
                               <i class="fas fa-edit"></i>
                           </span>
                           <span class="delete-btn" onclick="deleteKaryawan(${row.id})" title="Delete">
                               <i class="fas fa-trash"></i>
                           </span>` : '<span style="color:#ccc;font-size:0.8rem;">-</span>'}
                       </span>
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
                    initMobileIfNeeded();
                }
           });
   
       } catch (err) {
           console.error("Load karyawan error:", err);
           showNotification("error", "Gagal mengambil data karyawan");
       }
   }
   
   async function deleteKaryawan(id) {
       if (!checkMasterPerm('update_karyawan', 'menghapus karyawan')) return;
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
       if (!checkMasterPerm('update_karyawan', 'menyimpan karyawan')) return;
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
               const listKeys = permissions.split(',').map(key => key.trim().toLowerCase()).filter(key => key);
               return {
                   id        : json.data.id,
                   namaRole  : json.data.role_name,
                   listKeys  : listKeys,
                   keyValues : json.data.key_values || {},   // { key_name: {bool, string, datetime} }
                   tglDibuat : json.data.created_at,
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
           destroyMobileAccordion();
           
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
                       <span class="action-cell">
                           <span class="edit-btn" onclick="editRole(${row.id})" title="Edit">
                               <i class="fas fa-edit"></i>
                           </span>
                           <span class="delete-btn" onclick="deleteRole(${row.id})" title="Delete">
                               <i class="fas fa-trash"></i>
                           </span>
                       </span>
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
                    initMobileIfNeeded();
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

            // ── Kumpulkan keys yang dicentang (deduplikasi) ──
            const selectedKeys = [];
            const seenKeys     = new Set();

            document.querySelectorAll('.key-check:checked').forEach(cb => {
                const keyName = cb.value.trim().toLowerCase();
                if (seenKeys.has(keyName)) return;
                seenKeys.add(keyName);
                selectedKeys.push({ key: cb.value.trim(), value: '' });
            });

            if (selectedKeys.length === 0) {
                showNotification('error', 'Pilih minimal satu permission');
                return;
            }

            // ── Kumpulkan key_values (scope toko, bool, datetime) ──
            // Format: { key_name: { bool, string, datetime } }
            const keyValues = {};

            // Keys dengan scope toko (multi-checkbox)
            // manage_user: boolean only → kirim bool:1, tidak ada scope toko
            if (seenKeys.has('manage_user')) {
                keyValues['manage_user'] = { bool: 1 };
            }

            const scopeKeys = [
                'update_role','update_divisi',
                'update_topik','update_karyawan',
                'view_note','input_note','update_note','delete_note'
            ];
            scopeKeys.forEach(keyName => {
                if (!seenKeys.has(keyName)) return;
                const checkboxes = document.querySelectorAll(`.scope-toko-check[data-key="${keyName}"]`);
                const total   = checkboxes.length;
                const checked = Array.from(checkboxes).filter(c => c.checked);

                let strVal;
                if (total === 0) {
                    // Tidak ada checkbox toko tersedia di sistem → simpan '' (PHP skip = NULL)
                    strVal = '';
                } else {
                    // Selalu simpan array eksplisit toko yang dipilih
                    // (baik sebagian maupun semua) agar DB punya data scope yang jelas
                    strVal = JSON.stringify(checked.map(c => c.value));
                }
                keyValues[keyName] = { string: strVal }; // scope-only key, tidak pakai bool
            });

            // update_toko → boolean=1 + scope toko (string array)
            if (seenKeys.has('update_toko')) {
                const tokoChecks  = document.querySelectorAll('.scope-toko-check[data-key="update_toko"]');
                const tokoChecked = Array.from(tokoChecks).filter(c => c.checked);
                // Selalu simpan array eksplisit toko yang dipilih
                // Hanya '' jika memang tidak ada toko sama sekali di sistem
                const scopeStr = tokoChecks.length === 0
                    ? ''
                    : JSON.stringify(tokoChecked.map(c => c.value));
                keyValues['update_toko'] = { bool: 1, string: scopeStr };
            }

            // DEBUG: tampilkan di console apa yang akan dikirim
            console.log('[saveUserRole] selectedKeys:', selectedKeys);
            console.log('[saveUserRole] keyValues:', JSON.stringify(keyValues, null, 2));
            console.log('[saveUserRole] scope checkboxes found:', 
                Object.fromEntries(
                    ['update_role','update_divisi','update_topik',
                     'update_karyawan','view_note','input_note','update_note','delete_note']
                    .map(k => [k, document.querySelectorAll(`.scope-toko-check[data-key="${k}"]`).length])
                )
            );

            const fd = new FormData();
            fd.append('role_name', namaRole);
            fd.append('keys',       JSON.stringify(selectedKeys));
            fd.append('key_values', JSON.stringify(keyValues));
            if (typeof currentUserId !== 'undefined' && currentUserId) {
                fd.append('user_id', currentUserId);
            }

            let url = 'api/get_user_role.php?action=add';
            if (currentMasterEditId) {
                url = 'api/get_user_role.php?action=edit';
                fd.append('id', currentMasterEditId);
            }

            const res  = await fetch(url, { method: 'POST', body: fd });
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
      MOBILE ACCORDION - Sama persis seperti home.js
      -------------------------------------------------------------------------- */

   function initMobileAccordion() {
       const tableWrap = document.querySelector('.table-wrap');
       const table = tableWrap?.querySelector('table');
       const tbody = table?.querySelector('tbody');

       if (!tableWrap || !table || !tbody) return;

       table.style.display = 'none';

       // Sembunyikan info & paginate DataTables bawaan di mobile
       const dtWrapper = document.querySelector('.dataTables_wrapper');
       if (dtWrapper) {
           const dtInfo     = dtWrapper.querySelector('.dataTables_info');
           const dtPaginate = dtWrapper.querySelector('.dataTables_paginate');
           if (dtInfo)     dtInfo.style.display     = 'none';
           if (dtPaginate) dtPaginate.style.display  = 'none';
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
           renderMobileFooter(accordionContainer, null);
           return;
       }

       const headers = Array.from(table.querySelectorAll('th')).map(th =>
           th.textContent.trim()
       );

       rows.forEach((row, index) => {
           const cells = Array.from(row.querySelectorAll('td'));
           const rowData = {};
           cells.forEach((cell, i) => {
               if (headers[i]) rowData[headers[i]] = cell.innerHTML;
           });

           const item = createAccordionItem(index + 1, rowData);

           Object.keys(row.dataset).forEach(key => {
               item.dataset[key] = row.dataset[key];
           });

           accordionContainer.appendChild(item);
       });

       // Render info & pagination di bawah accordion
       try {
           const dtApi = $('#master-table-all').DataTable();
           const pageInfo = dtApi.page.info();
           renderMobileFooter(accordionContainer, pageInfo);
       } catch(e) {
           renderMobileFooter(accordionContainer, null);
       }
   }

   function renderMobileFooter(container, pageInfo) {
       const old = container.parentNode.querySelector('.mobile-dt-footer');
       if (old) old.remove();

       if (!pageInfo || pageInfo.recordsTotal === 0) return;

       const start  = pageInfo.start + 1;
       const end    = pageInfo.end;
       const total  = pageInfo.recordsTotal;
       const page   = pageInfo.page;
       const pages  = pageInfo.pages;

       const footer = document.createElement('div');
       footer.className = 'mobile-dt-footer';

       const info = document.createElement('div');
       info.className = 'mobile-dt-info';
       info.textContent = `Showing ${start} to ${end} of ${total} entries`;

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

   function createAccordionItem(rowNumber, rowData) {
       const item = document.createElement('div');
       item.className = 'accordion-item';

       const values = Object.values(rowData);
       const keys   = Object.keys(rowData);

       // Header: TGL DIBUAT (index 1) sebagai judul, DIBUAT OLEH (index 2) sebagai subtitle
       const tanggal = values[1] || '-';
       const inputer = values[2] || '';

       let dataGridHTML = '<div class="accordion-data-grid">';
       keys.forEach((label, index) => {
           if (index === 0) return;               // skip NO
           if (index === keys.length - 1) return; // skip ACTION
           dataGridHTML += `
               <div class="data-row">
                   <span class="data-label">${label}</span>
                   <span class="data-value">${values[index]}</span>
               </div>
           `;
       });
       dataGridHTML += '</div>';

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

   function destroyMobileAccordion() {
       const tableWrap = document.querySelector('.table-wrap');
       const table = tableWrap?.querySelector('table');
       const accordionContainer = tableWrap?.querySelector('.mobile-accordion-container');
       const footer = tableWrap?.parentNode?.querySelector('.mobile-dt-footer')
           || tableWrap?.querySelector('.mobile-dt-footer');

       if (table) table.style.display = '';
       if (accordionContainer) accordionContainer.style.display = 'none';
       if (footer) footer.remove();

       // Kembalikan DataTables info & paginate
       const dtWrapper = document.querySelector('.dataTables_wrapper');
       if (dtWrapper) {
           const dtInfo     = dtWrapper.querySelector('.dataTables_info');
           const dtPaginate = dtWrapper.querySelector('.dataTables_paginate');
           if (dtInfo)     dtInfo.style.display     = '';
           if (dtPaginate) dtPaginate.style.display  = '';
       }
   }

   // Accordion toggle event
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

   // Trigger accordion setelah DataTable selesai init (dipanggil dari setiap loadMasterXxx)
   function initMobileIfNeeded() {
       if (window.innerWidth <= 768) {
           setTimeout(initMobileAccordion, 100);
       }
   }

   window.addEventListener('resize', function () {
       if (window.innerWidth <= 768) {
           initMobileAccordion();
       } else {
           destroyMobileAccordion();
       }
   });

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
                       loadAvailableKeys().then(() => loadRoleTable());
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