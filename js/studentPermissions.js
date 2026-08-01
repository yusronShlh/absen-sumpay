import { getData, putData } from "./core/api.js";

/* ==============================
   DOM ELEMENTS
============================== */
const permissionListEl = document.getElementById("todayPermissionList");
const filterContainer = document.getElementById("permissionFilter");
const permissionCountEl = document.getElementById("permissionCount");

const detailModal = document.getElementById("permissionDetailModal");
const detailContent = document.getElementById("detailContent");
const closeDetailModalBtn = document.getElementById("closeDetailModal");

/* ==============================
   STATE
============================== */
let permissions = [];
let currentFilter = "all";

/* ==============================
   INIT
============================== */
document.addEventListener("DOMContentLoaded", () => {
  loadPermissions();
  initFilter();
  initModal();
});

/* ==============================
   FETCH DATA
============================== */
async function loadPermissions() {
  try {
    permissionListEl.innerHTML = `
      <div class="text-sm text-gray-400 italic">
        Memuat data...
      </div>
    `;

    const response = await getData("api/admin/student-permissions");

    const grouped = response.data || {};

    permissions = [
      ...(grouped.pending || []).map((item) => ({
        ...item,
        category: "pending",
      })),

      ...(grouped.active || []).map((item) => ({
        ...item,
        category: "active",
      })),

      ...(grouped.recent || []).map((item) => ({
        ...item,
        category: "recent",
      })),
    ];
    renderPermissions();
  } catch (error) {
    showError(error.message);
  }
}

