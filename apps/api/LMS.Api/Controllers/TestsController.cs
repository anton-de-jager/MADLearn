using System.Security.Claims;
using LMS.Application.DTOs;
using LMS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TestsController : ControllerBase
{
    private readonly ITestService _testService;

    public TestsController(ITestService testService) => _testService = testService;

    [HttpGet("lesson/{lessonId}")]
    public async Task<IActionResult> GetByLesson(int lessonId)
    {
        var test = await _testService.GetTestByLessonIdAsync(lessonId);
        return test == null ? NotFound() : Ok(test);
    }

    [HttpPost("submit")]
    public async Task<IActionResult> Submit([FromBody] SubmitTestDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        try
        {
            var result = await _testService.SubmitTestAsync(userId, dto);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("results")]
    public async Task<IActionResult> GetMyResults()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        return Ok(await _testService.GetUserTestResultsAsync(userId));
    }
}
