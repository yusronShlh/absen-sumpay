export function initNavbar() {
  const toggle = document.getElementById("navbarToggle");
  const closeBtn = document.getElementById("closeMobileMenu");

  const mobileMenu = document.getElementById("mobileMenu");
  const overlay = document.getElementById("mobileOverlay");

  const icon = document.getElementById("menuIcon");

  function openMenu() {
    mobileMenu.classList.remove("translate-x-full");
    mobileMenu.classList.add("translate-x-0");

    overlay.classList.remove("hidden");

    icon.setAttribute("data-lucide", "x");

    lucide.createIcons();
  }

  function closeMenu() {
    mobileMenu.classList.add("translate-x-full");
    mobileMenu.classList.remove("translate-x-0");

    overlay.classList.add("hidden");

    icon.setAttribute("data-lucide", "menu");

    lucide.createIcons();
  }

  if (toggle) {
    toggle.addEventListener("click", () => {
      const isOpen = !mobileMenu.classList.contains("translate-x-full");

      isOpen ? closeMenu() : openMenu();
    });
  }

  closeBtn?.addEventListener("click", closeMenu);

  overlay?.addEventListener("click", closeMenu);

  // nama guru

  const user = JSON.parse(localStorage.getItem("user"));

  const name = document.getElementById("navbarTeacherName");

  if (user && name) {
    name.textContent = user.name;
  }

  lucide.createIcons();
}
