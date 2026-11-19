
using Microsoft.AspNetCore.Identity;

namespace CozyLibrary.Api.Models;

public class AppUser : IdentityUser
{
    public string DisplayName { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
        = DateTime.UtcNow;
}
