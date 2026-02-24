<?php
/**
 * get_flex_role.php
 * ==================
 * Helper / API untuk sistem Flexible Role.
 * 
 * USAGE SEBAGAI HELPER (include dari file lain):
 *   require_once 'api/get_flex_role.php';
 *   $role = new FlexRole($conn, $user_role_id);
 *   if ($role->can('view_note', 'PT. TOYO MATSU')) { ... }
 * 
 * USAGE SEBAGAI API (GET request):
 *   api/get_flex_role.php?action=check_user&user_id=1
 *   api/get_flex_role.php?action=get_role_permissions&role_id=5
 *   api/get_flex_role.php?action=toko_options
 */

/* ======================================================
   CLASS UTAMA: FlexRole
   Cara pakai:
     $role = new FlexRole($conn, $role_id);
     $role->can('view_note')                        → cek apakah key aktif
     $role->can('view_note', 'PT. TOYO MATSU')     → cek + filter toko
     $role->scope('view_note')                      → ambil array toko yang diizinkan
     $role->isExpired()                             → cek apakah role sudah expired
     $role->isEnabled()                             → cek apakah role aktif
====================================================== */
class FlexRole {
    private $conn;
    private $role_id;
    private $permissions = []; // [ key_name => { bool, string, datetime } ]
    private $loaded = false;

    public function __construct($conn, $role_id) {
        $this->conn    = $conn;
        $this->role_id = (int) $role_id;
        $this->load();
    }

