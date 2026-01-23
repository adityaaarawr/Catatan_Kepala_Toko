<?php
session_start();

$RBAC = require __DIR__ . "direct/permission_role.php";

// ===== CEK LOGIN =====
if (empty($_SESSION['is_login'])) {
    header("Location: /login.php");
    exit;
}

// ===== CEK ROLE VALID =====
if (empty($_SESSION['role'])) {
    echo "Role tidak ditemukan";
    exit;
}

// ===== FUNGSI CEK AKSES PAGE =====
function allowPage($pageKey)
{
    global $RBAC;

    $roles = $_SESSION['role'];

    if (!isset($RBAC['permissions'][$pageKey])) {
        echo "Page tidak terdaftar di RBAC";
        exit;
    }

    if (!in_array($roles, $RBAC['permissions'][$pageKey])) {
        echo "<h2>Akses ditolak</h2>";
        echo "<p>Role kamu: ".htmlspecialchars($roles)."</p>";
        exit;
    }
}

// ===== HELPER UNTUK SIDEBAR =====
function canAccess($pageKey)
{
    global $RBAC;
    return in_array($_SESSION['role'], $RBAC['permissions'][$pageKey] ?? []);
}

function roleLabel()
{
    global $RBAC;
    return $RBAC['role_label'][$_SESSION['role']] ?? $_SESSION['role'];
}
