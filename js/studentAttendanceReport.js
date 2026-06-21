import { getData, downloadFile } from "./core/api.js";

// ================= ELEMENT =================
const periodeType = document.getElementById("periodeType");
const semesterWrapper = document.getElementById("semesterWrapper");
const monthWrapper = document.getElementById("monthWrapper");
const semesterFilter = document.getElementById("filterSemester");
const classFilter = document.getElementById("filterKelas");
const monthFilter = document.getElementById("filterMonth");
const subjectFilter = document.getElementById("filterMapel");
const btnTampilkan = document.getElementById("btnTampilkanData");
const btnExportPDF = document.getElementById("btnExportPDF");
const tableHead = document.querySelector("thead");
const tableBody = document.getElementById("AdminAttendanceTableBody");

// ================= STATE =================
let selectedType = "";
let selectedMonth = {
  month: "",
  year: "",
};

// ================= INIT =================
document.addEventListener("DOMContentLoaded", async () => {
  await loadSemesters();
  await loadClasses();
  await loadPeriods();

  resetSubjectFilter();
});

// ================= LOAD PERIODS (BULAN) =================
async function loadPeriods() {
  try {
    const result = await getData(
      "api/admin/reports/student-attendance/periods",
    );

    monthFilter.innerHTML = `<option value="">Pilih bulan</option>`;

    result.data.forEach((item) => {
      monthFilter.innerHTML += `
        <option value="${item.month}" data-year="${item.year}">
          ${item.label}
        </option>
      `;
    });
  } catch (error) {
    console.error(error);
    Swal.fire("Error", "Gagal load periode", "error");
  }
}

// ================= RESET SUBJECT =================
function resetSubjectFilter() {
  subjectFilter.innerHTML = `<option value="">Semua mapel</option>`;
  // subjectFilter.disabled = true;
}

// ================= LOAD SEMESTER =================
async function loadSemesters() {
  const result = await getData(
    "api/admin/reports/student-attendance/semesters",
  );

  semesterFilter.innerHTML = `<option value="">Pilih semester</option>`;

  result.data.forEach((item) => {
    semesterFilter.innerHTML += `
      <option value="${item.id}">
        ${item.name}
      </option>
    `;
  });
}

// ================= LOAD KELAS =================
async function loadClasses() {
  const result = await getData("api/admin/reports/student-attendance/classes");

  classFilter.innerHTML = `<option value="">Pilih kelas</option>`;

  result.data.forEach((item) => {
    classFilter.innerHTML += `
      <option value="${item.id}">
        ${item.name}
      </option>
    `;
  });

  classFilter.disabled = false;
}

// ================= MODE SWITCH =================
periodeType.addEventListener("change", () => {
  selectedType = periodeType.value;

  semesterWrapper.classList.add("hidden");
  monthWrapper.classList.add("hidden");

  semesterFilter.value = "";
  monthFilter.value = "";
  selectedMonth = { month: "", year: "" };

  resetSubjectFilter();

  if (selectedType === "semester") {
    semesterWrapper.classList.remove("hidden");
  }

  if (selectedType === "month") {
    monthWrapper.classList.remove("hidden");
  }
});

// ================= MONTH SELECT =================
monthFilter.addEventListener("change", () => {
  const opt = monthFilter.options[monthFilter.selectedIndex];

  selectedMonth.month = opt.value;
  selectedMonth.year = opt.dataset.year;

  loadSubjects();
});

// ================= LOAD SUBJECTS =================
async function loadSubjects() {
  if (!classFilter.value) return;

  let endpoint = "";

  if (selectedType === "semester") {
    if (!semesterFilter.value) return;

    endpoint = `api/admin/reports/student-attendance/subjects?semester_id=${semesterFilter.value}&class_id=${classFilter.value}`;
  }

  if (selectedType === "month") {
    if (!selectedMonth.month || !selectedMonth.year) return;

    endpoint = `api/admin/reports/student-attendance/subjects?month=${selectedMonth.month}&year=${selectedMonth.year}&class_id=${classFilter.value}`;
  }

  const result = await getData(endpoint);

  subjectFilter.innerHTML = `<option value="">Semua mapel</option>`;

  result.data.forEach((item) => {
    subjectFilter.innerHTML += `
      <option value="${item.subject_id}">
        ${item.subject_name}
      </option>
    `;
  });

  subjectFilter.disabled = false;
}

