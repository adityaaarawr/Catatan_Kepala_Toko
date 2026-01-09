<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<script src="dist/js/sidebar.js?v=<?php echo time(); ?>"></script>

    <?php if (isset($jsFile) && !empty($jsFile)): ?>
        <?php 
            // Cek apakah file ada di folder dist/js/
            $fullPath = "dist/js/" . $jsFile;
            if (file_exists($fullPath)): 
        ?>
            <script src="<?php echo $fullPath; ?>?v=<?php echo time(); ?>"></script>
        <?php else: ?>
            <script>console.error("File JS tidak ditemukan: <?php echo $fullPath; ?>");</script>
        <?php endif; ?>
    <?php endif; ?>

    <?php if(isset($pageTitle) && $pageTitle == 'Report'): ?>
        <!-- JQUERY (WAJIB PALING ATAS) -->
        <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
         <!-- SELECT2 -->
        <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
    <?php endif; ?>

    <?php if(isset($pageTitle) && $pageTitle == 'User Management'): ?>
        <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
        <script src="https://cdn.datatables.net/1.13.8/js/jquery.dataTables.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
    <?php endif; ?>

</body>
</html>