<?php
header('Content-Type: application/json');

function fetch_api_data($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
}

$apiUrl = "https://toyomatsu.ddns.net/master/api/";
$data = fetch_api_data($apiUrl) ?? [];

$result = [
    "raw" => $data,
    "toko" => [],
    "karyawan" => []
];

foreach ($data as $k) { 
    $result["karyawan"][] = [
        "id"     => $k["id"],
        "nama"   => $k["nama_lengkap"],
        "toko"   => $k["store"],
        "divisi" => $k["divisi"]
    ];

    $result["toko"][$k["store"]] = $k["store"];
}

$result["toko"] = array_values($result["toko"]);

echo json_encode($result);
