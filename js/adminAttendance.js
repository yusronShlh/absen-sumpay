import { getData, postData, putData } from "./core/api.js";

const dateFilter = document.getElementById("filterTanggal");
const classFilter = document.getElementById("filterKelas");
const scheduleFilter = document.getElementById("filterMapel");
const tableBody = document.getElementById("AdminAttendanceTableBody");

let currentScheduleId = null;
let isSubmitted = false;

function setDefaulyDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  dateFilter.value = `${year}-${month}-${day}`;
}

window.addEventListener("DOMContentLoaded", async () => {
  setDefaulyDate();

  await loadClasses();

  resetSchedules();

  emptyTable();
});

function emptyTable() {
  tableBody.innerHTML = `
<tr>
<td colspan="3" class="text-center py-8 text-gray-500">
Silakan pilih tanggal, kelas, dan jadwal.
</td>
</tr>
`;
}

function resetSchedules() {
  scheduleFilter.innerHTML = `
<option value="">Pilih jadwal/mapel</option>
`;
}

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
    console.error(error);
    alert("Gagal load kelas");
  }
}

async function loadSchedules() {
  if (!dateFilter.value || !classFilter.value) {
    resetSchedules();
    return;
  }

  try {
    const result = await getData(
      `api/admin/admin-attendance/schedules?class_id=${classFilter.value}&date=${dateFilter.value}`,
    );

    resetSchedules();

    result.data.forEach((item) => {
      scheduleFilter.innerHTML += `
<option value="${item.id}">
Jam ${item.LessonTime.order} - ${item.Subject.name}
</option>
`;
    });
  } catch (error) {
    console.error(error);
    alert("Gagal load jadwal");
  }
}

async function loadAttendance() {
  if (!scheduleFilter.value) {
    emptyTable();
    return;
  }

  try {
    currentScheduleId = scheduleFilter.value;

    const result = await getData(
      `api/admin/admin-attendance?schedule_id=${currentScheduleId}&date=${dateFilter.value}`,
    );

    renderTable(result.data);
  } catch (error) {
    console.error(error);
    alert("Gagal load absensi");
  }
}

function renderTable(data) {
  isSubmitted = data.is_submitted;
  tableBody.innerHTML = "";
  if (data.students.length === 0) {
    tableBody.innerHTML = `
<tr>
<td colspan="3" class="text-center py-6 text-gray-500">
Tidak ada siswa
</td>
</tr>
`;
    return;
  }

  data.students.forEach((student, index) => {
    const zebra = index % 2 === 0 ? "bg-[#C3D9E6]/25" : "bg-white";

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

<label class="flex items-center gap-2 text-sm">
<input
 type="radio"
 name="student_${student.id}"
 class="student-status"
 data-student-id="${student.id}"
 value="hadir"
 ${student.status === "hadir" ? "checked" : ""}
>
Hadir
</label>


<label class="flex items-center gap-2 text-sm">
<input
 type="radio"
 name="student_${student.id}"
 class="student-status"
 data-student-id="${student.id}"
 value="izin"
 ${student.status === "izin" ? "checked" : ""}
>
Izin
</label>


<label class="flex items-center gap-2 text-sm">
<input
 type="radio"
 name="student_${student.id}"
 class="student-status"
 data-student-id="${student.id}"
 value="sakit"
 ${student.status === "sakit" ? "checked" : ""}
>
Sakit
</label>


<label class="flex items-center gap-2 text-sm">
<input
 type="radio"
 name="student_${student.id}"
 class="student-status"
 data-student-id="${student.id}"
 value="alpha"
 ${student.status === "alpha" ? "checked" : ""}
>
Alpha
</label>

</div>

</td>

</tr>

`;
  });

  tableBody.innerHTML += `
<tr>
<td colspan="3" class="py-6 text-center bg-white">

<button
id="saveAttendanceBtn"
class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
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
        text: "Silakan pilih status kehadiran siswa terlebih dahulu.",
        confirmButtonText: "OK",
        confirmButtonColor: "#2563eb",
      });

      return;
    }

    const payload = {
      schedule_id: Number(currentScheduleId),

      date: dateFilter.value,

      attendances,
    };

    if (isSubmitted) {
      await putData("api/admin/admin-attendance", payload);

      Swal.close();

      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Absensi siswa berhasil diperbarui.",
        confirmButtonText: "OK",
        confirmButtonColor: "#2563eb",
      });
    } else {
      await postData("api/admin/admin-attendance", payload);

      Swal.close();

      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Absensi siswa berhasil disimpan.",
        confirmButtonText: "OK",
        confirmButtonColor: "#2563eb",
      });
    }

    await loadAttendance();
  } catch (error) {
    console.error(error);

    Swal.close();

    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: error.message || "Terjadi kesalahan saat menyimpan absensi.",
      confirmButtonText: "Tutup",
      confirmButtonColor: "#dc2626",
    });
  }
}

dateFilter.addEventListener("change", () => {
  resetSchedules();
  emptyTable();
  if (classFilter.value) {
    loadSchedules();
  }
});

classFilter.addEventListener("change", () => {
  emptyTable();
  loadSchedules();
});

scheduleFilter.addEventListener("change", loadAttendance);
