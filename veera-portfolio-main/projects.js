// Firebase App Initialization
const firebaseConfig = {
  apiKey: "AIzaSyBVHRLbX-QqKkLQ01rvEXNQH5u3Jqxpd_I",
  authDomain: "veeraofficial-1cfdb.firebaseapp.com",
  projectId: "veeraofficial-1cfdb",
  storageBucket: "veeraofficial-1cfdb.firebasestorage.app",
  messagingSenderId: "279932247616",
  appId: "1:279932247616:web:4fc7d66982d7190f7349a5",
  measurementId: "G-4QTR5SWCDZ"
};

if (typeof firebase !== "undefined" && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = (typeof firebase !== "undefined") ? firebase.firestore() : null;

document.addEventListener('DOMContentLoaded', () => {
  // 1. Session Countdown Timer
  const expiresAt = parseInt(sessionStorage.getItem("veera_session_expires") || (Date.now() + 30 * 60 * 1000), 10);
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

  // 2. Fetch & Render Projects from Firebase
  let currentProjectList = [];
  const grid = document.getElementById("projectCardsGrid");

  async function renderAllProjects() {
    if (!grid) return;
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 24px;"></i><br><br>Loading live projects...</div>`;

    let cloudProjects = [];

    if (db) {
      try {
        const snap = await db.collection("projects").orderBy("createdAt", "desc").get();
        snap.forEach(d => cloudProjects.push({ id: d.id, ...d.data() }));
      } catch {
        try {
          const snap = await db.collection("projects").get();
          snap.forEach(d => cloudProjects.push({ id: d.id, ...d.data() }));
        } catch (err) {
          console.error("Firestore read error:", err);
        }
      }
    }

    currentProjectList = cloudProjects;
    grid.innerHTML = "";

    if (currentProjectList.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; background: #ffffff; border-radius: 16px; border: 1px dashed #cbd5e1;">
          <i class="fa-solid fa-folder-open" style="font-size: 36px; color: #94a3b8; margin-bottom: 10px;"></i>
          <h3 style="font-size: 15px; font-weight: 800; color: #1e293b;">No Projects Found</h3>
          <p style="font-size: 12px; color: #64748b; margin-top: 4px;">Projects added from the Admin Hub will appear here instantly.</p>
        </div>
      `;
      updateCounters(0, 0, 0);
      return;
    }

    currentProjectList.forEach((proj) => {
      const card = document.createElement("div");
      const categoryVal = (proj.category || "completed").toLowerCase();
      card.className = "project-box";
      card.setAttribute("data-category", categoryVal);

      const images = (proj.images && proj.images.length > 0) ? proj.images : (proj.imageUrl ? [proj.imageUrl] : ["images/veera.png"]);
      const previewCount = Math.min(images.length, 4);
      const displayImages = images.slice(0, previewCount);

      let gridImagesHtml = displayImages.map(imgSrc => `
        <img src="${imgSrc}" alt="${proj.title}" onerror="this.src='images/veera.png';" />
      `).join("");

      const techList = Array.isArray(proj.tech) ? proj.tech : (proj.tech ? proj.tech.split(",") : ["Tech"]);
      const techChips = techList.map(t => `<span class="chip purple">${t.trim()}</span>`).join("");

      card.innerHTML = `
        <div class="project-thumb-wrap">
          <div class="card-img-grid count-${previewCount}">
            ${gridImagesHtml}
          </div>
          <span class="badge-status ${categoryVal}">
            ${categoryVal === 'completed' ? 'Completed' : 'In Progress'}
          </span>
          ${images.length > 1 ? `<span class="multi-count-pill"><i class="fa-regular fa-images"></i> ${images.length} Photos</span>` : ''}
        </div>
        <div class="project-box-body">
          <h3>${proj.title}</h3>
          <p class="clamped-desc">${proj.desc || ''}</p>
          <div class="tag-chips">${techChips}</div>

          <div class="project-card-actions">
            <button type="button" class="btn-view-details" onclick="window.openProjectDetails('${proj.id}')">
              <i class="fa-solid fa-circle-info"></i> View Full Details
            </button>
            <a href="${proj.link || '#'}" target="_blank" class="open-link-btn" title="Open Live Link">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    const completedCount = currentProjectList.filter(p => (p.category || '').toLowerCase() === 'completed').length;
    const inProgressCount = currentProjectList.filter(p => (p.category || '').toLowerCase() === 'in-progress').length;
    updateCounters(currentProjectList.length, completedCount, inProgressCount);
  }

  function updateCounters(total, completed, inProgress) {
    const totalEl = document.getElementById("statTotalProjects");
    const compEl = document.getElementById("statCompleted");
    const inProgEl = document.getElementById("statInProgress");

    if (totalEl) totalEl.innerText = total;
    if (compEl) compEl.innerText = completed;
    if (inProgEl) inProgEl.innerText = inProgress;
  }

  // 3. Multi-Image Showcase Modal
  const modal = document.getElementById("projectInfoModal");
  const mainStage = document.getElementById("modalMainStage");
  const mainActiveImg = document.getElementById("modalActiveMainImage");
  const thumbsTrack = document.getElementById("modalThumbnailsTrack");
  const modalCounter = document.getElementById("modalImageCounter");
  
  let activeSlideIndex = 0;
  let activeModalImages = [];

  let lightboxOverlay = document.getElementById("lightboxOverlay");
  if (!lightboxOverlay) {
    lightboxOverlay = document.createElement("div");
    lightboxOverlay.className = "lightbox-overlay";
    lightboxOverlay.id = "lightboxOverlay";
    lightboxOverlay.innerHTML = `
      <button type="button" class="btn-close-lightbox" id="closeLightboxBtn"><i class="fa-solid fa-xmark"></i></button>
      <div class="lightbox-content">
        <img src="" id="lightboxImg" class="lightbox-img" alt="Zoomed Photo" />
      </div>
    `;
    document.body.appendChild(lightboxOverlay);

    document.getElementById("closeLightboxBtn").addEventListener("click", () => {
      lightboxOverlay.classList.remove("active");
    });
    lightboxOverlay.addEventListener("click", (e) => {
      if (e.target === lightboxOverlay) lightboxOverlay.classList.remove("active");
    });
  }

  function setStageImage(index) {
    if (!mainActiveImg) return;
    activeSlideIndex = index;
    const targetUrl = activeModalImages[activeSlideIndex] || "images/veera.png";

    let blurBg = mainStage.querySelector(".stage-blurred-bg");
    if (!blurBg) {
      blurBg = document.createElement("img");
      blurBg.className = "stage-blurred-bg";
      mainStage.prepend(blurBg);
    }
    blurBg.src = targetUrl;

    mainActiveImg.className = "stage-main-img fade-switching";
    setTimeout(() => {
      mainActiveImg.src = targetUrl;
      if (modalCounter) {
        modalCounter.innerText = `${activeSlideIndex + 1} / ${activeModalImages.length}`;
      }
      mainActiveImg.classList.remove("fade-switching");
    }, 120);

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

  if (mainStage) {
    mainStage.addEventListener("click", (e) => {
      if (e.target.closest(".stage-nav-btn")) return;
      const zoomImg = document.getElementById("lightboxImg");
      if (zoomImg && activeModalImages.length > 0) {
        zoomImg.src = activeModalImages[activeSlideIndex];
        lightboxOverlay.classList.add("active");
      }
    });
  }

  window.openProjectDetails = function(id) {
    const project = currentProjectList.find(p => p.id === id);
    if (!project || !modal) return;

    document.getElementById("modalProjTitle").innerText = project.title;
    
    const statusEl = document.getElementById("modalProjStatus");
    statusEl.innerText = (project.category === "completed" ? "Completed" : "In Progress");
    statusEl.className = `badge-status-modal ${project.category}`;

    document.getElementById("modalFullDescription").innerText = project.desc || "No detailed description provided.";

    const techList = Array.isArray(project.tech) ? project.tech : (project.tech ? project.tech.split(",") : ["Tech"]);
    document.getElementById("modalTechChips").innerHTML = techList.map(t => `<span class="chip purple">${t.trim()}</span>`).join("");

    const linkBtn = document.getElementById("modalLiveLinkBtn");
    if (project.link && project.link !== "#") {
      linkBtn.href = project.link;
      linkBtn.style.display = "inline-flex";
    } else {
      linkBtn.style.display = "none";
    }

    activeModalImages = (project.images && project.images.length > 0) ? project.images : (project.imageUrl ? [project.imageUrl] : ["images/veera.png"]);

    let zoomBadge = mainStage.querySelector(".stage-zoom-badge");
    if (!zoomBadge) {
      zoomBadge = document.createElement("span");
      zoomBadge.className = "stage-zoom-badge";
      zoomBadge.innerHTML = `<i class="fa-solid fa-magnifying-glass-plus"></i> Click to Zoom`;
      mainStage.appendChild(zoomBadge);
    }

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

  const closeModalBtn = document.getElementById("closeProjectModalBtn");
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => modal.classList.remove("active"));
  }

  // 4. Filter Buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');
      const boxes = document.querySelectorAll('.project-box');

      boxes.forEach(box => {
        const cat = box.getAttribute('data-category') || '';
        if (filterValue === 'all' || cat.includes(filterValue)) {
          box.style.display = 'flex';
        } else {
          box.style.display = 'none';
        }
      });
    });
  });

  // 5. Search Bar
  const searchInput = document.getElementById('projectSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      const boxes = document.querySelectorAll('.project-box');
      boxes.forEach(box => {
        const title = box.querySelector('h3').innerText.toLowerCase();
        const desc = box.querySelector('.clamped-desc').innerText.toLowerCase();
        if (title.includes(term) || desc.includes(term)) {
          box.style.display = 'flex';
        } else {
          box.style.display = 'none';
        }
      });
    });
  }

  // 6. Logout
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

  renderAllProjects();
});