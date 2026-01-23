<?php 

require_once "connect.php";

header('Content-Type: application/json');

/* ======================================================
   GET ALL USER ROLE (UNTUK TABEL)
====================================================== */

    $sql = "SELECT COUNT(*) as id_last FROM `roles`;";
            
    try {
        $stmt = $conn->query($sql);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode(["status" => true, "data" => $data]);
    } catch (Exception $e) {
        echo json_encode(["status" => false, "message" => $e->getMessage()]);
    }
    exit;
// }

?>