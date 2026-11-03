import { state } from "./state.js";
import { $ } from "./utils.js";

export function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(state.toastTimeout);
  state.toastTimeout = setTimeout(() => element.classList.remove("show"), 3200);
}
