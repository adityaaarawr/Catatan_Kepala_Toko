<?php 
require_once "direct/config.php";

$dataToko = $conn->query("SELECT * FROM toko ORDER BY id DESC")->fetchAll(PDO::FETCH_ASSOC);

$dataDivisi = $conn->query("SELECT d.*, t.nama_toko FROM divisi d 
    LEFT JOIN toko t ON d.toko_id = t.id ORDER BY d.id DESC")->fetchAll(PDO::FETCH_ASSOC);

$dataTopik = $conn->query("SELECT tp.*, t.nama_toko, d.nama_divisi FROM topik tp 
    LEFT JOIN toko t ON tp.toko_id = t.id 
    LEFT JOIN divisi d ON tp.divisi_id = d.id ORDER BY tp.id DESC")->fetchAll(PDO::FETCH_ASSOC);

$dataKaryawan = $conn->query("SELECT k.*, t.nama_toko, d.nama_divisi FROM karyawan k    
    LEFT JOIN toko t ON k.toko_id = t.id 
    LEFT JOIN divisi d ON k.divisi_id = d.id ORDER BY k.id DESC")->fetchAll(PDO::FETCH_ASSOC);

$dataTransaksi_user_role = $conn->query("
    SELECT 
        r.id, 
        r.role_name, 
        u.username,
        r.created_at,
        GROUP_CONCAT(rk.role_key_name SEPARATOR ', ') as permissions
    FROM roles r
    LEFT JOIN users u ON r.created_by = u.id
    LEFT JOIN transaksi_user_role tur ON r.id = tur.role_id
    LEFT JOIN role_key rk ON tur.role_key_name = rk.id 
    GROUP BY r.id, r.role_name, u.username, r.created_at
    ORDER BY r.id ASC 
")->fetchAll(PDO::FETCH_ASSOC);

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
                            <th>KODE</th>
                            <th>ACTION</th>
                        </tr>
                    </thead>
                    <tbody id="masterTableBody">

                        <?php if(count($dataToko) > 0): ?>
                            <?php $no = 1; foreach($dataToko as $row): ?>   
                                <tr class="master-row" data-type="toko">
                                    <td><?= $no++ ?></td>
                                    <td><?= ($row['created_at']) ? date('Y-m-d', strtotime($row['created_at'])) : '-' ?></td>
                                    <td><?= htmlspecialchars($row['username'] ?? '-') ?></td>    
                                    <td><?= htmlspecialchars($row['nama_toko']) ?></td>
                                    <td><span class="badge"><?= htmlspecialchars($row['kode']) ?></span></td>
                                    <td class="action-cell">
                                        <div class="action-buttons-container">
                                            <button class="action-btn edit-btn" onclick="editToko(<?= $row['id'] ?>)" title="Edit">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="action-btn delete-btn" onclick="deleteToko(<?= $row['id'] ?>)" title="Hapus">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <tr><td colspan="6" style="text-align:center;">Data toko tidak ditemukan.</td></tr>
                        <?php endif;?>

                        <?php if(count($dataDivisi) > 0): ?>
                            <?php $no = 1; foreach($dataDivisi as $row): ?>
                                <tr class="master-row" data-type="divisi">
                                    <td><?= $no++ ?></td>
                                    <td><?= $row['created_at'] ? date('Y-m-d', strtotime($row['created_at'])) : '-' ?></td>
                                    <td><?= $row['username'] ?? '-' ?></td>
                                    <td><?= htmlspecialchars($row['nama_divisi']) ?></td>
                                    <td><?= htmlspecialchars($row['deskripsi']) ?></td>
                                    <td><?= htmlspecialchars($row['nama_toko']) ?></td>
                                    <td class="action-cell">
                                        <div class="action-buttons-container">
                                            <button class="action-btn edit-btn" onclick="editDivisi(<?= $row['id'] ?>)" title="Edit">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="action-btn delete-btn" onclick="deleteDivisi(<?= $row['id'] ?>)" title="Hapus">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; endif;?>

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
                                            <button class="action-btn edit-btn" onclick="editTopik(<?= $row['id'] ?>)" title="Edit">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="action-btn delete-btn" onclick="deleteTopik(<?= $row['id'] ?>)" title="Hapus">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; endif;?>

                        <?php if(count($dataKaryawan) > 0): ?>
                            <?php $no = 1; foreach($dataKaryawan as $row): ?>
                                <tr class="master-row" data-type="karyawan">
                                    <td><?= $no++ ?></td>
                                    <td><?= $row['created_at'] ? date('Y-m-d', strtotime($row['created_at'])) : '-' ?></td>
                                    <td><?= $row['username'] ?? '-' ?></td>
                                    <td><?= htmlspecialchars($row['name']) ?></td>
                                    <td><?= htmlspecialchars($row['nama_toko']) ?></td>
                                    <td><?= htmlspecialchars($row['nama_divisi']) ?></td>
                                    <td class="action-cell">
                                        <div class="action-buttons-container">
                                            <button class="action-btn edit-btn" onclick="editKaryawan(<?= $row['id'] ?>)" title="Edit">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="action-btn delete-btn" onclick="deleteKaryawan(<?= $row['id'] ?>)" title="Hapus">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; endif;?>

                        <?php if(count($dataTransaksi_user_role) > 0): ?>
                            <?php $no = 1; foreach($dataTransaksi_user_role as $row): ?>
                                <tr class="master-row" data-type="user-role">
                                    <td><?= $no++ ?></td>
                                    <td><?= (!empty($row['created_at']) && $row['created_at'] != '0000-00-00 00:00:00') ? date('Y-m-d', strtotime($row['created_at'])) : '-' ?></td>
                                    <td><?= htmlspecialchars($row['created_by'] ?? '-') ?></td>
                                    <td><?= htmlspecialchars($row['role_name']) ?></td>
                                    <td>
                                        <span style="font-size: 0.85rem; color: #666;">
                                            <?= !empty($row['permissions']) ? htmlspecialchars($row['permissions']) : '<i style="color: #ccc;">Tidak ada akses</i>' ?>
                                        </span>
                                    </td>
                                    <td class="action-cell">
                                        <div class="action-buttons-container">
                                            <button class="action-btn edit-btn" onclick="editRole(<?= $row['id'] ?>)" title="Edit">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="action-btn delete-btn" onclick="deleteRole(<?= $row['id'] ?>)" title="Hapus">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?> 
                    </tbody>
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
            <input type="text" id="roleName"value ="testt" name="roleName" placeholder="Masukkan nama role" required>
            
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

<?php include 'modules/footer.php'; ?>