namespace LMS.Application.DTOs;

public record MadCloudTaskRequestDto(string Input, string TaskType = "Validation");
public record MadCloudAssistRequestDto(string Prompt, string Intent = "Tutor", int? CourseId = null, int? LessonId = null);
public record MadCloudTaskDto(
    int Id,
    string TaskType,
    string Input,
    string Status,
    string? Output,
    DateTime CreatedAt,
    DateTime? StartedAt,
    DateTime? CompletedAt);
