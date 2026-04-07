using LMS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ModulesController : ControllerBase
{
    private readonly ICourseService _courseService;

    public ModulesController(ICourseService courseService) => _courseService = courseService;

    [HttpGet("{id}/lessons")]
    public async Task<IActionResult> GetLessons(int id) =>
        Ok(await _courseService.GetLessonsByModuleIdAsync(id));
}
