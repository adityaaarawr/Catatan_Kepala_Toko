$(document).ready(function() {
    function toUpper(text) {
        return text ? text.toString().toUpperCase() : "";
    }
    
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
        let editingRow = null;  
        let isForever = false;
    
    
        /* =============================
           2️⃣ OPEN / CLOSE POPUP
        ============================== */
        btnAdd.addEventListener("click", () => popup.style.display = "flex");
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
            document.getElementById("name").value = "";
            document.getElementById("username").value = "";
            document.getElementById("role").value = "";
            enableCheckbox.checked = false;
            expDate.value = "";
            expDate.disabled = true;
            foreverBtn.classList.remove("active");
            isForever = false;
            isEditMode = false;
            editingRow = null;
        }
    
    
        /* =============================
           5️⃣ UPDATE ROW NUMBER
        ============================== */
        function updateRowNumbers() {
            tableBody.querySelectorAll("tr").forEach((tr, index) => {
                tr.children[0].innerText = index + 1;
            });
        }
    
    
        /* =============================
           6️⃣ EDIT / DELETE ROW
        ============================== */
        tableBody.addEventListener("click", e => {
            const editBtn = e.target.closest(".icon-edit");
            const deleteBtn = e.target.closest(".icon-delete");
    
            if (deleteBtn) {
                deleteBtn.closest("tr").remove();
                updateRowNumbers();
                renderPages();
            }
    
            if (editBtn) {
                const row = editBtn.closest("tr");
    
                document.getElementById("name").value = row.querySelector(".user-cell").dataset.name;
                document.getElementById("username").value = row.querySelector(".user-cell").dataset.username;
                document.getElementById("role").value = row.querySelector(".role-bubble").innerText;
    
                enableCheckbox.checked = row.children[3].innerText === "Aktif";
    
                const exp = row.dataset.expiration;
                if (exp === "forever") {
                    isForever = true;
                    foreverBtn.classList.add("active");
                    expDate.value = "";
                } else {
                    isForever = false;
                    foreverBtn.classList.remove("active");
                    expDate.value = exp;
                }
    
                expDate.disabled = !enableCheckbox.checked;
    
                popup.style.display = "flex";
                isEditMode = true;
                editingRow = row;
            }
        });
    
    
        /* =============================
           7️⃣ SAVE / ADD USER
        ============================== */
        saveBtn.addEventListener("click", () => {
            const name = document.getElementById("name").value.trim();
            const username = document.getElementById("username").value.trim();
            const role = document.getElementById("role").value;
            const status = enableCheckbox.checked ? "Aktif" : "Tidak aktif";
            const expiration = isForever ? "forever" : expDate.value;
    
            if (!username || !role) {
                alert("Username dan role wajib diisi!");
                return;
            }
    
            if (isEditMode && editingRow) {
                editingRow.querySelector(".user-cell").dataset.name = name;
                editingRow.querySelector(".user-cell").dataset.username = username;
                editingRow.querySelector(".user-cell").innerText = toUpper(username);
                editingRow.querySelector(".role-bubble").innerText = toUpper(role);
                editingRow.children[3].innerText = toUpper(status);
                editingRow.children[4].innerText = toUpper("Just now");
                editingRow.dataset.expiration = expiration;
            } else {
                const newRow = document.createElement("tr");
                const rowNumber = tableBody.querySelectorAll("tr").length + 1;
    
                newRow.innerHTML = `
                    <td>${rowNumber}</td>
                   <td class="user-cell"data-name="${name}"data-username="${username}">${toUpper(username)}</td>
                   <td><span class="role-bubble">${toUpper(role)}</span></td>
                   <td>${toUpper(status)}</td>
                   <td>${toUpper("Just now")}</td>
                    <td>${toUpper("Never")}</td>
                    <td class="action-icons">
                         <svg class="icon-edit" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                        <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/>
                    </svg>
                    <svg class="icon-delete" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                        <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360Z"/>
                    </svg>
                    </td>
                `;
    
                newRow.dataset.expiration = expiration;
                tableBody.appendChild(newRow);
            }
    
            popup.style.display = "none";
            resetForm();
            renderPages();
        });
    
    /* =========================
       MOBILE TOGGLE VIA ROW
    ========================= */
    tableBody.addEventListener("click", function (e) {
    
        if (window.innerWidth > 768) return;
    
        // cegah klik icon edit / delete
        if (e.target.closest(".icon-edit") || e.target.closest(".icon-delete")) return;
    
        const row = e.target.closest("tr");
        if (!row) return;
    
        row.classList.toggle("show-detail");
    });
    
    /* =============================
       🧪 DUMMY DATA (TEST PAGINATION)
       AMAN DIHAPUS
    ============================== */
    const dummyUsers = [
      { name: "User 1", username: "user1", role: "Admin", status: "Aktif", lastModified: "5 mins ago", lastLogin: "10 mins ago" },
      { name: "User 2", username: "user2", role: "Editor", status: "Aktif", lastModified: "1 hour ago", lastLogin: "Never" },
      { name: "User 3", username: "user3", role: "Viewer", status: "Tidak aktif", lastModified: "Yesterday", lastLogin: "Yesterday" },
      { name: "User 4", username: "user4", role: "Admin", status: "Aktif", lastModified: "Just now", lastLogin: "Just now" },
      { name: "User 5", username: "user5", role: "Editor", status: "Aktif", lastModified: "2 hours ago", lastLogin: "2 hours ago" },
      { name: "User 6", username: "user6", role: "Viewer", status: "Aktif", lastModified: "Today", lastLogin: "Never" },
      { name: "User 7", username: "user7", role: "Admin", status: "Tidak aktif", lastModified: "3 days ago", lastLogin: "3 days ago" },
      { name: "User 8", username: "user8", role: "Editor", status: "Aktif", lastModified: "1 day ago", lastLogin: "1 day ago" },
      { name: "User 9", username: "user9", role: "Viewer", status: "Aktif", lastModified: "Today", lastLogin: "Today" },
      { name: "User 10", username: "user10", role: "Admin", status: "Aktif", lastModified: "Just now", lastLogin: "Never" }
    ];
    
    dummyUsers.forEach((user, index) => {
      const row = document.createElement("tr");
    
      row.innerHTML = `
        <td>${index + 1}</td>
        <td class="user-cell" data-name="${user.name}" data-username="${user.username}">
          ${user.username}
        </td>
        <td><span class="role-bubble">${user.role}</span></td>
        <td>${user.status}</td>
        <td>Just now</td>
        <td>Never</td>
        <td class="action-icons">
             <svg class="icon-edit" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
            <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/>
          </svg>
          <svg class="icon-delete" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
            <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360Z"/>
          </svg>
          <div class="toggle-detail"></div>
            </td>
      `;
    
      row.dataset.expiration = "forever";
      tableBody.appendChild(row);
    });
    
    
    // 1️⃣ Isi dropdown selectUser dari dummyUsers
    dummyUsers.forEach(user => {
        $('#selectUser').append(`
            <option value="${user.username}" data-name="${user.name}" data-username="${user.username}">
                ${user.username}
            </option>
        `);
    });
    
    // 3️⃣ Event: saat pilih user, otomatis isi name & username
    $('#selectUser').on('change', function() {
        const selected = $(this).find(':selected');
    
        if (selected.val()) { // kalau bukan placeholder
            $('#name').val(selected.data('name'));
            $('#username').val(selected.data('username'));
        } else { // kalau pilih placeholder
            $('#name').val('');
            $('#username').val('');
        }
    });
    
    
        /* =============================
           8️⃣ DATATABLE INIT
        ============================== */
        const table = $('#userTable').DataTable({
            responsive: false,
            paging: true,
            pageLength: 5,
            searching: true,
            ordering: false,
            autoWidth: false,
            dom: 't',
            columnDefs: [
                { targets: 0, responsivePriority: 1 },
                { targets: 1, responsivePriority: 2 },
                { targets: 2, responsivePriority: 3 },
                { targets: 3, responsivePriority: 4 },
                { targets: 4, responsivePriority: 5 },
                { targets: 5, responsivePriority: 6 },
                { targets: 6, responsivePriority: 7 }
            ]
        });
    
        /* =============================
            SEARCH DROPDOWN POP UP
        ============================== */
    $('#selectUser').select2({
        placeholder: "Pilih user",
        width: '100%',
        dropdownParent: $('#popupAddUser')
    });
    
    $('#role').select2({
        placeholder: "Pilih role",
        width: '100%',
        dropdownParent: $('#popupAddUser')
    });
    
    
    // 🔍 Placeholder search Select2 - USER
    $('#selectUser').on('select2:open', function () {
        const searchField = $('.select2-container--open .select2-search__field');
        searchField.attr('placeholder', 'Cari user...');
    });
    
    // 🔍 Placeholder search Select2 - ROLE
    $('#role').on('select2:open', function () {
        const searchField = $('.select2-container--open .select2-search__field');
        searchField.attr('placeholder', 'Cari role...');
    });
    
    
    
    
        /* =============================
           9️⃣ CUSTOM PAGINATION
        ============================== */
        function renderPages() {
    
        const info = table.page.info();
        const pagesContainer = document.querySelector(".pages");
    
        pagesContainer.innerHTML = "";
    
        for (let i = 0; i < info.pages; i++) {
            const btn = document.createElement("div");
            btn.textContent = i + 1;
    
            if (i === info.page) btn.classList.add("active");
    
            btn.onclick = () => {
                table.page(i).draw("page");
                renderPages();
            };
    
            pagesContainer.appendChild(btn);
        }
    }
    
    renderPages();
    document.querySelector(".page-btn.prev").addEventListener("click", () => {
        table.page("previous").draw("page");
        renderPages();
    });
    
    document.querySelector(".page-btn.next").addEventListener("click", () => {
        table.page("next").draw("page");
        renderPages();
    });
    
      /* =============================
           🔟 SEARCH
        ============================== */
        searchInput.addEventListener("keyup", function () {
            table.search(this.value).draw();
            renderPages();
        });
    
    
        /* =============================
           🚀 INIT FIRST LOAD
        ============================== */
        renderPages();
    
    });