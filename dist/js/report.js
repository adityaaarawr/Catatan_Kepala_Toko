$(document).ready(function () {
    const $karyawan = $('#filterKaryawan');
    const $divisi   = $('#filterDivisi');
    const $toko     = $('#filterToko');

    $('.select2').select2({ width: '100%' });

    // Simpan semua opsi asli untuk dikembalikan saat reset
    const original = {
        karyawan: $karyawan.html(),
        divisi: $divisi.html()
    };

    // 1. JIKA PILIH KARYAWAN -> AUTO ISI TOKO & DIVISI
    $karyawan.on('change', function (e, isAuto) {
        if (isAuto) return;
        const opt = $(this).find(':selected');
        const d = opt.data('divisi');
        const t = opt.data('toko');

        if (d) $divisi.val(d).trigger('change.select2', [true]);
        if (t) $toko.val(t).trigger('change.select2', [true]);
    });

    // 2. JIKA PILIH TOKO/DIVISI -> KARYAWAN MENGERUCUT
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

    $divisi.on('change', function (e, isAuto) {
        if (isAuto) return;
        filterKaryawan();
    });

    $toko.on('change', function (e, isAuto) {
        if (isAuto) return;
        filterKaryawan();
    });

    // Script untuk Toggle Detail di Mobile
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

function toggleMobileFilter() {
    const filterGrid = document.getElementById('filterGrid');
    const triggerBtn = document.querySelector('.mobile-filter-trigger');
    
    if (filterGrid.classList.contains('show-mobile')) {
        filterGrid.classList.remove('show-mobile');
        triggerBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M440-120v-240h80v80h320v80H520v80h-80Zm-320-80v-80h240v80H120Zm160-160v-80H120v-80h160v-80h80v240h-80Zm160-80v-80h400v80H440Zm160-160v-240h80v80h160v80H680v80h-80Zm-480-80v-80h400v80H120Z"/></svg> FILTER DATA';
    } else {
        filterGrid.classList.add('show-mobile');
        triggerBtn.innerHTML = 'TUTUP FILTER';
    }
}