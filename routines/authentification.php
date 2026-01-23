<?php
    header("Content-Type: application/json");
    $post = [
        'username' => "admin",
        'password' => "yuiop"
    ];

    $ch = curl_init();

	//setting option (setopt) untuk url yg akan dibuka
	curl_setopt($ch, CURLOPT_URL, "https://toyomatsu.ddns.net/master/api/?login=true");
	// curl_setopt($ch, CURLOPT_HTTPHEADER, $api_header);
	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch, CURLOPT_POSTFIELDS, $post);

	//setting option (setopt) untuk hasil hit url bisa ada kembalian (return)
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);

	//eksekusi curl
	$output = curl_exec($ch);
    echo $output;
    curl_close($ch);