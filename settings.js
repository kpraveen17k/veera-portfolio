import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  updatePassword 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  updateDoc, 
  doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBVHRLbX-QqKkLQ01rvEXNQH5u3Jqxpd_I",
  authDomain: "veeraofficial-1cfdb.firebaseapp.com",
  projectId: "veeraofficial-1cfdb",
  storageBucket: "veeraofficial-1cfdb.firebasestorage.app",
  messagingSenderId: "279932247616",
  appId: "1:279932247616:web:4fc7d66982d7190f7349a5",
  measurementId: "G-4QTR5SWCDZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {

  // 1. Session Timer Countdown
  const expiresAt = parseInt(sessionStorage.getItem("veera_session_expires") || 0);
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

  // 2. Firebase Password Update
  const passForm = document.getElementById("passwordUpdateForm");
  const btnUpdate = document.getElementById("btnUpdatePassword");

  if (passForm) {
    passForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const currentPass = document.getElementById("setCurrentPass").value.trim();
      const newPass = document.getElementById("setNewPass").value.trim();
      const confirmPass = document.getElementById("setConfirmPass").value.trim();

      if (newPass !== confirmPass) {
        alert("❌ Passwords do not match!");
        return;
      }

      if (newPass.length < 6) {
        alert("⚠️ Password must be at least 6 characters long!");
        return;
      }

      btnUpdate.disabled = true;
      btnUpdate.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Updating...`;

      try {
        let userEmail = sessionStorage.getItem("veera_active_email") || "";
        let matchedDocId = null;

        const querySnapshot = await getDocs(collection(db, "users"));
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.email) userEmail = data.email;
          matchedDocId = docSnap.id;
        });

        if (userEmail) {
          const userCredential = await signInWithEmailAndPassword(auth, userEmail, currentPass);
          await updatePassword(userCredential.user, newPass);
        }

        if (matchedDocId) {
          await updateDoc(doc(db, "users", matchedDocId), {
            updatedAt: new Date()
          });
        }

        alert("✅ Password successfully updated in Firebase!");
        passForm.reset();
      } catch (error) {
        alert("❌ Error: " + error.message);
      } finally {
        btnUpdate.disabled = false;
        btnUpdate.innerHTML = `<i class="fa-solid fa-key"></i> <span>Update Password in Firebase</span>`;
      }
    });
  }

  // ================= 3. CUSTOM PATTERN LOCK LOGIC =================
  const patternModal = document.getElementById("patternModal");
  const openModalBtn = document.getElementById("openPatternModalBtn");
  const closeModalBtn = document.getElementById("closePatternModalBtn");
  const resetPatternBtn = document.getElementById("resetPatternBtn");

  const canvas = document.getElementById("patternCanvas");
  const ctx = canvas ? canvas.getContext("2d") : null;
  const statusMsg = document.getElementById("patternStatusMsg");

  // Custom Sequence: 8 -> 5 -> 7 -> 3 -> 4 -> 2 -> 6 -> 1 -> 9
  // 0-indexed indices: [7, 4, 6, 2, 3, 1, 5, 0, 8]
  const CORRECT_PATTERN = [7, 4, 6, 2, 3, 1, 5, 0, 8]; 
  
  const rows = 3;
  const cols = 3;
  const dotRadius = 10;
  const touchRadius = 24;
  
  let dots = [];
  let selectedDots = [];
  let isDrawing = false;
  let currentPos = { x: 0, y: 0 };

  function initDots() {
    if (!canvas) return;
    dots = [];
    const stepX = canvas.width / (cols + 1);
    const stepY = canvas.height / (rows + 1);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        dots.push({
          id: r * cols + c,
          x: stepX * (c + 1),
          y: stepY * (r + 1)
        });
      }
    }
    drawCanvas();
  }

  function drawCanvas(isError = false, isSuccess = false) {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let lineColor = "#8b5cf6";
    let activeDotColor = "#a855f7";

    if (isError) {
      lineColor = "#ef4444";
      activeDotColor = "#ef4444";
    } else if (isSuccess) {
      lineColor = "#10b981";
      activeDotColor = "#10b981";
    }

    // Line Connections
    if (selectedDots.length > 0) {
      ctx.beginPath();
      ctx.lineWidth = 4;
      ctx.strokeStyle = lineColor;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      selectedDots.forEach((dot, index) => {
        if (index === 0) ctx.moveTo(dot.x, dot.y);
        else ctx.lineTo(dot.x, dot.y);
      });

      if (isDrawing) {
        ctx.lineTo(currentPos.x, currentPos.y);
      }
      ctx.stroke();
    }

    // Dots
    dots.forEach((dot) => {
      const isSelected = selectedDots.some((d) => d.id === dot.id);

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dotRadius * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? (isError ? "rgba(239,68,68,0.15)" : "rgba(139,92,246,0.15)") : "transparent";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? activeDotColor : "#cbd5e1";
      ctx.fill();
    });
  }

  function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function handleStart(e) {
    e.preventDefault();
    isDrawing = true;
    selectedDots = [];
    if (statusMsg) {
      statusMsg.className = "pattern-status";
      statusMsg.innerText = "Drawing pattern...";
    }
    handleMove(e);
  }

  function handleMove(e) {
    if (!isDrawing) return;
    currentPos = getPointerPos(e);

    dots.forEach((dot) => {
      const dist = Math.hypot(dot.x - currentPos.x, dot.y - currentPos.y);
      if (dist < touchRadius && !selectedDots.some((d) => d.id === dot.id)) {
        selectedDots.push(dot);
      }
    });

    drawCanvas();
  }

  function handleEnd() {
    if (!isDrawing) return;
    isDrawing = false;

    if (selectedDots.length < CORRECT_PATTERN.length) {
      resetPattern("Pattern incomplete!");
      return;
    }

    const drawnSequence = selectedDots.map((d) => d.id);
    const isValid =
      drawnSequence.length === CORRECT_PATTERN.length &&
      drawnSequence.every((val, idx) => val === CORRECT_PATTERN[idx]);

    if (isValid) {
      if (statusMsg) {
        statusMsg.className = "pattern-status success";
        statusMsg.innerText = "Access Granted! Unlocking Admin...";
      }
      drawCanvas(false, true);

      setTimeout(() => {
        window.location.href = "admin.html";
      }, 700);
    } else {
      if (statusMsg) {
        statusMsg.className = "pattern-status error";
        statusMsg.innerText = "Incorrect pattern! Try again.";
      }
      drawCanvas(true, false);

      setTimeout(() => {
        resetPattern();
      }, 900);
    }
  }

  function resetPattern(msg = "Connect dots to unlock") {
    selectedDots = [];
    isDrawing = false;
    if (statusMsg) {
      statusMsg.className = "pattern-status";
      statusMsg.innerText = msg;
    }
    drawCanvas();
  }

  if (openModalBtn && patternModal) {
    openModalBtn.addEventListener("click", () => {
      patternModal.classList.add("active");
      initDots();
      resetPattern();
    });
  }

  if (closeModalBtn && patternModal) {
    closeModalBtn.addEventListener("click", () => {
      patternModal.classList.remove("active");
    });
  }

  if (canvas) {
    canvas.addEventListener("mousedown", handleStart);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);

    canvas.addEventListener("touchstart", handleStart, { passive: false });
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);
  }

  if (resetPatternBtn) resetPatternBtn.addEventListener("click", () => resetPattern());

  // Logout Trigger
  const logoutTrigger = document.getElementById("logoutTrigger");
  if (logoutTrigger) {
    logoutTrigger.addEventListener("click", () => {
      if (confirm("Logout from account?")) {
        sessionStorage.clear();
        window.location.replace("index.html");
      }
    });
  }
});