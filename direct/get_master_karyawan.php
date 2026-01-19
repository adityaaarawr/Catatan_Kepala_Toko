<?php
require_once "config.php";

$action = $_GET['action'] ?? '';

/* ============ GET KARYAWAN ============ */
if($action == 'get'){
    $sql = "SELECT k.id, k.created_at, u.username, k.nama_karyawan,
                   t.nama_toko, d.nama_divisi
            FROM karyawan k
            LEFT JOIN toko t ON k.toko_id = t.id
            LEFT JOIN divisi d ON k.divisi_id = d.id
            LEFT JOIN users u ON k.created_by = u.id
            ORDER BY k.id DESC";
    echo json_encode($conn->query($sql)->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

/* ============ ADD KARYAWAN ============ */
if($action == 'add'){
    $stmt = $conn->prepare("INSERT INTO karyawan (nama_karyawan, toko_id, divisi_id, created_by) VALUES (?,?,?,?)");
    $stmt->execute([
        $_POST['nama_karyawan'],
        $_POST['toko_id'],
        $_POST['divisi_id'],
        $_POST['user_id']
    ]);

    echo json_encode(["status"=>true]);
    exit;
}

/* ============ EDIT KARYAWAN ============ */
if($action == 'edit'){
    $stmt = $conn->prepare("UPDATE karyawan SET nama_karyawan=?, toko_id=?, divisi_id=? WHERE id=?");
    $stmt->execute([
        $_POST['nama_karyawan'],
        $_POST['toko_id'],
        $_POST['divisi_id'],
        $_POST['id']
    ]);

    echo json_encode(["status"=>true]);
    exit;
}

/* ============ DELETE KARYAWAN ============ */
if($action == 'delete'){
    $stmt = $conn->prepare("DELETE FROM karyawan WHERE id=?");
    $stmt->execute([$_POST['id']]);

    echo json_encode(["status"=>true]);
    exit;
}
