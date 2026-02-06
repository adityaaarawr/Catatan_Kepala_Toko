$(document).ready(function () {

    /* =============================
       1️⃣ ELEMENT & STATE
    ============================== */
    const popup = document.getElementById("popupAddUser");
    const btnAdd = document.querySelector(".btn-add");
    const closeBtn = document.getElementById("popupClose");
    const saveBtn = document.getElementById("saveUser");
    const tableBody = document.getElementById("userTableBody");
    const expDate = document.getElementById("expDate");
    const foreverBtn = document.querySelector(".forever-text");
    const enableCheckbox = document.getElementById("enable");
    const searchInput = document.getElementById("searchUser");
    const today = new Date().toISOString().split("T")[0];
    expDate.min = today;
    let isEditMode = false;
    let isForever = false;

    /* =============================
       2️⃣ OPEN / CLOSE POPUP
    ============================== */
    btnAdd.addEventListener("click", () => {
        resetForm(); // Pastikan form bersih saat tambah baru
        popup.style.display = "flex";
    });

    closeBtn.addEventListener("click", () => popup.style.display = "none");
    
    popup.addEventListener("click", e => {
        if (e.target === popup) popup.style.display = "none";
    });

    /* =============================
       3️⃣ EXPIRATION / FOREVER
    ============================== */
    expDate.disabled = true;

    enableCheckbox.addEventListener("change", () => {
        if (enableCheckbox.checked) {
            expDate.disabled = isForever;
        } else {
            expDate.disabled = true;
            expDate.value = "";
            isForever = false;
            foreverBtn.classList.remove("active");
        }
    });

    foreverBtn.addEventListener("click", () => {
        if (!enableCheckbox.checked) return;
        isForever = !isForever;

        if (isForever) {
            foreverBtn.classList.add("active");
            expDate.value = "";
            expDate.disabled = true;
        } else {
            foreverBtn.classList.remove("active");
            expDate.disabled = false;
        }
    });

    /* =============================
       4️⃣ RESET FORM
    ============================== */
    function resetForm() {
        isEditMode = false;
        isForever = false;
        
        $("#formAction").val("add_user");
        $("#userId").val("");
        $("#name").val("");
        $("#username").val("");
        $("#password").val("");
        
        enableCheckbox.checked = false; // <--- TAMBAH BARU WAJIB KOSONG DULU
    expDate.disabled = true;        // <--- TANGGAL TERKUNCI (Wajib centang dulu)
    
    isForever = false;              // Reset status forever
    $(".forever-text").removeClass("active");

        // Reset Select2
        $('#selectUser').val(null).trigger('change');
        $('#role').val(null).trigger('change');
        $(".popup-group:first-of-type").show(); // Munculkan kembali pilih karyawan
        
        document.querySelector(".popup-box h3").innerText = "ADD NEW USER";
        enableCheckbox.checked = false;
        expDate.value = "";
        expDate.disabled = true;
        foreverBtn.classList.remove("active");
    }

    /* =============================
       5️⃣ EDIT / DELETE ROW (SINKRON DB)
    ============================== */
    tableBody.addEventListener("click", e => {
        const editBtn = e.target.closest(".icon-edit");
        const deleteBtn = e.target.closest(".icon-delete");

        // --- DELETE ---
     if (deleteBtn) {
    const id = deleteBtn.dataset.id;
    if (confirm("Apakah Anda yakin ingin menghapus user ini?")) {
        const formData = new FormData();
        formData.append('action', 'delete_user');
        formData.append('id', id);

        fetch(window.location.href, { method: 'POST', body: formData })
        .then(response => response.text()) // Ambil teks mentah
        .then(text => {
            try {
                // Bersihkan teks dari spasi atau karakter aneh sebelum di-parse
                const cleanText = text.trim(); 
                const data = JSON.parse(cleanText);

                if (data.status === 'success') {
                    location.reload();
                } else {
                    alert("Gagal: " + (data.message || "Terjadi kesalahan database"));
                }
            } catch (e) {
                // Jika masih error, tampilkan isi respon aslinya di alert biar kelihatan
                alert("Server error! Pesan aslinya: " + text.substring(0, 100));
            }
        });
    }
}
// --- EDIT ---
if (editBtn) {
    const id = editBtn.dataset.id;
    const row = editBtn.closest("tr");
    
    // 1. Ambil nilai enable DAN expired dari data-attribute
    const isEnabled = editBtn.getAttribute("data-enable");
    const expiredAt = editBtn.getAttribute("data-expired");

    // 2. Ambil data dari baris tabel DULU sebelum dimasukkan ke form
    const name = row.querySelector(".user-cell").childNodes[0].textContent.trim();
    const username = row.querySelector("small").textContent.replace(/[(@)]/g, "").trim();
    const roleName = row.querySelector(".role-bubble").innerText.trim();
    const isActive = row.querySelector(".role-bubble").classList.contains("active");

    // 3. Reset Form
    resetForm(); 

    // 4. Set state Edit Mode & Isi nilai ke Form
    isEditMode = true;
    $("#userId").val(id);
    $("#name").val(name.toUpperCase()); 
    $("#username").val(username.toUpperCase());
    $("#formAction").val("edit_user");
    document.querySelector(".popup-box h3").innerText = "EDIT USER";
    $(".popup-group:first-of-type").hide(); 

    // 5. ISI STATUS CHECKBOX (ENABLE)
    enableCheckbox.checked = (isEnabled == "1");

    // 6. Atur input tanggal
    if (enableCheckbox.checked) {
        // Cek apakah ada tanggal kadaluwarsa
        if (expiredAt && expiredAt !== "0000-00-00 00:00:00" && expiredAt !== "null") {
            // Ambil format YYYY-MM-DD saja untuk input date
            expDate.value = expiredAt.split(' ')[0];
        expDate.disabled = false; 
        isForever = false;
            foreverBtn.classList.remove("active");
            } else {
            // Jika kosong, berarti statusnya FOREVER
            expDate.value = "";
            expDate.disabled = true;
            isForever = true;
            foreverBtn.classList.add("active");
        }
    } else {
        expDate.disabled = true;
        expDate.value = "";
        isForever = false;
        foreverBtn.classList.remove("active");
    }

    // Set Role di Select2
    $('#role option').filter(function() {
        return $(this).text().trim().toUpperCase() === roleName.toUpperCase();
    }).prop('selected', true).trigger('change');
    
    popup.style.display = "flex";
}
});
    /* =============================
       6️⃣ SAVE USER (SINKRON KE DB)
    ============================== */
   saveBtn.addEventListener("click", function() {
    const nameVal = document.getElementById("name").value;
    const name = document.getElementById("name").value.trim().toUpperCase(); 
    const usernameVal = document.getElementById("username").value.trim().toUpperCase();
    const passwordVal = document.getElementById("password").value;
    const roleVal = $('#role').val();

    if (!usernameVal || !roleVal) {
        alert("Username dan Role wajib diisi!");
        return;
    }

    const formData = new FormData();
    formData.append('action', document.getElementById("formAction").value);
    formData.append('id', document.getElementById("userId").value);
    formData.append('name', nameVal);
    formData.append('username', usernameVal);
    formData.append('password', passwordVal);
    formData.append('role_id', roleVal);
    formData.append('enable', document.getElementById("enable").checked ? 1 : 0);
    formData.append('expired_at', expDate.value);

    fetch(window.location.href, { method: 'POST', body: formData })
    .then(response => response.text()) // Menggunakan text() untuk menghindari error parsing JSON langsung
    .then(text => {
        try {
            const data = JSON.parse(text);
            if(data.status === 'success') {
                alert("Data Berhasil Disimpan!");
                location.reload(); 
            } else {
                alert("Gagal simpan: " + data.message);
            }
        } catch (e) {
            console.error("Respon Server Error:", text);
            alert("Terjadi kesalahan format data dari server.");
        }
    })
    .catch(error => {
        console.error("Fetch Error:", error);
        alert("Koneksi ke server terputus.");
    });
});

    /* =============================
       7️⃣ DATATABLE & SELECT2 INIT
    ============================== */
    let table;
if ($.fn.dataTable.isDataTable('#userTable')) {
    table = $('#userTable').DataTable();
} else {
    table = $('#userTable').DataTable({
        destroy: true,
        dom: 't',
        ordering: true,
        paging: true,
        pageLength: 10,
        autoWidth: false, // Tambahkan ini untuk mencegah error perhitungan kolom
    columnDefs: [
       { targets: [0, 4], // Kolom 0 (No) dan Kolom 4 (Action) tidak bisa disortir
            orderable: false }
    ],

    // Default sorting ke kolom User (indeks 1) secara ascending saat pertama dimuat
    order: [[1, 'asc']]
    });
}

    // Update nomor halaman setiap kali user melakukan sorting
table.on('order.dt', function () {
    renderPages();
});

    $('#selectUser').select2({ dropdownParent: $('#popupAddUser'), width: '100%' });
    $('#role').select2({ dropdownParent: $('#popupAddUser'), width: '100%', dropdownPosition: 'below' });

    // Auto fill name & username
    $('#selectUser').on('change', function () {
        const selected = $(this).find(':selected');
        const nameVal = (selected.data('name') || '').toUpperCase();
        const usernameVal = (selected.data('username') || '').toUpperCase();

     $('#name').val(nameVal);
     $('#username').val(usernameVal);
    });

    /* =============================
       NOMER URUT & TETAP
    ============================== */
    table.on('order.dt search.dt draw.dt', function () {
    table.column(0, { search: 'applied', order: 'applied' })
        .nodes()
        .each(function (cell, i) {
            cell.innerHTML = i + 1;
        });
});

    /* =============================
       8️⃣ SEARCH & PAGINATION
    ============================== */
    searchInput.addEventListener("keyup", function () {
        table.search(this.value).draw();
        renderPages();
    });

    function renderPages() {
        const info = table.page.info();
        const pagesContainer = document.querySelector(".pages");
        if(!pagesContainer) return;
        pagesContainer.innerHTML = "";
        for (let i = 0; i < info.pages; i++) {
            const btn = document.createElement("div");
            btn.textContent = i + 1;
            if (i === info.page) btn.classList.add("active");
            btn.onclick = () => { table.page(i).draw("page"); renderPages(); };
            pagesContainer.appendChild(btn);
        }
    }

    $(".page-btn.prev").on("click", () => { table.page("previous").draw("page"); renderPages(); });
    $(".page-btn.next").on("click", () => { table.page("next").draw("page"); renderPages(); });

    renderPages();

    /* ============================================================
       9️⃣ TOGGLE DETAIL MOBILE (Tambahkan di bawah sini)
    ============================================================ *//* ============================================================
   9️⃣ TOGGLE DETAIL MOBILE (SOLUSI FIX)
============================================================ */
// Gunakan $(document).off().on() untuk memastikan tidak ada double click event
$(document).off('click', '.toggle-detail').on('click', '.toggle-detail', function (e) {
    // 1. Mencegah link default & menghentikan klik agar tidak tembus ke fungsi Edit/Delete
    e.preventDefault();
    e.stopPropagation();

    // 2. Cari baris (tr) terdekat dari tombol yang diklik
    const $row = $(this).closest('tr');
    
    // 3. Toggle class 'show-detail' (Ini yang memicu CSS Anda bekerja)
    $row.toggleClass('show-detail');

    // 4. Ubah teks & warna tombol secara langsung di JS untuk kepastian
    if ($row.hasClass('show-detail')) {
        $(this).text('TUTUP DETAIL');
    } else {
        $(this).text('LIHAT DETAIL');
        $(this).attr('style', ''); // Kembalikan ke style awal dari CSS
    }

    console.log("Toggle Detail diklik, class 'show-detail' berhasil dipasang.");
});
    /* =======================
           SORT MOBILE
    ================================ */
    document.getElementById('sortUserMobile').addEventListener('change', function() {
    const order = this.value; // 'asc' atau 'desc'
    const tbody = document.getElementById('userTableBody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    rows.sort((a, b) => {
        const nameA = a.querySelector('.user-cell').innerText.trim().toLowerCase();
        const nameB = b.querySelector('.user-cell').innerText.trim().toLowerCase();
        
        if (order === 'asc') return nameA.localeCompare(nameB);
        return nameB.localeCompare(nameA);
    });

    rows.forEach(row => tbody.appendChild(row));
});





}); // <--- Ini adalah tanda penutup asli file user.js Anda