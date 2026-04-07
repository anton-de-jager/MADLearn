using LMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LMS.Infrastructure.Data;

public class LmsDbContext : DbContext
{
    public LmsDbContext(DbContextOptions<LmsDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Module> Modules => Set<Module>();
    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<Test> Tests => Set<Test>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<Answer> Answers => Set<Answer>();
    public DbSet<UserProgress> UserProgresses => Set<UserProgress>();
    public DbSet<TestResult> TestResults => Set<TestResult>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasDefaultSchema("dbo");

        modelBuilder.Entity<User>(e => {
            e.ToTable("Users", "dbo");
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Role).HasDefaultValue("Student");
        });

        modelBuilder.Entity<UserProgress>(e => {
            e.ToTable("UserProgresses", "dbo");
            e.HasIndex(p => new { p.UserId, p.LessonId }).IsUnique();
        });

        modelBuilder.Entity<Course>().ToTable("Courses", "dbo");
        modelBuilder.Entity<Module>().ToTable("Modules", "dbo");
        modelBuilder.Entity<Lesson>().ToTable("Lessons", "dbo");
        modelBuilder.Entity<Test>().ToTable("Tests", "dbo");
        modelBuilder.Entity<Question>().ToTable("Questions", "dbo");
        modelBuilder.Entity<Answer>().ToTable("Answers", "dbo");
        modelBuilder.Entity<TestResult>().ToTable("TestResults", "dbo");
    }
}
