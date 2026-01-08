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

</body>
</html>