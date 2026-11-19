
using CozyLibrary.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CozyLibrary.Api.Data;

public class CozyLibraryDbContext : IdentityDbContext<AppUser>
{
    // Construtor do banco de dados
    public CozyLibraryDbContext(
        DbContextOptions<CozyLibraryDbContext> options
    ) : base(options)
    {
    }

    // Tabela de obras da biblioteca
    public DbSet<Work> Works => Set<Work>();

    // Configurações das tabelas
    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        // Configura as tabelas do ASP.NET Identity
        base.OnModelCreating(modelBuilder);

        // Mantém o índice existente para
        // identificar as obras de cada usuário
        modelBuilder.Entity<Work>()
            .HasIndex(work => work.OwnerUserId);
    }
}
