<?php

return [

    // ====== LABEL UNTUK SIDEBAR ======
    "role_label" => [
        "administrator"     => "Administrator",
        "kepala_toko_tms"   => "Kepala Toko TMS",
        "kepala_toko_ol"    => "Kepala Toko OL",
        "kepala_toko_rj"    => "Kepala Toko RJ",
        "kepala_toko_hk"    => "Kepala Toko HK",
        "kepala_toko_ik"    => "Kepala Toko IK",    
        "kepala_toko_tmj"   => "Kepala Toko TMJ",
    ],

    // ====== AKSES MENU ======
    "permissions" => [

        "home" => [
            "administrator",
            "kepala_toko_tms","kepala_toko_ol","kepala_toko_rj",
            "kepala_toko_hk","kepala_toko_ik","kepala_toko_tmj"
        ],

        "master" => [
            "administrator",
            "kepala_toko_tms","kepala_toko_ol","kepala_toko_rj",
            "kepala_toko_hk","kepala_toko_ik","kepala_toko_tmj"
        ],

        "report" => [
            "administrator",
            "kepala_toko_tms","kepala_toko_ol","kepala_toko_rj",
            "kepala_toko_hk","kepala_toko_ik","kepala_toko_tmj"
        ],

        "user_management" => [
            "administrator"
        ]
    ]
];
