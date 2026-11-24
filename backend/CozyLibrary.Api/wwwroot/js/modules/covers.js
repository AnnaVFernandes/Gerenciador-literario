import { $, safeImageUrl, readImage } from "./utils.js";
import { toast } from "./toast.js";

export function resetCoverPreview() {
  const preview = $("#cover-preview");
  preview.src = "";
  preview.classList.add("hidden");
}

export function previewCoverFromUrl(url) {
  const safe = safeImageUrl(url);
  const preview = $("#cover-preview");
  if (safe) {
    preview.src = safe;
    preview.classList.remove("hidden");
  } else if (!$("#cover-file").files.length) {
    preview.classList.add("hidden");
  }
}

export function previewCoverFromFile(file) {
  const preview = $("#cover-preview");
  preview.src = file;
  preview.classList.remove("hidden");
}

export function initCovers() {
  $("#cover").addEventListener("input", () => {
    previewCoverFromUrl($("#cover").value);
  });

  $("#cover-file").addEventListener("change", async () => {
    const file = $("#cover-file").files[0];
    if (!file) return;
    try {
      const dataUrl = await readImage(file);
      previewCoverFromFile(dataUrl);
    } catch (error) {
      $("#cover-file").value = "";
      toast(error.message);
    }
  });
}
