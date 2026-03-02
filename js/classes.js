import { getData, postData, putData, deleteData } from "./core/api.js";

let teachers = [];
let classes = [];

async function fetchTeachers() {
  try {
    const result = await getData("api/admin/classes/select/teachers");

    // Sesuaikan dengan response backend kamu
    // Kalau backend return { teachers: [...] }
    teachers = result.teachers || result.data || result;

    console.log("Teachers loaded:", teachers);
  } catch (error) {
    console.error("Gagal mengambil data guru:", error);
  }
}

async function fetchClasses() {
  try {
    const result = await getData("api/admin/classes");

    // backend return { meta, classes }
    classes = result.classes;

    renderTable();
  } catch (error) {
    console.error("Gagal mengambil data kelas:", error);
  }
}
// ===============================
// RENDER TABLE
// ===============================

function renderTable() {
  const tbody = document.getElementById("classTableBody");
  tbody.innerHTML = "";

  classes.forEach((cls, index) => {
    const row = `
  <tr class="hover:bg-slate-50 transition">
    <td class="px-3 py-3 md:px-6 md:py-4 text-slate-600 text-sm">
      ${index + 1}
    </td>

    <td class="px-3 py-3 md:px-6 md:py-4 font-medium text-slate-800 text-sm">
      ${cls.name}
    </td>

    <td class="px-3 py-3 md:px-6 md:py-4 text-slate-600 text-sm">
      ${cls.homeroomTeacher?.name || "-"}
    </td>

    <td class="px-3 py-3 md:px-6 md:py-4 text-center">
      <div class="flex justify-center items-center gap-1 md:gap-3">
        
        <button 
          onclick="showDetail(${cls.id})"
          class="p-1.5 md:p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition"
          title="Detail">
          <i data-lucide="eye" class="w-4 h-4"></i>
        </button>

        <button 
          onclick="showEdit(${cls.id})"
          class="p-1.5 md:p-2 rounded-lg hover:bg-yellow-50 text-blue-500 transition"
          title="Edit">
          <i data-lucide="pencil" class="w-4 h-4"></i>
        </button>

        <button 
          onclick="deleteClass(${cls.id})"
          class="p-1.5 md:p-2 rounded-lg hover:bg-red-50 text-blue-500 transition"
          title="Hapus">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>

      </div>
    </td>
  </tr>
`;

    tbody.innerHTML += row;
  });

  lucide.createIcons();
}
// Jalankan saat halaman load
// document.addEventListener("DOMContentLoaded", fetchClasses);

// ===============================
// ADD CLASS
// ===============================

window.showAddModal = showAddModal;

async function showAddModal() {
  if (teachers.length === 0) {
    await fetchTeachers();
  }
  const teacherOptions = teachers
    .map((t) => `<option value="${t.id}">${t.name}</option>`)
    .join("");

  Swal.fire({
    title: "Tambah Kelas",
    html: `
    <div class="flex flex-col gap-3 text-left">
      
      <div>
        <label class="block text-xs font-medium text-slate-600 mb-1">
          Nama Kelas
        </label>
        <input 
          id="className"
          class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
          placeholder="Contoh: 10 IPA 1"
        >
      </div>

      <div>
        <label class="block text-xs font-medium text-slate-600 mb-1">
          Wali Kelas
        </label>
        <select 
          id="teacherSelect"
          class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
        >
          <option value="">Pilih Wali Kelas</option>
          ${teacherOptions}
        </select>
      </div>

    </div>
  `,
    confirmButtonText: "Simpan",
    confirmButtonColor: "#1E3A5F",
    focusConfirm: false,

    customClass: {
      popup:
        "w-[88%] max-w-[320px] sm:max-w-sm md:max-w-md p-3 sm:p-5 md:p-6 rounded-xl",
      title: "text-base sm:text-lg font-semibold text-[#1E3A5F]",
      htmlContainer: "px-0",
      actions: "mt-4",
      confirmButton: "px-4 py-2 text-sm rounded-lg",
    },

    preConfirm: () => {
      const name = document.getElementById("className").value;
      const teacherId = document.getElementById("teacherSelect").value;

      if (!name || !teacherId) {
        Swal.showValidationMessage("Semua field wajib diisi");
        return false;
      }

      return { name, teacherId };
    },
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await postData("api/admin/classes", {
          name: result.value.name,
          homeroomTeacherId: Number(result.value.teacherId),
        });

        await fetchClasses(); // refresh dari server

        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Kelas berhasil ditambahkan",
          confirmButtonColor: "#1E3A5F",
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: "Tidak bisa menambahkan kelas",
        });
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await fetchTeachers();
  await fetchClasses();
});

// ===========
// EDIT KELAS
// ==========
window.showEdit = showEdit;

