<?php
$pageTitle = 'Home'; 
$cssFile = 'home.css'; 
$jsFile = 'home.js';
include 'modules/header.php'; 

require_once "direct/config.php";

$sql = "SELECT n.*, 
               u.username,
               t.nama_toko,
               k.nama_karyawan,
               d.nama_divisi,
               tp.nama_topik
        FROM notes n
        LEFT JOIN users u ON n.user_id = u.id
        LEFT JOIN toko t ON n.toko_id = t.id
        LEFT JOIN karyawan k ON n.karyawan_id = k.id
        LEFT JOIN divisi d ON n.divisi_id = d.id
        LEFT JOIN topik tp ON n.topik_id = tp.id
        ORDER BY n.created_at DESC";

$stmt = $conn->prepare($sql);
$stmt->execute();
$notes = $stmt->fetchAll(PDO::FETCH_ASSOC);

$stmt = $conn->query("SELECT COUNT(*) FROM notes");
$total = $stmt->fetchColumn();

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
                            <tr>
                                <td><?= $no++ ?></td>
                                <td><?= $row['tanggal'] ?></td>
                                <td><?= $row['username'] ?? '-' ?></td>
                                <td><?= $row['nama_toko'] ?? '-' ?></td>
                                <td><?= $row['nama_karyawan'] ?? '-' ?></td>
                                <td><?= $row['nama_divisi'] ?? '-' ?></td>
                                <td><?= $row['nama_topik'] ?? '-' ?></td>
                                <td><?= $row['catatan'] ?></td>
                                <td>
                                    <?php if($row['file_name']): ?>
                                        <a href="uploads/<?= $row['file_name'] ?>" target="_blank">Lihat</a>
                                    <?php else: ?> - <?php endif; ?>
                                </td>
                                <td>
                                    <button>View</button>
                                    <button>Delete</button>
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
        
        <form id="noteForm">
            <label for="inputToko">TOKO</label>
            <select id="inputToko" required>
                <option value="" disabled selected>Pilih Toko</option>
                <option value="toyomatsu">Toyomatsu</option>
                <option value="robin jaya">Robin Jaya</option>
                <option value="online">Online</option>
                <option value="hikomi">Hikomi</option>
                <option value="ikkou">Ikkou</option>
            </select>

            <label for="inputKaryawan">KARYAWAN</label>
            <input list="karyawanList" id="inputKaryawan" placeholder="Ketik Nama Karyawan..." required onchange="updateDivisi()">
            <datalist id="karyawanList">
                <option value="Rudi"></option>
                <option value="Roni"></option>  
                <option value="Dina"></option>
                <option value="Didik"></option>
            </datalist>

            <label for="inputDivisi">DIVISI</label>
            <input type="text" id="inputDivisi" readonly style="background-color: var(--bg); cursor: not-allowed;">

            <label for="inputTopik">TOPIK</label>
            <select id="inputTopik" required>
                <option value="" disabled selected>Pilih Topik</option>
                <option value="Gagal Kirim">Gagal Kirim</option>
                <option value="Omset">Omset</option>
                <option value="Kinerja">Kinerja</option>
                <option value="Absensi">Absensi</option>
                <option value="Kedisiplinan">Kedisiplinan</option>
                <option value="Kebersihan">Kebersihan</option>
            </select>

            <label for="inputDate">DATE</label>
            <input type="date" id="inputDate">

            <label for="inputCatatan">CATATAN</label>
            <textarea id="inputCatatan" placeholder="Bisa dikosongkan jika sudah ada file..."></textarea>

            <label for="inputFile">AMBIL GAMBAR / FILE</label>
            <input type="file" id="inputFile" accept="image/*" capture="environment">

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