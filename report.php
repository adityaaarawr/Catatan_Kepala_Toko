<?php 
$pageTitle = 'Report'; 
$cssFile = 'report.css'; 
$jsFile = 'report.js';

include './direct/config.php';
include 'modules/header.php'; 
?>

<?php
// Ambil data karyawan
$karyawanStmt = $conn->query("SELECT id, nama_karyawan FROM karyawan ORDER BY nama_karyawan");
$karyawanList = $karyawanStmt->fetchAll(PDO::FETCH_ASSOC);

// Ambil data divisi
$divisiStmt = $conn->query("SELECT id, nama_divisi FROM divisi ORDER BY nama_divisi");
$divisiList = $divisiStmt->fetchAll(PDO::FETCH_ASSOC);

// Ambil data toko
$tokoStmt = $conn->query("SELECT id, nama_toko FROM toko ORDER BY nama_toko");
$tokoList = $tokoStmt->fetchAll(PDO::FETCH_ASSOC);

// Ambil data topik
$topikStmt = $conn->query("SELECT id, nama_topik FROM topik ORDER BY nama_topik");
$topikList = $topikStmt->fetchAll(PDO::FETCH_ASSOC);

// Ambil data users (inputer)
$usersStmt = $conn->query("SELECT id, name FROM users ORDER BY name");
$usersList = $usersStmt->fetchAll(PDO::FETCH_ASSOC);
?>

<?php
// =====================
// AMBIL DATA NOTES (REPORT)
// =====================
$notesStmt = $conn->query("
    SELECT 
        n.id,
        n.created_at,
        u.name AS inputer,
        t.nama_toko,
        d.nama_divisi,
        tp.nama_topik,
        k.nama_karyawan,
        n.catatan,
        n.file_name
    FROM notes n
    LEFT JOIN users u ON n.user_id = u.id
    LEFT JOIN toko t ON n.toko_id = t.id
    LEFT JOIN divisi d ON n.divisi_id = d.id
    LEFT JOIN topik tp ON n.topik_id = tp.id
    LEFT JOIN karyawan k ON n.karyawan_id = k.id
    ORDER BY n.created_at DESC
");

$notesList = $notesStmt->fetchAll(PDO::FETCH_ASSOC);
?>



<div class="layout"> 
    <?php include 'modules/sidebar.php'; ?>
    <main>
        <div class="topbar">
            <h1 class="title">REPORT CATATAN KARYAWAN</h1>
        </div>
        
        <div class="container">
            <div class="filter-card">
                <div class="filter-grid">
                    <!-- Karyawan -->
<select id="filterKaryawan" data-placeholder="Karyawan">
    <option value=""></option>
    <?php foreach($karyawanList as $k) : ?>
        <option value="<?= $k['id'] ?>"><?= $k['nama_karyawan'] ?></option>
    <?php endforeach; ?>
</select>

<!-- Divisi -->
<select id="filterDivisi" data-placeholder="Divisi">
    <option value=""></option>
    <?php foreach($divisiList as $d) : ?>
        <option value="<?= $d['id'] ?>"><?= $d['nama_divisi'] ?></option>
    <?php endforeach; ?>
</select>

<!-- Toko -->
<select id="filterToko" data-placeholder="Toko">
    <option value=""></option>
    <?php foreach($tokoList as $t) : ?>
        <option value="<?= $t['id'] ?>"><?= $t['nama_toko'] ?></option>
    <?php endforeach; ?>
</select>


                    <div class="date-range">
                        <input type="date" id="filterDateStart">
                        <input type="date" id="filterDateEnd">
                    </div>

                        <button id="btnGenerate" class="btn-generate">GENERATE</button>
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
                            <th>ACTION</th>
                        </tr>
                    </thead>
                    <tbody id="tableBody">
                       <?php if(count($notesList) > 0): ?>
    <?php foreach($notesList as $i => $note): ?>
        <tr>
            <td><?= $i + 1 ?></td>
            <td><?= $note['created_at'] ?></td>
            <td><?= $note['inputer'] ?></td>
            <td><?= $note['nama_toko'] ?></td>
            <td><?= $note['nama_divisi'] ?></td>
            <td><?= $note['nama_topik'] ?></td>
            <td><?= $note['nama_karyawan'] ?></td>
            <td><?= $note['catatan'] ?></td>
            <td><?= $note['file_name'] ?></td>
            <td><!-- Action button nanti --></td>
        </tr>
    <?php endforeach; ?>
<?php else: ?>
    <tr>
        <td colspan="10" style="text-align:center;color:#888">
            Tidak ada data...
        </td>
    </tr>
<?php endif; ?>

                    </tbody>
                </table>
            </div>
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

<?php include 'modules/footer.php'; ?>