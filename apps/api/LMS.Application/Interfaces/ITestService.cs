using LMS.Application.DTOs;
namespace LMS.Application.Interfaces;
public interface ITestService
{
    Task<TestDto?> GetTestByLessonIdAsync(int lessonId);
    Task<TestResultDto> SubmitTestAsync(int userId, SubmitTestDto dto);
    Task<List<TestResultDto>> GetUserTestResultsAsync(int userId);
}
