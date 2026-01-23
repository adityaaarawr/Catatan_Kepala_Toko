<?php
require_once "connect.php";

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

/* ======================================================
   GET ALL USER ROLE (UNTUK TABEL)
====================================================== */
if ($action === 'get') {
    // Menggunakan GROUP_CONCAT untuk mengambil semua permission dalam satu baris per role
    $sql = "SELECT 
                r.id, 
                r.nama_role, 
                GROUP_CONCAT(rk.role_key_name SEPARATOR ', ') as permissions
            FROM roles r
            LEFT JOIN transaksi_user_role tur ON r.id = tur.role_id
            LEFT JOIN role_key rk ON tur.role_key_id = rk.id
            GROUP BY r.id, r.nama_role
            ORDER BY r.id DESC";
            
    try {
        $stmt = $conn->query($sql);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["status" => true, "data" => $data]);
    } catch (Exception $e) {
        echo json_encode(["status" => false, "message" => $e->getMessage()]);
    }
    exit;
}

/* ======================================================
   GET ROLE DETAIL (UNTUK EDIT MODAL)
====================================================== */
if ($action === 'edit') {
    $role_id = $_GET['id'] ?? 0;

    $sql = "SELECT r.nama_role, tur.role_key_id
            FROM roles r
            LEFT JOIN transaksi_user_role tur ON tur.role_id = r.id
            WHERE r.id = ?";

    $stmt = $conn->prepare($sql);
    $stmt->execute([$role_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$rows) {
        echo json_encode(["status" => false, "message" => "Role tidak ditemukan"]);
        exit;
    }

    $keys = [];
    foreach ($rows as $row) {
        if (!empty($row['role_key_name'])) {
            $keys[] = (int)$row['role_key_name'];
        }
    }

    echo json_encode([
        "status" => true,
        "data" => [
            "id" => $role_id,
            "nama_role" => $rows[0]['nama_role'],
            "keys" => $keys
        ]
    ]);
    exit;
}

/* ======================================================
   GET ALL PERMISSIONS (UNTUK LIST CHECKBOX DI MODAL)
====================================================== */
if ($action === 'permissions') {
    $stmt = $conn->query("SELECT id, role_key_name FROM role_key ORDER BY role_key_name ASC");
    echo json_encode([
        "status" => true,
        "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)
    ]);
    exit;
}

/* ======================================================
   ADD USER ROLE
====================================================== */
if ($action === 'add') {
    $nama_role = $_POST['role_name'] ?? '';
    $keys      = $_POST['keys'] ?? []; // Pastikan dikirim sebagai array

    if (!$nama_role) {
        echo json_encode(["status"=>false,"message"=>"Nama role wajib diisi"]);
        exit;
    }

    $conn->beginTransaction();
    try {
        $stmt = $conn->prepare("INSERT INTO roles (role_name, created_at, created_by) VALUES (?)");
        $stmt->execute([$nama_role]);
        $role_id = $conn->lastInsertId();

        if (!empty($keys)) {
            foreach ($keys as $key) {
                try{
                    $stmt = $conn->prepare("INSERT INTO transaksi_user_role (role_id, role_key_name) VALUES (?, ?)");
                    $stmt->execute([$role_id, $key]);
                }catch(Exception $ex){
                    throw $ex;
                    exit;
                }
            }
        }else{
            throw new Exception("Key Is empty".json_encode($keys));
        }

        $conn->commit();
        echo json_encode(["status"=>true,"message"=>"Role berhasil ditambahkan"]);
    } catch (Exception $e) {
        $conn->rollBack();
        echo json_encode(["status"=>false,"message"=>$e->getMessage()]);
    }
    exit;
}

/* ======================================================
   EDIT USER ROLE
====================================================== */
if ($action === 'edit') {
    $role_id   = $_POST['role_id'] ?? 0;
    $nama_role = $_POST['nama_role'] ?? '';
    $keys      = $_POST['keys'] ?? [];

    if (!$role_id || !$nama_role) {
        echo json_encode(["status"=>false, "message"=>"Data tidak lengkap"]);
        exit;
    }

    $conn->beginTransaction();
    try {
        $conn->prepare("UPDATE roles SET nama_role=? WHERE id=?")->execute([$nama_role, $role_id]);
        
        // Hapus permission lama, lalu masukkan yang baru (Sync)
        $conn->prepare("DELETE FROM transaksi_user_role WHERE role_id=?")->execute([$role_id]);

        if (!empty($keys)) {
            $stmt = $conn->prepare("INSERT INTO transaksi_user_role (role_id, role_key_id) VALUES (?, ?)");
            foreach ($keys as $key) {
                $stmt->execute([$role_id, $key]);
            }
        }

        $conn->commit();
        echo json_encode(["status"=>true, "message"=>"Role berhasil diupdate"]);
    } catch (Exception $e) {
        $conn->rollBack();
        echo json_encode(["status"=>false, "message"=>$e->getMessage()]);
    }
    exit;
}

/* ======================================================
   DELETE USER ROLE
====================================================== */
if ($action === 'delete') {
    $id = $_POST['id'] ?? 0;

    $conn->beginTransaction();
    try {
        $conn->prepare("DELETE FROM transaksi_user_role WHERE role_id=?")->execute([$id]);
        $conn->prepare("DELETE FROM roles WHERE id=?")->execute([$id]);
        $conn->commit();
        echo json_encode(["status"=>true, "message"=>"Role berhasil dihapus"]);
    } catch (Exception $e) {
        $conn->rollBack();
        echo json_encode(["status"=>false, "message"=>$e->getMessage()]);
    }
    exit;
}