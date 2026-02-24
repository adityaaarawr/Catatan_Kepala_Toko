/* ==============================================
   DATA TABLE INIT
=================================================== */
function initDataTable() {
    if (typeof $ !== 'undefined' && $.fn.DataTable) {

    // Pastikan ID tabel sesuai dengan yang ada di report.php
    if ($.fn.DataTable.isDataTable('#reportTable-all')) {
        $('#reportTable-all').DataTable().destroy();
    }

    $('#reportTable-all').DataTable({
        responsive: false,
        lengthChange: false,
        autoWidth: false,
        paging: true,
        pageLength: 10,
        searching: false,
        ordering: false,
        info: true,
        columnDefs: [
            { className: "dt-center", targets: "_all" }
        ],
    });
    
    } else {
        // Jika library belum siap, tunggu 100ms lalu coba lagi
        setTimeout(initDataTable, 100);
    }
}

/* ==============================================
   INIT APPLICATION
=================================================== */
function initApplication() {
}

/* ==============================================
       LOGIKA SELECT KARYAWAN, DIVISI, TOKO
    ===================================================== */
$(document).ready(function () {
    initDataTable();

    const $karyawan = $('#filterKaryawan');
    const $divisi   = $('#filterDivisi');
    const $toko     = $('#filterToko');

   $('#filterKaryawan').select2({
    width: '100%',
    dropdownAutoWidth: false
}).on('select2:open', function () {
    $('.select2-search__field').attr('placeholder', 'Cari Karyawan...');
});

$('#filterDivisi').select2({
    width: '100%',
    dropdownAutoWidth: false
}).on('select2:open', function () {
    $('.select2-search__field').attr('placeholder', 'Cari Divisi...');
});

$('#filterToko').select2({
    width: '100%',
    dropdownAutoWidth: false
}).on('select2:open', function () {
    $('.select2-search__field').attr('placeholder', 'Cari Toko...');
});

    // Simpan semua opsi asli untuk dikembalikan saat reset
    const original = {
        karyawan: $karyawan.html(),
        divisi: $divisi.html(),
        toko: $toko.html()
    };

    /* ============================================================
        1. JIKA PILIH KARYAWAN -> AUTO ISI TOKO & DIVISI
    ============================================================ */
    $karyawan.on('change', function (e, isAuto) {
        if (isAuto) return;
        const opt = $(this).find(':selected');
        const d = opt.data('divisi');
        const t = opt.data('toko');

        if (d) $divisi.val(d).trigger('change.select2', [true]);
        if (t) $toko.val(t).trigger('change.select2', [true]);
    });

    /* ============================================================
       2. JIKA PILIH TOKO/DIVISI -> KARYAWAN MENGERUCUT
    ============================================================ */
    function filterKaryawan() {
        const d = $divisi.val();
        const t = $toko.val();

        $karyawan.html(original.karyawan); // Reset dulu
        $karyawan.find('option').each(function () {
            if (!$(this).val()) return;
            const kd = $(this).data('divisi');
            const kt = $(this).data('toko');

            // Logika mengerucut: hapus jika tidak cocok dengan filter aktif
            if ((d && kd !== d) || (t && kt !== t)) {
                $(this).remove();
            }
        });
        $karyawan.trigger('change.select2', [true]);
    }

    /* ============================================================
      3. JIKA PILIH DIVISI -> TOKO & KARYAWAN MENGERUCUT
    ============================================================ */
    $divisi.on('change', function (e, isAuto) {
    if (isAuto) return;
    filterToko();
    filterKaryawan();
});

function filterDivisi() {
    const t = $toko.val();
    const selectedDivisi = $divisi.val(); // SIMPAN PILIHAN

    $divisi.html(original.divisi);

    if (t) {
        $divisi.find('option').each(function () {
            if (!$(this).val()) return;

            const d = $(this).val();
            let found = false;

            $(original.karyawan).each(function () {
                const opt = $(this);
                if (
                    opt.data('toko') === t &&
                    opt.data('divisi') === d
                ) {
                    found = true;
                }
            });

            if (!found) $(this).remove();
        });
    }

    // 🔐 BALIKIN DIVISI JIKA MASIH ADA
    if (
        selectedDivisi &&
        $divisi.find(`option[value="${selectedDivisi}"]`).length
    ) {
        $divisi.val(selectedDivisi);
    } else {
        $divisi.val(null);
    }

    $divisi.trigger('change.select2', [true]);
}

/* ============================================================
      3. JIKA PILIH TOKO -> DIVISI & KARYAWAN MENGERUCUT
    ============================================================ */
$toko.on('change', function (e, isAuto) {
    if (isAuto) return;
    filterDivisi();
    filterKaryawan();
});

function filterToko() {
    const d = $divisi.val();
    const selectedToko = $toko.val(); // SIMPAN PILIHAN

    $toko.html(original.toko);

    if (d) {
        $toko.find('option').each(function () {
            if (!$(this).val()) return;

            const t = $(this).val();
            let found = false;

            $(original.karyawan).each(function () {
                const opt = $(this);
                if (
                    opt.data('divisi') === d &&
                    opt.data('toko') === t
                ) {
                    found = true;
                }
            });

            if (!found) $(this).remove();
        });
    }

    // 🔐 BALIKIN TOKO JIKA MASIH ADA
    if (
        selectedToko &&
        $toko.find(`option[value="${selectedToko}"]`).length
    ) {
        $toko.val(selectedToko);
    } else {
        $toko.val(null);
    }

    $toko.trigger('change.select2', [true]);
}

/* ==============================================
      Script untuk Toggle Detail di Mobile
    =================================================== */
$(document).on('click', '.toggle-detail', function() {
    const $tr = $(this).closest('tr');
    $tr.toggleClass('show-detail');
    
    // Ubah teks tombol
    if ($tr.hasClass('show-detail')) {
        $(this).text('TUTUP DETAIL');
    } else {
        $(this).text('LIHAT DETAIL');
    }
});
});

// 1. FUNGSI FILTER MOBILE
function toggleMobileFilter() {
    const filterGrid = document.getElementById('filterGrid');
    const triggerBtn = document.querySelector('.mobile-filter-trigger');
    
    if (!filterGrid) return;

    // Paksa paksa buka/tutup
    if (filterGrid.style.display === 'grid' || filterGrid.classList.contains('show-mobile')) {
        filterGrid.classList.remove('show-mobile');
        filterGrid.style.display = 'none'; // Paksa sembunyi
        triggerBtn.innerText = 'FILTER DATA';
    } else {
        filterGrid.classList.add('show-mobile');
        filterGrid.style.display = 'grid'; // Paksa muncul
        triggerBtn.innerText = 'TUTUP FILTER';
    }
}

// 2. FUNGSI DETAIL MOBILE (Gunakan ini jika CSS tidak mau diubah)
function handleDetailClick(element, event) {
    event.preventDefault();
    event.stopPropagation(); // Stop klik tembus ke elemen di bawahnya

    const $tr = $(element).closest('tr');
    $tr.toggleClass('show-detail');

    if ($tr.hasClass('show-detail')) {
        element.innerText = 'TUTUP DETAIL';
        element.style.backgroundColor = '#ff4d4d'; // Beri warna tanda tutup
        element.style.color = 'white';
    } else {
        element.innerText = 'LIHAT DETAIL';
        element.style.backgroundColor = '#f0f4f8'; // Warna asli CSS Anda
        element.style.color = 'black';
    }
}