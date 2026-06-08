import { getData, postData, putData, deleteData } from "./core/api.js";

// ===============================
// ELEMENT
// ===============================
const filterKelas = document.getElementById("filterKelas");

const tableBody = document.getElementById("scheduleTableBody");

const modal = document.getElementById("scheduleModal");

const modalTitle = document.getElementById("modalTitle");

const scheduleForm = document.getElementById("scheduleForm");

const btnDelete = document.getElementById("btnDelete");

const btnCloseModal = document.getElementById("btnCloseModal");

// select
const daySelect = document.getElementById("daySelect");

const teachingAssignmentSelect = document.getElementById(
  "teachingAssignmentSelect",
);

const lessonTimeSelect = document.getElementById("lessonTimeSelect");

// info kelas
const classInfo = document.getElementById("classInfo");

const infoNamaKelas = document.getElementById("infoNamaKelas");

const infoWaliKelas = document.getElementById("infoWaliKelas");

// ===============================
// STATE
// ===============================
let formOptions = {};

let schedules = [];

let currentClassId = "";

let editScheduleId = null;

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  await loadFormOptions();

  initEvents();
});

// ===============================
// EVENTS
// ===============================
function initEvents() {
  filterKelas.addEventListener("change", async (e) => {
    currentClassId = e.target.value;

    if (!currentClassId) {
      tableBody.innerHTML = "";

      classInfo.classList.add("hidden");

      return;
    }

    await loadSchedulesByClass(currentClassId);
  });

  scheduleForm.addEventListener("submit", handleSubmit);

  btnDelete.addEventListener("click", handleDelete);

  btnCloseModal.addEventListener("click", () => {
    modal.close();
  });
}

// ===============================
// LOAD FORM OPTIONS
// ===============================
async function loadFormOptions() {
  try {
    const response = await getData("api/admin/schedules/form-options");

    formOptions = response;

    populateFilterClass();

    populateModalSelects();

    // default pilih kelas pertama
    const firstClass = formOptions.teachingAssignments?.[0]?.Class;

    if (firstClass) {
      currentClassId = firstClass.id;

      filterKelas.value = firstClass.id;

      await loadSchedulesByClass(firstClass.id);
    }
  } catch (error) {
    console.error(error);

    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: error.message,
    });
  }
}

// ===============================
// FILTER KELAS
// ===============================
function populateFilterClass() {
  filterKelas.innerHTML = `
    <option value="">Pilih Kelas</option>
  `;

  // ambil unique classes dari teaching assignments
  const uniqueClasses = [];

  formOptions.teachingAssignments.forEach((item) => {
    const exists = uniqueClasses.find((cls) => cls.id === item.Class.id);

    if (!exists) {
      uniqueClasses.push(item.Class);
    }
  });

  uniqueClasses.forEach((kelas) => {
    filterKelas.innerHTML += `
      <option value="${kelas.id}">
        ${kelas.name}
      </option>
    `;
  });
}

