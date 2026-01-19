<?php
require_once "config.php";

$action = $_GET['action'] ?? '';

/* ============ GET DIVISI ============ */
if($action == 'get'){
    $sql = "SELECT d.id, d.created_at, u.username, d.nama_divisi, d.deskripsi, t.nama_toko
            FROM divisi d
            LEFT JOIN toko t ON d.toko_id = t.id
            LEFT JOIN users u ON d.created_by = u.id
            ORDER BY d.id DESC";
    echo json_encode($conn->query($sql)->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

/* ============ ADD DIVISI ============ */
if($action == 'add'){
    $stmt = $conn->prepare("INSERT INTO divisi (nama_divisi, deskripsi, toko_id, created_by) VALUES (?,?,?,?)");
    $stmt->execute([
        $_POST['nama_divisi'],
        $_POST['deskripsi'],
        $_POST['toko_id'],
        $_POST['user_id']
    ]);

    echo json_encode(["status"=>true]);
    exit;
}

/* ============ EDIT DIVISI ============ */
if($action == 'edit'){
    $stmt = $conn->prepare("UPDATE divisi SET nama_divisi=?, deskripsi=?, toko_id=? WHERE id=?");
    $stmt->execute([
        $_POST['nama_divisi'],
        $_POST['deskripsi'],
        $_POST['toko_id'],
        $_POST['id']
    ]);

    echo json_encode(["status"=>true]);
    exit;
}

/* ============ DELETE DIVISI ============ */
if($action == 'delete'){
    $stmt = $conn->prepare("DELETE FROM divisi WHERE id=?");
    $stmt->execute([$_POST['id']]);

    echo json_encode(["status"=>true]);
    exit;
}
