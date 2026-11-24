
using CozyLibrary.Api.Data;
using CozyLibrary.Api.Models;
using CozyLibrary.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CozyLibrary.Api.Controllers;

[ApiController]
[Authorize(Policy = "LibraryAccess")]
[Route("api/work")]
public class WorkController : ControllerBase
{
    private readonly CozyLibraryDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IWebHostEnvironment _environment;

    // ========================================
    // OBRAS DO USUÁRIO
    // ========================================

    // No modo local sem login, serão utilizadas
    // apenas as obras sem proprietário.
    //
    // As obras vinculadas a contas existentes
    // continuam separadas.

    private IQueryable<Work> CurrentUserWorks =>
        _context.Works.Where(
            work => work.OwnerUserId == _currentUser.UserId
        );

    // ========================================
    // CONSTRUTOR
    // ========================================

    public WorkController(
        CozyLibraryDbContext context,
        ICurrentUserService currentUser,
        IWebHostEnvironment environment)
    {
        _context = context;
        _currentUser = currentUser;
        _environment = environment;
    }

    // ========================================
    // LISTAR OBRAS
    // ========================================

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Work>>> GetWorks()
    {
        var works = await CurrentUserWorks
            .AsNoTracking()
            .OrderByDescending(work => work.CreatedAt)
            .ToListAsync();

        return Ok(works);
    }

    // ========================================
    // UPLOAD DE IMAGENS
    // ========================================

    [HttpPost("upload-image")]
    [RequestSizeLimit(3 * 1024 * 1024)]
    public async Task<IActionResult> UploadImage(
        [FromForm] IFormFile file)
    {
        const long maxSize = 2 * 1024 * 1024;

        if (file == null || file.Length == 0)
            return BadRequest("Selecione uma imagem.");

        if (file.Length > maxSize)
            return BadRequest("O limite é de 2 MB.");

        var signatures = new Dictionary<string, byte[]>
        {
            [".jpg"] = new byte[]
            {
                0xFF, 0xD8, 0xFF
            },

            [".png"] = new byte[]
            {
                0x89, 0x50, 0x4E, 0x47,
                0x0D, 0x0A, 0x1A, 0x0A
            }
        };

        var extension = Path.GetExtension(
            file.FileName
        ).ToLowerInvariant();

        if (extension == ".jpeg")
            extension = ".jpg";

        if (!signatures.TryGetValue(
            extension, out var signature))
        {
            return BadRequest("Use JPG ou PNG.");
        }

        var expectedType = extension == ".png"
            ? "image/png"
            : "image/jpeg";

        if (file.ContentType != expectedType)
            return BadRequest("Tipo de arquivo inválido.");

        await using var input = file.OpenReadStream();

        var header = new byte[signature.Length];

        var read = await input.ReadAsync(header);

        if (read != signature.Length ||
            !header.SequenceEqual(signature))
        {
            return BadRequest("Conteúdo inválido.");
        }

        input.Position = 0;

        var folder = Path.Combine(
            _environment.ContentRootPath,
            "wwwroot",
            "images"
        );

        Directory.CreateDirectory(folder);

        var fileName = $"{Guid.NewGuid():N}{extension}";

        var path = Path.Combine(folder, fileName);

        await using (
            var output = System.IO.File.Create(path))
        {
            await input.CopyToAsync(output);
        }

        return Ok(new
        {
            url = $"/images/{fileName}"
        });
    }

    // ========================================
    // BUSCAR OBRA POR ID
    // ========================================

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Work>> GetWork(Guid id)
    {
        var work = await CurrentUserWorks
            .AsNoTracking()
            .FirstOrDefaultAsync(work => work.Id == id);

        return work is null
            ? NotFound()
            : Ok(work);
    }

    // ========================================
    // CADASTRAR NOVA OBRA
    // ========================================

    [HttpPost]
    public async Task<ActionResult<Work>> CreateWork(
        [FromBody] Work work)
    {
        if (string.IsNullOrWhiteSpace(work.Title))
            return BadRequest("O título é obrigatório.");

        work.Id = Guid.NewGuid();

        work.OwnerUserId = _currentUser.UserId;

        work.CreatedAt = DateTime.UtcNow;
        work.UpdatedAt = DateTime.UtcNow;

        work.Title = work.Title.Trim();

        _context.Works.Add(work);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetWork),
            new { id = work.Id },
            work
        );
    }

    // ========================================
    // ATUALIZAR OBRA
    // ========================================

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<Work>> UpdateWork(
        Guid id,
        [FromBody] Work updatedWork)
    {
        if (string.IsNullOrWhiteSpace(updatedWork.Title))
            return BadRequest("O título é obrigatório.");

        var work = await CurrentUserWorks
            .FirstOrDefaultAsync(item => item.Id == id);

        if (work is null)
            return NotFound();

        work.Title = updatedWork.Title.Trim();
        work.Type = updatedWork.Type;
        work.CoverUrl = updatedWork.CoverUrl;
        work.Status = updatedWork.Status;
        work.Author = updatedWork.Author;
        work.Genre = updatedWork.Genre;
        work.Progress = updatedWork.Progress;
        work.Total = updatedWork.Total;
        work.Rating = updatedWork.Rating;
        work.Notes = updatedWork.Notes;
        work.Favorite = updatedWork.Favorite;

        // Preserva a resenha existente quando
        // o frontend não envia uma nova resenha.

        if (updatedWork.ReviewHtml != null)
        {
            work.ReviewHtml = updatedWork.ReviewHtml;
        }

        work.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(work);
    }

    // ========================================
    // IMPORTAR BACKUP
    // ========================================

    [HttpPut("replace")]
    public async Task<IActionResult> ReplaceWorks(
        [FromBody] List<Work> incomingWorks)
    {
        if (incomingWorks.Any(
            work => string.IsNullOrWhiteSpace(work.Title)))
        {
            return BadRequest(
                "Todas as obras precisam ter um título."
            );
        }

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        var currentWorks = await CurrentUserWorks
            .ToListAsync();

        // Remove somente as obras da biblioteca atual.

        _context.Works.RemoveRange(currentWorks);

        var now = DateTime.UtcNow;

        foreach (var work in incomingWorks)
        {
            work.Id = Guid.NewGuid();

            work.OwnerUserId = _currentUser.UserId;

            work.Title = work.Title.Trim();

            work.CreatedAt = now;
            work.UpdatedAt = now;
        }

        _context.Works.AddRange(incomingWorks);

        await _context.SaveChangesAsync();

        await transaction.CommitAsync();

        return Ok(new
        {
            imported = incomingWorks.Count
        });
    }

    // ========================================
    // EXCLUIR OBRA
    // ========================================

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteWork(Guid id)
    {
        var work = await CurrentUserWorks
            .FirstOrDefaultAsync(item => item.Id == id);

        if (work is null)
            return NotFound();

        _context.Works.Remove(work);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}
