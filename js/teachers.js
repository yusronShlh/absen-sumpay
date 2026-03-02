import { getData, postData, putData, deleteData } from "./core/api.js";

const tableBody = document.getElementById("teacherTableBody");
const modal = document.getElementById("teacherModal");
const form = document.getElementById("teacherForm");
const btnAdd = document.getElementById("btnAddTeachers");
const btnClose = document.getElementById("btnCloseModal");
const modalTitle = document.getElementById("modalTitle");

let isEditMode = false;
let currentTeacherId = null;

// =============================
// MODAL CONTROL
// =============================
function openModal() {
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeModal() {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  form.reset();
  isEditMode = false;
  currentTeacherId = null;
  modalTitle.textContent = "Tambah Guru";
  document.getElementById("password").required = false;
}

btnAdd.addEventListener("click", () => {
  isEditMode = false;
  modalTitle.textContent = "Tambah Guru";
  document.getElementById("password").required = true;
  openModal();
});

btnClose.addEventListener("click", closeModal);

// =============================
// FETCH
// =============================
async function fetchTeachers() {
  try {
    const response = await getData("api/admin/teachers");
    renderTable(response.teachers);
  } catch (error) {
    Swal.fire("Error", error.message, "error");
  }
}

// =============================
// RENDER
// =============================
function renderTable(teachers) {
  tableBody.innerHTML = "";

  teachers.forEach((teacher, index) => {
    tableBody.innerHTML += `
      <tr>
        <td class="px-6 py-4">${index + 1}</td>
        <td class="px-6 py-4">${teacher.name}</td>
        <td class="px-6 py-4">${teacher.nip}</td>
        <td class="px-6 py-4 text-center">
          <div class="flex justify-center gap-2">
            <button 
              class="p-2 rounded-lg hover:bg-blue-50 text-blue-600 btn-edit"
              data-id="${teacher.id}"
              data-name="${teacher.name}"
              data-nip="${teacher.nip}"
            >
              <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>

            <button
              class="p-2 rounded-lg hover:bg-red-50 text-red-600 btn-delete"
              data-id="${teacher.id}"
              data-name="${teacher.name}"
            >
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  document
    .querySelectorAll(".btn-edit")
    .forEach((btn) => btn.addEventListener("click", handleEdit));

  document
    .querySelectorAll(".btn-delete")
    .forEach((btn) => btn.addEventListener("click", handleDelete));

  if (window.lucide) window.lucide.createIcons();
}

// =============================
// HANDLE EDIT
// =============================
function handleEdit(e) {
  const button = e.currentTarget;

  isEditMode = true;
  currentTeacherId = button.dataset.id;

  modalTitle.textContent = "Edit Guru";

  document.getElementById("name").value = button.dataset.name;
  document.getElementById("nip").value = button.dataset.nip;

  document.getElementById("password").required = false;

  openModal();
}

// =============================
// HANDLE DELETE
// =============================
async function handleDelete(e) {
  const button = e.currentTarget;
  const id = button.dataset.id;
  const name = button.dataset.name;

  const confirm = await Swal.fire({
    title: "Yakin hapus?",
    text: `Guru ${name} akan dihapus`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, hapus",
  });

  if (!confirm.isConfirmed) return;

  try {
    await deleteData(`api/admin/teachers/${id}`);
    Swal.fire("Berhasil", "Guru berhasil dihapus", "success");
    fetchTeachers();
  } catch (error) {
    Swal.fire("Error", error.message, "error");
  }
}

// =============================
// SUBMIT
// =============================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const nip = document.getElementById("nip").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!name || !nip) {
    Swal.fire("Error", "Nama dan NIP wajib diisi", "error");
    return;
  }

  const payload = { name, nip };

  if (password) payload.password = password;

  try {
    if (isEditMode) {
      await putData(`api/admin/teachers/${currentTeacherId}`, payload);
      Swal.fire("Berhasil", "Guru berhasil diperbarui", "success");
    } else {
      if (!password) {
        Swal.fire("Error", "Password wajib diisi", "error");
        return;
      }
      await postData("api/admin/teachers", payload);
      Swal.fire("Berhasil", "Guru berhasil ditambahkan", "success");
    }

    closeModal();
    fetchTeachers();
  } catch (error) {
    Swal.fire("Error", error.message, "error");
  }
});

// =============================
fetchTeachers();
