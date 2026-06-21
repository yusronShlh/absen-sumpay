import { getData, downloadFile } from "./core/api.js";

const periodeType = document.getElementById("periodeType");
const semesterFilter = document.getElementById("filterSemester");
const monthFilter = document.getElementById("filterMonth");
const semesterWrapper = document.getElementById("semesterWrapper");
const monthWrapper = document.getElementById("monthWrapper");
const teacherFilter = document.getElementById("filterGuru");
const btnTampilkan = document.getElementById("btnTampilkanData");
const btnExportPDF = document.getElementById("btnExportPDF");
let selectedType = "";

let selectedMonth = {
  month: "",
  year: "",
};

const tableHead = document.querySelector("thead");
const tableBody = document.getElementById("AdminAttendanceTableBody");

document.addEventListener("DOMContentLoaded", async () => {
  await loadSemesters();
  await loadPeriods();

  teacherFilter.innerHTML = `<option value="">Pilih guru</option>`;
  teacherFilter.disabled = true;
});

async function loadPeriods() {
  try {
    const result = await getData(
      "api/admin/reports/teacher-attendance/periods",
    );

    monthFilter.innerHTML = `
      <option value="">Pilih bulan</option>
    `;

    result.data.forEach((item) => {
      monthFilter.innerHTML += `
        <option 
          value="${item.month}"
          data-year="${item.year}"
        >
          ${item.label}
        </option>
      `;
    });
  } catch (error) {
    console.error(error);

    Swal.fire("Error", "Gagal load periode", "error");
  }
}

// ================= LOAD SEMESTER =================
async function loadSemesters() {
  try {
    const result = await getData(
      "api/admin/reports/teacher-attendance/semesters",
    );

    semesterFilter.innerHTML = `<option value="">Pilih semester</option>`;

    result.data.forEach((item) => {
      semesterFilter.innerHTML += `
        <option value="${item.id}">
          ${item.name}
        </option>
      `;
    });
  } catch (error) {
    console.error(error);
    Swal.fire("Error", "Gagal load semester", "error");
  }
}

periodeType.addEventListener("change", () => {
  selectedType = periodeType.value;

  semesterWrapper.classList.add("hidden");
  monthWrapper.classList.add("hidden");

  teacherFilter.disabled = true;
  teacherFilter.innerHTML = `<option value="">Pilih guru</option>`;

  selectedMonth = {
    month: "",
    year: "",
  };

  if (selectedType === "semester") {
    semesterWrapper.classList.remove("hidden");
  }

  if (selectedType === "month") {
    monthWrapper.classList.remove("hidden");
  }
});

// ================= LOAD GURU =================
async function loadTeachers() {
  let endpoint = "";

  if (selectedType === "semester") {
    if (!semesterFilter.value) return;

    endpoint = `api/admin/reports/teacher-attendance/teachers?semester_id=${semesterFilter.value}`;
  }

  if (selectedType === "month") {
    if (!selectedMonth.month || !selectedMonth.year) return;

    endpoint = `api/admin/reports/teacher-attendance/teachers?month=${selectedMonth.month}&year=${selectedMonth.year}`;
  }

  try {
    const result = await getData(endpoint);

    teacherFilter.innerHTML = `<option value="">Pilih guru</option>`;

    result.data.forEach((item) => {
      teacherFilter.innerHTML += `
 <option value="${item.id}">
 ${item.name}
 </option>
 `;
    });

    teacherFilter.disabled = false;
  } catch (error) {
    console.error(error);

    Swal.fire("Error", "Gagal load guru", "error");
  }
}

semesterFilter.addEventListener("change", loadTeachers);

semesterFilter.addEventListener("change", loadTeachers);

monthFilter.addEventListener("change", () => {
  const selectedOption = monthFilter.options[monthFilter.selectedIndex];

  selectedMonth.month = selectedOption.value;

  selectedMonth.year = selectedOption.dataset.year;

  loadTeachers();
});

