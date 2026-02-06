<!-- JQUERY (HANYA SEKALI, PALING ATAS) -->
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>

<!-- PLUGIN PER HALAMAN -->
<?php if($pageTitle == 'Home'): ?>
    <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/responsive/2.5.0/js/dataTables.responsive.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
<?php endif; ?>

<?php if($pageTitle == 'Report'): ?>
    <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
<?php endif; ?>

<?php if($pageTitle == 'Master'): ?>
    <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/responsive/2.5.0/js/dataTables.responsive.min.js"></script>
<?php endif; ?>

<?php if($pageTitle == 'User Management'): ?>
    <script src="https://cdn.datatables.net/1.13.8/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
<?php endif; ?>

<!-- GLOBAL JS (SETELAH SEMUA LIBRARY) -->
<script src="dist/js/sidebar.js?v=<?= time() ?>"></script>

<!-- PAGE JS (PALING BAWAH) -->
<?php if (!empty($jsFile) && file_exists("dist/js/".$jsFile)): ?>
    <script src="dist/js/<?= $jsFile ?>?v=<?= time() ?>"></script>
<?php endif; ?>