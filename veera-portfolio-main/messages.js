document.addEventListener("DOMContentLoaded", () => {
  // 1. Browser Back Navigation Lock
  history.pushState(null, null, location.href);
  window.onpopstate = () => history.go(1);

  // 2. 30-Minute Live Auto-Logout Session Timer
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

  // 3. Contact Form Submission (Syncs with Admin Messages CRUD)
  const contactForm = document.getElementById("contactForm");

  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("senderName").value.trim();
      const email = document.getElementById("senderEmail").value.trim();
      const subject = document.getElementById("senderSubject").value.trim();
      const message = document.getElementById("senderMessage").value.trim();

      if (!name || !email || !subject || !message) {
        alert("Please complete all required fields before sending!");
        return;
      }

      // Save inquiry to Admin Messages Data Store
      const existingMessages = JSON.parse(localStorage.getItem("veera_messages_data") || "[]");
      existingMessages.unshift({
        f1: name,
        f2: email,
        f3: `[${subject}] ${message}`,
        date: new Date().toLocaleDateString('en-GB')
      });
      localStorage.setItem("veera_messages_data", JSON.stringify(existingMessages));

      alert(`🚀 Thank you, ${name}! Your message has been sent successfully. I will get back to you shortly.`);
      contactForm.reset();
    });
  }

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