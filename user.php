<?php 
$pageTitle = 'User Management'; 
$cssFile = 'user.css'; 
$jsFile = 'user.js';
include 'modules/header.php'; 
?>

<div class="layout"> 
    <?php include 'modules/sidebar.php'; ?>
    <main>
        <div class="topbar">
            <h1 class="title">USER MANAGEMENT</h1>
        </div>
        
        <div class="table-container"></div>
        <div class="top-bar">
            <div></div>
            <button class="btn-add">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                    <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/>
                </svg>
                ADD NEW USER
            </button>
        </div>

        <div class="search-filter">
            <div class="search-box">
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960">
                    <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
                </svg>
                <input type="text" id="searchUser" placeholder="Cari user...">
            </div>
        </div>

            <table id="userTable">
                <thead>
                    <tr>
                        <th>NO</th>
                        <th>USER</th>
                        <th>ROLE</th>
                        <th>STATUS</th>
                        <th>LAST MODIFIED</th>
                        <th>LAST LOGIN</th>
                        <th>ACTION</th>
                    </tr>
                </thead>
                <tbody id="userTableBody"></tbody>
            </table>

        <div class="pagination">
            <button class="page-btn prev">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                    <path d="M400-240 160-480l240-240 56 58-142 142h486v80H314l142 142-56 58Z"/>
                </svg>
                PREVIOUS
            </button>
            <div class="pages">
                <div>1</div>
                <div>2</div>
                <div>3</div>
            </div>
            <button class="page-btn next">
                NEXT
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                    <path d="m560-240-56-58 142-142H160v-80h486L504-662l56-58 240 240-240 240Z"/>
                </svg>
            </button>
        </div>

        <div class="popup-overlay" id="popupAddUser">
            <div class="popup-box">
                <div class="popup-close" id="popupClose">x</div>

                <h3>ADD NEW USER</h3>

                <div class="popup-group">
                <select id="selectUser">
                        <option value="">Pilih user</option>
                    </select>
                    </div>

                <div class="popup-group">
                    <label>NAME :</label>
                    <input type="text" id="name">
                </div>

                <div class="popup-group">
                    <label>USERNAME :</label>
                    <input type="text" id="username">
                </div>

                <div class="popup-group">
                    <label>ROLE :</label>
                    <select id="role">
                        <option value="">Select role</option>
                        <option>Admin</option>
                        <option>Gudang</option>
                        <option>Kasir</option>
                        <option>HR</option>
                    </select>
                </div>

                <div class="enable-box">
                    <label>
                        <input type="checkbox" id="enable">
                        ENABLE
                    </label>
                </div>

                <div class="popup-group">
                    <label>EXPIRATION DATE :</label>
                    <div class="exp-row">
                        <input type="date" id="expDate">
                        <span class="forever-text">FOREVER</span>
                    </div>
                </div>

                <button class="btn-save-popup" id="saveUser">SAVE</button>
            </div>
        </div>
    </main>
</div>

<?php include 'modules/footer.php'; ?>