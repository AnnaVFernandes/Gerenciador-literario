"use strict";

import { initState } from "./modules/state.js";
import { initDialog, initGridActions } from "./modules/dialog.js";
import { initFilters } from "./modules/filters.js";
import { initRating } from "./modules/rating.js";
import { initGenres } from "./modules/genres.js";
import { initCovers } from "./modules/covers.js";
import { initBackup } from "./modules/backup.js";
import { render } from "./modules/render.js";
import { initDashboardInteractions } from "./modules/dashboard.js";
import { toast } from "./modules/toast.js";

// INICIALIZAÇÃO DA BIBLIOTECA
// A biblioteca é iniciada diretamente,
// sem exigir login ou cadastro.
async function bootstrap() {
  // Inicializa as funcionalidades.
  initRating();
  initGenres();
  initCovers();
  initFilters();
  initDashboardInteractions();
  initDialog();
  initGridActions();
  initBackup();

  // Renderiza a interface inicial.
  render();

  // Carrega as obras do PostgreSQL.
  try {
    await initState();
  } catch (error) {
    console.error(error);
    toast(error.message);
  }

  // Atualiza a interface com os dados carregados.
  render();
}

// Aguarda o carregamento do HTML.
document.addEventListener("DOMContentLoaded", bootstrap);
