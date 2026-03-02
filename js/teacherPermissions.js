import { getData, putData } from "./core/api.js";

/* ===============================
   DOM ELEMENTS
================================ */
const permissionList = document.getElementById("todayPermissionList");
const permissionCount = document.getElementById("permissionCount");
const filterContainer = document.getElementById("permissionFilter");

const detailModal = document.getElementById("permissionDetailModal");
const detailContent = document.getElementById("detailContent");
const closeDetailModal = document.getElementById("closeDetailModal");

/* ===============================
   STATE
================================ */
let permissions = [];
let activeFilter = "all";

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", init);

async function init() {
  setupFilter();
  setupModal();
  await fetchPermissions();
}

/* ===============================
   FETCH ALL PERMISSIONS
================================ */
async function fetchPermissions() {
  try {
    showLoading();

    const response = await getData("api/admin/teacher-permissions");

    permissions = response.data || [];

    // Sort terbaru di atas
    permissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    renderPermissions();
  } catch (error) {
    showError(error.message);
  }
}

/* ===============================
   RENDER
================================ */
function renderPermissions() {
  permissionList.innerHTML = "";

  let filtered = permissions;

  if (activeFilter !== "all") {
    filtered = permissions.filter((item) => item.status === activeFilter);
  }

  permissionCount.textContent = `${filtered.length} Izin`;

  if (filtered.length === 0) {
    permissionList.innerHTML = `
      <div class="text-sm text-gray-400 italic">
        Tidak ada data izin
      </div>
    `;
    return;
  }

  filtered.forEach((item) => {
    const card = document.createElement("div");
    card.className = `
  bg-white/90 
  backdrop-blur-sm
  p-5 
  rounded-2xl 
  shadow-sm 
  hover:shadow-md 
  transition-all 
  duration-300 
  space-y-3
`;

    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <h4 class="font-semibold text-[#1E3A5F] capitalize">
            ${item.teacher?.name || "-"}
          </h4>
          <p class="text-xs text-gray-400">
            NIP ${item.teacher?.nip || "-"} • ${formatDate(item.date)}
          </p>
        </div>

        ${renderStatusBadge(item.status)}
      </div>

      <p class="text-sm text-gray-600 line-clamp-2">
        ${item.letter}
      </p>

      <div class="flex gap-2 pt-2 flex-wrap">
        <button 
          class="detail-btn 
text-xs 
px-3 py-1.5 
rounded-lg 
bg-[#1E3A5F]/10 
text-[#1E3A5F] 
hover:bg-[#1E3A5F] 
hover:text-white 
transition-all 
duration-200"
          data-id="${item.id}"
        >
          Detail
        </button>

        ${
          item.status === "pending"
            ? `
          <button 
            class="approve-btn text-xs px-3 py-1 rounded-lg bg-green-500 text-white hover:bg-green-600 transition"
            data-id="${item.id}"
          >
            Setujui
          </button>

          <button 
            class="reject-btn text-xs px-3 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
            data-id="${item.id}"
          >
            Tolak
          </button>
        `
            : ""
        }
      </div>
    `;

    permissionList.appendChild(card);
  });

  attachCardEvents();
}

/* ===============================
   EVENTS
================================ */
function attachCardEvents() {
  document.querySelectorAll(".detail-btn").forEach((btn) => {
    btn.addEventListener("click", handleDetail);
  });

  document.querySelectorAll(".approve-btn").forEach((btn) => {
    btn.addEventListener("click", handleApprove);
  });

  document.querySelectorAll(".reject-btn").forEach((btn) => {
    btn.addEventListener("click", handleReject);
  });
}

/* ===============================
   APPROVE
================================ */
async function handleApprove(e) {
  const id = e.target.closest("[data-id]").dataset.id;

  const confirm = await Swal.fire({
    title: "Setujui izin?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, setujui",
  });

  if (!confirm.isConfirmed) return;

  try {
    await putData(`api/admin/teacher-permissions/${id}/approve`);

    updateLocalStatus(id, "approved");

    Swal.fire("Berhasil!", "Izin disetujui.", "success");
  } catch (error) {
    showError(error.message);
  }
}

/* ===============================
   REJECT
================================ */
async function handleReject(e) {
  const id = e.target.closest("[data-id]").dataset.id;

  const confirm = await Swal.fire({
    title: "Tolak izin?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, tolak",
  });

  if (!confirm.isConfirmed) return;

  try {
    await putData(`api/admin/teacher-permissions/${id}/reject`);

    updateLocalStatus(id, "rejected");

    Swal.fire("Berhasil!", "Izin ditolak.", "success");
  } catch (error) {
    showError(error.message);
  }
}

/* ===============================
   UPDATE LOCAL STATE
================================ */
function updateLocalStatus(id, newStatus) {
  const index = permissions.findIndex((p) => p.id == id);
  if (index !== -1) {
    permissions[index].status = newStatus;
    renderPermissions();
  }
}

/* ===============================
   DETAIL MODAL
================================ */
async function handleDetail(e) {
  const id = e.target.closest("[data-id]").dataset.id;

  try {
    const data = await getData(`api/admin/teacher-permissions/${id}`);

    detailContent.innerHTML = `
      <p><strong>Nama:</strong> ${data.teacher.name}</p>
      <p><strong>NIP:</strong> ${data.teacher.nip}</p>
      <p><strong>Tanggal:</strong> ${formatDate(data.date)}</p>
      <p><strong>Alasan:</strong> ${data.reason}</p>
      <p><strong>Surat:</strong> ${data.letter}</p>
      <p><strong>Status:</strong> ${data.status}</p>
    `;

    detailModal.showModal();
  } catch (error) {
    showError(error.message);
  }
}

function setupModal() {
  closeDetailModal.addEventListener("click", () => {
    detailModal.close();
  });
}

/* ===============================
   FILTER
================================ */
function setupFilter() {
  filterContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;

    activeFilter = btn.dataset.filter;

    document
      .querySelectorAll(".filter-btn")
      .forEach((b) => b.classList.remove("bg-[#1E3A5F]", "text-white"));

    btn.classList.add("bg-[#1E3A5F]", "text-white");

    renderPermissions();
  });
}

/* ===============================
   UTILITIES
================================ */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function renderStatusBadge(status) {
  switch (status) {
    case "approved":
      return `<span class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
        Disetujui
      </span>`;

    case "rejected":
      return `<span class="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
        Ditolak
      </span>`;

    default:
      return `<span class="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
        Menunggu
      </span>`;
  }
}

function showLoading() {
  permissionList.innerHTML =
    '<div class="text-sm text-gray-500">Memuat data...</div>';
}

function showError(message) {
  Swal.fire("Error", message, "error");
}
