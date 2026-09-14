document.addEventListener("DOMContentLoaded", () => {
  // 1. Session Countdown Timer (30-Minute Auto Logout)
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

  // 2. Fetch & Render Real Education (Zero Hardcoded Dummy Records)
  let currentEduList = [];
  const grid = document.getElementById("educationTimeline");

  async function renderEducation() {
    let cloudEdu = [];

    // A. Fetch from Firestore
    try {
      if (typeof firebase !== "undefined" && firebase.apps.length) {
        const snap = await firebase.firestore().collection("education").get();
        snap.forEach((doc) => cloudEdu.push({ id: doc.id, ...doc.data() }));
      }
    } catch (err) {
      console.warn("Firestore offline, switching to local cache:", err);
    }

    // B. Fetch from LocalStorage if Firestore is empty/offline
    let localEdu = [];
    try {
      localEdu = JSON.parse(localStorage.getItem("veera_custom_education") || "[]");
    } catch {
      localEdu = [];
    }

    // Combine Unique User-Added Education Records
    const uniqueIds = new Set();
    currentEduList = [...cloudEdu, ...localEdu].filter((item) => {
      if (!item.id || uniqueIds.has(item.id)) return false;
      uniqueIds.add(item.id);
      return true;
    });

    if (!grid) return;
    grid.innerHTML = "";

    // Empty State Check
    if (currentEduList.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; background: #ffffff; border-radius: 16px; border: 1px dashed #cbd5e1;">
          <i class="fa-solid fa-graduation-cap" style="font-size: 36px; color: #94a3b8; margin-bottom: 10px;"></i>
          <h3 style="font-size: 15px; font-weight: 800; color: #1e293b;">No Education Added Yet</h3>
          <p style="font-size: 12px; color: #64748b; margin-top: 4px;">Add your degrees, colleges, and academic records from Admin Hub.</p>
          <a href="admin.html" style="display: inline-flex; align-items: center; gap: 6px; margin-top: 12px; background: #8b5cf6; color: #fff; text-decoration: none; padding: 7px 16px; border-radius: 10px; font-size: 12px; font-weight: 700;">
            <i class="fa-solid fa-plus"></i> Add New Record
          </a>
        </div>
      `;
      updateCounters(0);
      return;
    }

    // Render Cards for Uploaded Education (3-Line Clamping + View Details Button)
    currentEduList.forEach((edu) => {
      const bannerImg = (edu.images && edu.images[0]) || edu.imageUrl || "images/veera.png";
      const card = document.createElement("div");
      card.className = "edu-box";
      card.innerHTML = `
        <div class="edu-thumb-wrap">
          <img src="${bannerImg}" alt="${edu.title}" onerror="this.src='images/veera.png';" />
          <span class="badge-status">${edu.year || "Completed"}</span>
        </div>
        <div class="edu-box-body">
          <h3>${edu.title}</h3>
          <h4 class="institute-sub">${edu.institution || "College / University"}</h4>
          <!-- 3-line clamped description -->
          <p class="clamped-desc">${edu.desc || "Verified academic course summary."}</p>
          <div class="edu-card-actions">
            <button type="button" class="btn-view-details" onclick="window.openEduDetails('${edu.id}')">
              <i class="fa-solid fa-circle-info"></i> View Full Details
            </button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    updateCounters(currentEduList.length);
  }

  function updateCounters(count) {
    const totalEduEl = document.getElementById("statTotalEduCount");
    if (totalEduEl) totalEduEl.innerText = count;
  }

  // 3. Multi-Image Showcase Modal Controller
  const modal = document.getElementById("eduInfoModal");
  const mainActiveImg = document.getElementById("modalActiveMainImage");
  const thumbsTrack = document.getElementById("modalThumbnailsTrack");
  const modalCounter = document.getElementById("modalImageCounter");
  let activeSlideIndex = 0;
  let activeModalImages = [];

  function setStageImage(index) {
    if (!mainActiveImg) return;
    activeSlideIndex = index;

    mainActiveImg.classList.add("fade-switching");
    setTimeout(() => {
      mainActiveImg.src = activeModalImages[activeSlideIndex] || "images/veera.png";
      if (modalCounter) {
        modalCounter.innerText = `${activeSlideIndex + 1} / ${activeModalImages.length}`;
      }
      mainActiveImg.classList.remove("fade-switching");
    }, 150);

    if (thumbsTrack) {
      const thumbs = thumbsTrack.querySelectorAll(".thumb-item");
      thumbs.forEach((t, idx) => {
        if (idx === activeSlideIndex) {
          t.classList.add("active");
          t.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        } else {
          t.classList.remove("active");
        }
      });
    }
  }

  window.openEduDetails = function(id) {
    const item = currentEduList.find((e) => e.id === id);
    if (!item || !modal) return;

    document.getElementById("modalEduTitle").innerText = item.title;
    document.getElementById("modalEduBadge").innerText = item.year || "Milestone";
    document.getElementById("modalEduInstitution").innerHTML = `<i class="fa-solid fa-building-columns"></i> ${item.institution || "College/University"}`;
    document.getElementById("modalFullDescription").innerText = item.desc || "No detailed academic summary provided.";

    activeModalImages = (item.images && item.images.length > 0) ? item.images : (item.imageUrl ? [item.imageUrl] : ["images/veera.png"]);

    if (thumbsTrack) {
      thumbsTrack.innerHTML = activeModalImages.map((src, i) => `
        <div class="thumb-item ${i === 0 ? 'active' : ''}" onclick="window.switchThumbSlide(${i})">
          <img src="${src}" alt="Thumb" onerror="this.src='images/veera.png';" />
        </div>
      `).join("");
      thumbsTrack.style.display = activeModalImages.length > 1 ? "flex" : "none";
    }

    const prevBtn = document.getElementById("modalPrevSlide");
    const nextBtn = document.getElementById("modalNextSlide");
    if (activeModalImages.length > 1) {
      if (prevBtn) prevBtn.style.display = "grid";
      if (nextBtn) nextBtn.style.display = "grid";
      if (modalCounter) modalCounter.style.display = "block";
    } else {
      if (prevBtn) prevBtn.style.display = "none";
      if (nextBtn) nextBtn.style.display = "none";
      if (modalCounter) modalCounter.style.display = "none";
    }

    setStageImage(0);
    modal.classList.add("active");
  };

  window.switchThumbSlide = function(i) {
    setStageImage(i);
  };

  const nextSlideBtn = document.getElementById("modalNextSlide");
  if (nextSlideBtn) {
    nextSlideBtn.addEventListener("click", () => {
      const nextIdx = (activeSlideIndex + 1) % activeModalImages.length;
      setStageImage(nextIdx);
    });
  }

  const prevSlideBtn = document.getElementById("modalPrevSlide");
  if (prevSlideBtn) {
    prevSlideBtn.addEventListener("click", () => {
      const prevIdx = (activeSlideIndex - 1 + activeModalImages.length) % activeModalImages.length;
      setStageImage(prevIdx);
    });
  }

  const closeModalBtn = document.getElementById("closeEduModalBtn");
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => modal.classList.remove("active"));
  }

  // 4. Live Search Filter
  const searchInput = document.getElementById("eduSearch");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase().trim();
      document.querySelectorAll(".edu-box").forEach((card) => {
        card.style.display = card.innerText.toLowerCase().includes(term) ? "flex" : "none";
      });
    });
  }

  // 5. Logout Handlers
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

  renderEducation();
});