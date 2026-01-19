<?php
function callAPI($url, $method = "POST", $data = null, $headers = [])
{
    $ch = curl_init($url);

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

    if ($data) {
        $jsonData = $data;
        curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
        $headers[] = "Content-Type: application/json";
    }

    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }

    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $response = curl_exec($ch);
    // echo $response;

    if (curl_errno($ch)) {
        curl_close($ch);
        return json_encode([
            "status" => false,
            "message" => curl_error($ch)
        ]);
    }

    curl_close($ch);
    return $response;
}