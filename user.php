<?php 
session_start();
// 🔒 Pastikan role di session bukan angka
if (isset($_SESSION['role']) && is_numeric($_SESSION['role'])) {
    $_SESSION['role'] = 'ADMINISTRATOR';
}
$pageTitle = 'User Management'; 
$cssFile = 'user.css'; 
$jsFile = 'user.js';
include './direct/config.php';

// ===============================
// PROTEKSI USER MANAGEMENT PAGE
// ===============================

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

$stmtCheck = $conn->prepare("SELECT enable FROM users WHERE id = ?");
$stmtCheck->execute([$_SESSION['user_id']]);
$authUser = $stmtCheck->fetch(PDO::FETCH_ASSOC);

// ⛔ HANYA enable = 0 yang diblokir
if (!$authUser || (int)$authUser['enable'] === 0) {
    session_destroy();
    header("Location: login.php?error=disabled");
    exit;
}

$sqlRoles = "SELECT id, role_name FROM roles ORDER BY role_name ASC";
$stmtRoles = $conn->prepare($sqlRoles);
$stmtRoles->execute();
$roles = $stmtRoles->fetchAll(PDO::FETCH_ASSOC);

/*menyimpan ID user yang login di session $_SESSION['user_id']*/
if (isset($_SESSION['user_id'])) {
    $stmtUpdate = $conn->prepare("UPDATE users SET last_active = NOW() WHERE id = ?");
    $stmtUpdate->execute([$_SESSION['user_id']]);
}

include 'modules/header.php'; 

/* =========================================================
   SECTION A — ACTION HANDLER (INSERT / UPDATE / DELETE)
========================================================= */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (ob_get_length()) ob_clean(); 
    header('Content-Type: application/json');

     try {
        $action   = $_POST['action'] ?? '';
        $name     = $_POST['name'] ?? '';
        $username = $_POST['username'] ?? '';
        $role_id  = $_POST['role_id'] ?? '';
        $user_id  = $_POST['id'] ?? null;
        
        // Ambil data tambahan untuk kolom baru
        $enable = (!empty($_POST['enable']) && $_POST['enable'] == '1') ? 1 : 0;
        $expired  = !empty($_POST['expired_at']) ? $_POST['expired_at'] : null;

        if ($action === 'add_user') {
            // 1. Ambil ID terakhir secara manual
            $resId = $conn->query("SELECT MAX(id) as max_id FROM users")->fetch(PDO::FETCH_ASSOC);
            $nextId = (isset($resId['max_id']) && $resId['max_id'] !== null) ? (int)$resId['max_id'] + 1 : 1;

            // 2. Query Insert (Menyertakan kolom enable dan expired_at)
            $stmt = $conn->prepare("INSERT INTO users (id, name, username, role_id, enable, expired_at, created_at, last_modified, last_active) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())");
            $success = $stmt->execute([$nextId, $name, $username, $role_id, $enable, $expired]);

            if ($success) {
                echo json_encode(['status' => 'success']);
            } else {
                throw new Exception("Gagal menyimpan ke database.");
            }
            exit;

        } elseif ($action === 'edit_user') {
            $password = $_POST['password'] ?? '';
    
    if (!empty($password)) {
        // Jika password diisi, update password (disarankan pakai password_hash)
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("UPDATE users SET name = ?, username = ?, role_id = ?, enable = ?, expired_at = ?, password = ?, last_modified = NOW() WHERE id = ?");
        $success = $stmt->execute([$name, $username, $role_id, $enable, $expired, $hashedPassword, $user_id]);
    } else {

            // 3. Query Update (Sertakan juga enable dan expired_at agar bisa diubah)
            $stmt = $conn->prepare("UPDATE users SET name = ?, username = ?, role_id = ?, enable = ?, expired_at = ?, last_modified = NOW() WHERE id = ?");
            $success = $stmt->execute([$name, $username, $role_id, $enable, $expired, $user_id]);

            if ($success) {
                echo json_encode(['status' => 'success']);
            } else {
                throw new Exception("Gagal memperbarui data.");
            }
            exit;
    }
        
        } elseif ($action === 'delete_user') {
            // 4. Query Delete
            $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
            $success = $stmt->execute([$user_id]);
            if ($success) {
                echo json_encode(['status' => 'success']);
            } else {
                throw new Exception("Gagal menghapus user.");
            }
            exit;
        }

    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        exit;
    }
}

