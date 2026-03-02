import { getData, postData, putData, deleteData } from "./core/api.js";

const tableBody = document.getElementById("lessonTimeTableBody");
const btnAddLessonTime = document.getElementById("btnAddLessonTime");

let lessonTimes = [];
let editId = null;

// =============================
// INIT
// =============================
document.addEventListener("DOMContentLoaded", loadLessonTimes);

// =============================
// FETCH
// =============================
async function loadLessonTimes() {
  try {
    lessonTimes = await getData("api/admin/lesson-times");

    // SORT berdasarkan order
    // SORT berdasarkan jam mulai (paling pagi → paling akhir)
    lessonTimes.sort((a, b) => a.start_time.localeCompare(b.start_time));

    renderTable();
  } catch (error) {
    Swal.fire("Error", error.message, "error");
  }
}

// =============================
// FORMAT TIME
// =============================
function formatTime(time) {
  return time.slice(0, 5);
}

// =============================
// RENDER TABLE
// =============================
function renderTable() {
  tableBody.innerHTML = "";

  lessonTimes.forEach((item, index) => {
    tableBody.innerHTML += `
      <tr>
        <td class="px-6 py-4">${index + 1}</td>
        <td class="px-6 py-4 font-medium">${item.name}</td>
        <td class="px-6 py-4">
          ${formatTime(item.start_time)} - ${formatTime(item.end_time)}
        </td>
        <td class="px-6 py-4 text-center">
          <div class="flex justify-center gap-3">
            <button 
              onclick="editLessonTime(${item.id})"
              class="text-blue-600 hover:text-blue-800 transition"
            >
              <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>

            <button 
              onclick="deleteLessonTime(${item.id})"
              class="text-red-600 hover:text-red-800 transition"
            >
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  lucide.createIcons();
}

// =============================
// OPEN MODAL
// =============================
function openModal(data = null) {
  Swal.fire({
    title: editId ? "Edit Jam Mapel" : "Tambah Jam Mapel",
    html: `
      <div class="space-y-3 text-left">
        <input id="swal-order" type="number"
          class="w-full p-2.5 border rounded-lg"
          placeholder="Urutan Jam"
          value="${data?.order || ""}"
        >

        <input id="swal-name"
          class="w-full p-2.5 border rounded-lg"
          placeholder="Nama (Jam 1 / Istirahat)"
          value="${data?.name || ""}"
        >

        <input id="swal-start" type="time"
          class="w-full p-2.5 border rounded-lg"
          value="${data ? formatTime(data.start_time) : ""}"
        >

        <input id="swal-end" type="time"
          class="w-full p-2.5 border rounded-lg"
          value="${data ? formatTime(data.end_time) : ""}"
        >

        <select id="swal-type"
          class="w-full p-2.5 border rounded-lg bg-white">
          <option value="lesson" ${data?.type === "lesson" ? "selected" : ""}>Lesson</option>
          <option value="break" ${data?.type === "break" ? "selected" : ""}>Break</option>
        </select>
      </div>
    `,
    focusConfirm: false,
    preConfirm: () => {
      const order = document.getElementById("swal-order").value;
      const name = document.getElementById("swal-name").value;
      const start = document.getElementById("swal-start").value;
      const end = document.getElementById("swal-end").value;
      const type = document.getElementById("swal-type").value;

      if (!order || !name || !start || !end) {
        Swal.showValidationMessage("Semua field wajib diisi");
        return false;
      }

      if (end <= start) {
        Swal.showValidationMessage(
          "Waktu selesai harus lebih besar dari waktu mulai",
        );
        return false;
      }

      return {
        order: Number(order),
        name,
        start_time: start + ":00",
        end_time: end + ":00",
        type,
      };
    },
  }).then(async (result) => {
    if (!result.isConfirmed) return;

    try {
      if (editId) {
        await putData(`api/admin/lesson-times/${editId}`, result.value);
        Swal.fire("Berhasil", "Jam berhasil diperbarui", "success");
      } else {
        await postData("api/admin/lesson-times", result.value);
        Swal.fire("Berhasil", "Jam berhasil ditambahkan", "success");
      }

      editId = null;
      loadLessonTimes();
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    }
  });
}

// =============================
// ADD
// =============================
btnAddLessonTime.addEventListener("click", () => {
  editId = null;
  openModal();
});

// =============================
// EDIT
// =============================
window.editLessonTime = function (id) {
  const data = lessonTimes.find((x) => x.id === id);
  editId = id;
  openModal(data);
};

// =============================
// DELETE
// =============================
window.deleteLessonTime = async function (id) {
  const confirm = await Swal.fire({
    title: "Yakin?",
    text: "Data akan dihapus permanen",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, hapus",
  });

  if (!confirm.isConfirmed) return;

  try {
    await deleteData(`api/admin/lesson-times/${id}`);
    Swal.fire("Berhasil", "Jam berhasil dihapus", "success");
    loadLessonTimes();
  } catch (error) {
    Swal.fire("Error", error.message, "error");
  }
};
