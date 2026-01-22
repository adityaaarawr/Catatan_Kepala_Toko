<?php 
date_default_timezone_set('Asia/Jakarta');
$pageTitle = 'Report'; 
$cssFile = 'report.css'; 
$jsFile = 'report.js';
include './direct/config.php';

// Fungsi Fetch API
function fetch_api_data($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Gunakan jika ada masalah SSL
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
}

// Ambil Data dari API
$apiUrl = "https://toyomatsu.ddns.net/master/api/?login=true";
$karyawanList = fetch_api_data($apiUrl) ?? [];

// Mapping data dari API ke variabel yang digunakan di form
// Sesuaikan index array ('karyawan', 'divisi', 'toko') dengan struktur JSON dari API
$karyawanList = $apiData['data']['karyawan'] ?? [];
$divisiList   = $apiData['data']['divisi'] ?? [];
$tokoList     = $apiData['data']['toko'] ?? [];

include 'modules/header.php'; 

// 3. TANGKAP FILTER FORM
$f_karyawan = $_POST['karyawan'] ?? '';
$f_divisi   = $_POST['divisi'] ?? '';
$f_toko     = $_POST['toko'] ?? '';
$f_start    = $_POST['start_date'] ?? date('Y-m-d');
$f_end      = $_POST['end_date'] ?? date('Y-m-d');

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


// // DIVISI
// $sqlDivisi = "SELECT * FROM divisi WHERE 1=1";
// $params = [];

// if ($f_toko) {
//     $sqlDivisi .= " AND toko_id = ?";
//     $params[] = $f_toko;
// }

// $stmt = $conn->prepare($sqlDivisi . " ORDER BY nama_divisi");
// $stmt->execute($params);
// $divisiList = $stmt->fetchAll();

// // TOKO
// $sqlToko = "SELECT * FROM toko WHERE 1=1";
// $params = [];

// if ($f_divisi) {
//     $sqlToko .= " AND id IN (SELECT toko_id FROM divisi WHERE id = ?)";
//     $params[] = $f_divisi;
// }

// $stmt = $conn->prepare($sqlToko . " ORDER BY nama_toko");
// $stmt->execute($params);
// $tokoList = $stmt->fetchAll();

// // KARYAWAN
// $sqlKaryawan = "SELECT * FROM karyawan WHERE 1=1";
// $params = [];

// if ($f_divisi) {
//     $sqlKaryawan .= " AND divisi_id = ?";
//     $params[] = $f_divisi;
// }
// if ($f_toko) {
//     $sqlKaryawan .= " AND toko_id = ?";
//     $params[] = $f_toko;
// }

// $stmt = $conn->prepare($sqlKaryawan . " ORDER BY nama_karyawan");
// $stmt->execute($params);
// $karyawanList = $stmt->fetchAll();

// 4. QUERY UTAMA TABEL
$sqlNotes = "SELECT n.*, u.name as inputer, t.nama_toko, d.nama_divisi, tp.nama_topik, k.nama_karyawan 
             FROM notes n
             LEFT JOIN users u ON n.user_id = u.id
             LEFT JOIN toko t ON n.toko_id = t.id
             LEFT JOIN divisi d ON n.divisi_id = d.id
             LEFT JOIN topik tp ON n.topik_id = tp.id
             LEFT JOIN karyawan k ON n.karyawan_id = k.id
             WHERE 1=1";

if(!empty($f_karyawan)) $sqlNotes .= " AND n.karyawan_id = '$f_karyawan'";
if(!empty($f_divisi))   $sqlNotes .= " AND n.divisi_id = '$f_divisi'";
if(!empty($f_toko))     $sqlNotes .= " AND n.toko_id = '$f_toko'";
if(!empty($f_start))    $sqlNotes .= " AND n.tanggal >= '$f_start'";
if(!empty($f_end))      $sqlNotes .= " AND n.tanggal <= '$f_end'";

