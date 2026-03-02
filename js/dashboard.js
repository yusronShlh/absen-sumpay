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
    console.error("Dashboard error:", error);
  }
});
