import { getData } from "../core/api.js";
import { initNavbar } from "../components/navbar.js";

let attendanceChart;

// =======================
// LOAD NAVBAR
// =======================

async function loadNavbar() {
  const container = document.getElementById("navbar-container");

  const response = await fetch("../../components/navbar.html");

  container.innerHTML = await response.text();

  initNavbar();
}

// =======================
// DATE
// =======================

function loadDate() {
  const date = new Date();

  const options = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  document.getElementById("todayDate").textContent = date.toLocaleDateString(
    "id-ID",
    options,
  );
}

// =======================
// LOAD USER
// =======================

function loadUser(name) {
  document.getElementById("teacherName").textContent = name || "Guru";
}

// =======================
// RENDER SCHEDULE
// =======================

function renderSchedule(schedules) {
  const tbody = document.getElementById("todaySchedule");

  if (!schedules || schedules.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4"
          class="text-center py-5 text-gray-400">
          Tidak ada jadwal hari ini
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = schedules
    .map((item) => {
      const jam = `${item.LessonTime.start_time.substring(0, 5)}
       -
       ${item.LessonTime.end_time.substring(0, 5)}`;

      return `
      <tr >

        <td class="px-4 py-3">
          ${item.LessonTime.order}
        </td>


        <td class="px-4 py-3 font-medium">
          ${item.TeachingAssignment.Subject.name}
        </td>


        <td class="px-4 py-3">
          ${jam}
        </td>


        <td class="px-4 py-3">
          ${item.TeachingAssignment.Class.name}
        </td>

      </tr>
    `;
    })
    .join("");
}

// =======================
// CHART
// =======================

function renderChart(stats) {
  const ctx = document.getElementById("attendanceChart");

  if (attendanceChart) {
    attendanceChart.destroy();
  }

  attendanceChart = new Chart(ctx, {
    type: "doughnut",

    data: {
      labels: ["Hadir", "Tidak Hadir", "Izin"],

      datasets: [
        {
          data: [stats.hadir, stats.alpha, stats.izin],

          backgroundColor: ["#C3D9E6", "#ef4444", "#eab308"],

          borderWidth: 0,
        },
      ],
    },

    options: {
      responsive: true,

      maintainAspectRatio: false,

      cutout: "65%",

      plugins: {
        legend: {
          position: "bottom",

          align: "center",

          labels: {
            boxWidth: 10,

            boxHeight: 10,

            padding: 15,

            font: {
              size: 11,
            },
          },
        },
      },
    },
  });
}

// =======================
// LAST PERMISSION
// =======================

function renderPermissions(data) {
  const container = document.getElementById("latestPermission");

  if (!data || data.length === 0) {
    container.innerHTML = `
      <p class="text-gray-400 text-sm">
        Belum ada izin
      </p>
    `;

    return;
  }

  container.innerHTML = data
    .map((item) => {
      let statusText = "";
      let statusClass = "";

      if (item.status === "approved") {
        statusText = "Disetujui";

        statusClass = "bg-emerald-100 text-emerald-700";
      } else if (item.status === "rejected") {
        statusText = "Ditolak";

        statusClass = "bg-red-100 text-red-700";
      } else {
        statusText = "Menunggu";

        statusClass = "bg-yellow-100 text-yellow-700";
      }

      return `

      <div 
        class="
        p-4
        rounded-xl
        bg-slate-50
        flex
        items-center
        justify-between
        gap-3
        "
      >


        <div>

          <p class="font-medium text-[#1E3A5F]">
            ${item.reason}
          </p>


          <p class="text-sm text-gray-500 mt-1">
            ${item.start_date}
          </p>


        </div>



        <span
          class="
          px-3
          py-1
          rounded-full
          text-xs
          font-semibold
          whitespace-nowrap
          ${statusClass}
          "
        >
          ${statusText}
        </span>



      </div>

      `;
    })
    .join("");
}

// =======================
// API
// =======================

async function loadDashboard() {
  try {
    const data = await getData("api/teacher/dashboard");

    console.log(data);

    // nama guru

    loadUser(data.teacher.name);

    // jadwal

    renderSchedule(data.today_schedules);

    // chart

    renderChart(data.attendance_stats);

    // izin

    renderPermissions(data.last_leaves);
  } catch (error) {
    console.error(error);
  }
}

// =======================
// INIT
// =======================

async function init() {
  await loadNavbar();

  loadDate();

  await loadDashboard();
}

init();
