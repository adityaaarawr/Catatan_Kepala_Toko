<?php
header("Content-Type: application/json");

// API URL untuk master divisi
$API_URL = "https://toyomatsu.ddns.net/master/api/";

// Default action
$action = $_GET['action'] ?? 'get';

/**
 * Fungsi untuk memanggil API eksternal
 */
function callAPI($url, $method = 'GET', $postData = null) {
    $ch = curl_init($url);
    
    $options = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json']
    ];
    
    if ($method === 'POST' && $postData !== null) {
        $options[CURLOPT_POSTFIELDS] = json_encode($postData);
    }
    
    curl_setopt_array($ch, $options);
    $res = curl_exec($ch);
    
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        return [
            "status" => false,
            "error" => $error,
            "http_code" => $httpCode
        ];
    }
    
    $decoded = json_decode($res, true);
    
    // Jika decode gagal, kembalikan raw response
    if ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
        return [
            "status" => false,
            "error" => "Invalid JSON response",
            "raw_response" => $res,
            "http_code" => $httpCode
        ];
    }
    
    return [
        "status" => true,
        "data" => $decoded,
        "http_code" => $httpCode
    ];
}

/**
 * Fungsi untuk mapping field dari API eksternal ke format standar
 */
function mapDivisiData($apiData) {
    $result = [];
    
    // Jika data adalah array multidimensi
    if (isset($apiData['data']) && is_array($apiData['data'])) {
        $rows = $apiData['data'];
    } elseif (is_array($apiData) && isset($apiData[0])) {
        $rows = $apiData;
    } else {
        $rows = [$apiData];
    }
    
    foreach ($rows as $r) {
        // Mapping field yang mungkin berbeda dari API eksternal
        $result[] = [
            "id" => $r["id"] ?? $r["ID"] ?? null,
            "created_at" => $r["created_at"] ?? $r["createdAt"] ?? $r["date_created"] ?? date('Y-m-d H:i:s'),
            "username" => $r["username"] ?? $r["user"] ?? $r["created_by"] ?? "admin",
            "nama_divisi" => $r["divisi"] ?? $r["nama_divisi"] ?? $r["division_name"] ?? $r["name"] ?? null,
            "posisi" => $r["posisi"] ?? $r["position"] ?? $r["job_title"] ?? "",
            "nama_toko" => $r["store"] ?? $r["nama_toko"] ?? $r["store_name"] ?? $r["toko"] ?? null,
            "toko_id" => $r["toko_id"] ?? $r["store_id"] ?? $r["tokoId"] ?? null
        ];
    }
    
    return $result;
}

/* ================= GET ALL DIVISI ================= */
if ($action === 'get') {
    $apiResponse = callAPI($API_URL);
    
    if (!$apiResponse['status']) {
        echo json_encode([
            "status" => false,
            "message" => "Gagal koneksi ke API: " . ($apiResponse['error'] ?? 'Unknown error'),
            "data" => []
        ]);
        exit;
    }
    
    $mappedData = mapDivisiData($apiResponse['data']);
    
    echo json_encode([
        "status" => true,
        "message" => "Data berhasil diambil",
        "total" => count($mappedData),
        "data" => $mappedData
    ], JSON_NUMERIC_CHECK);
    exit;
}

/* ================= GET DIVISI DETAIL ================= */
if ($action === 'detail') {
    $id = (int) ($_GET['id'] ?? 0);
    
    if (!$id) {
        echo json_encode([
            "status" => false,
            "message" => "ID divisi tidak valid"
        ]);
        exit;
    }
    
    // Panggil API dengan ID spesifik atau filter di sisi server
    $apiResponse = callAPI($API_URL);
    
    if (!$apiResponse['status']) {
        echo json_encode([
            "status" => false,
            "message" => "Gagal koneksi ke API: " . ($apiResponse['error'] ?? 'Unknown error')
        ]);
        exit;
    }
    
    $mappedData = mapDivisiData($apiResponse['data']);
    
    // Cari divisi berdasarkan ID
    $foundDivisi = null;
    foreach ($mappedData as $divisi) {
        if ($divisi['id'] == $id) {
            $foundDivisi = $divisi;
            break;
        }
    }
    
    if ($foundDivisi) {
        echo json_encode([
            "status" => true,
            "message" => "Data divisi ditemukan",
            "data" => $foundDivisi
        ], JSON_NUMERIC_CHECK);
    } else {
        echo json_encode([
            "status" => false,
            "message" => "Divisi dengan ID $id tidak ditemukan"
        ]);
    }
    exit;
}

