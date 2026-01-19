<?php
require_once "config.php";

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

/* ======================================================
   GET ALL USER ROLE (UNTUK TABEL)
====================================================== */
if ($action === 'get') {

    $sql = "
        SELECT 
            r.id AS role_id,
            r.nama_role,
            rk.role_key_name
        FROM roles r
        LEFT JOIN transaksi_user_role tur ON tur.role_id = r.id
        LEFT JOIN role_key rk ON rk.id = tur.role_key_id
        ORDER BY r.id ASC
    ";

    $stmt = $conn->query($sql);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $roles = [];

    foreach ($rows as $row) {
        $id = $row['role_id'];

        if (!isset($roles[$id])) {
            $roles[$id] = [
                "id" => $id,
                "nama_role" => $row['nama_role'],
                "permissions" => []
            ];
        }

        if (!empty($row['role_key_name'])) {
            $roles[$id]['permissions'][] = $row['role_key_name'];
        }
    }

    echo json_encode([
        "status" => true,
        "data" => array_values($roles)
    ]);
    exit;
}


/* ======================================================
   GET ROLE DETAIL (UNTUK EDIT MODAL)
====================================================== */
if ($action === 'detail') {

    $role_id = $_GET['id'] ?? 0;

    $sql = "
        SELECT 
            r.nama_role,
            tur.role_key_id
        FROM roles r
        LEFT JOIN transaksi_user_role tur ON tur.role_id = r.id
        WHERE r.id = ?
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([$role_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$rows) {
        echo json_encode(["status" => false, "message" => "Role tidak ditemukan"]);
        exit;
    }

    $keys = [];
    foreach ($rows as $row) {
        if (!empty($row['role_key_id'])) {
            $keys[] = $row['role_key_id'];
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
   GET ALL PERMISSIONS (UNTUK CHECKBOX LIST)
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

    $nama_role = $_POST['nama_role'] ?? '';
    $keys      = $_POST['keys'] ?? [];

    if (!$nama_role) {
        echo json_encode(["status"=>false,"message"=>"Nama role wajib diisi"]);
        exit;
    }

    $conn->beginTransaction();

    try {

        $stmt = $conn->prepare("INSERT INTO roles (nama_role) VALUES (?)");
        $stmt->execute([$nama_role]);
        $role_id = $conn->lastInsertId();

        if (!empty($keys)) {
            $stmt = $conn->prepare("INSERT INTO transaksi_user_role (role_id, role_key_id) VALUES (?, ?)");
            foreach ($keys as $key) {
                $stmt->execute([$role_id, $key]);
            }
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
        echo json_encode(["status"=>false,"message"=>"Data tidak lengkap"]);
        exit;
    }

    $conn->beginTransaction();

    try {

        $conn->prepare("UPDATE roles SET nama_role=? WHERE id=?")
             ->execute([$nama_role, $role_id]);

        $conn->prepare("DELETE FROM transaksi_user_role WHERE role_id=?")
             ->execute([$role_id]);

        if (!empty($keys)) {
            $stmt = $conn->prepare("INSERT INTO transaksi_user_role (role_id, role_key_id) VALUES (?, ?)");
            foreach ($keys as $key) {
                $stmt->execute([$role_id, $key]);
            }
        }

        $conn->commit();
        echo json_encode(["status"=>true,"message"=>"Role berhasil diupdate"]);

    } catch (Exception $e) {

        $conn->rollBack();
        echo json_encode(["status"=>false,"message"=>$e->getMessage()]);
    }
    exit;
}


/* ======================================================
   DELETE USER ROLE
====================================================== */
if ($action === 'delete') {

    $id = $_POST['id'] ?? 0;

    if (!$id) {
        echo json_encode(["status"=>false,"message"=>"ID tidak valid"]);
        exit;
    }

    $conn->beginTransaction();

    try {

        $conn->prepare("DELETE FROM transaksi_user_role WHERE role_id=?")->execute([$id]);
        $conn->prepare("DELETE FROM roles WHERE id=?")->execute([$id]);

        $conn->commit();
        echo json_encode(["status"=>true,"message"=>"Role berhasil dihapus"]);

    } catch (Exception $e) {

        $conn->rollBack();
        echo json_encode(["status"=>false,"message"=>$e->getMessage()]);
    }
    exit;
}


/* ======================================================
   DEFAULT
====================================================== */
echo json_encode(["status"=>false,"message"=>"Invalid action"]);
exit;
