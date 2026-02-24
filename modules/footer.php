<?php
/**
 * footer.php
 * ==========
 * Include app_config jika belum di-load (agar APP_FOOTER_TEXT tersedia)
 */
if (!defined('APP_FOOTER_TEXT')) {
    // Cari config dari berbagai kemungkinan path
    $configPaths = [
        __DIR__ . '/app_config.php',
        __DIR__ . '/../app_config.php',
        __DIR__ . '/direct/app_config.php',
    ];
    foreach ($configPaths as $p) {
        if (file_exists($p)) { require_once $p; break; }
    }
}
$footerText = defined('APP_FOOTER_TEXT') ? APP_FOOTER_TEXT : '© 2026 Catatan Kepala Toko v1.0.0';
?>

<!-- =============================================
     GLOBAL FOOTER STICKY CSS
     Memastikan footer selalu berada di bawah
     pada semua halaman tanpa ubah CSS per page.
============================================== -->
<style>
/* Pastikan halaman selalu full height */
html, body {
    height: 100%;
    margin: 0;
}

/* Layout wrapper harus full height */
.layout {
    min-height: 100vh;
    display: flex;
}

/* main harus flex column agar footer bisa di-push ke bawah */
.layout > main {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 100vh;
}

/* Spacer yang mendorong footer ke bawah */
.layout > main > .table-footer-divider,
.layout > main > .table-footer {
    margin-top: auto;
}

</style>

<!-- JQUERY (HANYA SEKALI, PALING ATAS) -->
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>

<!-- PLUGIN PER HALAMAN -->
<?php if(($pageTitle ?? '') == 'Home'): ?>
    <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/responsive/2.5.0/js/dataTables.responsive.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
<?php endif; ?>

<?php if(($pageTitle ?? '') == 'Report'): ?>
    <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
<?php endif; ?>

<?php if(($pageTitle ?? '') == 'Master'): ?>
    <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/responsive/2.5.0/js/dataTables.responsive.min.js"></script>
<?php endif; ?>

<?php if(($pageTitle ?? '') == 'User Management'): ?>
    <script src="https://cdn.datatables.net/1.13.8/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
<?php endif; ?>

<!-- GLOBAL JS (SETELAH SEMUA LIBRARY) -->
<script src="dist/js/sidebar.js?v=<?= time() ?>"></script>

<!-- PAGE JS (PALING BAWAH) -->
<?php if (!empty($jsFile) && file_exists("dist/js/".$jsFile)): ?>
    <script src="dist/js/<?= $jsFile ?>?v=<?= time() ?>"></script>
<?php endif; ?>