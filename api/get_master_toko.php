<?php
require_once "connect.php";

header("Content-Type: application/json");

$action = $_GET['action'] ?? '';

try {
    // Cek koneksi database
    if (!$conn) {
        throw new Exception("Koneksi database gagal.");
    }

    /* ================= GET TOKO ================= */
    if ($action === 'get') {
        $stmt = $conn->prepare("
            SELECT id, created_at, username, nama_toko, lokasi, kode
            FROM toko
            ORDER BY id DESC
        ");
    
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
        echo json_encode([
            "status" => true,
            "total"  => count($data),
            "data"   => $data
        ], JSON_NUMERIC_CHECK);
        exit;
    }

    /* ================= DETAIL TOKO ================= */
    if ($action === 'detail') {
        $id = (int) ($_GET['id'] ?? 0);

        if (!$id) {
            echo json_encode([
                "status" => false,
                "message" => "ID tidak valid"
            ]);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT id, created_at, username, nama_toko, lokasi, kode 
            FROM toko 
            WHERE id = ?
        ");

        $stmt->execute([$id]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => true,
            "data"   => $data
        ], JSON_NUMERIC_CHECK);
        exit;
    }

    /* ================= ADD TOKO ================= */
    if ($action === 'add') {
        // Ambil data dari POST
        $nama_toko = trim($_POST['nama_toko'] ?? '');
        $kode      = trim($_POST['kode'] ?? '');
        $lokasi    = trim($_POST['lokasi'] ?? '');
        
        // Gunakan username dari session atau default
        session_start();
        $username = $_SESSION['username'] ?? $_POST['username'] ?? 'admin';

        // Validasi input
        if (empty($nama_toko) || empty($kode) || empty($lokasi)) {
            echo json_encode([
                "status" => false,
                "message" => "Nama toko, kode, dan lokasi wajib diisi"
            ]);
            exit;
        }

        try {
            // Cek duplikasi kode toko
            $checkStmt = $conn->prepare("SELECT id FROM toko WHERE kode = ?");
            $checkStmt->execute([$kode]);
            if ($checkStmt->rowCount() > 0) {
                echo json_encode([
                    "status" => false,
                    "message" => "Kode toko sudah digunakan"
                ]);
                exit;
            }

            // Insert data toko
            $stmt = $conn->prepare("
                INSERT INTO toko (created_at, username, nama_toko, lokasi, kode) 
                VALUES (NOW(), ?, ?, ?, ?)
            ");

            $ok = $stmt->execute([$username, $nama_toko, $lokasi, $kode]);

            if ($ok) {
                $lastId = $conn->lastInsertId();
                
                // Ambil data yang baru saja diinsert untuk dikembalikan
                $getStmt = $conn->prepare("
                    SELECT id, created_at, username, nama_toko, lokasi, kode
                    FROM toko 
                    WHERE id = ?
                ");
                $getStmt->execute([$lastId]);
                $newData = $getStmt->fetch(PDO::FETCH_ASSOC);

                echo json_encode([
                    "status" => true,
                    "message" => "Toko berhasil ditambahkan",
                    "data" => $newData
                ], JSON_NUMERIC_CHECK);
            } else {
                echo json_encode([
                    "status" => false,
                    "message" => "Gagal menambahkan toko"
                ]);
            }

        } catch (PDOException $e) {
            // Cek jika error duplicate entry
            if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
                echo json_encode([
                    "status" => false,
                    "message" => "Data toko sudah ada (duplikat)"
                ]);
            } else {
                echo json_encode([
                    "status" => false,
                    "message" => "Database error",
                    "error" => $e->getMessage()
                ]);
            }
        }
        exit;
    }

    /* ================= EDIT TOKO ================= */
    if ($action === 'edit') {
        $id        = (int) ($_POST['id'] ?? 0);
        $nama_toko = trim($_POST['nama_toko'] ?? '');
        $lokasi    = trim($_POST['lokasi'] ?? '');
        $kode      = trim($_POST['kode'] ?? '');
    
        // Validasi input
        if (!$id) {
            echo json_encode([
                "status" => false,
                "message" => "ID toko tidak valid"
            ]);
            exit;
        }

        if (empty($nama_toko) || empty($kode) || empty($lokasi)) {
            echo json_encode([
                "status" => false,
                "message" => "Nama toko, kode, dan lokasi wajib diisi"
            ]);
            exit;
        }
    
        try {
            // Cek apakah ID toko ada
            $checkStmt = $conn->prepare("SELECT id FROM toko WHERE id = ?");
            $checkStmt->execute([$id]);
            if ($checkStmt->rowCount() === 0) {
                echo json_encode([
                    "status" => false,
                    "message" => "Toko tidak ditemukan"
                ]);
                exit;
            }

            // Cek duplikasi kode (kecuali untuk toko yang sama)
            $checkCodeStmt = $conn->prepare("SELECT id FROM toko WHERE kode = ? AND id != ?");
            $checkCodeStmt->execute([$kode, $id]);
            if ($checkCodeStmt->rowCount() > 0) {
                echo json_encode([
                    "status" => false,
                    "message" => "Kode toko sudah digunakan oleh toko lain"
                ]);
                exit;
            }
    
            // Update data toko
            $stmt = $conn->prepare("
                UPDATE toko 
                SET nama_toko = ?, lokasi = ?, kode = ?
                WHERE id = ?
            ");
    
            $ok = $stmt->execute([$nama_toko, $lokasi, $kode, $id]);
    
            if ($ok) {
                // Ambil data yang sudah diupdate
                $getStmt = $conn->prepare("
                    SELECT id, created_at, username, nama_toko, lokasi, kode
                    FROM toko 
                    WHERE id = ?
                ");
                $getStmt->execute([$id]);
                $updatedData = $getStmt->fetch(PDO::FETCH_ASSOC);

                echo json_encode([
                    "status" => true,
                    "message" => "Toko berhasil diupdate",
                    "data" => $updatedData
                ], JSON_NUMERIC_CHECK);
            } else {
                echo json_encode([
                    "status" => false,
                    "message" => "Gagal update toko"
                ]);
            }
        } catch (PDOException $e) {
            echo json_encode([
                "status" => false,
                "message" => "Database error",
                "error" => $e->getMessage()
            ]);
        }
        exit;
    }

    /* ================= DELETE TOKO ================= */
    if ($action === 'delete') {
        $id = (int) ($_POST['id'] ?? 0);

        if (!$id) {
            echo json_encode([
                "status" => false,
                "message" => "ID tidak valid"
            ]);
            exit;
        }

        try {
            // Cek apakah toko memiliki relasi dengan tabel lain
            // (Optional: tambahkan pengecekan foreign key constraint)
            
            $stmt = $conn->prepare("DELETE FROM toko WHERE id = ?");
            $ok = $stmt->execute([$id]);

            if ($ok && $stmt->rowCount() > 0) {
                echo json_encode([
                    "status" => true,
                    "message" => "Toko berhasil dihapus"
                ]);
            } else {
                echo json_encode([
                    "status" => false,
                    "message" => "Toko tidak ditemukan atau gagal dihapus"
                ]);
            }
        } catch (PDOException $e) {
            // Jika ada foreign key constraint violation
            if (strpos($e->getMessage(), 'foreign key constraint') !== false) {
                echo json_encode([
                    "status" => false,
                    "message" => "Tidak dapat menghapus toko karena masih memiliki data terkait"
                ]);
            } else {
                echo json_encode([
                    "status" => false,
                    "message" => "Database error",
                    "error" => $e->getMessage()
                ]);
            }
        }
        exit;
    }

    /* ================= DEFAULT RESPONSE ================= */
    echo json_encode([
        "status" => false,
        "message" => "Invalid action",
        "available_actions" => ["get", "detail", "add", "edit", "delete"]
    ]);

} catch (Throwable $e) {
    echo json_encode([
        "status" => false,
        "message" => "Server error",
        "error"   => $e->getMessage()
    ]);
}