// ================= LOAD ON CHANGE =================
semesterFilter.addEventListener("change", loadSubjects);
classFilter.addEventListener("change", () => {
  if (selectedType) {
    loadSubjects();
  }
});

// ================= TAMPILKAN =================
btnTampilkan.addEventListener("click", async () => {
  if (!selectedType) {
    Swal.fire("Warning", "Pilih jenis periode dulu", "warning");
    return;
  }

  if (!classFilter.value) {
    Swal.fire("Warning", "Pilih kelas dulu", "warning");
    return;
  }

  try {
    Swal.fire({ title: "Loading...", didOpen: () => Swal.showLoading() });

    let endpoint = `api/admin/reports/student-attendance?class_id=${classFilter.value}`;

    if (selectedType === "semester") {
      if (!semesterFilter.value) {
        Swal.fire("Warning", "Pilih semester", "warning");
        return;
      }

      endpoint += `&semester_id=${semesterFilter.value}`;
    }

    if (selectedType === "month") {
      if (!selectedMonth.month || !selectedMonth.year) {
        Swal.fire("Warning", "Pilih bulan", "warning");
        return;
      }

      endpoint += `&month=${selectedMonth.month}&year=${selectedMonth.year}`;
    }

    // subject
    if (subjectFilter.value) {
      endpoint += `&subject_id=${subjectFilter.value}`;
    }

    const result = await getData(endpoint);

    Swal.close();

    if (subjectFilter.value) {
      renderSingleSubject(result.data);
    } else {
      renderAllSubjects(result.data);
    }
  } catch (error) {
    console.error(error);
    Swal.fire("Error", error.message, "error");
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
  if (!selectedType) {
    Swal.fire({
      icon: "warning",
      title: "Warning",
      text: "Pilih jenis periode dulu",
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

  if (selectedType === "semester" && !semesterFilter.value) {
    Swal.fire({
      icon: "warning",
      title: "Warning",
      text: "Pilih semester dulu",
    });

    return;
  }

  if (
    selectedType === "month" &&
    (!selectedMonth.month || !selectedMonth.year)
  ) {
    Swal.fire({
      icon: "warning",
      title: "Warning",
      text: "Pilih bulan dulu",
    });

    return;
  }

  try {
    Swal.fire({
      title: "Mengunduh PDF...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    let endpoint = "api/admin/reports/student-attendance/export?";

    // ================= SEMESTER =================
    if (selectedType === "semester") {
      endpoint += `semester_id=${semesterFilter.value}&class_id=${classFilter.value}`;
    }

    // ================= BULAN =================
    if (selectedType === "month") {
      endpoint += `month=${selectedMonth.month}&year=${selectedMonth.year}&class_id=${classFilter.value}`;
    }

    // ================= SUBJECT =================
    if (subjectFilter.value) {
      endpoint += `&subject_id=${subjectFilter.value}`;
    }

    const selectedClass = classFilter.options[classFilter.selectedIndex].text;

    let periodName = "";

    if (selectedType === "semester") {
      periodName = semesterFilter.options[semesterFilter.selectedIndex].text;
    }

    if (selectedType === "month") {
      periodName = monthFilter.options[monthFilter.selectedIndex].text;
    }

    const selectedSubject =
      subjectFilter.options[subjectFilter.selectedIndex]?.text;

    const fileName = subjectFilter.value
      ? `laporan-absensi-${periodName}-${selectedClass}-${selectedSubject}.pdf`
      : `laporan-absensi-${periodName}-${selectedClass}.pdf`;

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
