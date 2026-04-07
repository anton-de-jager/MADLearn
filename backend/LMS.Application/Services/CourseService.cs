using LMS.Application.DTOs;
using LMS.Application.Interfaces;
using LMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Services;

public class CourseService : ICourseService
{
    private readonly LmsDbContext _context;

    public CourseService(LmsDbContext context) => _context = context;

    public async Task<List<CourseDto>> GetAllCoursesAsync()
    {
        return await _context.Courses
            .Include(c => c.Modules)
            .Select(c => new CourseDto(c.Id, c.Title, c.Description, c.TechStack, c.DurationDays, c.HoursPerDay, c.Modules.Count))
            .ToListAsync();
    }

    public async Task<CourseDto?> GetCourseByIdAsync(int id)
    {
        var c = await _context.Courses.Include(c => c.Modules).FirstOrDefaultAsync(c => c.Id == id);
        if (c == null) return null;
        return new CourseDto(c.Id, c.Title, c.Description, c.TechStack, c.DurationDays, c.HoursPerDay, c.Modules.Count);
    }

    public async Task<List<ModuleDto>> GetModulesByCourseIdAsync(int courseId)
    {
        return await _context.Modules
            .Where(m => m.CourseId == courseId)
            .Include(m => m.Lessons)
            .OrderBy(m => m.DayNumber).ThenBy(m => m.OrderIndex)
            .Select(m => new ModuleDto(m.Id, m.CourseId, m.Title, m.Description, m.DayNumber, m.OrderIndex, m.Lessons.Count))
            .ToListAsync();
    }

    public async Task<List<LessonDto>> GetLessonsByModuleIdAsync(int moduleId)
    {
        return await _context.Lessons
            .Where(l => l.ModuleId == moduleId)
            .Include(l => l.Test)
            .OrderBy(l => l.OrderIndex)
            .Select(l => new LessonDto(l.Id, l.ModuleId, l.Title, l.Content, l.CodeExample, l.LessonType, l.OrderIndex, l.EstimatedMinutes, l.Test != null))
            .ToListAsync();
    }

    public async Task<LessonDetailDto?> GetLessonByIdAsync(int id)
    {
        var lesson = await _context.Lessons
            .Include(l => l.Test)
                .ThenInclude(t => t!.Questions)
                    .ThenInclude(q => q.Answers)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (lesson == null) return null;

        TestDto? testDto = null;
        if (lesson.Test != null)
        {
            testDto = new TestDto(
                lesson.Test.Id,
                lesson.Test.LessonId,
                lesson.Test.Title,
                lesson.Test.PassingScore,
                lesson.Test.Questions.OrderBy(q => q.OrderIndex).Select(q =>
                    new QuestionDto(q.Id, q.TestId, q.Text, q.OrderIndex,
                        q.Answers.Select(a => new AnswerDto(a.Id, a.QuestionId, a.Text)).ToList())
                ).ToList()
            );
        }

        return new LessonDetailDto(lesson.Id, lesson.ModuleId, lesson.Title, lesson.Content,
            lesson.CodeExample, lesson.LessonType, lesson.OrderIndex, lesson.EstimatedMinutes, testDto);
    }
}
