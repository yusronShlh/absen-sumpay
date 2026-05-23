import { getData, postData, putData, deleteData } from "./core/api.js";

// =========================
// ELEMENT
// =========================
const tableBody = document.getElementById("tableAssignmentBody");
const filterKelas = document.getElementById("filterKelas");
const filterSemester = document.getElementById("filterSemester");
const btnAddAssignment = document.getElementById("btnAddAssignment");
const assignmentModal = document.getElementById("assignmentModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const assignmentForm = document.getElementById("assignmentForm");
const assignmentId = document.getElementById("assignmentId");
const classSelect = document.getElementById("classSelect");
const subjectSelect = document.getElementById("subjectSelect");
const semesterSelect = document.getElementById("semesterSelect");
const teacherSelect = document.getElementById("teacherSelect");
const modalTitle = document.getElementById("modalTitle");

// =========================
// STATE
// =========================
let assignments = [];

let optionsData = {
  classes: [],
  subjects: [],
  teachers: [],
  semesters: [],
};

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", async () => {
  await loadOptions();
  await loadAssignments();

  initEvents();
});

// =========================
// EVENTS
// =========================
function initEvents() {
  // buka modal tambah
  btnAddAssignment.addEventListener("click", () => {
    resetForm();

    modalTitle.textContent = "Tambah Penugasan";

    openModal();
  });

  // close modal
  closeModalBtn.addEventListener("click", closeModal);

  cancelModalBtn.addEventListener("click", closeModal);

  // submit form
  assignmentForm.addEventListener("submit", handleSubmit);

  // filter kelas
  filterKelas.addEventListener("change", renderTable);
  // filter semester
  filterSemester.addEventListener("change", renderTable);
}

// =========================
// LOAD DATA
// =========================
async function loadAssignments() {
  try {
    const response = await getData("api/admin/teaching-assignments");

    assignments = response.data || [];

    renderTable();
  } catch (error) {
    console.error(error);

    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: error.message,
    });
  }
}

async function loadOptions() {
  try {
    const response = await getData("api/admin/teaching-assignments/options");

    optionsData = response.data;

    populateSelectOptions();
  } catch (error) {
    console.error(error);

    Swal.fire({
      icon: "error",
      title: "Gagal memuat data form",
      text: error.message,
    });
  }
}