// ===============================
// LOAD SCHEDULES
// ===============================
async function loadSchedulesByClass(classId) {
  try {
    const response = await getData(`api/admin/schedules?class_id=${classId}`);

    schedules = response.data || [];

    renderClassInfo();

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

// ===============================
// RENDER CLASS INFO
// ===============================
function renderClassInfo() {
  const schedule = schedules[0];

  if (!schedule) {
    classInfo.classList.add("hidden");
    return;
  }

  const kelas = schedule.TeachingAssignment?.Class;

  classInfo.classList.remove("hidden");

  infoNamaKelas.textContent = kelas?.name || "-";

  infoWaliKelas.textContent = kelas?.homeroomTeacher?.name || "-";
}

// ===============================
// RENDER TABLE
// ===============================
function renderTable() {
  tableBody.innerHTML = "";

  const days = formOptions.days || [];

  const lessonTimes = [...(formOptions.lessonTimes || [])].sort(
    (a, b) => a.id - b.id,
  );

  lessonTimes.forEach((lessonTime, index) => {
    const row = document.createElement("tr");

    row.className = index % 2 === 0 ? "h-16 bg-white" : "h-16 bg-[#C3D9E6]/20";

    // no
    row.innerHTML += `
      <td class="px-4 py-4">
        ${index + 1}
      </td>
    `;

    // jam
    row.innerHTML += `
      <td class="px-6 py-4 font-medium text-gray-700">
        ${lessonTime.name}
        <br>
        <span class="text-xs text-gray-400">
          ${lessonTime.time}
        </span>
      </td>
    `;

    // hari
    days.forEach((day) => {
      const found = schedules.find(
        (item) => item.day === day && item.lesson_time_id === lessonTime.id,
      );

      let content = "+";

      let dataset = `
        data-day="${day}"
        data-lesson-time-id="${lessonTime.id}"
      `;

      if (found) {
        const assignment = found.TeachingAssignment;

        const subject = assignment?.Subject?.name || "-";

        const teacher = assignment?.teacher?.name || "-";

        content = `
          <div class="text-sm font-medium">
            ${subject}
          </div>

          <div class="text-xs text-gray-500 mt-1">
            ${teacher}
          </div>
        `;

        dataset += `
          data-schedule-id="${found.id}"
          data-teaching-assignment-id="${found.teaching_assignment_id}"
        `;
      }

      row.innerHTML += `
        <td
          class="px-4 py-4 text-center align-middle cursor-pointer hover:bg-[#C3D9E6]/40 transition"
          ${dataset}
        >
          ${content}
        </td>
      `;
    });

    tableBody.appendChild(row);
  });
}

// ===============================
// TABLE CLICK
// ===============================
tableBody.addEventListener("click", (e) => {
  const cell = e.target.closest("td");

  if (!cell || !cell.dataset.day) return;

  const scheduleId = cell.dataset.scheduleId;

  if (scheduleId) {
    openModal("edit", cell.dataset);
  } else {
    openModal("add", cell.dataset);
  }
});

// ===============================
// OPEN MODAL
// ===============================
function openModal(mode, data) {
  resetForm();

  populateModalSelects();

  // default
  daySelect.value = data.day;

  lessonTimeSelect.value = data.lessonTimeId;

  if (mode === "add") {
    modalTitle.textContent = "Tambah Jadwal";

    editScheduleId = null;

    btnDelete.classList.add("hidden");
  }

  if (mode === "edit") {
    modalTitle.textContent = "Edit Jadwal";

    editScheduleId = data.scheduleId;

    btnDelete.classList.remove("hidden");

    teachingAssignmentSelect.value = data.teachingAssignmentId;
  }

  modal.showModal();
}

// ===============================
// POPULATE MODAL SELECT
// ===============================
function populateModalSelects() {
  // DAYS
  daySelect.innerHTML = "";

  formOptions.days.forEach((day) => {
    daySelect.innerHTML += `
      <option value="${day}">
        ${capitalize(day)}
      </option>
    `;
  });

  // TEACHING ASSIGNMENT
  teachingAssignmentSelect.innerHTML = "";

  // filter berdasarkan kelas aktif
  const filteredAssignments = formOptions.teachingAssignments.filter(
    (item) => item.class_id == currentClassId,
  );

  filteredAssignments.forEach((item) => {
    teachingAssignmentSelect.innerHTML += `
      <option value="${item.id}">
        ${item.Class?.name} •
        ${item.Subject?.name} •
        ${item.teacher?.name} •
        ${item.Semester?.name} 
      </option>
    `;
  });

  // LESSON TIMES
  lessonTimeSelect.innerHTML = "";

  formOptions.lessonTimes.forEach((item) => {
    lessonTimeSelect.innerHTML += `
      <option value="${item.id}">
        ${item.name} (${item.time})
      </option>
    `;
  });
}

// ===============================
// SUBMIT
// ===============================
async function handleSubmit(e) {
  e.preventDefault();

  const payload = {
    day: daySelect.value,
    teaching_assignment_id: Number(teachingAssignmentSelect.value),
    lesson_time_id: Number(lessonTimeSelect.value),
  };

  try {
    // edit
    if (editScheduleId) {
      await putData(`api/admin/schedules/${editScheduleId}`, payload);

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Jadwal berhasil diperbarui",
      });
    }

    // add
    else {
      await postData("api/admin/schedules", payload);

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Jadwal berhasil ditambahkan",
      });
    }

    modal.close();

    await loadSchedulesByClass(currentClassId);
  } catch (error) {
    console.error(error);

    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: error.message,
    });
  }
}

// ===============================
// DELETE
// ===============================
async function handleDelete() {
  if (!editScheduleId) return;

  modal.close();

  const confirm = await Swal.fire({
    title: "Hapus jadwal?",
    text: "Data tidak bisa dikembalikan",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal",
  });

  if (!confirm.isConfirmed) {
    modal.showModal();
    return;
  }

  try {
    await deleteData(`api/admin/schedules/${editScheduleId}`);

    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: "Jadwal berhasil dihapus",
    });

    await loadSchedulesByClass(currentClassId);
  } catch (error) {
    console.error(error);

    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: error.message,
    });
  }
}

// ===============================
// RESET FORM
// ===============================
function resetForm() {
  scheduleForm.reset();

  editScheduleId = null;
}

// ===============================
// HELPERS
// ===============================
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
