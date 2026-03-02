// =============================
// IMPORT API
// =============================
import { getData, postData, putData, deleteData } from "./core/api.js";

// =============================
// ELEMENT
// =============================
const tableBody = document.getElementById("tableSiswaBody");
const form = document.getElementById("studentForm");
const modal = document.getElementById("studentModal");
const btnAdd = document.getElementById("btnAddStudents");
const btnClose = document.getElementById("btnCloseModal");
const kelasSelect = document.getElementById("kelas");
const modalTitle = document.getElementById("modalTitle");
const studentIdInput = document.getElementById("studentId");
const filterKelas = document.getElementById("filterKelas");

// =============================
// STATE
// =============================
let isEditMode = false;
let currentStudentId = null;
let currentFilterClassId = ""; // ⬅️ simpan filter aktif

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
  currentStudentId = null;
  modalTitle.textContent = "Tambah Siswa";
}

btnAdd?.addEventListener("click", () => {
  isEditMode = false;
  modalTitle.textContent = "Tambah Siswa";
  openModal();
});

btnClose?.addEventListener("click", closeModal);

// =============================
// FETCH DATA STUDENTS
// =============================
async function fetchStudents(classId = "") {
  try {
    let endpoint = "api/admin/students";

    if (classId) {
      endpoint += `?class_id=${classId}`;
    }

    const response = await getData(endpoint);
    renderTable(response.students);
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Gagal mengambil data",
      text: error.message,
    });
  }
}

// =============================
// RENDER TABLE
// =============================
function renderTable(students) {
  tableBody.innerHTML = "";

  students.forEach((student, index) => {
    tableBody.innerHTML += `
      <tr>
        <td class="px-6 py-4">${index + 1}</td>
        <td class="px-6 py-4">${student.User?.name || "-"}</td>
        <td class="px-6 py-4">${student.User?.nisn || "-"}</td>
        <td class="px-6 py-4">
          ${student.gender === "L" ? "Laki-laki" : "Perempuan"}
        </td>
        <td class="px-6 py-4 text-center">
          <div class="flex justify-center gap-2">
            <button 
              class="text-blue-600 hover:underline btn-edit"
              data-id="${student.id}"
              data-name="${student.User?.name}"
              data-nisn="${student.User?.nisn}"
              data-gender="${student.gender}"
              data-class="${student.class_id}"
            >
              <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>

            <button
              class="text-red-600 hover:underline btn-delete"
              data-id="${student.id}"
              data-name="${student.User?.name}"
            >
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  document.querySelectorAll(".btn-edit").forEach((button) => {
    button.addEventListener("click", handleEdit);
  });

  document.querySelectorAll(".btn-delete").forEach((button) => {
    button.addEventListener("click", handleDelete);
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// =============================
// HANDLE EDIT
// =============================
function handleEdit(e) {
  const button = e.currentTarget;

  isEditMode = true;
  currentStudentId = button.dataset.id;

  modalTitle.textContent = "Edit Siswa";

  document.getElementById("nama").value = button.dataset.name;
  document.getElementById("nisn").value = button.dataset.nisn;
  document.getElementById("jenisKelamin").value = button.dataset.gender;
  document.getElementById("kelas").value = button.dataset.class;

  document.getElementById("password").required = false;

  openModal();
}

// =============================
// FETCH DATA KELAS
// =============================
async function fetchClasses() {
  try {
    const response = await getData("api/admin/students/classes");

    // Dropdown di modal
    kelasSelect.innerHTML = `<option value="">Pilih Kelas</option>`;

    // Dropdown filter
    if (filterKelas) {
      filterKelas.innerHTML = `<option value="">Semua Kelas</option>`;
    }

    response.data.forEach((kelas) => {
      // Untuk modal
      kelasSelect.innerHTML += `
        <option value="${kelas.id}">
          Kelas ${kelas.name}
        </option>
      `;

      // Untuk filter
      if (filterKelas) {
        filterKelas.innerHTML += `
          <option value="${kelas.id}">
            Kelas ${kelas.name}
          </option>
        `;
      }
    });
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Gagal mengambil data kelas",
      text: error.message,
    });
  }
}

// =============================
// FILTER KELAS
// =============================
filterKelas?.addEventListener("change", function () {
  currentFilterClassId = this.value;
  fetchStudents(currentFilterClassId);
});

// =============================
// SUBMIT FORM (TAMBAH + EDIT)
// =============================
form?.addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = document.getElementById("nama").value.trim();
  const nisn = document.getElementById("nisn").value.trim();
  const password = document.getElementById("password").value.trim();
  const gender = document.getElementById("jenisKelamin").value;
  const class_id = document.getElementById("kelas").value;

  if (!name || !nisn || !gender || !class_id) {
    Swal.fire({
      icon: "error",
      title: "Semua field wajib diisi",
    });
    return;
  }

  const payload = {
    name,
    nisn,
    gender,
    class_id: Number(class_id),
  };

  if (password) {
    payload.password = password;
  }

  try {
    if (isEditMode) {
      await putData(`api/admin/students/${currentStudentId}`, payload);

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Siswa berhasil diperbarui",
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      if (!password) {
        Swal.fire({
          icon: "error",
          title: "Password wajib diisi",
        });
        return;
      }

      await postData("api/admin/students", payload);

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Siswa berhasil ditambahkan",
        timer: 1500,
        showConfirmButton: false,
      });
    }

    closeModal();
    fetchStudents(currentFilterClassId); // ⬅️ reload sesuai filter
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Gagal menyimpan data",
      text: error.message,
    });
  }
});

// =============================
// HANDLE DELETE
// =============================
async function handleDelete(e) {
  const button = e.currentTarget;
  const id = button.dataset.id;
  const name = button.dataset.name;

  const confirm = await Swal.fire({
    title: "Yakin ingin menghapus?",
    text: `Data siswa ${name} akan dihapus`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Ya, Hapus",
    cancelButtonText: "Batal",
  });

  if (!confirm.isConfirmed) return;

  try {
    await deleteData(`api/admin/students/${id}`);

    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: "Siswa berhasil dihapus",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchStudents(currentFilterClassId); // ⬅️ tetap sesuai filter
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Gagal menghapus",
      text: error.message,
    });
  }
}

// =============================
// INIT
// =============================
fetchStudents();
fetchClasses();
