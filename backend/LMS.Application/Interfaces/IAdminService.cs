using LMS.Application.DTOs;
namespace LMS.Application.Interfaces;
public interface IAdminService
{
    Task<List<UserSummaryDto>> GetAllUsersAsync();
    Task<UserDetailDto?> GetUserDetailAsync(int userId);
    Task<List<TestResultDto>> GetAllTestResultsAsync(int? courseId = null);
}
