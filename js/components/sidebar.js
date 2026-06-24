import { logout } from "../auth/logout.js";
import { getData } from "../core/api.js";
import { initAdminProfile } from "../adminProfile.js";

export async function loadSidebar() {
  const container = document.getElementById("sidebar-container");

  try {
    const response = await fetch("../../components/sidebar.pratial.html");

    if (!response.ok) {
      throw new Error("Sidebar gagal dimuat");
    }

    container.innerHTML = await response.text();

    await loadAdminProfileModal();

    if (window.lucide) {
      window.lucide.createIcons();
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        window.lucide?.createIcons();
      });
    }
    initSidebar();
  } catch (error) {
    console.error(error);
  }
}

function initSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  window.toggleSidebar = function () {
    sidebar.classList.toggle("-translate-x-full");
    overlay.classList.toggle("hidden");
  };

  // =========================
  // REPORT MENU
  // =========================

  const reportBtn = document.getElementById("reportMenuBtn");
  const reportSubmenu = document.getElementById("reportSubmenu");
  const reportChevron = document.getElementById("reportChevron");

  reportBtn?.addEventListener("click", () => {
    const isClosed = reportSubmenu.classList.contains("max-h-0");

    if (isClosed) {
      openReportMenu(reportSubmenu, reportChevron);
    } else {
      closeReportMenu(reportSubmenu, reportChevron);
    }
  });

  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn?.addEventListener("click", () => {
    Swal.fire({
      title: "Logout?",
      text: "Anda akan keluar dari sistem",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, logout",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
      }
    });
  });

  loadPermissionBadge();

  setActiveMenu();

  autoOpenReportMenu();

  initAdminProfile();
}

// =========================
// OPEN REPORT
// =========================

function openReportMenu(submenu, chevron) {
  submenu.classList.remove("max-h-0");
  submenu.classList.add("max-h-40");

  chevron.classList.add("rotate-90");
}

// =========================
// CLOSE REPORT
// =========================

function closeReportMenu(submenu, chevron) {
  submenu.classList.add("max-h-0");
  submenu.classList.remove("max-h-40");

  chevron.classList.remove("rotate-90");
}

// =========================
// ACTIVE MENU
// =========================

function setActiveMenu() {
  const page = location.pathname.split("/").pop().replace(".html", "");

  document.querySelectorAll(".sidebar-link").forEach((link) => {
    link.classList.remove("bg-white", "shadow");

    if (link.dataset.page === page) {
      link.classList.add("bg-white", "shadow");
    }
  });
}

// =========================
// AUTO OPEN REPORT
// =========================

function autoOpenReportMenu() {
  const page = location.pathname.split("/").pop().replace(".html", "");

  const reportPages = ["teacherAttendanceReport", "studentAttendanceReport"];

  if (reportPages.includes(page)) {
    const submenu = document.getElementById("reportSubmenu");

    const chevron = document.getElementById("reportChevron");

    openReportMenu(submenu, chevron);
  }
}

async function loadPermissionBadge() {
  console.log("load badge jalan");
  try {
    const [teacherResponse, studentResponse] = await Promise.all([
      getData("api/admin/teacher-permissions"),
      getData("api/admin/student-permissions"),
    ]);

    const teacherPending = teacherResponse.data.filter(
      (item) => item.status === "pending",
    ).length;

    const studentPending = studentResponse.data.filter(
      (item) => item.status === "pending",
    ).length;

    updateBadge("teacherPermissionBadge", teacherPending);

    updateBadge("studentPermissionBadge", studentPending);
  } catch (error) {
    console.error("Gagal load badge permission", error);
  }
}

function updateBadge(id, count) {
  const badge = document.getElementById(id);

  if (!badge) return;

  if (count > 0) {
    badge.textContent = count;

    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

async function loadAdminProfileModal() {
  const res = await fetch("../../components/adminProfile.modal.html");

  document.body.insertAdjacentHTML("beforeend", await res.text());
}