    /**
     * Load semua permission untuk role ini dari DB
     */
    private function load() {
        if ($this->loaded) return;

        $stmt = $this->conn->prepare("
            SELECT 
                rk.role_key_name,
                tur.key_value_bool,
                tur.key_value_string,
                tur.key_value_datetime,
                tur.key_value_integer
            FROM transaksi_user_role tur
            JOIN role_key rk ON (
                tur.role_key_name = CAST(rk.id AS CHAR)
                OR tur.role_key_name = rk.role_key_name
            )
            WHERE tur.role_id = ?
            GROUP BY rk.role_key_name, tur.key_value_bool, tur.key_value_string, 
                     tur.key_value_datetime, tur.key_value_integer
        ");
        $stmt->execute([$this->role_id]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($rows as $row) {
            $keyName = strtolower($row['role_key_name']);
            $this->permissions[$keyName] = [
                'bool'     => $row['key_value_bool'],
                'string'   => $row['key_value_string'],
                'datetime' => $row['key_value_datetime'],
                'integer'  => $row['key_value_integer'],
            ];
        }

        $this->loaded = true;
    }

    /**
     * Cek apakah user punya permission key tertentu
     * @param string $key        nama key (e.g. 'view_note')
     * @param string|null $toko  nama toko (opsional, untuk cek scope)
     * @return bool
     */
    public function can(string $key, ?string $toko = null): bool {
        $key = strtolower($key);

        // Key tidak ada sama sekali → tidak punya izin
        if (!array_key_exists($key, $this->permissions)) return false;

        $perm = $this->permissions[$key];

        // update_toko → cek boolean WAJIB true
        // Jika ada scope string → cek juga apakah toko masuk scope
        if ($key === 'update_toko') {
            if (!(bool) $perm['bool']) return false; // bool harus true dulu
            // Jika ada toko parameter, cek scope
            if ($toko !== null && !empty($perm['string'])) {
                $scope = $this->parseScope($perm['string']);
                // [] atau ["*"] → semua toko diizinkan
                if (empty($scope) || in_array('*', $scope) || in_array('ALL', $scope)) return true;
                return in_array(strtoupper(trim($toko)), array_map('strtoupper', $scope));
            }
            return true; // boolean true, tidak ada batasan toko / tidak perlu cek toko
        }

        // Khusus enable → cek boolean
        if ($key === 'enable') {
            return (bool) $perm['bool'];
        }

        // manage_user → boolean only (tidak ada scope toko)
        // key harus ada DAN bool = true
        if ($key === 'manage_user') {
            return (bool) $perm['bool'];
        }

        // Key ada di permissions → key aktif (sudah cukup tanpa nilai string)
        $hasKey = true;

        // Jika ada scope toko di key_value_string, cek apakah toko masuk scope
        if ($toko !== null && !empty($perm['string'])) {
            $scope = $this->parseScope($perm['string']);
            // [] atau ["*"] atau ["ALL"] → semua toko diizinkan (tidak ada batasan)
            if (empty($scope) || in_array('*', $scope) || in_array('ALL', $scope)) return true;
            return in_array(strtoupper(trim($toko)), array_map('strtoupper', $scope));
        }

        // Jika ada scope tapi toko tidak diminta, cukup cek key ada
        return $hasKey;
    }

    /**
     * Ambil array toko yang diizinkan untuk key tertentu
     * @param string $key
     * @return array  array nama toko, atau ['*'] jika semua, atau [] jika tidak punya
     */
    public function scope(string $key): array {
        $key = strtolower($key);
        if (!array_key_exists($key, $this->permissions)) return [];

        $str = $this->permissions[$key]['string'] ?? '';
        if (empty($str)) return ['*']; // key ada tapi tidak ada batasan → semua

        return $this->parseScope($str);
    }

    /**
     * Parse scope string (JSON array atau comma-separated)
     */
    private function parseScope(string $str): array {
        $str = trim($str);
        // Coba parse sebagai JSON
        $arr = json_decode($str, true);
        if (is_array($arr)) return $arr;
        // Fallback: comma separated
        return array_map('trim', explode(',', $str));
    }

    /**
     * Cek apakah role expired
     */
    public function isExpired(): bool {
        if (!array_key_exists('expiration_date', $this->permissions)) return false;
        $dt = $this->permissions['expiration_date']['datetime']
           ?? $this->permissions['expiration_date']['string']
           ?? null;
        if (!$dt || strtolower($dt) === 'forever' || $dt === '') return false;
        return strtotime($dt) < time();
    }

    /**
     * Cek apakah role enabled
     */
    public function isEnabled(): bool {
        if (!array_key_exists('enable', $this->permissions)) return true; // default enabled
        return (bool) $this->permissions['enable']['bool'];
    }

    /**
     * Ambil semua permissions sebagai array
     */
    public function all(): array {
        return $this->permissions;
    }

    /**
     * Ambil expiration date
     */
    public function expirationDate(): ?string {
        return $this->permissions['expiration_date']['datetime']
            ?? $this->permissions['expiration_date']['string']
            ?? null;
    }
}

/* ======================================================
   JIKA DIPANGGIL SEBAGAI API (bukan include)
====================================================== */
if (basename($_SERVER['PHP_SELF']) === 'get_flex_role.php') {
    require_once "connect.php";
    header('Content-Type: application/json');

    $action = $_GET['action'] ?? '';

    try {
        if (!$conn) throw new Exception("Koneksi database gagal.");

        /* --------------------------------------------------
           ACTION: check_user
           Ambil semua permission user berdasarkan user_id
           GET: ?action=check_user&user_id=1
        -------------------------------------------------- */
        if ($action === 'check_user') {
            $user_id = (int) ($_GET['user_id'] ?? 0);
            if (!$user_id) {
                echo json_encode(["status" => false, "message" => "user_id diperlukan"]);
                exit;
            }

            // Ambil role_id user
            $uStmt = $conn->prepare("SELECT id, name, username, role_id, enable, expired_at FROM users WHERE id = ?");
            $uStmt->execute([$user_id]);
            $user = $uStmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                echo json_encode(["status" => false, "message" => "User tidak ditemukan"]);
                exit;
            }

            $role = new FlexRole($conn, $user['role_id']);

            $result = [
                'user_id'    => (int) $user['id'],
                'username'   => $user['username'],
                'role_id'    => (int) $user['role_id'],
                'is_enabled' => $role->isEnabled() && (bool) $user['enable'],
                'is_expired' => $role->isExpired(),
                'expired_at' => $role->expirationDate(),
                'permissions' => []
            ];

            // Daftar semua key yang mungkin
            $allKeys = [
                'update_toko', 'manage_user', 'update_role', 'update_divisi',
                'update_topik', 'update_karyawan', 'view_note', 'input_note',
                'update_note', 'delete_note'
            ];

            foreach ($allKeys as $key) {
                $result['permissions'][$key] = [
                    'has_access' => $role->can($key),
                    'scope'      => $role->scope($key),
                ];
            }

            echo json_encode(["status" => true, "data" => $result], JSON_PRETTY_PRINT);
            exit;
        }

        /* --------------------------------------------------
           ACTION: get_role_permissions
           Ambil detail permission sebuah role lengkap dengan nilai
           GET: ?action=get_role_permissions&role_id=5
        -------------------------------------------------- */
        if ($action === 'get_role_permissions') {
            $role_id = (int) ($_GET['role_id'] ?? 0);
            if (!$role_id) {
                echo json_encode(["status" => false, "message" => "role_id diperlukan"]);
                exit;
            }

            $stmt = $conn->prepare("
                SELECT 
                    rk.id as key_id,
                    rk.role_key_name,
                    tur.key_value_bool,
                    tur.key_value_string,
                    tur.key_value_datetime,
                    tur.key_value_integer
                FROM role_key rk
                LEFT JOIN (
                    SELECT * FROM transaksi_user_role WHERE role_id = ?
                    GROUP BY role_key_name
                ) tur ON (
                    tur.role_key_name = CAST(rk.id AS CHAR)
                    OR tur.role_key_name = rk.role_key_name
                )
                ORDER BY rk.id ASC
            ");
            $stmt->execute([$role_id]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $permissions = [];
            foreach ($rows as $row) {
                $keyName = $row['role_key_name'];
                $hasAccess = ($row['key_value_bool'] !== null 
                    || $row['key_value_string'] !== null 
                    || $row['key_value_datetime'] !== null);

                // Untuk key dengan toko scope, parse JSON
                $scope = [];
                if (!empty($row['key_value_string'])) {
                    $decoded = json_decode($row['key_value_string'], true);
                    $scope = is_array($decoded) ? $decoded : [$row['key_value_string']];
                }

                $permissions[] = [
                    'key_id'        => (int) $row['key_id'],
                    'key_name'      => $keyName,
                    'has_access'    => $hasAccess,
                    'bool_value'    => $row['key_value_bool'] !== null ? (bool) $row['key_value_bool'] : null,
                    'string_value'  => $row['key_value_string'],
                    'datetime_value'=> $row['key_value_datetime'],
                    'scope_toko'    => $scope,
                ];
            }

            echo json_encode([
                "status" => true,
                "role_id" => $role_id,
                "data" => $permissions
            ], JSON_NUMERIC_CHECK);
            exit;
        }

        /* --------------------------------------------------
           ACTION: toko_options
           Ambil semua nama toko untuk pilihan scope
           GET: ?action=toko_options
        -------------------------------------------------- */
        if ($action === 'toko_options') {
            $stmt = $conn->query("SELECT id, nama_toko, kode FROM toko ORDER BY nama_toko ASC");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(["status" => true, "data" => $data]);
            exit;
        }

        echo json_encode(["status" => false, "message" => "Invalid action",
            "available_actions" => ["check_user", "get_role_permissions", "toko_options"]]);

    } catch (Throwable $e) {
        echo json_encode(["status" => false, "message" => "Server error: " . $e->getMessage()]);
    }
}