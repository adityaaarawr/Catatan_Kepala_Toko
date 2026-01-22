$(document).ready(function () {
    const $karyawanSel = $('#filterKaryawan');
    const $divisiSel = $('#filterDivisi');
    const $tokoSel = $('#filterToko');

    $('.select2').select2({ width: '100%' });

    // Simpan semua opsi asli agar bisa dikembalikan saat reset
    const originalOptions = {
        karyawan: $karyawanSel.html(),
        divisi: $divisiSel.html(),
        toko: $tokoSel.html()
    };

    // 1. JIKA PILIH KARYAWAN -> AUTO TOKO & DIVISI
    $karyawanSel.on('change', function () {
        const selected = $(this).find(':selected');
        const tokoId = selected.data('toko');
        const divisiId = selected.data('divisi');

        if (tokoId) {
            $tokoSel.val(tokoId).trigger('change.select2', [true]); // Flag true agar tidak loop
        }
        if (divisiId) {
            $divisiSel.val(divisiId).trigger('change.select2', [true]);
        }
    });

    // 2. LOGIKA MENGERUCUT (DIVISI & TOKO)
    function updateFilters(triggerSource) {
        const valToko = $tokoSel.val();
        const valDivisi = $divisiSel.val();

        // Filter Karyawan berdasarkan Toko DAN/ATAU Divisi
        $karyawanSel.html(originalOptions.karyawan).find('option').each(function() {
            const t = $(this).data('toko');
            const d = $(this).data('divisi');
            const val = $(this).val();
            
            if (val !== "") {
                const matchToko = !valToko || t == valToko;
                const matchDivisi = !valDivisi || d == valDivisi;
                if (!(matchToko && matchDivisi)) $(this).remove();
            }
        });

        // Jika pilih Toko, kerucutkan Divisi yang ada di toko tersebut
        if (triggerSource === 'toko') {
            $divisiSel.html(originalOptions.divisi).find('option').each(function() {
                const t = $(this).data('toko'); // Pastikan option divisi punya data-toko
                if ($(this).val() !== "" && valToko && t != valToko) $(this).remove();
            });
        }

        $('.select2').trigger('change.select2');
    }

    // Event Listeners
    $tokoSel.on('change', function (e, isAuto) {
        if (isAuto) return;
        updateFilters('toko');
    });

    $divisiSel.on('change', function (e, isAuto) {
        if (isAuto) return;
        updateFilters('divisi');
    });
});

