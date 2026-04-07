namespace LMS.Domain.Entities;
public class Test
{
    public int Id { get; set; }
    public int LessonId { get; set; }
    public string Title { get; set; } = string.Empty;
    public int PassingScore { get; set; } = 70;
    public Lesson Lesson { get; set; } = null!;
    public ICollection<Question> Questions { get; set; } = new List<Question>();
    public ICollection<TestResult> TestResults { get; set; } = new List<TestResult>();
}
