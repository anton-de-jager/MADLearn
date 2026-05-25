using System.Collections.Generic;
namespace LMS.Domain.Entities;
public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Student";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<UserProgress> Progresses { get; set; } = new List<UserProgress>();
    public ICollection<TestResult> TestResults { get; set; } = new List<TestResult>();
    public ICollection<MadCloudTask> MadCloudTasks { get; set; } = new List<MadCloudTask>();
}
