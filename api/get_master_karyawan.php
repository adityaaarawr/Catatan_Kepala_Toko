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
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json']
    ];
    if (in_array($method, ['POST', 'PUT', 'PATCH']) && $postData !== null) {
        $options[CURLOPT_POSTFIELDS] = json_encode($postData);
    }
    curl_setopt_array($ch, $options);
    $res      = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error    = curl_error($ch);
    curl_close($ch);
    if ($error) {
        return ["status" => false, "error" => $error, "http_code" => $httpCode, "raw" => ""];
    }
    $decoded = json_decode($res, true);
    return ["status" => true, "data" => $decoded, "http_code" => $httpCode, "raw" => $res];
}

/**
 * Helper: cek sukses response API — toleran berbagai format
 */
function isApiSuccess($externalResponse, $httpCode) {
    if (in_array($httpCode, [200, 201]) && empty($externalResponse)) return true;
    if (!is_array($externalResponse)) return in_array($httpCode, [200, 201]);
    if (isset($externalResponse['status'])) {
        $s = $externalResponse['status'];
        if ($s === true || $s === 1) return true;
        if (is_string($s) && in_array(strtolower($s), ['true', 'success', 'ok'])) return true;
        if ($s === false || $s === 0) return false;
        if (is_string($s) && in_array(strtolower($s), ['false', 'error', 'fail', 'failed'])) return false;
    }
    if (isset($externalResponse['success'])) {
        return ($externalResponse['success'] === true || $externalResponse['success'] === 1);
    }
    if (in_array($httpCode, [200, 201])) {
        $hasError = isset($externalResponse['error']) && !empty($externalResponse['error']);
        return !$hasError;
    }
    return false;
}

/**
 * Mapping field API eksternal ke format standar
 */
function mapKaryawanData($apiData) {
    $result = [];
    if (isset($apiData['data']) && is_array($apiData['data'])) {
        $rows = $apiData['data'];
    } elseif (is_array($apiData) && isset($apiData[0])) {
        $rows = $apiData;
    } else {
        $rows = [$apiData];
    }
    foreach ($rows as $r) {
        if (!is_array($r)) continue;
        $result[] = [
            "id"             => $r["id"]             ?? $r["ID"]      ?? $r["nip"]      ?? null,
            "created_at"     => $r["created_at"]     ?? $r["createdAt"] ?? date('Y-m-d H:i:s'),
            "username"       => $r["username"]       ?? $r["user"]    ?? $r["created_by"] ?? "admin",
            "nip"            => $r["nip"]            ?? null,
            "nama_karyawan"  => $r["nama_lengkap"]   ?? $r["nama_karyawan"] ?? $r["full_name"] ?? $r["name"] ?? null,
            "nama_panggilan" => $r["nama_panggilan"] ?? null,
            "posisi"         => $r["posisi"]         ?? null,
            "store"          => $r["store"]          ?? $r["nama_toko"] ?? $r["toko"] ?? null,
            "nama_toko"      => $r["store"]          ?? $r["nama_toko"] ?? $r["toko"] ?? null,
            "nama_divisi"    => $r["divisi"]         ?? $r["nama_divisi"] ?? $r["division_name"] ?? null,
            "lokasi_toko"    => $r["lokasi_toko"]    ?? $r["lokasi"]  ?? null,
            "karyawan_aktif" => $r["karyawan_aktif"] ?? 1,
            "toko_id"        => $r["toko_id"]        ?? $r["store_id"] ?? null,
            "divisi_id"      => $r["divisi_id"]      ?? $r["divisi"]  ?? null
        ];
    }
    return $result;
}

