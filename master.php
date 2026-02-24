<?php 
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

require_once "direct/config.php";
require_once "direct/app_config.php";

//================================//
// FLEX ROLE - PERMISSION CHECK   //
//================================//
require_once "api/get_flex_role.php";

$_mFlexStmt = $conn->prepare("SELECT role_id FROM users WHERE id = ?");
$_mFlexStmt->execute([$_SESSION['user_id']]);
$_mFlexUser = $_mFlexStmt->fetch(PDO::FETCH_ASSOC);
$flexRole = new FlexRole($conn, $_mFlexUser['role_id'] ?? 0);

$canUpdateToko     = $flexRole->can('update_toko');
$canManageUser     = $flexRole->can('manage_user');
$canUpdateRole     = $flexRole->can('update_role');
$canUpdateDivisi   = $flexRole->can('update_divisi');
$canUpdateTopik    = $flexRole->can('update_topik');
$canUpdateKaryawan = $flexRole->can('update_karyawan');

/* ==============================================
   SECTION 1: DATA RETRIEVAL FROM DATABASE
   ============================================== */

// DATA TOKO - PROBLEM: Tidak ada join dengan users table untuk username
$dataToko = $conn->query("
    SELECT * 
    FROM toko 
    ORDER BY id DESC
")->fetchAll(PDO::FETCH_ASSOC);

// DATA DIVISI - PROBLEM: Nama tabel 'divisi' perlu konsistensi (biasanya 'divisi' bukan 'divisi')
$dataDivisi = $conn->query("
    SELECT d.*, t.nama_toko 
    FROM divisi d 
    LEFT JOIN toko t ON d.toko_id = t.id 
    ORDER BY d.id DESC
")->fetchAll(PDO::FETCH_ASSOC);

// DATA TOPIK - GOOD: Sudah join dengan tabel terkait
$dataTopik = $conn->query("
    SELECT tp.*, t.nama_toko, d.nama_divisi 
    FROM topik tp 
    LEFT JOIN toko t ON tp.toko_id = t.id 
    LEFT JOIN divisi d ON tp.divisi_id = d.id 
    ORDER BY tp.id DESC
")->fetchAll(PDO::FETCH_ASSOC);

// DATA KARYAWAN - PROBLEM: Indentation tidak konsisten
$dataKaryawan = $conn->query("
    SELECT k.*, t.nama_toko, d.nama_divisi 
    FROM karyawan k    
    LEFT JOIN toko t ON k.toko_id = t.id 
    LEFT JOIN divisi d ON k.nama_divisi = d.id 
    ORDER BY k.id DESC
")->fetchAll(PDO::FETCH_ASSOC);

// DATA USER ROLE - join dengan users pakai created_by, handle mixed key format
$dataTransaksi_user_role = $conn->query("
    SELECT 
        r.id, 
        r.role_name, 
        u.username,
        r.created_at,
        GROUP_CONCAT(DISTINCT rk.role_key_name ORDER BY rk.role_key_name SEPARATOR ', ') as permissions
    FROM roles r
    LEFT JOIN users u ON r.created_by = u.id
    LEFT JOIN (
        SELECT DISTINCT role_id, role_key_name FROM transaksi_user_role
    ) tur ON r.id = tur.role_id
    LEFT JOIN role_key rk ON (
        tur.role_key_name = CAST(rk.id AS CHAR)
        OR tur.role_key_name = rk.role_key_name
    ) AND rk.id >= 3
    GROUP BY r.id, r.role_name, u.username, r.created_at
    ORDER BY r.id ASC 
")->fetchAll(PDO::FETCH_ASSOC);

/* ==============================================
   SECTION 2: PAGE CONFIGURATION
   ============================================== */
$pageTitle = 'Master'; 
$cssFile = 'master.css'; 
$jsFile = 'master.js';
include 'modules/header.php'; 

// Ambil user info dari session PHP untuk dikirim ke JS
$sessionUsername = $_SESSION['username'] ?? $_SESSION['nama'] ?? $_SESSION['user_name'] ?? 'ADMIN';
$sessionUserId   = (int)($_SESSION['user_id'] ?? $_SESSION['id'] ?? 0);
?>
<script>
    const currentUsername = <?= json_encode(strtoupper($sessionUsername)) ?>;
    const currentUserId   = <?= json_encode($sessionUserId) ?>;
    // Inject data toko dari PHP langsung agar masterTokoOptions selalu terisi
    // sebelum modal USER ROLE dirender (tidak perlu fetch API lagi)
    // Deduplikasi nama_toko agar tidak double (e.g. PT. TOYO MATSU 2x)
    const serverTokoOptions = <?= (function() use ($dataToko) {
        $unique = [];
        $seen   = [];
        foreach ($dataToko as $t) {
            if (!in_array($t['nama_toko'], $seen)) {
                $seen[]   = $t['nama_toko'];
                $unique[] = ['id' => $t['nama_toko'], 'nama_toko' => $t['nama_toko']];
            }
        }
        return json_encode($unique);
    })() ?>;
</script>

<!-- ==============================================
     SECTION 3: MAIN LAYOUT
     ============================================== -->
<div class="layout">
    <?php include 'modules/sidebar.php'; ?>
    
    <main>
        <!-- TOP BAR -->
        <div class="topbar">
            <h1 class="title">MASTER MANAGEMENT</h1>
        </div>

        <!-- NAVIGATION TABS -->
        <div class="master-nav">
            <button class="master-tab" data-type="toko" data-perm="update_toko">TOKO</button>
            <button class="master-tab" data-type="divisi" data-perm="update_divisi">DIVISI</button>
            <button class="master-tab" data-type="topik" data-perm="update_topik">TOPIK</button>
            <button class="master-tab" data-type="karyawan" data-perm="update_karyawan">KARYAWAN</button>
            <button class="master-tab" data-type="user-role" data-perm="update_role">USER ROLE</button>
        </div>

        <!-- TABLE HEADER -->
        <div class="master-header">
            <h2 class="section-title">TOKO</h2>
            <button id="btnAddMaster" class="btn-primary" 
                data-perm-toko="<?= $canUpdateToko ? '1' : '0' ?>"
                data-perm-divisi="<?= $canUpdateDivisi ? '1' : '0' ?>"
                data-perm-topik="<?= $canUpdateTopik ? '1' : '0' ?>"
                data-perm-karyawan="<?= $canUpdateKaryawan ? '1' : '0' ?>"
                data-perm-user-role="<?= $canUpdateRole ? '1' : '0' ?>"
                style="<?= !$canUpdateToko ? 'display:none;' : '' ?>">
                <i class="fas fa-plus"></i> ADD TOKO
            </button>
        </div>

        <!-- MAIN TABLE -->
        <div class="card table-card">
            <!-- SEARCH BAR -->
            <div class="table-actions-bar">
                <input type="text" id="masterSearch" placeholder="SEARCH" class="search-input">
            </div>
            
            <!-- TABLE CONTAINER -->
            <div class="table-wrap">
                <table id="master-table-all">
                    <thead id="masterTableHead">
                        <tr>
                            <th>NO</th>
                            <th>TGL DIBUAT</th>
                            <th>DIBUAT OLEH</th>
                            <th>NAMA TOKO</th>
                            <th>KODE</th>
                            <th>ACTION</th>
                        </tr>
                    </thead>
                    <tbody id="masterTableBody">
                        <!-- ==============================================
                             SUBSECTION 3.1: TOKO DATA
                             PROBLEM: Kolom 'KODE' seharusnya 'LOKASI' berdasarkan header
                             ============================================== -->
                        <?php if(count($dataToko) > 0): ?>
                            <?php $no = 1; foreach($dataToko as $row): ?>   
                                <tr class="master-row" data-type="toko">
                                    <td><?= $no++ ?></td>
                                    <td><?= ($row['created_at']) ? date('Y-m-d', strtotime($row['created_at'])) : '-' ?></td>
                                    <td><?= htmlspecialchars($row['username'] ?? '-') ?></td>    
                                    <td><?= htmlspecialchars($row['nama_toko']) ?></td>
                                    <td><?= htmlspecialchars($row['lokasi']) ?></td>
                                    <td><span class="badge"><?= htmlspecialchars($row['kode']) ?></span></td>
                                    <td class="action-cell">
                                        <div class="action-buttons-container">
                                            <?php if ($canUpdateToko): ?>
                                            <button class="action-btn edit-btn" onclick="editToko(<?= $row['id'] ?>)" title="Edit">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="action-btn delete-btn" onclick="deleteToko(<?= $row['id'] ?>)" title="Hapus">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                            <?php else: ?><span style="color:#ccc;font-size:0.8rem;padding:4px;">-</span><?php endif; ?>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <tr><td colspan="6" style="text-align:center;">Data toko tidak ditemukan.</td></tr>
                        <?php endif;?>

                        <!-- ==============================================
                             SUBSECTION 3.2: DIVISI DATA (DISABLED)
                             NOTE: Data divisi di-load via JavaScript API
                             ============================================== -->
                        <?php if(count($dataDivisi) > 0): ?>
                            <?php $no = 1; foreach($dataDivisi as $row): ?>
                                <tr class="master-row" data-type="divisi">
                                    <!-- DATA DIVISI DI-LOAD DARI API VIA JS -->
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>

                        <!-- ==============================================
                             SUBSECTION 3.3: TOPIK DATA
                             ============================================== -->
                        <?php if(count($dataTopik) > 0): ?>
                            <?php $no = 1; foreach($dataTopik as $row): ?>
                                <tr class="master-row" data-type="topik">
                                    <td><?= $no++ ?></td>
                                    <td><?= $row['created_at'] ? date('Y-m-d', strtotime($row['created_at'])) : '-' ?></td>
                                    <td><?= $row['username'] ?? '-' ?></td>
                                    <td><?= htmlspecialchars($row['nama_topik']) ?></td>
                                    <td><?= htmlspecialchars($row['nama_toko']) ?></td>
                                    <td><?= htmlspecialchars($row['nama_divisi']) ?></td>
                                    <td class="action-cell">
                                        <div class="action-buttons-container">
                                            <?php if ($canUpdateTopik): ?>
                                            <button class="action-btn edit-btn" onclick="editTopik(<?= $row['id'] ?>)" title="Edit">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="action-btn delete-btn" onclick="deleteTopik(<?= $row['id'] ?>)" title="Hapus">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                            <?php else: ?><span style="color:#ccc;font-size:0.8rem;padding:4px;">-</span><?php endif; ?>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>

                        <!-- ==============================================
                             SUBSECTION 3.4: KARYAWAN DATA (DISABLED)
                             NOTE: Data karyawan di-load via JavaScript API
                             ============================================== -->
                        <?php if(count($dataKaryawan) > 0): ?>
                            <?php $no = 1; foreach($dataKaryawan as $row): ?>
                                <tr class="master-row" data-type="karyawan">
                                    <!-- DATA KARYAWAN DI-LOAD DARI API VIA JS -->
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>

                        <!-- ==============================================
                             SUBSECTION 3.5: USER ROLE DATA
                             PROBLEM: created_by bukan username, perlu join dengan users
                             ============================================== -->
                        <?php if(count($dataTransaksi_user_role) > 0): ?>
                            <?php $no = 1; foreach($dataTransaksi_user_role as $row): ?>
                                <tr class="master-row" data-type="user-role">
                                    <td><?= $no++ ?></td>
                                    <td><?= (!empty($row['created_at']) && $row['created_at'] != '0000-00-00 00:00:00') ? date('Y-m-d', strtotime($row['created_at'])) : '-' ?></td>
                                    <td><?= htmlspecialchars($row['username'] ?? '-') ?></td>
                                    <td><?= htmlspecialchars($row['role_name']) ?></td>
                                    <td>
                                        <span style="font-size: 0.85rem; color: #666;">
                                            <?= !empty($row['permissions']) ? htmlspecialchars($row['permissions']) : '<i style="color: #ccc;">Tidak ada akses</i>' ?>
                                        </span>
                                    </td>
                                    <td class="action-cell">
                                        <div class="action-buttons-container">
                                            <?php if ($canUpdateRole): ?>
                                            <button class="action-btn edit-btn" onclick="editRole(<?= $row['id'] ?>)" title="Edit">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="action-btn delete-btn" onclick="deleteRole(<?= $row['id'] ?>)" title="Hapus">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                            <?php else: ?><span style="color:#ccc;font-size:0.8rem;padding:4px;">-</span><?php endif; ?>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?> 
                    </tbody>
                </table>
            </div>
        </div>

        <!-- FOOTER SECTION -->
        <div class="table-footer-divider"></div>
        <div class="table-footer">
            <div class="project-name">
                <span><?= APP_FOOTER_TEXT ?></span>
            </div>
        </div>
    </main>
</div>

<!-- ==============================================
     SECTION 4: MASTER MODAL (UNTUK TOKO, DIVISI, TOPIK, KARYAWAN)
     ============================================== -->
<div class="modal" id="masterModal">
    <div class="modal-box">
        <h3 class="modal-title" id="modal-master-title">TAMBAH MASTER</h3>
        <div class="divider"></div>
        <form id="masterForm"></form>       
    </div>
</div>

<!-- ==============================================
     SECTION 5: USER ROLE MODAL (SPECIAL MODAL)
     PROBLEM: Modal ini tidak digunakan karena user role 
     menggunakan modal master umum (masterModal)
     ============================================== -->
<div class="modal" id="userRoleModal">
    <div class="modal-box">
        <h3 class="modal-title" id="modal-userrole-title">ADD USER ROLE</h3>
        <div class="divider"></div>
        
        <form id="userRoleForm">
            <label for="roleName" class="required-label">NAMA ROLE</label>
            <input type="text" id="roleName" value="testt" name="roleName" placeholder="Masukkan nama role" required>
            
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
                            <input type="checkbox" id="key_update_toko" class="key-check" name="keys[]" value="UPDATE_TOKO">
                            <label for="key_update_toko">UPDATE TOKO</label>
                        </div>
                        <div class="key-item">
                            <input type="checkbox" id="key_manage_user" class="key-check" name="keys[]" value="MANAGE_USER">
                            <label for="key_manage_user">MANAGE USER</label>
                        </div>
                        <div class="key-item">
                            <input type="checkbox" id="key_update_role" class="key-check" name="keys[]" value="UPDATE_ROLE">
                            <label for="key_update_role">UPDATE ROLE</label>
                        </div>
                        <div class="key-item">
                            <input type="checkbox" id="key_manage_divisi" class="key-check" name="keys[]" value="MANAGE_DIVISI">
                            <label for="key_manage_divisi">MANAGE DIVISI</label>
                        </div>
                        <div class="key-item">
                            <input type="checkbox" id="key_view_report" class="key-check" name="keys[]" value="VIEW_REPORT">
                            <label for="key_view_report">VIEW REPORT</label>
                        </div>
                        <div class="key-item">
                            <input type="checkbox" id="key_manage_catatan" class="key-check" name="keys[]" value="MANAGE_CATATAN">
                            <label for="key_manage_catatan">MANAGE CATATAN</label>
                        </div>
                        <div class="key-item">
                            <input type="checkbox" id="key_manage_topik" class="key-check" name="keys[]" value="MANAGE_TOPIK">
                            <label for="key_manage_topik">MANAGE TOPIK</label>
                        </div>
                        <div class="key-item">
                            <input type="checkbox" id="key_manage_karyawan" class="key-check" name="keys[]" value="MANAGE_KARYAWAN">
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

<script>
// ================================================================
// FLEX ROLE: Permission flags untuk master.js
// ================================================================
const masterPerms = {
    update_toko:     <?= $canUpdateToko     ? 'true' : 'false' ?>,
    manage_user:     <?= $canManageUser     ? 'true' : 'false' ?>,
    update_role:     <?= $canUpdateRole     ? 'true' : 'false' ?>,
    update_divisi:   <?= $canUpdateDivisi   ? 'true' : 'false' ?>,
    update_topik:    <?= $canUpdateTopik    ? 'true' : 'false' ?>,
    update_karyawan: <?= $canUpdateKaryawan ? 'true' : 'false' ?>
};

// Mapping tab label → permission key
const TAB_PERM_MAP = {
    'TOKO':      'update_toko',
    'DIVISI':    'update_divisi',
    'TOPIK':     'update_topik',
    'KARYAWAN':  'update_karyawan',
    'USER ROLE': 'update_role'
};

function checkMasterPerm(permKey, action) {
    if (typeof masterPerms === 'undefined') return true;
    if (!masterPerms[permKey]) {
        showMasterAccessDenied('Anda tidak memiliki akses untuk ' + action + '.');
        return false;
    }
    return true;
}

function showMasterAccessDenied(message) {
    const old = document.getElementById('masterAccessDeniedPopup');
    if (old) old.remove();
    const popup = document.createElement('div');
    popup.id = 'masterAccessDeniedPopup';
    popup.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center;';
    popup.innerHTML = `<div style="background:#fff;border-radius:12px;padding:32px 28px;max-width:380px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.2);">
        <div style="font-size:2.5rem;margin-bottom:12px;">&#x1F512;</div>
        <h3 style="margin:0 0 10px;color:#e74c3c;font-size:1.1rem;">Akses Ditolak</h3>
        <p style="color:#555;margin:0 0 20px;font-size:0.9rem;">${message}</p>
        <button onclick="document.getElementById('masterAccessDeniedPopup').remove()"
            style="background:#e74c3c;color:#fff;border:none;padding:10px 28px;border-radius:6px;cursor:pointer;font-size:0.9rem;font-weight:bold;">OK</button>
    </div>`;
    document.body.appendChild(popup);
    setTimeout(() => { if (popup.parentNode) popup.remove(); }, 5000);
}
</script>
<?php include 'modules/footer.php'; ?>