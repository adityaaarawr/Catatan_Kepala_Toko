<?php
require_once "connect.php";
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

try {

    /* ================= ADD TOKO ================= */  
    if ($action === 'add') {

        header('Content-Type: application/json');

        $nama = trim($_POST['nama_toko'] ?? '');
        $kode = trim($_POST['kode'] ?? '');
        $username = $_POST['username'] ?? null; // optional

        if ($nama === '' || $kode === '') {
            echo json_encode([
                "status" => false, 
                "message" => "Nama toko & kode wajib diisi"
            ]);
            exit;
        }

        $stmt = $conn->prepare("
            INSERT INTO toko (created_at, username, nama_toko, kode) 
            VALUES (NOW(), ?, ?, ?)
        ");

        $ok = $stmt->execute([$username, $nama, $kode]);

        echo json_encode([
            "status" => $ok,
            "message" => $ok ? "Toko berhasil ditambahkan" : "Gagal menambahkan toko"
        ]);
        exit;
    }

    
    /* ================= GET TOKO ================= */
    if ($action === 'get') {
        $stmt = $conn->query("ssssss
            SELECT id, created_at, username, nama_toko, kode, 
            FROM toko 
            ORDER BY id DESC
        ");

        echo json_encode([
            "status" => true,
            "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ]);
        exit;
    }

    /* ================= DETAIL TOKO ================= */
    if ($action === 'detail') {

        $id = (int) ($_GET['id'] ?? 0);

        $stmt = $conn->prepare("SELECT id, nama_toko, kode FROM toko WHERE   id=?");
        $stmt->execute([$id]);

        echo json_encode([
            "status" => true,
            "data" => $stmt->fetch(PDO::FETCH_ASSOC)
        ]);
        exit;
    }

    /* ================= EDIT TOKO ================= */
    if ($action === 'edit') {

        $id   = (int) ($_POST['id'] ?? 0);
        $nama = trim($_POST['nama_toko'] ?? '');
        $kode = trim($_POST['kode'] ?? '');
    
        if (!$id || $nama === '' || $kode === '') {
            echo json_encode(["status" => false, "message" => "Data tidak lengkap"]);
            exit;
        }
    
        $stmt = $conn->prepare("UPDATE toko SET nama_toko=?, kode=? WHERE id=?");
        $ok = $stmt->execute([$nama, $kode, $id]);
    
        echo json_encode([
            "status" => $ok,
            "message" => $ok ? "Toko berhasil diupdate" : "Gagal update toko"   
        ]);
        exit;
    }
    
    /* ================= DELETE TOKO ================= */
    if ($action === 'delete') {

        $id = (int) ($_POST['id'] ?? 0);
    
        if (!$id) {
            echo json_encode(["status" => false, "message" => "ID tidak valid"]);
            exit;
        }
    
        $stmt = $conn->prepare("DELETE FROM toko WHERE id=?");
        $ok = $stmt->execute([$id]);
    
        echo json_encode([
            "status" => $ok,
            "message" => $ok ? "Toko berhasil dihapus" : "Gagal menghapus toko"
        ]);
        exit;
    }
    
    /* ================= DEFAULT ================= */
    echo json_encode([
        "status" => false,
        "message" => "Invalid action"
    ]);

} catch (Exception $e) {
    echo json_encode([
        "status" => false,
        "message" => "Server error: " . $e->getMessage()
    ]);
}