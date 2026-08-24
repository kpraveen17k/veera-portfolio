document.addEventListener('DOMContentLoaded', () => {
  // 1. Back button protection
  history.pushState(null, null, location.href);
  window.onpopstate = function () {
    history.go(1);
  };

  // 2. 30-Minute Auto-Logout Timer
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

  // 3. Dynamic Filter Pills
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectBoxes = document.querySelectorAll('.project-box');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      projectBoxes.forEach(box => {
        const categories = box.getAttribute('data-category') || '';
        if (filterValue === 'all' || categories.includes(filterValue)) {
          box.style.display = 'flex';
        } else {
          box.style.display = 'none';
        }
      });
    });
  });

  // 4. Live Search Filter
  const searchInput = document.getElementById('projectSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      projectBoxes.forEach(box => {
        const title = box.querySelector('h3').innerText.toLowerCase();
        const desc = box.querySelector('p').innerText.toLowerCase();
        if (title.includes(term) || desc.includes(term)) {
          box.style.display = 'flex';
        } else {
          box.style.display = 'none';
        }
      });
    });
  }

  // 5. Logout Trigger
  function performLogout() {
    if (confirm("Are you sure you want to logout?")) {
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