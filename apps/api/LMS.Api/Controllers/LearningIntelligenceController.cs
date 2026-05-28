using System.Security.Claims;
using LMS.Domain.Entities;
using LMS.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LMS.Api.Controllers;

[ApiController]
[Route("api/learning-intelligence")]
[Authorize]
public class LearningIntelligenceController : ControllerBase
{
    private readonly LmsDbContext _context;

    public LearningIntelligenceController(LmsDbContext context)
    {
        _context = context;
    }

    [HttpGet("path")]
    public async Task<ActionResult<LearningPathDto>> GetPath()
    {
        var userId = GetUserId();
        var courses = await _context.Courses
            .Include(c => c.Modules.OrderBy(m => m.OrderIndex))
            .ThenInclude(m => m.Lessons.OrderBy(l => l.OrderIndex))
            .ThenInclude(l => l.Test)
            .OrderBy(c => c.Title)
            .ToListAsync();
        var progress = await _context.UserProgresses.Where(p => p.UserId == userId).ToListAsync();
        var results = await _context.TestResults.Where(r => r.UserId == userId).ToListAsync();

        var items = courses.Select(course =>
        {
            var lessons = course.Modules.SelectMany(module => module.Lessons).OrderBy(lesson => lesson.Module.DayNumber).ThenBy(lesson => lesson.OrderIndex).ToList();
            var completed = lessons.Count(lesson => progress.Any(p => p.LessonId == lesson.Id && p.IsCompleted));
            var failedTests = lessons
                .Where(lesson => lesson.Test != null && results.Any(r => r.TestId == lesson.Test.Id && !r.Passed))
                .Select(lesson => lesson.Title)
                .ToList();
            var nextLesson = lessons.FirstOrDefault(lesson => progress.All(p => p.LessonId != lesson.Id || !p.IsCompleted));
            var completion = lessons.Count == 0 ? 0 : (int)Math.Round(completed * 100m / lessons.Count);
            var action = failedTests.Count > 0
                ? $"Review {failedTests[0]} and request a MADCloud remediation plan."
                : nextLesson == null
                    ? "Prepare the evidence pack and issue a certificate."
                    : $"Continue with {nextLesson.Title}.";

            return new LearningPathItemDto(course.Id, course.Title, completion, completed, lessons.Count, nextLesson?.Id, nextLesson?.Title, failedTests, action);
        }).ToList();

        var weakAreas = items.SelectMany(item => item.WeakAreas.Select(area => $"{item.CourseTitle}: {area}")).Take(6).ToList();
        var recommendedMadCloudTask = weakAreas.Count == 0
            ? "Generate practice questions for the next lesson."
            : "Build a focused remediation plan from failed assessment evidence.";

        return Ok(new LearningPathDto(items, weakAreas, recommendedMadCloudTask));
    }

