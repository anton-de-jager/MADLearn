namespace LMS.Domain.Entities;
public class Question
{
    public int Id { get; set; }
    public int TestId { get; set; }
    public string Text { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
    public Test Test { get; set; } = null!;
    public ICollection<Answer> Answers { get; set; } = new List<Answer>();
}
