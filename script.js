(() => {
  "use strict";
  const STORAGE_KEY = "cozyLibrary.works.v1";
  const MAX_BACKUP_SIZE = 10 * 1024 * 1024;
  const $ = (selector) => document.querySelector(selector);

  const dialog = $("#book-dialog");
  const form = $("#book-form");
  const grid = $("#book-grid");
  let works = loadWorks();
  let activeCategory = "Todas";
  let toastTimeout;

  const emojiByType = {
    Livro: "📚",
    Mangá: "🌸",
    Manhwa: "💗",
    Anime: "🎀",
  };

  function createId() {
    return (
      window.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(16).slice(2)}`
    );
  }

  function safeImageUrl(value) {
    if (!value || typeof value !== "string") return "";
    try {
      const url = new URL(value.trim(), location.href);
      return ["https:", "http:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function escapeHTML(value = "") {
    return String(value).replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  }

  function imageOf(work) {
    return work.coverData || safeImageUrl(work.cover);
  }

  function toast(message) {
    const element = $("#toast");
    element.textContent = message;
    element.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => element.classList.remove("show"), 3200);
  }

  function normalizeWork(work) {
    if (
      !work ||
      typeof work !== "object" ||
      typeof work.title !== "string" ||
      !work.title.trim()
    )
      return null;

    const allowedTypes = ["Livro", "Mangá", "Manhwa", "Anime"];
    const allowedStatuses = [
      "Quero ler",
      "Lendo",
      "Assistindo",
      "Pausado",
      "Concluído",
      "Abandonado",
    ];

    const coverData =
      typeof work.coverData === "string" &&
      work.coverData.startsWith("data:image/")
        ? work.coverData
        : "";

    return {
      id: String(work.id || createId()),
      title: work.title.trim().slice(0, 160),
      type: allowedTypes.includes(work.type) ? work.type : "Livro",
      cover: safeImageUrl(work.cover || ""),
      coverData,
      status: allowedStatuses.includes(work.status) ? work.status : "Quero ler",
      author: String(work.author || "").slice(0, 120),
      genre: String(work.genre || "").slice(0, 120),
      progress: Math.max(0, Math.floor(Number(work.progress) || 0)),
      total: Math.max(0, Math.floor(Number(work.total) || 0)),
      rating:
        work.rating === "" || work.rating == null
          ? ""
          : Math.min(5, Math.max(0, Math.round(Number(work.rating) || 0))),
      notes: String(work.notes || "").slice(0, 1500),
      favorite: Boolean(work.favorite),
      createdAt: Number(work.createdAt) || Date.now(),
      updatedAt: Number(work.updatedAt) || Date.now(),
    };
  }

  function loadWorks() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(data) ? data.map(normalizeWork).filter(Boolean) : [];
    } catch (error) {
      console.warn("Não foi possível ler a biblioteca salva.", error);
      return [];
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(works));
      return true;
    } catch (error) {
      console.error(error);
      toast(
        "Não foi possível salvar. O armazenamento pode estar cheio; tente reduzir as imagens locais.",
      );
      return false;
    }
  }

  function render() {
    const query = $("#search").value.trim().toLocaleLowerCase("pt-BR");
    const chosenStatus = $("#status-filter").value;
    const sort = $("#sort-filter").value;

    const filtered = works.filter((work) => {
      const content = [
        work.title,
        work.author,
        work.genre,
        work.notes,
        work.type,
      ]
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      const categoryMatch =
        activeCategory === "Todas" ||
        (activeCategory === "Favoritos"
          ? work.favorite
          : work.type === activeCategory);

      const statusMatch =
        chosenStatus === "Todos" || work.status === chosenStatus;
      return (
        categoryMatch && statusMatch && (!query || content.includes(query))
      );
    });

    filtered.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title, "pt-BR");
      return b.createdAt - a.createdAt;
    });

    $("#total").textContent = works.length;
    $("#progress").textContent = works.filter((w) =>
      ["Lendo", "Assistindo"].includes(w.status),
    ).length;
    $("#completed").textContent = works.filter(
      (w) => w.status === "Concluído",
    ).length;
    $("#result-count").textContent =
      `${filtered.length} ${filtered.length === 1 ? "obra" : "obras"}`;
    $("#library-heading").textContent =
      activeCategory === "Todas" ? "Minha coleção" : activeCategory;

    if (!filtered.length) {
      const emptyLibrary = works.length === 0;
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
                    ${image ? `<img class="book-cover" src="${escapeHTML(image)}" alt="Capa de ${escapeHTML(work.title)}" loading="lazy">` : `<div class="cover-placeholder">${emojiByType[work.type] || "📚"}</div>`}
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

  function paintStars(value) {
    document.querySelectorAll(".star-btn").forEach((s, index) => {
      s.classList.toggle("active", index < value);
    });
  }

  function resetForm() {
    form.reset();
    $("#work-id").value = "";
    $("#cover-preview").src = "";
    $("#cover-preview").classList.add("hidden");
    $("#form-heading").textContent = "Adicionar nova obra ♡";
    $("#rating").value = "";
    paintStars(0);
  }

  function openNewForm() {
    resetForm();
    dialog.showModal();
    $("#title").focus();
  }

  function openEditForm(work) {
    resetForm();
    $("#work-id").value = work.id;
    $("#form-heading").textContent = "Editar obra ♡";
    $("#title").value = work.title;
    $("#type").value = work.type;
    $("#cover").value = work.cover || "";
    $("#status").value = work.status;
    $("#author").value = work.author;
    $("#genre").value = work.genre;
    $("#notes").value = work.notes;

    const rating = Number(work.rating) || 0;
    $("#rating").value = rating || "";
    paintStars(rating);

    if (imageOf(work)) {
      $("#cover-preview").src = imageOf(work);
      $("#cover-preview").classList.remove("hidden");
    }
    dialog.showModal();
  }

  function readImage(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve("");
      if (!file.type.startsWith("image/"))
        return reject(new Error("Selecione um arquivo de imagem."));
      if (file.size > 1.5 * 1024 * 1024)
        return reject(
          new Error(
            "A imagem deve ter até 1,5 MB. Para imagens maiores, use uma URL.",
          ),
        );
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () =>
        reject(new Error("Não foi possível ler a imagem."));
      reader.readAsDataURL(file);
    });
  }

  const starsContainer = $("#rating-stars");
  const ratingInput = $("#rating");

  if (starsContainer && ratingInput) {
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement("button");
      star.type = "button";
      star.className = "star-btn";
      star.textContent = "★";
      star.dataset.value = i;
      star.setAttribute("aria-label", `${i} estrela${i > 1 ? "s" : ""}`);

      star.addEventListener("click", () => {
        const current = Number(ratingInput.value) || 0;
        if (current === i) {
          ratingInput.value = "";
          paintStars(0);
        } else {
          ratingInput.value = i;
          paintStars(i);
        }
      });

      star.addEventListener("mouseenter", () => paintStars(i));
      starsContainer.appendChild(star);
    }

    starsContainer.addEventListener("mouseleave", () => {
      paintStars(Number(ratingInput.value) || 0);
    });
  }

  const genreInput = $("#genre-input");
  const genreTags = $("#genre-tags");
  const genreHidden = $("#genre");
  let selectedGenres = new Set();

  function updateGenreHidden() {
    genreHidden.value = Array.from(selectedGenres).join(", ");
  }

  function renderGenreTags() {
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
    genreInput.value = "";
  }

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

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = $("#work-id").value;
    const existing = works.find((w) => w.id === id);
    const file = $("#cover-file").files[0];
    const title = $("#title").value.trim();

    if (!title) return toast("Digite o título da obra.");

    let coverData = existing?.coverData || "";
    try {
      if (file) coverData = await readImage(file);
    } catch (error) {
      return toast(error.message);
    }

    const next = normalizeWork({
      id: existing?.id || createId(),
      title,
      type: $("#type").value,
      cover: $("#cover").value.trim(),
      coverData,
      status: $("#status").value,
      author: $("#author").value.trim(),
      genre: $("#genre").value.trim(),
      progress: 0,
      total: 0,
      rating: $("#rating").value,
      notes: $("#notes").value.trim(),
      favorite: existing?.favorite || false,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    });

    if (!next) return toast("Confira os dados preenchidos.");

    const oldWorks = works;
    works = existing
      ? works.map((w) => (w.id === id ? next : w))
      : [next, ...works];

    if (!persist()) {
      works = oldWorks;
      return;
    }

    dialog.close();
    resetForm();
    render();
    toast(
      existing
        ? "Obra atualizada com sucesso ♡"
        : "Obra adicionada à biblioteca ♡",
    );
  });

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === "add-first") return openNewForm();

    const work = works.find((w) => w.id === id);
    if (!work) return;

    if (action === "edit") {
      openEditForm(work);
    } else if (action === "favorite") {
      const oldWorks = works;
      works = works.map((w) =>
        w.id === id
          ? { ...w, favorite: !w.favorite, updatedAt: Date.now() }
          : w,
      );
      if (!persist()) works = oldWorks;
      render();
    } else if (action === "delete") {
      if (!confirm(`Deseja excluir "${work.title}"?`)) return;
      const oldWorks = works;
      works = works.filter((w) => w.id !== id);
      if (!persist()) works = oldWorks;
      render();
      toast("Obra removida da biblioteca.");
    }
  });

  $("#open-form").addEventListener("click", openNewForm);
  $("#cancel-form").addEventListener("click", () => dialog.close());
  $("#close-form").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  $("#search").addEventListener("input", render);
  $("#status-filter").addEventListener("change", render);
  $("#sort-filter").addEventListener("change", render);

  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.filter;
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
    activeCategory = "Todas";
    document
      .querySelectorAll(".nav-btn")
      .forEach((button) =>
        button.classList.toggle("active", button.dataset.filter === "Todas"),
      );
    render();
  });

  // ===== Capa =====
  $("#cover").addEventListener("input", () => {
    const url = safeImageUrl($("#cover").value);
    if (url) {
      $("#cover-preview").src = url;
      $("#cover-preview").classList.remove("hidden");
    } else if (!$("#cover-file").files.length) {
      $("#cover-preview").classList.add("hidden");
    }
  });

  $("#cover-file").addEventListener("change", async () => {
    const file = $("#cover-file").files[0];
    if (!file) return;
    try {
      const dataUrl = await readImage(file);
      $("#cover-preview").src = dataUrl;
      $("#cover-preview").classList.remove("hidden");
    } catch (error) {
      $("#cover-file").value = "";
      toast(error.message);
    }
  });

  // ===== Backup =====
  $("#export-backup").addEventListener("click", () => {
    const backup = {
      app: "Cozy Library",
      version: 1,
      exportedAt: new Date().toISOString(),
      works,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cozy-library-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Backup exportado! Guarde o arquivo em um local seguro ♡");
  });

  $("#import-backup").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_BACKUP_SIZE)
      return toast("O arquivo é grande demais. O limite é 10 MB.");

    try {
      const data = JSON.parse(await file.text());
      const incoming = Array.isArray(data) ? data : data.works;

      if (!Array.isArray(incoming))
        throw new Error("Esse arquivo não parece ser um backup válido.");

      if (
        !confirm(
          `Importar ${incoming.length} obra(s)? A biblioteca atual será substituída. Exporte um backup antes se quiser guardar os dados atuais.`,
        )
      )
        return;

      const imported = incoming.map(normalizeWork).filter(Boolean);
      const previous = works;
      works = imported;
      if (!persist()) {
        works = previous;
        return;
      }
      render();
      toast(`Backup importado: ${works.length} obra(s) ♡`);
    } catch (error) {
      toast(error.message || "Não foi possível ler esse backup.");
    }
  });

  render();
})();
