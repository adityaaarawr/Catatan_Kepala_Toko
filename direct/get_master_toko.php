<?php
require_once "config.php";

$action = $_GET['action'] ?? '';

/* ================= ADD TOKO ================= */
if ($action == 'add') {

    $nama = $_POST['nama_toko'] ?? '';
    $kode = $_POST['kode'] ?? '';

    $stmt = $conn->prepare("INSERT INTO toko (nama_toko, kode) VALUES (?, ?)");
    $stmt->execute([$nama, $kode]);

    echo json_encode(["status" => true, "message" => "Toko berhasil ditambahkan"]);
    exit;
}

/* ================= GET TOKO ================= */
if ($action == 'get') {

    $stmt = $conn->query("SELECT * FROM toko ORDER BY id DESC");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

/* ================= EDIT TOKO ================= */
if ($action == 'edit') {

    $id   = $_POST['id'];
    $nama = $_POST['nama_toko'];
    $kode = $_POST['kode'];

    $stmt = $conn->prepare("UPDATE toko SET nama_toko=?, kode=? WHERE id=?");
    $stmt->execute([$nama, $kode, $id]);

    echo json_encode(["status" => true]);
    exit;
}

/* ================= DELETE TOKO ================= */
if ($action == 'delete') {

    $id = $_POST['id'];
    $stmt = $conn->prepare("DELETE FROM toko WHERE id=?");
    $stmt->execute([$id]);

    echo json_encode(["status" => true]);
    exit;
}
