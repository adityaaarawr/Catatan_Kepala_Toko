<?php 
$pageTitle = 'User Management'; 
$cssFile = 'user.css'; 
$jsFile = 'user.js';

include './direct/config.php';

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
        $enable   = isset($_POST['enable']) ? 1 : 0;
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
            // 3. Query Update (Sertakan juga enable dan expired_at agar bisa diubah)
            $stmt = $conn->prepare("UPDATE users SET name = ?, username = ?, role_id = ?, enable = ?, expired_at = ?, last_modified = NOW() WHERE id = ?");
            $success = $stmt->execute([$name, $username, $role_id, $enable, $expired, $user_id]);

            if ($success) {
                echo json_encode(['status' => 'success']);
            } else {
                throw new Exception("Gagal memperbarui data.");
            }
            exit;

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
   AMBIL DATA
========================== */
$sqlUsers = "SELECT u.id, u.name, u.username, u.last_active, r.role_name
            FROM users u
            LEFT JOIN roles r ON r.id = u.role_id
            ORDER BY u.id ASC";
$stmtUsers = $conn->prepare($sqlUsers);
$stmtUsers->execute();
$users = $stmtUsers->fetchAll(PDO::FETCH_ASSOC);

$roles = $conn->query("SELECT id, role_name FROM roles ORDER BY role_name")->fetchAll(PDO::FETCH_ASSOC);
$karyawan = $conn->query("SELECT name, username FROM karyawan ORDER BY name ASC")->fetchAll(PDO::FETCH_ASSOC);
?>

<div class="layout"> 
    <?php include 'modules/sidebar.php'; ?>
    <main>
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
    <?php 
        // Logika: Cek apakah user aktif dalam 5 menit terakhir
        $isActive = false;
        if (!empty($u['last_active'])) {
            $lastSeen = strtotime($u['last_active']);
            $now = time();
            if (($now - $lastSeen) < 300) { // 300 detik = 5 menit
                $isActive = true;
            }
        }
    ?>
    <tr>
        <td><?= $no++; ?></td>
        <td class="user-cell">
            <?= htmlspecialchars($u['name']); ?>
            <small style="color:#6b7280;">(@<?= htmlspecialchars($u['username']); ?>)</small>
        </td>
        <td><span class="role-bubble"><?= strtoupper($u['role_name'] ?? '-'); ?></span></td>
     <td>
    <?php if ($isActive): ?>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
            <span class="role-bubble active">ACTIVE</span>
            <small style="color: #10b981; font-size: 10px; font-weight: 500;">
                <?= date('d/m H:i', strtotime($u['last_active'])); ?>
            </small>
        </div>
    <?php else: ?>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
            <span class="role-bubble inactive">INACTIVE</span>
            <?php 
            // Cek apakah kolom last_active ada isinya di database
            if (!empty($u['last_active']) && $u['last_active'] != '0000-00-00 00:00:00'): 
            ?>
                <small style="color: #6b7280; font-size: 10px; font-weight: 500;">
                    <?= date('d/m H:i', strtotime($u['last_active'])); ?>
                </small>
            <?php else: ?>
                <small style="color: #ef4444; font-size: 10px; font-weight: 500;">
                    NEVER ACTIVE
                </small>
            <?php endif; ?>
        </div>
    <?php endif; ?>
</td>
   
                        <td>
                            <div class="action-icons">
                                <svg class="icon-edit" data-id="<?= $u['id']; ?>" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h357l-80 80H200v560h560v-278l80-80v358q0 33-23.5 56.5T760-120Zm280-360ZM360-360v-170l367-367q12-12 27-18t30-6q16 0 30.5 6t26.5 18l56 57q11 12 17 26.5t6 29.5q0 15-5.5 29.5T897-728L530-360H360Zm481-424-56-56 56 56ZM440-440h56l232-232-28-28-29-28-231 231v57Zm260-260-29-28 29 28 28 28-28-28Z"/></svg>
                                <svg class="icon-delete" data-id="<?= $u['id']; ?>" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm120-400v320h40v-320h-40Zm160 0v320h40v-320h-40Z"/></svg>
                            </div>
                        </td>
                    </tr>
                    <?php endforeach; else: ?>
                    <tr><td colspan="5" style="text-align:center;">DATA USER TIDAK ADA</td></tr>
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
                            <?php foreach ($karyawan as $k): ?>
                                <option value="<?= $k['username']; ?>" data-name="<?= $k['name']; ?>" data-username="<?= $k['username']; ?>">
                                    <?= strtoupper($k['name']); ?> (@<?= $k['username']; ?>)
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
