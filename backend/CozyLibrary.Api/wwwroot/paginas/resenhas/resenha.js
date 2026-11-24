"use strict";

// ========================================
// 1. CONFIGURAÇÕES
// ========================================

// A API usa o mesmo domínio do site.
// Exemplo: https://localhost:7174
const API = window.location.origin;

// Identifica a obra pela URL:
// resenha.html?id=...
const id = new URLSearchParams(window.location.search).get("id");

// Facilita a seleção de elementos HTML.
const $ = (selector) => document.querySelector(selector);

// Dados da obra e da resenha.
let work = null;

let data = {
  html: "",
  start: "",
  end: "",
  theme: "pink",
  images: [],
};

// Controle do salvamento automático.
let timer = null;
let revision = 0;
let lastSavedRevision = -1;
let saving = false;
let saveFailed = false;

function status(message) {
  const element = $("#save-status");

  if (element) {
    element.textContent = message;
  }
}

function error(message) {
  const element = $("#error");

  if (element) {
    element.textContent = message;
  }
}

function clean(html) {
  if (!window.DOMPurify) {
    return "";
  }

  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "iframe", "form", "svg", "math"],
  });
}

// COMUNICAÇÃO COM A API
async function req(path, opts = {}) {
  let response;

  try {
    response = await fetch(API + path, {
      ...opts,
      credentials: "same-origin",
    });
  } catch {
    throw new Error("Não foi possível conectar ao servidor.");
  }

  if (response.status === 401) {
    throw new Error("Sua sessão expirou. Faça login novamente.");
  }

  if (!response.ok) {
    const message = await response.text().catch(() => "");

    throw new Error(message.slice(0, 300) || `Erro HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function snapshot() {
  data.html = clean($("#editor").innerHTML);
  data.start = $("#start-date").value;
  data.end = $("#end-date").value;
  data.theme = $("#theme").value;

  return JSON.stringify(data);
}

// AGENDAR SALVAMENTO AUTOMÁTICO
function schedule() {
  revision++;

  saveFailed = false;

  status("Alterações pendentes…");

  clearTimeout(timer);

  timer = setTimeout(() => {
    save();
  }, 850);
}

// SALVAR RESENHA
async function save() {
  if (!work || saving) {
    return;
  }

  if (revision === lastSavedRevision) {
    return;
  }

  clearTimeout(timer);

  const currentRevision = revision;
  const payload = snapshot();

  const workToSave = {
    ...work,
    reviewHtml: payload,
    rating: Number(work.rating) || 0,
  };

  saving = true;

  status("Salvando…");
  error("");

  try {
    const savedWork = await req(`/api/work/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(workToSave),
    });

    const latestRating = work.rating;

    work = savedWork;

    if (revision !== currentRevision) {
      work.rating = latestRating;
    }

    lastSavedRevision = currentRevision;
    saveFailed = false;

    if (revision === currentRevision) {
      status("✓ Salvo");
    } else {
      status("Alterações pendentes…");
    }
  } catch (err) {
    saveFailed = true;

    status("Não foi possível salvar");

    error("Erro ao salvar: " + err.message);
  } finally {
    saving = false;

    if (revision !== currentRevision) {
      clearTimeout(timer);

      timer = setTimeout(() => {
        save();
      }, 400);
    }
  }
}

//AVALIAÇÃO POR ESTRELAS
function rating() {
  const root = $("#rating");

  root.replaceChildren();

  const currentRating = Number(work.rating) || 0;

  for (let i = 1; i <= 5; i++) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = "★";

    button.className = i <= currentRating ? "active" : "";

    button.setAttribute("aria-label", `${i} estrelas`);

    button.setAttribute("aria-pressed", String(i === currentRating));

    button.onclick = () => {
      const current = Number(work.rating) || 0;

      work.rating = current === i ? 0 : i;

      rating();
      schedule();
    };

    root.append(button);
  }

  $("#rating-value").textContent = currentRating
    ? `${currentRating}/5`
    : "Sem nota";
}

// GALERIA DE IMAGENS
function gallery() {
  const root = $("#gallery");

  root.replaceChildren();

  data.images.forEach((src, index) => {
    const figure = document.createElement("figure");
    const image = document.createElement("img");
    const button = document.createElement("button");

    image.src = src;
    image.alt = `Imagem ${index + 1} da resenha`;
    image.loading = "lazy";

    button.type = "button";
    button.textContent = "×";
    button.title = "Remover imagem";

    button.setAttribute("aria-label", `Remover imagem ${index + 1}`);

    button.onclick = () => {
      data.images.splice(index, 1);

      gallery();
      schedule();
    };

    figure.append(image, button);
    root.append(figure);
  });
}

