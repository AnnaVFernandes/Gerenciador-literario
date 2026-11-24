import { STORAGE_KEY, ALLOWED_TYPES, ALLOWED_STATUSES } from "./constants.js";
import { createId, safeImageUrl } from "./utils.js";

export function normalizeWork(work) {
  if (
    !work ||
    typeof work !== "object" ||
    typeof work.title !== "string" ||
    !work.title.trim()
  )
    return null;

  const coverData =
    typeof work.coverData === "string" &&
    work.coverData.startsWith("data:image/")
      ? work.coverData
      : "";

  return {
    id: String(work.id || createId()),
    title: work.title.trim().slice(0, 160),
    type: ALLOWED_TYPES.includes(work.type) ? work.type : "Livro",
    cover: safeImageUrl(work.cover || ""),
    coverData,
    status: ALLOWED_STATUSES.includes(work.status) ? work.status : "Quero ler",
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

export function loadWorks() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data.map(normalizeWork).filter(Boolean) : [];
  } catch (error) {
    console.warn("Não foi possível ler a biblioteca salva.", error);
    return [];
  }
}

export function persist(works, { onError } = {}) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(works));
    return true;
  } catch (error) {
    console.error(error);
    if (onError) onError();
    return false;
  }
}