async function showEdit(id) {
  const cls = classes.find((c) => c.id === id);

  if (!cls) return;

  // Kalau homeroomTeacher null, amanin
  const selectedTeacherId = cls.homeroomTeacher?.id || "";

  const teacherOptions = teachers
    .map(
      (t) =>
        `<option value="${t.id}" ${
          t.id === selectedTeacherId ? "selected" : ""
        }>
          ${t.name}
        </option>`,
    )
    .join("");

  const result = await Swal.fire({
    title: "Edit Kelas",
    html: `
      <div class="flex flex-col gap-4 text-left">
        
        <div>
          <label class="block text-sm font-medium text-slate-600 mb-1">
            Nama Kelas
          </label>
          <input 
            id="className"
            value="${cls.name}"
            class="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-600 mb-1">
            Wali Kelas
          </label>
          <select 
            id="teacherSelect"
            class="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
          >
            <option value="">Pilih Wali Kelas</option>
            ${teacherOptions}
          </select>
        </div>

      </div>
    `,
    confirmButtonText: "Simpan Perubahan",
    confirmButtonColor: "#1E3A5F",
    focusConfirm: false,
    preConfirm: () => {
      const name = document.getElementById("className").value.trim();
      const teacherId = document.getElementById("teacherSelect").value;

      if (!name || !teacherId) {
        Swal.showValidationMessage("Semua field wajib diisi");
        return false;
      }

      return { name, teacherId };
    },
  });

  if (!result.isConfirmed) return;

  try {
    await putData(`api/admin/classes/${id}`, {
      name: result.value.name,
      homeroomTeacherId: Number(result.value.teacherId),
    });

    await fetchClasses(); // refresh dari server

    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: "Data kelas berhasil diperbarui",
      confirmButtonColor: "#1E3A5F",
    });
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: error.message || "Tidak bisa mengupdate kelas",
    });
  }
}
// ===============================
// DELETE CLASS
// ===============================
window.deleteClass = deleteClass;

// =============
// HAPUS KELAS
// =============

window.deleteClass = deleteClass;

async function deleteClass(id) {
  const cls = classes.find((c) => c.id === id);
  if (!cls) return;

  const result = await Swal.fire({
    title: "Yakin ingin menghapus?",
    text: `Kelas "${cls.name}" akan dihapus`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#C3D9E6",
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal",
  });

  if (!result.isConfirmed) return;

  try {
    await deleteData(`api/admin/classes/${id}`);

    await fetchClasses(); // refresh dari server

    Swal.fire({
      icon: "success",
      title: "Terhapus",
      text: "Data kelas berhasil dihapus",
      confirmButtonColor: "#1E3A5F",
    });
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: error.message || "Tidak bisa menghapus kelas",
    });
  }
}

// ===============================
// DETAIL CLASS
// ===============================
window.showDetail = showDetail;

async function showDetail(id) {
  try {
    const cls = await getData(`api/admin/classes/${id}/detail`);

    const students = cls.Students || [];

    const studentsTable =
      students.length > 0
        ? `
        <div class="overflow-x-auto rounded-xl">
          <table class="w-full text-sm">
            <thead class="bg-slate-100 text-slate-600">
              <tr>
                <th class="px-4 py-3 text-left">No</th>
                <th class="px-4 py-3 text-left">NISN</th>
                <th class="px-4 py-3 text-left">Nama Siswa</th>
              </tr>
            </thead>
            <tbody>
              ${students
                .map(
                  (s, i) => `
                  <tr class="${i % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-slate-100 transition">
                    <td class="px-4 py-3">${i + 1}</td>
                    <td class="px-4 py-3 text-slate-600 font-medium">${s.User?.nisn || "-"}</td>
                    <td class="px-4 py-3">${s.User?.name || "-"}</td>
                  </tr>
                `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `
        : `<p class="text-gray-400 text-sm">Belum ada siswa</p>`;

    Swal.fire({
      title: "Detail Kelas",
      width: 800,
      html: `
        <div class="text-left max-h-[500px] overflow-y-auto pr-2 space-y-6">

          <div>
            <p class="text-sm text-gray-500 font-medium">Nama Kelas</p>
            <p class="text-xl font-bold text-slate-800">${cls.name}</p>
          </div>

          <div>
            <p class="text-sm text-gray-500 font-medium">Wali Kelas</p>
            <p class="text-base text-slate-700">
              ${cls.homeroomTeacher?.name || "-"}
            </p>
          </div>

          <div>
            <p class="text-sm text-gray-500 font-medium">Dibuat</p>
            <p class="text-sm text-slate-600">
              ${new Date(cls.createdAt).toLocaleString()}
            </p>
          </div>

          <div>
            <p class="text-sm text-gray-500 font-medium mb-2">Daftar Siswa</p>
            ${studentsTable}
          </div>

        </div>
      `,
      confirmButtonColor: "#1E3A5F",
    });
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: error.message || "Tidak bisa mengambil detail kelas",
    });
  }
}
