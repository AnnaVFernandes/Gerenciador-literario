// Endereço HTTP LaunchSettings.json do projeto backend

const API_URL = "http://localhost:5272/api/work";

async function request(path = "", options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    throw new Error(
      "Não foi possível acessar a API. Confira se o backend está em execução em http://localhost:5272.",
    );
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `Erro na API (${response.status}).`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function fromApi(work) {
  const cover = work.coverUrl || work.coverURL || "";
  const createdAt = Date.parse(work.createdAt) || Date.now();
  const updatedAt = Date.parse(work.updatedAt) || Date.now();

  return {
    id: String(work.id),
    title: work.title || "",
    type: work.type || "Livro",
    cover: cover.startsWith("data:image/") ? "" : cover,
    coverData: cover.startsWith("data:image/") ? cover : "",
    status: work.status || "Quero ler",
    author: work.author || "",
    genre: work.genre || "",
    progress: Number(work.progress) || 0,
    total: Number(work.total) || 0,
    rating: work.rating == null ? "" : Number(work.rating),
    notes: work.notes || "",
    favorite: Boolean(work.favorite),
    createdAt,
    updatedAt,
  };
}

function toApi(work) {
  return {
    title: work.title,
    type: work.type,
    coverUrl: work.coverData || work.cover || null,
    status: work.status,
    author: work.author || null,
    genre: work.genre || null,
    progress: Number(work.progress) || 0,
    total: Number(work.total) || 0,
    rating: Number(work.rating) || 0,
    notes: work.notes || null,
    favorite: Boolean(work.favorite),
  };
}

export async function getWorks() {
  const works = await request();
  return works.map(fromApi);
}

export async function createWork(work) {
  const saved = await request("", {
    method: "POST",
    body: JSON.stringify(toApi(work)),
  });
  return fromApi(saved);
}

export async function updateWork(work) {
  const saved = await request(`/${encodeURIComponent(work.id)}`, {
    method: "PUT",
    body: JSON.stringify(toApi(work)),
  });

  return fromApi(saved);
}

export async function deleteWork(id) {
  await request(`/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function replaceWorks(works) {
  await request("/replace", {
    method: "PUT",
    body: JSON.stringify(works.map(toApi)),
  });
  return getWorks();
}
