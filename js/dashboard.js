import { getData } from "./core/api.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const result = await getData("api/admin/dashboard");
    const data = result.data;

    // ========================
    // ISI CARD
    // ========================
    document.getElementById("totalStudents").innerText = data.students.total;

    document.getElementById("maleStudents").innerText = data.students.male;

    document.getElementById("femaleStudents").innerText = data.students.female;

    document.getElementById("totalTeachers").innerText = data.teachers.total;

    document.getElementById("todayStudentPermits").innerText =
      data.today_permits.students;

    document.getElementById("todayTeacherPermits").innerText =
      data.today_permits.teachers;

    // ========================
    // CHART
    // ========================
    const labels = data.classes.map((cls) => cls.class_name);
    const maleData = data.classes.map((cls) => cls.male);
    const femaleData = data.classes.map((cls) => cls.female);

    const ctx = document.getElementById("classChart");

    new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Laki-laki",
            data: maleData,
            backgroundColor: "#60A5FA",
          },
          {
            label: "Perempuan",
            data: femaleData,
            backgroundColor: "#F472B6",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  } catch (error) {
    // console.error("Dashboard error:", error);
    // 1. Beri tahu user dengan SweetAlert
    Swal.fire({
      icon: "error",
      title: "Gagal Memuat Dashboard",
      text: "Terjadi kesalahan saat mengambil data dashboard. Silakan muat ulang halaman.",
      confirmButtonText: "Muat Ulang",
    }).then((res) => {
      if (res.isConfirmed) {
        window.location.reload(); // Mudahkan user untuk refresh halaman
      }
    });

    // 2. Tampilkan pesan error di dalam chart/card agar tidak terlihat kosong melompong
    const chartContainer = document.getElementById("classChart")?.parentElement;
    if (chartContainer) {
      chartContainer.innerHTML = `<div class="text-center text-red-500 p-5">Gagal memuat grafik.</div>`;
    }

    // Ubah angka-angka card menjadi tanda tanya atau strip agar jelas bahwa data gagal dimuat
    const elementsToReset = [
      "totalStudents",
      "maleStudents",
      "femaleStudents",
      "totalTeachers",
      "todayStudentPermits",
      "todayTeacherPermits",
    ];
    elementsToReset.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerText = "-";
    });
  }
});
