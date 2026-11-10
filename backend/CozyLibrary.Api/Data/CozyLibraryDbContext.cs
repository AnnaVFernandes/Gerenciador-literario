using Microsoft.EntityFrameworkCore;
using CozyLibrary.Api.Models;

namespace CozyLibrary.Api.Data;

public class CozyLibraryDbContext : DbContext
{
    public CozyLibraryDbContext(
        DbContextOptions<CozyLibraryDbContext> options
    ) : base(options)
    {
    }

    public DbSet<Work> Works { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Work>()
            .HasIndex(work => work.OwnerUserId);
    }

}

