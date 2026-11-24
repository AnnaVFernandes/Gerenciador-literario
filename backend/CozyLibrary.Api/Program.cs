
using CozyLibrary.Api.Data;
using CozyLibrary.Api.Models;
using CozyLibrary.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// CONTROLLERS
builder.Services.AddControllers();

// SERVIÇOS DO USUÁRIO
builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped<
    ICurrentUserService,
    CurrentUserService
>();

// SWAGGER
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins(
                "http://127.0.0.1:5500",
                "http://localhost:5500",
                "http://127.0.0.1:5501",
                "http://localhost:5501"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// CONEXÃO COM POSTGRESQL
var connectionString = builder.Configuration
    .GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "A conexão com o banco não foi configurada."
    );
}

builder.Services.AddDbContext<CozyLibraryDbContext>(
    options => options.UseNpgsql(connectionString)
);

// ASP.NET CORE IDENTITY
// Mantido para implementação futura
// do sistema de contas e perfil.

builder.Services
    .AddIdentity<AppUser, IdentityRole>(options =>
    {
        options.Password.RequiredLength = 8;

        options.Password.RequireDigit = true;

        options.Password.RequireLowercase = true;

        options.Password.RequireUppercase = false;

        options.Password.RequireNonAlphanumeric = false;

        options.User.RequireUniqueEmail = true;

        options.Lockout.DefaultLockoutTimeSpan =
            TimeSpan.FromMinutes(15);

        options.Lockout.MaxFailedAccessAttempts = 5;
    })
    .AddEntityFrameworkStores<CozyLibraryDbContext>()
    .AddDefaultTokenProviders();

// COOKIES DE AUTENTICAÇÃO
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "CozyLibrary.Auth";

    options.Cookie.HttpOnly = true;

    options.Cookie.SecurePolicy =
        CookieSecurePolicy.Always;

    options.Cookie.SameSite =
        SameSiteMode.Lax;

    options.ExpireTimeSpan =
        TimeSpan.FromHours(8);

    options.SlidingExpiration = true;

    // Retorna 401 quando não há autenticação.

    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = 401;

        return Task.CompletedTask;
    };

    // Retorna 403 quando não há permissão.

    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = 403;

        return Task.CompletedTask;
    };
});

// CONFIGURAÇÃO ANTIFORGERY
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
});

// ACESSO LOCAL À BIBLIOTECA SEM LOGIN
// Permite utilizar a biblioteca sem conta
// somente no ambiente de desenvolvimento
// e pelo próprio computador.
//
// Em produção, a autenticação continua
// sendo obrigatória.

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("LibraryAccess", policy =>
    {
        policy.RequireAssertion(context =>
        {
            // Permite usuários autenticados.

            if (context.User.Identity?.IsAuthenticated == true)
                return true;

            // Bloqueia acesso anônimo em produção.

            if (!builder.Environment.IsDevelopment())
                return false;

            // Obtém o contexto da requisição.

            if (context.Resource is not HttpContext http)
                return false;

            // Verifica o endereço IP.

            var ip = http.Connection.RemoteIpAddress;

            if (ip is null)
                return false;

            if (ip.IsIPv4MappedToIPv6)
                ip = ip.MapToIPv4();

            // Permite somente conexões locais.

            if (!System.Net.IPAddress.IsLoopback(ip))
                return false;

            // Verifica o endereço utilizado.

            var host = http.Request.Host.Host;

            if (host != "localhost" &&
                host != "127.0.0.1" &&
                host != "[::1]" &&
                host != "::1")
            {
                return false;
            }

            // Bloqueia requisições de outros sites.

            var fetchSite =
                http.Request.Headers["Sec-Fetch-Site"].ToString();

            if (fetchSite == "cross-site" ||
                fetchSite == "same-site")
            {
                return false;
            }

            // Verifica a origem da requisição.

            var origin =
                http.Request.Headers["Origin"].ToString();

            var expectedOrigin =
                $"{http.Request.Scheme}://{http.Request.Host}";

            return string.IsNullOrEmpty(origin) ||
                string.Equals(
                    origin,
                    expectedOrigin,
                    StringComparison.OrdinalIgnoreCase
                );
        });
    });
});

// CONSTRUIR A APLICAÇÃO

var app = builder.Build();

// SWAGGER EM DESENVOLVIMENTO
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// MIDDLEWARES
// Redireciona HTTP para HTTPS.

app.UseHttpsRedirection();

// Permite servir HTML, CSS, JavaScript,
// imagens e outros arquivos estáticos.
//
// Não utilizamos UseDefaultFiles()
// porque queremos iniciar o projeto
// pela tela de boas-vindas.

app.UseStaticFiles();

// Configura o roteamento.

app.UseRouting();

// Aplica a política CORS.

app.UseCors("AllowFrontend");

// Mantém a autenticação disponível
// para implementação futura do perfil.

app.UseAuthentication();

app.UseAuthorization();

// PÁGINA INICIAL
// Quando acessar:
// https://localhost:7174/
//
// O usuário será direcionado para
// a tela de boas-vindas.

app.MapGet("/", () =>
{
    return Results.Redirect(
        "/paginas/autenticacao/boas-vindas.html"
    );
});

// STATUS DA API
// Endereço:
// https://localhost:7174/api/status

app.MapGet("/api/status", () =>
{
    return Results.Ok(new
    {
        application = "Cozy Library API",
        status = "online"
    });
});

// TESTAR CONEXÃO COM POSTGRESQL
// Endereço:
// https://localhost:7174/health/database

app.MapGet(
    "/health/database",
    async (CozyLibraryDbContext db) =>
    {
        try
        {
            var connected =
                await db.Database.CanConnectAsync();

            if (connected)
            {
                return Results.Ok(new
                {
                    status = "ok",
                    message = "Banco conectado."
                });
            }

            return Results.Problem(
                "Não foi possível conectar ao banco."
            );
        }
        catch (Exception ex)
        {
            app.Logger.LogError(
                ex,
                "Erro ao verificar a conexão com o PostgreSQL."
            );

            return Results.Problem(
                "Não foi possível verificar a conexão com o banco."
            );
        }
    }
);

// ROTAS DOS CONTROLLERS
app.MapControllers();

// INICIAR A APLICAÇÃO
app.Run();
