import { getData, postData, putData, deleteData } from "../js/core/api.js";

const filterKelas = document.getElementById("filterKelas");
const tableBody = document.getElementById("scheduleTableBody");
const modal = document.getElementById("scheduleModal");
const modalTitle = document.getElementById("modalTitle");

const daySelect = document.getElementById("daySelect");
const classSelect = document.getElementById("classSelect");
const subjectSelect = document.getElementById("subjectSelect");
const teacherSelect = document.getElementById("teacherSelect");
const lessonTimeSelect = document.getElementById("lessonTimeSelect");

const btnDelete = document.getElementById("btnDelete");

const scheduleForm = document.getElementById("scheduleForm");

let formOptions = null;
let currentClassId = null;

/* ===============================
   INIT
================================= */
document.addEventListener("DOMContentLoaded", async () => {
  await loadFormOptions();
  setupFilterListener();
});

/* ===============================
   LOAD FORM OPTIONS
================================= */
async function loadFormOptions() {
  try {
    const res = await getData("api/admin/schedules/form-options");
    formOptions = res;

    renderClassDropdown(formOptions.classes);

    if (formOptions.classes.length > 0) {
      currentClassId = formOptions.classes[0].id;
      filterKelas.value = currentClassId;
      await loadSchedulesByClass(currentClassId);
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: err.message || "Terjadi kesalahan",
    });
  }
}

/* ===============================
   RENDER DROPDOWN
================================= */
function renderClassDropdown(classes) {
  filterKelas.innerHTML = "";

  classes.forEach((cls) => {
    const option = document.createElement("option");
    option.value = cls.id;
    option.textContent = `Kelas ${cls.name}`;
    filterKelas.appendChild(option);
  });
}

/* ===============================
   FILTER CHANGE
================================= */
function setupFilterListener() {
  filterKelas.addEventListener("change", async (e) => {
    currentClassId = e.target.value;
    await loadSchedulesByClass(currentClassId);
  });
}

/* ===============================
   LOAD SCHEDULE BY CLASS
================================= */
async function loadSchedulesByClass(classId) {
  try {
    const res = await getData(`api/admin/schedules?class_id=${classId}`);
    renderTable(res.data);
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: err.message || "Terjadi kesalahan",
    });
  }
}

function renderTable(schedules) {
  tableBody.innerHTML = "";

  const days = formOptions.days;

  // ✅ SORT berdasarkan field "order"
  const lessonTimes = [...formOptions.lessonTimes].sort(
    (a, b) => a.order - b.order,
  );

  lessonTimes.forEach((lessonTime, index) => {
    const row = document.createElement("tr");

    // ✅ Zebra + tinggi row
    row.className = index % 2 === 0 ? "h-16 bg-white" : "h-16 bg-[#C3D9E6]/20";

    // ==============================
    // Kolom No
    // ==============================
    const noCell = document.createElement("td");
    noCell.className = "px-4 py-4 align-middle";
    noCell.textContent = index + 1;
    row.appendChild(noCell);

    // ==============================
    // Kolom Jam
    // ==============================
    const timeCell = document.createElement("td");
    timeCell.className = "px-6 py-4 align-middle font-medium text-gray-700";
    timeCell.textContent = lessonTime.name;
    row.appendChild(timeCell);

    // ==============================
    // Kolom per Hari
    // ==============================
    days.forEach((day) => {
      const cell = document.createElement("td");

      cell.className =
        "px-6 py-4 align-middle text-center cursor-pointer transition hover:bg-[#C3D9E6]/40";

      cell.dataset.day = day;
      cell.dataset.lessonTimeId = lessonTime.id;
      cell.dataset.classId = currentClassId;

      const found = schedules.find(
        (s) => s.day === day && s.lesson_time_id === lessonTime.id,
      );

      if (found) {
        const subject = found.Subject?.name ?? "-";
        const teacher = found.teacher?.name ?? "-";
        cell.textContent = `${subject} - ${teacher}`;

        cell.dataset.scheduleId = found.id;
        cell.dataset.subjectId = found.subject_id;
        cell.dataset.teacherId = found.teacher_id;
      } else {
        cell.textContent = "+";
      }

      row.appendChild(cell);
    });

    tableBody.appendChild(row);
  });
}

