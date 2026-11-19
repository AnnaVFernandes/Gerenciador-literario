"use strict";

const $ = (selector) => document.querySelector(selector);

const loginForm = $("#login-form");
const registerForm = $("#register-form");

function showMessage(message) {
  const element = $("#auth-message");

  if (element) {
    element.textContent = message;
  }
}

// LOGIN
if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    showMessage(
      "A tela de login está pronta! " +
        "Agora precisamos conectar a autenticação ao backend.",
    );
  });
}

// CADASTRO
if (registerForm) {
  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const password = $("#password").value;
    const confirmation = $("#confirm-password").value;

    if (password !== confirmation) {
      showMessage("As senhas não coincidem.");
      return;
    }

    if (password.length < 8) {
      showMessage("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    showMessage(
      "Formulário validado! " +
        "O cadastro será ativado após configurar o backend.",
    );
  });
}
