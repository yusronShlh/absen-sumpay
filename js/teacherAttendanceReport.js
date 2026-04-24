import { getData } from "./core/api.js";

const semesterFilter = document.getElementById("filterPeriode");
const teacherFilter = document.getElementById("filterGuru");
const btnTampilkan = document.getElementById("btnTampilkanData");

const tableHead = document.querySelector("thead");
const tableBody = document.getElementById("AdminAttendanceTableBody");

document.addEventListener("DOMContentLoaded", async () => {
  await loadSemesters();

  teacherFilter.innerHTML = `<option value="">Pilih guru</option>`;
  teacherFilter.disabled = true;
});

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

// ================= LOAD GURU =================
semesterFilter.addEventListener("change", async () => {
  if (!semesterFilter.value) {
    teacherFilter.innerHTML = `<option value="">Pilih guru</option>`;
    teacherFilter.disabled = true;
    return;
  }

  // 🟢 kalau sudah pilih semester
  teacherFilter.disabled = false;

  try {
    const result = await getData(
      `api/admin/reports/teacher-attendance/teachers?semester_id=${semesterFilter.value}`,
    );

    teacherFilter.innerHTML = `<option value="">Pilih guru</option>`;

    result.data.forEach((item) => {
      teacherFilter.innerHTML += `
        <option value="${item.id}">
          ${item.name}
        </option>
      `;
    });
  } catch (error) {
    console.error(error);
    Swal.fire("Error", "Gagal load guru", "error");
  }
});

// ================= FETCH DATA =================
btnTampilkan.addEventListener("click", async () => {
  if (!semesterFilter.value) {
    Swal.fire("Warning", "Pilih semester dulu", "warning");
    return;
  }

  try {
    Swal.fire({
      title: "Memuat...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    let endpoint = `api/admin/reports/teacher-attendance?semester_id=${semesterFilter.value}`;

    if (teacherFilter.value) {
      endpoint += `&teacher_id=${teacherFilter.value}`;
    }

    const result = await getData(endpoint);

    Swal.close();

    if (teacherFilter.value) {
      renderDetailGuru(result.data);
    } else {
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
