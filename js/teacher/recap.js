import { getData } from "../core/api.js";

import { initNavbar } from "../components/navbar.js";

let recaps = [];

// =======================
// NAVBAR
// =======================

async function loadNavbar() {
  const container = document.getElementById("navbar-container");

  const response = await fetch("../../components/navbar.html");

  container.innerHTML = await response.text();

  initNavbar();
}

// =======================
// LOAD RECAP
// =======================

async function loadRecap() {
  try {
    const response = await getData("api/teacher/recap");

    recaps = response.data;

    renderRecap();
  } catch (err) {
    console.error(err);
  }
}

// =======================
// RENDER CARD
// =======================

function renderRecap() {
  const container = document.getElementById("recapList");

  if (!recaps || recaps.length === 0) {
    container.innerHTML = `
      <div
        class="
        col-span-full
        text-center
        py-10
        text-gray-400
        "
      >
        Belum ada data rekapitulasi
      </div>
    `;

    return;
  }

  container.innerHTML = recaps
    .map((item) => {
      return `

      <div

        class="
recapCard
cursor-pointer
bg-white
rounded-xl
p-3
shadow-sm
hover:bg-[#C3D9E6]/40
hover:shadow-md
transition
"

        data-subject="${item.subject_id}"
        data-class="${item.class_id}"

        data-subject-name="${item.subject}"
        data-class-name="${item.class}"

      >


        <div class="flex items-start gap-3">


          

           

          </div>



          <div>


            <h2
              class="
              font-semibold
              text-[#1E3A5F]
              "
            >
              ${item.subject}
            </h2>


            <p
              class="
              text-sm
              text-gray-500
              mt-1
              "
            >
              Kelas : ${item.class}
            </p>


          </div>


        </div>


      </div>


      `;
    })
    .join("");

  lucide.createIcons();

  initCardEvent();
}

// =======================
// CARD CLICK
// =======================

function initCardEvent() {
  const cards = document.querySelectorAll(".recapCard");

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const subject = card.dataset.subject;

      const kelas = card.dataset.class;

      const subjectName = card.dataset.subjectName;

      const className = card.dataset.className;

      window.location.href = `recap-detail.html?
subject_id=${subject}
&class_id=${kelas}
&subject_name=${encodeURIComponent(subjectName)}
&class_name=${encodeURIComponent(className)}
`;
    });
  });
}

// =======================
// INIT
// =======================

async function init() {
  await loadNavbar();

  await loadRecap();
}

init();