// ================= FETCH DATA =================
btnTampilkan.addEventListener("click", async () => {
  // cek jenis periode
  if (selectedType === "") {
    Swal.fire("Warning", "Pilih jenis periode terlebih dahulu", "warning");
    return;
  }

  // cek semester
  if (selectedType === "semester" && !semesterFilter.value) {
    Swal.fire("Warning", "Pilih semester dulu", "warning");
    return;
  }

  // cek bulan
  if (
    selectedType === "month" &&
    (!selectedMonth.month || !selectedMonth.year)
  ) {
    Swal.fire("Warning", "Pilih bulan dulu", "warning");
    return;
  }

  try {
    Swal.fire({
      title: "Memuat...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    let endpoint = "api/admin/reports/teacher-attendance?";

    // ================= SEMESTER =================
    if (selectedType === "semester") {
      endpoint += `semester_id=${semesterFilter.value}`;
    }

    // ================= BULAN =================
    if (selectedType === "month") {
      endpoint += `month=${selectedMonth.month}&year=${selectedMonth.year}`;
    }

    // ================= GURU =================
    if (teacherFilter.value) {
      endpoint += `&teacher_id=${teacherFilter.value}`;
    }

    const result = await getData(endpoint);

    Swal.close();

    // detail guru
    if (teacherFilter.value) {
      renderDetailGuru(result.data.data);
    }
    // semua guru
    else {
      renderSummaryGuru(result.data);
    }
  } catch (error) {
    console.error(error);

    Swal.fire("Error", error.message, "error");
  }
});

// ================= MODE 1: SEMUA GURU =================
function renderSummaryGuru(data) {
  // HEADER
  tableHead.innerHTML = `
    <tr>
      <th rowspan="2" class="px-4 py-3 text-center">No</th>
      <th rowspan="2" class="px-6 py-3 text-center">Nama Guru</th>
      <th colspan="4" class="px-6 py-3 text-center">Keterangan</th>
    </tr>
    <tr>
      <th class="px-4 py-2 text-center">Total</th>
      <th class="px-4 py-2 text-center">Hadir</th>
      <th class="px-4 py-2 text-center">Izin</th>
      <th class="px-4 py-2 text-center">Alpha</th>
    </tr>
  `;

  // BODY
  tableBody.innerHTML = "";

  data.forEach((teacher, index) => {
    tableBody.innerHTML += `
      <tr>
        <td class="text-center py-3">${index + 1}</td>
        <td class="text-center">${teacher.teacher_name}</td>
        <td class="text-center">${teacher.total_pertemuan}</td>
        <td class="text-center">${teacher.hadir}</td>
        <td class="text-center">${teacher.izin}</td>
        <td class="text-center">${teacher.alpha}</td>
      </tr>
    `;
  });
}

// ================= MODE 2: DETAIL GURU =================
function renderDetailGuru(data) {
  // HEADER
  tableHead.innerHTML = `
    <tr>
      <th rowspan="2" class="px-4 py-3 text-center">No</th>
      <th rowspan="2" class="px-6 py-3 text-center">Mata Pelajaran</th>
      <th colspan="4" class="px-6 py-3 text-center">Keterangan</th>
    </tr>
    <tr>
      <th class="px-4 py-2 text-center">Total</th>
      <th class="px-4 py-2 text-center">Hadir</th>
      <th class="px-4 py-2 text-center">Izin</th>
      <th class="px-4 py-2 text-center">Alpha</th>
    </tr>
  `;

  // BODY
  tableBody.innerHTML = "";

  data.forEach((item) => {
    const isTotal = item.subject === "TOTAL";

    tableBody.innerHTML += `
      <tr class="${isTotal ? "bg-slate-100 font-bold" : ""}">
        <td class="text-center py-3">${item.no ?? ""}</td>
        <td class="text-center">${item.subject}</td>
        <td class="text-center">${item.total_pertemuan}</td>
        <td class="text-center">${item.hadir}</td>
        <td class="text-center">${item.izin}</td>
        <td class="text-center">${item.alpha}</td>
      </tr>
    `;
  });
}

// ================= EXPORT PDF =================
btnExportPDF.addEventListener("click", async () => {
  // validasi periode
  if (selectedType === "") {
    Swal.fire("Warning", "Pilih jenis periode terlebih dahulu", "warning");
    return;
  }

  // validasi semester
  if (selectedType === "semester" && !semesterFilter.value) {
    Swal.fire("Warning", "Pilih semester dulu", "warning");
    return;
  }

  // validasi bulan
  if (
    selectedType === "month" &&
    (!selectedMonth.month || !selectedMonth.year)
  ) {
    Swal.fire("Warning", "Pilih bulan dan tahun dulu", "warning");
    return;
  }

  try {
    Swal.fire({
      title: "Mengunduh PDF...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    let endpoint = "api/admin/reports/teacher-attendance/export?";

    // ================= SEMESTER =================
    if (selectedType === "semester") {
      endpoint += `semester_id=${semesterFilter.value}`;
    }

    // ================= BULAN =================
    if (selectedType === "month") {
      endpoint += `month=${selectedMonth.month}&year=${selectedMonth.year}`;
    }

    // jika pilih guru
    if (teacherFilter.value) {
      endpoint += `&teacher_id=${teacherFilter.value}`;
    }

    await downloadFile(endpoint, "laporan-absensi-guru.pdf");

    Swal.close();
  } catch (error) {
    console.error(error);

    Swal.fire("Error", error.message, "error");
  }
});
