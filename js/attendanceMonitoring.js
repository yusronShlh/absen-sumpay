import { getData, putData } from "./core/api.js";

const classFilter = document.getElementById("filterKelas");
const dateFilter = document.getElementById("filterTanggal");
const tableBody = document.getElementById("AttendanceMonitoringTableBody");
const attendanceModal = document.getElementById("attendanceModal");
const attendanceModalBody = document.getElementById("attendanceModalBody");
const closeAttendanceModalBtn = document.getElementById("closeAttendanceModal");
const cancelAttendanceBtn = document.getElementById("cancelAttendanceBtn");
const saveAttendanceBtn = document.getElementById("saveAttendanceBtn");

let currentScheduleId = null;
let currentClassId = null;

function setDefaultDate() {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(today.getMonth() + 1).padStart(2, "0");

  const day = String(today.getDate()).padStart(2, "0");

  dateFilter.value = `${year}-${month}-${day}`;
}

document.addEventListener("DOMContentLoaded", async () => {
  setDefaultDate();

  await loadClasses();

  await loadAttendanceMonitoring();
});

async function loadClasses() {
  try {
    const result = await getData("api/admin/attendance-monitoring/classes");

    classFilter.innerHTML = '<option value="">Pilih kelas</option>';

    result.data.forEach((item) => {
      classFilter.innerHTML += `
<option value="${item.id}">
${item.name}
</option>
`;
    });
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: "Gagal memuat data kelas.",
      confirmButtonColor: "#dc2626",
    });
  }
}

async function loadAttendanceMonitoring() {
  try {
    const classId = classFilter.value || 1;

    //sementara hardcode dari API spec
    const date = dateFilter.value;

    const result = await getData(
      `api/admin/attendance-monitoring?date=${date}&class_id=${classId}`,
    );

    renderTable(result.data);
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: "Gagal memuat monitoring absensi.",
      confirmButtonColor: "#dc2626",
    });
  }
}

function renderTable(data) {
  tableBody.innerHTML = "";

  if (data.length === 0) {
    tableBody.innerHTML = `
<tr>
<td colspan="6" class="text-center py-6 text-gray-500">
Tidak ada data
</td>
</tr>
`;

    return;
  }

  data.forEach((item) => {
    const keterangan = item.is_submitted
      ? "Sudah Mengisi"
      : "Belum Mengisi Absen";

    let statusClass = "";

    switch (item.status.toLowerCase()) {
      case "hadir":
        statusClass = "bg-green-100 text-green-700";
        break;

      case "izin":
        statusClass = "bg-amber-100 text-amber-700";
        break;

      case "sakit":
        statusClass = "bg-blue-100 text-blue-700";
        break;

      case "alpha":
        statusClass = "bg-red-100 text-red-700";
        break;

      case "belum mulai":
        statusClass = "bg-slate-100 text-slate-600";
        break;

      default:
        statusClass = "bg-[#C3D9E6]/50 text-[#1E3A5F]";
    }

    tableBody.innerHTML += `

<tr class="hover:bg-slate-50 transition">

<td class="px-4 py-4">
${item.lesson_time.order}
</td>

<td class="px-6 py-4">
${item.subject.name}
</td>

<td class="px-6 py-4">
${item.teacher.name}
</td>

<td class="px-6 py-4">

<span class="
px-3 py-1 rounded-full text-sm font-medium
${statusClass}
">

${item.status}

</span>

</td>

<td class="px-6 py-4">
${keterangan}
</td>

<td class="px-6 py-4">

<button
onclick="openAttendanceModal(${item.id})"
 class="text-blue-600 hover:text-blue-800 transition"
title="Edit Absensi"
>
<i data-lucide="pencil" class="w-4 h-4"></i>
</button>

</td>

</tr>

`;
  });
  lucide.createIcons();
}

classFilter.addEventListener("change", loadAttendanceMonitoring);

window.openAttendanceModal = openAttendanceModal;

async function openAttendanceModal(scheduleId) {
  try {
    currentScheduleId = scheduleId;

    currentClassId = classFilter.value || 1;

    const date = dateFilter.value;

    const result = await getData(
      `api/admin/attendance-monitoring/${scheduleId}/detail?date=${date}`,
    );

    renderAttendanceModal(result);

    attendanceModal.classList.remove("hidden");
    attendanceModal.classList.add("flex");
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: "Gagal memuat detail absensi.",
      confirmButtonColor: "#dc2626",
    });
  }
}

