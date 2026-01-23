<?php
require_once "connect.php";
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

/* ============ GET KARYAWAN ============ */
if ($action == 'get') {

    $sql = "SELECT k.id, k.created_at,
                   u.username,
                   k.name,
                   t.id AS toko_id,
                   t.nama_toko,
                   d.id AS divisi_id,
                   d.nama_divisi
            FROM karyawan k
            LEFT JOIN toko t ON k.toko_id = t.id
            LEFT JOIN divisi d ON k.divisi_id = d.id
            LEFT JOIN users u ON k.created_by = u.id
            ORDER BY k.id DESC";

    $stmt = $conn->query($sql);

    echo json_encode([
        "status" => true,
        "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)
    ]);
    exit;
}

/* ============ ADD KARYAWAN ============ */
if ($action == 'add') {

    if(empty($_POST['name']) || empty($_POST['toko_id']) || empty($_POST['divisi_id'])) {
        echo json_encode(["status"=>false,"message"=>"Data tidak lengkap"]);
        exit;
    }

    $stmt = $conn->prepare(
        "INSERT INTO karyawan (name, toko_id, divisi_id, created_by)
         VALUES (?,?,?,?)"
    );

    $stmt->execute([
        $_POST['name'],
        $_POST['toko_id'],
        $_POST['divisi_id'],
        $_POST['user_id'] ?? null
    ]);

    echo json_encode(["status"=>true,"message"=>"Karyawan berhasil ditambahkan"]);
    exit;
}

/* ============ DETAIL KARYAWAN ============ */
if ($action == 'detail') {

    $stmt = $conn->prepare("SELECT * FROM karyawan WHERE id=?");
    $stmt->execute([$_GET['id']]);

    echo json_encode([
        "status"=>true,
        "data"=>$stmt->fetch(PDO::FETCH_ASSOC)
    ]);
    exit;
}

/* ============ EDIT KARYAWAN ============ */
if ($action == 'edit') {

    $stmt = $conn->prepare(
        "UPDATE karyawan 
         SET name=?, toko_id=?, divisi_id=? 
         WHERE id=?"
    );

    $stmt->execute([
        $_POST['name'],
        $_POST['toko_id'],
        $_POST['divisi_id'],
        $_POST['id']
    ]);

    echo json_encode(["status"=>true,"message"=>"Karyawan berhasil diupdate"]);
    exit;
}

/* ============ DELETE KARYAWAN ============ */
if ($action == 'delete') {

    $stmt = $conn->prepare("DELETE FROM karyawan WHERE id=?");
    $stmt->execute([$_POST['id']]);

    echo json_encode(["status"=>true,"message"=>"Karyawan berhasil dihapus"]);
    exit;
}

echo json_encode(["status"=>false,"message"=>"Invalid action"]);
