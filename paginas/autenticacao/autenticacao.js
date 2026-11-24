/*
"use strict";

// CONFIGURAÇÕES
const AUTH_API = "/api/auth";

const $ = (selector) => document.querySelector(selector);

const loginForm = $("#login-form");
const registerForm = $("#register-form");

function showMessage(message) {
  const element = $("#auth-message");

  if (element) {
    element.textContent = message;
  }
}

// COMUNICAÇÃO COM O BACKEND
async function authRequest(endpoint, data) {
  let response;

  try {
    response = await fetch(`${AUTH_API}/${endpoint}`, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error("Não foi possível conectar ao servidor.");
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Mensagem retornada pelo controller.
    if (result.message) {
      throw new Error(result.message);
    }

    // Erros de validação do ASP.NET Core.
    if (result.errors) {
      const messages = Object.values(result.errors).flatMap((value) =>
        Array.isArray(value) ? value : [value],
      );

      throw new Error(messages.join(" ") || "Verifique os dados informados.");
    }

    throw new Error("Não foi possível concluir a operação.");
  }

  return result;
}

// LOGIN
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = $("#email").value.trim();
    const password = $("#password").value;

    const button = loginForm.querySelector('button[type="submit"]');

    button.disabled = true;

    showMessage("Entrando na sua biblioteca... ♡");

    try {
      await authRequest("login", {
        email,
        password,
      });

      showMessage("Login realizado com sucesso! ♡");

      // Abre a biblioteca após o login.
      window.location.href = "/index.html";
    } catch (error) {
      showMessage(error.message);
    } finally {
      button.disabled = false;
    }
  });
}

// CADASTRO
if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = $("#name").value.trim();
    const email = $("#email").value.trim();
    const password = $("#password").value;

    const confirmation = $("#confirm-password").value;

    const button = registerForm.querySelector('button[type="submit"]');

    // Verificar nome.
    if (!name) {
      showMessage("Digite seu nome.");
      return;
    }

    // Verificar e-mail.
    if (!email) {
      showMessage("Digite seu e-mail.");
      return;
    }

    // Verificar tamanho da senha.
    if (password.length < 8) {
      showMessage("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    // Verificar se a senha contém número.
    if (!/\d/.test(password)) {
      showMessage("A senha precisa conter pelo menos um número.");
      return;
    }

    // Verificar se a senha contém letra minúscula.
    if (!/[a-z]/.test(password)) {
      showMessage("A senha precisa conter pelo menos uma letra minúscula.");
      return;
    }

    // Verificar confirmação de senha.
    if (password !== confirmation) {
      showMessage("As senhas não coincidem.");
      return;
    }

    button.disabled = true;

    showMessage("Criando sua conta... ♡");

    try {
      // Envia os dados para o ASP.NET Core.
      await authRequest("register", {
        name,
        email,
        password,
        confirmPassword: confirmation,
      });

      showMessage("Conta criada com sucesso! ♡");

      // Redireciona para a tela de login.
      window.location.href = "/paginas/autenticacao/login.html";
    } catch (error) {
      showMessage(error.message);
    } finally {
      button.disabled = false;
    }
  });
}
*/
