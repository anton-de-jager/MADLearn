namespace LMS.Domain.Entities;
public class TestResult
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int TestId { get; set; }
    public int Score { get; set; }
    public bool Passed { get; set; }
    public DateTime TakenAt { get; set; } = DateTime.UtcNow;
    public User User { get; set; } = null!;
    public Test Test { get; set; } = null!;
}
