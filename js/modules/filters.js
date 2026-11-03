import { state } from "./state.js";
import { $ } from "./utils.js";
import { render } from "./render.js";

export function initFilters() {
  $("#search").addEventListener("input", render);
  $("#status-filter").addEventListener("change", render);
  $("#sort-filter").addEventListener("change", render);

  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeCategory = button.dataset.filter;
      document
        .querySelectorAll(".nav-btn")
        .forEach((item) => item.classList.toggle("active", item === button));
      render();
    });
  });

  $("#clear-filters").addEventListener("click", () => {
    $("#search").value = "";
    $("#status-filter").value = "Todos";
    $("#sort-filter").value = "recent";
    state.activeCategory = "Todas";
    document
      .querySelectorAll(".nav-btn")
      .forEach((button) =>
        button.classList.toggle("active", button.dataset.filter === "Todas"),
      );
    render();
  });
}