/* ==========================
   AMBIL DATA DARI API (LIVE)
========================== */
$apiUrl = "https://toyomatsu.ddns.net/master/api/?data=true";
$context = stream_context_create(["ssl" => ["verify_peer"=>false, "verify_peer_name"=>false]]);
$jsonData = @file_get_contents($apiUrl, false, $context);
$karyawan_api = json_decode($jsonData, true) ?? [];

/* ==========================
   AMBIL DATA DARI DB LOKAL ROLES)
========================== */
// Ini tetap ambil dari DB karena ini data akun untuk login web kamu
$sqlUsers = "SELECT u.id, u.name, u.username, u.enable, u.expired_at, r.role_name
            FROM users u
            LEFT JOIN roles r ON r.id = u.role_id
            ORDER BY u.id ASC";
$stmtUsers = $conn->prepare($sqlUsers);
$stmtUsers->execute();
$users = $stmtUsers->fetchAll(PDO::FETCH_ASSOC);
?>

<div class="layout"> 
    <?php include 'modules/sidebar.php'; ?>
    <main  id="mainContent" class="sidebar-collapsed">
        <div class="topbar">
            <h1 class="title">USER MANAGEMENT</h1>
        </div>
        
        <div class="top-bar">
            <div></div>
            <button class="btn-add">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>
                ADD NEW USER
            </button>
        </div>

        <div class="search-filter">
            <div class="search-box">
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg>
                <input type="text" id="searchUser" placeholder="Cari user...">
            </div>

              <div class="mobile-sort-container">
                <select id="sortUserMobile">
                    <option value="" disabled selected>SORT</option>
                    <option value="asc">A-Z</option>
                    <option value="desc">Z-A</option>
                </select>
            </div>
        </div>

        <div class="table-wrap">
            <table id="userTable">
                <thead>
                    <tr>
                        <th>NO</th>
                        <th>USER</th>
                        <th>ROLE</th>
                        <th>STATUS</th>
                        <th>ACTION</th>
                    </tr>
                </thead>
                
                <tbody id="userTableBody">
                   <?php if (!empty($users)): $no = 1; foreach ($users as $u): ?>
                        <tr>
                            <td><?= $no++; ?></td>
                            <td class="user-cell">
                                <?= htmlspecialchars($u['name']); ?>
                                <small style="color:#6b7280;">(@<?= htmlspecialchars($u['username']); ?>)</small>
                            </td>
                            <td><span class="role-bubble"><?= strtoupper($u['role_name'] ?? '-'); ?></span></td>
                            <td>
                                <?php
                                    $isEnabled   = (int)$u['enable'] === 1;
                                    $expiryDate = !empty($u['expired_at']) ? strtotime($u['expired_at']) : null;
                                    $now        = time();

                                    if (!$isEnabled) {
                                        $statusLabel = "SUSPENDED";
                                        $statusClass = "inactive";
                                    } elseif ($expiryDate !== null && $now > $expiryDate) {
                                        $statusLabel = "EXPIRED";
                                        $statusClass = "inactive";
                                    } else {
                                        $statusLabel = "ACTIVE";
                                        $statusClass = "active";
                                    }
                                ?>

                                <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                                    <span class="role-bubble <?= $statusClass ?>"><?= $statusLabel ?></span>
                                </div>
                            </td>
   
                            <td>
                                <div class="action-icons">
                                <svg class="icon-edit" 
                                    data-id="<?= $u['id']; ?>" 
                                    data-enable="<?= $u['enable'];  ?>"
                                    data-expired="<?= $u['expired_at']; ?>"xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h357l-80 80H200v560h560v-278l80-80v358q0 33-23.5 56.5T760-120Zm280-360ZM360-360v-170l367-367q12-12 27-18t30-6q16 0 30.5 6t26.5 18l56 57q11 12 17 26.5t6 29.5q0 15-5.5 29.5T897-728L530-360H360Zm481-424-56-56 56 56ZM440-440h56l232-232-28-28-29-28-231 231v57Zm260-260-29-28 29 28 28 28-28-28Z"/></svg>
                                    <svg class="icon-delete" data-id="<?= $u['id']; ?>" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm120-400v320h40v-320h-40Zm160 0v320h40v-320h-40Z"/></svg>
                                </div>
                                <div class="toggle-detail">LIHAT DETAIL</div>
                            </td>
                        </tr>
                    <?php endforeach; else: ?>
                        <tr><td colspan="5" style="text-align:center;">DATA USER TIDAK DITEMUKAN</td></tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <div class="pagination">
            <button class="page-btn prev">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M400-240 160-480l240-240 56 58-142 142h486v80H314l142 142-56 58Z"/></svg>
                PREVIOUS
            </button>
            <div class="pages"><div>1</div><div>2</div><div>3</div></div>
            <button class="page-btn next">
                NEXT
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="m560-240-56-58 142-142H160v-80h486L504-662l56-58 240 240-240 240Z"/></svg>
            </button>
        </div>

        <div class="popup-overlay" id="popupAddUser">
            <div class="popup-box">
                <form id="userForm">
                    <input type="hidden" name="action" id="formAction" value="add_user">
                    <input type="hidden" name="id" id="userId">
                    <div class="popup-close" id="popupClose">x</div>
                    <h3>ADD NEW USER</h3>

                    <div class="popup-group">
                        <label>PILIH KARYAWAN :</label>
                        <select id="selectUser" name="selected_user_id">
                            <option value="">Pilih user</option>

                            <?php foreach ($karyawan_api as $k): ?>
                                <?php
                                    $id   = $k['id'] ?? '';
                                    $nama = $k['nama_lengkap'] ?? '';
                                    $username = strtolower(
                                        str_replace(' ', '', $k['nama_panggilan'] ?? $k['nip'] ?? '')
                                    );
                                ?>
                                <option value="<?= $id ?>"
                                    data-name="<?= htmlspecialchars($nama) ?>"
                                    data-username="<?= htmlspecialchars($username) ?>">
                                    <?= strtoupper($nama ?: '-') ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="popup-group">
                        <label>NAME :</label>
                        <input type="text" id="name" name="name" readonly>
                    </div>

                    <div class="popup-group">
                        <label>USERNAME :</label>
                        <input type="text" id="username" name="username" readonly>
                    </div>

                     <div class="popup-group">
                        <label>PASSWORD :</label>
                        <input type="password" id="password" name="password" placeholder="Kosongkan jika tidak ingin mengubah">
                    </div>

                    <div class="popup-group">
                        <label>ROLE :</label>
                        <select id="role" name="role_id">
                            <option value="">Select role</option>
                            <?php foreach ($roles as $r): ?>
                                <option value="<?= $r['id']; ?>"><?= strtoupper($r['role_name']); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="enable-box">
                        <label><input type="checkbox" id="enable" name="enable" value="1"> ENABLE</label>
                    </div>

                    <div class="popup-group">
                        <label>EXPIRATION DATE :</label>
                        <div class="exp-row">
                            <input type="date" id="expDate" name="expired_at">
                            <span class="forever-text">FOREVER</span>
                        </div>
                    </div>

                    <button type="button" class="btn-save-popup" id="saveUser">SAVE</button>
                </form>
            </div>
        </div>
    </main>
</div>
<?php include 'modules/footer.php'; ?>  

<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<link rel="stylesheet" href="https://cdn.datatables.net/1.13.7/css/jquery.dataTables.min.css">
<script src="https://cdn.datatables.net/1.13.7/js/jquery.dataTables.min.js"></script>

<link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>

<script src="dist/js/sidebar.js"></script>
<script src="dist/js/user.js"></script>