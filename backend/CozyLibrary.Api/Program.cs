
using CozyLibrary.Api.Data;
using CozyLibrary.Api.Models;
using CozyLibrary.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ========================================
// CONTROLLERS
// ========================================

builder.Services.AddControllers();

// ========================================
// SERVIÇOS DE USUÁRIO
// ========================================

builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped<
    ICurrentUserService,
    CurrentUserService
>();

// ========================================
// SWAGGER
// ========================================

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ========================================
// CORS
// ========================================

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

// ========================================
// CONEXÃO COM POSTGRESQL
// ========================================

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

// ========================================
// ASP.NET CORE IDENTITY
// ========================================

builder.Services
    .AddIdentity<AppUser, IdentityRole>(options =>
    {
        // Regras para senhas
        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;

        // E-mail único
        options.User.RequireUniqueEmail = true;

        // Proteção contra tentativas repetidas
        options.Lockout.DefaultLockoutTimeSpan =
            TimeSpan.FromMinutes(15);

        options.Lockout.MaxFailedAccessAttempts = 5;
    })
    .AddEntityFrameworkStores<CozyLibraryDbContext>()
    .AddDefaultTokenProviders();

// ========================================
// CONFIGURAÇÃO DOS COOKIES
// ========================================

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "CozyLibrary.Auth";

    options.Cookie.HttpOnly = true;

    options.Cookie.SecurePolicy =
        CookieSecurePolicy.Always;

    options.Cookie.SameSite =
        SameSiteMode.Lax;

    options.ExpireTimeSpan = TimeSpan.FromHours(8);

    options.SlidingExpiration = true;

    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = 401;
        return Task.CompletedTask;
    };

    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = 403;
        return Task.CompletedTask;
    };
});

// ========================================
// PROTEÇÃO CONTRA CSRF
// ========================================

builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
});

// ========================================
// CRIAÇÃO DA APLICAÇÃO
// ========================================

var app = builder.Build();

// ========================================
// SWAGGER EM DESENVOLVIMENTO
// ========================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ========================================
// MIDDLEWARES
// ========================================

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseRouting();

app.UseCors("AllowFrontend");

// Identifica o usuário autenticado
app.UseAuthentication();

// Verifica permissões
app.UseAuthorization();

// ========================================
// STATUS DA API
// ========================================

app.MapGet("/", () => Results.Ok(new
{
    application = "Cozy Library API",
    status = "online"
}));

// ========================================
// TESTE DO BANCO
// ========================================

app.MapGet(
    "/health/database",
    async (CozyLibraryDbContext db) =>
    {
        try
        {
            return await db.Database.CanConnectAsync()
                ? Results.Ok(new
                {
                    status = "ok",
                    message = "Banco conectado."
                })
                : Results.Problem(
                    "Não foi possível conectar ao banco."
                );
        }
        catch (Exception ex)
        {
            return Results.Problem(
                $"Erro ao conectar ao banco: {ex.Message}"
            );
        }
    }
);

// ========================================
// CONTROLLERS
// ========================================

app.MapControllers();

app.Run();
