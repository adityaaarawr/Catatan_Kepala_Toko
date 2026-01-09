$(document).ready(function () {
    let isSyncing = false;
    let activeRow = null;
    const modal = $('#modalEdit');
  
  /* =============================
     DUMMY DATA (UNTUK TEST ONLY)
     HAPUS BLOK INI TIDAK NGARUH UI
  ============================= */
  const DUMMY_MASTER = {
    karyawan: [
      { id: "all", text: "ALL KARYAWAN" },
      { id: "andi", text: "Andi", divisi: "it", toko: "toko-a" },
      { id: "budi", text: "Budi", divisi: "sales", toko: "toko-b" },
      { id: "citra", text: "Citra", divisi: "hrd",  toko: "toko-a" },
      { id: "doni",  text: "Doni",  divisi: "it",   toko: "toko-b" },
      { id: "eka",   text: "Eka",   divisi: "sales",toko: "toko-a" }
    ],
    divisi: [
      { id: "all", text: "ALL DIVISI" },
      { id: "it", text: "IT" },
      { id: "sales", text: "Sales" },
      { id: "hrd",   text: "HRD" }
    ],
    toko: [
      { id: "all", text: "ALL TOKO" },
      { id: "toko-a", text: "Toko A" },
      { id: "toko-b", text: "Toko B" }
    ],
     inputer: [
      { id: "admin", text: "Admin" },
      { id: "supervisor", text: "Supervisor" },
      { id: "manager", text: "Manager" }
    ],
    topik: [
      { id: "maintenance", text: "Maintenance" },
      { id: "evaluasi", text: "Evaluasi" },
      { id: "server", text: "Server" },
      { id: "recruitment", text: "Recruitment" },
      { id: "target", text: "Target" }
    ]
  };
  
  const DUMMY_TABLE = [
    {
      datetime: "2026-01-07 10:00",
      inputer: "Admin",
      toko: "Toko A",
      divisi: "IT",
      topik: "Maintenance",
      karyawan: "Andi",
      catatan: "Perbaikan sistem",
      file: "report.pdf"
    },
    {
      datetime: "2026-01-07 14:30",
      inputer: "Admin",
      toko: "Toko B",
      divisi: "Sales",
      topik: "Evaluasi",
      karyawan: "Budi",
      catatan: "Meeting bulanan",
      file: "meeting.docx"
    },
     {
      datetime: "2026-01-07 09:15",
      inputer: "Admin",
      toko: "Toko A",
      divisi: "HRD",
      topik: "Recruitment",
      karyawan: "Citra",
      catatan: "Interview kandidat",
      file: "cv.pdf"
    },
    {
      datetime: "2026-01-07 11:45",
      inputer: "Admin",
      toko: "Toko B",
      divisi: "IT",
      topik: "Server",
      karyawan: "Doni",
      catatan: "Restart server",
      file: "server-log.txt"
    },
    {
      datetime: "2026-01-07 16:00",
      inputer: "Admin",
      toko: "Toko A",
      divisi: "Sales",
      topik: "Target",
      karyawan: "Eka",
      catatan: "Review penjualan",
      file: "sales.xlsx"
    }
  ];
  
  function getDivisiByToko(tokoId) {
    const divisiSet = new Set(
      DUMMY_MASTER.karyawan
        .filter(k => tokoId === 'all' || k.toko === tokoId)
        .map(k => k.divisi)
    );
  
    return DUMMY_MASTER.divisi.filter(d =>
      d.id === 'all' || divisiSet.has(d.id)
    );
  }
  
  function getTokoByDivisi(divisiId) {
    const tokoSet = new Set(
      DUMMY_MASTER.karyawan
        .filter(k => divisiId === 'all' || k.divisi === divisiId)
        .map(k => k.toko)
    );
  
    return DUMMY_MASTER.toko.filter(t =>
      t.id === 'all' || tokoSet.has(t.id)
    );
  }
  
  /* =============================
     POPULATE DROPDOWN
  ============================= */
  function populateDropdown(id, data, keepValue = null) {
    const el = $(id);
    const current = keepValue ?? el.val();
  
    el.empty();
    data.forEach(item => {
      el.append(`<option value="${item.id}">${item.text}</option>`);
    });
  
    if (current && el.find(`option[value="${current}"]`).length) {
      el.val(current);
    } else {
      el.val("all");
    }
  
    el.trigger('change.select2');
  }
  
  populateDropdown('#filterKaryawan', DUMMY_MASTER.karyawan);
  populateDropdown('#filterDivisi', DUMMY_MASTER.divisi);
  populateDropdown('#filterToko', DUMMY_MASTER.toko);
  
   /* =============================
       INIT SELECT2
    ============================== */
    function initSelect2(id, placeholder) {
      $(id).select2({
        placeholder,
        width: '100%'
      });
    }
  
    initSelect2('#filterKaryawan', 'Karyawan');
    initSelect2('#filterDivisi', 'Divisi');
    initSelect2('#filterToko', 'Toko');
  
  // Tambahkan ini supaya dropdown modal tampil ke bawah
  $('#modalEdit').on('select2:opening', function(e) {
    $('.select2-container--open').css('z-index', 10000); 
  });
  
  
  // =============================
  // PLACEHOLDER SEARCH SELECT2
  // =============================
  $('#filterKaryawan').on('select2:open', function () {
    $('.select2-search__field').attr('placeholder', 'Cari Karyawan...');
  });
  
  $('#filterDivisi').on('select2:open', function () {
    $('.select2-search__field').attr('placeholder', 'Cari Divisi...');
  });
  
  $('#filterToko').on('select2:open', function () {
    $('.select2-search__field').attr('placeholder', 'Cari Toko...');
  });
  
  /* =============================
       AUTO FOLLOW KARYAWAN
    ============================== */
    $('#filterKaryawan').on('change', function () {
       if (isSyncing) return;
       isSyncing = true;
      const val = this.value;
  
      if (val === "all") {
        $('#filterDivisi').val("all").trigger('change');
        $('#filterToko').val("all").trigger('change');
        isSyncing = false;
        return;
      }
  
      const emp = DUMMY_MASTER.karyawan.find(k => k.id === val);
      if (emp) {
        $('#filterDivisi').val(emp.divisi).trigger('change');
        $('#filterToko').val(emp.toko).trigger('change');
      }
  
      isSyncing = false;
    });
  
  function getKaryawanByFilter(divisi, toko) {
    return DUMMY_MASTER.karyawan.filter(k =>
      k.id === 'all' ||
      (
        (divisi === 'all' || k.divisi === divisi) &&
        (toko === 'all'   || k.toko   === toko)
      )
    );
  }
  
  /* =============================
       AUTO FOLLOW DIVISI / TOKO
    ============================== */
  $('#filterToko').on('change.filterOption', function () {
    if (isSyncing) return;
    isSyncing = true;
  
    const toko = this.value;
    const divisiNow = $('#filterDivisi').val();
  
    populateDropdown('#filterDivisi', getDivisiByToko(toko), divisiNow);
  
   populateDropdown(
     '#filterKaryawan',
     getKaryawanByFilter(divisiNow, toko)
   );
  
    isSyncing = false;
  });
  
  
  $('#filterDivisi').on('change.filterOption', function () {
    if (isSyncing) return;
    isSyncing = true;
  
    const divisi = this.value;
    const tokoNow = $('#filterToko').val();
  
    populateDropdown('#filterToko', getTokoByDivisi(divisi), tokoNow);
  
   populateDropdown(
     '#filterKaryawan',
     getKaryawanByFilter(divisi, tokoNow)
   );
  
    isSyncing = false;
  });
  
  // =============================
  // SET DEFAULT DATE = HARI INI
  // + BLOKIR TANGGAL KE DEPAN
  // =============================
  const today = new Date().toISOString().split('T')[0];
  
  $('#filterDateStart')
    .val(today)
    .attr('max', today);
  
  $('#filterDateEnd')
    .val(today)
    .attr('max', today);
  
  
      /* =============================
         GENERATE TABLE
      ============================== */$('#btnGenerate').on('click', function () {
      const tableBody = $('#tableBody');
      tableBody.empty();
  
      const karyawan = $('#filterKaryawan').val() || 'all';
      const divisi   = $('#filterDivisi').val() || 'all';
      const toko     = $('#filterToko').val() || 'all';
      const dateStart = $('#filterDateStart').val();
      const dateEnd   = $('#filterDateEnd').val();
  
      const result = DUMMY_TABLE.filter(item => {
          const itemDate = item.datetime.split(' ')[0];
  
          // FILTER TANGGAL OPSIONAL
          const matchDate =
              (!dateStart && !dateEnd) || // kalau date range kosong => abaikan
              (!dateStart || itemDate >= dateStart) &&
              (!dateEnd   || itemDate <= dateEnd);
  
          const matchKaryawan =
              karyawan === "all" ||
              normalize(item.karyawan) === karyawan;
  
          const matchDivisi =
              divisi === "all" ||
              normalize(item.divisi) === divisi;
  
          const matchToko =
              toko === "all" ||
              normalize(item.toko) === toko;
  
          return matchDate && matchKaryawan && matchDivisi && matchToko;
      });
  
      if (!result.length) {
        tableBody.html(`<tr><td colspan="10" align="center">Data tidak ditemukan</td></tr>`);
        return;
      }
  
  
      result.forEach((item, i) => {
        const row = $(`
                        <tr class="mobile-card">
                            <td>${i + 1}</td>
                            <td>${item.datetime}</td>
                            <td>${item.inputer}</td>
                            <td>${item.toko}</td>
                            <td>${item.divisi}</td>
                            <td>${item.topik}</td>
                            <td>${item.karyawan}</td>
                            <td>${item.catatan}</td>
                            <td><a href="#">${item.file}</a></td>
                            <td class="action-icons">
                              <span class="icon-edit" data-id="${item.datetime}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/>
            </svg>
        </span>
  
        <span class="icon-delete" data-id="${item.datetime}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
            </svg>
        </span>
        </td>
            </tr>
        `);
  
        // tambahkan toggle button di cell terakhir
            const toggleBtn = $('<div class="toggle-detail">Lihat Detail ▼</div>');
            row.find('td:last-child').append(toggleBtn);
  
            toggleBtn.on('click', function() {
                row.toggleClass('show-detail');
                $(this).text(
                  row.hasClass('show-detail') 
                  ? 'Tutup Detail ▲' 
                  : 'Lihat Detail ▼'
                );
            });
  
            tableBody.append(row);
        });
      });
  
  
      /* ======================
     MODAL EDIT LOGIC
  ====================== */
  $('#editToko, #editKaryawan, #editInputer, #editTopik').select2({
    dropdownParent: $('#modalEdit .modal-body'),
    width: '100%',
    placeholder: 'Pilih'
  });
  
  // POPULATE DROPDOWN MODAL
  function loadModalDropdown() {
     // INPUTER
    $('#editInputer').empty();
    DUMMY_MASTER.inputer.forEach(i =>
      $('#editInputer').append(`<option value="${i.id}">${i.text}</option>`)
    );
  
     // TOKO
    $('#editToko').empty();
    DUMMY_MASTER.toko.forEach(t =>
      $('#editToko').append(`<option value="${t.id}">${t.text}</option>`)
    );
  
     // TOPIK
    $('#editTopik').empty();
    DUMMY_MASTER.topik.forEach(t =>
      $('#editTopik').append(`<option value="${t.id}">${t.text}</option>`)
    );
  
    // KARYAWAN
    $('#editKaryawan').empty();
    DUMMY_MASTER.karyawan
      .filter(k => k.id !== 'all')
      .forEach(k =>
        $('#editKaryawan').append(`<option value="${k.id}">${k.text}</option>`)
      );
  }
  loadModalDropdown();
  
  // ===== BUKA MODAL =====
  $('#tableBody').on('click', '.icon-edit', function () {
    activeRow = $(this).closest('tr');
    const tds = activeRow.find('td');
  
    // DATETIME
    // BATASI DATETIME TIDAK BISA KE DEPAN
  const now = new Date();
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  
  $('#editDatetime').attr('max', localNow);
  
  // SET VALUE DATETIME
  $('#editDatetime').val(
    tds.eq(1).text().replace(' ', 'T')
  );
   $('#editInputer')
      .val(
        DUMMY_MASTER.inputer.find(i => i.text === tds.eq(2).text())?.id
      )
      .trigger('change');
  
    $('#editTopik')
      .val(
        DUMMY_MASTER.topik.find(t => t.text === tds.eq(5).text())?.id
      )
      .trigger('change');
  
    // TOKO
    $('#editToko')
      .val(
        DUMMY_MASTER.toko.find(t => t.text === tds.eq(3).text())?.id
      )
      .trigger('change');
  
    // KARYAWAN
    $('#editKaryawan')
      .val(
        DUMMY_MASTER.karyawan.find(k => k.text === tds.eq(6).text())?.id
      )
      .trigger('change');
  
    // CATATAN
    $('#editCatatan').val(tds.eq(7).text());
  
    // FILE
    $('#editFile').val(tds.eq(8).text());
  
    // DIVISI (readonly)
    $('#editDivisi').val(tds.eq(4).text());
  
  modal.fadeIn();
  });
  
  // ===== AUTO DIVISI IKUT KARYAWAN =====
  $('#editKaryawan').on('change', function () {
    const emp = DUMMY_MASTER.karyawan.find(k => k.id === this.value);
    $('#editDivisi').val(emp ? emp.divisi.toUpperCase() : '');
  });
  
  // ===== TUTUP MODAL =====
  $('.modal-close, .btn-cancel').on('click', function () {
    modal.fadeOut();
  });
  
  // ===== SIMPAN =====
  $('.btn-save').on('click', function () {
    if (!activeRow) return;
  
    activeRow.find('td').eq(2).text($('#editInputer option:selected').text());
    activeRow.find('td').eq(3).text($('#editToko option:selected').text());
    activeRow.find('td').eq(5).text($('#editTopik option:selected').text());
    activeRow.find('td').eq(6).text($('#editKaryawan option:selected').text());
    activeRow.find('td').eq(4).text($('#editDivisi').val());
  
    modal.fadeOut();
  });
  
  function normalize(text) {
    return text
      .toLowerCase()
      .replace(/\s+/g, '-') // semua spasi
      .trim();
  }
  
  });