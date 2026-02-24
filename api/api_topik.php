<?php
require_once "connect.php";
header('Content-Type: application/json');

$toko_id  = trim($_GET['toko_id']  ?? '');
$divisi_id = trim($_GET['divisi_id'] ?? '');

if (empty($toko_id)) {
    echo json_encode(["status" => false, "message" => "toko_id wajib diisi", "data" => []]);
    exit;
}

try {
    // toko_id di tabel topik menyimpan NAMA TOKO (varchar), bukan integer ID
    // Cocokkan langsung dengan nama toko (case-insensitive)
    $params = [$toko_id];
    $sql = "SELECT 
                tp.id,
                tp.nama_topik,
                tp.toko_id,
                tp.divisi_id
            FROM topik tp
            WHERE UPPER(tp.toko_id) = UPPER(?)";

    // Filter divisi jika ada
    if (!empty($divisi_id)) {
        $sql .= " AND UPPER(tp.divisi_id) = UPPER(?)";
        $params[] = $divisi_id;
    }

    $sql .= " ORDER BY tp.nama_topik ASC";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => true,
        "data"   => $data
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "status"  => false,
        "message" => "Database error: " . $e->getMessage(),
        "data"    => []
    ]);
}