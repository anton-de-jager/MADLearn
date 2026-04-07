namespace LMS.Application.DTOs;
public record UserSummaryDto(int Id, string Username, string Email, string Role, DateTime CreatedAt, int CompletedLessons, int TotalTests, double AverageScore);
public record UserDetailDto(int Id, string Username, string Email, string Role, DateTime CreatedAt, List<UserProgressDto> Progresses, List<TestResultDto> TestResults);