// 10. UPLOAD DE IMAGENS
async function upload(files) {
  for (const file of files) {
    // Aceita somente PNG e JPG até 2 MB.
    if (
      !["image/png", "image/jpeg"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      error("Use PNG/JPG de até 2 MB.");
      continue;
    }

    try {
      status("Enviando imagem…");

      const formData = new FormData();

      formData.append("file", file);

      const response = await req("/api/work/upload-image", {
        method: "POST",
        body: formData,
      });
      const url = new URL(response.url, API);

      if (url.origin !== window.location.origin) {
        throw new Error("URL de imagem inválida.");
      }

      data.images.push(url.pathname);

      gallery();
      schedule();
    } catch (err) {
      error("Falha no upload: " + err.message);

      status("Erro ao enviar imagem");
    }
  }
}

//  CARREGAR RESENHA
async function init() {
  if (!id) {
    error("Obra não identificada. Volte à biblioteca.");
    return;
  }

  try {
    // Busca a obra no PostgreSQL pela API.
    work = await req(`/api/work/${encodeURIComponent(id)}`);

    // Recupera a resenha salva.
    try {
      const stored = JSON.parse(work.reviewHtml || "{}");

      if (stored && typeof stored === "object" && !Array.isArray(stored)) {
        data = {
          ...data,
          ...stored,
          images: Array.isArray(stored.images) ? stored.images : [],
        };
      }
    } catch {
      // Compatibilidade com resenhas antigas
      // que armazenavam apenas HTML.
      data.html = work.reviewHtml || "";
    }

    // Informações da obra.
    $("#work-title").textContent = work.title;

    $("#work-meta").textContent = [work.type, work.author, work.status]
      .filter(Boolean)
      .join(" · ");

    // Capa da obra.
    if (work.coverUrl) {
      const image = document.createElement("img");

      image.src = new URL(work.coverUrl, API).href;

      image.alt = "Capa de " + work.title;

      $("#work-cover").replaceChildren(image);
    }

    // Conteúdo da resenha.
    $("#editor").innerHTML = clean(data.html || "");

    // Datas.
    $("#start-date").value = data.start || "";
    $("#end-date").value = data.end || "";

    // Tema.
    const availableThemes = ["pink", "lavender", "mint", "peach"];

    $("#theme").value = availableThemes.includes(data.theme)
      ? data.theme
      : "pink";

    document.body.dataset.theme = $("#theme").value;

    // Componentes visuais.
    rating();
    gallery();

    // A versão inicial corresponde
    // aos dados carregados do servidor.
    lastSavedRevision = revision;

    status("Pronto para escrever ♡");
  } catch (err) {
    error("Não foi possível abrir a obra: " + err.message);

    status("Erro");
  }
}

// Salva quando o texto muda.
$("#editor").addEventListener("input", schedule);

// Salva quando as datas mudam.
["#start-date", "#end-date"].forEach((selector) => {
  $(selector).addEventListener("change", schedule);
});

$("#theme").addEventListener("change", () => {
  document.body.dataset.theme = $("#theme").value;

  schedule();
});

$("#save-now").onclick = () => {
  clearTimeout(timer);

  save();
};

$(".toolbar").addEventListener("click", (event) => {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  $("#editor").focus();

  if (button.dataset.cmd) {
    document.execCommand(button.dataset.cmd, false, null);
  }

  if (button.dataset.block) {
    document.execCommand("formatBlock", false, button.dataset.block);
  }

  schedule();
});

$("#emoji").onchange = (event) => {
  if (!event.target.value) {
    return;
  }

  $("#editor").focus();

  document.execCommand("insertText", false, event.target.value);

  event.target.value = "";

  schedule();
};

$("#images").onchange = (event) => {
  const files = [...event.target.files];

  upload(files);

  event.target.value = "";
};

document.addEventListener("paste", (event) => {
  const files = [...(event.clipboardData?.files || [])].filter((file) =>
    file.type.startsWith("image/"),
  );

  if (files.length > 0) {
    event.preventDefault();

    upload(files);
  }
});

window.addEventListener("beforeunload", (event) => {
  const hasPendingChanges = revision !== lastSavedRevision;

  if (saving || hasPendingChanges || saveFailed) {
    event.preventDefault();
    event.returnValue = "";
  }
});

init();
