using LMS.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;

namespace LMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly LmsDbContext _context;

    public HealthController(LmsDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var canConnect = await _context.Database.CanConnectAsync();
        return Ok(new
        {
            status = canConnect ? "Healthy" : "Degraded",
            database = canConnect ? "Connected" : "Unavailable",
            product = "MADLearn",
            timestamp = DateTime.UtcNow
        });
    }
}
