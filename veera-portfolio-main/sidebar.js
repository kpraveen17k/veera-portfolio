document.addEventListener("DOMContentLoaded", () => {
  const sidebarContainer = document.getElementById("sidebar-container");
  if (!sidebarContainer) return;

  sidebarContainer.innerHTML = `
    <nav class="sidebar-nav">
      <a href="veeradashboard.html" class="nav-item"><i class="fa-solid fa-house"></i><span>Dashboard</span></a>
      <a href="profile.html" class="nav-item"><i class="fa-regular fa-user"></i><span>Profile</span></a>
      <a href="projects.html" class="nav-item"><i class="fa-solid fa-layer-group"></i><span>Projects</span></a>
      <a href="skills.html" class="nav-item"><i class="fa-solid fa-code"></i><span>Skills</span></a>
      <a href="experience.html" class="nav-item"><i class="fa-solid fa-briefcase"></i><span>Experience</span></a>
      <a href="education.html" class="nav-item"><i class="fa-solid fa-graduation-cap"></i><span>Education</span></a>
      <a href="certificates.html" class="nav-item"><i class="fa-solid fa-certificate"></i><span>Certificates</span></a>
      <a href="blog.html" class="nav-item"><i class="fa-solid fa-newspaper"></i><span>Blog</span></a>
      <a href="gallery.html" class="nav-item"><i class="fa-regular fa-image"></i><span>Gallery</span></a>
      <a href="messages.html" class="nav-item"><i class="fa-regular fa-envelope"></i><span>Messages</span></a>
      <a href="settings.html" class="nav-item"><i class="fa-solid fa-gear"></i><span>Settings</span></a>
    </nav>
  `;

  // Current page batti automatic ga 'active' class add chestundi
  const currentPage = window.location.pathname.split("/").pop() || "veeradashboard.html";
  const navLinks = sidebarContainer.querySelectorAll(".nav-item");

  navLinks.forEach(link => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });
});