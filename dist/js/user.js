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
            resetForm();
            isEditMode = true;
            const id = editBtn.dataset.id;
            const row = editBtn.closest("tr");

            // Ambil data dari baris tabel
            const name = row.querySelector(".user-cell").childNodes[0].textContent.trim();
            const username = row.querySelector("small").textContent.replace(/[(@)]/g, "").trim();
            const roleName = row.querySelector(".role-bubble").innerText.trim();
            const isActive = row.querySelector(".role-bubble").classList.contains("active");

            // Isi ke Modal
            $("#userId").val(id);
            $("#name").val(name);
            $("#username").val(username);
            $("#formAction").val("edit_user");
            document.querySelector(".popup-box h3").innerText = "EDIT USER";
            $(".popup-group:first-of-type").hide(); // Sembunyikan pilih karyawan saat edit

            // Set Role di Select2
            $('#role option').filter(function() {
                return $(this).text().trim().toUpperCase() === roleName.toUpperCase();
            }).prop('selected', true).trigger('change');

            enableCheckbox.checked = isActive;
            expDate.disabled = !isActive;

            popup.style.display = "flex";
        }
    });

    /* =============================
       6️⃣ SAVE USER (SINKRON KE DB)
    ============================== */
   saveBtn.addEventListener("click", function() {
    const nameVal = document.getElementById("name").value;
    const usernameVal = document.getElementById("username").value;
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
    formData.append('role_id', roleVal);
    formData.append('enable', document.getElementById("enable").checked ? 1 : 0);

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
    const table = $('#userTable').DataTable({
        dom: 't',
        ordering: false,
        paging: true,
        pageLength: 10
    });

    $('#selectUser').select2({ dropdownParent: $('#popupAddUser'), width: '100%' });
    $('#role').select2({ dropdownParent: $('#popupAddUser'), width: '100%' });

    // Auto fill name & username
    $('#selectUser').on('change', function () {
        const selected = $(this).find(':selected');
        $('#name').val(selected.data('name') || '');
        $('#username').val(selected.data('username') || '');
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
});$(document).ready(function () {
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
            resetForm();
            isEditMode = true;
            const id = editBtn.dataset.id;
            const row = editBtn.closest("tr");

            // Ambil data dari baris tabel
            const name = row.querySelector(".user-cell").childNodes[0].textContent.trim();
            const username = row.querySelector("small").textContent.replace(/[(@)]/g, "").trim();
            const roleName = row.querySelector(".role-bubble").innerText.trim();
            const isActive = row.querySelector(".role-bubble").classList.contains("active");

            // Isi ke Modal
            $("#userId").val(id);
            $("#name").val(name);
            $("#username").val(username);
            $("#formAction").val("edit_user");
            document.querySelector(".popup-box h3").innerText = "EDIT USER";
            $(".popup-group:first-of-type").hide(); // Sembunyikan pilih karyawan saat edit

            // Set Role di Select2
            $('#role option').filter(function() {
                return $(this).text().trim().toUpperCase() === roleName.toUpperCase();
            }).prop('selected', true).trigger('change');

            enableCheckbox.checked = isActive;
            expDate.disabled = !isActive;

            popup.style.display = "flex";
        }
    });

    /* =============================
       6️⃣ SAVE USER (SINKRON KE DB)
    ============================== */
   saveBtn.addEventListener("click", function() {
    const nameVal = document.getElementById("name").value;
    const usernameVal = document.getElementById("username").value;
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
    formData.append('role_id', roleVal);
    formData.append('enable', document.getElementById("enable").checked ? 1 : 0);

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
    const table = $('#userTable').DataTable({
        dom: 't',
        ordering: false,
        paging: true,
        pageLength: 10
    });

    $('#selectUser').select2({ dropdownParent: $('#popupAddUser'), width: '100%' });
    $('#role').select2({ dropdownParent: $('#popupAddUser'), width: '100%' });

    // Auto fill name & username
    $('#selectUser').on('change', function () {
        const selected = $(this).find(':selected');
        $('#name').val(selected.data('name') || '');
        $('#username').val(selected.data('username') || '');
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
});
