using CozyLibrary.Api.Data;
using CozyLibrary.Api.Models;
using CozyLibrary.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CozyLibrary.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkController : ControllerBase
{
    private readonly CozyLibraryDbContext _context;
    private readonly ICurrentUserService _currentUser;

    private IQueryable<Work> CurrentUserWorks =>
        _context.Works.Where(work => work.OwnerUserId == _currentUser.UserId);

    public WorkController(
        CozyLibraryDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Work>>> GetWorks()
    {
        var works = await CurrentUserWorks
            .AsNoTracking()
            .OrderByDescending(work => work.CreatedAt)
            .ToListAsync();

        return Ok(works);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Work>> GetWork(Guid id)
    {
        var work = await CurrentUserWorks
            .AsNoTracking()
            .FirstOrDefaultAsync(work => work.Id == id);

        return work is null ? NotFound() : Ok(work);
    }

    [HttpPost]
    public async Task<ActionResult<Work>> CreateWork([FromBody] Work work)
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

        return CreatedAtAction(nameof(GetWork), new { id = work.Id }, work);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<Work>> UpdateWork(Guid id, [FromBody] Work updatedWork)
    {
        if (string.IsNullOrWhiteSpace(updatedWork.Title))
            return BadRequest("O título é obrigatório.");

        var work = await CurrentUserWorks
            .FirstOrDefaultAsync(item => item.Id == id);

        if (work is null) return NotFound();

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
        work.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(work);
    }

    [HttpPut("replace")]
    public async Task<IActionResult> ReplaceWorks([FromBody] List<Work> incomingWorks)
    {
        if (incomingWorks.Any(work => string.IsNullOrWhiteSpace(work.Title)))
            return BadRequest("Todas as obras precisam ter um título.");

        await using var transaction = await _context.Database.BeginTransactionAsync();
        var currentWorks = await CurrentUserWorks.ToListAsync();
        _context.Works.RemoveRange(currentWorks);

        var now = DateTime.UtcNow;
        foreach (var work in incomingWorks)
        {
            work.Id = Guid.NewGuid();
            work.OwnerUserId = _currentUser.UserId;
            work.CreatedAt = now;
            work.UpdatedAt = now;
        }

        _context.Works.AddRange(incomingWorks);
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
        return Ok(new { imported = incomingWorks.Count });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteWork(Guid id)
    {
        var work = await CurrentUserWorks
            .FirstOrDefaultAsync(item => item.Id == id);

        if (work is null) return NotFound();

        _context.Works.Remove(work);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}