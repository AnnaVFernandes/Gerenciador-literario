import { state, setWorks } from "./state.js";
import { persist } from "./storage.js";
import { toast } from "./toast.js";
import { createId } from "./utils.js";
import { render } from "./render.js";

function persistWithToast() {
  return persist(state.works, {
    onError: () =>
      toast(
        "Não foi possível salvar. O armazenamento pode estar cheio; tente reduzir as imagens locais.",
      ),
  });
}

export function upsertWork(next, existingId) {
  const oldWorks = state.works;

  setWorks(
    existingId
      ? state.works.map((w) => (w.id === existingId ? next : w))
      : [next, ...state.works],
  );

  if (!persistWithToast()) {
    setWorks(oldWorks);
    return false;
  }

  return true;
}

export function toggleFavorite(id) {
  const work = state.works.find((w) => w.id === id);

  if (!work) return;

  if (!work.favorite) {
    const oldWorks = state.works;

    setWorks(
      state.works.map((w) =>
        w.id === id ? { ...w, favorite: true, updatedAt: Date.now() } : w,
      ),
    );

    if (!persistWithToast()) {
      setWorks(oldWorks);
    }

    render();
    return;
  }

  const button = document.querySelector(
    `.favorite-btn[data-id="${CSS.escape(String(id))}"]`,
  );

  if (!button || button.classList.contains("is-breaking")) return;

  button.classList.remove("is-favorite");
  button.classList.add("is-breaking");
  button.textContent = "💔";
  button.setAttribute("aria-label", "Removendo dos favoritos");

  let finished = false;

  function finishBreaking() {
    if (finished) return;
    finished = true;

    const oldWorks = state.works;

    setWorks(
      state.works.map((w) =>
        w.id === id ? { ...w, favorite: false, updatedAt: Date.now() } : w,
      ),
    );

    if (!persistWithToast()) {
      setWorks(oldWorks);
    }

    render();
  }

  button.addEventListener("animationend", finishBreaking, {
    once: true,
  });

  setTimeout(finishBreaking, 650);
}

export function removeWork(id) {
  const oldWorks = state.works;

  setWorks(state.works.filter((w) => w.id !== id));

  if (!persistWithToast()) {
    setWorks(oldWorks);
    return false;
  }

  return true;
}

export function createIdSafe() {
  return createId();
}
