
<link rel="stylesheet" href="dist/css/sidebar.css">

    <button id="toggle-btn" class="toggle-btn">
        <i class="fas fa-bars"></i>
    </button>

    <aside class="sidebar">
    <div class="logo">
        <span class="logo-text">
            <?php 
                // Cek role user, jika tidak ada default ke ADMINISTRATOR
                echo isset($_SESSION['role']) ? htmlspecialchars($_SESSION['role']) : "ADMINISTRATOR";
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
