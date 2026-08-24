document.addEventListener('DOMContentLoaded', () => {
  // 1. Back Button Lock (History state protection)
  history.pushState(null, null, location.href);
  window.onpopstate = function () {
    history.go(1);
  };

  // 2. Load User Session into UI
  const userId = sessionStorage.getItem("veera_active_user");
  const expiresAt = parseInt(sessionStorage.getItem("veera_session_expires") || 0);

  if (userId) {
    const formattedName = userId.charAt(0).toUpperCase() + userId.slice(1);
    document.getElementById("headerUserName").innerText = `${formattedName}!`;
    document.getElementById("pcUserName").innerText = formattedName;
  }

  // 3. 30-Minute Countdown Timer
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

  // 4. Logout Functions
  function performLogout() {
    if (confirm("Are you sure you want to logout from Veera Space?")) {
      clearInterval(timerInterval);
      sessionStorage.clear();
      window.location.replace("index.html");
    }
  }

  const logoutTrigger = document.getElementById("logoutTrigger");
  if (logoutTrigger) logoutTrigger.addEventListener("click", performLogout);

  const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");
  if (mobileLogoutBtn) mobileLogoutBtn.addEventListener("click", performLogout);
});