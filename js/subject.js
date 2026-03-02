import { getData, postData, putData, deleteData } from "./core/api.js";

const tableBody = document.getElementById("subjectTableBody");
const btnAddSubject = document.getElementById("btnAddSubject"); // sesuai HTML kamu

let subjects = [];
let editId = null;

// ============================
// INIT
// ============================

document.addEventListener("DOMContentLoaded", async () => {
  await loadSubjects();
});

// ============================
// LOAD SUBJECTS
// ============================

async function loadSubjects() {
  try {
    subjects = await getData("api/admin/subjects");
    renderTable(subjects);
  } catch (error) {
    Swal.fire("Error", error.message, "error");
  }
}

// ============================
// RENDER TABLE
// ============================

function renderTable(data) {
  tableBody.innerHTML = "";

  data.forEach((subject, index) => {
    tableBody.innerHTML += `
      <tr>
        <td class="px-6 py-4">${index + 1}</td>
        <td class="px-6 py-4 font-medium capitalize">${subject.name}</td>
        <td class="px-6 py-4 text-center">
          <div class="flex justify-center gap-3">
            <button 
              onclick="editSubject(${subject.id})"
              class="text-blue-600 hover:text-blue-800 transition"
              title="Edit"
            >
              <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>

            <button 
              onclick="deleteSubject(${subject.id})"
              class="text-red-600 hover:text-red-800 transition"
              title="Hapus"
            >
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  lucide.createIcons();
}

// ============================
// ADD BUTTON
// ============================

btnAddSubject.addEventListener("click", () => {
  editId = null;
  openModal();
});

// ============================
// MODAL
// ============================

function openModal(data = null) {
  Swal.fire({
    title: editId ? "Edit Mapel" : "Tambah Mapel",
    html: `
      <input 
        id="swal-name" 
        class="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
        placeholder="Nama Mapel"
        value="${data?.name || ""}"
      >
    `,
    focusConfirm: false,
    preConfirm: () => {
      const name = document.getElementById("swal-name").value.trim();

      if (!name) {
        Swal.showValidationMessage("Nama mata pelajaran wajib diisi");
        return false;
      }

      return { name };
    },
  }).then(async (result) => {
    if (!result.isConfirmed) return;

    try {
      if (editId) {
        await putData(`api/admin/subjects/${editId}`, result.value);
        Swal.fire("Berhasil", "Mapel berhasil diperbarui", "success");
      } else {
        await postData("api/admin/subjects", result.value);
        Swal.fire("Berhasil", "Mapel berhasil ditambahkan", "success");
      }

      await loadSubjects();
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    }
  });
}

// ============================
// EDIT
// ============================

window.editSubject = function (id) {
  const subject = subjects.find((s) => s.id === id);
  editId = id;
  openModal(subject);
};

// ============================
// DELETE
// ============================

window.deleteSubject = async function (id) {
  const confirm = await Swal.fire({
    title: "Yakin?",
    text: "Mata Pelajaran akan dihapus permanen",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, hapus",
  });

  if (!confirm.isConfirmed) return;

  try {
    await deleteData(`api/admin/subjects/${id}`);
    Swal.fire("Berhasil", "Mata Pelajaran berhasil dihapus", "success");
    await loadSubjects();
  } catch (error) {
    Swal.fire("Error", error.message, "error");
  }
};
