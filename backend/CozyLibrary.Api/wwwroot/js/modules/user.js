/*
const login = "/paginas/autenticacao/login.html";

export async function accountRequest(url, method = "GET", data) {
  const headers = {};
  if (method !== "GET") {
    const csrf = await accountRequest("/api/auth/csrf");
    headers["X-CSRF-TOKEN"] = csrf.token;
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers,
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  if (response.status === 401) {
    location.replace(login);
    throw new Error("Sessão encerrada.");
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      result.message ||
        Object.values(result.errors || {})
          .flat()
          .join(" ") ||
        `Erro ${response.status}`,
    );
  return result;
}

export function bindLogout(button, onError) {
  button?.addEventListener("click", async () => {
    button.disabled = true;
    try {
      await accountRequest("/api/auth/logout", "POST");
      location.replace(login);
    } catch (error) {
      onError(error.message);
      button.disabled = false;
    }
  });
}

export async function initUser() {
  const user = await accountRequest("/api/auth/me");
  document.querySelector("#account-name").textContent = user.displayName;
  document.querySelector("#account-initial").textContent =
    user.displayName?.charAt(0).toUpperCase() || "♡";
  bindLogout(document.querySelector("#logout-button"), (message) =>
    alert(message),
  );
}
*/
