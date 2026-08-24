const firebaseConfig = {
  apiKey: "AIzaSyBVHRLbX-QqKkLQ01rvEXNQH5u3Jqxpd_I",
  authDomain: "veeraofficial-1cfdb.firebaseapp.com",
  projectId: "veeraofficial-1cfdb",
  storageBucket: "veeraofficial-1cfdb.firebasestorage.app",
  messagingSenderId: "279932247616",
  appId: "1:279932247616:web:4fc7d66982d7190f7349a5",
  measurementId: "G-4QTR5SWCDZ"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Already login ayi unte direct dashboard ki pamputhundi
if (sessionStorage.getItem("veera_active_user")) {
  const expires = parseInt(sessionStorage.getItem("veera_session_expires") || 0);
  if (new Date().getTime() < expires) {
    window.location.replace("veeradashboard.html");
  } else {
    sessionStorage.clear();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const signInTab = document.getElementById('signInTab');
  const signUpTab = document.getElementById('signUpTab');
  const slidingIndicator = document.getElementById('slidingIndicator');
  const signInView = document.getElementById('signInView');
  const signUpView = document.getElementById('signUpView');
  const linkToSignUp = document.getElementById('linkToSignUp');
  const linkToSignIn = document.getElementById('linkToSignIn');
  const switchBubble = document.getElementById('switchBubble');
  const switchIcon = document.getElementById('switchIcon');

  const passToggleBtns = document.querySelectorAll('.view-pass-btn');
  passToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      const icon = btn.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
      }
    });
  });

  function setView(mode) {
    if (mode === 'signup') {
      signInView.classList.remove('active');
      signUpView.classList.add('active');
      signUpTab.classList.add('active');
      signInTab.classList.remove('active');
      slidingIndicator.style.left = `${signUpTab.offsetLeft}px`;
      slidingIndicator.style.width = `${signUpTab.offsetWidth}px`;
      switchIcon.style.transform = 'rotate(180deg)';
    } else {
      signUpView.classList.remove('active');
      signInView.classList.add('active');
      signInTab.classList.add('active');
      signUpTab.classList.remove('active');
      slidingIndicator.style.left = `${signInTab.offsetLeft}px`;
      slidingIndicator.style.width = `${signInTab.offsetWidth}px`;
      switchIcon.style.transform = 'rotate(0deg)';
    }
  }

  signInTab.addEventListener('click', () => setView('signin'));
  signUpTab.addEventListener('click', () => setView('signup'));
  linkToSignUp.addEventListener('click', () => setView('signup'));
  linkToSignIn.addEventListener('click', () => setView('signin'));

  switchBubble.addEventListener('click', () => {
    const isSignInActive = signInView.classList.contains('active');
    setView(isSignInActive ? 'signup' : 'signin');
  });

  // ================= REGISTER =================
  const signUpForm = document.getElementById('signUpForm');
  signUpForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('regEmail').value.trim();
    const userId = document.getElementById('regUserId').value.trim().toLowerCase();
    const mobile = document.getElementById('regMobile').value.trim();
    const password = document.getElementById('regPass').value;
    const confirmPassword = document.getElementById('regConfirmPass').value;

    if (!email || !userId || !mobile || !password) {
      alert("Please fill in all fields!");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const checkUser = await db.collection("users").where("userId", "==", userId).get();
      if (!checkUser.empty) {
        alert("This User ID is already taken! Please choose another.");
        return;
      }

      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      await db.collection("users").doc(user.uid).set({
        uid: user.uid,
        email: email,
        userId: userId,
        mobile: mobile,
        createdAt: new Date().toISOString()
      });

      alert(`🎉 Registration Successful!\nUser ID: ${userId}\nPlease Sign In now.`);
      signUpForm.reset();
      setView('signin');
    } catch (error) {
      alert(`Registration Error: ${error.message}`);
    }
  });

  // ================= LOGIN =================
  const signInForm = document.getElementById('signInForm');
  signInForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const enteredUserId = document.getElementById('loginUserId').value.trim().toLowerCase();
    const enteredPassword = document.getElementById('loginPass').value;

    if (!enteredUserId || !enteredPassword) {
      alert("Please enter User ID and Password!");
      return;
    }

    try {
      const userQuery = await db.collection("users").where("userId", "==", enteredUserId).get();

      if (userQuery.empty) {
        alert("User ID not found in database! Please Register first.");
        return;
      }

      const userDoc = userQuery.docs[0].data();
      await auth.signInWithEmailAndPassword(userDoc.email, enteredPassword);

      // 30 Minutes Session Timeout
      const sessionExpiresAt = new Date().getTime() + (30 * 60 * 1000);

      sessionStorage.setItem("veera_active_user", userDoc.userId);
      sessionStorage.setItem("veera_active_email", userDoc.email);
      sessionStorage.setItem("veera_active_mobile", userDoc.mobile);
      sessionStorage.setItem("veera_session_expires", sessionExpiresAt.toString());

      // Replace location so back button won't return to login
      window.location.replace("veeradashboard.html");
    } catch (error) {
      alert("Login Failed: Incorrect password or User ID!");
    }
  });

  const forgotPassLink = document.getElementById('forgotPassLink');
  if (forgotPassLink) {
    forgotPassLink.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = prompt("Enter your registered Gmail address to receive reset link:");
      if (email) {
        try {
          await auth.sendPasswordResetEmail(email.trim());
          alert("Reset link sent! Check your Gmail inbox.");
        } catch (err) {
          alert(`Error: ${err.message}`);
        }
      }
    });
  }

  setTimeout(() => {
    slidingIndicator.style.left = `${signInTab.offsetLeft}px`;
    slidingIndicator.style.width = `${signInTab.offsetWidth}px`;
  }, 100);
});