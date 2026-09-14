const GALLERY_DATA = [
  { id: 1, title: "IoT Weather Station", category: "projects", date: "May 18, 2026", count: 8, image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop" },
  { id: 2, title: "RC Car with Mobile Control", category: "projects", date: "Apr 25, 2026", count: 12, image: "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=500&auto=format&fit=crop" },
  { id: 3, title: "CCTV Installation & Setup", category: "projects", date: "May 2, 2026", count: 10, image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=500&auto=format&fit=crop" },
  { id: 4, title: "Web Development Workspace", category: "projects", date: "May 10, 2026", count: 15, image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&auto=format&fit=crop" },
  { id: 5, title: "Attendance App Modules", category: "projects", date: "Apr 18, 2026", count: 7, image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop" },
  { id: 6, title: "IoT Projects Collection", category: "projects", date: "Apr 10, 2026", count: 20, image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=500&auto=format&fit=crop" },
  { id: 7, title: "Health Monitoring Unit", category: "projects", date: "May 5, 2026", count: 9, image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&auto=format&fit=crop" },
  { id: 8, title: "Electrical Work & Testing", category: "projects", date: "Mar 28, 2026", count: 11, image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop" },
  { id: 9, title: "Networking Routing Setup", category: "projects", date: "Mar 20, 2026", count: 8, image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&auto=format&fit=crop" },
  { id: 10, title: "Certificates Archive", category: "certificates", date: "Mar 15, 2026", count: 6, image: "https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=500&auto=format&fit=crop" },
  { id: 11, title: "College Events & Expo", category: "college", date: "Feb 28, 2026", count: 18, image: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=500&auto=format&fit=crop" },
  { id: 12, title: "Travel Memories & Logs", category: "travel", date: "Feb 10, 2026", count: 14, image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500&auto=format&fit=crop" }
];

document.addEventListener("DOMContentLoaded", () => {
  // 1. Browser Back-Button Trap
  history.pushState(null, null, location.href);
  window.onpopstate = () => history.go(1);

  // 2. 30-Minute Live Auto-Logout Countdown
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

  // 3. Gallery Filtering, Search & Sorting
  const galleryGrid = document.getElementById("galleryGrid");
  const filterPills = document.querySelectorAll(".pill-btn");
  const searchInput = document.getElementById("gallerySearchInput");
  const sortSelect = document.getElementById("sortSelect");

  let activeCategory = "all";
  let searchQuery = "";

  function renderGallery() {
    let filtered = GALLERY_DATA.filter((item) => {
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    if (sortSelect && sortSelect.value === "popular") {
      filtered.sort((a, b) => b.count - a.count);
    } else if (sortSelect && sortSelect.value === "oldest") {
      filtered.reverse();
    }

    if (!galleryGrid) return;

    if (filtered.length === 0) {
      galleryGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;">No albums found.</div>`;
      return;
    }

    galleryGrid.innerHTML = filtered.map((item) => `
      <div class="gallery-card">
        <div class="gallery-thumb-wrap">
          <img src="${item.image}" alt="${item.title}" onerror="this.src='images/veera.png';" />
        </div>
        <div class="gallery-card-body">
          <h4>${item.title}</h4>
          <p class="gallery-meta"><i class="fa-regular fa-calendar"></i> ${item.date} · ${item.count} Photos</p>
        </div>
      </div>
    `).join("");
  }

  filterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      filterPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      activeCategory = pill.getAttribute("data-filter");
      renderGallery();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim();
      renderGallery();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", renderGallery);
  }

  renderGallery();

  // 4. Logout Handlers
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