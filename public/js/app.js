document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("toggleBtn");
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.getElementById("overlay");

    const toggleSidebar = () => {
        sidebar.classList.toggle("open");
        overlay.classList.toggle("show");
        document.body.style.overflow = sidebar.classList.contains("open") ? "hidden" : "auto";
    };

    toggleBtn.addEventListener("click", toggleSidebar);
    overlay.addEventListener("click", toggleSidebar);

    // Pastikan user ada di localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        window.location.href = "login.html"; // Redirect ke login jika tidak ada user
        return;
    }

    // Menampilkan nama user di halaman utama
    document.querySelector("main h1").textContent = `Selamat Datang, ${user.name}!`;

    // Tampilkan menu admin hanya jika role-nya admin
    if (user.role === "admin") {
        const adminMenu = document.getElementById("adminMenu");
        const kelolaKursusMenu = document.getElementById("kelolaKursusMenu");
        const kelolaTugasMenu = document.getElementById("kelolaTugasMenu");
        const kelolaJawabanMenu = document.getElementById("kelolaJawabanMenu");
        const laporanMenu = document.getElementById("laporanMenu");
        const galeri = document.getElementById("galeri");

        if (galeri) galeri.style.display = "block";
        if (laporanMenu) laporanMenu.style.display = "block";
        if (kelolaJawabanMenu) kelolaJawabanMenu.style.display = "block";
        if (kelolaTugasMenu) kelolaTugasMenu.style.display = "block";
        if (adminMenu) adminMenu.style.display = "block";
        if (kelolaKursusMenu) kelolaKursusMenu.style.display = "block";
    }

    // Logout
    const logoutBtn = document.getElementById("logoutBtn");
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("user");
        window.location.href = "login.html"; // Logout dan kembali ke halaman login
    });
});
