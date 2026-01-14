<?php 
$pageTitle = 'User Management'; 
$cssFile = 'user.css'; 
$jsFile = 'user.js';

include './direct/config.php';
include 'modules/header.php'; 

/* =========================================================
   SECTION A — ACTION HANDLER (INSERT / UPDATE / DELETE)
========================================================= */

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    /* ===== ADD USER ===== */
    if ($_POST['action'] === 'add_user') {

        $name     = $_POST['name'];
        $username = $_POST['username'];
        $role_id  = $_POST['role_id'];
        $enable   = $_POST['enable'] ?? 0;
        $expired  = $_POST['expired_at'] ?: null;

        // insert users
          $stmt = $conn->prepare("
    INSERT INTO users (name, username, role_id, created_at, last_modified)
    VALUES (?, ?, ?, NOW(), NOW())
");
$stmt->execute([$name, $username, $role_id]);

        // enable
        $stmt = $conn->prepare("
            INSERT INTO transaksi_user_role
            (role_id, role_key_name, key_value_bool)
            VALUES (?, 'enable', ?)
        ");
        $stmt->execute([$role_id, $enable]);

        // expiration
        if ($expired) {
            $stmt = $conn->prepare("
                INSERT INTO transaksi_user_role
                (role_id, role_key_name, key_value_datetime)
                VALUES (?, 'expiration_date', ?)
            ");
            $stmt->execute([$role_id, $expired]);
        }

        exit;
    }

    /* ===== DELETE USER ===== */
    if ($_POST['action'] === 'delete_user') {
        $id = $_POST['id'];

        $conn->prepare("DELETE FROM users WHERE id=?")->execute([$id]);

        exit;
    }
}

/* ==========================
   AMBIL DATA USER
========================== */
$sqlUsers = "
SELECT 
    u.id,
    u.name,
    u.username,
    u.created_at,
    r.role_name,
    MAX(CASE WHEN tur.role_key_name = 'enable' THEN tur.key_value_bool END) AS is_active,
    MAX(CASE WHEN tur.role_key_name = 'expiration_date' THEN tur.key_value_datetime END) AS expired_at
FROM users u
LEFT JOIN roles r ON r.id = u.role_id
LEFT JOIN transaksi_user_role tur ON tur.role_id = u.role_id
GROUP BY u.id
ORDER BY u.id ASC
";

$stmtUsers = $conn->prepare($sqlUsers);
$stmtUsers->execute();
$users = $stmtUsers->fetchAll(PDO::FETCH_ASSOC);

/* ==========================
   AMBIL DATA ROLE (DROPDOWN)
========================== */
$sqlRoles = "SELECT id, role_name FROM roles ORDER BY role_name";
$stmtRoles = $conn->prepare($sqlRoles);
$stmtRoles->execute();
$roles = $stmtRoles->fetchAll(PDO::FETCH_ASSOC);

?>


<div class="layout"> 
    <?php include 'modules/sidebar.php'; ?>
    <main>
        <div class="topbar">
            <h1 class="title">USER MANAGEMENT</h1>
        </div>
        
        <div class="table-container"></div>
        <div class="top-bar">
            <div></div>
            <button class="btn-add">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                    <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/>
                </svg>
                ADD NEW USER
            </button>
        </div>

        <div class="search-filter">
            <div class="search-box">
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960">
                    <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
                </svg>
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
<?php if (!empty($users)): ?>
    <?php $no = 1; ?>
    <?php foreach ($users as $u): ?><tr>
    <td><?= $no++; ?></td>

    <!-- USER -->
    <td class="user-cell">
        <?= htmlspecialchars($u['name']); ?>
        <small style="color:#6b7280;">
            (@<?= htmlspecialchars($u['username']); ?>)
        </small>
    </td>

    <!-- ROLE -->
    <td>
        <span class="role-bubble">
            <?= strtoupper($u['role_name'] ?? '-'); ?>
        </span>
    </td>

    <!-- STATUS -->
    <td>
        <?php if ($u['is_active'] == 1): ?>
            <span class="role-bubble active">ACTIVE</span>
        <?php else: ?>
            <span class="role-bubble inactive">INACTIVE</span>
        <?php endif; ?>
    </td>

<!-- ACTION -->
<td>
    <div class="action-icons">
        <!-- EDIT -->
        <svg class="icon-edit"
             data-id="<?= $u['id']; ?>"
             xmlns="http://www.w3.org/2000/svg"
             viewBox="0 -960 960 960">
            <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h357l-80 80H200v560h560v-278l80-80v358q0 33-23.5 56.5T760-120Zm280-360ZM360-360v-170l367-367q12-12 27-18t30-6q16 0 30.5 6t26.5 18l56 57q11 12 17 26.5t6 29.5q0 15-5.5 29.5T897-728L530-360H360Zm481-424-56-56 56 56ZM440-440h56l232-232-28-28-29-28-231 231v57Zm260-260-29-28 29 28 28 28-28-28Z"/>
        </svg>
        </svg>

        <!-- DELETE -->
        <svg class="icon-delete"
             data-id="<?= $u['id']; ?>"
             xmlns="http://www.w3.org/2000/svg"
             viewBox="0 -960 960 960">
            <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm120-400v320h40v-320h-40Zm160 0v320h40v-320h-40Z"/>
        </svg>
    </div>
</td>


    <?php endforeach; ?>
<?php else: ?>
    <tr>
        <td colspan="5" style="text-align:center;">
            DATA USER TIDAK ADA
        </td>
    </tr>
<?php endif; ?>
</tbody>

            </table>
           </div>

        <div class="pagination">
            <button class="page-btn prev">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                    <path d="M400-240 160-480l240-240 56 58-142 142h486v80H314l142 142-56 58Z"/>
                </svg>
                PREVIOUS
            </button>
            <div class="pages">
                <div>1</div>
                <div>2</div>
                <div>3</div>
            </div>
            <button class="page-btn next">
                NEXT
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                    <path d="m560-240-56-58 142-142H160v-80h486L504-662l56-58 240 240-240 240Z"/>
                </svg>
            </button>
        </div>

        <div class="popup-overlay" id="popupAddUser">
            <div class="popup-box">
                <div class="popup-close" id="popupClose">x</div>

                <h3>ADD NEW USER</h3>

                <div class="popup-group">
                <select id="selectUser">
                        <option value="">Pilih user</option>
                    </select>
                    </div>

                <div class="popup-group">
                    <label>NAME :</label>
                    <input type="text" id="name">
                </div>

                <div class="popup-group">
                    <label>USERNAME :</label>
                    <input type="text" id="username">
                </div>

                <div class="popup-group">
                    <label>ROLE :</label>
                  <select id="role">
    <option value="">Select role</option>
    <?php foreach ($roles as $r): ?>
        <option value="<?= $r['id']; ?>">
            <?= strtoupper($r['role_name']); ?>
        </option>
    <?php endforeach; ?>
</select>

                </div>

                <div class="enable-box">
                    <label>
                        <input type="checkbox" id="enable">
                        ENABLE
                    </label>
                </div>

                <div class="popup-group">
                    <label>EXPIRATION DATE :</label>
                    <div class="exp-row">
                        <input type="date" id="expDate">
                        <span class="forever-text">FOREVER</span>
                    </div>
                </div>

                <button class="btn-save-popup" id="saveUser">SAVE</button>
            </div>
        </div>
    </main>
</div>

<?php include 'modules/footer.php'; ?>