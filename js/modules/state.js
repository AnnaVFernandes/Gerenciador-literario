import { getWorks } from "./api.js";

export const state = {
  works: [],
  activeCategory: "Todas",
  toastTimeout: null,
};

// Carrega as obras do back end
export async function initState() {
  state.works = await getWorks();
}

export function setWorks(next) {
  state.works = next;
}
