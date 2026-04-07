namespace LMS.Domain.Entities;
public class UserProgress
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int LessonId { get; set; }
    public bool IsCompleted { get; set; }
    public int TimeSpentMinutes { get; set; }
    public DateTime? CompletedAt { get; set; }
    public User User { get; set; } = null!;
    public Lesson Lesson { get; set; } = null!;
}