/* ==============================
   RENDER
============================== */
function renderPermissions() {
  permissionListEl.innerHTML = "";

  const filtered = getFilteredPermissions();
  permissionCountEl.textContent = `${filtered.length} Izin`;

  if (filtered.length === 0) {
    permissionListEl.innerHTML = `
      <div class="text-sm text-gray-400 italic">
        Tidak ada data izin
      </div>
    `;
    return;
  }

  filtered.forEach((item) => {
    const card = document.createElement("div");
    card.className = `
      bg-white/90 backdrop-blur-sm p-5 rounded-2xl 
      shadow-sm hover:shadow-md transition-all duration-300 space-y-3
    `;

    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <h4 class="font-semibold text-[#1E3A5F]">
            ${item.Student?.User?.name || "-"}
          </h4>
          <p class="text-xs text-gray-400">
            Kelas ${item.Student?.Class?.name || "-"} • 
            ${formatDate(item.start_date)}
          </p>
        </div>

        ${renderStatusBadge(item)}
      </div>

      <p class="text-sm text-gray-600 line-clamp-2">
        ${item.reason || "-"}
      </p>

      <div class="flex gap-2 pt-2 flex-wrap">
        <button 
          class="detail-btn text-xs px-3 py-1.5 rounded-lg 
          bg-[#1E3A5F]/10 text-[#1E3A5F] 
          hover:bg-[#1E3A5F] hover:text-white transition"
          data-id="${item.id}"
        >
          Detail
        </button>

        ${
          item.status === "pending"
            ? `
          <button 
            class="approve-btn text-xs px-3 py-1 rounded-lg 
            bg-green-500 text-white hover:bg-green-600 transition"
            data-id="${item.id}"
          >
            Setujui
          </button>

          <button 
            class="reject-btn text-xs px-3 py-1 rounded-lg 
            bg-red-500 text-white hover:bg-red-600 transition"
            data-id="${item.id}"
          >
            Tolak
          </button>
        `
            : ""
        }
      </div>
    `;

    permissionListEl.appendChild(card);
  });

  attachActionEvents();
}

/* ==============================
   FILTER
============================== */
function initFilter() {
  filterContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;

    document
      .querySelectorAll(".filter-btn")
      .forEach((b) => b.classList.remove("bg-[#1E3A5F]", "text-white"));

    btn.classList.add("bg-[#1E3A5F]", "text-white");

    currentFilter = btn.dataset.filter;
    renderPermissions();
  });
}

function getFilteredPermissions() {
  if (currentFilter === "all") {
    return permissions;
  }

  return permissions.filter((item) => item.category === currentFilter);
}

/* ==============================
   ACTION EVENTS
============================== */
function attachActionEvents() {
  document.querySelectorAll(".detail-btn").forEach((btn) => {
    btn.addEventListener("click", () => openDetail(btn.dataset.id));
  });

  document.querySelectorAll(".approve-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleApprove(btn.dataset.id));
  });

  document.querySelectorAll(".reject-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleReject(btn.dataset.id));
  });
}

/* ==============================
   DETAIL MODAL
============================== */
async function openDetail(id) {
  try {
    showLoading();

    const data = await getData(`api/admin/student-permissions/${id}`);

    detailContent.innerHTML = `
      <div><strong>Nama:</strong> ${data.Student?.User?.name || "-"}</div>
      <div><strong>NISN:</strong> ${data.Student?.User?.nisn || "-"}</div>
      <div><strong>Kelas:</strong> ${data.Student?.Class?.name || "-"}</div>
      <div><strong>Dari:</strong> ${formatDate(data.start_date)}</div>
      <div><strong>Sampai:</strong> ${formatDate(data.end_date)}</div>
      <div><strong>Alasan:</strong> ${data.reason || "-"}</div>

      <div>
    <p><strong>File pendukung izin:</strong></p>
    ${
      data.letter
        ? `<img 
            src="${data.letter}" 
            alt="Bukti surat" 
            class="mt-2 max-h-60 rounded-lg border shadow-sm object-contain"
          />`
        : `<span class="italic text-gray-400">Tidak ada file pendukung izin</span>`
    }
  </div>

      <div><strong>Status:</strong> ${capitalize(data.status)}</div>
    `;

    detailModal.showModal();
    Swal.close();
  } catch (error) {
    showError(error.message);
  }
}

/* ==============================
   MODAL
============================== */
function initModal() {
  closeDetailModalBtn.addEventListener("click", () => {
    detailModal.close();
  });
}

/* ==============================
   APPROVE / REJECT
============================== */
async function handleApprove(id) {
  const confirm = await Swal.fire({
    title: "Setujui izin?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Setujui",
  });

  if (!confirm.isConfirmed) return;

  try {
    showLoading();

    const res = await putData(`api/admin/student-permissions/${id}/approve`);

    Swal.fire("Berhasil", res.message || "Disetujui", "success");

    await loadPermissions();
  } catch (error) {
    showError(error.message);
  }
}

async function handleReject(id) {
  const confirm = await Swal.fire({
    title: "Tolak izin?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Tolak",
  });

  if (!confirm.isConfirmed) return;

  try {
    showLoading();

    const res = await putData(`api/admin/student-permissions/${id}/reject`);

    Swal.fire("Berhasil", res.message || "Ditolak", "success");

    await loadPermissions();
  } catch (error) {
    showError(error.message);
  }
}

/* ==============================
   UTILITIES
============================== */
function renderStatusBadge(item) {
  const config = {
    pending: {
      text: "Menunggu",
      class: "bg-yellow-100 text-yellow-700",
    },

    active: {
      text: "Aktif",
      class: "bg-green-100 text-green-700",
    },

    recent: {
      text: "7 Hari Terakhir",
      class: "bg-blue-100 text-blue-700",
    },
  };

  const badge = config[item.category] || {
    text: capitalize(item.status),
    class: "bg-gray-100 text-gray-600",
  };

  return `
    <span class="text-xs px-2 py-1 rounded-full ${badge.class}">
      ${badge.text}
    </span>
  `;
}
function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function capitalize(text = "") {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* ==============================
   ALERT
============================== */
function showLoading() {
  Swal.fire({
    title: "Memuat...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });
}

function showError(message) {
  Swal.fire("Error", message, "error");
}
