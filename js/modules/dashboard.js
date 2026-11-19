import { $, escapeHTML } from "./utils.js";
import { state } from "./state.js";
import { render } from "./render.js";

// Paleta pastel/rosé (combina com variaveis.css)
const PALETTE = {
  rose: "#e9a3c3",
  roseDeep: "#d783aa",
  lavender: "#c9bdf2",
  peach: "#f8c9ad",
  mint: "#a9dcc0",
  sky: "#b7d6f0",
  butter: "#f6e0a4",
  grey: "#e3d6de",
  text: "#584552",
  muted: "#998895",
  grid: "#f4e8ef",
};

// Cor fixa por status e por mídia → a mesma obra tem sempre a mesma cor
const STATUS_ORDER = [
  "Quero ler",
  "Lendo",
  "Assistindo",
  "Pausado",
  "Concluído",
  "Abandonado",
];
const STATUS_COLORS = {
  "Quero ler": PALETTE.sky,
  Lendo: PALETTE.rose,
  Assistindo: PALETTE.lavender,
  Pausado: PALETTE.butter,
  Concluído: PALETTE.mint,
  Abandonado: PALETTE.grey,
};

const MEDIA_ORDER = ["Livro", "Mangá", "Manhwa", "Anime"];
const MEDIA_COLORS = {
  Livro: PALETTE.rose,
  Mangá: PALETTE.peach,
  Manhwa: PALETTE.lavender,
  Anime: PALETTE.mint,
};

const GENRE_COLORS = [
  PALETTE.rose,
  PALETTE.lavender,
  PALETTE.peach,
  PALETTE.mint,
  PALETTE.sky,
  PALETTE.grey, // "Outros"
];
const MAX_GENRES = 5;

const charts = {}; // instâncias, para atualizar em vez de recriar

/* ---------- Agregações ----------- */
export function countGenres(works) {
  const counts = new Map();
  works.forEach((work) => {
    (work.genre || "")
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean)
      .forEach((g) => counts.set(g, (counts.get(g) || 0) + 1));
  });

  const sorted = [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"),
  );
  const top = sorted.slice(0, MAX_GENRES);
  const others = sorted.slice(MAX_GENRES).reduce((sum, [, n]) => sum + n, 0);
  if (others) top.push(["Outros", others]);
  return { labels: top.map(([l]) => l), values: top.map(([, n]) => n) };
}

export function countBy(works, key, order) {
  const labels = [...order];
  // inclui valores fora da lista padrão
  works.forEach(
    (w) => w[key] && !labels.includes(w[key]) && labels.push(w[key]),
  );
  return {
    labels,
    values: labels.map((l) => works.filter((w) => w[key] === l).length),
  };
}

function baseOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: "easeOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#fff",
        titleColor: PALETTE.text,
        bodyColor: PALETTE.text,
        borderColor: "#f1e2eb",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 12,
        displayColors: true,
        boxPadding: 4,
        titleFont: { family: "Nunito", weight: "700" },
        bodyFont: { family: "Nunito" },
      },
    },
  };
}

function upsert(id, config) {
  const canvas = $(`#${id}`);
  if (!canvas || !window.Chart) return;
  if (charts[id]) {
    charts[id].data = config.data;
    charts[id].update();
    return;
  }
  charts[id] = new window.Chart(canvas, config);
}

function toggleEmpty(id, isEmpty) {
  const box = $(`#${id}`)?.closest(".chart-card");
  if (box) box.classList.toggle("is-empty", isEmpty);
}

function renderLegend(containerId, labels, values, colors) {
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const container = $(containerId);
  if (!container) return;
  container.innerHTML = labels
    .map(
      (
        label,
        i,
      ) => `<li data-genre="${escapeHTML(label)}" role="button" tabindex="0" title="Filtrar por ${escapeHTML(label)}">
        <span class="dot" style="background:${colors[i % colors.length]}"></span>
        <span class="lbl">${escapeHTML(label)}</span>
        <span class="val">${Math.round((values[i] / total) * 100)}%</span>
    </li>`,
    )
    .join("");
}

