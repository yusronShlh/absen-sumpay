// =============================
// IMPORT API
// =============================
import { createTableSkeleton } from "./components/skeleton.js";
import {
  getData,
  postData,
  putData,
  deleteData,
  downloadFile,
  uploadFile,
} from "./core/api.js";

function showTableLoading() {
  tableBody.innerHTML = createTableSkeleton(8, 5);
}
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
const btnDownloadTemplate = document.getElementById("btnDownloadTemplate");
const btnImportStudent = document.getElementById("btnImportStudent");
const importModal = document.getElementById("importModal");
const btnCloseImport = document.getElementById("btnCloseImport");
const btnSubmitImport = document.getElementById("btnSubmitImport");
const excelFile = document.getElementById("excelFile");
const btnPromoteStudent = document.getElementById("btnPromoteStudent");
const btnGraduateStudent = document.getElementById("btnGraduateStudent");
const promoteModal = document.getElementById("promoteModal");
const promoteTargetClass = document.getElementById("promoteTargetClass");
const btnClosePromote = document.getElementById("btnClosePromote");
const btnSubmitPromote = document.getElementById("btnSubmitPromote");
const passwordInput = document.getElementById("password");
const passwordHint = document.getElementById("passwordHint");

let classList = [];
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

  passwordInput.disabled = false;
  passwordInput.required = false;
  passwordHint.classList.add("hidden");
}

btnAdd?.addEventListener("click", () => {
  isEditMode = false;

  modalTitle.textContent = "Tambah Siswa";

  passwordInput.disabled = false;
  passwordInput.required = true;
  passwordHint.classList.add("hidden");

  openModal();
});

btnClose?.addEventListener("click", closeModal);

// =============================
// FETCH DATA STUDENTS
// =============================
async function fetchStudents(classId = "") {
  showTableLoading();
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

  passwordInput.value = "";
  passwordInput.disabled = true;
  passwordInput.required = false;

  passwordHint.classList.remove("hidden");

  openModal();
}

// =============================
// FETCH DATA KELAS
// =============================
async function fetchClasses() {
  try {
    const response = await getData("api/admin/students/classes");

    // Dropdown di modal
    kelasSelect.innerHTML = `
      <option value="">Pilih Kelas</option>
    `;

    // Dropdown filter
    if (filterKelas) {
      filterKelas.innerHTML = "";
    }

    classList = response.data;

    response.data.forEach((kelas, index) => {
      // modal
      kelasSelect.innerHTML += `
        <option value="${kelas.id}">
          Kelas ${kelas.name}
        </option>
      `;

      // filter
      if (filterKelas) {
        filterKelas.innerHTML += `
          <option value="${kelas.id}">
            Kelas ${kelas.name}
          </option>
        `;
      }

      // 🔥 auto pilih kelas pertama
      if (index === 0) {
        currentFilterClassId = kelas.id;
      }
    });

    // 🔥 set selected dropdown ke kelas pertama
    if (filterKelas && currentFilterClassId) {
      filterKelas.value = currentFilterClassId;
    }

    // 🔥 langsung fetch siswa sesuai kelas pertama
    await fetchStudents(currentFilterClassId);
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

  if (!isEditMode && password) {
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

btnDownloadTemplate.addEventListener("click", async () => {
  try {
    await downloadFile("api/admin/students/template", "template-siswa.xlsx");
  } catch (error) {
    Swal.fire("Error", error.message, "error");
  }
});

btnImportStudent.addEventListener("click", () => {
  importModal.classList.remove("hidden");
  importModal.classList.add("flex");
});

btnCloseImport.addEventListener("click", () => {
  importModal.classList.add("hidden");
  importModal.classList.remove("flex");
});

btnSubmitImport.addEventListener("click", async () => {
  const file = excelFile.files[0];

  if (!file) {
    Swal.fire("Error", "Pilih file excel dulu", "error");

    return;
  }

  const formData = new FormData();

  formData.append("file", file);

  try {
    const result = await uploadFile("api/admin/students/import", formData);

    let message = `
      Berhasil: ${result.success_count}
      <br>
      Gagal: ${result.failed_count}
    `;

    if (result.failed_rows?.length) {
      message += "<br><br>";

      result.failed_rows.forEach((e) => {
        message += `
          Baris ${e.row}
          - ${e.name}
          (${e.nisn})
          : ${e.reason}
          <br>
        `;
      });
    }

    Swal.fire("Import selesai", message, "success");

    importModal.classList.add("hidden");

    fetchClasses();
  } catch (error) {
    Swal.fire("Error", error.message, "error");
  }
});

// NAIK KELAS
function loadPromoteClasses() {
  promoteTargetClass.innerHTML = `
<option value="">
Pilih kelas tujuan
</option>
`;

  classList.forEach((kelas) => {
    promoteTargetClass.innerHTML += `
<option value="${kelas.id}">
${kelas.name}
</option>
`;
  });
}

btnPromoteStudent.addEventListener("click", () => {
  if (!currentFilterClassId) {
    Swal.fire("Error", "Pilih kelas dulu", "error");

    return;
  }

  loadPromoteClasses();

  promoteModal.classList.remove("hidden");
  promoteModal.classList.add("flex");
});
btnClosePromote.addEventListener("click", () => {
  promoteModal.classList.add("hidden");
  promoteModal.classList.remove("flex");
});

// SUBMIT NAIK KELAS
btnSubmitPromote.addEventListener("click", async () => {
  const to_class_id = promoteTargetClass.value;

  if (!to_class_id) {
    Swal.fire("Error", "Pilih kelas tujuan", "error");

    return;
  }

  try {
    const result = await postData("api/admin/students/promote-class", {
      from_class_id: Number(currentFilterClassId),

      to_class_id: Number(to_class_id),
    });

    Swal.fire("Berhasil", result.message, "success");

    promoteModal.classList.add("hidden");

    fetchClasses();
  } catch (error) {
    Swal.fire("Error", error.message, "error");
  }
});

// LULUSKAN SISWA
btnGraduateStudent.addEventListener("click", async () => {
  if (!currentFilterClassId) {
    Swal.fire("Error", "Pilih kelas dulu", "error");

    return;
  }

  const confirm = await Swal.fire({
    title: "Yakin meluluskan?",

    text: "Semua siswa kelas ini akan diluluskan",

    icon: "warning",

    showCancelButton: true,
  });

  if (!confirm.isConfirmed) return;

  try {
    const result = await postData("api/admin/students/graduate-class", {
      class_id: Number(currentFilterClassId),
    });

    Swal.fire("Berhasil", result.message, "success");

    fetchClasses();
  } catch (error) {
    Swal.fire("Error", error.message, "error");
  }
});
// =============================
// INIT
// =============================

fetchClasses();
