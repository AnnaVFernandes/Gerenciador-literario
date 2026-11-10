import { state, setWorks } from "./state.js";
import { createWork, updateWork, deleteWork } from "./api.js";
import { toast } from "./toast.js";
import { render } from "./render.js";

// Salva (cria ou atualiza) a obra no back end e só então atualiza a tela.
export async function upsertWork(next, existingId) {
  try {
    if (existingId) {
      const saved = await updateWork({ ...next, id: existingId });
      setWorks(state.works.map((w) => (w.id === existingId ? saved : w)));
    } else {
      // O back end gera o Id; usamos o objeto devolvido por ele.
      const saved = await createWork(next);
      setWorks([saved, ...state.works]);
    }
    return true;
  } catch (error) {
    console.error(error);
    toast(error.message || "Não foi possível salvar a obra.");
    return false;
  }
}

async function saveFavorite(id, favorite) {
  const work = state.works.find((w) => w.id === id);
  if (!work) return;

  try {
    const saved = await updateWork({ ...work, favorite });
    setWorks(state.works.map((w) => (w.id === id ? saved : w)));
  } catch (error) {
    console.error(error);
    toast(error.message || "Não foi possível atualizar o favorito.");
  }
  render();
}

export function toggleFavorite(id) {
  const work = state.works.find((w) => w.id === id);

  if (!work) return;

  if (!work.favorite) {
    saveFavorite(id, true);
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
    saveFavorite(id, false);
  }

  button.addEventListener("animationend", finishBreaking, {
    once: true,
  });

  setTimeout(finishBreaking, 650);
}

export async function removeWork(id) {
  try {
    await deleteWork(id);
    setWorks(state.works.filter((w) => w.id !== id));
    return true;
  } catch (error) {
    console.error(error);
    toast(error.message || "Não foi possível excluir a obra.");
    return false;
  }
}
