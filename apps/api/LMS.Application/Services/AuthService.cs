using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LMS.Application.DTOs;
using LMS.Application.Interfaces;
using LMS.Domain.Entities;
using LMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace LMS.Application.Services;

public class AuthService : IAuthService
{
    private const string SuperAdminUsername = "superadmin";
    private const string SuperAdminEmail = "admin@madprospects.com";
    private const string SuperAdminPassword = "P@szw0rdMP";
    private const string SuperAdminRole = "Admin";

    private readonly LmsDbContext _context;
    private readonly IConfiguration _config;

    public AuthService(LmsDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        var email = NormalizeEmail(dto.Email);
        if (await _context.Users.AnyAsync(u => u.Email.ToLower() == email))
            throw new InvalidOperationException("Email already registered.");

        var user = new User
        {
            Username = dto.Username.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = "Student"
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return new AuthResponseDto(GenerateToken(user), user.Username, user.Email, user.Role, user.Id);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var email = NormalizeEmail(dto.Email);
        var password = dto.Password ?? string.Empty;

        if (email == SuperAdminEmail && password == SuperAdminPassword)
        {
            var superAdmin = await EnsureSuperAdminAsync();
            return new AuthResponseDto(GenerateToken(superAdmin), superAdmin.Username, superAdmin.Email, superAdmin.Role, superAdmin.Id);
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email)
            ?? throw new InvalidOperationException("Invalid credentials.");

        if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            throw new InvalidOperationException("Invalid credentials.");

        return new AuthResponseDto(GenerateToken(user), user.Username, user.Email, user.Role, user.Id);
    }

    private string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role)
        };
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string NormalizeEmail(string? email) => (email ?? string.Empty).Trim().ToLowerInvariant();

    private async Task<User> EnsureSuperAdminAsync()
    {
        var superAdmin = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == SuperAdminEmail);
        if (superAdmin is null)
        {
            superAdmin = new User
            {
                Username = SuperAdminUsername,
                Email = SuperAdminEmail,
                CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(superAdmin);
        }

        superAdmin.Username = SuperAdminUsername;
        superAdmin.Email = SuperAdminEmail;
        superAdmin.Role = SuperAdminRole;
        superAdmin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(SuperAdminPassword);
        await _context.SaveChangesAsync();
        return superAdmin;
    }
}
