using System.Security.Claims;

namespace CozyLibrary.Api.Services;

public sealed class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    // CONSTRUTOR
    public CurrentUserService(
        IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    // IDENTIFICAÇÃO DO USUÁRIO
    public string? UserId
    {
        get
        {
            var user = _httpContextAccessor
                .HttpContext?.User;

            // Sem autenticação, utiliza
            // a biblioteca local.

            if (user?.Identity?.IsAuthenticated != true)
            {
                return null;
            }

            // Retorna o ID do usuário autenticado.
            // Mantido para uso futuro do perfil.

            return user.FindFirstValue(
                ClaimTypes.NameIdentifier
            );
        }
    }
}