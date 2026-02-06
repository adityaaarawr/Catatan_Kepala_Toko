<?php 
date_default_timezone_set('Asia/Jakarta');
$pageTitle = 'Report'; 
$cssFile = 'report.css'; 
$jsFile = 'report.js';
include './direct/config.php';

// Fungsi Fetch API yang lebih stabil
function fetch_api_data($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
}

$apiUrl  = "https://toyomatsu.ddns.net/master/api/";
$karyawanList = fetch_api_data($apiUrl) ?? [];
$namaKaryawanMap = [];
$divisiList = [];
$tokoList   = [];

foreach ($karyawanList as $k) {
    $divisiList[$k['posisi']] = $k['posisi'];
    $tokoList[$k['store']]   = $k['store'];
}

include 'modules/header.php'; 

// 2. Tangkap Filter Form
$f_karyawan = $_POST['karyawan'] ?? '';
$f_divisi   = $_POST['divisi'] ?? '';
$f_toko     = $_POST['toko'] ?? '';
$f_start    = $_POST['start_date'] ?? date('Y-m-d');
$f_end      = $_POST['end_date'] ?? date('Y-m-d');

// 3. Query Utama (Perbaikan Token SQL)
$sqlNotes = "SELECT n.*, u.name as nama_inputer, t.nama_topik 
             FROM notes n
             LEFT JOIN users u ON n.user_id = u.id
             LEFT JOIN topik t ON n.topik_id = t.id
             WHERE 1=1";

$params = []; // Gunakan array untuk menampung parameter

if(!empty($f_karyawan)) { $sqlNotes .= " AND n.karyawan_id = :karyawan"; $params[':karyawan'] = $f_karyawan; }
if(!empty($f_divisi))   { $sqlNotes .= " AND n.divisi_id = :divisi";     $params[':divisi']   = $f_divisi;   }
if(!empty($f_toko))     { $sqlNotes .= " AND n.toko_id = :toko";         $params[':toko']     = $f_toko;     }
// Gunakan n.tanggal agar sesuai dengan input manual Anda
if (!empty($f_start) && !empty($f_end)) {
    $sqlNotes .= " AND n.tanggal BETWEEN :start AND :end";
    $params[':start'] = $f_start;
    $params[':end']   = $f_end;
}

$stmt = $conn->prepare($sqlNotes . " ORDER BY n.created_at DESC");
$stmt->execute($params); // Eksekusi dengan array parameter agar jumlah token cocok
$notesList = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Helper Map untuk menampilkan Nama dari NIP/ID API di Tabel
$namaKaryawanMap = array_column($karyawanList, 'nama_lengkap', 'id');
$namaTokoMap     = array_column($karyawanList, 'store', 'toko_id');   // Gunakan toko_id
$namaDivisiMap   = array_column($karyawanList, 'posisi', 'divisi_id'); // Gunakan divisi_id
?>

