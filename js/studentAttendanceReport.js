import { getData, downloadFile } from "./core/api.js";

// ================= ELEMENT =================
const semesterFilter = document.getElementById("filterSemester");
const classFilter = document.getElementById("filterKelas");
const subjectFilter = document.getElementById("filterMapel");

const btnTampilkan = document.getElementById("btnTampilkanData");
const btnExportPDF = document.getElementById("btnExportPDF");

const tableHead = document.querySelector("thead");
const tableBody = document.getElementById("AdminAttendanceTableBody");

// ================= INIT =================
document.addEventListener("DOMContentLoaded", async () => {
  await loadSemesters();
  await loadClasses();

  classFilter.disabled = false; // 🔥 FIX PENTING
  resetSubjectFilter();
});

// ================= RESET MAPEL =================
function resetSubjectFilter() {
  subjectFilter.innerHTML = `
    <option value="">Semua mapel</option>
     subjectFilter.disabled = true;
  `;

  subjectFilter.disabled = true;
}

// ================= LOAD SEMESTER =================
async function loadSemesters() {
  try {
    const result = await getData(
      "api/admin/reports/student-attendance/semesters",
    );

    semesterFilter.innerHTML = `
      <option value="">Pilih semester</option>
    `;

    result.data.forEach((item) => {
      semesterFilter.innerHTML += `
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
      text: "Gagal load semester",
    });
  }
}

// ================= LOAD KELAS =================
async function loadClasses() {
  try {
    const result = await getData(
      "api/admin/reports/student-attendance/classes",
    );

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

    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: "Gagal load kelas",
    });
  }
}

// ================= LOAD MAPEL =================
async function loadSubjects() {
  if (!semesterFilter.value || !classFilter.value) {
    resetSubjectFilter();
    return;
  }

  try {
    subjectFilter.disabled = true;

    const result = await getData(
      `api/admin/reports/student-attendance/subjects?semester_id=${semesterFilter.value}&class_id=${classFilter.value}`,
    );

    subjectFilter.innerHTML = `
      <option value="">Semua mapel</option>
    `;

    result.data.forEach((item) => {
      subjectFilter.innerHTML += `
        <option value="${item.subject_id}">
          ${item.subject_name}
        </option>
      `;
    });

    subjectFilter.disabled = false;
  } catch (error) {
    console.error(error);

    resetSubjectFilter();

    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: "Gagal load mapel",
    });
  }
}

// ================= EVENT FILTER =================
semesterFilter.addEventListener("change", async () => {
  resetSubjectFilter();

  if (semesterFilter.value && classFilter.value) {
    await loadSubjects();
  }
});

classFilter.addEventListener("change", async () => {
  resetSubjectFilter();

  if (semesterFilter.value && classFilter.value) {
    await loadSubjects();
  }
});

// ================= FETCH DATA =================
btnTampilkan.addEventListener("click", async () => {
  if (!semesterFilter.value) {
    Swal.fire({
      icon: "warning",
      title: "Warning",
      text: "Pilih semester dulu",
    });

    return;
  }

  if (!classFilter.value) {
    Swal.fire({
      icon: "warning",
      title: "Warning",
      text: "Pilih kelas dulu",
    });

    return;
  }

  try {
    Swal.fire({
      title: "Memuat data...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    let endpoint = `
      api/admin/reports/student-attendance?semester_id=${semesterFilter.value}&class_id=${classFilter.value}
    `.replace(/\s/g, "");

    // jika pilih mapel tertentu
    if (subjectFilter.value) {
      endpoint += `&subject_id=${subjectFilter.value}`;
    }

    const result = await getData(endpoint);

    Swal.close();

    // render sesuai mode
    if (subjectFilter.value) {
      renderSingleSubject(result.data);
    } else {
      renderAllSubjects(result.data);
    }
  } catch (error) {
    console.error(error);

    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: error.message,
    });
  }
});

// ================= RENDER ALL SUBJECT =================
function renderAllSubjects(data) {
  const subjects = data.subjects || [];

  // ===== HEADER =====
  tableHead.innerHTML = `
  <tr>
    <th rowspan="2" class="px-4 py-3 text-center align-middle border-r border-gray-200">
      No
    </th>

    <th rowspan="2" class="px-6 py-3 text-center align-middle border-r border-gray-200">
      Nama
    </th>

    <th colspan="${subjects.length}" class="px-6 py-3 text-center">
      Mata Pelajaran
    </th>
  </tr>

  <tr>
    ${subjects
      .map(
        (subject) => `
          <th class="px-4 py-2 text-center capitalize whitespace-nowrap">
            ${subject}
          </th>
        `,
      )
      .join("")}
  </tr>
`;

  // ===== BODY =====
  tableBody.innerHTML = "";

  // empty state
  if (!data.data || data.data.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8 text-gray-500">
          Data tidak tersedia
        </td>
      </tr>
    `;

    return;
  }

  data.data.forEach((student, index) => {
    let row = `
      <tr class="border-b border-gray-100 hover:bg-slate-50">
        <td class="text-center py-3">
          ${index + 1}
        </td>

        <td class="text-center">
          ${student.name}
        </td>
    `;

    subjects.forEach((subject) => {
      row += `
        <td class="text-center">
          ${student[subject] ?? 0}
        </td>
      `;
    });

    row += `</tr>`;

    tableBody.innerHTML += row;
  });
}

// ================= RENDER SINGLE SUBJECT =================
function renderSingleSubject(data) {
  // ===== HEADER =====
  tableHead.innerHTML = `
    <tr>
      <th rowspan="2" class="px-4 py-3 text-center border-r border-gray-200">
        No
      </th>

      <th rowspan="2" class="px-6 py-3 text-center border-r border-gray-200">
        Nama
      </th>

      <th colspan="5" class="px-6 py-3 text-center">
        Keterangan (${data.subject})
      </th>
    </tr>

    <tr>
      <th class="px-4 py-2 text-center">Total</th>
      <th class="px-4 py-2 text-center">Hadir</th>
      <th class="px-4 py-2 text-center">Izin</th>
      <th class="px-4 py-2 text-center">Sakit</th>
      <th class="px-4 py-2 text-center">Alpha</th>
    </tr>
  `;

  // ===== BODY =====
  tableBody.innerHTML = "";

  // empty state
  if (!data.data || data.data.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-8 text-gray-500">
          Data tidak tersedia
        </td>
      </tr>
    `;

    return;
  }

  data.data.forEach((student, index) => {
    tableBody.innerHTML += `
      <tr class="border-b border-gray-100 hover:bg-slate-50">
        <td class="text-center py-3">
          ${index + 1}
        </td>

        <td class="text-center">
          ${student.name}
        </td>

        <td class="text-center">
          ${student.total}
        </td>

        <td class="text-center">
          ${student.hadir}
        </td>

        <td class="text-center">
          ${student.izin}
        </td>

        <td class="text-center">
          ${student.sakit}
        </td>

        <td class="text-center">
          ${student.alpha}
        </td>
      </tr>
    `;
  });
}

// ================= EXPORT PDF =================
btnExportPDF.addEventListener("click", async () => {
  if (!semesterFilter.value) {
    Swal.fire({
      icon: "warning",
      title: "Warning",
      text: "Pilih semester dulu",
    });

    return;
  }

  if (!classFilter.value) {
    Swal.fire({
      icon: "warning",
      title: "Warning",
      text: "Pilih kelas dulu",
    });

    return;
  }

  try {
    Swal.fire({
      title: "Mengunduh PDF...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    let endpoint = `
      api/admin/reports/student-attendance/export?semester_id=${semesterFilter.value}&class_id=${classFilter.value}
    `.replace(/\s/g, "");

    // jika pilih mapel tertentu
    if (subjectFilter.value) {
      endpoint += `&subject_id=${subjectFilter.value}`;
    }

    const selectedSemester =
      semesterFilter.options[semesterFilter.selectedIndex].text;

    const selectedClass = classFilter.options[classFilter.selectedIndex].text;

    const selectedSubject =
      subjectFilter.options[subjectFilter.selectedIndex]?.text;

    const fileName = subjectFilter.value
      ? `laporan-absensi-${selectedSemester}-${selectedClass}-${selectedSubject}.pdf`
      : `laporan-absensi-${selectedSemester}-${selectedClass}.pdf`;

    await downloadFile(endpoint, fileName);

    Swal.close();
  } catch (error) {
    console.error(error);

    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: error.message,
    });
  }
});