// =========================
// RENDER TABLE
// =========================
function renderTable() {
  tableBody.innerHTML = "";

  let filteredData = [...assignments];

  const selectedClass = filterKelas.value;
  const selectedSemester = filterSemester.value;

  // FILTER KELAS
  if (selectedClass) {
    filteredData = filteredData.filter(
      (item) => item.class_id == selectedClass,
    );
  }

  // FILTER SEMESTER
  if (selectedSemester) {
    filteredData = filteredData.filter(
      (item) => item.semester_id == selectedSemester,
    );
  }

  // EMPTY STATE
  if (filteredData.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8 text-gray-500">
          Data penugasan kosong
        </td>
      </tr>
    `;

    return;
  }

  filteredData.forEach((item, index) => {
    tableBody.innerHTML += `
      <tr class="hover:bg-slate-50 transition">
        
        <td class="px-3 md:px-6 py-4">
          ${index + 1}
        </td>

        <td class="px-3 md:px-6 py-4">
          ${item.Subject?.name || "-"}
        </td>

        <td class="px-3 md:px-6 py-4">
          ${item.Class?.name || "-"}
        </td>

        <td class="px-3 md:px-6 py-4">
          ${item.teacher?.name || "-"}
        </td>

        <td class="px-3 md:px-6 py-4">
          ${item.Semester?.name || "-"}
        </td>

        <td class="px-3 md:px-6 py-4 text-center whitespace-nowrap">
          <div class="flex items-center justify-center gap-2">

            <button
              class="p-2 rounded-lg hover:bg-blue-50 text-blue-600 btn-edit"
              data-id="${item.id}"
            >
              <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>

            <button
              class="p-2 rounded-lg hover:bg-red-50 text-red-600 btn-delete"
              data-id="${item.id}"
            >
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>

          </div>
        </td>

      </tr>
    `;
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }

  initActionButtons();
}

// =========================
// POPULATE SELECT
// =========================
function populateSelectOptions() {
  // FILTER KELAS
  filterKelas.innerHTML = `
  <option value="">Semua Kelas</option>
`;

  optionsData.classes.forEach((kelas) => {
    filterKelas.innerHTML += `
    <option value="${kelas.id}">
      ${kelas.name}
    </option>
  `;
  });

  // AUTO PILIH KELAS PERTAMA
  if (optionsData.classes.length > 0) {
    filterKelas.value = optionsData.classes[0].id;
  }

  // FILTER SEMESTER
  filterSemester.innerHTML = `
  <option value="">Semua Semester</option>
`;

  optionsData.semesters.forEach((semester) => {
    filterSemester.innerHTML += `
    <option value="${semester.id}">
      ${semester.name}
    </option>
  `;
  });

  // CLASS SELECT
  classSelect.innerHTML = `
    <option value="">-- Pilih Kelas --</option>
  `;

  optionsData.classes.forEach((kelas) => {
    classSelect.innerHTML += `
      <option value="${kelas.id}">
        ${kelas.name}
      </option>
    `;
  });

  // SUBJECT SELECT
  subjectSelect.innerHTML = `
    <option value="">-- Pilih Mata Pelajaran --</option>
  `;

  optionsData.subjects.forEach((subject) => {
    subjectSelect.innerHTML += `
      <option value="${subject.id}">
        ${subject.name}
      </option>
    `;
  });

  // TEACHER SELECT
  teacherSelect.innerHTML = `
    <option value="">-- Pilih Guru --</option>
  `;

  optionsData.teachers.forEach((teacher) => {
    teacherSelect.innerHTML += `
      <option value="${teacher.id}">
        ${teacher.name} (${teacher.nip})
      </option>
    `;
  });

  // SEMESTER SELECT
  semesterSelect.innerHTML = `
  <option value="">-- Pilih Semester --</option>
`;

  optionsData.semesters.forEach((semester) => {
    semesterSelect.innerHTML += `
    <option value="${semester.id}">
      ${semester.name}
    </option>
  `;
  });
}

// =========================
// ACTION BUTTONS
// =========================
function initActionButtons() {
  // EDIT
  document.querySelectorAll(".btn-edit").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;

      handleEdit(id);
    });
  });

  // DELETE
  document.querySelectorAll(".btn-delete").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;

      handleDelete(id);
    });
  });
}

// =========================
// ADD / EDIT
// =========================
function handleEdit(id) {
  const data = assignments.find((item) => item.id == id);

  if (!data) return;

  assignmentId.value = data.id;

  classSelect.value = data.class_id;

  subjectSelect.value = data.subject_id;

  teacherSelect.value = data.teacher_id;

  semesterSelect.value = data.semester_id;

  modalTitle.textContent = "Edit Penugasan";

  openModal();
}

async function handleSubmit(event) {
  event.preventDefault();

  const payload = {
    class_id: Number(classSelect.value),
    subject_id: Number(subjectSelect.value),
    teacher_id: Number(teacherSelect.value),
    semester_id: Number(semesterSelect.value),
  };

  try {
    // EDIT
    if (assignmentId.value) {
      await putData(
        `api/admin/teaching-assignments/${assignmentId.value}`,
        payload,
      );

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Penugasan berhasil diupdate",
      });
    }

    // CREATE
    else {
      await postData("api/admin/teaching-assignments", payload);

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Penugasan berhasil ditambahkan",
      });
    }

    closeModal();

    resetForm();

    await loadAssignments();
  } catch (error) {
    console.error(error);

    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: error.message,
    });
  }
}

// =========================
// DELETE
// =========================
async function handleDelete(id) {
  const confirm = await Swal.fire({
    title: "Hapus penugasan?",
    text: "Data yang dihapus tidak bisa dikembalikan",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal",
  });

  if (!confirm.isConfirmed) return;

  try {
    await deleteData(`api/admin/teaching-assignments/${id}`);

    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: "Penugasan berhasil dihapus",
    });

    await loadAssignments();
  } catch (error) {
    console.error(error);

    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: error.message,
    });
  }
}

// =========================
// MODAL
// =========================
function openModal() {
  assignmentModal.classList.remove("hidden");

  assignmentModal.classList.add("flex");
}

function closeModal() {
  assignmentModal.classList.add("hidden");

  assignmentModal.classList.remove("flex");
}

function resetForm() {
  assignmentForm.reset();

  assignmentId.value = "";
  semesterSelect.value = "";
}
