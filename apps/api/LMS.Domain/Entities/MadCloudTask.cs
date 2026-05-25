namespace LMS.Domain.Entities;

public class MadCloudTask
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string TaskType { get; set; } = "Validation";
    public string Input { get; set; } = string.Empty;
    public string Status { get; set; } = "Queued";
    public string? Output { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public User User { get; set; } = null!;
}
