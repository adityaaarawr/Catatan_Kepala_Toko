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
$sqlNotes = "SELECT n.*, u.name as inputer, t.nama_topik 
             FROM notes n
             LEFT JOIN users u ON n.user_id = u.id
             LEFT JOIN topik t ON n.topik_id = t.id
             WHERE 1=1";

$params = []; // Gunakan array untuk menampung parameter

if(!empty($f_karyawan)) { $sqlNotes .= " AND n.karyawan_id = :karyawan"; $params[':karyawan'] = $f_karyawan; }
if(!empty($f_divisi))   { $sqlNotes .= " AND n.divisi_id = :divisi";     $params[':divisi']   = $f_divisi;   }
if(!empty($f_toko))     { $sqlNotes .= " AND n.toko_id = :toko";         $params[':toko']     = $f_toko;     }
// Ubah dari n.tanggal ke n.created_at jika n.tanggal di DB banyak yang kosong
if(!empty($f_start)) { $sqlNotes .= " AND DATE(n.created_at) >= :start"; $params[':start'] = $f_start; }
if(!empty($f_end))   { $sqlNotes .= " AND DATE(n.created_at) <= :end";   $params[':end']   = $f_end; }

$stmt = $conn->prepare($sqlNotes . " ORDER BY n.created_at DESC");
$stmt->execute($params); // Eksekusi dengan array parameter agar jumlah token cocok
$notesList = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Helper Map untuk menampilkan Nama dari NIP/ID API di Tabel
$namaKaryawanMap = array_column($karyawanList, 'nama_karyawan', 'id');
$namaDivisiMap = array_column($divisiList, 'nama_divisi', 'id');
$namaTokoMap = array_column($tokoList, 'nama_toko', 'id');


// JIKA PILIH KARYAWAN → AUTO ISI DIVISI & TOKO (Cari dari hasil API)
if (!empty($f_karyawan)) {
    foreach ($karyawanList as $k) {
        if ($k['id'] == $f_karyawan) {
            $f_divisi = $k['divisi_id'];
            $f_toko   = $k['toko_id'];
            break;
        }
    }
}
?>

<div class="layout"> 
    <?php include 'modules/sidebar.php'; ?>
    <main>
        <div class="topbar">
            <h1 class="title">REPORT CATATAN KARYAWAN</h1>
        </div>
        
        <div class="container">
            <div class="filter-card">
                <form method="POST" action="report.php" id="formReport"> 
                    <div class="filter-grid">
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
                <td><?= strtoupper($note['inputer'] ?? '-') ?></td>
                
              <td><?= strtoupper($namaTokoMap[$note['toko_id']] ?? 'ID '.$note['toko_id'].' TAK ADA DI API') ?></td>

<td><?= strtoupper($namaDivisiMap[$note['divisi_id']] ?? 'ID '.$note['divisi_id'].' TAK ADA DI API') ?></td>

  <td><?= strtoupper($note['nama_topik'] ?? '-') ?></td>

<td><?= strtoupper($namaKaryawanMap[$note['karyawan_id']] ?? 'ID '.$note['karyawan_id'].' TAK ADA DI API') ?></td>
                
                <td><?= nl2br(htmlspecialchars($note['catatan'])) ?></td>
                <td>
                    <?php if (!empty($note['file_name'])): ?>
                        <a href="uploads/<?= $note['file_name'] ?>" target="_blank">Lihat File</a>
                    <?php else: ?>
                        <span style="color: #ccc;">No File</span>
                    <?php endif; ?>
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

<script>
    if ( window.history.replaceState ) {
        window.history.replaceState( null, null, window.location.href );
    }
</script>


<?php include 'modules/footer.php'; ?>