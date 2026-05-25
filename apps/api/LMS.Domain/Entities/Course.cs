namespace LMS.Domain.Entities;
public class Course
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TechStack { get; set; } = string.Empty;
    public int DurationDays { get; set; }
    public int HoursPerDay { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Module> Modules { get; set; } = new List<Module>();
}
