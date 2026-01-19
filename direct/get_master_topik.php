<?php
require_once "config.php";

$action = $_GET['action'] ?? '';

/* ============ GET TOPIK ============ */
if($action == 'get'){
    $sql = "SELECT tp.id, tp.created_at, u.username, tp.nama_topik,
                   t.nama_toko, d.nama_divisi
            FROM topik tp
            LEFT JOIN toko t ON tp.toko_id = t.id
            LEFT JOIN divisi d ON tp.divisi_id = d.id
            LEFT JOIN users u ON tp.created_by = u.id
            ORDER BY tp.id DESC";
    echo json_encode($conn->query($sql)->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

/* ============ ADD TOPIK ============ */
if($action == 'add'){
    $stmt = $conn->prepare("INSERT INTO topik (nama_topik, toko_id, divisi_id, created_by) VALUES (?,?,?,?)");
    $stmt->execute([
        $_POST['nama_topik'],
        $_POST['toko_id'],
        $_POST['divisi_id'],
        $_POST['user_id']
    ]);

    echo json_encode(["status"=>true]);
    exit;
}

/* ============ EDIT TOPIK ============ */
if($action == 'edit'){
    $stmt = $conn->prepare("UPDATE topik SET nama_topik=?, toko_id=?, divisi_id=? WHERE id=?");
    $stmt->execute([
        $_POST['nama_topik'],
        $_POST['toko_id'],
        $_POST['divisi_id'],
        $_POST['id']
    ]);

    echo json_encode(["status"=>true]);
    exit;
}

/* ============ DELETE TOPIK ============ */
if($action == 'delete'){
    $stmt = $conn->prepare("DELETE FROM topik WHERE id=?");
    $stmt->execute([$_POST['id']]);

    echo json_encode(["status"=>true]);
    exit;
}
