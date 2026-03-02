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
    window.location.href = "/login.html";
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
    window.location.href = "/login.html";
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

  if (!response.ok) {
    throw new Error(result.message || "Terjadi kesalahan");
  }

  return result;
}
