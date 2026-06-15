import { getData, uploadFile } from "../core/api.js";

import { initNavbar } from "../components/navbar.js";

let schedules = [];

// =======================
// NAVBAR
// =======================

async function loadNavbar() {
  const container = document.getElementById("navbar-container");

  const response = await fetch("../../components/navbar.html");

  container.innerHTML = await response.text();

  initNavbar();
}

// =======================
// LOAD SCHEDULE BY DATE
// =======================

async function loadSchedules() {
  const start = document.getElementById("startDate").value;

  const end = document.getElementById("endDate").value;

  if (!start || !end) return;

  try {
    const response = await getData(
      `api/teacher/teacher-permission/schedules/by-date?start=${start}&end=${end}`,
    );

    schedules = response.data.schedules;

    renderSchedule();
  } catch (err) {
    console.error(err);
  }
}

// =======================
// RENDER MAPEL
// =======================

function renderSchedule() {
  const box = document.getElementById("scheduleBox");

  const list = document.getElementById("scheduleList");

  if (schedules.length === 0) {
    box.classList.add("hidden");
    return;
  }

  box.classList.remove("hidden");

  list.innerHTML = schedules
    .map((item) => {
      const subject = item.TeachingAssignment.Subject.name;

      const kelas = item.TeachingAssignment.Class.name;

      const jam = `${item.LessonTime.start_time.substring(0, 5)}
        -
        ${item.LessonTime.end_time.substring(0, 5)}`;

      return `

<label
class="
flex items-center gap-2
p-2
rounded-lg
bg-slate-50
cursor-pointer
hover:bg-slate-100
transition
"
>


<input

type="checkbox"

class="
scheduleCheck
w-3.5
h-3.5
accent-[#1E3A5F]
shrink-0
"

value="${item.id}"

>


<div class="text-xs md:text-sm">

<p class="font-medium text-gray-700">
${subject}
</p>


<p class="text-xs text-gray-500">
${kelas} • ${jam}
</p>


</div>


</label>

`;
    })
    .join("");

  initScheduleCheckbox();
}

function initScheduleCheckbox() {
  const fullDay = document.getElementById("fullDayCheck");

  const checks = document.querySelectorAll(".scheduleCheck");

  checks.forEach((check) => {
    check.addEventListener("change", () => {
      const anyChecked = [...checks].some((item) => item.checked);

      if (anyChecked) {
        fullDay.checked = false;

        fullDay.disabled = true;
      } else {
        fullDay.disabled = false;
      }
    });
  });

  fullDay.addEventListener("change", () => {
    if (fullDay.checked) {
      checks.forEach((check) => {
        check.checked = false;

        check.disabled = true;
      });
    } else {
      checks.forEach((check) => {
        check.disabled = false;
      });
    }
  });
}

// =======================
// DATE CHANGE
// =======================

function initDate() {
  const start = document.getElementById("startDate");

  const end = document.getElementById("endDate");

  function checkDate() {
    const full = document.getElementById("fullDayBox");

    if (start.value && end.value) {
      if (start.value === end.value) {
        full.classList.remove("hidden");
      } else {
        full.classList.add("hidden");

        document.getElementById("fullDayCheck").checked = true;
      }

      loadSchedules();
    }
  }

  start.addEventListener("change", checkDate);

  end.addEventListener("change", checkDate);
}

// =======================
// SUBMIT
// =======================

async function submitPermission() {
  const start = document.getElementById("startDate").value;

  const end = document.getElementById("endDate").value;

  const reason = document.getElementById("reason").value;

  const fullDay = document.getElementById("fullDayCheck").checked;

  const selectedSchedules = [
    ...document.querySelectorAll(".scheduleCheck:checked"),
  ].map((e) => Number(e.value));

  if (!fullDay && selectedSchedules.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Data belum lengkap",
      text: "Pilih mapel atau pilih izin 1 hari penuh",
      confirmButtonColor: "#1E3A5F",
    });

    return;
  }

  const formData = new FormData();

  formData.append("start_date", start);

  formData.append("end_date", end);

  formData.append("reason", reason);

  formData.append("is_full_day", fullDay);

  // kalau bukan izin full day
  // kirim jadwal

  if (!fullDay) {
    selectedSchedules.forEach((id) => {
      formData.append("schedules[]", id);
    });
  }

  const file = document.getElementById("attachment").files[0];

  if (file) {
    formData.append("letter", file);
  }

  console.log([...formData.entries()]);

  try {
    await uploadFile("api/teacher/teacher-permission", formData);

    await Swal.fire({
      icon: "success",

      title: "Berhasil",

      text: "Pengajuan izin berhasil dikirim",

      confirmButtonColor: "#1E3A5F",
    });

    location.reload();
  } catch (err) {
    Swal.fire({
      icon: "error",

      title: "Gagal",

      text: err.message || "Terjadi kesalahan",

      confirmButtonColor: "#1E3A5F",
    });
  }
}

// =======================
// FILE PREVIEW
// =======================

function initFilePreview() {
  const input = document.getElementById("attachment");

  const preview = document.getElementById("previewImage");

  const fileName = document.getElementById("fileName");

  const fileInfo = document.getElementById("fileInfo");

  const icon = document.getElementById("uploadIcon");

  const remove = document.getElementById("removeFile");

  input.addEventListener("change", () => {
    const file = input.files[0];

    if (!file) {
      return;
    }

    fileName.textContent = file.name;

    fileInfo.textContent = `${(file.size / 1024).toFixed(1)} KB`;

    remove.classList.remove("hidden");

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();

      reader.onload = (e) => {
        preview.src = e.target.result;

        preview.classList.remove("hidden");

        icon.classList.add("hidden");
      };

      reader.readAsDataURL(file);
    }
  });

  remove.addEventListener("click", (e) => {
    e.preventDefault();

    input.value = "";

    preview.src = "";

    preview.classList.add("hidden");

    icon.classList.remove("hidden");

    fileName.textContent = "Klik untuk upload bukti izin";

    fileInfo.textContent = "";

    remove.classList.add("hidden");
  });
}

function initEvent() {
  document
    .getElementById("submitPermission")
    .addEventListener("click", submitPermission);
}

async function init() {
  await loadNavbar();

  initDate();

  initEvent();
  initFilePreview();
}

init();
