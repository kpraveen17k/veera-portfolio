document.addEventListener('DOMContentLoaded', () => {
  // 1. Session Lock
  history.pushState(null, null, location.href);
  window.onpopstate = () => history.go(1);

  // 2. Active User Details
  const activeUser = sessionStorage.getItem("veera_active_user") || "Veera";
  const activeEmail = sessionStorage.getItem("veera_active_email");
  
  const heroEmail = document.getElementById("heroEmailDisplay");
  if (heroEmail && activeEmail) {
    heroEmail.innerText = activeEmail;
  }

  // 3. 30-Minute Auto-Logout Countdown
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

  // 4. Live Counter Synchronization from LocalStorage
  let storedProjects = [];
  try {
    storedProjects = JSON.parse(localStorage.getItem("veera_projects_data") || localStorage.getItem("veera_custom_projects") || "[]");
  } catch {
    storedProjects = [];
  }
  const projCount = storedProjects.length > 0 ? storedProjects.length : 6;
  
  const heroProj = document.getElementById("heroProjectsCount");
  const subProj = document.getElementById("subStatProjCount");
  if (heroProj) heroProj.innerText = projCount;
  if (subProj) subProj.innerText = projCount;

  // 5. Dynamic Sub-Tabs Switching
  const pTabs = document.querySelectorAll('.p-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');

  pTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');

      pTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      tabPanes.forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === `tab-${targetTab}`) {
          pane.classList.add('active');
        }
      });
    });
  });

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

  // 7. Edit Profile Prompt
  const editProfileBtn = document.getElementById("editProfileBtn");
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      window.location.href = "admin.html";
    });
  }
});