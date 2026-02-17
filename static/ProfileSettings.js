document.addEventListener('DOMContentLoaded', function() {
    const profileBtn = document.getElementById('profile-btn');
    const sidePanel = document.getElementById('side-panel');
    const closePanel = document.getElementById('close-panel');
    const overlay = document.getElementById('panel-overlay');

    if (profileBtn) {
        profileBtn.addEventListener('click', function(e) {
            e.preventDefault(); // Iwasan ang default action
            sidePanel.classList.add('active');
            overlay.classList.add('active');
            console.log("Panel opened"); // I-check sa console (F12) kung lumalabas ito
        });
    }

    function closeSidePanel() {
        sidePanel.classList.remove('active');
        overlay.classList.remove('active');
    }

    if (closePanel) closePanel.addEventListener('click', closeSidePanel);
    if (overlay) overlay.addEventListener('click', closeSidePanel);
});

/*LOGOUT*//////
document.getElementById('logout-trigger').addEventListener('click', function() {
    if (confirm("Are you sure you want to log out?")) {
        // Dito mo ilalagay ang redirect mo
        window.location.href = "index.html?action=logout"; 
    }
});
/*LOGOUT*//////

/*DISPLAYYY THEME/////////////////////////////////////////////*/
const modeToggle = document.getElementById('mode-toggle');
const modeText = document.getElementById('mode-text');

modeToggle.addEventListener('change', () => {
    if (modeToggle.checked) {
        // DARK MODE
        document.documentElement.setAttribute('data-theme', 'dark');
        modeText.innerText = "Dark";
        localStorage.setItem('theme', 'dark');
    } else {
        // LIGHT MODE
        document.documentElement.setAttribute('data-theme', 'light');
        modeText.innerText = "Light";
        localStorage.setItem('theme', 'light');
    }
});

// Auto-Load Preference
const currentTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', currentTheme);
modeToggle.checked = (currentTheme === 'dark');
modeText.innerText = (currentTheme === 'dark') ? "Dark" : "Light";


