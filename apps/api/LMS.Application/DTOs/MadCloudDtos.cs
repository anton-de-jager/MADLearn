namespace LMS.Application.DTOs;

public record MadCloudTaskRequestDto(string Input, string TaskType = "Validation");
public record MadCloudTaskDto(
    int Id,
    string TaskType,
    string Input,
    string Status,
    string? Output,
    DateTime CreatedAt,
    DateTime? StartedAt,
    DateTime? CompletedAt);
