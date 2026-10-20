document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("sentiment-form");
    const textInput = document.getElementById("text-input");
    const resultBox = document.getElementById("result-box");
    const loading = document.getElementById("loading");
    const historyBox = document.getElementById("history-box");
    const clearBtn = document.getElementById("clear-btn");
    const wordCountEl = document.getElementById("word-count");
    const charCountEl = document.getElementById("char-count");
    const inputHint = document.getElementById("input-hint");
    const sampleChips = document.querySelectorAll(".sample-chip");
    const submitBtn = document.getElementById("submit-btn");

    // ===== WORD & CHARACTER COUNTER =====
    function updateCounter() {
        if (!textInput) return;
        const text = textInput.value;
        const charLength = text.length;
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        const wordLength = words.length;

        if (wordCountEl) wordCountEl.textContent = `${wordLength} ${wordLength === 1 ? 'word' : 'words'}`;
        if (charCountEl) charCountEl.textContent = `${charLength} characters`;

        if (inputHint) {
            if (wordLength === 0) {
                inputHint.textContent = "At least 3 words required";
                inputHint.className = "input-hint";
            } else if (wordLength < 3) {
                inputHint.textContent = `Need ${3 - wordLength} more word(s)`;
                inputHint.className = "input-hint warning";
            } else {
                inputHint.textContent = "✓ Ready to analyze";
                inputHint.className = "input-hint success";
            }
        }
    }

    if (textInput) {
        textInput.addEventListener("input", updateCounter);
        textInput.addEventListener("focus", updateCounter);
    }

    // ===== CLEAR BUTTON =====
    if (clearBtn && textInput) {
        clearBtn.addEventListener("click", () => {
            textInput.value = "";
            updateCounter();
            textInput.focus();
            if (resultBox) resultBox.innerHTML = "";
        });
    }

    // ===== SAMPLE CHIPS CLICK =====
    sampleChips.forEach(chip => {
        chip.addEventListener("click", () => {
            const sampleText = chip.getAttribute("data-text");
            if (sampleText && textInput) {
                textInput.value = sampleText;
                updateCounter();
                textInput.focus();

                // Highlight chip temporarily
                sampleChips.forEach(c => c.classList.remove("active"));
                chip.classList.add("active");

                // Smooth scroll to analyzer if needed
                const analyzer = document.getElementById("analyzer");
                if (analyzer) {
                    analyzer.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
            }
        });
    });

    // ===== FORM SUBMISSION & PREDICTION =====
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();

            const text = textInput.value.trim();
            const words = text.split(/\s+/).filter(Boolean);

            if (words.length < 3) {
                showWarning("Please enter at least 3 words for accurate sentiment analysis.");
                return;
            }

            // Show loading state
            loading.classList.remove("hidden");
            resultBox.innerHTML = "";
            if (submitBtn) submitBtn.disabled = true;

            fetch("/predict", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ text: text })
            })
            .then(response => {
                if (!response.ok) throw new Error("Network response was not ok");
                return response.json();
            })
            .then(data => {
                setTimeout(() => {
                    loading.classList.add("hidden");
                    if (submitBtn) submitBtn.disabled = false;

                    if (data.error) {
                        showWarning(data.error);
                        return;
                    }

                    if (data.result === "POSITIF" || data.result === "NEGATIF") {
                        renderResult(data);
                    } else {
                        showWarning(data.result || "Unexpected classification result.");
                    }

                    if (data.history && data.history.length > 0) {
                        renderHistory(data.history);
                    }
                }, 600);
            })
            .catch(error => {
                loading.classList.add("hidden");
                if (submitBtn) submitBtn.disabled = false;
                resultBox.innerHTML = `
                    <div class="result-card result-warning">
                        <div class="result-header">
                            <span class="result-icon">⚠️</span>
                            <h4>Inference Error</h4>
                        </div>
                        <p>Failed to analyze text. Please ensure the server is running properly.</p>
                    </div>
                `;
                console.error(error);
            });
        });
    }

    // ===== RENDER RESULT =====
    function renderResult(data) {
        const isPositif = data.result === "POSITIF";
        const resultClass = isPositif ? "positif" : "negatif";
        const sentimentDisplay = isPositif ? "POSITIVE" : "NEGATIVE";
        const confidenceVal = Number(data.confidence) || 0;

        let certaintyLevel = "Moderate Certainty";
        if (confidenceVal >= 85) certaintyLevel = "Very High Certainty";
        else if (confidenceVal >= 70) certaintyLevel = "High Certainty";

        resultBox.innerHTML = `
            <div class="result-card result-${resultClass} fade-in">
                <div class="result-badge-row">
                    <span class="polarity-tag">${isPositif ? 'Bullish / Recommended' : 'Bearish / Critical'}</span>
                    <span class="certainty-tag">${certaintyLevel}</span>
                </div>

                <div class="result-main">
                    <div class="result-emoji">${data.emoji}</div>
                    <div class="result-text-wrap">
                        <h3 class="sentiment-title">${sentimentDisplay}</h3>
                        <p class="sentiment-desc">Review classified with <strong>${confidenceVal}%</strong> probability confidence.</p>
                    </div>
                </div>

                <div class="meter-wrapper">
                    <div class="meter-labels">
                        <span>Confidence Score</span>
                        <strong class="meter-percent">${confidenceVal}%</strong>
                    </div>
                    <div class="meter-track">
                        <div class="meter-fill" style="width: 0%;" data-target="${confidenceVal}"></div>
                    </div>
                </div>
            </div>
        `;

        // Animate meter fill smoothly
        requestAnimationFrame(() => {
            const fill = resultBox.querySelector(".meter-fill");
            if (fill) {
                setTimeout(() => {
                    fill.style.width = `${fill.getAttribute("data-target")}%`;
                }, 80);
            }
        });
    }

    function showWarning(message) {
        resultBox.innerHTML = `
            <div class="result-card result-warning fade-in">
                <div class="result-header">
                    <span class="result-icon">⚠️</span>
                    <h4>Validation Notice</h4>
                </div>
                <p>${message}</p>
            </div>
        `;
    }

    // ===== RENDER HISTORY =====
    function renderHistory(history) {
        if (!historyBox) return;

        if (!history || history.length === 0) {
            historyBox.innerHTML = `<div class="history-empty">No reviews analyzed yet. Try submitting one above!</div>`;
            return;
        }

        historyBox.innerHTML = "";
        history.forEach((item, index) => {
            const isPos = item.result === "POSITIF";
            const badgeClass = isPos ? "history-pill-pos" : "history-pill-neg";
            const displayLabel = isPos ? "Positive" : "Negative";

            const div = document.createElement("div");
            div.className = "history-item";
            div.innerHTML = `
                <div class="history-item-top">
                    <span class="history-badge ${badgeClass}">
                        ${item.emoji} ${displayLabel}
                    </span>
                    <span class="history-conf">${item.confidence}% confidence</span>
                </div>
                <p class="history-text">"${escapeHtml(item.text)}"</p>
            `;
            historyBox.appendChild(div);
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ===== NAVBAR SCROLL ACTIVE STATE =====
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".nav-link");

    window.addEventListener("scroll", () => {
        let current = "";
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.offsetHeight;
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute("id");
            }
        });

        navLinks.forEach(link => {
            link.classList.remove("active");
            const href = link.getAttribute("href");
            if (href && (href === `#${current}` || href.endsWith(`#${current}`))) {
                link.classList.add("active");
            }
        });
    });

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