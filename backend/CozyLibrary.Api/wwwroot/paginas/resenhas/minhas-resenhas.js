import { getWorks } from "../../js/modules/api.js";
const list = document.querySelector("#review-list");
const message = document.querySelector("#review-message");
const search = document.querySelector("#review-search");
const count = document.querySelector("#review-count");
const loading = document.querySelector("#review-loading");

let works = [];
const emojis = { Livro: "📚", Mangá: "🌸", Manhwa: "💗", Anime: "🎀" };

function show() {
  loading.hidden = true;
  const query = search.value.trim().toLocaleLowerCase("pt-BR");
  const visible = works.filter((w) =>
    [w.title, w.author, w.type].some((x) =>
      String(x || "")
        .toLocaleLowerCase("pt-BR")
        .includes(query),
    ),
  );
  list.replaceChildren();
  count.textContent = `${visible.length} ${visible.length === 1 ? "obra" : "obras"}`;
  message.textContent = visible.length
    ? `${visible.length} obra(s) encontrada(s)`
    : "Nenhuma obra encontrada. Cadastre uma obra na biblioteca para começar ♡";
  for (const work of visible) {
    const card = document.createElement("article");
    card.className = "review-card";
    const cover = document.createElement("div");
    cover.className = "review-cover";
    const imageUrl = work.coverData || work.cover;
    if (imageUrl) {
      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = `Capa de ${work.title}`;
      img.onerror = () => {
        cover.textContent = emojis[work.type] || "📖";
      };
      cover.append(img);
    } else cover.textContent = emojis[work.type] || "📖";
    const body = document.createElement("div");
    body.className = "review-card-body";
    const title = document.createElement("h2");
    title.textContent = work.title;
    const meta = document.createElement("p");
    meta.textContent = [work.type, work.author].filter(Boolean).join(" · ");
    const link = document.createElement("a");
    link.className = "review-open";
    link.href = `resenha.html?id=${encodeURIComponent(work.id)}`;
    link.textContent = "📖 Abrir diário";
    body.append(title, meta, link);
    card.append(cover, body);
    list.append(card);
  }
}
search.addEventListener("input", show);
try {
  works = await getWorks();
  show();
} catch (e) {
  message.textContent = `Não foi possível carregar as obras: ${e.message}`;
  count.textContent = "Indisponível";
  console.error("Erro ao carregar as resenhas:", e);
}
