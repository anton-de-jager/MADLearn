using LMS.Application.DTOs;
using LMS.Application.Interfaces;
using LMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Services;

public class AdminService : IAdminService
{
    private readonly LmsDbContext _context;

    public AdminService(LmsDbContext context) => _context = context;

    public async Task<List<UserSummaryDto>> GetAllUsersAsync()
    {
        var users = await _context.Users
            .Include(u => u.Progresses)
            .Include(u => u.TestResults)
            .ToListAsync();

        return users.Select(u => new UserSummaryDto(
            u.Id, u.Username, u.Email, u.Role, u.CreatedAt,
            u.Progresses.Count(p => p.IsCompleted),
            u.TestResults.Count,
            u.TestResults.Any() ? Math.Round(u.TestResults.Average(t => t.Score), 1) : 0
        )).ToList();
    }

    public async Task<UserDetailDto?> GetUserDetailAsync(int userId)
    {
        var user = await _context.Users
            .Include(u => u.Progresses).ThenInclude(p => p.Lesson)
            .Include(u => u.TestResults).ThenInclude(t => t.Test)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null) return null;

        var progresses = user.Progresses.Select(p =>
            new UserProgressDto(p.LessonId, p.Lesson.Title, p.IsCompleted, p.TimeSpentMinutes, p.CompletedAt)).ToList();
        var results = user.TestResults.Select(r =>
            new TestResultDto(r.Id, r.TestId, r.Test.Title, r.Score, r.Passed, r.TakenAt)).ToList();

        return new UserDetailDto(user.Id, user.Username, user.Email, user.Role, user.CreatedAt, progresses, results);
    }

    public async Task<List<TestResultDto>> GetAllTestResultsAsync(int? courseId = null)
    {
        var query = _context.TestResults
            .Include(r => r.Test).ThenInclude(t => t.Lesson).ThenInclude(l => l.Module).ThenInclude(m => m.Course)
            .AsQueryable();

        if (courseId.HasValue)
            query = query.Where(r => r.Test.Lesson.Module.CourseId == courseId);

        return await query
            .OrderByDescending(r => r.TakenAt)
            .Select(r => new TestResultDto(r.Id, r.TestId, r.Test.Title, r.Score, r.Passed, r.TakenAt))
            .ToListAsync();
    }
}
