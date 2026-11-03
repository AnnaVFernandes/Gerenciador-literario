import { state } from "./state.js";
import { EMOJI_BY_TYPE } from "./constants.js";
import { $, escapeHTML, imageOf } from "./utils.js";

export function render() {
  const query = $("#search").value.trim().toLocaleLowerCase("pt-BR");
  const chosenStatus = $("#status-filter").value;
  const sort = $("#sort-filter").value;

  const filtered = state.works.filter((work) => {
    const content = [work.title, work.author, work.genre, work.notes, work.type]
      .join(" ")
      .toLocaleLowerCase("pt-BR");

    const categoryMatch =
      state.activeCategory === "Todas" ||
      (state.activeCategory === "Favoritos"
        ? work.favorite
        : work.type === state.activeCategory);

    const statusMatch =
      chosenStatus === "Todos" || work.status === chosenStatus;
    return categoryMatch && statusMatch && (!query || content.includes(query));
  });

  filtered.sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title, "pt-BR");
    return b.createdAt - a.createdAt;
  });

  $("#total").textContent = state.works.length;
  $("#progress").textContent = state.works.filter((w) =>
    ["Lendo", "Assistindo"].includes(w.status),
  ).length;
  $("#completed").textContent = state.works.filter(
    (w) => w.status === "Concluído",
  ).length;
  $("#result-count").textContent =
    `${filtered.length} ${filtered.length === 1 ? "obra" : "obras"}`;
  $("#library-heading").textContent =
    state.activeCategory === "Todas" ? "Minha coleção" : state.activeCategory;

  const grid = $("#book-grid");

  if (!filtered.length) {
    const emptyLibrary = state.works.length === 0;
    grid.innerHTML = `<div class="empty-state">
            <div class="empty-icon">${emptyLibrary ? "🌷" : "🔎"}</div>
            <h3>${emptyLibrary ? "Sua estante está esperando!" : "Nenhuma obra encontrada"}</h3>
            <p>${emptyLibrary ? "Adicione sua primeira história para começar sua coleção." : "Tente outro termo de pesquisa ou ajuste os filtros."}</p>
            ${emptyLibrary ? '<button type="button" class="add-btn" data-action="add-first">＋ Adicionar primeira obra</button>' : ""}
        </div>`;
    return;
  }

  grid.innerHTML = filtered
    .map((work) => {
      const image = imageOf(work);
      const ratingValue = Number(work.rating) || 0;
      const stars =
        ratingValue > 0
          ? `${"★".repeat(ratingValue)}${"☆".repeat(5 - ratingValue)}`
          : "";

      return `<article class="book-card">
            <div class="cover-wrap">
                ${image ? `<img class="book-cover" src="${escapeHTML(image)}" alt="Capa de ${escapeHTML(work.title)}" loading="lazy">` : `<div class="cover-placeholder">${EMOJI_BY_TYPE[work.type] || "📚"}</div>`}
                <button type="button" class="favorite-btn ${work.favorite ? "is-favorite" : ""}" data-action="favorite" data-id="${escapeHTML(work.id)}" aria-label="${work.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}">${work.favorite ? "♥" : "♡"}</button>
            </div>
            <div class="book-info">
                <h3>${escapeHTML(work.title)}</h3>
                <div class="tags"><span class="tag">${escapeHTML(work.type)}</span><span class="tag status">${escapeHTML(work.status)}</span></div>
                ${work.author ? `<p class="book-detail">${escapeHTML(work.author)}</p>` : ""}
                ${work.genre ? `<p class="book-detail">${escapeHTML(work.genre)}</p>` : ""}
                ${stars ? `<p class="book-detail stars-display" aria-label="Nota ${ratingValue} de 5">${stars}</p>` : ""}
                ${work.notes ? `<p class="book-detail">${escapeHTML(work.notes.length > 70 ? work.notes.slice(0, 70) + "…" : work.notes)}</p>` : ""}
            </div>
            <div class="card-actions">
                <button type="button" data-action="edit" data-id="${escapeHTML(work.id)}">Editar</button>
                <button type="button" class="delete-btn" data-action="delete" data-id="${escapeHTML(work.id)}">Excluir</button>
            </div>
        </article>`;
    })
    .join("");

  grid.querySelectorAll("img.book-cover").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        const placeholder = document.createElement("div");
        placeholder.className = "cover-placeholder";
        placeholder.textContent = "📚";
        img.replaceWith(placeholder);
      },
      { once: true },
    );
  });
}
