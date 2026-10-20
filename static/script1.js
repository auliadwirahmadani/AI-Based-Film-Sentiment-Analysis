document.addEventListener("DOMContentLoaded", () => {
    // ===== MOBILE HAMBURGER MENU =====
    const hamburger = document.getElementById("hamburger");
    const navMenu = document.getElementById("nav-menu");

    if (hamburger && navMenu) {
        hamburger.addEventListener("click", () => {
            navMenu.classList.toggle("active");
            hamburger.classList.toggle("open");
        });

        document.querySelectorAll(".nav-link").forEach(link => {
            link.addEventListener("click", () => {
                navMenu.classList.remove("active");
                hamburger.classList.remove("open");
            });
        });
    }

    // ===== FOOTER YEAR & INFO =====
    const footerText = document.getElementById("footer-text");
    if (footerText) {
        const year = new Date().getFullYear();
        footerText.innerHTML = `&copy; ${year} <strong>SentimentAI Movies</strong> &bull; Developed by Aulia Dwi Rahmadani`;
    }
});