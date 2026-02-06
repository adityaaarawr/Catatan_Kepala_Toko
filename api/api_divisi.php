<?php
header("Content-Type: application/json");

$url = "https://toyomatsu.ddns.net/master/api/?data=divisi";

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_TIMEOUT => 15
]);

$response = curl_exec($ch);

if ($response === false) {
    echo json_encode([
        "status" => false,
        "message" => "Gagal connect ke API divisi"
    ]);
    exit;
}

curl_close($ch);

// langsung teruskan response API
echo $response;