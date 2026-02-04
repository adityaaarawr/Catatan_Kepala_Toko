$(document).ready(function () {
    const $karyawan = $('#filterKaryawan');
    const $divisi   = $('#filterDivisi');
    const $toko     = $('#filterToko');

    $('.select2').select2({ width: '100%', dropdownAutoWidth: false });

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

/* ============================================================
       🔟 SIDEBAR TOGGLE (SINKRON DENGAN SIDEBAR.JS)
    ============================================================ */
    const toggleSidebarBtn = document.getElementById("toggle-btn");
    const sidebar = document.querySelector(".sidebar");
    const mainContent = document.querySelector('main');
    const icon = toggleSidebarBtn ? toggleSidebarBtn.querySelector('i') : null;

    if (toggleSidebarBtn && sidebar) {
        // Cek status saat halaman dimuat (LocalStorage)
        if (localStorage.getItem("sidebarStatus") === "true") {
            sidebar.classList.add("hide");
            if (mainContent) mainContent.classList.add('sidebar-collapsed');
            if (icon) icon.className = 'fas fa-bars';
        }

        // Event klik yang sinkron
        toggleSidebarBtn.addEventListener("click", function() {
            // Kita biarkan sidebar.js bekerja, tapi kita tambahkan fungsi simpan status
             setTimeout(() => {
        const isHidden = sidebar.classList.contains("hide");

        // 🔥 INI YANG KURANG
        if (mainContent) {
            mainContent.classList.toggle('sidebar-collapsed', isHidden);
        }

        localStorage.setItem(
            "sidebarStatus",
            isHidden ? "true" : "false"
        );
    }, 50);
        });
    }
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