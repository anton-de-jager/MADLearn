using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace LMS.Infrastructure.Data;

/// <summary>
/// Idempotent schema bootstrap that creates tables the EF migration would create
/// if it could run cleanly. Prod was set up before migrations were introduced, so
/// `Database.MigrateAsync()` aborts with "There is already an object named 'Courses'"
/// and leaves the newer tables (MadCloudTasks etc.) uncreated. This helper runs
/// after the migration attempt and uses `IF NOT EXISTS` guards so it's safe to
/// re-run on every startup.
///
/// When prod is re-baselined cleanly (or a __EFMigrationsHistory row is inserted
/// to fool EF into thinking the initial migration ran), this helper becomes a
/// no-op and can be removed.
/// </summary>
public static class SchemaBootstrap
{
    private const string MadCloudTasksSql = @"
IF NOT EXISTS (SELECT 1 FROM sys.tables t JOIN sys.schemas s ON s.schema_id = t.schema_id WHERE s.name = 'dbo' AND t.name = 'MadCloudTasks')
BEGIN
    CREATE TABLE [dbo].[MadCloudTasks] (
        [Id]          INT IDENTITY(1,1) NOT NULL,
        [UserId]      INT NOT NULL,
        [TaskType]    NVARCHAR(80) NOT NULL,
        [Input]       NVARCHAR(MAX) NOT NULL,
        [Status]      NVARCHAR(40) NOT NULL,
        [Output]      NVARCHAR(MAX) NULL,
        [CreatedAt]   DATETIME2 NOT NULL,
        [StartedAt]   DATETIME2 NULL,
        [CompletedAt] DATETIME2 NULL,
        CONSTRAINT [PK_MadCloudTasks] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_MadCloudTasks_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([Id]) ON DELETE CASCADE
    );
    CREATE INDEX [IX_MadCloudTasks_UserId] ON [dbo].[MadCloudTasks] ([UserId]);
END
";

    public static async Task EnsureAsync(LmsDbContext context, ILogger logger, CancellationToken cancellationToken = default)
    {
        try
        {
            await context.Database.ExecuteSqlRawAsync(MadCloudTasksSql, cancellationToken);
            logger.LogInformation("SchemaBootstrap: MadCloudTasks table ensured (idempotent).");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "SchemaBootstrap: failed to ensure MadCloudTasks table. Endpoints touching MadCloudTasks will return 500 until resolved.");
        }
    }
}
