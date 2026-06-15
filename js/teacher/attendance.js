import { getData, postData } from "../core/api.js";
import { initNavbar } from "../components/navbar.js";

let selectedSchedule = null;
let students = [];

// =======================
// LOAD NAVBAR
// =======================

async function loadNavbar() {
  const container = document.getElementById("navbar-container");

  const response = await fetch("../../components/navbar.html");

  container.innerHTML = await response.text();

  initNavbar();
}

// =======================
// LOAD SCHEDULE
// =======================

async function loadSchedules() {
  try {
    const response = await getData("api/teacher/schedules");

    const select = document.getElementById("scheduleSelect");

    response.data.forEach((item) => {
      const option = document.createElement("option");

      const subject = item.TeachingAssignment.Subject.name;

      const kelas = item.TeachingAssignment.Class.name;

      const jam = `${item.LessonTime.start_time.substring(0, 5)}
        -
        ${item.LessonTime.end_time.substring(0, 5)}`;

      option.value = item.id;

      option.textContent = `${subject} - ${kelas} (${jam})`;

      select.appendChild(option);
    });
  } catch (error) {
    console.error(error);
  }
}

// =======================
// LOAD STUDENTS
// =======================

async function loadStudents(scheduleId) {
  try {
    const response = await getData(
      `api/teacher/schedules/${scheduleId}/students`,
    );

    students = response.data.students;

    renderStudents();
  } catch (error) {
    console.error(error);
  }
}

// =======================
// RENDER STUDENTS
// =======================

function renderStudents() {
  const tbody = document.getElementById("studentTable");

  if (!students || students.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3"
          class="text-center py-5 text-gray-400">
          Tidak ada siswa
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = students
    .map((student, index) => {
      const status = student.status;

      return `
<tr class="odd:bg-white even:bg-[#C3D9E6]/40">


<td class="px-2 md:px-4 py-3 text-xs md:text-sm">
${index + 1}
</td>


<td class="px-2 md:px-4 py-3 font-medium text-xs md:text-sm">
${student.name}
</td>



<td class="px-2 md:px-4 py-3">

<div 
class="flex flex-wrap justify-center items-center gap-2 md:gap-4 text-[11px] md:text-sm whitespace-nowrap">


<label class="cursor-pointer flex items-center gap-1">

<input

type="radio"

name="student-${student.id}"

value="hadir"

data-id="${student.id}"

class="studentStatus w-3 h-3 md:w-4 md:h-4"

${status === "hadir" ? "checked" : ""}

>

<span>Hadir</span>

</label>




<label class="cursor-pointer flex items-center gap-1">

<input

type="radio"

name="student-${student.id}"

value="izin"

data-id="${student.id}"

class="studentStatus w-3 h-3 md:w-4 md:h-4"

${status === "izin" ? "checked" : ""}

>

<span>Izin</span>

</label>




<label class="cursor-pointer flex items-center gap-1">

<input

type="radio"

name="student-${student.id}"

value="sakit"

data-id="${student.id}"

class="studentStatus w-3 h-3 md:w-4 md:h-4"

${status === "sakit" ? "checked" : ""}

>

<span>Sakit</span>

</label>




<label class="cursor-pointer flex items-center gap-1">

<input

type="radio"

name="student-${student.id}"

value="alpha"

data-id="${student.id}"

class="studentStatus w-3 h-3 md:w-4 md:h-4"

${status === "alpha" ? "checked" : ""}

>

<span>Alpha</span>

</label>


</div>


</td>


</tr>
`;
    })
    .join("");
}

// =======================
// SUBMIT ATTENDANCE
// =======================

async function submitAttendance() {
  if (!selectedSchedule) {
    Swal.fire({
      icon: "warning",
      title: "Jadwal belum dipilih",
      text: "Silakan pilih jadwal terlebih dahulu",
      confirmButtonColor: "#1E3A5F",
    });

    return;
  }

  const selected = document.querySelectorAll(".studentStatus:checked");

  const attendances = Array.from(selected).map((radio) => {
    return {
      student_id: Number(radio.dataset.id),
      status: radio.value,
    };
  });

  if (attendances.length !== students.length) {
    Swal.fire({
      icon: "warning",
      title: "Absensi belum lengkap",
      text: "Harap isi absensi semua siswa",
      confirmButtonColor: "#1E3A5F",
    });

    return;
  }

  try {
    Swal.fire({
      title: "Menyimpan absensi...",
      text: "Mohon tunggu",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    await postData("api/teacher/attendance", {
      schedule_id: Number(selectedSchedule),
      attendances,
    });

    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: "Absensi berhasil disimpan",
      confirmButtonColor: "#1E3A5F",
    });
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Gagal menyimpan",
      text: error.message || "Terjadi kesalahan",
      confirmButtonColor: "#1E3A5F",
    });
  }
}

// =======================
// EVENT
// =======================

function initEvent() {
  const select = document.getElementById("scheduleSelect");

  select.addEventListener("change", async (e) => {
    selectedSchedule = e.target.value;

    students = [];

    if (selectedSchedule) {
      await loadStudents(selectedSchedule);
    }
  });

  document
    .getElementById("submitAttendance")
    .addEventListener("click", submitAttendance);
}

// =======================
// INIT
// =======================

async function init() {
  await loadNavbar();

  await loadSchedules();

  initEvent();
}

init();
