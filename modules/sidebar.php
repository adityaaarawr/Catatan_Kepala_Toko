<link rel="stylesheet" href="dist/css/sidebar.css">

<aside class="sidebar">
    <button id="toggle-btn" class="toggle-btn">
        <i class="fas fa-bars"></i>
    </button>

    <div class="logo">
        <span class="logo-text">
            <?php 
                // Ambil nama role dari database berdasarkan session user
                $displayRoleName = '-';
                try {
                    // Cek berbagai kemungkinan key session yang menyimpan role
                    if (!empty($_SESSION['role_name'])) {
                        // Jika session sudah menyimpan nama role langsung
                        $displayRoleName = strtoupper($_SESSION['role_name']);
                    } elseif (!empty($_SESSION['role_id'])) {
                        // Jika session menyimpan role_id → query nama role
                        if (isset($conn)) {
                            $roleStmt = $conn->prepare("SELECT role_name FROM roles WHERE id = ?");
                            $roleStmt->execute([$_SESSION['role_id']]);
                            $roleRow = $roleStmt->fetch(PDO::FETCH_ASSOC);
                            if ($roleRow) $displayRoleName = strtoupper($roleRow['role_name']);
                        }
                    } elseif (!empty($_SESSION['roles'])) {
                        // Jika session 'roles' berisi angka (ID) atau string nama
                        if (is_numeric($_SESSION['roles'])) {
                            if (isset($conn)) {
                                $roleStmt = $conn->prepare("SELECT role_name FROM roles WHERE id = ?");
                                $roleStmt->execute([$_SESSION['roles']]);
                                $roleRow = $roleStmt->fetch(PDO::FETCH_ASSOC);
                                if ($roleRow) $displayRoleName = strtoupper($roleRow['role_name']);
                            }
                        } else {
                            $displayRoleName = strtoupper($_SESSION['roles']);
                        }
                    } elseif (!empty($_SESSION['user_id']) && isset($conn)) {
                        // Fallback: query berdasarkan user_id → cari role via users table
                        $userStmt = $conn->prepare("
                            SELECT r.role_name 
                            FROM users u 
                            LEFT JOIN roles r ON u.role_id = r.id 
                            WHERE u.id = ?
                        ");
                        $userStmt->execute([$_SESSION['user_id']]);
                        $userRow = $userStmt->fetch(PDO::FETCH_ASSOC);
                        if ($userRow && !empty($userRow['role_name'])) {
                            $displayRoleName = strtoupper($userRow['role_name']);
                        }
                    }
                } catch (Exception $e) {
                    // Jika query gagal, tetap tampilkan '-'
                    $displayRoleName = '-';
                }
                echo htmlspecialchars($displayRoleName);
            ?>
        </span>
    </div>

    <ul class="menu-list">
        <li class="<?php echo (isset($pageTitle) && $pageTitle == 'Home') ? 'active' : ''; ?>">
            <a href="home.php">
                <i class="fas fa-desktop fa-lg"></i>
                <span>Home</span>
            </a>
        </li>

        <li class="<?php echo (isset($pageTitle) && $pageTitle == 'Report') ? 'active' : ''; ?>">
            <a href="report.php">
                <i class="fas fa-chart-bar fa-lg"></i>
                <span>Report</span>
            </a>
        </li>

        <li class="<?php echo (isset($pageTitle) && $pageTitle == 'Master') ? 'active' : ''; ?>">
            <a href="master.php">
                <i class="fas fa-database fa-lg"></i>
                <span>Master</span>
            </a>
        </li>

        <li class="<?php echo (isset($pageTitle) && $pageTitle == 'User Management') ? 'active' : ''; ?>">
            <a href="user.php">
                <i class="fas fa-users fa-lg"></i>
                <span>User Management</span>
            </a>
        </li>
    </ul>

    <button class="logout-btn" id="btnLogout">
        <i class="fas fa-sign-out-alt"></i>
        <span>Logout</span>
    </button>
</aside>

<script src="dist/js/sidebar.js"></script>