<?php
//================================//
// CONFIG HALAMAN & HEADER       //
//==============================//
$pageTitle = 'Home'; 
$cssFile = 'home.css'; 
$jsFile = 'home.js';
include 'modules/header.php'; 

//================================//
// KONEKSI DATABASE              //
//==============================//
require_once "direct/config.php"; 

//================================//
// AMBIL MASTER DATA (DROPDOWN)  //
//==============================//

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

$apiUrl = "https://toyomatsu.ddns.net/master/api/";
$karyawanAPI = fetch_api_data($apiUrl) ?? [];

$mapNamaKaryawan = [];
$mapToko = [];
$mapDivisi = [];

foreach ($karyawanAPI as $k) {
    $mapNamaKaryawan[$k['id']] = $k['nama_lengkap'];
    $mapToko[$k['store']]      = $k['store'];
    $mapDivisi[$k['posisi']]   = $k['posisi'];
}

// --- Data Topik ---
$stmt = $conn->prepare("SELECT id, nama_topik FROM topik ORDER BY nama_topik");
$stmt->execute();
$topikList = $stmt->fetchAll(PDO::FETCH_ASSOC);

//================================//
// AJAX HANDLER (POST REQUEST)   //
//==============================//
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // --- Proses Delete ---
    if (isset($_POST['ajax_delete'])) {

        $id = (int)$_POST['id'];
    
        // ambil file lama
        $stmt = $conn->prepare("SELECT file_name FROM notes WHERE id=?");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
        if($row && !empty($row['file_name'])){
            $files = json_decode($row['file_name'], true);
            if(is_array($files)){
                foreach($files as $f){
                    $path = "uploads/".$f;
                    if(file_exists($path)){
                        unlink($path);
                    }
                }
            }
        }
    
        // hapus data
        $stmt = $conn->prepare("DELETE FROM notes WHERE id=?");
        echo $stmt->execute([$id]) ? "success" : "gagal";
        exit;
    }

    // --- Proses Update ---
    if (isset($_POST['ajax_update'])) {

        $id = (int)$_POST['id'];
    
        // ===== ambil file lama =====
        $stmt = $conn->prepare("SELECT file_name FROM notes WHERE id=?");
        $stmt->execute([$id]);
        $oldFiles = json_decode($stmt->fetchColumn(), true) ?? [];
    
        // ===== hapus file dicentang =====
        if(!empty($_POST['delete_files'])){
            foreach($_POST['delete_files'] as $df){
                if(in_array($df, $oldFiles)){
                    @unlink("uploads/".$df);
                    $oldFiles = array_diff($oldFiles, [$df]);
                }
            }
        }
    
        // ===== upload file baru =====
        $newFiles = [];
    
        if (!empty($_FILES['lampiran']['name'][0])) {
            foreach ($_FILES['lampiran']['name'] as $i => $name) {
    
                if ($_FILES['lampiran']['error'][$i] !== 0) continue;
    
                $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
                $newName = uniqid("note_") . "." . $ext;
    
                move_uploaded_file($_FILES['lampiran']['tmp_name'][$i], "uploads/" . $newName);
                $newFiles[] = $newName;
            }
        }
    
        // ===== gabung =====
        $finalFiles = array_values(array_merge($oldFiles, $newFiles));
        $file_name = json_encode($finalFiles);
    
        // ===== update DB =====
        $stmt = $conn->prepare("
            UPDATE notes SET 
                toko_id=?, karyawan_id=?, divisi_id=?, topik_id=?, tanggal=?, catatan=?, file_name=?
            WHERE id=?
        ");
    
        echo $stmt->execute([
            $_POST['toko_id'],
            $_POST['karyawan_id'],
            $_POST['divisi_id'],
            $_POST['topik_id'],
            $_POST['tanggal'],
            $_POST['catatan'],
            $file_name,
            $id
        ]) ? "success" : "gagal";
    
        exit;
    }

    // --- Proses Insert (Simpan Baru) ---
    if (isset($_POST['ajax_save'])) {
        try {
    
            $toko_id     = $_POST['toko_id'] ?? null;
            $karyawan_id = $_POST['karyawan_id'] ?? null;
            $divisi_id   = $_POST['divisi_id'] ?? null;
            $topik_id    = $_POST['topik_id'] ?? null;
            $tanggal     = $_POST['tanggal'] ?? null;
            $catatan     = $_POST['catatan'] ?? null;
            $user_id     = 1;
    
            if (!$toko_id || !$karyawan_id || !$topik_id || !$tanggal) {
                exit("Data wajib belum lengkap!");
            }
    
            if (empty($catatan) && empty($_FILES['lampiran']['name'][0])) {
                exit("Catatan atau file wajib diisi!");
            }
    
            $uploadedFiles = [];
    
            if (!empty($_FILES['lampiran']['name'][0])) {
    
                $allow = [
                    'jpg','jpeg','png','webp','gif',
                    'pdf','doc','docx','xls','xlsx','ppt','pptx','zip','rar','mp4','webm'
                ];
    
                if (!is_dir("uploads")) mkdir("uploads", 0777, true);
    
                foreach ($_FILES['lampiran']['name'] as $i => $name) {
    
                    if ($_FILES['lampiran']['error'][$i] !== 0) continue;
    
                    if ($_FILES['lampiran']['size'][$i] > 100 * 1024 * 1024) {
                        exit("Ukuran file maksimal 100MB / file");
                    }
    
                    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
                    if (!in_array($ext, $allow)) {
                        exit("Format file tidak diizinkan: $name");
                    }
    
                    $newName = uniqid("note_") . "." . $ext;
                    move_uploaded_file($_FILES['lampiran']['tmp_name'][$i], "uploads/" . $newName);
    
                    $uploadedFiles[] = $newName;
                }
            }
    
            $file_name = json_encode($uploadedFiles);
    
            $sql = "INSERT INTO notes 
                (user_id, toko_id, karyawan_id, divisi_id, topik_id, tanggal, catatan, file_name, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
    
            $stmt = $conn->prepare($sql);
            echo $stmt->execute([
                $user_id, $toko_id, $karyawan_id, $divisi_id,
                $topik_id, $tanggal, $catatan, $file_name
            ]) ? "success" : "gagal";
    
        } catch (Exception $e) {
            echo "Error: " . $e->getMessage();
        }
        exit;
    }
}    

//================================//
// QUERY TAMPIL DATA UTAMA       //
//==============================//
$sqlFetch = "
    SELECT n.*, 
           u.username, 
           tp.nama_topik
    FROM notes n
    LEFT JOIN users u ON n.user_id = u.id
    LEFT JOIN topik tp ON n.topik_id = tp.id
    ORDER BY n.created_at DESC
";


$stmt = $conn->prepare($sqlFetch);
$stmt->execute();
$notes = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<div class="layout">
    <?php include 'modules/sidebar.php'; ?>
    
    <main>
        <div class="title-container">
            <h1 class="title">DATA CATATAN KARYAWAN</h1>
        </div>
        
        <div class="header-divider"></div>

        <div class="btn-add-container">
            <button class="btn-primary" onclick="openModal()">
                <i class="fas fa-plus"></i> CATATAN
            </button>
        </div>

        <div id="notification-container"></div>

        <div class="filter-controls">
            <button id="btnToggleFilter" class="btn-filter-trigger">
                <i class="fas fa-filter"></i> <span>Filter Data</span>
            </button>
        </div>
        
        <div id="filterCard" class="card filter-card hide-filter">
            <div class="row filter-bar">
                <input type="text" placeholder="TANGGAL" class="filter-input">
                <input type="text" placeholder="INPUTER" class="filter-input">
                <input type="text" placeholder="TOKO" class="filter-input">
                <input type="text" placeholder="DIVISI" class="filter-input">
                <input type="text" placeholder="TOPIK" class="filter-input">
                <input type="text" placeholder="KARYAWAN" class="filter-input">
                <input type="text" id="searchBar" placeholder="SEARCH..." class="filter-input search-input">
            </div>
        </div>

        <div class="table-wrap">
            <table id="noteTable" class="display nowrap" style="width:100%">
                <thead>
                    <tr>
                        <th>NO</th>                                 
                        <th>TANGGAL</th>
                        <th>INPUTER</th>
                        <th>TOKO</th>
                        <th>KARYAWAN</th>
                        <th>DIVISI</th>
                        <th>TOPIK</th>
                        <th>CATATAN</th>
                        <th>FILE</th>
                        <th>ACTION</th>
                    </tr>
                </thead>
                <tbody id="noteTableBody">
                    <?php if(count($notes) > 0): ?>
                        <?php $no = 1; foreach($notes as $row): ?>
                            <tr onclick="openviewModal(this)"
                                data-id="<?= $row['id'] ?>"
                                data-toko_id="<?= $row['toko_id'] ?>"
                                data-karyawan_id="<?= $row['karyawan_id'] ?>"
                                data-divisi_id="<?= $row['divisi_id'] ?>"   
                                data-topik_id="<?= $row['topik_id'] ?>"
                                data-topik="<?= htmlspecialchars($row['nama_topik']) ?>"
                                data-tanggal="<?= $row['tanggal'] ?>"   
                                data-catatan="<?= htmlspecialchars($row['catatan']) ?>"
                                data-inputer="<?= htmlspecialchars($row['username']) ?>"
                                data-file='<?= htmlspecialchars($row['file_name'], ENT_QUOTES) ?>'
                            >

                                <td><?= $no++ ?></td>
                                <td><?= $row['tanggal'] ?></td>
                                <td><?= $row['username'] ?? '-' ?></td>
                                <td><?= strtoupper($mapToko[$row['toko_id']] ?? $row['toko_id'] ?? '-') ?></td>
                                <td title="<?= $mapNamaKaryawan[$row['karyawan_id']] ?? '' ?>">
                                    <?= strtoupper($mapNamaKaryawan[$row['karyawan_id']] ?? 'ID '.$row['karyawan_id'].' TIDAK ADA DI API') ?>
                                </td>
                                <td><?= strtoupper($mapDivisi[$row['divisi_id']] ?? $row['divisi_id'] ?? '-') ?></td>
                                <td><?= $row['nama_topik'] ?? '-' ?></td>
                                <td class="catatan-cell" title="<?= htmlspecialchars($row['catatan']) ?>">
                                    <?= strlen($row['catatan']) > 10 
                                        ? htmlspecialchars(substr($row['catatan'], 0, 10)) . '...' 
                                        : htmlspecialchars($row['catatan']); ?>
                                </td>
                                <td class="file-cell">
                                    <?php 
                                        $files = json_decode($row['file_name'], true);
                                        if ($files && count($files) > 0):
                                            foreach($files as $f):

                                                $short = strlen($f) > 10 ? substr($f, 0, 10) . '...' : $f;
                                    ?>
                                        <a href="uploads/<?= $f ?>" 
                                        target="_blank"
                                        title="<?= htmlspecialchars($f) ?>">
                                            <?= htmlspecialchars($short) ?>
                                        </a><br>
                                    <?php 
                                            endforeach; 
                                        else: 
                                            echo "-";
                                        endif; 
                                    ?>
                                </td>
                                <td>
                                    <span class="action-cell">
                                        <span class="edit-btn" onclick="openEditModal(this, event)" title="Edit">
                                            <i class="fas fa-edit"></i>
                                        </span>
                                        <span class="delete-btn" onclick="deleteNote(<?= $row['id'] ?>, event)" title="Delete">
                                            <i class="fas fa-trash"></i>
                                        </span>
                                    </span>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>

            <div id="emptyState" class="empty-state" style="<?= count($notes) > 0 ? 'display:none;' : 'display:block;' ?>">
                <i class="fas fa-folder-open"></i>
                <p>Belum ada catatan yang masuk.</p>
            </div>  
        </div>

        <div class="table-footer-divider"></div>
        <div class="table-footer">
            <div class="project-name">
                <span>© 2026 Catatan Kepala Toko v1.0.0</span>
            </div>
        </div>
    </main>
</div>

<div id="modal" class="modal">
    <div class="modal-box">
        <h2 id="modal-title" class="modal-title">TAMBAH CATATAN</h2>
        <div class="divider"></div>
        
        <form id="noteForm" enctype="multipart/form-data">
            <label>TOKO</label>
            <select name="toko_id" id="inputToko" required>
                <option value="">Pilih Toko</option>
                
            </select>

            <label>KARYAWAN</label>
            <select name="karyawan_id" id="inputKaryawan" onchange="updateDivisi()" required>
                <option value="">Pilih Karyawan</option>
                
            </select>

            <label>DIVISI</label>
            <input type="hidden" name="divisi_id" id="divisi_id">
            <input type="text" id="inputDivisi" readonly>

            <label for="inputTopik">TOPIK</label>
            <select id="inputTopik" name="topik_id" required>
                <option value="">Pilih Topik</option>
                <?php foreach($topikList as $tp): ?>
                    <option value="<?= $tp['id'] ?>"><?= $tp['nama_topik'] ?></option>
                <?php endforeach; ?>
            </select>

            <label for="inputDate">DATE</label>
            <input type="date" id="inputDate" name="tanggal">

            <label for="inputCatatan">CATATAN</label>
            <textarea id="inputCatatan" name="catatan" placeholder="Bisa dikosongkan jika sudah ada file..."></textarea>

            <label for="inputFile">AMBIL GAMBAR / FILE</label>
            <input type="file" name="lampiran[]" id="inputFile" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar">
            <div id="oldFilesBox" class="old-files" style="display:none; margin-top:10px;">
                <h4>FILE SEBELUMNYA</h4>
                <div id="oldFilesList"></div>
            </div>

            <p id="optionalStatus" style="font-size: 12px; margin-top: -10px; margin-bottom: 15px; color: #e74c3c;">
                *Wajib isi Catatan atau lampirkan File
            </p>
        </form>

        <div class="modal-actions">
            <button type="button" class="cancel-btn" onclick="closeModal()">BATAL</button>
            <button type="button" class="save-btn" onclick="saveNote()">SIMPAN</button>
        </div>
    </div>
</div>

<div id="viewModal" class="modal">
    <div class="modal-box view-note-box">
        <div class="view-header"></div>
        <div class="modal-title">VIEW NOTE</div>
        <div class="divider"></div> 
        
        <div class="modal-content-wrapper"> 
            <div class="modal-content-view">
                <div class="view-details-left">
                    <div class="detail-field-group"><label>INPUTER</label><span id="viewInputer" class="view-data-field"></span></div>
                    <div class="detail-field-group"><label>TOKO</label><span id="viewToko" class="view-data-field"></span></div>
                    <div class="detail-field-group"><label>KARYAWAN</label><span id="viewKaryawan" class="view-data-field"></span></div>
                    <div class="detail-field-group"><label>TOPIK</label><span id="viewTopik" class="view-data-field"></span></div>
                    <div class="detail-field-group"><label>DIVISI</label><span id="viewDivisi" class="view-data-field"></span></div>
                    <div class="detail-field-group"><label>DATE</label><span id="viewDate" class="view-data-field"></span></div>
                    <div class="view-attachments"><label>LAMPIRAN</label><span id="viewLampiran"></span></div> 
                </div>
                <div class="view-right-column">
                    <div class="view-catatan"><label>CATATAN</label><p id="viewCatatan" class="catatan-display"></p></div>
                    <div class="view-preview"><label>PREVIEW</label><div class="preview-box"></div></div>
                </div>
            </div>
        </div>
        <div class="view-actions">
            <button class="close-btn" onclick="closeViewModal()">TUTUP</button>
        </div>
    </div>
</div>

<div id="confirmModal" class="confirm-modal">
  <div class="confirm-box">
    <h3>Hapus Catatan</h3>
    <p>Yakin ingin menghapus catatan ini?</p>
    <div class="confirm-action">
      <button id="confirmCancel">Batal</button>
      <button id="confirmDelete" class="danger">Hapus</button>
    </div>
  </div>
</div>

<?php include 'modules/footer.php'; ?>