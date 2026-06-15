import { postData } from "./core/api.js";

const form = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");
const passwordInput = document.getElementById("passwordInput");
const togglePassword = document.getElementById("togglePassword");
const eyeIcon = document.getElementById("eyeIcon");
const loginButton = document.getElementById("loginButton");
const loginText = document.getElementById("loginText");
const loginSpinner = document.getElementById("loginSpinner");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);

  const identifier = formData.get("identifier");
  const password = formData.get("password");

  errorMessage.classList.add("hidden");
  loginButton.disabled = true;
  loginText.textContent = "Memproses...";
  loginSpinner.classList.remove("hidden");
  loginButton.classList.add("opacity-70", "cursor-not-allowed");

  try {
    const data = await postData("api/auth/login", { identifier, password });

    // simpan token & user

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    // redirect sesuai role
    switch (data.user.role) {
      case "admin":
        window.location.href = "../admin/dashboard.html";
        break;

      case "guru":
        window.location.href = "../teacher/dashboard.html";
        break;

      default:
        errorMessage.textContent = "Role tidak di izinkan";
        errorMessage.classList.remove("hidden");
    }
  } catch (err) {
    errorMessage.textContent = err.message;
    errorMessage.classList.remove("hidden");
    loginButton.disabled = false;
    loginText.textContent = "Masuk";
    loginSpinner.classList.add("hidden");
    loginButton.classList.remove("opacity-70", "cursor-not-allowed");
  }
});

togglePassword.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";

  passwordInput.type = isPassword ? "text" : "password";

  eyeIcon.setAttribute("data-lucide", isPassword ? "eye-off" : "eye");

  lucide.createIcons();
});

lucide.createIcons();
