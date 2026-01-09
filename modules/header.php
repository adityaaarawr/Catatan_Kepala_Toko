<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($pageTitle) ? $pageTitle : 'Dashboard'; ?> - Catatan Kepala Toko</title>

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet">

    <?php if(isset($pageTitle) && $pageTitle == 'Home'): ?>
        <link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css">
        <link rel="stylesheet" href="assets/fontawesome/css/all.min.css">
    <?php endif; ?>

    <?php if(isset($pageTitle) && $pageTitle == 'Report'): ?>
        <!-- SELECT2 -->
        <link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet"/> 
    <?php endif; ?>

    <?php if(isset($pageTitle) && $pageTitle == 'Master'): ?>
        <link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css">
        <link rel="stylesheet" href="assets/fontawesome/css/all.min.css">
    <?php endif; ?>

    <?php if(isset($pageTitle) && $pageTitle == 'User Management'): ?>
        <link rel="stylesheet" href="https://cdn.datatables.net/1.13.8/css/jquery.dataTables.min.css">
        <link rel="stylesheet" href="https://cdn.datatables.net/responsive/2.5.0/css/responsive.dataTables.min.css">
        <link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />   
    <?php endif; ?>

    <link rel="stylesheet" href="dist/css/sidebar.css">
    <?php if(isset($cssFile)): ?>
        <link rel="stylesheet" href="dist/css/<?php echo $cssFile; ?>">
    <?php endif; ?>

</head>