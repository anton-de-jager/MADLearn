using System.Security.Claims;
using LMS.Application.DTOs;
using LMS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProgressController : ControllerBase
{
    private readonly IProgressService _progressService;

    public ProgressController(IProgressService progressService) => _progressService = progressService;

    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<IActionResult> GetMyProgress() =>
        Ok(await _progressService.GetUserProgressAsync(GetUserId()));

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary() =>
        Ok(await _progressService.GetProgressSummaryAsync(GetUserId()));

    [HttpPost("complete")]
    public async Task<IActionResult> CompleteLesson([FromBody] CompleteLessonDto dto)
    {
        await _progressService.CompleteLessonAsync(GetUserId(), dto);
        return Ok(new { message = "Lesson marked as complete." });
    }

    [HttpPost("time")]
    public async Task<IActionResult> UpdateTime([FromBody] UpdateProgressDto dto)
    {
        await _progressService.UpdateTimeSpentAsync(GetUserId(), dto);
        return Ok(new { message = "Time updated." });
    }
}
