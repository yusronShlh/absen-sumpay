export async function loadSidebar() {
  const container = document.getElementById("sidebar-container");

  try {
    const response = await fetch("../../components/sidebar.pratial.html");

    if (!response.ok) {
      throw new Error("Sidebar gagal dimuat");
    }

    container.innerHTML = await response.text();

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
      reportSubmenu.classList.remove("max-h-0");
      reportSubmenu.classList.add("max-h-40");

      reportChevron.classList.add("rotate-90");
    } else {
      reportSubmenu.classList.add("max-h-0");
      reportSubmenu.classList.remove("max-h-40");

      reportChevron.classList.remove("rotate-90");
    }
  });

  setActiveMenu();
}

function setActiveMenu() {
  const page = location.pathname.split("/").pop().replace(".html", "");

  document.querySelectorAll(".sidebar-link").forEach((link) => {
    link.classList.remove("bg-white", "shadow");

    if (link.dataset.page === page) {
      link.classList.add("bg-white", "shadow");
    }
  });
}
