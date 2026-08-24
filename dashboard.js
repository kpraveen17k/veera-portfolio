document.addEventListener("DOMContentLoaded", () => {
  // 1. Session Lock
  history.pushState(null, null, location.href);
  window.onpopstate = () => history.go(1);

  // 2. Real-time User Name Injection
  const activeUser = sessionStorage.getItem("veera_active_user") || "Veera";
  const formattedUser = activeUser.charAt(0).toUpperCase() + activeUser.slice(1);
  
  const headerUserName = document.getElementById("headerUserName");
  const pcUserName = document.getElementById("pcUserName");
  if (headerUserName) headerUserName.innerText = `${formattedUser}!`;
  if (pcUserName) pcUserName.innerText = formattedUser;

  // 3. Live System Date (Monday, 24 Aug 2026)
  const dateOptions = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
  const liveDateEl = document.getElementById("currentLiveDate");
  if (liveDateEl) {
    liveDateEl.innerText = new Date().toLocaleDateString('en-GB', dateOptions);
  }

  // Live Weather API Sync
  async function fetchLiveWeather() {
    const weatherTextEl = document.getElementById("liveWeatherText");
    if (!weatherTextEl) return;
    try {
      const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=13.6288&longitude=79.4192&current_weather=true");
      if (response.ok) {
        const data = await response.json();
        const temp = Math.round(data.current_weather.temperature);
        weatherTextEl.innerText = `${temp}°C Tirupati, India`;
      }
    } catch {
      weatherTextEl.innerText = "28°C Tirupati, India";
    }
  }
  fetchLiveWeather();

  // 4. Session Countdown Timer (30 Minutes)
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
      timerDisplay.innerText = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
  }
  updateTimer();
  setInterval(updateTimer, 1000);

  // ================= 5. LIVE UPLOADED PROJECTS RENDER (REAL IMAGES) =================
  async function loadDashboardProjects() {
    const slider = document.getElementById("dashRecentProjectsSlider");
    const dashProjCount = document.getElementById("dashTotalProjectsCount");
    const dashProjMini = document.getElementById("dashProjectsCountMini");

    let projects = [];

    // A. Fetch from Firestore
    try {
      if (typeof firebase !== "undefined" && firebase.apps.length) {
        const snap = await firebase.firestore().collection("projects").get();
        snap.forEach((d) => projects.push({ id: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn("Firestore offline, loading local data:", err);
    }

    // B. Fetch from LocalStorage if Firestore is empty/offline
    if (projects.length === 0) {
      try {
        projects = JSON.parse(localStorage.getItem("veera_custom_projects") || localStorage.getItem("veera_projects_data") || "[]");
      } catch {
        projects = [];
      }
    }

    // Update Counts
    const totalCount = projects.length;
    if (dashProjCount) dashProjCount.innerText = totalCount;
    if (dashProjMini) dashProjMini.innerText = totalCount;

    if (!slider) return;
    slider.innerHTML = "";

    if (projects.length === 0) {
      slider.innerHTML = `
        <div style="grid-column: 1/-1; width: 100%; text-align: center; padding: 24px; background: #ffffff; border-radius: 14px; border: 1px dashed #cbd5e1;">
          <p style="font-size: 13px; color: #64748b; margin-bottom: 8px;">No projects added yet.</p>
          <a href="admin.html" style="font-size: 12px; font-weight: 700; color: #8b5cf6; text-decoration: none;">+ Add Project in Admin Hub</a>
        </div>
      `;
      return;
    }

    // Render Real Uploaded Images
    projects.slice(0, 6).forEach((proj) => {
      const images = (proj.images && proj.images.length > 0) ? proj.images : (proj.imageUrl ? [proj.imageUrl] : ["images/veera.png"]);
      const mainImg = images[0];
      const title = proj.title || "Project";
      const categoryVal = (proj.category || "completed").toLowerCase();

      const div = document.createElement("div");
      div.className = "project-item";
      div.innerHTML = `
        <div class="dash-project-thumb">
          <img src="${mainImg}" alt="${title}" onerror="this.src='images/veera.png';" />
          <span class="badge-status-dash ${categoryVal}">
            ${categoryVal === "completed" ? "completed" : "in-progress"}
          </span>
        </div>
        <div class="dash-project-info">
          <h4>${title}</h4>
          <div class="dash-project-footer">
            <span>Status</span>
            <span class="badge-live-dash">Live</span>
          </div>
        </div>
      `;
      slider.appendChild(div);
    });
  }

  // Sync Skills & Certificates Count
  function syncDashboardMetrics() {
    let storedSkills = [];
    try {
      storedSkills = JSON.parse(localStorage.getItem("veera_custom_skills") || localStorage.getItem("veera_skills_data") || "[]");
    } catch {
      storedSkills = [];
    }
    const skillsCountEl = document.getElementById("dashSkillsCount");
    if (skillsCountEl && storedSkills.length > 0) skillsCountEl.innerText = storedSkills.length;

    let storedCerts = [];
    try {
      storedCerts = JSON.parse(localStorage.getItem("veera_custom_certificates") || localStorage.getItem("veera_certificates_data") || "[]");
    } catch {
      storedCerts = [];
    }
    const certCountEl = document.getElementById("dashCertCount");
    if (certCountEl && storedCerts.length > 0) certCountEl.innerText = storedCerts.length;
  }

  // Logout Handlers
  function handleLogout() {
    if (confirm("Are you sure you want to logout from dashboard?")) {
      sessionStorage.clear();
      window.location.replace("index.html");
    }
  }

  const logoutTrigger = document.getElementById("logoutTrigger");
  const sidebarUserCard = document.getElementById("sidebarUserCard");
  if (logoutTrigger) logoutTrigger.addEventListener("click", handleLogout);
  if (sidebarUserCard) sidebarUserCard.addEventListener("click", handleLogout);

  loadDashboardProjects();
  syncDashboardMetrics();
});