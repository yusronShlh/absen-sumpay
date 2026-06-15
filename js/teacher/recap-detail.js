import { getData, downloadFile } from "../core/api.js";

import { initNavbar } from "../components/navbar.js";

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
// DATA DARI PAGE SEBELUMNYA
// =======================

// =======================
// GET DATA DARI URL
// =======================

const params = new URLSearchParams(window.location.search);

let subjectId = params.get("subject_id");

let classId = params.get("class_id");

let subjectName = params.get("subject_name");

let className = params.get("class_name");

function loadInfo() {
  if (!subjectId || !classId) {
    return;
  }

  document.getElementById("subjectName").innerText = subjectName || "-";

  document.getElementById("className").innerText = className || "-";
}

// =======================
// SEMESTER
// =======================

async function loadSemester() {
  try {
    const response = await getData("api/teacher/recap/semester");

    const select = document.getElementById("semesterSelect");

    response.data.forEach((item) => {
      select.innerHTML += `

<option value="${item.id}">

${item.name}

</option>

`;
    });
  } catch (err) {
    console.error(err);
  }
}

// =======================
// DETAIL
// =======================

async function loadDetail() {
  const semester = document.getElementById("semesterSelect").value;

  // console.log({
  //   subjectId,
  //   classId,
  //   semester,
  // });

  if (!semester) return;

  try {
    const response = await getData(
      `api/teacher/recap/detail?subject_id=${subjectId}&class_id=${classId}&semester_id=${semester}`,
    );

    // console.log("DETAIL RESPONSE", response);

    const data = response.data;

    document.getElementById("subjectName").innerText = data.subject;

    document.getElementById("className").innerText = data.class;

    renderTable(data);
  } catch (err) {
    console.error(err);

    alert(err.message);
  }
}

// =======================
// EXPORT PDF
// =======================

async function exportPDF() {
  const semester = document.getElementById("semesterSelect").value;

  if (!semester) {
    alert("Silahkan pilih semester terlebih dahulu");
    return;
  }

  try {
    const endpoint = `api/teacher/recap/export-pdf?subject_id=${subjectId}&class_id=${classId}&semester_id=${semester}`;

    await downloadFile(endpoint, `rekap-${subjectName}-${className}.pdf`);
  } catch (err) {
    console.error(err);

    alert("Gagal export PDF");
  }
}

// =======================
// TABLE
// =======================

function renderTable(data) {
  const table = document.getElementById("recapTable");

  const header = document.getElementById("tableHeader");

  header.innerHTML = `

<th class="px-3 py-3 whitespace-nowrap">
Nama Siswa
</th>


${data.meetings
  .map(
    (m) =>
      `
<th class="px-3 py-3 text-center">
${m}
</th>

`,
  )
  .join("")}


<th class="px-3 py-3">
Hadir
</th>


<th class="px-3 py-3">
Izin
</th>


<th class="px-3 py-3">
Sakit
</th>


<th class="px-3 py-3">
Alpha
</th>

`;

  // ROW DATA

  table.innerHTML = data.data
    .map((student) => {
      return `


<tr class="odd:bg-white even:bg-[#C3D9E6]/40">


<td class="px-3 py-3 font-medium">

${student.student_name}

</td>



${student.pertemuan
  .map(
    (status) =>
      `
<td class="px-3 py-3 text-center">

${status}

</td>
`,
  )
  .join("")}



<td class="px-3 py-3 text-center">

${student.hadir}

</td>


<td class="px-3 py-3 text-center">

${student.izin}

</td>


<td class="px-3 py-3 text-center">

${student.sakit}

</td>


<td class="px-3 py-3 text-center">

${student.alpha}

</td>



</tr>


`;
    })
    .join("");

  document.getElementById("tableContainer").classList.remove("hidden");

  document.getElementById("emptyState").classList.add("hidden");
}

function initEvent() {
  document
    .getElementById("semesterSelect")
    .addEventListener("change", loadDetail);

  document.getElementById("btnExportPDF").addEventListener("click", exportPDF);
}

async function init() {
  await loadNavbar();

  loadInfo();

  await loadSemester();

  initEvent();
}

init();
