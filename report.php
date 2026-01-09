<?php 
$pageTitle = 'Report'; 
$cssFile = 'report.css'; 
$jsFile = 'report.js';
include 'modules/header.php'; 
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
                    <select id="filterKaryawan" data-placeholder="Karyawan">
                        <option value=""></option>
                    </select>

                    <select id="filterDivisi" data-placeholder="Divisi">
                        <option value=""></option>
                    </select>

                    <select id="filterToko" data-placeholder="Toko">
                        <option value=""></option>
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
                        <tr>
                            <td colspan="10" style="text-align:center;color:#888">
                                Klik Generate untuk memuat data...
                            </td>
                        </tr>
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