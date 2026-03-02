import { postData } from "./core/api.js";

const form = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);

  const identifier = formData.get("identifier");
  const password = formData.get("password");

  errorMessage.classList.add("hidden");

  try {
    const data = await postData("api/auth/login", { identifier, password });

    // simpan token & user

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    // redirect sesuai role
    if (data.user.role === "admin") {
      window.location.href = "../admin/dashboard.html";
    } else {
      errorMessage.textContent = "Role tidak di izinkan";
      errorMessage.classList.remove("hidden");
    }
  } catch (err) {
    errorMessage.textContent = err.message;
    errorMessage.classList.remove("hidden");
  }
});