$notesList = $conn->query($sqlNotes . " ORDER BY n.created_at DESC")->fetchAll(PDO::FETCH_ASSOC);
$divisiList = $conn->query("SELECT * FROM divisi ORDER BY nama_divisi")->fetchAll(PDO::FETCH_ASSOC);
$tokoList   = $conn->query("SELECT * FROM toko ORDER BY nama_toko")->fetchAll(PDO::FETCH_ASSOC);

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
    <?php foreach($karyawanList as $k) : ?>
        <option value="<?= $k['id'] ?>" 
                data-toko="<?= $k['toko_id'] ?>" 
                data-divisi="<?= $k['divisi_id'] ?>"
                <?= ($f_karyawan == $k['id']) ? 'selected' : '' ?>>
            <?= strtoupper($k['nama']) ?> </option>
    <?php endforeach; ?>
</select>

                    <select name="divisi" id="filterDivisi" class="select2">
    <option value="">ALL DIVISI</option> 
    <?php foreach($divisiList as $d) : ?>
        <option value="<?= $d['id'] ?>" 
                data-toko="<?= $d['toko_id'] ?>"
                <?= ($f_divisi == $d['id']) ? 'selected' : '' ?>>
            <?= strtoupper($d['nama_divisi']) ?>
        </option>
    <?php endforeach; ?>
</select>

                        <select name="toko" id="filterToko" class="select2">
                            <option value="">ALL TOKO</option> 
                            <?php foreach($tokoList as $t) : ?>
                                <option value="<?= $t['id'] ?>" <?= ($f_toko == $t['id']) ? 'selected' : '' ?>>
                                    <?= strtoupper($t['nama_toko']) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>

                        <div class="date-range">
                            <input type="date" name="start_date" value="<?= $f_start ?>">
                            <input type="date" name="end_date" value="<?= $f_end ?>">
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
                                <td><?= $note['created_at'] ?></td>
                                <td><?= strtoupper($note['inputer'] ?? '-') ?></td>
                                <td><?= strtoupper($note['nama_toko'] ?? '-') ?></td>
                                <td><?= strtoupper($note['nama_divisi'] ?? '-') ?></td>
                                <td><?= strtoupper($note['nama_topik'] ?? '-') ?></td>
                                <td><?= strtoupper($note['nama_karyawan'] ?? '-') ?></td>
                                <td><?= $note['catatan'] ?></td>
                                <td><?php if (!empty($note['file'])): ?><a href="uploads/<?= $note['file'] ?>" target="_blank" style="color: blue; text-decoration: underline;">Lihat File</a><?php else: ?><span style="color: #ccc;">No File</span><?php endif; ?></td>
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

<!-- ======================
     MODAL EDIT
====================== -->
        <div id="modalEdit" class="modal-overlay">
            <div class="modal-box">

                <div class="modal-header">
                    <h3>EDIT DATA</h3>
                    <span class="modal-close">&times;</span>
                </div>

                <div class="modal-body">
                <div class="modal-grid">

            <div>
                <label>INPUT DATETIME</label>
                <input type="datetime-local" id="editDatetime">
            </div>

                    <div>
                    <label>INPUTER</label>
                    <select id="editInputer"></select>
                    </div>

                    <div>
                    <label>TOKO</label>
                    <select id="editToko"></select>
                    </div>

            <div class="full">
                    <label>DIVISI</label>
                    <input type="text" id="editDivisi" readonly>
                    </div>

                    <div>
                    <label>TOPIK</label>
                    <select id="editTopik"></select>
                    </div>

                    <div class="form-group karyawan">
                    <label>KARYAWAN</label>
                    <select id="editKaryawan"></select>
                    </div>

                    <div class="full">
                <label>CATATAN</label>
                <textarea id="editCatatan" rows="3"></textarea>
            </div>

            <div class="full">
                <label>FILE</label>
                <input type="text" id="editFile">
            </div>
                </div>

                <div class="modal-footer">
                <button class="btn-cancel">BATAL</button>
                <button class="btn-save">SIMPAN</button>
                </div>

            </div>
        </div>
    </main>
</div>

<script>
    // Ambil data langsung dari variabel PHP yang menampung hasil API
    const MASTER_DATA = {
        karyawan: <?= json_encode($karyawanList) ?>,
        divisi: <?= json_encode($divisiList) ?>,
        toko: <?= json_encode($tokoList) ?>
    };

    if ( window.history.replaceState ) {
        window.history.replaceState( null, null, window.location.href );
    }
</script>

<?php include 'modules/footer.php'; ?>