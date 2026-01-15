<?php
$pageTitle = 'Home'; 
$cssFile = 'home.css'; 
$jsFile = 'home.js';
include 'modules/header.php'; 

require_once "direct/config.php"; 

// ===== MASTER DATA ===== //

// TOKO
$stmt = $conn->prepare("SELECT id, nama_toko FROM toko ORDER BY nama_toko");
$stmt->execute();
$tokoList = $stmt->fetchAll(PDO::FETCH_ASSOC);

// KARYAWAN + DIVISI
$stmt = $conn->prepare("
    SELECT 
        k.id, 
        k.name, 
        k.nama_karyawan, 
        d.id AS divisi_id, 
        d.nama_divisi
    FROM karyawan k
    LEFT JOIN divisi d ON k.divisi_id = d.id
    ORDER BY k.name
");
$stmt->execute();
$karyawanList = $stmt->fetchAll(PDO::FETCH_ASSOC);

// TOPIK
$stmt = $conn->prepare("SELECT id, nama_topik FROM topik ORDER BY nama_topik");
$stmt->execute();
$topikList = $stmt->fetchAll(PDO::FETCH_ASSOC);


// ===== AJAX HANDLER ===== //
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // ===== DELETE =====
    if (isset($_POST['ajax_delete'])) {
        $id = (int)$_POST['id'];
        $stmt = $conn->prepare("DELETE FROM notes WHERE id=?");
        echo $stmt->execute([$id]) ? "success" : "gagal";
        exit;
    }

    // ===== UPDATE ===== //
    if (isset($_POST['ajax_update'])) {

        $id = (int)$_POST['id'];

        $stmt = $conn->prepare("
            UPDATE notes SET 
                toko_id=?, karyawan_id=?, divisi_id=?, topik_id=?, tanggal=?, catatan=?
            WHERE id=?
        ");

        echo $stmt->execute([
            $_POST['toko_id'],
            $_POST['karyawan_id'],
            $_POST['divisi_id'],
            $_POST['topik_id'],
            $_POST['tanggal'],
            $_POST['catatan'],
            $id
        ]) ? "success" : "gagal";

        exit;
    }

    // ===== INSERT ===== //
    if (isset($_POST['ajax_save'])) {

        try {

            $toko_id   = $_POST['toko_id'] ?? null;
            $karyawan_id = $_POST['karyawan_id'] ?? null;
            $divisi_id   = $_POST['divisi_id'] ?? null;
            $topik_id  = $_POST['topik_id'] ?? null;
            $tanggal   = $_POST['tanggal'] ?? null;
            $catatan   = $_POST['catatan'] ?? null;
            $user_id   = 1; 

            if (!$toko_id || !$karyawan_id || !$topik_id || !$tanggal) {
                exit("Data wajib belum lengkap!");
            }

            if (empty($catatan) && empty($_FILES['file']['name'])) {
                exit("Catatan atau file wajib diisi!");
            }

            $file_name = null;

            if (!empty($_FILES['file']['name'])) {

                $allow = ['jpg','jpeg','png','webp','pdf'];
                $ext = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION));

                if(!in_array($ext, $allow)){
                    exit("Format file tidak diizinkan!");
                }

                if($_FILES['file']['size'] > 2 * 1024 * 1024){
                    exit("Ukuran file maksimal 2MB!");
                }

                if (!is_dir("uploads")) mkdir("uploads", 0777, true);

                $file_name = uniqid("note_") . "." . $ext;
                move_uploaded_file($_FILES['file']['tmp_name'], "uploads/" . $file_name);
            }

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


// --- QUERY TAMPIL DATA ---
$sqlFetch = "
SELECT n.*, 
       u.username, 
       t.nama_toko, 
       k.name AS nama_karyawan,
       k.nama_karyawan AS nama_lengkap,
       d.nama_divisi,
       tp.nama_topik
FROM notes n
LEFT JOIN users u ON n.user_id = u.id
LEFT JOIN toko t ON n.toko_id = t.id
LEFT JOIN karyawan k ON n.karyawan_id = k.id
LEFT JOIN divisi d ON n.divisi_id = d.id
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
            <table id="noteTable">
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
                                data-divisi="<?= $row['nama_divisi'] ?>"
                                data-topik="<?= $row['nama_topik'] ?>"
                                data-tanggal="<?= $row['tanggal'] ?>"
                                data-catatan="<?= htmlspecialchars($row['catatan']) ?>"
                                data-inputer="<?= htmlspecialchars($row['username']) ?>"
                                data-toko="<?= htmlspecialchars($row['nama_toko']) ?>"
                                data-karyawan="<?= htmlspecialchars($row['nama_karyawan']) ?>"
                                data-file="<?= $row['file_name'] ?>"
                            >

                            <tr>
                                <td><?= $no++ ?></td>
                                <td><?= $row['tanggal'] ?></td>
                                <td><?= $row['username'] ?? '-' ?></td>
                                <td><?= $row['nama_toko'] ?? '-' ?></td>
                                <td title="<?= $row['nama_lengkap'] ?? '' ?>">
                                    <?= $row['nama_karyawan'] ?? '-' ?>
                                </td>
                                <td><?= $row['nama_divisi'] ?? '-' ?></td>
                                <td><?= $row['nama_topik'] ?? '-' ?></td>
                                <td class="catatan-cell" title="<?= htmlspecialchars($row['catatan']) ?>">
                                    <?= strlen($row['catatan']) > 10 
                                        ? htmlspecialchars(substr($row['catatan'], 0, 10)) . '...' 
                                        : htmlspecialchars($row['catatan']); ?>
                                </td>
                                <td>
                                    <?php if($row['file_name']): ?>
                                        <a href="uploads/<?= $row['file_name'] ?>" target="_blank">Lihat</a>
                                    <?php else: ?> - <?php endif; ?>
                                </td>
                                <td>
                                    <span class="action-cell">
                                        <span class="edit-btn" onclick="openEditModal(this)" title="Edit">
                                            <i class="fas fa-edit"></i>
                                        </span>
                                        <span class="delete-btn" onclick="deleteNote(<?= $row['id'] ?>)" title="Delete">
                                            <i class="fas fa-trash"></i>
                                        </span>
                                    </span>
                                </td>
                                <div id="emptyState" class="empty-state" 
                                    style="<?= count($notes) > 0 ? 'display:none;' : 'display:block;' ?>">
                                    <i class="fas fa-folder-open"></i>
                                    <p>Belum ada catatan yang masuk.</p>
                                </div>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>

            <div id="emptyState" class="empty-state" 
                style="<?= count($notes) > 0 ? 'display:none;' : 'display:block;' ?>">
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

            <label for="inputToko">TOKO</label>
            <select id="inputToko" name="toko_id" required>
                <option value="">Pilih Toko</option>
                <?php foreach($tokoList as $t): ?>
                    <option value="<?= $t['id'] ?>"><?= $t['nama_toko'] ?></option>
                <?php endforeach; ?>
            </select>

            <label>KARYAWAN</label>
              <select type="text" name="karyawan_id" id="inputKaryawan" placeholder="Cari Karyawan..." onchange="updateDivisi()">
                <option value="">Pilih Karyawan</option>
                <?php foreach($karyawanList as $k): ?>
                    <option 
                        value="<?= $k['id'] ?>" 
                        data-divisi-id="<?= $k['divisi_id'] ?>"
                        data-divisi-nama="<?= $k['nama_divisi'] ?>"
                        data-search="<?= strtolower($k['name'].' '.$k['nama_karyawan']) ?>">
                        <?= htmlspecialchars($k['name']) ?>
                    </option>
                <?php endforeach; ?>
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
            <input type="file" id="inputFile" name="file" accept="image/*" capture="environment">

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
                    <div class="detail-field-group">
                        <label>INPUTER</label>
                        <span id="viewInputer" class="view-data-field">Bambang</span>
                    </div>
                    <div class="detail-field-group">
                        <label>TOKO</label>
                        <span id="viewToko" class="view-data-field">IKKOU</span>
                    </div>
                    <div class="detail-field-group">
                        <label>KARYAWAN</label>
                        <span id="viewKaryawan" class="view-data-field">Rudi</span>
                    </div>
                    <div class="detail-field-group">
                        <label>TOPIK</label>
                        <span id="viewTopik" class="view-data-field">Kedisiplinan</span>
                    </div>
                    <div class="detail-field-group">
                        <label>DIVISI</label>
                        <span id="viewDivisi" class="view-data-field">Regular</span>
                    </div>
                    <div class="detail-field-group">
                        <label>DATE</label>
                        <span id="viewDate" class="view-data-field">5 Januari 2025</span>
                    </div>
                    <div class="view-attachments">
                        <label>LAMPIRAN</label>
                        <span id="viewLampiran">Tidak ada lampiran.</span>
                    </div> 
                </div>
                <div class="view-right-column">
                    <div class="view-catatan">
                        <label>CATATAN</label>
                        <p id="viewCatatan" class="catatan-display">Isi catatan muncul di sini...</p>
                    </div>
                    <div class="view-preview">
                        <label>PREVIEW</label>
                        <div class="preview-box">Tidak ada file gambar terlampir.</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="view-actions">
            <button class="close-btn" onclick="closeViewModal()">TUTUP</button>
        </div>
    </div>
</div>
    
<?php include 'modules/footer.php'; ?>
