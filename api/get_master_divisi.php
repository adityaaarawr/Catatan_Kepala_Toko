<?php
require_once "connect.php";
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

/* ================= GET DIVISI ================= */
if ($action == 'get') {

    $sql = "SELECT d.id, d.created_at, 
                   u.username, 
                   d.nama_divisi, 
                   d.deskripsi, 
                   t.id AS toko_id,
                   t.nama_toko
            FROM divisi d
            LEFT JOIN toko t ON d.toko_id = t.id
            LEFT JOIN users u ON d.created_by = u.id
            ORDER BY d.id DESC";

    $stmt = $conn->query($sql);

    echo json_encode([
        "status" => true,
        "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)
    ]);
    exit;
}

/* ================= ADD DIVISI ================= */
if ($action == 'add') {

    $nama = $_POST['nama_divisi'] ?? '';
    $desk = $_POST['deskripsi'] ?? '';
    $toko = $_POST['toko_id'] ?? '';
    $user = $_POST['user_id'] ?? null;

    if ($nama == '' || $toko == '') {
        echo json_encode(["status"=>false,"message"=>"Data tidak lengkap"]);
        exit;
    }

    $stmt = $conn->prepare(
        "INSERT INTO divisi (nama_divisi, deskripsi, toko_id, created_by) 
         VALUES (?,?,?,?)"
    );

    $stmt->execute([$nama, $desk, $toko, $user]);

    echo json_encode([
        "status"=>true,
        "message"=>"Divisi berhasil ditambahkan"
    ]);
    exit;
}

/* ================= DETAIL DIVISI ================= */
if ($action == 'detail') {

    $id = $_GET['id'] ?? 0;

    $stmt = $conn->prepare("SELECT * FROM divisi WHERE id=?");
    $stmt->execute([$id]);

    echo json_encode([
        "status"=>true,
        "data"=>$stmt->fetch(PDO::FETCH_ASSOC)
    ]);
    exit;
}

/* ================= EDIT DIVISI ================= */
if ($action == 'edit') {

    $id   = $_POST['id'] ?? '';
    $nama = $_POST['nama_divisi'] ?? '';
    $desk = $_POST['deskripsi'] ?? '';
    $toko = $_POST['toko_id'] ?? '';

    if ($id == '' || $nama == '' || $toko == '') {
        echo json_encode(["status"=>false,"message"=>"Data tidak lengkap"]);
        exit;
    }

    $stmt = $conn->prepare(
        "UPDATE divisi 
         SET nama_divisi=?, deskripsi=?, toko_id=? 
         WHERE id=?"
    );

    $stmt->execute([$nama, $desk, $toko, $id]);

    echo json_encode([
        "status"=>true,
        "message"=>"Divisi berhasil diupdate"
    ]);
    exit;
}

/* ================= DELETE DIVISI ================= */
if ($action == 'delete') {

    $id = $_POST['id'] ?? '';

    if ($id == '') {
        echo json_encode(["status"=>false,"message"=>"ID tidak valid"]);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM divisi WHERE id=?");
    $stmt->execute([$id]);

    echo json_encode([
        "status"=>true,
        "message"=>"Divisi berhasil dihapus"
    ]);
    exit;
}

echo json_encode(["status"=>false,"message"=>"Invalid action"]);
