<?php 
$pageTitle = 'Master'; 
$cssFile = 'master.css'; 
$jsFile = 'master.js';
include 'modules/header.php'; 
?>

<div class="layout">
    <?php include 'modules/sidebar.php'; ?>
    
    <main>
        <div class="topbar">
            <h1 class="title">MASTER MANAGEMENT</h1>
        </div>

        <div class="master-nav">
            <button class="master-tab active" data-type="toko">TOKO</button>
            <button class="master-tab" data-type="divisi">DIVISI</button>
            <button class="master-tab" data-type="topik">TOPIK</button>
            <button class="master-tab" data-type="karyawan">KARYAWAN</button>
            <button class="master-tab" data-type="user-role">USER ROLE</button>
        </div>

        <div class="master-header">
            <h2 class="section-title">TOKO</h2>
            <button id="btnAddMaster" class="btn-primary">
                <i class="fas fa-plus"></i> ADD TOKO
            </button>
        </div>

        <div class="card table-card">
            <div class="table-actions-bar">
                <input type="text" id="masterSearch" placeholder="SEARCH" class="search-input">
            </div>
            
            <div class="table-wrap">
                <table>
                    <thead id="masterTableHead">
                        <tr>
                            <th>NO</th>
                            <th>TGL DIBUAT</th>
                            <th>DIBUAT OLEH</th>
                            <th>NAMA TOKO</th>
                            <th>ACTION</th>
                        </tr>
                    </thead>
                    <tbody id="masterTableBody"></tbody>
                </table>
            </div>
        </div>

        <div class="table-footer-divider"></div>

        <div class="table-footer">
            <div class="project-name">
                <span>© 2026 Catatan Kepala Toko v1.0.0</span>
            </div>
        </div>
    </main>
</div>

<div class="modal" id="masterModal">
    <div class="modal-box">
        <h3 class="modal-title" id="modal-master-title">TAMBAH MASTER</h3>
        <div class="divider"></div>
        
        <form id="masterForm"></form>
    </div>
</div>

<div class="modal" id="userRoleModal">
    <div class="modal-box">
        <h3 class="modal-title" id="modal-userrole-title">ADD USER ROLE</h3>
        <div class="divider"></div>
        
        <form id="userRoleForm">
            <label for="roleName" class="required-label">NAMA ROLE</label>
            <input type="text" id="roleName" name="roleName" placeholder="Masukkan nama role" required>
            
            <div class="divider" style="margin: 20px 0;"></div>
            
            <div class="permission-section-header">
                <span class="permission-section-title">LIST OF KEYS</span>
                <button type="button" class="select-all-btn" id="selectAllKeys">
                    <i class="fas fa-check-square"></i> Select All
                </button>
            </div>
            
            <div class="user-role-permission-container">
                <div>
                    <label>KEYS</label>
                    <div id="key-list-container">
                        <div class="key-item">
                            <input type="checkbox" id="key_update_toko" name="keys[]" value="UPDATE_TOKO">
                            <label for="key_update_toko">UPDATE TOKO</label>
                        </div>
                        <div class="key-item">
                            <input type="checkbox" id="key_manage_user" name="keys[]" value="MANAGE_USER">
                            <label for="key_manage_user">MANAGE USER</label>
                        </div>
                        <div class="key-item">
                            <input type="checkbox" id="key_update_role" name="keys[]" value="UPDATE_ROLE">
                            <label for="key_update_role">UPDATE ROLE</label>
                        </div>
                        <div class="key-item">
                            <input type="checkbox" id="key_manage_divisi" name="keys[]" value="MANAGE_DIVISI">
                            <label for="key_manage_divisi">MANAGE DIVISI</label>
                        </div>
                        <div class="key-item">
                            <input type="checkbox" id="key_view_report" name="keys[]" value="VIEW_REPORT">
                            <label for="key_view_report">VIEW REPORT</label>
                        </div>
                        <div class="key-item">
                            <input type="checkbox" id="key_manage_catatan" name="keys[]" value="MANAGE_CATATAN">
                            <label for="key_manage_catatan">MANAGE CATATAN</label>
                        </div>
                        <div class="key-item">
                            <input type="checkbox" id="key_manage_topik" name="keys[]" value="MANAGE_TOPIK">
                            <label for="key_manage_topik">MANAGE TOPIK</label>
                        </div>
                        <div class="key-item">
                            <input type="checkbox" id="key_manage_karyawan" name="keys[]" value="MANAGE_KARYAWAN">
                            <label for="key_manage_karyawan">MANAGE KARYAWAN</label>
                        </div>
                    </div>
                </div>
                
                <div>
                    <label>VALUES</label>
                    <div id="value-list-container">
                        <input type="text" class="value-input" id="value_update_toko" 
                               placeholder="Value untuk UPDATE TOKO" data-key="UPDATE_TOKO">
                        <input type="text" class="value-input" id="value_manage_user" 
                               placeholder="Value untuk MANAGE USER" data-key="MANAGE_USER">
                        <input type="text" class="value-input" id="value_update_role" 
                               placeholder="Value untuk UPDATE ROLE" data-key="UPDATE_ROLE">
                        <input type="text" class="value-input" id="value_manage_divisi" 
                               placeholder="Value untuk MANAGE DIVISI" data-key="MANAGE_DIVISI">
                        <input type="text" class="value-input" id="value_view_report" 
                               placeholder="Value untuk VIEW REPORT" data-key="VIEW_REPORT">
                        <input type="text" class="value-input" id="value_manage_catatan" 
                               placeholder="Value untuk MANAGE CATATAN" data-key="MANAGE_CATATAN">
                        <input type="text" class="value-input" id="value_manage_topik" 
                               placeholder="Value untuk MANAGE TOPIK" data-key="MANAGE_TOPIK">
                        <input type="text" class="value-input" id="value_manage_karyawan" 
                               placeholder="Value untuk MANAGE KARYAWAN" data-key="MANAGE_KARYAWAN">
                    </div>
                </div>
            </div>
            
            <div class="modal-actions">
                <button type="button" class="cancel-btn" onclick="closeMasterModal()">BATAL</button>
                <button type="button" class="save-btn" onclick="saveUserRole()">UPDATE</button>
            </div>
        </form>
    </div>
</div>

<?php include 'modules/footer.php'; ?>