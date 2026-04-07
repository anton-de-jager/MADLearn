using LMS.Application.DTOs;
using LMS.Application.Interfaces;
using LMS.Domain.Entities;
using LMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Services;

public class ProgressService : IProgressService
{
    private readonly LmsDbContext _context;

    public ProgressService(LmsDbContext context) => _context = context;

    public async Task<List<UserProgressDto>> GetUserProgressAsync(int userId)
    {
        return await _context.UserProgresses
            .Where(p => p.UserId == userId)
            .Include(p => p.Lesson)
            .Select(p => new UserProgressDto(p.LessonId, p.Lesson.Title, p.IsCompleted, p.TimeSpentMinutes, p.CompletedAt))
            .ToListAsync();
    }

    public async Task<ProgressSummaryDto> GetProgressSummaryAsync(int userId)
    {
        var totalLessons = await _context.Lessons.CountAsync();
        var progresses = await _context.UserProgresses.Where(p => p.UserId == userId).ToListAsync();
        var completed = progresses.Count(p => p.IsCompleted);
        var totalTime = progresses.Sum(p => p.TimeSpentMinutes);
        double pct = totalLessons > 0 ? Math.Round((double)completed / totalLessons * 100, 1) : 0;
        return new ProgressSummaryDto(totalLessons, completed, pct, totalTime);
    }

    public async Task CompleteLessonAsync(int userId, CompleteLessonDto dto)
    {
        var progress = await _context.UserProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId && p.LessonId == dto.LessonId);

        if (progress == null)
        {
            progress = new UserProgress { UserId = userId, LessonId = dto.LessonId };
            _context.UserProgresses.Add(progress);
        }

        progress.IsCompleted = true;
        progress.CompletedAt = DateTime.UtcNow;
        progress.TimeSpentMinutes += dto.TimeSpentMinutes;
        await _context.SaveChangesAsync();
    }

    public async Task UpdateTimeSpentAsync(int userId, UpdateProgressDto dto)
    {
        var progress = await _context.UserProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId && p.LessonId == dto.LessonId);

        if (progress == null)
        {
            progress = new UserProgress { UserId = userId, LessonId = dto.LessonId };
            _context.UserProgresses.Add(progress);
        }

        progress.TimeSpentMinutes += dto.TimeSpentMinutes;
        await _context.SaveChangesAsync();
    }
}
