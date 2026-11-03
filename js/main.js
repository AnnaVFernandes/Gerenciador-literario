import { initState } from "./modules/state.js";
import { initDialog, initGridActions } from "./modules/dialog.js";
import { initFilters } from "./modules/filters.js";
import { initRating } from "./modules/rating.js";
import { initGenres } from "./modules/genres.js";
import { initCovers } from "./modules/covers.js";
import { initBackup } from "./modules/backup.js";
import { render } from "./modules/render.js";

function bootstrap() {
  initState();
  initRating();
  initGenres();
  initCovers();
  initFilters();
  initDialog();
  initGridActions();
  initBackup();
  render();
}

document.addEventListener("DOMContentLoaded", bootstrap);
