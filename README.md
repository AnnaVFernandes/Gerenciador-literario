<div align="center">
  <img src="backend/CozyLibrary.Api/wwwroot/img/livros-boas-vindas.png" width="220" alt="Ilustração da Cozy Library">

# 🌷 Cozy Library

**Seu pequeno universo literário. ♡**

Um espaço para organizar histórias, acompanhar leituras e guardar memórias.

![HTML5](https://img.shields.io/badge/HTML5-E8A0BF?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-D8B4E2?style=flat-square&logo=css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-E8C77B?style=flat-square&logo=javascript&logoColor=white)
![.NET](https://img.shields.io/badge/.NET-10-9575CD?style=flat-square&logo=dotnet&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-91AEC4?style=flat-square&logo=postgresql&logoColor=white)
![Status](https://img.shields.io/badge/Status-Em%20desenvolvimento-E8A0BF?style=flat-square)

</div>

## 📖 Sobre o projeto

A **Cozy Library** é uma aplicação web de gerenciamento de leituras e diário literário. Seu objetivo é reunir livros, mangás, manhwas e animes em uma biblioteca pessoal, com uma interface acolhedora e personalizável.

O projeto também é uma oportunidade de praticar desenvolvimento full stack, organização de código, integração com APIs REST, persistência de dados e design de interfaces.

## ✨ Funcionalidades

- Cadastro, edição e exclusão de obras.
- Organização por tipo, autor, gênero e status.
- Acompanhamento de progresso e avaliação por estrelas.
- Capas personalizadas e lista de favoritos.
- Pesquisa, filtros e ordenação da coleção.
- Dashboard com indicadores e gráficos de gêneros, mídias e status.
- Diário de resenhas com editor de texto, datas, temas e galeria de imagens.
- Importação e exportação de backup em JSON.
- Persistência de obras no PostgreSQL por meio da API.

## 🎨 Interface

A identidade visual combina tons suaves de rosa, elementos delicados e uma estética cozy inspirada em diários de leitura. A aplicação possui tela de boas-vindas, biblioteca, listagem de resenhas e diário individual.

## 💻 Tecnologias utilizadas

| Camada                                 | Tecnologias                          |
| -------------------------------------- | ------------------------------------ |
| Frontend                               | HTML5, CSS3, JavaScript (ES Modules) |
| Gráficos                               | Chart.js                             |
| Sanitização de HTML                    | DOMPurify                            |
| Backend                                | C#, ASP.NET Core Web API (.NET 10)   |
| ORM                                    | Entity Framework Core e Npgsql       |
| Banco de dados                         | PostgreSQL                           |
| Documentação da API                    | Swagger / Swashbuckle                |
| Autenticação (reservada para o futuro) | ASP.NET Core Identity                |

## 📂 Estrutura do projeto

```text
backend/
└── CozyLibrary.Api/
    ├── Controllers/       # Endpoints da API
    ├── Data/              # Contexto do banco de dados
    ├── DTOs/              # Objetos de transferência de dados
    ├── Migrations/        # Evolução do esquema do banco
    ├── Models/            # Entidades
    ├── Services/          # Serviços da aplicação
    ├── Properties/        # Perfis de execução
    ├── wwwroot/           # Frontend servido pelo backend
    │   ├── css/           # Estilos organizados por responsabilidade
    │   ├── img/           # Recursos visuais
    │   ├── js/
    │   │   ├── modules/   # Módulos da biblioteca
    │   │   └── main.js    # Inicialização
    │   ├── paginas/
    │   │   ├── autenticacao/
    │   │   └── resenhas/
    │   └── index.html
    ├── Program.cs
    └── CozyLibrary.Api.csproj
```

> Atualmente existem cópias do frontend na raiz do repositório. Para executar e editar a versão integrada, utilize `backend/CozyLibrary.Api/wwwroot`.

## ⚙️ Instalação e execução local

### Pré-requisitos

- SDK do .NET 10
- PostgreSQL em execução
- Git (para clonar o repositório)
- Editor de código, como VS Code

### 1. Obtenha o projeto

Clone o repositório pelo botão **Code** do GitHub ou extraia o ZIP. Abra a pasta principal no terminal.

```bash
cd backend/CozyLibrary.Api
dotnet restore
```

### 2. Configure o banco de dados

Crie um banco PostgreSQL chamado `cozy_library`. Configure a conexão usando User Secrets, substituindo os valores de usuário e senha pelos seus dados locais:

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=cozy_library;Username=SEU_USUARIO;Password=SUA_SENHA"
```

Não publique credenciais no GitHub. User Secrets é destinado ao desenvolvimento local.

### 3. Aplique as migrations

Caso ainda não tenha a ferramenta do Entity Framework instalada:

```bash
dotnet tool install --global dotnet-ef --version 10.0.14
```

```bash
dotnet ef database update
```

### 4. Inicie a aplicação

```bash
dotnet dev-certs https --trust
dotnet build
dotnet run --launch-profile https
```

Acesse **https://localhost:7174/** no navegador. Não é necessário iniciar o Live Server: o próprio ASP.NET Core serve o frontend.

| Recurso             | Endereço                               |
| ------------------- | -------------------------------------- |
| Aplicação           | https://localhost:7174/                |
| Biblioteca          | https://localhost:7174/index.html      |
| Swagger             | https://localhost:7174/swagger         |
| Status da API       | https://localhost:7174/api/status      |
| Conexão com o banco | https://localhost:7174/health/database |

## 🔗 API REST

| Método | Endpoint                 | Descrição            |
| ------ | ------------------------ | -------------------- |
| GET    | `/api/work`              | Listar obras         |
| GET    | `/api/work/{id}`         | Consultar uma obra   |
| POST   | `/api/work`              | Criar uma obra       |
| PUT    | `/api/work/{id}`         | Atualizar uma obra   |
| PUT    | `/api/work/replace`      | Substituir a coleção |
| DELETE | `/api/work/{id}`         | Excluir uma obra     |
| POST   | `/api/work/upload-image` | Enviar uma imagem    |

## 🔐 Autenticação e acesso

Atualmente, a Cozy Library permite o acesso direto à biblioteca, sem a necessidade de login ou cadastro.

Essa decisão foi tomada para simplificar a experiência de uso durante a fase atual de desenvolvimento, priorizando as funcionalidades de gerenciamento de leituras, personalização e diário literário.

A estrutura de autenticação foi preservada no código, possibilitando sua implementação futura conforme a evolução do projeto.

O fluxo atual é **Boas-vindas → Biblioteca → Resenhas**. O acesso anônimo à API está restrito ao desenvolvimento local pelas condições da política `LibraryAccess`. Em produção, a política exige autenticação.

## 🌱 Roadmap

- [ ] Consolidar o frontend em uma única pasta.
- [ ] Validar os fluxos de CRUD, backup e resenhas de ponta a ponta.
- [ ] Avaliar a implementação futura de login, cadastro e perfil.
- [ ] Ampliar os testes automatizados e revisar a segurança.
- [ ] Preparar a aplicação para publicação.

---

<div align="center">
  Feito com carinho, café e muitas histórias. ☕📚♡
</div>
