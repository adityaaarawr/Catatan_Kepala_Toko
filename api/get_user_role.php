<?php
require_once "connect.php";

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

try {
    // Cek koneksi database
    if (!$conn) {
        throw new Exception("Koneksi database gagal.");
    }

    /* ======================================================
       GET ALL USER ROLE (UNTUK TABEL)
    ====================================================== */
    if ($action === 'get') {
        try {
            // Menggunakan GROUP_CONCAT untuk mengambil semua permission dalam satu baris per role
            $sql = "SELECT
                r.id,
                r.role_name,
                r.created_at,
                r.created_by,
                GROUP_CONCAT(rk.role_key_name ORDER BY rk.role_key_name SEPARATOR ', ') AS permissions
            FROM roles r
            LEFT JOIN transaksi_user_role rk ON r.id = rk.role_id
            GROUP BY r.id, r.role_name, r.created_at, r.created_by;";
            
            $stmt = $conn->query($sql);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format ulang data untuk konsistensi dengan master.js
            $formattedData = [];
            foreach ($data as $row) {
                $formattedData[] = [
                    'id' => (int) $row['id'],
                    'role_name' => $row['role_name'],
                    'permissions' => $row['permissions'] ?? '',
                    'created_at' => $row['created_at'] ?? date('Y-m-d H:i:s'),
                    'username' => $row['c'] ?? 'admin'
                ];
            }
            
            echo json_encode([
                "status" => true, 
                "message" => "Data role berhasil diambil",
                "total" => count($formattedData),
                "data" => $formattedData
            ], JSON_NUMERIC_CHECK);

        } catch (Exception $e) {
            echo json_encode([
                "status" => false, 
                "message" => "Gagal mengambil data role: " . $e->getMessage()
            ]);
        }
        exit;
    }

    /* ======================================================
       GET ROLE DETAIL (UNTUK EDIT MODAL)
    ====================================================== */
    if ($action === 'detail') {
        $role_id = (int) ($_GET['id'] ?? 0);
        
        if (!$role_id) {
            echo json_encode([
                "status" => false, 
                "message" => "ID role tidak valid"
            ]);
            exit;
        }

        try {
            // Ambil data role
            $sql = "SELECT r.id, r.role_name, r.created_at, r.created_by
                    FROM roles r
                    WHERE r.id = ?";
                    
            $stmt = $conn->prepare($sql);
            $stmt->execute([$role_id]);
            $roleData = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$roleData) {
                echo json_encode([
                    "status" => false, 
                    "message" => "Role tidak ditemukan"
                ]);
                exit;
            }

            // Ambil semua keys yang dimiliki role ini
            $sql = "SELECT
                r.id,
                r.role_name,
                r.created_at,
                r.created_by,
                GROUP_CONCAT(rk.role_key_name ORDER BY rk.role_key_name SEPARATOR ', ') AS permissions
            FROM roles r
            LEFT JOIN transaksi_user_role rk ON r.id = rk.role_id
            GROUP BY r.id, r.role_name, r.created_at, r.created_by;";
                    
            $stmt = $conn->prepare($sql);
            $stmt->execute([$role_id]);
            $keys = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            echo json_encode([
                "status" => true,
                "message" => "Data role ditemukan",
                "data" => [
                    "id" => (int) $roleData['id'],
                    "role_name" => $roleData['role_name'],      
                    "created_at" => $roleData['created_at'],
                    "username" => $roleData['created_by'],
                    "permissions" => implode(', ', $keys),
                    "keys" => $keys
                ]
            ], JSON_NUMERIC_CHECK);
            
        } catch (Exception $e) {
            echo json_encode([
                "status" => false, 
                "message" => "Gagal mengambil detail role: " . $e->getMessage()
            ]);
        }
        exit;
    }

    /* ======================================================
       GET ALL PERMISSIONS (UNTUK LIST CHECKBOX DI MODAL)
    ====================================================== */
    if ($action === 'permissions') {
        try {
            $stmt = $conn->query("SELECT id, role_key_name FROM role_key ORDER BY role_key_name ASC");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                "status" => true,
                "message" => "Data permissions berhasil diambil",
                "data" => $data
            ], JSON_NUMERIC_CHECK);
        } catch (Exception $e) {
            echo json_encode([
                "status" => false,
                "message" => "Gagal mengambil data permissions: " . $e->getMessage()
            ]);
        }
        exit;
    }

    /* ======================================================
       ADD USER ROLE
    ====================================================== */
    if ($action === 'add') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            echo json_encode([
                "status" => false,
                "message" => "Invalid request method. Gunakan POST"
            ]);
            exit;
        }

        $role_name = trim($_POST['role_name'] ?? '');
        $keys = json_decode($_POST['keys'] ?? [], true);
        
        // Validasi input
        if (empty($role_name)) {
            echo json_encode([
                "status" => false,
                "message" => "Role name wajib diisi"
            ]);
            exit;
        }
        
        // Filter dan validasi keys
        $validKeys = [];
        foreach ($keys as $key) {
            if (!empty($key)) {
                $validKeys[] = $key;
            }
        }
        
        if (empty($validKeys)) {
            echo json_encode([
                "status" => false,
                "message" => "Pilih minimal satu permission"
            ]);
            exit;
        }

        $conn->beginTransaction();
        try {
            // Cek duplikasi nama role
            $checkStmt = $conn->prepare("SELECT id FROM roles WHERE role_name = ?");
            $checkStmt->execute([$role_name]);
            if ($checkStmt->rowCount() > 0) {
                throw new Exception("Nama role '$role_name' sudah digunakan");
            }

            // Insert role baru
            $username = $_SESSION['username'] ?? $_POST['username'] ?? 'admin';
            $stmt = $conn->prepare("INSERT INTO roles (role_name, created_at, created_by) VALUES (?, NOW(), ?)");
            $stmt->execute([$role_name, $username]);
            $role_id = $conn->lastInsertId();

            // Insert permissions
            if (!empty($validKeys)) {
                foreach ($validKeys as $keyName) {
                    // Cari key
                    $kkeyName = $keyName;
                    $keyStmt = $conn->prepare("SELECT id FROM role_key WHERE role_key_name = ?");
                    $keyStmt->execute([$keyName["key"]]);
                    $keyData = $keyStmt->fetch(PDO::FETCH_ASSOC);
                    
                    $stmt = $conn->prepare("
                        INSERT INTO transaksi_user_role (role_id, role_key_name)
                        VALUES (?, ?)
                    ");
                    $stmt->execute([$role_id, $kkeyName['key']]);

                }
            }

            $conn->commit();
            
            // Ambil data yang baru ditambahkan
            $sql = "SELECT
                r.id,
                r.role_name,
                r.created_at,
                r.created_by,
                GROUP_CONCAT(rk.role_key_name ORDER BY rk.role_key_name SEPARATOR ', ') AS permissions
            FROM roles r
            LEFT JOIN transaksi_user_role rk ON r.id = rk.role_id
            GROUP BY r.id, r.role_name, r.created_at, r.created_by;";
                    
            $getStmt = $conn->prepare($sql);
            $getStmt->execute();
            $newData = $getStmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode([
                "status" => true,
                "message" => "Role berhasil ditambahkan",
                "data" => [
                    'id' => (int) $newData['id'],
                    'role_name' => $newData['role_name'],
                    'permissions' => $newData['permissions'] ?? '',
                    'created_at' => $newData['created_at'],
                    'username' => $newData['created_by']
                ]
            ], JSON_NUMERIC_CHECK);
            
        } catch (Exception $e) {
            $conn->rollBack();
            echo json_encode([
                "status" => false,
                "message" => "Gagal menambahkan role: " . $e->getMessage()
            ]);
        }
        exit;
    }

    /* ======================================================
       EDIT USER ROLE
    ====================================================== */
    if ($action === 'edit') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            echo json_encode([
                "status" => false,
                "message" => "Invalid request method. Gunakan POST"
            ]);
            exit;
        }

        $role_id = (int) ($_POST['id'] ?? 0);
        $role_name = trim($_POST['role_name'] ?? $role_name ?? '');
        $keys = $_POST['keys'] ?? [];
        
        // Validasi input
        if (!$role_id) {
            echo json_encode([
                "status" => false,
                "message" => "ID role tidak valid"
            ]);
            exit;
        }

        if (empty($role_name)) {
            echo json_encode([
                "status" => false,
                "message" => "Nama role wajib diisi"
            ]);
            exit;
        }

        // Jika keys adalah string, konversi ke array
        if (is_string($keys)) {
            $keys = explode(',', $keys);
        }
        
        // Filter dan validasi keys
        $validKeys = [];
        foreach ($keys as $key) {
            $key = trim($key);
            if (!empty($key)) {
                $validKeys[] = $key;
            }
        }

        if (empty($validKeys)) {
            echo json_encode([
                "status" => false,
                "message" => "Pilih minimal satu permission"
            ]);
            exit;
        }

        $conn->beginTransaction();
        try {
            // Cek apakah role ada
            $checkStmt = $conn->prepare("SELECT id FROM roles WHERE id = ?");
            $checkStmt->execute([$role_id]);
            if ($checkStmt->rowCount() === 0) {
                throw new Exception("Role tidak ditemukan");
            }

            // Cek duplikasi nama role (kecuali untuk role yang sama)
            $checkNameStmt = $conn->prepare("SELECT id FROM roles WHERE role_name = ? AND id != ?");
            $checkNameStmt->execute([$role_name, $role_id]);
            if ($checkNameStmt->rowCount() > 0) {
                throw new Exception("Nama role '$role_name' sudah digunakan");
            }

            // Update nama role
            $updateStmt = $conn->prepare("UPDATE roles SET role_name = ? WHERE id = ?");
            $updateStmt->execute([$role_name, $role_id]);
                    
            // Hapus permission lama
            $deleteStmt = $conn->prepare("DELETE FROM transaksi_user_role WHERE role_id = ?");
            $deleteStmt->execute([$role_id]);

            // Insert permissions baru  
            if (!empty($validKeys)) {
                // Cari ID untuk setiap key
                foreach ($validKeys as $keyName) {
                    // Cek apakah key ada di tabel role_key
                    $keyStmt = $conn->prepare("SELECT id FROM role_key WHERE role_key_name = ?");
                    $keyStmt->execute([$keyName]);
                    $keyData = $keyStmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($keyData) {
                        $insertStmt = $conn->prepare("INSERT INTO transaksi_user_role (role_id, role_key_name) VALUES (?, ?)");
                        $insertStmt->execute([$role_id, $keyData['id']]);
                    } else {
                        // Jika key tidak ditemukan, insert dulu ke role_key
                        $insertKeyStmt = $conn->prepare("INSERT INTO role_key (role_key_name) VALUES (?)");
                        $insertKeyStmt->execute([$keyName]);
                        $keyId = $conn->lastInsertId();
                        
                        $insertStmt = $conn->prepare("INSERT INTO transaksi_user_role (role_id, role_key_name) VALUES (?, ?)");
                        $insertStmt->execute([$role_id, $keyId]);
                    }
                }
            }

            $conn->commit();
            
            // Ambil data yang sudah diupdate
            $sql = "SELECT
                r.id,
                r.role_name,
                r.created_at,
                r.created_by,
                GROUP_CONCAT(rk.role_key_name ORDER BY rk.role_key_name SEPARATOR ', ') AS permissions
            FROM roles r
            LEFT JOIN transaksi_user_role rk ON r.id = rk.role_id
            GROUP BY r.id, r.role_name, r.created_at, r.created_by;";
                        
            $getStmt = $conn->prepare($sql);
            $getStmt->execute([$role_id]);
            $updatedData = $getStmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode([
                "status" => true,
                "message" => "Role berhasil diupdate",
                "data" => [
                    'id' => (int) $updatedData['id'],
                    'role_name' => $updatedData['role_name'],
                    'permissions' => $updatedData['permissions'] ?? '',
                    'created_at' => $updatedData['created_at'],
                    'created_by' => $updatedData['created_by']
                ]
            ], JSON_NUMERIC_CHECK);
            
        } catch (Exception $e) {
            $conn->rollBack();
            echo json_encode([
                "status" => false,
                "message" => "Gagal mengupdate role: " . $e->getMessage()
            ]);
        }
        exit;
    }

    /* ======================================================
       DELETE USER ROLE
    ====================================================== */
    if ($action === 'delete') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            echo json_encode([
                "status" => false,
                "message" => "Invalid request method. Gunakan POST"
            ]);
            exit;
        }

        $id = (int) ($_POST['id'] ?? 0);
        
        if (!$id) {
            echo json_encode([
                "status" => false,
                "message" => "ID role tidak valid"
            ]);
            exit;
        }

        $conn->beginTransaction();
        try {
            // Cek apakah role ada
            $checkStmt = $conn->prepare("SELECT id FROM roles WHERE id = ?");
            $checkStmt->execute([$id]);
            if ($checkStmt->rowCount() === 0) {
                throw new Exception("Role tidak ditemukan");
            }

            // Hapus dulu dari transaksi_user_role (foreign key constraint)
            $deleteTransStmt = $conn->prepare("DELETE FROM transaksi_user_role WHERE role_id = ?");
            $deleteTransStmt->execute([$id]);
            
            // Kemudian hapus dari roles
            $deleteRoleStmt = $conn->prepare("DELETE FROM roles WHERE id = ?");
            $deleteRoleStmt->execute([$id]);

            $conn->commit();
            
            echo json_encode([
                "status" => true,
                "message" => "Role berhasil dihapus"
            ]);
            
        } catch (Exception $e) {
            $conn->rollBack();
            // Cek jika ada foreign key constraint violation
            if (strpos($e->getMessage(), 'foreign key constraint') !== false) {
                echo json_encode([
                    "status" => false,
                    "message" => "Tidak dapat menghapus role karena masih digunakan oleh user"
                ]);
            } else {
                echo json_encode([
                    "status" => false,
                    "message" => "Gagal menghapus role: " . $e->getMessage()
                ]);
            }
        }
        exit;
    }

    /* ======================================================
       DEFAULT RESPONSE
    ====================================================== */
    echo json_encode([
        "status" => false,
        "message" => "Invalid action",
        "available_actions" => ["get", "detail", "permissions", "add", "edit", "delete"]
    ]);

} catch (Throwable $e) {
    echo json_encode([
        "status" => false,
        "message" => "Server error",
        "error" => $e->getMessage()
    ]);
}