    [HttpGet("evidence-pack")]
    public async Task<ActionResult<EvidencePackDto>> GetEvidencePack()
    {
        var userId = GetUserId();
        var user = await _context.Users.FindAsync(userId);
        var progresses = await _context.UserProgresses
            .Include(p => p.Lesson)
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CompletedAt)
            .ToListAsync();
        var tests = await _context.TestResults
            .Include(r => r.Test)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.TakenAt)
            .ToListAsync();
        var tasks = await _context.MadCloudTasks
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .Take(8)
            .ToListAsync();

        var completedLessons = progresses.Where(p => p.IsCompleted).Select(p => new EvidenceLineDto(p.LessonTitle(), p.CompletedAt, "LessonCompleted")).ToList();
        var assessmentLines = tests.Select(t => new EvidenceLineDto($"{t.Test.Title}: {t.Score}%", t.TakenAt, t.Passed ? "AssessmentPassed" : "AssessmentNeedsReview")).ToList();
        var madCloudLines = tasks.Select(t => new EvidenceLineDto($"{t.TaskType}: {t.Status}", t.CompletedAt ?? t.StartedAt ?? t.CreatedAt, "MadCloudTaskCompleted")).ToList();

        var allEvidence = completedLessons.Concat(assessmentLines).Concat(madCloudLines).OrderByDescending(line => line.When).ToList();
        var totalTests = tests.Count;
        var averageScore = totalTests == 0 ? 0 : (int)Math.Round(tests.Average(t => t.Score));
        var certificateReady = progresses.Any(p => p.IsCompleted) && totalTests > 0 && tests.All(t => t.Passed);

        return Ok(new EvidencePackDto(
            user?.Username ?? "Learner",
            user?.Email ?? string.Empty,
            completedLessons.Count,
            totalTests,
            averageScore,
            certificateReady,
            certificateReady ? "Certificate can be issued from verified lesson and assessment evidence." : "Complete all assigned assessments before certificate issue.",
            allEvidence));
    }

    [HttpGet("events")]
    public async Task<ActionResult<IReadOnlyList<LearningEventDto>>> GetEvents()
    {
        var userId = GetUserId();
        var progressRows = await _context.UserProgresses
            .Include(p => p.Lesson)
            .Where(p => p.UserId == userId && p.IsCompleted)
            .ToListAsync();
        var testRows = await _context.TestResults
            .Include(r => r.Test)
            .Where(r => r.UserId == userId)
            .ToListAsync();
        var taskRows = await _context.MadCloudTasks
            .Where(t => t.UserId == userId)
            .ToListAsync();

        var lessonEvents = progressRows
            .Select(p => new LearningEventDto("LessonCompleted", p.CompletedAt ?? DateTime.UtcNow, p.Lesson.Title, new Dictionary<string, string> { ["lessonId"] = p.LessonId.ToString() }));
        var testEvents = testRows
            .Select(r => new LearningEventDto("TestSubmitted", r.TakenAt, r.Test.Title, new Dictionary<string, string> { ["score"] = r.Score.ToString(), ["passed"] = r.Passed.ToString() }));
        var taskEvents = taskRows
            .Select(t => new LearningEventDto(t.Status == "Completed" ? "MadCloudTaskCompleted" : "MadCloudTaskQueued", t.CompletedAt ?? t.CreatedAt, t.TaskType, new Dictionary<string, string> { ["taskId"] = t.Id.ToString() }));

        return Ok(lessonEvents.Concat(testEvents).Concat(taskEvents).OrderByDescending(e => e.OccurredAt).Take(30).ToList());
    }

    [HttpGet("admin-insights")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<AdminLearningInsightsDto>> GetAdminInsights()
    {
        var users = await _context.Users.ToListAsync();
        var progresses = await _context.UserProgresses.Include(p => p.Lesson).ToListAsync();
        var tests = await _context.TestResults.Include(r => r.Test).ToListAsync();
        var courses = await _context.Courses.Include(c => c.Modules).ThenInclude(m => m.Lessons).ThenInclude(l => l.Test).ToListAsync();

        var learners = users.Where(u => !u.Role.Equals("Admin", StringComparison.OrdinalIgnoreCase)).ToList();
        var atRisk = learners.Select(user =>
        {
            var userTests = tests.Where(t => t.UserId == user.Id).ToList();
            var avg = userTests.Count == 0 ? 0 : (int)Math.Round(userTests.Average(t => t.Score));
            var completed = progresses.Count(p => p.UserId == user.Id && p.IsCompleted);
            var failed = userTests.Count(t => !t.Passed);
            return new AtRiskLearnerDto(user.Id, user.Username, user.Email, completed, avg, failed, failed > 0 || avg < 70 ? "Assign remediation and request a MADCloud revision plan." : "Keep learner on the current path.");
        }).Where(l => l.FailedTests > 0 || l.AverageScore < 70).OrderByDescending(l => l.FailedTests).ThenBy(l => l.AverageScore).Take(10).ToList();

        var courseAnalytics = courses.Select(course =>
        {
            var lessonIds = course.Modules.SelectMany(m => m.Lessons).Select(l => l.Id).ToHashSet();
            var completions = progresses.Count(p => lessonIds.Contains(p.LessonId) && p.IsCompleted);
            var possible = Math.Max(1, lessonIds.Count * Math.Max(1, learners.Count));
            var completionRate = (int)Math.Round(completions * 100m / possible);
            var courseTests = tests.Where(t => course.Modules.SelectMany(m => m.Lessons).Any(l => l.Test?.Id == t.TestId)).ToList();
            var avgScore = courseTests.Count == 0 ? 0 : (int)Math.Round(courseTests.Average(t => t.Score));
            return new CourseInsightDto(course.Id, course.Title, completionRate, avgScore, course.TechStack.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries).Take(6).ToList());
        }).ToList();

        var interventions = atRisk.Select(l => new InterventionDto(l.UserId, l.Name, "LearnerAtRisk", l.RecommendedAction)).ToList();
        var skills = courseAnalytics.SelectMany(c => c.Skills.Select(skill => new SkillMatrixDto(skill, c.Title, c.AverageScore, c.CompletionRate))).ToList();

        return Ok(new AdminLearningInsightsDto(learners.Count, atRisk, courseAnalytics, skills, interventions));
    }

    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
}

internal static class EvidenceExtensions
{
    public static string LessonTitle(this UserProgress progress) => progress.Lesson?.Title ?? $"Lesson {progress.LessonId}";
}

public record LearningPathDto(IReadOnlyList<LearningPathItemDto> Courses, IReadOnlyList<string> WeakAreas, string RecommendedMadCloudTask);
public record LearningPathItemDto(int CourseId, string CourseTitle, int CompletionPercentage, int CompletedLessons, int TotalLessons, int? NextLessonId, string? NextLessonTitle, IReadOnlyList<string> WeakAreas, string RecommendedAction);
public record EvidencePackDto(string LearnerName, string LearnerEmail, int CompletedLessons, int TestsTaken, int AverageScore, bool CertificateReady, string CertificateStatus, IReadOnlyList<EvidenceLineDto> Evidence);
public record EvidenceLineDto(string Title, DateTime? When, string EventType);
public record LearningEventDto(string Type, DateTime OccurredAt, string Title, IReadOnlyDictionary<string, string> Data);
public record AdminLearningInsightsDto(int LearnerCount, IReadOnlyList<AtRiskLearnerDto> AtRiskLearners, IReadOnlyList<CourseInsightDto> CourseAnalytics, IReadOnlyList<SkillMatrixDto> SkillsMatrix, IReadOnlyList<InterventionDto> InterventionQueue);
public record AtRiskLearnerDto(int UserId, string Name, string Email, int CompletedLessons, int AverageScore, int FailedTests, string RecommendedAction);
public record CourseInsightDto(int CourseId, string Title, int CompletionRate, int AverageScore, IReadOnlyList<string> Skills);
public record SkillMatrixDto(string Skill, string CourseTitle, int AverageScore, int CompletionRate);
public record InterventionDto(int UserId, string LearnerName, string Trigger, string Action);
