<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . "/auth.php";

header("Content-Type: application/json");

// Ambil data JSON dari fetch
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (empty($data['user']) || empty($data['pass'])) {
    echo json_encode([
        "status" => false,
        "message" => "Username dan password wajib diisi"
    ]);
    exit;
}

$username = trim($data['user']);
$password = trim($data['pass']);

$result = loginAPI($username, $password);

if ($result['status'] === true) {
    echo json_encode([
        "status" => true,
        "message" => "Login berhasil",
        "redirect" => "home.php",
        "role" => $result['role']
    ]);
} else {
    echo json_encode([
        "status" => false,
        "message" => $result['message']
    ]);
}
exit;