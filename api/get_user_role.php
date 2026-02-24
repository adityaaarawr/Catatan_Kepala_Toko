<?php
session_start();
require_once "connect.php";

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

// Ambil username dari session untuk kolom username di transaksi_user_role
$sessionUsername = $_SESSION['username'] ?? $_SESSION['nama'] ?? $_SESSION['user_name'] ?? null;

try {
    if (!$conn) {
        throw new Exception("Koneksi database gagal.");
    }

    /* ======================================================
       GET ALL USER ROLE (UNTUK TABEL)
    ====================================================== */
    if ($action === 'get') {
        try {
            // Query dengan DISTINCT untuk hindari duplikat
            // Handle data campuran: role_key_name bisa berisi ID integer ATAU string nama key
            $sql = "
                SELECT
                    r.id,
                    r.role_name,
                    r.created_at,
                    u.username,
                    GROUP_CONCAT(DISTINCT rk.role_key_name ORDER BY rk.role_key_name SEPARATOR ', ') AS permissions
                FROM roles r
                LEFT JOIN users u ON r.created_by = u.id
                LEFT JOIN (
                    SELECT DISTINCT role_id, role_key_name FROM transaksi_user_role
                ) tur ON r.id = tur.role_id
                LEFT JOIN role_key rk ON (
                    tur.role_key_name = CAST(rk.id AS CHAR)
                    OR tur.role_key_name = rk.role_key_name
                ) AND rk.id >= 3
                GROUP BY r.id, r.role_name, r.created_at, u.username
                ORDER BY r.id ASC
            ";

            $stmt = $conn->query($sql);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $formattedData = [];
            foreach ($data as $row) {
                $formattedData[] = [
                    'id'          => (int) $row['id'],
                    'role_name'   => $row['role_name'],
                    'permissions' => $row['permissions'] ?? '',
                    'created_at'  => $row['created_at'] ?? '',
                    'username'    => $row['username'] ?? '-'
                ];
            }

            echo json_encode([
                "status"  => true,
                "message" => "Data role berhasil diambil",
                "total"   => count($formattedData),
                "data"    => $formattedData
            ], JSON_NUMERIC_CHECK);

        } catch (Exception $e) {
            echo json_encode(["status" => false, "message" => "Gagal mengambil data role: " . $e->getMessage()]);
        }
        exit;
    }

    /* ======================================================
       GET ROLE DETAIL (UNTUK EDIT MODAL)
    ====================================================== */
    if ($action === 'detail') {
        $role_id = (int) ($_GET['id'] ?? 0);

        if (!$role_id) {
            echo json_encode(["status" => false, "message" => "ID role tidak valid"]);
            exit;
        }

        try {
            // Ambil info role + username pembuat
            $stmt = $conn->prepare("
                SELECT r.id, r.role_name, r.created_at, u.username
                FROM roles r
                LEFT JOIN users u ON r.created_by = u.id
                WHERE r.id = ?
            ");
            $stmt->execute([$role_id]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$data) throw new Exception("Role tidak ditemukan");

            // Ambil permission keys dengan handle mixed data (ID integer atau string nama)
            // Gunakan subquery DISTINCT untuk hindari duplikat akibat OR double-match
            $permStmt = $conn->prepare("
                SELECT DISTINCT rk.role_key_name
                FROM (
                    SELECT DISTINCT role_key_name FROM transaksi_user_role WHERE role_id = ?
                ) tur
                JOIN role_key rk ON (
                    tur.role_key_name = CAST(rk.id AS CHAR)
                    OR tur.role_key_name = rk.role_key_name
                )
                WHERE rk.id >= 3
                ORDER BY rk.role_key_name ASC
            ");
            $permStmt->execute([$role_id]);
            $permRows = $permStmt->fetchAll(PDO::FETCH_COLUMN);

            // Ambil nilai per key (scope toko, expiry, bool)
            // Pakai subquery DISTINCT untuk hindari double-match dari OR condition
            $valStmt = $conn->prepare("
                SELECT 
                    rk.role_key_name,
                    tur.key_value_bool,
                    tur.key_value_string,
                    tur.key_value_datetime
                FROM (
                    SELECT DISTINCT role_key_name, key_value_bool, key_value_string, key_value_datetime
                    FROM transaksi_user_role
                    WHERE role_id = ?
                ) tur
                JOIN role_key rk ON (
                    tur.role_key_name = CAST(rk.id AS CHAR)
                    OR tur.role_key_name = rk.role_key_name
                )
                GROUP BY rk.role_key_name
            ");
            $valStmt->execute([$role_id]);
            $valRows = $valStmt->fetchAll(PDO::FETCH_ASSOC);

            $keyValues = [];
            foreach ($valRows as $vr) {
                $keyValues[strtolower($vr['role_key_name'])] = [
                    'bool'     => $vr['key_value_bool'],
                    'string'   => $vr['key_value_string'],
                    'datetime' => $vr['key_value_datetime'],
                ];
            }

            echo json_encode([
                "status"  => true,
                "message" => "Data role ditemukan",
                "data"    => [
                    "id"          => (int) $data['id'],
                    "role_name"   => $data['role_name'],
                    "created_at"  => $data['created_at'],
                    "username"    => $data['username'] ?? '-',
                    "permissions" => implode(',', $permRows),
                    "key_values"  => $keyValues,
                ]
            ], JSON_NUMERIC_CHECK);

        } catch (Exception $e) {
            echo json_encode(["status" => false, "message" => "Gagal mengambil detail role: " . $e->getMessage()]);
        }
        exit;
    }

    /* ======================================================
       GET ALL PERMISSIONS (UNTUK LIST CHECKBOX DI MODAL)
       Hanya ambil id >= 3 (exclude enable=1, expiration_date=2)
    ====================================================== */
    if ($action === 'permissions') {
        try {
            $stmt = $conn->query("
                SELECT id, role_key_name 
                FROM role_key 
                WHERE id >= 3 
                ORDER BY id ASC
            ");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                "status"  => true,
                "message" => "Data permissions berhasil diambil",
                "data"    => $data
            ], JSON_NUMERIC_CHECK);
        } catch (Exception $e) {
            echo json_encode(["status" => false, "message" => "Gagal mengambil data permissions: " . $e->getMessage()]);
        }
        exit;
    }

    /* ======================================================
       ADD USER ROLE
    ====================================================== */
    if ($action === 'add') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            echo json_encode(["status" => false, "message" => "Invalid request method. Gunakan POST"]);
            exit;
        }

        $role_name = trim($_POST['role_name'] ?? '');
        $keys = json_decode($_POST['keys'] ?? '[]', true) ?? [];

        if (empty($role_name)) {
            echo json_encode(["status" => false, "message" => "Role name wajib diisi"]);
            exit;
        }

        // Normalisasi key names dari [{key:..., value:...}]
        $validKeyNames = [];
        foreach ($keys as $k) {
            $keyName = is_array($k) ? trim($k['key'] ?? '') : trim($k);
            if (!empty($keyName)) $validKeyNames[] = $keyName;
        }

        // Deduplikasi untuk pastikan tidak ada key yang dobel masuk ke DB
        $validKeyNames = array_values(array_unique($validKeyNames));

        // Sort berdasarkan urutan role_key.id agar INSERT ke DB berurutan
        $sortStmt = $conn->query("SELECT role_key_name FROM role_key ORDER BY id ASC");
        $orderedKeys = $sortStmt->fetchAll(PDO::FETCH_COLUMN);
        $validKeyNames = array_values(array_filter($orderedKeys, function($k) use ($validKeyNames) {
            return in_array($k, $validKeyNames);
        }));

        if (empty($validKeyNames)) {
            echo json_encode(["status" => false, "message" => "Pilih minimal satu permission"]);
            exit;
        }

        $conn->beginTransaction();
        try {
            // Cek duplikasi nama role
            $checkStmt = $conn->prepare("SELECT id FROM roles WHERE role_name = ?");
            $checkStmt->execute([$role_name]);
            if ($checkStmt->rowCount() > 0) throw new Exception("Nama role '$role_name' sudah digunakan");

            // Insert role - pakai session user_id, fallback ke POST user_id (dikirim dari JS currentUserId)
            $userId = $_SESSION['user_id'] ?? ($_POST['user_id'] ?? null);
            $stmt = $conn->prepare("INSERT INTO roles (role_name, created_at, created_by) VALUES (?, NOW(), ?)");
            $stmt->execute([$role_name, $userId]);
            $role_id = $conn->lastInsertId();

            // Ambil key_values dari POST (JSON: {key_name: {bool, string, datetime}})
            $keyValues = json_decode($_POST['key_values'] ?? '{}', true) ?? [];

            // Insert permissions dengan nilai
            foreach ($validKeyNames as $keyName) {
                $rkStmt = $conn->prepare("SELECT id FROM role_key WHERE role_key_name = ?");
                $rkStmt->execute([$keyName]);
                $rkData = $rkStmt->fetch(PDO::FETCH_ASSOC);
                if ($rkData) {
                    $kv      = $keyValues[strtolower($keyName)] ?? [];
                    // key_value_bool untuk update_toko (boolean+string) dan manage_user (boolean only)
                    // Key scope lain tidak pakai bool → NULL
                    $isBoolKey = in_array(strtolower($keyName), ['update_toko', 'manage_user']);
                    $boolVal = $isBoolKey
                        ? (isset($kv['bool']) ? (int)(bool)$kv['bool'] : 1)
                        : null;
                    // manage_user: boolean only, string selalu NULL
                    // key lain: ambil string dari kv
                    $strVal  = (strtolower($keyName) === 'manage_user')
                        ? null
                        : ((array_key_exists('string', $kv) && $kv['string'] !== '' && $kv['string'] !== null) ? $kv['string'] : null);
                    $dtVal   = isset($kv['datetime']) && $kv['datetime'] !== '' ? $kv['datetime'] : null;

                    $insStmt = $conn->prepare("
                        INSERT INTO transaksi_user_role 
                            (role_id, role_key_name, key_value_bool, key_value_string, key_value_datetime, created_at, username) 
                        VALUES (?, ?, ?, ?, ?, NOW(), ?)
                    ");
                    $insStmt->execute([$role_id, $rkData['id'], $boolVal, $strVal, $dtVal, $sessionUsername]);
                }
            }

            $conn->commit();
            echo json_encode([
                "status"  => true,
                "message" => "Role '$role_name' berhasil ditambahkan",
                "data"    => ["id" => (int) $role_id, "role_name" => $role_name]
            ]);

        } catch (Exception $e) {
            $conn->rollBack();
            echo json_encode(["status" => false, "message" => "Gagal menambahkan role: " . $e->getMessage()]);
        }
        exit;
    }

    /* ======================================================
       EDIT USER ROLE
    ====================================================== */
    if ($action === 'edit') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            echo json_encode(["status" => false, "message" => "Invalid request method. Gunakan POST"]);
            exit;
        }

        $role_id   = (int) ($_POST['id'] ?? 0);
        $role_name = trim($_POST['role_name'] ?? '');
        $keysRaw   = $_POST['keys'] ?? '[]';

        if (is_string($keysRaw)) {
            $keys = json_decode($keysRaw, true) ?? [];
        } else {
            $keys = $keysRaw;
        }

        if (!$role_id) {
            echo json_encode(["status" => false, "message" => "ID role tidak valid"]);
            exit;
        }
        if (empty($role_name)) {
            echo json_encode(["status" => false, "message" => "Nama role wajib diisi"]);
            exit;
        }

        // Normalisasi key names
        $validKeyNames = [];
        foreach ($keys as $k) {
            $keyName = is_array($k) ? trim($k['key'] ?? '') : trim($k);
            if (!empty($keyName)) $validKeyNames[] = $keyName;
        }

        // Deduplikasi untuk pastikan tidak ada key yang dobel masuk ke DB
        $validKeyNames = array_values(array_unique($validKeyNames));

        // Sort berdasarkan urutan role_key.id agar INSERT ke DB berurutan
        $sortStmt = $conn->query("SELECT role_key_name FROM role_key ORDER BY id ASC");
        $orderedKeys = $sortStmt->fetchAll(PDO::FETCH_COLUMN);
        $validKeyNames = array_values(array_filter($orderedKeys, function($k) use ($validKeyNames) {
            return in_array($k, $validKeyNames);
        }));

        if (empty($validKeyNames)) {
            echo json_encode(["status" => false, "message" => "Pilih minimal satu permission"]);
            exit;
        }

        $conn->beginTransaction();
        try {
            $checkStmt = $conn->prepare("SELECT id FROM roles WHERE id = ?");
            $checkStmt->execute([$role_id]);
            if ($checkStmt->rowCount() === 0) throw new Exception("Role tidak ditemukan");

            $checkNameStmt = $conn->prepare("SELECT id FROM roles WHERE role_name = ? AND id != ?");
            $checkNameStmt->execute([$role_name, $role_id]);
            if ($checkNameStmt->rowCount() > 0) throw new Exception("Nama role '$role_name' sudah digunakan");

            // Update nama
            $conn->prepare("UPDATE roles SET role_name = ? WHERE id = ?")->execute([$role_name, $role_id]);

            // Hapus permission lama
            $conn->prepare("DELETE FROM transaksi_user_role WHERE role_id = ?")->execute([$role_id]);

            // Ambil key_values dari POST
            $keyValues = json_decode($_POST['key_values'] ?? '{}', true) ?? [];

            // Insert permission baru dengan nilai
            foreach ($validKeyNames as $keyName) {
                $rkStmt = $conn->prepare("SELECT id FROM role_key WHERE role_key_name = ?");
                $rkStmt->execute([$keyName]);
                $rkData = $rkStmt->fetch(PDO::FETCH_ASSOC);
                if ($rkData) {
                    $kv      = $keyValues[strtolower($keyName)] ?? [];
                    // key_value_bool untuk update_toko (boolean+string) dan manage_user (boolean only)
                    // Key scope lain tidak pakai bool → NULL
                    $isBoolKey = in_array(strtolower($keyName), ['update_toko', 'manage_user']);
                    $boolVal = $isBoolKey
                        ? (isset($kv['bool']) ? (int)(bool)$kv['bool'] : 1)
                        : null;
                    // manage_user: boolean only, string selalu NULL
                    // key lain: ambil string dari kv
                    $strVal  = (strtolower($keyName) === 'manage_user')
                        ? null
                        : ((array_key_exists('string', $kv) && $kv['string'] !== '' && $kv['string'] !== null) ? $kv['string'] : null);
                    $dtVal   = isset($kv['datetime']) && $kv['datetime'] !== '' ? $kv['datetime'] : null;

                    $insStmt = $conn->prepare("
                        INSERT INTO transaksi_user_role 
                            (role_id, role_key_name, key_value_bool, key_value_string, key_value_datetime, created_at, username) 
                        VALUES (?, ?, ?, ?, ?, NOW(), ?)
                    ");
                    $insStmt->execute([$role_id, $rkData['id'], $boolVal, $strVal, $dtVal, $sessionUsername]);
                }
            }

            $conn->commit();

            // Return data terbaru (handle mixed key format integer/string)
            $getStmt = $conn->prepare("
                SELECT r.id, r.role_name, r.created_at, u.username,
                    GROUP_CONCAT(DISTINCT rk.role_key_name ORDER BY rk.role_key_name SEPARATOR ', ') AS permissions
                FROM roles r
                LEFT JOIN users u ON r.created_by = u.id
                LEFT JOIN (
                    SELECT DISTINCT role_id, role_key_name FROM transaksi_user_role
                ) tur ON r.id = tur.role_id
                LEFT JOIN role_key rk ON (
                    tur.role_key_name = CAST(rk.id AS CHAR)
                    OR tur.role_key_name = rk.role_key_name
                ) AND rk.id >= 3
                WHERE r.id = ?
                GROUP BY r.id
            ");
            $getStmt->execute([$role_id]);
            $updated = $getStmt->fetch(PDO::FETCH_ASSOC);

            echo json_encode([
                "status"  => true,
                "message" => "Role berhasil diupdate",
                "data"    => [
                    'id'          => (int) $updated['id'],
                    'role_name'   => $updated['role_name'],
                    'permissions' => $updated['permissions'] ?? '',
                    'created_at'  => $updated['created_at'],
                    'username'    => $updated['username'] ?? '-'
                ]
            ], JSON_NUMERIC_CHECK);

        } catch (Exception $e) {
            $conn->rollBack();
            echo json_encode(["status" => false, "message" => "Gagal mengupdate role: " . $e->getMessage()]);
        }
        exit;
    }

    /* ======================================================
       DELETE USER ROLE
    ====================================================== */
    if ($action === 'delete') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            echo json_encode(["status" => false, "message" => "Invalid request method. Gunakan POST"]);
            exit;
        }

        $id = (int) ($_POST['id'] ?? 0);
        if (!$id) {
            echo json_encode(["status" => false, "message" => "ID role tidak valid"]);
            exit;
        }

        $conn->beginTransaction();
        try {
            $checkStmt = $conn->prepare("SELECT id FROM roles WHERE id = ?");
            $checkStmt->execute([$id]);
            if ($checkStmt->rowCount() === 0) throw new Exception("Role tidak ditemukan");

            $conn->prepare("DELETE FROM transaksi_user_role WHERE role_id = ?")->execute([$id]);
            $conn->prepare("DELETE FROM roles WHERE id = ?")->execute([$id]);

            $conn->commit();
            echo json_encode(["status" => true, "message" => "Role berhasil dihapus"]);

        } catch (Exception $e) {
            $conn->rollBack();
            $msg = strpos($e->getMessage(), 'foreign key') !== false
                ? "Tidak dapat menghapus role karena masih digunakan oleh user"
                : "Gagal menghapus role: " . $e->getMessage();
            echo json_encode(["status" => false, "message" => $msg]);
        }
        exit;
    }

    echo json_encode([
        "status"            => false,
        "message"           => "Invalid action",
        "available_actions" => ["get", "detail", "permissions", "add", "edit", "delete"]
    ]);

} catch (Throwable $e) {
    echo json_encode(["status" => false, "message" => "Server error: " . $e->getMessage()]);
}