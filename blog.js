document.addEventListener("DOMContentLoaded", () => {
  // 1. Prevent Browser Back Navigation Lock
  history.pushState(null, null, location.href);
  window.onpopstate = () => history.go(1);

  // 2. 30-Minute Auto-Logout Session Timer
  const expiresAt = parseInt(sessionStorage.getItem("veera_session_expires") || 0, 10);
  const timerDisplay = document.getElementById("sessionTimerDisplay");

  function updateTimer() {
    const now = new Date().getTime();
    const timeLeft = expiresAt - now;

    if (timeLeft <= 0) {
      sessionStorage.clear();
      window.location.replace("index.html");
      return;
    }

    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    if (timerDisplay) {
      timerDisplay.innerText = `${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }
  }
  updateTimer();
  setInterval(updateTimer, 1000);

  // 3. Category Filter Chips
  const filterChips = document.querySelectorAll(".filter-chip");
  const blogCards = document.querySelectorAll(".blog-card");

  filterChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      filterChips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");

      const cat = chip.getAttribute("data-category");
      blogCards.forEach((card) => {
        if (cat === "all" || card.getAttribute("data-category") === cat) {
          card.style.display = "flex";
        } else {
          card.style.display = "none";
        }
      });
    });
  });

  // 4. Live Search Filter for Blog Posts
  const searchInput = document.getElementById("blogSearch");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase().trim();
      blogCards.forEach((card) => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(term) ? "flex" : "none";
      });
    });
  }

  // 5. Interactive Post Likes
  window.likePost = (btn) => {
    const icon = btn.querySelector("i");
    const span = btn.querySelector("span");
    let count = parseInt(span.innerText, 10);

    if (icon.classList.contains("fa-regular")) {
      icon.classList.replace("fa-regular", "fa-solid");
      span.innerText = count + 1;
    } else {
      icon.classList.replace("fa-solid", "fa-regular");
      span.innerText = count - 1;
    }
  };

  // 6. Logout Handlers
  function handleLogout() {
    if (confirm("Are you sure you want to logout?")) {
      sessionStorage.clear();
      window.location.replace("index.html");
    }
  }

  const logoutTrigger = document.getElementById("logoutTrigger");
  const sidebarUserCard = document.getElementById("sidebarUserCard");
  if (logoutTrigger) logoutTrigger.addEventListener("click", handleLogout);
  if (sidebarUserCard) sidebarUserCard.addEventListener("click", handleLogout);
});