using CozyLibrary.Api.Data;
using CozyLibrary.Api.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

//Controllers
builder.Services.AddControllers();

//Serviços de usuário (login)
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

//Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

//CORS
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
            .AllowAnyMethod();
    });
});

// Configuração da conexão com o banco
var connectionString = builder.Configuration
    .GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "A conexão com o banco não foi configurada."
    );
}

// Registro do PostgreSQL
builder.Services.AddDbContext<CozyLibraryDbContext>(options =>
    options.UseNpgsql(connectionString)
);

var app = builder.Build();

//Habilitar o Swagger apenas em ambiente de desenvolvimento
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");


// Status da API
app.MapGet("/", () => Results.Ok(new
{
    application = "Cozy Library API",
    status = "online"
}));

// Teste de conexão 
app.MapGet("/health/database", async (CozyLibraryDbContext db) =>
{
    try
    {
        return await db.Database.CanConnectAsync()
            ? Results.Ok(new { status = "ok", message = "Banco conectado." })
            : Results.Problem("Não foi possível conectar ao Banco.");
    }
    catch (Exception ex)
    {
        return Results.Problem($"Erro ao conectar ao Banco: {ex.Message}");
    }
});

app.MapControllers();

app.Run();