/* ================= ADD DIVISI ================= */
if ($action === 'add') {
    // Ambil data dari POST
    $nama_divisi = trim($_POST['nama_divisi'] ?? '');
    $posisi = trim($_POST['posisi'] ?? '');
    $toko_id = (int) ($_POST['toko_id'] ?? 0);
    $username = $_POST['username'] ?? 'admin';
    
    // Validasi input
    if (empty($nama_divisi)) {
        echo json_encode([
            "status" => false,
            "message" => "Nama divisi wajib diisi"
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
    
    // Data yang akan dikirim ke API eksternal
    $postData = [
        'divisi' => $nama_divisi,
        'nama_divisi' => $nama_divisi,
        'posisi' => $posisi,
        'toko_id' => $toko_id,
        'username' => $username,
        'created_at' => date('Y-m-d H:i:s')
    ];
    
    // Panggil API untuk menambah divisi
    $apiResponse = callAPI($API_URL, 'POST', $postData);
    
    if (!$apiResponse['status']) {
        echo json_encode([
            "status" => false,
            "message" => "Gagal menyimpan ke API: " . ($apiResponse['error'] ?? 'Unknown error')
        ]);
        exit;
    }
    
    // Cek response dari API eksternal
    $externalResponse = $apiResponse['data'];
    
    if (isset($externalResponse['status']) && $externalResponse['status'] === true) {
        echo json_encode([
            "status" => true,
            "message" => "Divisi berhasil ditambahkan",
            "data" => mapDivisiData($externalResponse)[0] ?? $postData
        ], JSON_NUMERIC_CHECK);
    } else {
        echo json_encode([
            "status" => false,
            "message" => $externalResponse['message'] ?? "Gagal menambahkan divisi di server eksternal"
        ]);
    }
    exit;
}

/* ================= EDIT DIVISI ================= */
if ($action === 'edit') {
    $id = (int) ($_POST['id'] ?? 0);
    $nama_divisi = trim($_POST['nama_divisi'] ?? '');
    $posisi = trim($_POST['posisi'] ?? '');
    $toko_id = (int) ($_POST['toko_id'] ?? 0);
    
    // Validasi input
    if (!$id) {
        echo json_encode([
            "status" => false,
            "message" => "ID divisi tidak valid"
        ]);
        exit;
    }
    
    if (empty($nama_divisi)) {
        echo json_encode([
            "status" => false,
            "message" => "Nama divisi wajib diisi"
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
    
    // Data yang akan dikirim ke API eksternal
    $postData = [
        'id' => $id,
        'divisi' => $nama_divisi,
        'nama_divisi' => $nama_divisi,
        'posisi' => $posisi,
        'toko_id' => $toko_id,
        'updated_at' => date('Y-m-d H:i:s')
    ];
    
    // Biasanya untuk edit menggunakan endpoint spesifik
    $editUrl = rtrim($API_URL, '/') . "/{$id}";
    $apiResponse = callAPI($editUrl, 'POST', $postData);
    
    if (!$apiResponse['status']) {
        echo json_encode([
            "status" => false,
            "message" => "Gagal update ke API: " . ($apiResponse['error'] ?? 'Unknown error')
        ]);
        exit;
    }
    
    $externalResponse = $apiResponse['data'];
    
    if (isset($externalResponse['status']) && $externalResponse['status'] === true) {
        echo json_encode([
            "status" => true,
            "message" => "Divisi berhasil diupdate",
            "data" => mapDivisiData($externalResponse)[0] ?? $postData
        ], JSON_NUMERIC_CHECK);
    } else {
        echo json_encode([
            "status" => false,
            "message" => $externalResponse['message'] ?? "Gagal mengupdate divisi di server eksternal"
        ]);
    }
    exit;
}

/* ================= DELETE DIVISI ================= */
if ($action === 'delete') {
    $id = (int) ($_POST['id'] ?? 0);
    
    if (!$id) {
        echo json_encode([
            "status" => false,
            "message" => "ID divisi tidak valid"
        ]);
        exit;
    }
    
    // Biasanya untuk delete menggunakan endpoint spesifik
    $deleteUrl = rtrim($API_URL, '/') . "/{$id}";
    $apiResponse = callAPI($deleteUrl, 'DELETE');
    
    if (!$apiResponse['status']) {
        echo json_encode([
            "status" => false,
            "message" => "Gagal menghapus dari API: " . ($apiResponse['error'] ?? 'Unknown error')
        ]);
        exit;
    }
    
    $externalResponse = $apiResponse['data'];
    
    if (isset($externalResponse['status']) && $externalResponse['status'] === true) {
        echo json_encode([
            "status" => true,
            "message" => "Divisi berhasil dihapus"
        ]);
    } else {
        echo json_encode([
            "status" => false,
            "message" => $externalResponse['message'] ?? "Gagal menghapus divisi di server eksternal"
        ]);
    }
    exit;
}

/* ================= DEFAULT RESPONSE ================= */
echo json_encode([
    "status" => false,
    "message" => "Invalid action",
    "available_actions" => ["get", "detail", "add", "edit", "delete"],
    "api_url" => $API_URL
]);