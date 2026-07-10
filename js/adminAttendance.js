import { getData, postData } from "./core/api.js";

const dateFilter = document.getElementById("filterTanggal");
const classFilter = document.getElementById("filterKelas");
const scheduleFilter = document.getElementById("filterMapel");
const tableBody = document.getElementById("AdminAttendanceTableBody");

let currentScheduleId = null;
let isSubmitted = false;

/* =========================================
   INIT
========================================= */
window.addEventListener("DOMContentLoaded", async () => {
  setDefaultDate();

  await loadClasses();

  resetSchedules();
  emptyTable();
});

/* =========================================
   DEFAULT DATE
========================================= */
function setDefaultDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  dateFilter.value = `${year}-${month}-${day}`;
}

/* =========================================
   EMPTY TABLE
========================================= */
function emptyTable(message = "Silakan pilih tanggal, kelas, dan jadwal.") {
  tableBody.innerHTML = `
    <tr>
      <td colspan="3" class="text-center py-10 text-gray-500">
        ${message}
      </td>
    </tr>
  `;
}

/* =========================================
   RESET SCHEDULES
========================================= */
function resetSchedules() {
  scheduleFilter.innerHTML = `
    <option value="">Pilih jadwal/mapel</option>
  `;

  currentScheduleId = null;
}

/* =========================================
   LOAD CLASSES
========================================= */
async function loadClasses() {
  try {
    const result = await getData("api/admin/admin-attendance/classes");

    classFilter.innerHTML = `
      <option value="">Pilih kelas</option>
    `;

    result.data.forEach((item) => {
      classFilter.innerHTML += `
        <option value="${item.id}">
          ${item.name}
        </option>
      `;
    });
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: error.message || "Gagal load kelas",
    });
  }
}

/* =========================================
   LOAD SCHEDULES
========================================= */
async function loadSchedules() {
  if (!dateFilter.value || !classFilter.value) {
    resetSchedules();
    emptyTable();
    return;
  }

  try {
    resetSchedules();

    const result = await getData(
      `api/admin/admin-attendance/schedules?class_id=${classFilter.value}&date=${dateFilter.value}`,
    );

    const schedules = result.data || [];

    if (schedules.length === 0) {
      emptyTable("Tidak ada jadwal pada tanggal ini.");
      return;
    }

    schedules
      .sort((a, b) => {
        return a.LessonTime.order - b.LessonTime.order;
      })
      .forEach((item) => {
        const subjectName = item.TeachingAssignment?.Subject?.name || "-";

        const lessonName =
          item.LessonTime?.name || `Jam ${item.LessonTime?.order}`;

        scheduleFilter.innerHTML += `
          <option value="${item.id}">
            ${lessonName} - ${subjectName}
          </option>
        `;
      });

    emptyTable("Silakan pilih jadwal.");
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: error.message || "Gagal load jadwal",
    });
  }
}

/* =========================================
   LOAD ATTENDANCE
========================================= */
async function loadAttendance() {
  if (!scheduleFilter.value) {
    emptyTable();
    return;
  }

  try {
    currentScheduleId = Number(scheduleFilter.value);

    const result = await getData(
      `api/admin/admin-attendance?schedule_id=${currentScheduleId}&date=${dateFilter.value}`,
    );

    renderTable(result.data);
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: error.message || "Gagal load absensi",
    });
  }
}

/* =========================================
   RENDER TABLE
========================================= */
function renderTable(data) {
  isSubmitted = data.is_submitted;

  tableBody.innerHTML = "";

  const students = data.students || [];

  if (students.length === 0) {
    emptyTable("Tidak ada siswa.");
    return;
  }

  students.forEach((student, index) => {
    const zebra = index % 2 === 0 ? "bg-[#C3D9E6]/20" : "bg-white";

    tableBody.innerHTML += `
      <tr class="${zebra}">
        
        <td class="px-4 py-4 text-center font-medium">
          ${index + 1}
        </td>

        <td class="px-6 py-4 text-center font-medium">
          ${student.name}
        </td>

        <td class="px-6 py-4">
          <div class="flex justify-center gap-5 flex-wrap">

            ${renderRadio(student, "hadir", "Hadir")}
            ${renderRadio(student, "izin", "Izin")}
            ${renderRadio(student, "sakit", "Sakit")}
            ${renderRadio(student, "alpha", "Alpha")}

          </div>
        </td>

      </tr>
    `;
  });

  /* =========================================
     BUTTON SAVE
  ========================================= */
  tableBody.innerHTML += `
    <tr>
      <td colspan="3" class="py-6 text-center bg-white">

        <button
          id="saveAttendanceBtn"
          class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition"
        >
          ${isSubmitted ? "Update Absensi" : "Simpan Absensi"}
        </button>

      </td>
    </tr>
  `;

  document
    .getElementById("saveAttendanceBtn")
    .addEventListener("click", saveAttendance);
}

/* =========================================
   RENDER RADIO
========================================= */
function renderRadio(student, value, label) {
  return `
    <label class="flex items-center gap-2 text-sm">

      <input
        type="radio"
        name="student_${student.id}"
        class="student-status"
        data-student-id="${student.id}"
        value="${value}"
        ${student.status === value ? "checked" : ""}
      >

      ${label}

    </label>
  `;
}

/* =========================================
   SAVE ATTENDANCE
========================================= */
async function saveAttendance() {
  try {
    const studentIds = [
      ...new Set(
        [...document.querySelectorAll(".student-status")].map(
          (item) => item.dataset.studentId,
        ),
      ),
    ];

    const attendances = [];

    studentIds.forEach((id) => {
      const checked = document.querySelector(
        `.student-status[data-student-id="${id}"]:checked`,
      );

      if (checked) {
        attendances.push({
          student_id: Number(id),
          status: checked.value,
        });
      }
    });

    if (attendances.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Absensi belum diisi",
        text: "Silakan isi absensi siswa terlebih dahulu.",
      });

      return;
    }

    const payload = {
      schedule_id: Number(currentScheduleId),
      date: dateFilter.value,
      attendances,
    };

    /* =========================================
       LOADING
    ========================================= */
    Swal.fire({
      title: "Menyimpan...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    /* =========================================
       SUBMIT
    ========================================= */
    await postData("api/admin/admin-attendance", payload);

    Swal.close();

    await Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: isSubmitted
        ? "Absensi berhasil diperbarui."
        : "Absensi berhasil disimpan.",
      confirmButtonColor: "#2563eb",
    });

    await loadAttendance();
  } catch (error) {
    Swal.close();

    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: error.message || "Terjadi kesalahan saat menyimpan absensi.",
    });
  }
}

/* =========================================
   EVENT LISTENER
========================================= */

/* TANGGAL BERUBAH */
dateFilter.addEventListener("change", async () => {
  resetSchedules();
  emptyTable();

  if (classFilter.value) {
    await loadSchedules();
  }
});

/* KELAS BERUBAH */
classFilter.addEventListener("change", async () => {
  resetSchedules();
  emptyTable();

  if (classFilter.value) {
    await loadSchedules();
  }
});

/* JADWAL BERUBAH */
scheduleFilter.addEventListener("change", loadAttendance);
