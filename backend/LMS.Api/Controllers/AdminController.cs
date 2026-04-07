using LMS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService) => _adminService = adminService;

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers() => Ok(await _adminService.GetAllUsersAsync());

    [HttpGet("users/{id}")]
    public async Task<IActionResult> GetUserDetail(int id)
    {
        var user = await _adminService.GetUserDetailAsync(id);
        return user == null ? NotFound() : Ok(user);
    }

    [HttpGet("test-results")]
    public async Task<IActionResult> GetTestResults([FromQuery] int? courseId = null) =>
        Ok(await _adminService.GetAllTestResultsAsync(courseId));
}
