<?php 
require_once "direct/config.php";
$pageTitle = 'Login'; 
$cssFile = 'login.css'; 
$jsFile = 'login.js';
include 'modules/header.php'; 

?>
  
<div class="main-wrapper">
    <div class="header-section">
        
        <svg width="260" height="170" viewBox="0 0 260 170" style="display:block; margin: 0 auto 16px; overflow: visible;">
            <defs>
                <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.25"/>
                </filter>

                <clipPath id="l1"><circle cx="90"  cy="42"  r="30"/></clipPath> <clipPath id="l5"><circle cx="170" cy="42"  r="30"/></clipPath> <clipPath id="l3"><circle cx="50"  cy="115" r="30"/></clipPath> <clipPath id="l4"><circle cx="130" cy="115" r="30"/></clipPath> <clipPath id="l2"><circle cx="210" cy="115" r="30"/></clipPath> </defs>

            <g filter="url(#shadow)" transform="translate(-14,0)">
                <image href="dist/img/rj.jpg" x="58" y="10" width="64" height="64" clip-path="url(#l1)" preserveAspectRatio="xMidYMid slice"/>
            </g>

            <g filter="url(#shadow)" transform="translate(14,0)">
                <image href="dist/img/tm.jpg" x="138" y="10" width="64" height="64" clip-path="url(#l5)" preserveAspectRatio="xMidYMid slice"/>
            </g>    

            <g filter="url(#shadow)" transform="translate(-18,0)">
                <image href="dist/img/ol.jpg" x="18" y="85" width="64" height="64" clip-path="url(#l3)" preserveAspectRatio="xMidYMid slice"/>
            </g>

            <g filter="url(#shadow)">
                <image href="dist/img/hk.jpg" x="98" y="85" width="64" height="64" clip-path="url(#l4)" preserveAspectRatio="xMidYMid slice"/>
            </g>

            <g filter="url(#shadow)" transform="translate(18,0)">
                <image href="dist/img/ikou.jpg" x="178" y="85" width="64" height="64" clip-path="url(#l2)" preserveAspectRatio="xMidYMid slice"/>
            </g>
        </svg>

        <div class="container">
            <h2>SIGN IN</h2>
            <p>Silakan Masuk Dengan Username & Password</p>

            <form id="loginForm" method="post" action="routines/auth.php">
                <div class="input-wrapper">
                    <label>USERNAME</label>
                    <input type="text" id="username" class="input-box" placeholder="Username" required>
                </div>

                <div class="input-wrapper">
                    <label>PASSWORD</label>
                    <input type="password" id="password" class="input-box" placeholder="Password" required>
                </div>

                <button type="submit" class="btn-login">SIGN IN</button>
            </form>
        </div>  
    </div>
</div>

<div id="notification-container" class="notification-container"></div>

<?php include 'modules/footer.php'; ?>