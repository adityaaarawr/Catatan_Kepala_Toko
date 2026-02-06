<?php
require_once "connect.php";
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

try {
    // Cek koneksi database
    if (!$conn) {
        throw new Exception("Koneksi database gagal.");
    }

    /* ================= GET ALL TOPIK ================= */
    if ($action === 'get') {
        try {
            $sql = "SELECT 
                        tp.id,
                        tp.created_at,
                        tp.username,
                        tp.nama_topik,
                        tp.toko_id,
                        t.nama_toko,
                        tp.divisi_id,
                        d.nama_divisi
                    FROM topik tp
                    LEFT JOIN toko t ON tp.toko_id = t.id
                    LEFT JOIN divisi d ON tp.divisi_id = d.id
                    ORDER BY tp.id DESC";

            $stmt = $conn->query($sql);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                "status" => true,
                "message" => "Data topik berhasil diambil",
                "total" => count($data),
                "data" => $data
            ], JSON_NUMERIC_CHECK);
            exit;

        } catch (PDOException $e) {
            echo json_encode([
                "status" => false,
                "message" => "Database error saat mengambil data topik",
                "error" => $e->getMessage()
            ]);
            exit;
        }
    }

    /* ================= GET TOPIK DETAIL ================= */
    if ($action === 'detail') {
        $id = (int) ($_GET['id'] ?? 0);

        if (!$id) {
            echo json_encode([
                "status" => false,
                "message" => "ID topik tidak valid"
            ]);
            exit;
        }

        try {
            $sql = "SELECT 
                        tp.id,
                        tp.created_at,
                        tp.username,
                        tp.nama_topik,
                        tp.toko_id,
                        t.nama_toko,
                        tp.divisi_id,
                        d.nama_divisi
                    FROM topik tp
                    LEFT JOIN toko t ON tp.toko_id = t.id
                    LEFT JOIN divisi d ON tp.divisi_id = d.id
                    WHERE tp.id = ?";

            $stmt = $conn->prepare($sql);
            $stmt->execute([$id]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($data) {
                echo json_encode([
                    "status" => true,
                    "message" => "Data topik ditemukan",
                    "data" => $data
                ], JSON_NUMERIC_CHECK);
            } else {
                echo json_encode([
                    "status" => false,
                    "message" => "Topik dengan ID $id tidak ditemukan"
                ]);
            }
            exit;

        } catch (PDOException $e) {
            echo json_encode([
                "status" => false,
                "message" => "Database error saat mengambil detail topik",
                "error" => $e->getMessage()
            ]);
            exit;
        }
    }

    /* ================= ADD TOPIK ================= */
    if ($action === 'add') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            echo json_encode([
                "status" => false, 
                "message" => "Invalid request method. Gunakan POST"
            ]);
            exit;
        }

        $nama_topik = trim($_POST['nama_topik'] ?? '');
        $toko_id    = (int) ($_POST['toko_id'] ?? null);
        $divisi_id  = (int) ($_POST['divisi_id'] ?? null);
        $username   = trim($_POST['username'] ?? 'system');

        // Validasi input
        if (empty($nama_topik)) {
            echo json_encode([
                "status" => false,
                "message" => "Nama topik wajib diisi"
            ]);
            exit;
        }

        if (!$toko_id) {
            echo json_encode([
                "status" => false,
                "message" => "Toko wajib dipilih"
            ]);
            exit;
        }

        if (!$divisi_id) {
            echo json_encode([
                "status" => false,
                "message" => "Divisi wajib dipilih"
            ]);
            exit;
        }

        try {
            // Validasi toko
            $cekToko = $conn->prepare("SELECT id, nama_toko FROM toko WHERE id = ?");
            $cekToko->execute([$toko_id]);
            $tokoData = $cekToko->fetch(PDO::FETCH_ASSOC);
            
            if (!$tokoData) {
                echo json_encode([
                    "status" => false,
                    "message" => "Toko tidak valid"
                ]);
                exit;
            }

            // Validasi divisi
            // $cekDiv = $conn->prepare("SELECT id, nama_divisi FROM divisi WHERE id = ?");
            // $cekDiv->execute([$divisi_id]);
            // $divisiData = $cekDiv->fetch(PDO::FETCH_ASSOC);
            
            // if (!$divisiData) {
            //     echo json_encode([
            //         "status" => false,
            //         "message" => "Divisi tidak valid",

            //     ]);
            //     exit;
            // }

            // Cek duplikasi topik dalam toko yang sama
            $cekDuplikat = $conn->prepare("
                SELECT id FROM topik 
                WHERE nama_topik = ? AND toko_id = ? AND divisi_id = ?
            ");
            $cekDuplikat->execute([$nama_topik, $toko_id, $divisi_id]);
            
            if ($cekDuplikat->fetch()) {
                echo json_encode([
                    "status" => false,
                    "message" => "Topik '$nama_topik' sudah ada di toko dan divisi yang dipilih"
                ]);
                exit;
            }

            // Insert data topik
            $stmt = $conn->prepare("
                INSERT INTO topik 
                    (nama_topik, toko_id, divisi_id, username, created_at)
                VALUES 
                    (?, ?, ?, ?, NOW())
            ");

            $stmt->execute([
                $nama_topik,
                $toko_id,
                $divisi_id,
                $username
            ]);

            $lastId = $conn->lastInsertId();

            // Ambil data yang baru ditambahkan untuk response
            $sql = "SELECT 
                        tp.id,
                        tp.created_at,
                        tp.username,
                        tp.nama_topik,
                        tp.toko_id,
                        t.nama_toko,
                        tp.divisi_id,
                        d.nama_divisi
                    FROM topik tp
                    LEFT JOIN toko t ON tp.toko_id = t.id
                    LEFT JOIN divisi d ON tp.divisi_id = d.id
                    WHERE tp.id = ?";

            $getStmt = $conn->prepare($sql);
            $getStmt->execute([$lastId]);
            $newData = $getStmt->fetch(PDO::FETCH_ASSOC);

            echo json_encode([
                "status" => true,
                "message" => "Topik berhasil ditambahkan",
                "data" => $newData
            ], JSON_NUMERIC_CHECK);

        } catch (PDOException $e) {
            // Cek jika error duplicate entry
            if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
                echo json_encode([
                    "status" => false,
                    "message" => "Topik sudah ada dalam database"
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

    /* ================= EDIT TOPIK ================= */
    if ($action === 'edit') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            echo json_encode([
                "status" => false, 
                "message" => "Invalid request method. Gunakan POST"
            ]);
            exit;
        }

        $id = (int) ($_POST['id'] ?? 0);
        $nama_topik = trim($_POST['nama_topik'] ?? '');
        $toko_id    = (int) ($_POST['toko_id'] ?? 0);
        $divisi_id  = (int) ($_POST['divisi_id'] ?? 0);

        // Validasi input
        if (!$id) {
            echo json_encode([
                "status" => false,
                "message" => "ID topik tidak valid"
            ]);
            exit;
        }

        if (empty($nama_topik)) {
            echo json_encode([
                "status" => false,
                "message" => "Nama topik wajib diisi"
            ]);
            exit;
        }

        if (!$toko_id) {
            echo json_encode([
                "status" => false,
                "message" => "Toko wajib dipilih"
            ]);
            exit;
        }

        if (!$divisi_id) {
            echo json_encode([
                "status" => false,
                "message" => "Divisi wajib dipilih"
            ]);
            exit;
        }

        try {
            // Cek apakah topik ada
            $cekTopik = $conn->prepare("SELECT id FROM topik WHERE id = ?");
            $cekTopik->execute([$id]);
            
            if (!$cekTopik->fetch()) {
                echo json_encode([
                    "status" => false,
                    "message" => "Topik tidak ditemukan"
                ]);
                exit;
            }

            // Cek duplikasi (kecuali untuk topik yang sama)
            $cekDuplikat = $conn->prepare("
                SELECT id FROM topik 
                WHERE nama_topik = ? AND toko_id = ? AND divisi_id = ? AND id != ?
            ");
            $cekDuplikat->execute([$nama_topik, $toko_id, $divisi_id, $id]);
            
            if ($cekDuplikat->fetch()) {
                echo json_encode([
                    "status" => false,
                    "message" => "Topik '$nama_topik' sudah ada di toko dan divisi yang dipilih"
                ]);
                exit;
            }

            // Validasi toko
            $cekToko = $conn->prepare("SELECT id FROM toko WHERE id = ?");
            $cekToko->execute([$toko_id]);
            if (!$cekToko->fetch()) {
                echo json_encode([
                    "status" => false,
                    "message" => "Toko tidak valid"
                ]);
                exit;
            }

            // Validasi divisi
            // $cekDiv = $conn->prepare("SELECT id FROM divisi WHERE id = ?");
            // $cekDiv->execute([$divisi_id]);
            // if (!$cekDiv->fetch()) {
            //     echo json_encode([
            //         "status" => false,
            //         "message" => "Divisi tidak valid"
            //     ]);
            //     exit;
            // }

            // Update data topik
            $stmt = $conn->prepare("
                UPDATE topik 
                SET nama_topik = ?, toko_id = ?, divisi_id = ?
                WHERE id = ?
            ");

            $stmt->execute([
                $nama_topik,
                $toko_id,
                $divisi_id,
                $id
            ]);

            // Ambil data yang sudah diupdate untuk response
            $sql = "SELECT 
                        tp.id,
                        tp.created_at,
                        tp.username,
                        tp.nama_topik,
                        tp.toko_id,
                        t.nama_toko,
                        tp.divisi_id,
                        d.nama_divisi
                    FROM topik tp
                    LEFT JOIN toko t ON tp.toko_id = t.id
                    LEFT JOIN divisi d ON tp.divisi_id = d.id
                    WHERE tp.id = ?";

            $getStmt = $conn->prepare($sql);
            $getStmt->execute([$id]);
            $updatedData = $getStmt->fetch(PDO::FETCH_ASSOC);

            echo json_encode([
                "status" => true,
                "message" => "Topik berhasil diupdate",
                "data" => $updatedData
            ], JSON_NUMERIC_CHECK);

        } catch (PDOException $e) {
            echo json_encode([
                "status" => false,
                "message" => "Database error",
                "error" => $e->getMessage()
            ]);
        }
        exit;
    }

    /* ================= DELETE TOPIK ================= */
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
                "message" => "ID topik tidak valid"
            ]);
            exit;
        }

        try {
            // Cek apakah topik ada
            $cekTopik = $conn->prepare("SELECT id FROM topik WHERE id = ?");
            $cekTopik->execute([$id]);
            
            if (!$cekTopik->fetch()) {
                echo json_encode([
                    "status" => false,
                    "message" => "Topik tidak ditemukan"
                ]);
                exit;
            }

            // Hapus data topik
            $stmt = $conn->prepare("DELETE FROM topik WHERE id = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() > 0) {
                echo json_encode([
                    "status" => true,
                    "message" => "Topik berhasil dihapus"
                ]);
            } else {
                echo json_encode([
                    "status" => false,
                    "message" => "Gagal menghapus topik"
                ]);
            }

        } catch (PDOException $e) {
            // Cek jika ada foreign key constraint violation
            if (strpos($e->getMessage(), 'foreign key constraint') !== false) {
                echo json_encode([
                    "status" => false,
                    "message" => "Tidak dapat menghapus topik karena masih digunakan oleh data lain"
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
        "error" => $e->getMessage()
    ]);
}