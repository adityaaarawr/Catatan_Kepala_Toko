<?php
header("Content-Type: application/json");

// API URL untuk master karyawan
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
function mapKaryawanData($apiData) {
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
            "nama_karyawan" => $r["nama_lengkap"] ?? $r["nama_karyawan"] ?? $r["full_name"] ?? $r["name"] ?? null,
            "nama_toko" => $r["store"] ?? $r["nama_toko"] ?? $r["store_name"] ?? $r["toko"] ?? null,
            "nama_divisi" => $r["divisi"] ?? $r["nama_divisi"] ?? $r["division_name"] ?? $r["department"] ?? null,
            "toko_id" => $r["toko_id"] ?? $r["store_id"] ?? $r["tokoId"] ?? null,
            "divisi_id" => $r["divisi_id"] ?? $r["division_id"] ?? $r["divisiId"] ?? null
        ];
    }
    
    return $result;
}

/* ================= GET ALL KARYAWAN ================= */
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
    
    $mappedData = mapKaryawanData($apiResponse['data']);
    
    echo json_encode([
        "status" => true,
        "message" => "Data karyawan berhasil diambil",
        "total" => count($mappedData),
        "data" => $mappedData
    ], JSON_NUMERIC_CHECK);
    exit;
}

/* ================= GET KARYAWAN DETAIL ================= */
if ($action === 'detail') {
    $id = (int) ($_GET['id'] ?? 0);
    
    if (!$id) {
        echo json_encode([
            "status" => false,
            "message" => "ID karyawan tidak valid"
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
    
    $mappedData = mapKaryawanData($apiResponse['data']);
    
    // Cari karyawan berdasarkan ID
    $foundKaryawan = null;
    foreach ($mappedData as $karyawan) {
        if ($karyawan['id'] == $id) {
            $foundKaryawan = $karyawan;
            break;
        }
    }
    
    if ($foundKaryawan) {
        echo json_encode([
            "status" => true,
            "message" => "Data karyawan ditemukan",
            "data" => $foundKaryawan
        ], JSON_NUMERIC_CHECK);
    } else {
        echo json_encode([
            "status" => false,
            "message" => "Karyawan dengan ID $id tidak ditemukan"
        ]);
    }
    exit;
}

/* ================= ADD KARYAWAN ================= */
if ($action === 'add') {
    // Ambil data dari POST
    $nama_karyawan = trim($_POST['nama_karyawan'] ?? '');
    $toko_id = (int) ($_POST['toko_id'] ?? 0);
    $divisi_id = (int) ($_POST['divisi_id'] ?? 0);
    $username = $_POST['username'] ?? 'admin';
    
    // Validasi input
    if (empty($nama_karyawan)) {
        echo json_encode([
            "status" => false,
            "message" => "Nama karyawan wajib diisi"
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
    
    // Data yang akan dikirim ke API eksternal
    $postData = [
        'nama_karyawan' => $nama_karyawan,
        'nama_lengkap' => $nama_karyawan,
        'toko_id' => $toko_id,
        'divisi_id' => $divisi_id,
        'username' => $username,
        'created_at' => date('Y-m-d H:i:s')
    ];
    
    // Panggil API untuk menambah karyawan
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
            "message" => "Karyawan berhasil ditambahkan",
            "data" => mapKaryawanData($externalResponse)[0] ?? $postData
        ], JSON_NUMERIC_CHECK);
    } else {
        echo json_encode([
            "status" => false,
            "message" => $externalResponse['message'] ?? "Gagal menambahkan karyawan di server eksternal"
        ]);
    }
    exit;
}

/* ================= EDIT KARYAWAN ================= */
if ($action === 'edit') {
    $id = (int) ($_POST['id'] ?? 0);
    $nama_karyawan = trim($_POST['nama_karyawan'] ?? '');
    $toko_id = (int) ($_POST['toko_id'] ?? 0);
    $divisi_id = (int) ($_POST['divisi_id'] ?? 0);
    
    // Validasi input
    if (!$id) {
        echo json_encode([
            "status" => false,
            "message" => "ID karyawan tidak valid"
        ]);
        exit;
    }
    
    if (empty($nama_karyawan)) {
        echo json_encode([
            "status" => false,
            "message" => "Nama karyawan wajib diisi"
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
    
    // Data yang akan dikirim ke API eksternal
    $postData = [
        'id' => $id,
        'nama_karyawan' => $nama_karyawan,
        'nama_lengkap' => $nama_karyawan,
        'toko_id' => $toko_id,
        'divisi_id' => $divisi_id,
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
            "message" => "Karyawan berhasil diupdate",
            "data" => mapKaryawanData($externalResponse)[0] ?? $postData
        ], JSON_NUMERIC_CHECK);
    } else {
        echo json_encode([
            "status" => false,
            "message" => $externalResponse['message'] ?? "Gagal mengupdate karyawan di server eksternal"
        ]);
    }
    exit;
}

/* ================= DELETE KARYAWAN ================= */
if ($action === 'delete') {
    $id = (int) ($_POST['id'] ?? 0);
    
    if (!$id) {
        echo json_encode([
            "status" => false,
            "message" => "ID karyawan tidak valid"
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
            "message" => "Karyawan berhasil dihapus"
        ]);
    } else {
        echo json_encode([
            "status" => false,
            "message" => $externalResponse['message'] ?? "Gagal menghapus karyawan di server eksternal"
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