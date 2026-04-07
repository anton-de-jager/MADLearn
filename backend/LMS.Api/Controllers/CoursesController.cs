using LMS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CoursesController : ControllerBase
{
    private readonly ICourseService _courseService;

    public CoursesController(ICourseService courseService) => _courseService = courseService;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _courseService.GetAllCoursesAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var course = await _courseService.GetCourseByIdAsync(id);
        return course == null ? NotFound() : Ok(course);
    }

    [HttpGet("{id}/modules")]
    public async Task<IActionResult> GetModules(int id) =>
        Ok(await _courseService.GetModulesByCourseIdAsync(id));
}
