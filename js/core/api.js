import { BASE_URL } from "./config.js";

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getData(endpoint) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const result = await response.json();

  if (response.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/pages/auth/login.html";
    return;
  }

  if (!response.ok) {
    throw new Error(result.message || "Terjadi kesalahan");
  }

  return result;
}

export async function postData(endpoint, data) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (response.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/pages/auth/login.html";
    return;
  }

  if (!response.ok) {
    throw new Error(result.message || "Terjadi kesalahan");
  }
  return result;
}

export async function putData(endpoint, data) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (response.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/pages/auth/login.html";
    return;
  }
  if (!response.ok) {
    throw new Error(result.message || "Terjadi kesalahan");
  }

  return result;
}

export async function deleteData(endpoint) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const result = await response.json();
  if (response.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/pages/auth/login.html";
    return;
  }
  if (!response.ok) {
    throw new Error(result.message || "Terjadi kesalahan");
  }

  return result;
}

export async function downloadFile(endpoint, filename = "file.pdf") {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/pages/auth/login.html";
    return;
  }

  if (!response.ok) {
    throw new Error("Gagal download file");
  }

  const blob = await response.blob();

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  a.remove();
  window.URL.revokeObjectURL(url);
}
