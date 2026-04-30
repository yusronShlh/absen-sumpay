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
   FETCH
================================ */
async function fetchPermissions() {
  try {
    showLoading();

    const response = await getData("api/admin/teacher-permissions");

    permissions = response.data || [];

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
    const dateRange = formatDateRange(item.start_date, item.end_date);

    const card = document.createElement("div");
    card.className = `
      bg-white/90 backdrop-blur-sm p-5 rounded-2xl shadow-sm 
      hover:shadow-md transition-all duration-300 space-y-3
    `;

    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <h4 class="font-semibold text-[#1E3A5F] capitalize">
            ${item.teacher?.name || "-"}
          </h4>
          <p class="text-xs text-gray-400">
            NIP ${item.teacher?.nip || "-"} • ${dateRange}
          </p>
        </div>

        ${renderStatusBadge(item.status)}
      </div>

      <p class="text-sm text-gray-600 line-clamp-2">
        ${
          item.reason
            ? item.reason
            : "<span class='italic text-gray-400'>Tidak ada surat</span>"
        }
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
   APPROVE / REJECT
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
   UPDATE STATE
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

    const dateRange = formatDateRange(data.start_date, data.end_date);

    detailContent.innerHTML = `
      <p><strong>Nama:</strong> ${data.teacher?.name || "-"}</p>
      <p><strong>NIP:</strong> ${data.teacher?.nip || "-"}</p>
      <p><strong>Tanggal:</strong> ${dateRange}</p>
      <p><strong>Alasan:</strong> ${data.reason || "-"}</p>
      
      <div>
    <p><strong>File pendukung:</strong></p>
    ${
      data.letter
        ? `<img 
            src="${data.letter}" 
            alt="Bukti surat" 
            class="mt-2 max-h-60 rounded-lg border shadow-sm object-contain"
          />`
        : `<span class="italic text-gray-400">Tidak ada file pendukung</span>`
    }
  </div>

      <div class="mt-3">
        <p class="font-semibold mb-1">Jadwal Terdampak:</p>
        <ul class="list-disc ml-5 text-sm">
          ${
            data.details?.length
              ? data.details
                  .map(
                    (d) => `
              <li>
                ${d.Schedule?.Subject?.name || "-"} 
                (${d.Schedule?.LessonTime?.start_time || "-"} - 
                ${d.Schedule?.LessonTime?.end_time || "-"})
              </li>
            `,
                  )
                  .join("")
              : "<li>-</li>"
          }
        </ul>
      </div>
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
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateRange(start, end) {
  if (!start) return "-";

  if (start === end) {
    return formatDate(start);
  }

  return `${formatDate(start)} - ${formatDate(end)}`;
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
