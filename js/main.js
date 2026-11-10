import { initState } from "./modules/state.js";
import { initDialog, initGridActions } from "./modules/dialog.js";
import { initFilters } from "./modules/filters.js";
import { initRating } from "./modules/rating.js";
import { initGenres } from "./modules/genres.js";
import { initCovers } from "./modules/covers.js";
import { initBackup } from "./modules/backup.js";
import { render } from "./modules/render.js";
import { toast } from "./modules/toast.js";

async function bootstrap() {
  initRating();
  initGenres();
  initCovers();
  initFilters();
  initDialog();
  initGridActions();
  initBackup();
  render();

  try {
    await initState();
  } catch (error) {
    console.error(error);
    toast(error.message);
  }
  render();
}

document.addEventListener("DOMContentLoaded", bootstrap);
