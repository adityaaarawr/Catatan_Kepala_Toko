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
});