namespace LMS.Application.DTOs;
public record CourseDto(int Id, string Title, string Description, string TechStack, int DurationDays, int HoursPerDay, int ModuleCount);
public record ModuleDto(int Id, int CourseId, string Title, string Description, int DayNumber, int OrderIndex, int LessonCount);
public record LessonDto(int Id, int ModuleId, string Title, string Content, string? CodeExample, string LessonType, int OrderIndex, int EstimatedMinutes, bool HasTest);
public record LessonDetailDto(int Id, int ModuleId, string Title, string Content, string? CodeExample, string LessonType, int OrderIndex, int EstimatedMinutes, TestDto? Test);
