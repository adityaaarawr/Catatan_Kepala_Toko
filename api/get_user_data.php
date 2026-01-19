<?php

header("Content-Type: application/json");

require_once "connect.php";

if (array_key_exists('type', $_GET)) {
    $type = $_GET['type'] ?? '';
}else{
    echo json_encode([
        'status' => 401,
        'message' => "parameter type not found"
    ]);
    exit;
}

if($type == 'single'){
    if (array_key_exists('username', $_GET)) {
        $username = $_GET['username'];
    }else{
        echo json_encode([
            'status' => 401,
            'message' => "parameter username not found"
        ]);
        exit;
    }
    echo json_encode($conn->query("SELECT * FROM users where username = '$username'")->fetch(PDO::FETCH_ASSOC));
}

if($type == 'all'){
    echo json_encode($conn->query("SELECT * FROM users")->fetchAll(PDO::FETCH_ASSOC));
}