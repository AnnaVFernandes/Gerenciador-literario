using CozyLibrary.Api.DTOs;
using CozyLibrary.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace CozyLibrary.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<AppUser> _users;
    private readonly SignInManager<AppUser> _signIn;

    public AuthController(
        UserManager<AppUser> users,
        SignInManager<AppUser> signIn)
    {
        _users = users;
        _signIn = signIn;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromBody] RegisterDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();

        var existing = await _users.FindByEmailAsync(email);

        if (existing != null)
            return BadRequest(new
            {
                message = "Não foi possível criar a conta com esse e-mail."
            });

        var user = new AppUser
        {
            DisplayName = dto.Name.Trim(),
            UserName = email,
            Email = email
        };

        var result = await _users.CreateAsync(
            user,
            dto.Password
        );

        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                message = "Não foi possível criar a conta.",
                errors = result.Errors.Select(e => e.Description)
            });
        }

        return Ok(new
        {
            message = "Conta criada com sucesso!"
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();

        var user = await _users.FindByEmailAsync(email);

        if (user == null)
            return Unauthorized(new
            {
                message = "E-mail ou senha inválidos."
            });

        var result = await _signIn.PasswordSignInAsync(
            user,
            dto.Password,
            isPersistent: false,
            lockoutOnFailure: true
        );

        if (!result.Succeeded)
            return Unauthorized(new
            {
                message = "Não foi possível entrar. Confira suas credenciais ou tente novamente mais tarde."
            });

        return Ok(new
        {
            message = "Login realizado com sucesso!",
            user = new
            {
                user.Id,
                user.DisplayName,
                user.Email
            }
        });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user = await _users.GetUserAsync(User);

        if (user == null)
            return Unauthorized();

        return Ok(new
        {
            user.Id,
            user.DisplayName,
            user.Email
        });
    }

    [Authorize]
    [HttpGet("csrf")]
    public IActionResult Csrf([FromServices] Microsoft.AspNetCore.Antiforgery.IAntiforgery antiforgery)
    {
        Response.Headers["Cache-Control"] = "no-store";
        return Ok(new { token = antiforgery.GetAndStoreTokens(HttpContext).RequestToken });
    }

    [Authorize]
    [ValidateAntiForgeryToken]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _signIn.SignOutAsync();

        return Ok(new
        {
            message = "Você saiu da sua conta."
        });
    }
}