<?php
header("Content-Type: application/json");
header("Cache-Control: max-age=300"); // cache 5 menit di browser

$API_URL = "https://toyomatsu.ddns.net/master/api/";

// Fetch data toko dari API eksternal
$ch = curl_init($API_URL . "?table=toko");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_HTTPHEADER     => ["Content-Type: application/json"],
]);
$rawResponse = curl_exec($ch);
$httpCode    = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError   = curl_error($ch);
curl_close($ch);

// Jika curl error
if ($curlError) {
    echo json_encode([
        "status"  => false,
        "message" => "Gagal koneksi ke API: " . $curlError,
        "data"    => []
    ]);
    exit;
}

// Decode response
$decoded = json_decode($rawResponse, true);

// Ambil array rows dari berbagai format response API
$rows = [];
if (isset($decoded['data']) && is_array($decoded['data'])) {
    $rows = $decoded['data'];
} elseif (is_array($decoded) && isset($decoded[0])) {
    $rows = $decoded;
}

// Jika tidak ada data toko dari endpoint ?table=toko,
// fallback: ambil dari endpoint karyawan lalu extract unik nama_toko + lokasi_toko
if (empty($rows)) {
    $ch2 = curl_init($API_URL);
    curl_setopt_array($ch2, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_HTTPHEADER     => ["Content-Type: application/json"],
    ]);
    $raw2     = curl_exec($ch2);
    $code2    = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
    $cerr2    = curl_error($ch2);
    curl_close($ch2);

    if (!$cerr2) {
        $dec2 = json_decode($raw2, true);
        $karyawanRows = [];
        if (isset($dec2['data']) && is_array($dec2['data'])) {
            $karyawanRows = $dec2['data'];
        } elseif (is_array($dec2) && isset($dec2[0])) {
            $karyawanRows = $dec2;
        }

        // Extract unik kombinasi store + lokasi_toko dari data karyawan
        $seen = [];
        foreach ($karyawanRows as $r) {
            $namaToko = $r['store'] ?? $r['nama_toko'] ?? '';
            $lokasi   = $r['lokasi_toko'] ?? $r['lokasi'] ?? '';
            if (!$namaToko || !$lokasi) continue;
            $key = strtoupper($namaToko) . '|' . strtoupper($lokasi);
            if (!isset($seen[$key])) {
                $seen[$key] = true;
                $rows[] = [
                    'nama_toko' => strtoupper(trim($namaToko)),
                    'lokasi'    => strtoupper(trim($lokasi)),
                ];
            }
        }
    }
}

// Build output: setiap row hanya butuh nama_toko + lokasi
$result = [];
$seen   = [];
foreach ($rows as $r) {
    // Support berbagai key nama dari API
    $namaToko = $r['nama_toko'] ?? $r['store']      ?? $r['toko']  ?? '';
    $lokasi   = $r['lokasi']    ?? $r['lokasi_toko'] ?? $r['location'] ?? '';

    $namaToko = strtoupper(trim($namaToko));
    $lokasi   = strtoupper(trim($lokasi));

    if (!$namaToko || !$lokasi) continue;

    // Deduplicate berdasarkan kombinasi nama_toko + lokasi
    $key = $namaToko . '|' . $lokasi;
    if (isset($seen[$key])) continue;
    $seen[$key] = true;

    $result[] = [
        'nama_toko' => $namaToko,
        'lokasi'    => $lokasi,
    ];
}

echo json_encode([
    "status" => true,
    "total"  => count($result),
    "data"   => $result,
], JSON_UNESCAPED_UNICODE);
exit;