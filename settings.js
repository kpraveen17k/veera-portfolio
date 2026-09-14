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

  // 3. Direct Admin Portal Navigation
  const openAdminBtn = document.getElementById("openAdminBtn");
  if (openAdminBtn) {
    openAdminBtn.addEventListener("click", () => {
      window.location.href = "admin.html";
    });
  }

  // 4. Logout Trigger
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