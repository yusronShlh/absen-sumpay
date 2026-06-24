import { getData, patchData } from "./core/api.js";

export function initAdminProfile() {
  const btn = document.getElementById("adminProfileBtn");
  const modal = document.getElementById("adminProfileModal");
  const close = document.getElementById("closeAdminProfile");

  btn?.addEventListener("click", async () => {
    modal.classList.remove("hidden");
    modal.classList.add("flex");

    await loadProfile();
  });

  close?.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  document
    .getElementById("saveAdminProfile")
    ?.addEventListener("click", updateProfile);
}

async function loadProfile() {
  try {
    const res = await getData("api/admin/profile");

    const admin = res.data;

    document.getElementById("adminName").value = admin.name;

    document.getElementById("adminUsername").value = admin.username;
  } catch (err) {
    console.error(err);
  }
}

async function updateProfile() {
  setSaveLoading(true);
  try {
    await patchData("api/admin/profile", {
      username: document.getElementById("adminUsername").value,
      current_password: document.getElementById("currentPassword").value,
      new_password: document.getElementById("newPassword").value,
      confirm_password: document.getElementById("confirmPassword").value,
    });

    Swal.fire("Berhasil", "Profile berhasil diperbarui", "success");

    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";
    document.getElementById("adminProfileModal").classList.add("hidden");
  } catch (err) {
    Swal.fire("Gagal", err.message, "error");
  } finally {
    setSaveLoading(false);
  }
}

function setSaveLoading(state) {
  const btn = document.getElementById("saveAdminProfile");
  const text = document.getElementById("saveText");
  const loader = document.getElementById("saveLoader");

  if (!btn || !text || !loader) return;

  if (state) {
    btn.disabled = true;

    btn.classList.add("opacity-70", "cursor-not-allowed");

    text.textContent = "Menyimpan...";

    loader.classList.remove("hidden");
  } else {
    btn.disabled = false;

    btn.classList.remove("opacity-70", "cursor-not-allowed");

    text.textContent = "Simpan Perubahan";

    loader.classList.add("hidden");
  }
}