/* ---------- Filtros ao clicar nos gráficos ---------- */
function selectChartFilter(kind, value) {
  if (!value || value === "Outros") return;
  if (kind === "genre") {
    state.activeGenre = state.activeGenre === value ? null : value;
  } else if (kind === "media") {
    state.activeCategory = state.activeCategory === value ? "Todas" : value;
    document.querySelectorAll(".nav-btn").forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.filter === state.activeCategory,
      );
    });
  } else if (kind === "status") {
    const status = $("#status-filter");
    status.value = status.value === value ? "Todos" : value;
  }
  render();
}

function chartClick(kind) {
  return (_event, elements, chart) => {
    if (!elements.length) return;
    const label = chart.data.labels[elements[0].index];
    selectChartFilter(kind, label);
  };
}

export function initDashboardInteractions() {
  const legend = $("#legend-genres");
  if (!legend) return;
  legend.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.target.closest("[data-genre]")?.click();
    }
  });
  legend.addEventListener("click", (event) => {
    const item = event.target.closest("[data-genre]");
    if (item) selectChartFilter("genre", item.dataset.genre);
  });
}

/* ---------- Gráficos ---------- */
function renderGenres(works) {
  const { labels, values } = countGenres(works);
  toggleEmpty("chart-genres", !values.length);
  const colors = labels.map((_, i) => GENRE_COLORS[i % GENRE_COLORS.length]);

  upsert("chart-genres", {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderColor: "#fff",
          borderWidth: 3,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      ...baseOptions(),
      cutout: "68%",
      onClick: chartClick("genre"),
      plugins: {
        ...baseOptions().plugins,
        tooltip: {
          ...baseOptions().plugins.tooltip,
          callbacks: {
            label: (c) =>
              ` ${c.label}: ${c.parsed} ${c.parsed === 1 ? "obra" : "obras"}`,
          },
        },
      },
    },
  });

  renderLegend("#legend-genres", labels, values, colors);
}

function renderMedia(works) {
  const { labels, values } = countBy(works, "type", MEDIA_ORDER);
  toggleEmpty("chart-media", !works.length);

  upsert("chart-media", {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: labels.map((l) => MEDIA_COLORS[l] || PALETTE.grey),
          borderRadius: 10,
          borderSkipped: false,
          maxBarThickness: 46,
        },
      ],
    },
    options: {
      ...baseOptions(),
      onClick: chartClick("media"),
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: PALETTE.muted,
            font: { family: "Nunito", weight: "700" },
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: PALETTE.grid },
          border: { display: false },
          ticks: {
            precision: 0,
            color: PALETTE.muted,
            font: { family: "Nunito" },
          },
        },
      },
      plugins: {
        ...baseOptions().plugins,
        tooltip: {
          ...baseOptions().plugins.tooltip,
          displayColors: false,
          callbacks: {
            label: (c) =>
              `${c.parsed.y} ${c.parsed.y === 1 ? "obra" : "obras"}`,
          },
        },
      },
    },
  });
}

function renderStatus(works) {
  const { labels, values } = countBy(works, "status", STATUS_ORDER);
  toggleEmpty("chart-status", !works.length);

  upsert("chart-status", {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: labels.map((l) => STATUS_COLORS[l] || PALETTE.grey),
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 16,
        },
      ],
    },
    options: {
      ...baseOptions(),
      onClick: chartClick("status"),
      indexAxis: "y", // barras horizontais
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: PALETTE.grid },
          border: { display: false },
          ticks: {
            precision: 0,
            color: PALETTE.muted,
            font: { family: "Nunito" },
          },
        },
        y: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: PALETTE.text,
            font: { family: "Nunito", weight: "700" },
          },
        },
      },
      plugins: {
        ...baseOptions().plugins,
        tooltip: {
          ...baseOptions().plugins.tooltip,
          displayColors: false,
          callbacks: {
            label: (c) =>
              `${c.parsed.x} ${c.parsed.x === 1 ? "obra" : "obras"}`,
          },
        },
      },
    },
  });
}

/* ---------- API pública ---------- */

export function renderDashboard(works) {
  if (!window.Chart) return; // CDN ainda não carregou / offline
  renderGenres(works);
  renderMedia(works);
  renderStatus(works);
}
