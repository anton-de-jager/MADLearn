namespace LMS.Application.DTOs;
public record UserProgressDto(int LessonId, string LessonTitle, bool IsCompleted, int TimeSpentMinutes, DateTime? CompletedAt);
public record UpdateProgressDto(int LessonId, int TimeSpentMinutes);
public record CompleteLessonDto(int LessonId, int TimeSpentMinutes);
public record ProgressSummaryDto(int TotalLessons, int CompletedLessons, double ProgressPercentage, int TotalTimeSpentMinutes);