/* ================= DEBUG ADD — cek raw response API ================= */
// Akses: api/get_master_karyawan.php?action=debug_add
if ($action === 'debug_add') {
    $postData = [
        'nip'            => 'DEBUG-001',
        'nama_lengkap'   => 'Debug Test',
        'nama_panggilan' => 'Debug',
        'posisi'         => 'TEST',
        'store'          => 'PT. TOYO MATSU',
        'divisi'         => 'IT',
        'lokasi_toko'    => 'SURABAYA',
        'karyawan_aktif' => 1,
        'username'       => 'admin',
        'created_at'     => date('Y-m-d H:i:s')
    ];
    $ch = curl_init($API_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_CUSTOMREQUEST  => 'POST',
        CURLOPT_POSTFIELDS     => json_encode($postData),
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json']
    ]);
    $rawResponse = curl_exec($ch);
    $httpCode    = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError   = curl_error($ch);
    curl_close($ch);
    $decoded = json_decode($rawResponse, true);
    echo json_encode([
        "debug"        => true,
        "http_code"    => $httpCode,
        "curl_error"   => $curlError ?: null,
        "raw_response" => $rawResponse,
        "decoded"      => $decoded,
        "payload_sent" => $postData,
        "api_url"      => $API_URL,
        "is_success"   => isApiSuccess($decoded, $httpCode)
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

/* ================= GET ALL KARYAWAN ================= */
if ($action === 'get') {
    $apiResponse = callAPI($API_URL);
    if (!$apiResponse['status']) {
        echo json_encode(["status" => false, "message" => "Gagal koneksi ke API: " . ($apiResponse['error'] ?? 'Unknown error'), "data" => []]);
        exit;
    }
    $mappedData = mapKaryawanData($apiResponse['data']);
    echo json_encode(["status" => true, "message" => "Data karyawan berhasil diambil", "total" => count($mappedData), "data" => $mappedData], JSON_NUMERIC_CHECK);
    exit;
}

/* ================= GET KARYAWAN DETAIL ================= */
if ($action === 'detail') {
    // id bisa berupa integer atau string NIP (e.g. "2023-04-10T...")
    $id = trim($_GET['id'] ?? '');
    if (empty($id)) { echo json_encode(["status" => false, "message" => "ID karyawan tidak valid"]); exit; }
    $apiResponse = callAPI($API_URL);
    if (!$apiResponse['status']) {
        echo json_encode(["status" => false, "message" => "Gagal koneksi ke API: " . ($apiResponse['error'] ?? 'Unknown error')]);
        exit;
    }
    $mappedData    = mapKaryawanData($apiResponse['data']);
    $foundKaryawan = null;
    foreach ($mappedData as $karyawan) {
        if ((string)$karyawan['id'] === (string)$id || (string)$karyawan['nip'] === (string)$id) {
            $foundKaryawan = $karyawan; break;
        }
    }
    if ($foundKaryawan) {
        echo json_encode(["status" => true, "message" => "Data karyawan ditemukan", "data" => $foundKaryawan], JSON_NUMERIC_CHECK);
    } else {
        echo json_encode(["status" => false, "message" => "Karyawan dengan ID $id tidak ditemukan"]);
    }
    exit;
}

/* ================= ADD KARYAWAN ================= */
if ($action === 'add') {
    $nip            = trim($_POST['nip']            ?? '');
    $nama_karyawan  = trim($_POST['nama_karyawan']  ?? '');
    $nama_panggilan = trim($_POST['nama_panggilan'] ?? '');
    $posisi         = trim($_POST['posisi']         ?? '');
    $store          = trim($_POST['store']          ?? '');
    $divisi_id      = trim($_POST['divisi_id']      ?? '');
    $lokasi_toko    = trim($_POST['lokasi_toko']    ?? '');
    $username       = $_POST['username']            ?? 'admin';

    if (empty($nip))           { echo json_encode(["status" => false, "message" => "NIP wajib diisi"]); exit; }
    if (empty($nama_karyawan)) { echo json_encode(["status" => false, "message" => "Nama karyawan wajib diisi"]); exit; }
    if (empty($store))         { echo json_encode(["status" => false, "message" => "Toko wajib dipilih"]); exit; }
    if (empty($divisi_id))     { echo json_encode(["status" => false, "message" => "Divisi wajib dipilih"]); exit; }

    $postData = [
        'nip'            => $nip,
        'nama_lengkap'   => $nama_karyawan,
        'nama_panggilan' => $nama_panggilan,
        'posisi'         => $posisi,
        'store'          => $store,
        'divisi'         => $divisi_id,
        'lokasi_toko'    => $lokasi_toko,
        'karyawan_aktif' => 1,
        'username'       => $username,
        'created_at'     => date('Y-m-d H:i:s')
    ];

    // POST langsung ke API eksternal
    $ch = curl_init($API_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_CUSTOMREQUEST  => 'POST',
        CURLOPT_POSTFIELDS     => json_encode($postData),
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json']
    ]);
    $rawResponse = curl_exec($ch);
    $httpCode    = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError   = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        echo json_encode(["status" => false, "message" => "Gagal koneksi ke API: " . $curlError]);
        exit;
    }

    $externalResponse = json_decode($rawResponse, true);

    if (isApiSuccess($externalResponse, $httpCode)) {
        echo json_encode(["status" => true, "message" => "Karyawan berhasil ditambahkan"]);
    } else {
        $errMsg = $externalResponse['message']
               ?? $externalResponse['error']
               ?? $externalResponse['msg']
               ?? ("API HTTP $httpCode: " . substr($rawResponse, 0, 300));
        echo json_encode([
            "status"        => false,
            "message"       => $errMsg,
            "api_http_code" => $httpCode,
            "api_response"  => $externalResponse
        ]);
    }
    exit;
}

