using LMS.Application.DTOs;
namespace LMS.Application.Interfaces;
public interface IProgressService
{
    Task<List<UserProgressDto>> GetUserProgressAsync(int userId);
    Task<ProgressSummaryDto> GetProgressSummaryAsync(int userId);
    Task CompleteLessonAsync(int userId, CompleteLessonDto dto);
    Task UpdateTimeSpentAsync(int userId, UpdateProgressDto dto);
}
