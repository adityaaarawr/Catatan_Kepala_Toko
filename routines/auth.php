<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . "/curl.php";

define("API_LOGIN", "https://toyomatsu.ddns.net/master/api/?login=true");

function loginAPI($username, $password)
{
    // ====== LOGIN KE API ======
    $response = callAPI("https://toyomatsu.ddns.net/master/api/?login=true", "POST", [
        "username" => $username,
        "password" => $password
    ]);

    echo $response;

    $datas = json_decode($response, true);

    if (!is_array($datas)) {
        return [
            "status"  => false,
            "message" => "Response API tidak valid"
        ];
    }

    if (!empty($datas['status']) && $datas['status'] === false) {
        return [
            "status"  => false,
            "message" => $datas['message'] ?? "Username atau Password salah"
        ];
    }

    if (empty($datas['username'])) {
        return [
            "status"  => false,
            "message" => "Login gagal, data user tidak ditemukan",
            "mess" => $response
        ];
    }

    // ====== GET ROLE USER ======
    $usr = urlencode($datas['username']);
    $detail = callAPI(
        "http://localhost/Catatan_Kepala_Toko/api/get_user_data.php?type=single&username=$usr",
        "GET"
    );

    $detailArr = json_decode($detail, true);

    $role = $detailArr['role'] ?? ($datas['role'] ?? 'user');

    // ====== SET SESSION ======
    $_SESSION['is_login'] = true;
    $_SESSION['nama']     = $datas['nama'] ?? $datas['username'];
    $_SESSION['user_id'] = $detailArr['id'];
    $_SESSION['role']    = $detailArr['role'];

    return [
        "status" => true,
        "user" => [
            "nama" => $_SESSION['nama'],
            "username" => $_SESSION['username']
        ],
        "role" => $_SESSION['role']
    ];
}
