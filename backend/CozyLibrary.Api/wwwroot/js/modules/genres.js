import { $, escapeHTML } from "./utils.js";

let selectedGenres = new Set();

export function resetGenres(initialValue = "") {
  selectedGenres = new Set();
  const genreInput = $("#genre-input");
  const genreTags = $("#genre-tags");
  const genreHidden = $("#genre");

  genreTags.innerHTML = "";
  genreInput.value = "";
  genreHidden.value = "";

  if (initialValue) {
    initialValue
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean)
      .forEach((g) => selectedGenres.add(g));
    renderGenreTags();
    updateGenreHidden();
  }
}

function updateGenreHidden() {
  $("#genre").value = Array.from(selectedGenres).join(", ");
}

function renderGenreTags() {
  const genreTags = $("#genre-tags");
  genreTags.innerHTML = "";
  selectedGenres.forEach((genre) => {
    const tag = document.createElement("span");
    tag.className = "genre-tag";
    tag.innerHTML = `${escapeHTML(genre)} <button type="button" aria-label="Remover gênero">✕</button>`;

    tag.querySelector("button").addEventListener("click", () => {
      selectedGenres.delete(genre);
      renderGenreTags();
      updateGenreHidden();
    });
    genreTags.appendChild(tag);
  });
}

function addGenre(value) {
  const cleanValue = value.trim();
  if (cleanValue && !selectedGenres.has(cleanValue)) {
    selectedGenres.add(cleanValue);
    renderGenreTags();
    updateGenreHidden();
  }
  $("#genre-input").value = "";
}

export function initGenres() {
  const genreInput = $("#genre-input");

  genreInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (genreInput.value.trim()) addGenre(genreInput.value);
    } else if (e.key === "Backspace" && !genreInput.value) {
      const lastGenre = Array.from(selectedGenres).pop();
      if (lastGenre) {
        selectedGenres.delete(lastGenre);
        renderGenreTags();
        updateGenreHidden();
      }
    }
  });

  genreInput.addEventListener("input", () => {
    const options = document.querySelectorAll("#genre-options option");
    for (const option of options) {
      if (option.value === genreInput.value) {
        addGenre(genreInput.value);
        break;
      }
    }
  });

  genreInput.addEventListener("blur", () => {
    if (genreInput.value.trim()) addGenre(genreInput.value);
  });
}
