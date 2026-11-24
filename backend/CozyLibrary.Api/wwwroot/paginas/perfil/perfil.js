/*
import { accountRequest, bindLogout } from "/js/modules/user.js";
const $ = (id) => document.getElementById(id);
const message = (text) => {
  $("profile-message").textContent = text;
};

async function load() {
  const p = await accountRequest("/api/profile");
  $("display-name").textContent = p.displayName;
  $("avatar").textContent = p.displayName?.charAt(0).toUpperCase() || "♡";
  $("name").value = p.displayName;
  $("email").value = p.email;
  $("member-since").textContent =
    "Membro desde " + new Date(p.createdAt).toLocaleDateString("pt-BR");
  for (const key of ["total", "favorites", "completed"])
    $(key).textContent = p[key];
  $("profile-content").hidden = false;
}
function bindForm(id, action) {
  $(id).addEventListener("submit", async (e) => {
    e.preventDefault();
    const button = e.currentTarget.querySelector("button");
    button.disabled = true;
    try {
      await action();
    } catch (error) {
      message(error.message);
    } finally {
      button.disabled = false;
    }
  });
}
bindForm("profile-form", async () => {
  const result = await accountRequest("/api/profile", "PUT", {
    displayName: $("name").value.trim(),
  });
  await load();
  message(result.message);
});

bindForm("password-form", async () => {
  if ($("new").value !== $("confirm").value)
    throw new Error("As senhas não coincidem.");
  const result = await accountRequest("/api/profile/password", "POST", {
    currentPassword: $("current").value,
    newPassword: $("new").value,
    confirmPassword: $("confirm").value,
  });
  $("password-form").reset();
  message(result.message);
});

bindLogout($("logout"), message);
load().catch((error) => message(error.message)); 
*/
