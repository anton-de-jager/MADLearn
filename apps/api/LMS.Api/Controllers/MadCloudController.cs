using System.Security.Claims;
using LMS.Application.DTOs;
using LMS.Domain.Entities;
using LMS.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LMS.Api.Controllers;

[ApiController]
[Route("api/mad-cloud")]
[Authorize]
public class MadCloudController : ControllerBase
{
    private readonly LmsDbContext _context;
    private readonly ILogger<MadCloudController> _logger;

    public MadCloudController(LmsDbContext context, ILogger<MadCloudController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpPost("tasks")]
    public async Task<ActionResult<MadCloudTaskDto>> SubmitTask([FromBody] MadCloudTaskRequestDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var task = new MadCloudTask
        {
            UserId = userId,
            TaskType = string.IsNullOrWhiteSpace(dto.TaskType) ? "Validation" : dto.TaskType.Trim(),
            Input = dto.Input.Trim(),
            Status = "Running",
            StartedAt = DateTime.UtcNow
        };

        _context.MadCloudTasks.Add(task);
        await _context.SaveChangesAsync();

        task.Output = $"MAD Cloud local worker completed '{task.TaskType}' for MADLearn. Input length: {task.Input.Length}.";
        task.Status = "Completed";
        task.CompletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("MAD Cloud task {TaskId} completed for user {UserId}", task.Id, userId);
        return Ok(ToDto(task));
    }

    [HttpGet("tasks/{id:int}")]
    public async Task<ActionResult<MadCloudTaskDto>> GetTask(int id)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var task = await _context.MadCloudTasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        return task == null ? NotFound() : Ok(ToDto(task));
    }

    private static MadCloudTaskDto ToDto(MadCloudTask task) =>
        new(task.Id, task.TaskType, task.Input, task.Status, task.Output, task.CreatedAt, task.StartedAt, task.CompletedAt);
}