<div class="layout"> 
    <?php include 'modules/sidebar.php'; ?>
    <main id="mainContent" class="sidebar-collapsed">
        <div class="topbar">
            <h1 class="title">REPORT CATATAN KARYAWAN</h1>
        </div>
        
        <div class="container">
            <div class="filter-card">
                <button type="button" class="mobile-filter-trigger" onclick="toggleMobileFilter()">
                    <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M440-120v-240h80v80h320v80H520v80h-80Zm-320-80v-80h240v80H120Zm160-160v-80H120v-80h160v-80h80v240h-80Zm160-80v-80h400v80H440Zm160-160v-240h80v80h160v80H680v80h-80Zm-480-80v-80h400v80H120Z"/></svg>
                    FILTER DATA
                </button>
  
                <form method="POST" action="report.php" id="formReport"> 
                    <div class="filter-grid filter-grid-system" id="filterGrid">
                        <select name="karyawan" id="filterKaryawan" class="select2">
                            <option value="">ALL KARYAWAN</option>
                            <?php foreach ($karyawanList as $k): ?>
                                <option value="<?= $k['id'] ?>" 
                                        data-toko="<?= $k['store'] ?>" 
                                        data-divisi="<?= $k['posisi'] ?>"
                                        <?= ($f_karyawan == $k['id']) ? 'selected' : '' ?>>
                                    <?= strtoupper($k['nama_lengkap']) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>

                        <select name="divisi" id="filterDivisi" class="select2">
                            <option value="">ALL DIVISI</option>
                            <?php foreach ($divisiList as $d): ?>
                                <option value="<?= $d ?>" <?= ($f_divisi == $d) ? 'selected' : '' ?>>
                                    <?= strtoupper($d) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>

                        <select name="toko" id="filterToko" class="select2">
                            <option value="">ALL TOKO</option>
                            <?php foreach ($tokoList as $t): ?>
                                <option value="<?= $t ?>" <?= ($f_toko == $t) ? 'selected' : '' ?>>
                                    <?= strtoupper($t) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>

                        <div class="date-range">
                            <input type="date" name="start_date" value="<?= $f_start ?>" max="<?= date('Y-m-d') ?>">
                            <input type="date" name="end_date" value="<?= $f_end ?>" max="<?= date('Y-m-d') ?>">
                        </div>

                        <button type="submit" class="btn-generate">GENERATE</button>
                    </div>
                </form>
            </div>
        </div>

        <div class="table-container">
            <h3 class="table-title">TABLE RESULT</h3>
            <table id="reportTable">
                <thead>
                    <tr>
                        <th>NO</th>
                        <th>INPUT DATETIME</th>
                        <th>INPUTER</th>
                        <th>TOKO</th>
                        <th>DIVISI</th>
                        <th>TOPIK</th>
                        <th>KARYAWAN</th>
                        <th>CATATAN</th>
                        <th>FILE</th>
                    </tr>
                </thead>
                
              <tbody>
                    <?php if(!empty($notesList)): ?>
                        <?php foreach($notesList as $i => $note): ?>

                            <tr>
                                <td><?= $i + 1 ?></td>
                                <td><?= date('d-m-Y H:i', strtotime($note['created_at'])) ?></td>
                                <td><?= strtoupper($note['nama_inputer'] ?? '-') ?></td>
                                <td><?= strtoupper($namaTokoMap[$note['toko_id']] ?? $note['toko_id'] ?? 'TANPA TOKO') ?></td>
                                <td><?= strtoupper($namaDivisiMap[$note['divisi_id']] ?? $note['divisi_id'] ?? 'TANPA DIVISI') ?></td>
                                <td><?= strtoupper($note['nama_topik'] ?? '-') ?></td>
                                <td><?= strtoupper($namaKaryawanMap[$note['karyawan_id']] ?? 'NIP: '.$note['karyawan_id']) ?></td>
                                <td><?= nl2br(htmlspecialchars($note['catatan'])) ?></td>
                                <td>
                                    <?php 
                                    if (!empty($note['file_name'])): 
                                        $cleanFileName = str_replace(['[', ']', '"'], '', $note['file_name']);
                                    ?>
                                        <a href="uploads/<?= htmlspecialchars($cleanFileName) ?>" 
                                        target="_blank" 
                                        class="btn-link">
                                            Lihat File
                                        </a>
                                    <?php else: ?>
                                        <span style="color:#ccc;">No File</span>
                                    <?php endif; ?>
                                </td>

                                <!-- TOGGLE DETAIL (MOBILE) -->
                                <td class="mobile-toggle-cell" style="display:none;">
                                <div class="toggle-detail" onclick="handleDetailClick(this, event)" style="position:relative; z-index:9999; cursor:pointer;">LIHAT DETAIL</div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr><td colspan="9" style="text-align:center; padding:20px;">Data tidak ditemukan.</td></tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </main> 
</div> 

<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<script src="https://cdn.datatables.net/1.13.7/js/jquery.dataTables.min.js"></script>

<script src="dist/js/sidebar.js"></script>
<script src="dist/js/report.js"></script>

<script>
    if ( window.history.replaceState ) {
        window.history.replaceState( null, null, window.location.href );
    }
</script>

<?php include 'modules/footer.php'; ?>