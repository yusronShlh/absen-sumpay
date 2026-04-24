import { getData, postData, putData, deleteData } from "./core/api.js";

const tableBody = document.getElementById("tableSemesterBody");

const modal = document.getElementById("semesterModal");
const btnAdd = document.getElementById("btnAddSemester");
const btnClose = document.getElementById("closeModal");
const btnCancel = document.getElementById("btnCancel");
const btnSave = document.getElementById("btnSave");

const modalTitle = document.getElementById("modalTitle");

// form
const semesterId = document.getElementById("semesterId");
const academicYear = document.getElementById("academicYear");
const semesterType = document.getElementById("semesterType");
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");

document.addEventListener("DOMContentLoaded", async () => {
  await loadSemesters();
  await loadTypes();
});

// ================= LOAD TABLE =================
async function loadSemesters() {
  try {
    const res = await getData("api/admin/semesters");

    tableBody.innerHTML = "";

    res.data.forEach((item, index) => {
      tableBody.innerHTML += `
        <tr>
          <td class="px-3 md:px-6 py-3 md:py-4 w-16 text-center">${index + 1}</td>
          <td class="px-3 md:px-6 py-3 md:py-4 w-48 text-left">${item.academic_year}</td>
          <td class="px-3 md:px-6 py-3 md:py-4 text-center capitalize">${item.type}</td>
          <td class="px-3 md:px-6 py-3 md:py-4 text-center">${formatDate(item.start_date)}</td>
          <td class="px-3 md:px-6 py-3 md:py-4 text-center">${formatDate(item.end_date)}</td>
          <td class="px-3 md:px-6 py-3 md:py-4 text-center space-x-2">
            <button onclick="editSemester(${item.id})" class="text-blue-600">
              <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteSemester(${item.id})" class="text-red-600">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </td>
        </tr>
      `;
    });

    // 🔥 WAJIB
    lucide.createIcons();
  } catch (err) {
    Swal.fire("Error", err.message, "error");
  }
}

// ================= LOAD TYPE =================
async function loadTypes() {
  const res = await getData("api/admin/semesters/types");

  semesterType.innerHTML = `<option value="">Pilih semester</option>`;

  res.data.forEach((t) => {
    semesterType.innerHTML += `
      <option value="${t.value}">${t.label}</option>
    `;
  });
}

// ================= MODAL CONTROL =================
btnAdd.onclick = () => openModal();

btnClose.onclick = closeModal;
btnCancel.onclick = closeModal;

function openModal(data = null) {
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  if (data) {
    modalTitle.innerText = "Edit Semester";

    semesterId.value = data.id;
    academicYear.value = data.academic_year;
    semesterType.value = data.type;
    startDate.value = data.start_date;
    endDate.value = data.end_date;
  } else {
    modalTitle.innerText = "Tambah Semester";

    semesterId.value = "";
    academicYear.value = "";
    semesterType.value = "";
    startDate.value = "";
    endDate.value = "";
  }
}

function closeModal() {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

// ================= SAVE =================
btnSave.onclick = async () => {
  const payload = {
    academic_year: academicYear.value,
    type: semesterType.value,
    start_date: startDate.value,
    end_date: endDate.value,
  };

  try {
    if (semesterId.value) {
      await putData(`api/admin/semesters/${semesterId.value}`, payload);
      Swal.fire("Berhasil", "Data diupdate", "success");
    } else {
      await postData("api/admin/semesters", payload);
      Swal.fire("Berhasil", "Data ditambahkan", "success");
    }

    closeModal();
    loadSemesters();
  } catch (err) {
    Swal.fire("Error", err.message, "error");
  }
};

// ================= EDIT =================
window.editSemester = async (id) => {
  const res = await getData("api/admin/semesters");

  const data = res.data.find((x) => x.id === id);

  openModal(data);
};

// ================= DELETE =================
let isDeleting = false;

window.deleteSemester = async (id) => {
  if (isDeleting) return;
  isDeleting = true;

  try {
    const confirm = await Swal.fire({
      title: "Yakin?",
      text: "Data akan dihapus",
      icon: "warning",
      showCancelButton: true,
    });

    if (!confirm.isConfirmed) {
      isDeleting = false;
      return;
    }

    Swal.fire({
      title: "Menghapus...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    await deleteData(`api/admin/semesters/${id}`);

    Swal.fire("Berhasil", "Data dihapus", "success");

    await loadSemesters();
  } catch (err) {
    Swal.fire("Error", err.message, "error");
  } finally {
    isDeleting = false;
  }
};

// ================= HELPER =================
function formatDate(date) {
  return new Date(date).toLocaleDateString("id-ID");
}
