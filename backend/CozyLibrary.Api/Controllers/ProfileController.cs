using System.ComponentModel.DataAnnotations;
using CozyLibrary.Api.Models;
using CozyLibrary.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CozyLibrary.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/profile")]
public class ProfileController(UserManager<AppUser> users, SignInManager<AppUser> signIn, CozyLibraryDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var user = await users.GetUserAsync(User);
        if (user == null) return Unauthorized();
        var works = db.Works.Where(w => w.OwnerUserId == user.Id);
        return Ok(new
        {
            user.DisplayName,
            user.Email,
            user.CreatedAt,
            total = await works.CountAsync(),
            favorites = await works.CountAsync(w => w.Favorite),
            completed = await works.CountAsync(w => w.Status == "Concluído")
        });
    }

    [HttpPut]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Update(UpdateProfileDto dto)
    {
        var user = await users.GetUserAsync(User);
        if (user == null) return Unauthorized();
        var name = dto.DisplayName.Trim();
        if (name.Length < 2) return BadRequest(new { message = "Informe um nome válido." });
        user.DisplayName = name;
        var result = await users.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        return Ok(new { message = "Perfil atualizado!" });
    }

    [HttpPost("password")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Password(ChangeProfilePasswordDto dto)
    {
        var user = await users.GetUserAsync(User);
        if (user == null) return Unauthorized();
        var result = await users.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
        if (!result.Succeeded) return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        await signIn.RefreshSignInAsync(user);
        return Ok(new { message = "Senha alterada!" });
    }
}
public class UpdateProfileDto
{
    [Required, StringLength(80, MinimumLength = 2)]
    public string DisplayName { get; set; } = "";
}
public class ChangeProfilePasswordDto
{
    [Required] public string CurrentPassword { get; set; } = "";
    [Required, MinLength(8)] public string NewPassword { get; set; } = "";
    [Required, Compare(nameof(NewPassword))] public string ConfirmPassword { get; set; } = "";
}