/* ================= DEBUG EDIT — cek raw response API ================= */
// Akses: api/get_master_karyawan.php?action=debug_edit&nip=NILAI_NIP
if ($action === 'debug_edit') {
    $testNip  = trim($_GET['nip'] ?? 'TEST-NIP');
    $postData = [
        'nip'            => $testNip,
        'nama_lengkap'   => 'Debug Edit Test',
        'nama_panggilan' => 'Debug',
        'posisi'         => 'TEST',
        'store'          => 'PT. TOYO MATSU',
        'divisi'         => 'IT',
        'lokasi_toko'    => 'SURABAYA',
        'updated_at'     => date('Y-m-d H:i:s')
    ];

    $results = [];
    foreach (['POST', 'PUT', 'PATCH'] as $method) {
        $url = rtrim($API_URL, '/') . "/{$testNip}";
        $ch  = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_CUSTOMREQUEST  => $method,
            CURLOPT_POSTFIELDS     => json_encode($postData),
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json']
        ]);
        $raw      = curl_exec($ch);
        $code     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $cerr     = curl_error($ch);
        curl_close($ch);
        $decoded  = json_decode($raw, true);
        $results[$method] = [
            "http_code"  => $code,
            "curl_error" => $cerr ?: null,
            "raw"        => $raw,
            "decoded"    => $decoded,
            "is_success" => isApiSuccess($decoded, $code)
        ];
    }

    echo json_encode([
        "debug"        => true,
        "nip_tested"   => $testNip,
        "endpoint"     => rtrim($API_URL, '/') . "/{$testNip}",
        "payload_sent" => $postData,
        "results"      => $results
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

/* ================= EDIT KARYAWAN ================= */
if ($action === 'edit') {
    $id             = (int) ($_POST['id']             ?? 0);
    $nip            = trim($_POST['nip']            ?? '');
    $nama_karyawan  = trim($_POST['nama_karyawan']  ?? '');
    $nama_panggilan = trim($_POST['nama_panggilan'] ?? '');
    $posisi         = trim($_POST['posisi']         ?? '');
    $store          = trim($_POST['store']          ?? '');
    $divisi_id      = trim($_POST['divisi_id']      ?? '');
    $lokasi_toko    = trim($_POST['lokasi_toko']    ?? '');

    if (!$id)              { echo json_encode(["status" => false, "message" => "ID karyawan tidak valid"]); exit; }
    if (empty($nama_karyawan)) { echo json_encode(["status" => false, "message" => "Nama karyawan wajib diisi"]); exit; }
    if (empty($store))         { echo json_encode(["status" => false, "message" => "Toko wajib dipilih"]); exit; }
    if (empty($divisi_id))     { echo json_encode(["status" => false, "message" => "Divisi wajib dipilih"]); exit; }

    // id integer wajib ada agar API update bukan insert baru
    $postData = [
        'id'             => (int) $id,
        'nip'            => $nip,
        'nama_lengkap'   => $nama_karyawan,
        'nama_panggilan' => $nama_panggilan,
        'posisi'         => $posisi,
        'store'          => $store,
        'divisi'         => $divisi_id,
        'lokasi_toko'    => $lokasi_toko,
        'karyawan_aktif' => 1
    ];

    // POST ke base API URL dengan id di body sebagai identifier update
    $ch = curl_init($API_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_CUSTOMREQUEST  => 'POST',
        CURLOPT_POSTFIELDS     => json_encode($postData),
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json']
    ]);
    $rawResponse = curl_exec($ch);
    $httpCode    = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError   = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        echo json_encode(["status" => false, "message" => "Gagal koneksi ke API: " . $curlError]);
        exit;
    }

    $externalResponse = json_decode($rawResponse, true);

    if (isApiSuccess($externalResponse, $httpCode)) {
        echo json_encode(["status" => true, "message" => "Karyawan berhasil diupdate"]);
    } else {
        $errMsg = $externalResponse['message']
               ?? $externalResponse['error']
               ?? $externalResponse['msg']
               ?? ("API HTTP $httpCode: " . substr($rawResponse, 0, 300));
        echo json_encode([
            "status"        => false,
            "message"       => $errMsg,
            "api_http_code" => $httpCode,
            "api_response"  => $externalResponse
        ]);
    }
    exit;
}

