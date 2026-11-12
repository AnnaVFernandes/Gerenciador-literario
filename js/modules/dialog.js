import { state } from "./state.js";
import { $ } from "./utils.js";
import { normalizeWork } from "./storage.js";
import { upsertWork, toggleFavorite, removeWork } from "./books.js";
import { toast } from "./toast.js";
import { render } from "./render.js";
import { paintStars } from "./rating.js";
import { resetGenres } from "./genres.js";
import { resetCoverPreview, previewCoverFromFile } from "./covers.js";
import { readImage, imageOf } from "./utils.js";

const dialog = () => $("#book-dialog");
const form = () => $("#book-form");

export function resetForm() {
  form().reset();
  $("#work-id").value = "";
  resetCoverPreview();
  $("#form-heading").textContent = "Adicionar nova obra ♡";
  $("#rating").value = "";
  paintStars(0);
  resetGenres();
  z;
}

export function openNewForm() {
  resetForm();
  dialog().showModal();
  $("#title").focus();
}

export function openEditForm(work) {
  resetForm();
  $("#work-id").value = work.id;
  $("#form-heading").textContent = "Editar obra ♡";
  $("#title").value = work.title;
  $("#type").value = work.type;
  $("#cover").value = work.cover || "";
  $("#status").value = work.status;
  $("#author").value = work.author;
  $("#notes").value = work.notes;

  resetGenres(work.genre);

  const rating = Number(work.rating) || 0;
  $("#rating").value = rating || "";
  paintStars(rating);

  if (imageOf(work)) {
    $("#cover-preview").src = imageOf(work);
    $("#cover-preview").classList.remove("hidden");
  }
  dialog().showModal();
}

export function initDialog() {
  $("#open-form").addEventListener("click", openNewForm);
  $("#cancel-form").addEventListener("click", () => dialog().close());
  $("#close-form").addEventListener("click", () => dialog().close());
  dialog().addEventListener("click", (event) => {
    if (event.target === dialog()) dialog().close();
  });

  form().addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = $("#work-id").value;
    const existing = state.works.find((w) => w.id === id);
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
      id: existing?.id || undefined,
      title,
      type: $("#type").value,
      cover: $("#cover").value.trim(),
      coverData,
      status: $("#status").value,
      author: $("#author").value.trim(),
      genre: $("#genre").value.trim(),
      progress: existing?.progress ?? 0,
      total: existing?.total ?? 0,
      rating: $("#rating").value,
      notes: $("#notes").value.trim(),
      favorite: existing?.favorite || false,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    });

    if (!next) return toast("Confira os dados preenchidos.");

    if (!(await upsertWork(next, existing?.id))) return;

    dialog().close();
    resetForm();
    render();
    toast(
      existing
        ? "Obra atualizada com sucesso ♡"
        : "Obra adicionada à biblioteca ♡",
    );
  });
}

export function initGridActions() {
  $("#book-grid").addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === "add-first") return openNewForm();

    const work = state.works.find((w) => w.id === id);
    if (!work) return;

    if (action === "edit") {
      openEditForm(work);
    } else if (action === "favorite") {
      toggleFavorite(id);
    } else if (action === "delete") {
      if (!confirm(`Deseja excluir "${work.title}"?`)) return;
      if (await removeWork(id)) {
        render();
        toast("Obra removida da biblioteca.");
      }
    }
  });
}
