import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Configuration
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

// Active Session Check
const activeUser = sessionStorage.getItem("veera_active_user");
const sessionExp = parseInt(sessionStorage.getItem("veera_session_expires") || "0", 10);

if (activeUser && new Date().getTime() < sessionExp) {
  window.location.replace("veeradashboard.html");
} else if (activeUser) {
  sessionStorage.clear();
}

document.addEventListener("DOMContentLoaded", () => {
  const signInTab = document.getElementById("signInTab");
  const signUpTab = document.getElementById("signUpTab");
  const slidingIndicator = document.getElementById("slidingIndicator");
  const signInView = document.getElementById("signInView");
  const signUpView = document.getElementById("signUpView");
  const linkToSignUp = document.getElementById("linkToSignUp");
  const linkToSignIn = document.getElementById("linkToSignIn");
  const switchBubble = document.getElementById("switchBubble");
  const switchIcon = document.getElementById("switchIcon");

  // Tab & Form Switching
  function updateIndicator(targetTab) {
    if (slidingIndicator && targetTab) {
      slidingIndicator.style.left = `${targetTab.offsetLeft}px`;
      slidingIndicator.style.width = `${targetTab.offsetWidth}px`;
    }
  }

  function setView(mode) {
    if (mode === "signup") {
      signInView.classList.remove("active");
      signUpView.classList.add("active");
      signUpTab.classList.add("active");
      signInTab.classList.remove("active");
      updateIndicator(signUpTab);
      if (switchIcon) switchIcon.style.transform = "rotate(180deg)";
    } else {
      signUpView.classList.remove("active");
      signInView.classList.add("active");
      signInTab.classList.add("active");
      signUpTab.classList.remove("active");
      updateIndicator(signInTab);
      if (switchIcon) switchIcon.style.transform = "rotate(0deg)";
    }
  }

  if (signInTab) signInTab.addEventListener("click", () => setView("signin"));
  if (signUpTab) signUpTab.addEventListener("click", () => setView("signup"));
  if (linkToSignUp) linkToSignUp.addEventListener("click", () => setView("signup"));
  if (linkToSignIn) linkToSignIn.addEventListener("click", () => setView("signin"));

  if (switchBubble) {
    switchBubble.addEventListener("click", () => {
      const isSignInActive = signInView.classList.contains("active");
      setView(isSignInActive ? "signup" : "signin");
    });
  }

  // Password Visibility Toggle
  document.querySelectorAll(".view-pass-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      const icon = btn.querySelector("i");
      if (input && input.type === "password") {
        input.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
      } else if (input) {
        input.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
      }
    });
  });

  // ================= 1. USER REGISTRATION =================
  const signUpForm = document.getElementById("signUpForm");
  if (signUpForm) {
    signUpForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("regEmail").value.trim();
      const userId = document.getElementById("regUserId").value.trim().toLowerCase();
      const mobile = document.getElementById("regMobile").value.trim();
      const password = document.getElementById("regPass").value;
      const confirmPassword = document.getElementById("regConfirmPass").value;
      const regBtn = document.getElementById("regSubmitBtn");

      if (!email || !userId || !mobile || !password) {
        alert("Please fill in all fields!");
        return;
      }

      if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }

      if (password.length < 6) {
        alert("Password must be at least 6 characters long!");
        return;
      }

      try {
        regBtn.disabled = true;
        regBtn.innerHTML = `<span>Creating Account...</span> <i class="fa-solid fa-spinner fa-spin"></i>`;

        // Check if User ID already exists in Firestore
        const userQuery = query(collection(db, "users"), where("userId", "==", userId));
        const checkUserSnap = await getDocs(userQuery);

        if (!checkUserSnap.empty) {
          alert("This User ID is already taken! Please choose another.");
          regBtn.disabled = false;
          regBtn.innerHTML = `<span>Register Account</span> <i class="fa-solid fa-rocket"></i>`;
          return;
        }

        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save User Data to Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: email,
          userId: userId,
          mobile: mobile,
          createdAt: new Date().toISOString()
        });

        alert(`🎉 Registration Successful!\nUser ID: ${userId}\nPlease Sign In now.`);
        signUpForm.reset();
        setView("signin");
      } catch (error) {
        console.error("Register Error:", error);
        alert(`Registration Error: ${error.message}`);
      } finally {
        regBtn.disabled = false;
        regBtn.innerHTML = `<span>Register Account</span> <i class="fa-solid fa-rocket"></i>`;
      }
    });
  }

  // ================= 2. USER LOGIN =================
  const signInForm = document.getElementById("signInForm");
  if (signInForm) {
    signInForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const enteredUserId = document.getElementById("loginUserId").value.trim().toLowerCase();
      const enteredPassword = document.getElementById("loginPass").value;
      const loginBtn = document.getElementById("loginSubmitBtn");

      if (!enteredUserId || !enteredPassword) {
        alert("Please enter User ID and Password!");
        return;
      }

      try {
        loginBtn.disabled = true;
        loginBtn.innerHTML = `<span>Logging in...</span> <i class="fa-solid fa-spinner fa-spin"></i>`;

        let emailToAuth = enteredUserId;
        let finalUserData = null;

        // If user entered User ID instead of email, lookup email from Firestore
        if (!enteredUserId.includes("@")) {
          const userQuery = query(collection(db, "users"), where("userId", "==", enteredUserId));
          const querySnap = await getDocs(userQuery);

          if (querySnap.empty) {
            alert("User ID not found in database! Please Register first.");
            loginBtn.disabled = false;
            loginBtn.innerHTML = `<span>Login to Portal</span> <i class="fa-solid fa-arrow-right-to-bracket"></i>`;
            return;
          }

          finalUserData = querySnap.docs[0].data();
          emailToAuth = finalUserData.email;
        }

        // Authenticate with Firebase Auth
        await signInWithEmailAndPassword(auth, emailToAuth, enteredPassword);

        if (!finalUserData) {
          const emailQuery = query(collection(db, "users"), where("email", "==", emailToAuth));
          const emailSnap = await getDocs(emailQuery);
          if (!emailSnap.empty) {
            finalUserData = emailSnap.docs[0].data();
          }
        }

        // Setup 30-Minute Session
        const sessionExpiresAt = new Date().getTime() + (30 * 60 * 1000);
        sessionStorage.setItem("veera_active_user", finalUserData ? finalUserData.userId : enteredUserId);
        sessionStorage.setItem("veera_active_email", emailToAuth);
        sessionStorage.setItem("veera_active_mobile", finalUserData ? finalUserData.mobile : "");
        sessionStorage.setItem("veera_session_expires", sessionExpiresAt.toString());

        window.location.replace("veeradashboard.html");
      } catch (error) {
        console.error("Login Error:", error);
        alert("Login Failed: Incorrect Password or Credentials!");
      } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = `<span>Login to Portal</span> <i class="fa-solid fa-arrow-right-to-bracket"></i>`;
      }
    });
  }

  // Forgot Password Handler
  const forgotPassLink = document.getElementById("forgotPassLink");
  if (forgotPassLink) {
    forgotPassLink.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = prompt("Enter your registered Gmail address to receive reset link:");
      if (email && email.trim()) {
        try {
          await sendPasswordResetEmail(auth, email.trim());
          alert("Reset link sent! Check your Gmail inbox.");
        } catch (err) {
          alert(`Error: ${err.message}`);
        }
      }
    });
  }

  setTimeout(() => updateIndicator(signInTab), 100);
});