/* ================= DELETE KARYAWAN ================= */
if ($action === 'delete') {
    $nip = trim($_POST['nip'] ?? '');
    $id  = (int) ($_POST['id'] ?? 0);

    // Gunakan id integer sebagai identifier utama (key di API), fallback ke nip
    $identifier = $id ?: $nip;

    if (empty($identifier)) {
        echo json_encode(["status" => false, "message" => "ID/NIP karyawan tidak valid"]);
        exit;
    }

    // Ambil data karyawan dari API untuk dapat semua field + id integer
    $getResponse  = callAPI($API_URL);
    $existingData = null;

    if ($getResponse['status'] && !empty($getResponse['data'])) {
        $rawRows = $getResponse['data'];
        // Cari di raw data (sebelum mapping) agar dapat id integer asli
        $rowsToSearch = [];
        if (isset($rawRows['data']) && is_array($rawRows['data'])) {
            $rowsToSearch = $rawRows['data'];
        } elseif (is_array($rawRows) && isset($rawRows[0])) {
            $rowsToSearch = $rawRows;
        }
        foreach ($rowsToSearch as $row) {
            if ((string)($row['nip'] ?? '') === (string)$identifier || (string)($row['id'] ?? '') === (string)$identifier) {
                $existingData = $row;
                break;
            }
        }
    }

    if (!$existingData) {
        echo json_encode(["status" => false, "message" => "Data karyawan tidak ditemukan di API"]);
        exit;
    }

    // Kirim semua field + id integer + karyawan_aktif=0 agar API set sebagai nonaktif/hapus
    $deleteData = [
        'id'             => (int) $existingData['id'],
        'nip'            => $existingData['nip']            ?? $identifier,
        'nama_lengkap'   => $existingData['nama_lengkap']   ?? '',
        'nama_panggilan' => $existingData['nama_panggilan'] ?? '',
        'posisi'         => $existingData['posisi']         ?? '',
        'store'          => $existingData['store']          ?? '',
        'divisi'         => $existingData['divisi']         ?? '',
        'lokasi_toko'    => $existingData['lokasi_toko']    ?? '',
        'karyawan_aktif' => 0
    ];

    $ch = curl_init($API_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_CUSTOMREQUEST  => 'POST',
        CURLOPT_POSTFIELDS     => json_encode($deleteData),
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json']
    ]);
    $rawResponse = curl_exec($ch);
    $httpCode    = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError   = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        echo json_encode(["status" => false, "message" => "Gagal koneksi ke API: " . $curlError]);
        exit;
    }

    $externalResponse = json_decode($rawResponse, true);

    if (isApiSuccess($externalResponse, $httpCode)) {
        echo json_encode(["status" => true, "message" => "Karyawan berhasil dihapus"]);
    } else {
        $errMsg = $externalResponse['message']
               ?? $externalResponse['error']
               ?? $externalResponse['msg']
               ?? ("API HTTP $httpCode: " . substr($rawResponse, 0, 300));
        echo json_encode([
            "status"        => false,
            "message"       => $errMsg,
            "api_http_code" => $httpCode,
            "api_response"  => $externalResponse
        ]);
    }
    exit;
}

/* ================= DEFAULT RESPONSE ================= */
echo json_encode([
    "status"            => false,
    "message"           => "Invalid action",
    "available_actions" => ["get", "detail", "add", "edit", "delete", "debug_add"],
    "api_url"           => $API_URL
]);