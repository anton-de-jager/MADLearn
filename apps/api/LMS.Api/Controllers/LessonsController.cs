using LMS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LessonsController : ControllerBase
{
    private readonly ICourseService _courseService;

    public LessonsController(ICourseService courseService) => _courseService = courseService;

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var lesson = await _courseService.GetLessonByIdAsync(id);
        return lesson == null ? NotFound() : Ok(lesson);
    }
}
