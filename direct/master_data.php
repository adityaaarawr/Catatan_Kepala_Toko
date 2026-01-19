<?php
require_once "config.php";

$type = $_GET['type'] ?? '';

if($type == 'toko'){
    echo json_encode($conn->query("SELECT id, nama_toko FROM toko")->fetchAll(PDO::FETCH_ASSOC));
}

if($type == 'divisi'){
    echo json_encode($conn->query("SELECT id, nama_divisi FROM divisi")->fetchAll(PDO::FETCH_ASSOC));
}

if($type == 'topik'){
    echo json_encode($conn->query("SELECT id, nama_topik FROM topik")->fetchAll(PDO::FETCH_ASSOC));
}

if($type == 'karyawan'){
    echo json_encode($conn->query("SELECT id, nama_karyawan FROM karyawan")->fetchAll(PDO::FETCH_ASSOC));
}