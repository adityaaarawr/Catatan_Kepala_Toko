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

    <?php if(isset($pageTitle) && $pageTitle == 'Master'): ?>
        <link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css">
        <link rel="stylesheet" href="assets/fontawesome/css/all.min.css">
    <?php endif; ?>

    <link rel="stylesheet" href="dist/css/sidebar.css">
    <?php if(isset($cssFile)): ?>
        <link rel="stylesheet" href="dist/css/<?php echo $cssFile; ?>">
    <?php endif; ?>

</head>