<?php
require_once "connect.php";
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

/* ============ GET TOPIK ============ */
if ($action == 'get') {

    $sql = "SELECT tp.id, tp.created_at,
                   u.username,
                   tp.nama_topik,
                   tp.deskripsi,
                   t.id AS toko_id,
                   t.nama_toko,
                   d.id AS divisi_id,
                   d.nama_divisi
            FROM topik tp
            LEFT JOIN toko t ON tp.toko_id = t.id
            LEFT JOIN divisi d ON tp.divisi_id = d.id
            LEFT JOIN users u ON tp.created_by = u.id
            ORDER BY tp.id DESC";

    $stmt = $conn->query($sql);

    echo json_encode([
        "status" => true,
        "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)
    ]);
    exit;
}

/* ============ ADD TOPIK ============ */
if ($action == 'add') {

    if(empty($_POST['nama_topik']) || empty($_POST['toko_id']) || empty($_POST['divisi_id'])) {
        echo json_encode(["status"=>false,"message"=>"Data tidak lengkap"]);
        exit;
    }

    $stmt = $conn->prepare(
        "INSERT INTO topik (nama_topik, deskripsi, toko_id, divisi_id, created_by)
         VALUES (?,?,?,?,?)"
    );

    $stmt->execute([
        $_POST['nama_topik'],
        $_POST['deskripsi'] ?? '',
        $_POST['toko_id'],
        $_POST['divisi_id'],
        $_POST['user_id'] ?? null
    ]);

    echo json_encode(["status"=>true,"message"=>"Topik berhasil ditambahkan"]);
    exit;
}

/* ============ DETAIL TOPIK ============ */
if ($action == 'detail') {

    $stmt = $conn->prepare("SELECT * FROM topik WHERE id=?");
    $stmt->execute([$_GET['id']]);

    echo json_encode([
        "status"=>true,
        "data"=>$stmt->fetch(PDO::FETCH_ASSOC)
    ]);
    exit;
}

/* ============ EDIT TOPIK ============ */
if ($action == 'edit') {

    $stmt = $conn->prepare(
        "UPDATE topik 
         SET nama_topik=?, deskripsi=?, toko_id=?, divisi_id=? 
         WHERE id=?"
    );

    $stmt->execute([
        $_POST['nama_topik'],
        $_POST['deskripsi'],
        $_POST['toko_id'],
        $_POST['divisi_id'],
        $_POST['id']
    ]);

    echo json_encode(["status"=>true,"message"=>"Topik berhasil diupdate"]);
    exit;
}

/* ============ DELETE TOPIK ============ */
if ($action == 'delete') {

    $stmt = $conn->prepare("DELETE FROM topik WHERE id=?");
    $stmt->execute([$_POST['id']]);

    echo json_encode(["status"=>true,"message"=>"Topik berhasil dihapus"]);
    exit;
}

echo json_encode(["status"=>false,"message"=>"Invalid action"]);
