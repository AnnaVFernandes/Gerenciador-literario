export const $ = (selector) => document.querySelector(selector);

export function createId() {
  return (
    window.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

export function safeImageUrl(value) {
  if (!value || typeof value !== "string") return "";
  try {
    const url = new URL(value.trim(), location.href);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

export function escapeHTML(value = "") {
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

export function imageOf(work) {
  return work.coverData || safeImageUrl(work.cover);
}

export function readImage(file) {
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
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });
}
