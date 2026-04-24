import { getData } from "./core/api.js";

const classFilter = document.getElementById("filterKelas");
const subjectFilter = document.getElementById("filterMapel");
const btnTampilkan = document.getElementById("btnTampilkanData");

const tableHead = document.querySelector("thead");
const tableBody = document.getElementById("AdminAttendanceTableBody");

document.addEventListener("DOMContentLoaded", async () => {
  await loadClasses();

  subjectFilter.innerHTML = `<option value="">Pilih mapel</option>`;
  subjectFilter.disabled = true;
});

// ================= LOAD KELAS =================
async function loadClasses() {
  try {
    const result = await getData(
      "api/admin/reports/student-attendance/classes",
    );

    classFilter.innerHTML = `<option value="">Pilih kelas</option>`;

    result.data.forEach((item) => {
      classFilter.innerHTML += `
        <option value="${item.id}">
          ${item.name}
        </option>
      `;
    });
  } catch (error) {
    console.error(error);
    Swal.fire("Error", "Gagal load kelas", "error");
  }
}

// ================= LOAD MAPEL =================
classFilter.addEventListener("change", async () => {
  if (!classFilter.value) {
    subjectFilter.innerHTML = `<option value="">Pilih mapel</option>`;
    subjectFilter.disabled = true;
  }
  subjectFilter.disabled = false;

  try {
    const result = await getData(
      `api/admin/reports/student-attendance/subjects?class_id=${classFilter.value}`,
    );

    subjectFilter.innerHTML = `<option value="">Pilih mapel</option>`;

    result.data.forEach((item) => {
      subjectFilter.innerHTML += `
        <option value="${item.subject_id}">
          ${item.subject_name}
        </option>
      `;
    });
  } catch (error) {
    console.error(error);
    Swal.fire("Error", "Gagal load mapel", "error");
  }
});

// ================= FETCH DATA =================
btnTampilkan.addEventListener("click", async () => {
  if (!classFilter.value) {
    Swal.fire("Warning", "Pilih kelas dulu", "warning");
    return;
  }

  try {
    Swal.fire({
      title: "Memuat...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    let endpoint = `api/admin/reports/student-attendance?class_id=${classFilter.value}`;

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

// ================= RENDER: ALL SUBJECT =================
function renderAllSubjects(data) {
  const subjects = data.subjects;

  // ====== HEADER ======
  tableHead.innerHTML = `
    <tr>
      <th class="px-4 py-3 text-center">No</th>
      <th class="px-6 py-3 text-center">Nama</th>
      <th colspan="${subjects.length}" class="px-6 py-3 text-center">
        Mata Pelajaran
      </th>
    </tr>
    <tr>
      <th></th>
      <th></th>
      ${subjects
        .map((s) => `<th class="px-4 py-2 text-center capitalize">${s}</th>`)
        .join("")}
    </tr>
  `;

  // ====== BODY ======
  tableBody.innerHTML = "";

  data.data.forEach((student, index) => {
    let row = `
      <tr>
        <td class="text-center py-3">${index + 1}</td>
        <td class="text-center">${student.name}</td>
    `;

    subjects.forEach((subj) => {
      row += `
        <td class="text-center">${student[subj] ?? 0}</td>
      `;
    });

    row += `</tr>`;

    tableBody.innerHTML += row;
  });
}

// ================= RENDER: SINGLE SUBJECT =================
function renderSingleSubject(data) {
  // ====== HEADER ======
  tableHead.innerHTML = `
    <tr>
      <th rowspan="2" class="px-4 py-3 text-center">No</th>
      <th rowspan="2" class="px-6 py-3 text-center">Nama</th>
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

  // ====== BODY ======
  tableBody.innerHTML = "";

  data.data.forEach((student, index) => {
    tableBody.innerHTML += `
      <tr>
        <td class="text-center py-3">${index + 1}</td>
        <td class="text-center">${student.name}</td>
        <td class="text-center">${student.total}</td>
        <td class="text-center">${student.hadir}</td>
        <td class="text-center">${student.izin}</td>
        <td class="text-center">${student.sakit}</td>
        <td class="text-center">${student.alpha}</td>
      </tr>
    `;
  });
}
