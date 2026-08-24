document.addEventListener('DOMContentLoaded', () => {
  // 1. Back button prevention
  history.pushState(null, null, location.href);
  window.onpopstate = function () {
    history.go(1);
  };

  // 2. Load dynamic user email from session
  const activeEmail = sessionStorage.getItem("veera_active_email");
  if (activeEmail) {
    const heroEmail = document.getElementById("heroEmailDisplay");
    if (heroEmail) heroEmail.innerText = activeEmail;
  }

  // 3. 30-Minute Auto-Logout Countdown
  const expiresAt = parseInt(sessionStorage.getItem("veera_session_expires") || 0);
  const timerDisplay = document.getElementById("sessionTimerDisplay");

  function updateTimer() {
    const now = new Date().getTime();
    const timeLeft = expiresAt - now;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      alert("⚠️ Session expired (30 Minutes Over)! Please login again.");
      sessionStorage.clear();
      window.location.replace("index.html");
      return;
    }

    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
    const formattedSeconds = seconds < 10 ? "0" + seconds : seconds;

    if (timerDisplay) {
      timerDisplay.innerText = `${formattedMinutes}:${formattedSeconds}`;
    }
  }

  updateTimer();
  const timerInterval = setInterval(updateTimer, 1000);

  // 4. Dynamic Sub-Tabs Switching with Visual Data
  const pTabs = document.querySelectorAll('.p-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');

  pTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');

      // Update button active state
      pTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update tab pane view
      tabPanes.forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === `tab-${targetTab}`) {
          pane.classList.add('active');
        }
      });
    });
  });

  // 5. Logout
  function performLogout() {
    if (confirm("Are you sure you want to logout?")) {
      clearInterval(timerInterval);
      sessionStorage.clear();
      window.location.replace("index.html");
    }
  }

  const logoutTrigger = document.getElementById("logoutTrigger");
  if (logoutTrigger) logoutTrigger.addEventListener("click", performLogout);

  // 6. Edit Profile Button
  const editProfileBtn = document.getElementById("editProfileBtn");
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      alert("Edit Profile: You can update your bio, skills, and links.");
    });
  }
});