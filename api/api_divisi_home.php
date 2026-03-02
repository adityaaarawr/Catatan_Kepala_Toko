<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$url = 'http://toyomatsu.ddns.net/master/api/?data=divisi';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error    = curl_error($ch);
curl_close($ch);

if ($error || $httpCode !== 200) {
    http_response_code(500);
    echo json_encode(['error' => 'Gagal fetch API divisi', 'detail' => $error, 'http_code' => $httpCode]);
    exit;
}

echo $response;