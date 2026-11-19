const API = "http://localhost:5272";
const id = new URLSearchParams(location.search).get("id");
const $ = (s) => document.querySelector(s);

let work,
  data = { html: "", start: "", end: "", theme: "pink", images: [] },
  timer,
  revision = 0,
  saving = false;

const status = (t) => ($("#save-status").textContent = t);
const error = (t) => ($("#error").textContent = t);
const clean = (html) =>
  window.DOMPurify
    ? DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ["style", "iframe", "form", "svg", "math"],
      })
    : "";

async function req(path, opts = {}) {
  let r = await fetch(API + path, opts);
  if (!r.ok)
    throw new Error((await r.text()).slice(0, 300) || "Erro HTTP " + r.status);
  return r.json();
}

function snapshot() {
  data.html = clean($("#editor").innerHTML);
  data.start = $("#start-date").value;
  data.end = $("#end-date").value;
  data.theme = $("#theme").value;
  return JSON.stringify(data);
}

function schedule() {
  revision++;
  status("Alterações pendentes…");
  clearTimeout(timer);
  timer = setTimeout(save, 850);
}

async function save() {
  if (!work || saving) return;
  const at = revision;
  const payload = snapshot();
  saving = true;
  status("Salvando…");
  error("");
  try {
    const r = await req(`/api/work/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...work,
        reviewHtml: payload,
        rating: Number(work.rating) || 0,
      }),
    });
    work = r;
    status("✓ Salvo");
  } catch (e) {
    status("Não foi possível salvar");
    error("Erro ao salvar: " + e.message);
  } finally {
    saving = false;
    if (revision !== at) {
      clearTimeout(timer);
      timer = setTimeout(save, 400);
    }
  }
}

function rating() {
  const root = $("#rating");
  root.replaceChildren();

  for (let i = 1; i <= 5; i++) {
    const b = document.createElement("button");

    b.type = "button";
    b.textContent = "★";

    const currentRating = Number(work.rating) || 0;

    b.className = i <= currentRating ? "active" : "";

    b.setAttribute("aria-label", `${i} estrelas`);
    b.setAttribute("aria-pressed", String(i === currentRating));

    b.onclick = () => {
      const current = Number(work.rating) || 0;

      // Se clicar na nota atual, remove a avaliação.
      // Caso contrário, seleciona a nova nota.
      work.rating = current === i ? 0 : i;

      rating();
      schedule();
    };

    root.append(b);
  }

  $("#rating-value").textContent = Number(work.rating)
    ? `${work.rating}/5`
    : "Sem nota";
}

function gallery() {
  const root = $("#gallery");
  root.replaceChildren();
  data.images.forEach((src, i) => {
    const f = document.createElement("figure"),
      img = document.createElement("img"),
      b = document.createElement("button");
    img.src = src;
    img.alt = `Imagem ${i + 1} da resenha`;
    b.textContent = "×";
    b.title = "Remover imagem";
    b.onclick = () => {
      data.images.splice(i, 1);
      gallery();
      schedule();
    };
    f.append(img, b);
    root.append(f);
  });
}

async function upload(files) {
  for (const file of files) {
    if (
      !["image/png", "image/jpeg"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      error("Use PNG/JPG de até 2 MB.");
      continue;
    }
    try {
      status("Enviando imagem…");
      const fd = new FormData();
      fd.append("file", file);
      const r = await req("/api/work/upload-image", {
        method: "POST",
        body: fd,
      });
      const url = new URL(r.url, API);
      if (url.origin !== new URL(API).origin) throw Error("URL inválida");
      data.images.push(url.href);
      gallery();
      schedule();
    } catch (e) {
      error("Falha no upload: " + e.message);
    }
  }
}

async function init() {
  if (!id) {
    error("Obra não identificada. Volte à biblioteca.");
    return;
  }
  try {
    work = await req(`/api/work/${encodeURIComponent(id)}`);
    try {
      const stored = JSON.parse(work.reviewHtml || "{}");
      if (stored && typeof stored === "object")
        data = {
          ...data,
          ...stored,
          images: Array.isArray(stored.images) ? stored.images : [],
        };
    } catch {
      data.html = work.reviewHtml || "";
    }
    $("#work-title").textContent = work.title;
    $("#work-meta").textContent = [work.type, work.author, work.status]
      .filter(Boolean)
      .join(" · ");
    if (work.coverUrl) {
      const img = document.createElement("img");
      img.src = new URL(work.coverUrl, API).href;
      img.alt = "Capa";
      $("#work-cover").replaceChildren(img);
    }
    $("#editor").innerHTML = clean(data.html || "");
    $("#start-date").value = data.start || "";
    $("#end-date").value = data.end || "";
    $("#theme").value = ["pink", "lavender", "mint", "peach"].includes(
      data.theme,
    )
      ? data.theme
      : "pink";
    document.body.dataset.theme = $("#theme").value;
    rating();
    gallery();
    status("Pronto para escrever ♡");
  } catch (e) {
    error("Não foi possível abrir a obra: " + e.message);
    status("Erro");
  }
}

$("#editor").addEventListener("input", schedule);
["#start-date", "#end-date"].forEach((s) =>
  $(s).addEventListener("change", schedule),
);
$("#theme").addEventListener("change", () => {
  document.body.dataset.theme = $("#theme").value;
  schedule();
});
$("#save-now").onclick = () => {
  clearTimeout(timer);
  revision++;
  save();
};
$(".toolbar").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  $("#editor").focus();
  if (b.dataset.cmd) document.execCommand(b.dataset.cmd, false, null);
  if (b.dataset.block)
    document.execCommand("formatBlock", false, b.dataset.block);
  schedule();
});
$("#emoji").onchange = (e) => {
  if (!e.target.value) return;
  $("#editor").focus();
  document.execCommand("insertText", false, e.target.value);
  e.target.value = "";
  schedule();
};
$("#images").onchange = (e) => {
  upload([...e.target.files]);
  e.target.value = "";
};
document.addEventListener("paste", (e) => {
  const files = [...(e.clipboardData?.files || [])].filter((f) =>
    f.type.startsWith("image/"),
  );
  if (files.length) {
    e.preventDefault();
    upload(files);
  }
});
window.addEventListener("beforeunload", (e) => {
  if (saving || $("#save-status").textContent.includes("pendentes")) {
    e.preventDefault();
  }
});
init();
