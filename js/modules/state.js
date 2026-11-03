import { loadWorks } from "./storage.js";

export const state = {
  works: [],
  activeCategory: "Todas",
  toastTimeout: null,
};

export function initState() {
  state.works = loadWorks();
}

export function setWorks(next) {
  state.works = next;
}
