const firebaseConfig = {
  apiKey: "AIzaSyBVHRLbX-QqKkLQ01rvEXNQH5u3Jqxpd_I",
  authDomain: "veeraofficial-1cfdb.firebaseapp.com",
  projectId: "veeraofficial-1cfdb",
  storageBucket: "veeraofficial-1cfdb.firebasestorage.app",
  messagingSenderId: "279932247616",
  appId: "1:279932247616:web:4fc7d66982d7190f7349a5",
  measurementId: "G-4QTR5SWCDZ"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Fast Canvas Image Compressor
function compressImageFast(file) {
  return new Promise((resolve) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

async function uploadMultiFiles(files) {
  if (!files || files.length === 0) return [];
  const compressPromises = Array.from(files).map(f => compressImageFast(f));
  const urls = await Promise.all(compressPromises);
  return urls.filter(u => u !== "");
}

document.addEventListener("DOMContentLoaded", () => {
  let activeSection = "projects";
  let currentItems = [];

  const sectionTabs = document.querySelectorAll(".adm-tab");
  const sectionTitle = document.getElementById("currentSectionTitle");
  const sectionDesc = document.getElementById("currentSectionDesc");
  const tableHeadRow = document.getElementById("tableHeadRow");
  const tableBody = document.getElementById("tableBody");

  const modal = document.getElementById("crudModal");
  const modalTitle = document.getElementById("modalTitle");
  const crudForm = document.getElementById("crudForm");
  const dynamicFormFields = document.getElementById("dynamicFormFields");
  const editItemId = document.getElementById("editItemIndex");
  const submitBtn = document.querySelector(".btn-save-modal") || document.getElementById("submitFormBtn");

  // Universal Configs for All 9 Sidebar Options
  const configs = {
    projects: {
      title: "Projects Manager",
      desc: "Upload projects with multiple screenshots & full descriptions.",
      collection: "projects",
      localKey: "veera_custom_projects",
      columns: ["Previews", "Title", "Category", "Description", "Tech Stack", "Actions"],
      fields: [
        { id: "title", label: "Project Title", type: "text", required: true },
        { id: "category", label: "Category", type: "select", options: ["completed", "in-progress"], required: true },
        { id: "desc", label: "Full Detailed Information", type: "textarea", required: true },
        { id: "tech", label: "Tech Stack (Comma Separated)", type: "text", required: true },
        { id: "link", label: "Project Link / GitHub URL", type: "url", required: false },
        { id: "images", label: "Upload Images (Select Multiple)", type: "file", multiple: true, required: false }
      ]
    },
    skills: {
      title: "Skills Manager",
      desc: "Manage skills and technical proficiency.",
      collection: "skills",
      localKey: "veera_custom_skills",
      columns: ["Banner", "Skill Title", "Percentage", "Summary", "Actions"],
      fields: [
        { id: "title", label: "Skill / Category Title", type: "text", required: true },
        { id: "percentage", label: "Proficiency (e.g. 90%)", type: "text", required: true },
        { id: "desc", label: "Skill Summary", type: "textarea", required: true },
        { id: "images", label: "Skill Banner", type: "file", multiple: false, required: false }
      ]
    },
    experience: {
      title: "Experience Manager",
      desc: "Manage employment history and roles.",
      collection: "experience",
      localKey: "veera_custom_experience",
      columns: ["Banner", "Role / Title", "Company", "Duration", "Summary", "Actions"],
      fields: [
        { id: "title", label: "Job Role / Title", type: "text", required: true },
        { id: "company", label: "Company / Organization", type: "text", required: true },
        { id: "duration", label: "Duration (e.g. 2024 - Present)", type: "text", required: true },
        { id: "desc", label: "Key Highlights", type: "textarea", required: true },
        { id: "images", label: "Company Logo", type: "file", multiple: false, required: false }
      ]
    },
    education: {
      title: "Education Manager",
      desc: "Manage academic records.",
      collection: "education",
      localKey: "veera_custom_education",
      columns: ["Banner", "Degree", "Institution", "Year", "Actions"],
      fields: [
        { id: "title", label: "Degree / Course Name", type: "text", required: true },
        { id: "institution", label: "College / University", type: "text", required: true },
        { id: "year", label: "Passing Year / Score", type: "text", required: true },
        { id: "desc", label: "Summary", type: "textarea", required: true },
        { id: "images", label: "Campus Banner", type: "file", multiple: false, required: false }
      ]
    },
    certificates: {
      title: "Certificates Manager",
      desc: "Manage credentials and certifications.",
      collection: "certificates",
      localKey: "veera_custom_certificates",
      columns: ["Certificate", "Title", "Issuer", "Issue Date", "Actions"],
      fields: [
        { id: "title", label: "Certificate Name", type: "text", required: true },
        { id: "issuer", label: "Issuing Authority", type: "text", required: true },
        { id: "date", label: "Issue Date", type: "text", required: true },
        { id: "desc", label: "Summary", type: "textarea", required: true },
        { id: "images", label: "Certificate Image", type: "file", multiple: false, required: false }
      ]
    },
    blog: {
      title: "Blog Manager",
      desc: "Manage articles and publications.",
      collection: "blog",
      localKey: "veera_custom_blog",
      columns: ["Banner", "Article Title", "Author / Date", "Summary", "Actions"],
      fields: [
        { id: "title", label: "Article Title", type: "text", required: true },
        { id: "author", label: "Author / Date Tag", type: "text", required: true },
        { id: "desc", label: "Article Content", type: "textarea", required: true },
        { id: "images", label: "Featured Article Banner", type: "file", multiple: false, required: false }
      ]
    },
    gallery: {
      title: "Gallery Manager",
      desc: "Manage photo showcase gallery.",
      collection: "gallery",
      localKey: "veera_custom_gallery",
      columns: ["Image", "Caption", "Category", "Actions"],
      fields: [
        { id: "title", label: "Image Caption", type: "text", required: true },
        { id: "category", label: "Category Tag", type: "text", required: true },
        { id: "images", label: "Upload Photos (Multiple)", type: "file", multiple: true, required: false }
      ]
    },
    messages: {
      title: "Messages Manager",
      desc: "View contact form inquiries.",
      collection: "messages",
      localKey: "veera_custom_messages",
      columns: ["Avatar", "Sender Name", "Email / Phone", "Message", "Actions"],
      fields: [
        { id: "title", label: "Sender Name", type: "text", required: true },
        { id: "email", label: "Email / Phone", type: "text", required: true },
        { id: "desc", label: "Message Body", type: "textarea", required: true }
      ]
    },
    settings: {
      title: "Settings Manager",
      desc: "Configure system profile info.",
      collection: "settings",
      localKey: "veera_custom_settings",
      columns: ["Avatar", "Profile Name", "Email", "Tagline", "Actions"],
      fields: [
        { id: "title", label: "Full Name", type: "text", required: true },
        { id: "email", label: "Contact Email", type: "email", required: true },
        { id: "desc", label: "Bio / Tagline", type: "textarea", required: true },
        { id: "images", label: "Profile Avatar", type: "file", multiple: false, required: false }
      ]
    }
  };

  // Switch Tabs
  sectionTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      sectionTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      activeSection = tab.dataset.target;
      renderTable();
    });
  });

  async function renderTable() {
    const config = configs[activeSection] || configs.projects;
    sectionTitle.innerText = config.title;
    sectionDesc.innerText = config.desc;

    tableHeadRow.innerHTML = config.columns.map(col => `<th>${col}</th>`).join("");
    tableBody.innerHTML = `<tr><td colspan="${config.columns.length}" style="text-align:center; padding: 20px; color: #94a3b8;"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</td></tr>`;

    try {
      const snapshot = await db.collection(config.collection).get();
      currentItems = [];
      snapshot.forEach(docSnap => currentItems.push({ id: docSnap.id, ...docSnap.data() }));

      if (currentItems.length === 0) {
        currentItems = JSON.parse(localStorage.getItem(config.localKey) || "[]");
      }
    } catch {
      currentItems = JSON.parse(localStorage.getItem(config.localKey) || "[]");
    }

    tableBody.innerHTML = "";

    if (currentItems.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="${config.columns.length}" style="text-align:center; padding: 20px; color: #94a3b8;">No entries found. Click "+ Add New Item" to create one.</td></tr>`;
      return;
    }

    currentItems.forEach((item) => {
      const tr = document.createElement("tr");
      const imgList = item.images || (item.imageUrl ? [item.imageUrl] : ["images/veera.png"]);
      const previewThumbs = imgList.slice(0, 3).map(src => `<img src="${src}" style="width:30px; height:30px; border-radius:6px; object-fit:cover; margin-right:3px;" onerror="this.src='images/veera.png';" />`).join("");

      let rowContent = `<td><div style="display:flex; align-items:center;">${previewThumbs} ${imgList.length > 3 ? `<span style="font-weight:700; color:#8b5cf6;">+${imgList.length - 3}</span>` : ''}</div></td>`;
      rowContent += `<td><strong>${item.title || "-"}</strong></td>`;

      if (item.category || item.company || item.percentage || item.institution || item.issuer || item.author || item.email) {
        rowContent += `<td><span class="badge-tag">${item.category || item.company || item.percentage || item.institution || item.issuer || item.author || item.email}</span></td>`;
      }
      if (item.duration || item.year || item.date) {
        rowContent += `<td>${item.duration || item.year || item.date}</td>`;
      }
      if (item.desc) {
        rowContent += `<td style="max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.desc}</td>`;
      }
      if (item.tech) {
        rowContent += `<td>${Array.isArray(item.tech) ? item.tech.join(", ") : item.tech}</td>`;
      }

      rowContent += `
        <td>
          <button type="button" class="btn-icon edit" data-id="${item.id}"><i class="fa-solid fa-pen"></i></button>
          <button type="button" class="btn-icon del" data-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
      tr.innerHTML = rowContent;
      tableBody.appendChild(tr);
    });

    document.querySelectorAll(".btn-icon.edit").forEach(b => {
      b.addEventListener("click", () => openEditModal(b.dataset.id));
    });
    document.querySelectorAll(".btn-icon.del").forEach(b => {
      b.addEventListener("click", () => deleteItem(b.dataset.id));
    });
  }

  function renderInputs(existing = null) {
    const config = configs[activeSection] || configs.projects;
    dynamicFormFields.innerHTML = "";

    config.fields.forEach(f => {
      const val = existing ? (existing[f.id] || "") : "";
      const div = document.createElement("div");
      div.className = "form-field";

      if (f.type === "textarea") {
        div.innerHTML = `<label>${f.label} *</label><textarea id="field_${f.id}" rows="4" required>${val}</textarea>`;
      } else if (f.type === "select") {
        const opts = f.options.map(o => `<option value="${o}" ${val === o ? "selected" : ""}>${o}</option>`).join("");
        div.innerHTML = `<label>${f.label} *</label><select id="field_${f.id}">${opts}</select>`;
      } else if (f.type === "file") {
        div.innerHTML = `<label>${f.label}</label><input type="file" id="field_${f.id}" accept="image/*" ${f.multiple ? 'multiple' : ''} />`;
      } else {
        div.innerHTML = `<label>${f.label} ${f.required ? "*" : ""}</label><input type="${f.type}" id="field_${f.id}" value="${val}" ${f.required ? "required" : ""} />`;
      }
      dynamicFormFields.appendChild(div);
    });
  }

  document.getElementById("openCreateModalBtn").addEventListener("click", () => {
    editItemId.value = "";
    modalTitle.innerHTML = `<i class="fa-solid fa-plus"></i> Add New ${activeSection.toUpperCase()}`;
    renderInputs();
    crudForm.reset();
    modal.classList.add("active");
  });

  function openEditModal(id) {
    const item = currentItems.find(i => i.id === id);
    if (!item) return;
    editItemId.value = item.id;
    modalTitle.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit ${activeSection.toUpperCase()}`;
    renderInputs(item);
    modal.classList.add("active");
  }

  async function deleteItem(id) {
    if (confirm("Delete this item permanently?")) {
      const config = configs[activeSection] || configs.projects;
      try {
        await db.collection(config.collection).doc(id).delete();
      } catch {}
      const localData = JSON.parse(localStorage.getItem(config.localKey) || "[]").filter(i => i.id !== id);
      localStorage.setItem(config.localKey, JSON.stringify(localData));
      renderTable();
    }
  }

  crudForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;
    }

    try {
      const config = configs[activeSection] || configs.projects;
      const docId = editItemId.value;
      const fileInput = document.getElementById("field_images");
      let newUploadedImages = [];

      if (fileInput && fileInput.files.length > 0) {
        newUploadedImages = await uploadMultiFiles(fileInput.files);
      }

      const entry = { updatedAt: new Date().toISOString() };

      config.fields.forEach(f => {
        if (f.type !== "file") {
          const elem = document.getElementById(`field_${f.id}`);
          if (elem) {
            if (f.id === "tech") {
              entry[f.id] = elem.value ? elem.value.split(",").map(t => t.trim()) : [];
            } else {
              entry[f.id] = elem.value.trim();
            }
          }
        }
      });

      if (newUploadedImages.length > 0) {
        entry.images = newUploadedImages;
        entry.imageUrl = newUploadedImages[0];
      } else if (docId) {
        const existing = currentItems.find(i => i.id === docId);
        if (existing) {
          entry.images = existing.images || [existing.imageUrl || "images/veera.png"];
          entry.imageUrl = entry.images[0];
        }
      } else {
        entry.images = ["images/veera.png"];
        entry.imageUrl = "images/veera.png";
      }

      try {
        if (docId) {
          await db.collection(config.collection).doc(docId).set(entry, { merge: true });
        } else {
          entry.createdAt = new Date().toISOString();
          const newDoc = await db.collection(config.collection).add(entry);
          entry.id = newDoc.id;
        }
      } catch {}

      const localData = JSON.parse(localStorage.getItem(config.localKey) || "[]");
      if (docId) {
        const idx = localData.findIndex(i => i.id === docId);
        if (idx !== -1) localData[idx] = { ...localData[idx], ...entry };
      } else {
        entry.id = entry.id || "item_" + Date.now();
        localData.unshift(entry);
      }
      localStorage.setItem(config.localKey, JSON.stringify(localData));

      modal.classList.remove("active");
      renderTable();
      alert("✅ Item successfully saved & published!");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> <span>Save & Publish</span>`;
      }
    }
  });

  document.getElementById("closeModalBtn").addEventListener("click", () => modal.classList.remove("active"));
  
  const logoutBtn = document.getElementById("adminLogoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (confirm("Logout from admin portal?")) {
        sessionStorage.clear();
        window.location.replace("index.html");
      }
    });
  }

  renderTable();
});