// EVENT CLIK DI TABLE
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

let editScheduleId = null;

function openModal(mode, data) {
  populateModalSelects();

  if (mode === "add") {
    modalTitle.textContent = "Tambah Jadwal";
    editScheduleId = null;
    btnDelete.classList.add("hidden");

    daySelect.value = data.day;
    classSelect.value = data.classId;
    lessonTimeSelect.value = data.lessonTimeId;
  }

  if (mode === "edit") {
    modalTitle.textContent = "Edit Jadwal";
    editScheduleId = data.scheduleId;
    btnDelete.classList.remove("hidden");

    daySelect.value = data.day;
    classSelect.value = data.classId;
    lessonTimeSelect.value = data.lessonTimeId;

    subjectSelect.value = data.subjectId; // ✅ TAMBAHAN
    teacherSelect.value = data.teacherId; // ✅ TAMBAHAN
  }

  modal.showModal();
}

document.getElementById("btnCloseModal")?.addEventListener("click", () => {
  document.getElementById("scheduleModal").close();
});

// isi semua select
function populateModalSelects() {
  // Days
  daySelect.innerHTML = "";
  formOptions.days.forEach((day) => {
    const opt = document.createElement("option");
    opt.value = day;
    opt.textContent = day;
    daySelect.appendChild(opt);
  });

  // Classes
  classSelect.innerHTML = "";
  formOptions.classes.forEach((cls) => {
    const opt = document.createElement("option");
    opt.value = cls.id;
    opt.textContent = `Kelas ${cls.name}`;
    classSelect.appendChild(opt);
  });

  // Subjects
  subjectSelect.innerHTML = "";
  formOptions.subjects.forEach((sub) => {
    const opt = document.createElement("option");
    opt.value = sub.id;
    opt.textContent = sub.name;
    subjectSelect.appendChild(opt);
  });

  // Teachers
  teacherSelect.innerHTML = "";
  formOptions.teachers.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.name;
    teacherSelect.appendChild(opt);
  });

  // LessonTimes
  lessonTimeSelect.innerHTML = "";
  formOptions.lessonTimes.forEach((lt) => {
    const opt = document.createElement("option");
    opt.value = lt.id;
    opt.textContent = `${lt.name} (${lt.time})`;
    lessonTimeSelect.appendChild(opt);
  });
}

// SUBMIT POST DAN PUT
scheduleForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    day: daySelect.value,
    class_id: Number(classSelect.value),
    subject_id: Number(subjectSelect.value),
    teacher_id: Number(teacherSelect.value),
    lesson_time_id: Number(lessonTimeSelect.value),
  };

  try {
    if (editScheduleId) {
      console.log("UPDATE ID:", editScheduleId);
      console.log("PAYLOAD:", payload);
      await putData(`api/admin/schedules/${editScheduleId}`, payload);
    } else {
      await postData("api/admin/schedules", payload);
    }

    modal.close();
    await loadSchedulesByClass(currentClassId);

    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: editScheduleId
        ? "Jadwal berhasil diperbarui"
        : "Jadwal berhasil ditambahkan",
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: err.message || "Terjadi kesalahan",
    });
  }
});

// Delete
btnDelete.addEventListener("click", async () => {
  if (!editScheduleId) return;

  // Tutup modal dulu biar bersih
  modal.close();

  const confirm = await Swal.fire({
    title: "Yakin hapus jadwal?",
    text: "Data tidak bisa dikembalikan.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, hapus!",
    cancelButtonText: "Batal",
  });

  if (confirm.isConfirmed) {
    try {
      await deleteData(`api/admin/schedules/${editScheduleId}`);
      await loadSchedulesByClass(currentClassId);

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Jadwal berhasil dihapus",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.message,
      });
    }
  } else {
    // Kalau batal, buka lagi modal edit
    modal.showModal();
  }
});