function renderAttendanceModal(result) {
  const data = result;

  let studentRows = "";

  data.students.forEach((student, index) => {
    studentRows += `

<div class="
flex items-center justify-between
px-4 py-3 rounded-xl
${index % 2 === 0 ? "bg-[#C3D9E6]/35" : "bg-white"}
">

<div class="font-medium text-slate-700 min-w-[170px]">
${student.name}
</div>


<div class="flex flex-wrap gap-5">

<label class="flex items-center gap-2 text-sm">
<input
type="radio"
name="student_${student.student_id}"
class="student-status"
data-student-id="${student.student_id}"
value="hadir"
${student.status === "hadir" ? "checked" : ""}
>
Hadir
</label>


<label class="flex items-center gap-2 text-sm">
<input
type="radio"
name="student_${student.student_id}"
class="student-status"
data-student-id="${student.student_id}"
value="izin"
${student.status === "izin" ? "checked" : ""}
>
Izin
</label>


<label class="flex items-center gap-2 text-sm">
<input
type="radio"
name="student_${student.student_id}"
class="student-status"
data-student-id="${student.student_id}"
value="sakit"
${student.status === "sakit" ? "checked" : ""}
>
Sakit
</label>


<label class="flex items-center gap-2 text-sm">
<input
type="radio"
name="student_${student.student_id}"
class="student-status"
data-student-id="${student.student_id}"
value="alpha"
${student.status === "alpha" ? "checked" : ""}
>
Alpha
</label>

</div>

</div>

`;
  });

  attendanceModalBody.innerHTML = `

<div class="space-y-8">


<div
class="bg-[#C3D9E6]/30 rounded-2xl p-5"
>

<div class="grid md:grid-cols-2 gap-5 text-sm">

<div>
<div class="text-slate-500">
Kelas
</div>

<div class="font-semibold">
${data.schedule.class.name}
</div>
</div>


<div>
<div class="text-slate-500">
Mapel
</div>

<div class="font-semibold">
${data.schedule.subject.name}
</div>
</div>


<div>
<div class="text-slate-500">
Guru
</div>

<div class="font-semibold">
${data.schedule.teacher.name}
</div>
</div>


<div>
<div class="text-slate-500">
Jam
</div>

<div class="font-semibold">
${data.schedule.lesson_time.name}
</div>
</div>

</div>

</div>



<div>

<label class="block font-semibold mb-4">
Status Guru
</label>


<div class="flex gap-6">

<label
class="
px-5 py-3 rounded-xl bg-[#C3D9E6]/40
flex items-center gap-3 cursor-pointer
"
>

<input
type="radio"
name="teacherStatus"
value="true"
${data.is_teacher_present ? "checked" : ""}
>

Guru Hadir

</label>


<label
class="
px-5 py-3 rounded-xl bg-[#C3D9E6]/40
flex items-center gap-3 cursor-pointer
"
>

<input
type="radio"
name="teacherStatus"
value="false"
${!data.is_teacher_present ? "checked" : ""}
>

Guru Alpha

</label>

</div>

</div>



<div>

<h4 class="font-semibold mb-5">
Absensi Siswa
</h4>

<div class="space-y-1">

${studentRows}

</div>

</div>


</div>

`;
}

function closeAttendanceModal() {
  attendanceModal.classList.add("hidden");
  attendanceModal.classList.remove("flex");
}

closeAttendanceModalBtn.addEventListener("click", closeAttendanceModal);

cancelAttendanceBtn.addEventListener("click", closeAttendanceModal);

saveAttendanceBtn.addEventListener("click", async () => {
  try {
    const teacherStatus =
      document.querySelector('input[name="teacherStatus"]:checked').value ===
      "true";

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

      attendances.push({
        student_id: Number(id),
        status: checked.value,
      });
    });

    const payload = {
      schedule_id: currentScheduleId,

      date: dateFilter.value,

      is_teacher_present: teacherStatus,

      attendances,
    };

    Swal.fire({
      title: "Menyimpan...",
      text: "Mohon tunggu",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    await putData(
      `api/admin/attendance-monitoring?date=${dateFilter.value}&class_id=${currentClassId}`,
      payload,
    );

    Swal.close();

    await Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: "Absensi berhasil diperbarui.",
      confirmButtonColor: "#2563eb",
    });

    closeAttendanceModal();

    loadAttendanceMonitoring();
  } catch (error) {
    console.error(error);

    Swal.close();

    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: error.message || "Gagal menyimpan absensi.",
      confirmButtonColor: "#dc2626",
    });
  }
});
