namespace LMS.Domain.Entities;
public class Lesson
{
    public int Id { get; set; }
    public int ModuleId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? CodeExample { get; set; }
    public string LessonType { get; set; } = "Theory";
    public int OrderIndex { get; set; }
    public int EstimatedMinutes { get; set; }
    public Module Module { get; set; } = null!;
    public Test? Test { get; set; }
}
