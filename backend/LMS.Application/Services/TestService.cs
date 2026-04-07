using LMS.Application.DTOs;
using LMS.Application.Interfaces;
using LMS.Domain.Entities;
using LMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LMS.Application.Services;

public class TestService : ITestService
{
    private readonly LmsDbContext _context;

    public TestService(LmsDbContext context) => _context = context;

    public async Task<TestDto?> GetTestByLessonIdAsync(int lessonId)
    {
        var test = await _context.Tests
            .Include(t => t.Questions).ThenInclude(q => q.Answers)
            .FirstOrDefaultAsync(t => t.LessonId == lessonId);

        if (test == null) return null;

        return new TestDto(test.Id, test.LessonId, test.Title, test.PassingScore,
            test.Questions.OrderBy(q => q.OrderIndex).Select(q =>
                new QuestionDto(q.Id, q.TestId, q.Text, q.OrderIndex,
                    q.Answers.Select(a => new AnswerDto(a.Id, a.QuestionId, a.Text)).ToList())
            ).ToList());
    }

    public async Task<TestResultDto> SubmitTestAsync(int userId, SubmitTestDto dto)
    {
        var test = await _context.Tests
            .Include(t => t.Questions).ThenInclude(q => q.Answers)
            .FirstOrDefaultAsync(t => t.Id == dto.TestId)
            ?? throw new InvalidOperationException("Test not found.");

        int correct = 0;
        foreach (var userAnswer in dto.Answers)
        {
            var question = test.Questions.FirstOrDefault(q => q.Id == userAnswer.QuestionId);
            if (question == null) continue;
            var answer = question.Answers.FirstOrDefault(a => a.Id == userAnswer.AnswerId);
            if (answer?.IsCorrect == true) correct++;
        }

        int totalQuestions = test.Questions.Count;
        int score = totalQuestions > 0 ? (int)Math.Round((double)correct / totalQuestions * 100) : 0;
        bool passed = score >= test.PassingScore;

        var result = new TestResult
        {
            UserId = userId,
            TestId = dto.TestId,
            Score = score,
            Passed = passed,
            TakenAt = DateTime.UtcNow
        };

        _context.TestResults.Add(result);
        await _context.SaveChangesAsync();

        return new TestResultDto(result.Id, result.TestId, test.Title, result.Score, result.Passed, result.TakenAt);
    }

    public async Task<List<TestResultDto>> GetUserTestResultsAsync(int userId)
    {
        return await _context.TestResults
            .Where(r => r.UserId == userId)
            .Include(r => r.Test)
            .OrderByDescending(r => r.TakenAt)
            .Select(r => new TestResultDto(r.Id, r.TestId, r.Test.Title, r.Score, r.Passed, r.TakenAt))
            .ToListAsync();
    }
}
