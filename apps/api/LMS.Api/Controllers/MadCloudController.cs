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
        if (string.IsNullOrWhiteSpace(dto.Input))
        {
            return BadRequest(new { message = "MADCloud task input is required." });
        }

        var task = new MadCloudTask
        {
            UserId = userId,
            TaskType = string.IsNullOrWhiteSpace(dto.TaskType) ? "Validation" : dto.TaskType.Trim(),
            Input = dto.Input.Trim(),
            Status = "QueuedInMADCloud",
            StartedAt = DateTime.UtcNow
        };

        _context.MadCloudTasks.Add(task);
        await _context.SaveChangesAsync();

        task.Output = BuildMadCloudResult(task);
        task.Status = "Completed";
        task.CompletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("MAD Cloud task {TaskId} completed for user {UserId}", task.Id, userId);
        return Ok(ToDto(task));
    }

    [HttpPost("assist")]
    public async Task<ActionResult<MadCloudTaskDto>> Assist([FromBody] MadCloudAssistRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Prompt))
        {
            return BadRequest(new { message = "A MADCloud prompt is required." });
        }

        var intent = AllowedIntent(dto.Intent);
        var input = $"Intent: {intent}\nCourseId: {dto.CourseId?.ToString() ?? "n/a"}\nLessonId: {dto.LessonId?.ToString() ?? "n/a"}\n\n{dto.Prompt.Trim()}";
        return await SubmitTask(new MadCloudTaskRequestDto(input, $"MADCloud:{intent}"));
    }

    [HttpGet("tasks")]
    public async Task<ActionResult<IReadOnlyList<MadCloudTaskDto>>> GetMyTasks()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var tasks = await _context.MadCloudTasks
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .Take(40)
            .ToListAsync();
        return Ok(tasks.Select(ToDto).ToList());
    }

    [HttpGet("tasks/{id:int}")]
    public async Task<ActionResult<MadCloudTaskDto>> GetTask(int id)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var task = await _context.MadCloudTasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        return task == null ? NotFound() : Ok(ToDto(task));
    }

    [HttpPost("/api/madcloud/ai-results")]
    [AllowAnonymous]
    public async Task<IActionResult> ReceiveMadCloudResult([FromBody] MadCloudResultCallbackDto dto)
    {
        var task = await _context.MadCloudTasks.FirstOrDefaultAsync(t => t.Id == dto.TaskId);
        if (task == null)
        {
            return NotFound();
        }

        task.Status = string.IsNullOrWhiteSpace(dto.Status) ? "Completed" : dto.Status.Trim();
        task.Output = dto.Output;
        task.CompletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { message = "MADCloud result accepted." });
    }

    private static MadCloudTaskDto ToDto(MadCloudTask task) =>
        new(task.Id, task.TaskType, task.Input, task.Status, task.Output, task.CreatedAt, task.StartedAt, task.CompletedAt);

    private static string AllowedIntent(string? intent)
    {
        var value = string.IsNullOrWhiteSpace(intent) ? "Tutor" : intent.Trim();
        var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Tutor",
            "ExplainCode",
            "PracticeQuestions",
            "Remediation",
            "RevisionPlan",
            "InstructorCopilot",
            "AdminCopilot",
            "EvidencePack"
        };
        return allowed.Contains(value) ? value : "Tutor";
    }

    private static string BuildMadCloudResult(MadCloudTask task) =>
        task.TaskType switch
        {
            var type when type.Contains("PracticeQuestions", StringComparison.OrdinalIgnoreCase) =>
                "MADCloud generated a practice set outline: 5 recall checks, 3 applied scenario questions, and 1 evidence-based reflection prompt. Review and attach the approved questions to the lesson.",
            var type when type.Contains("Remediation", StringComparison.OrdinalIgnoreCase) =>
                "MADCloud remediation plan: revisit the failed concepts, complete a short practice activity, retake the assessment, and flag the learner for manager follow-up if the next score is below 70%.",
            var type when type.Contains("RevisionPlan", StringComparison.OrdinalIgnoreCase) =>
                "MADCloud revision plan: schedule three focused review blocks, complete the weakest lesson first, and export the evidence pack after the next passing assessment.",
            var type when type.Contains("ExplainCode", StringComparison.OrdinalIgnoreCase) =>
                "MADCloud explanation prepared. Break the code into inputs, transformation steps, side effects, and expected output before asking the learner to modify one behavior.",
            var type when type.Contains("AdminCopilot", StringComparison.OrdinalIgnoreCase) =>
                "MADCloud admin insight: prioritize at-risk learners, export cohort evidence, and assign targeted remediation before the next reporting cycle.",
            _ => $"MADCloud completed '{task.TaskType}' for MADLearn. Input length: {task.Input.Length}. No third-party AI provider was used."
        };
}

public record MadCloudResultCallbackDto(int TaskId, string Status, string? Output);
