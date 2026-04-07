-- ============================================================
-- LMS Database Schema
-- SQL Server
-- ============================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'LmsDb')
    CREATE DATABASE LmsDb;
GO

USE LmsDb;
GO

-- ============================================================
-- Users
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
CREATE TABLE Users (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    Username    NVARCHAR(100)  NOT NULL,
    Email       NVARCHAR(255)  NOT NULL UNIQUE,
    PasswordHash NVARCHAR(512) NOT NULL,
    Role        NVARCHAR(50)   NOT NULL DEFAULT 'Student',
    CreatedAt   DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ============================================================
-- Courses
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Courses')
CREATE TABLE Courses (
    Id           INT IDENTITY(1,1) PRIMARY KEY,
    Title        NVARCHAR(200) NOT NULL,
    Description  NVARCHAR(MAX) NOT NULL,
    TechStack    NVARCHAR(500) NOT NULL,
    DurationDays INT           NOT NULL DEFAULT 14,
    HoursPerDay  INT           NOT NULL DEFAULT 8,
    CreatedAt    DATETIME2     NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ============================================================
-- Modules
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Modules')
CREATE TABLE Modules (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    CourseId    INT           NOT NULL REFERENCES Courses(Id) ON DELETE CASCADE,
    Title       NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    DayNumber   INT           NOT NULL,
    OrderIndex  INT           NOT NULL DEFAULT 0
);
GO

-- ============================================================
-- Lessons
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Lessons')
CREATE TABLE Lessons (
    Id                 INT IDENTITY(1,1) PRIMARY KEY,
    ModuleId           INT            NOT NULL REFERENCES Modules(Id) ON DELETE CASCADE,
    Title              NVARCHAR(200)  NOT NULL,
    Content            NVARCHAR(MAX)  NOT NULL,
    CodeExample        NVARCHAR(MAX)  NULL,
    LessonType         NVARCHAR(50)   NOT NULL DEFAULT 'Theory',
    OrderIndex         INT            NOT NULL DEFAULT 0,
    EstimatedMinutes   INT            NOT NULL DEFAULT 30
);
GO

-- ============================================================
-- Tests
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tests')
CREATE TABLE Tests (
    Id           INT IDENTITY(1,1) PRIMARY KEY,
    LessonId     INT           NOT NULL REFERENCES Lessons(Id) ON DELETE CASCADE,
    Title        NVARCHAR(200) NOT NULL,
    PassingScore INT           NOT NULL DEFAULT 70
);
GO

-- ============================================================
-- Questions
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Questions')
CREATE TABLE Questions (
    Id         INT IDENTITY(1,1) PRIMARY KEY,
    TestId     INT           NOT NULL REFERENCES Tests(Id) ON DELETE CASCADE,
    Text       NVARCHAR(MAX) NOT NULL,
    OrderIndex INT           NOT NULL DEFAULT 0
);
GO

-- ============================================================
-- Answers
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Answers')
CREATE TABLE Answers (
    Id         INT IDENTITY(1,1) PRIMARY KEY,
    QuestionId INT           NOT NULL REFERENCES Questions(Id) ON DELETE CASCADE,
    Text       NVARCHAR(MAX) NOT NULL,
    IsCorrect  BIT           NOT NULL DEFAULT 0
);
GO

-- ============================================================
-- UserProgresses
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserProgresses')
CREATE TABLE UserProgresses (
    Id                INT IDENTITY(1,1) PRIMARY KEY,
    UserId            INT       NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
    LessonId          INT       NOT NULL REFERENCES Lessons(Id) ON DELETE CASCADE,
    IsCompleted       BIT       NOT NULL DEFAULT 0,
    TimeSpentMinutes  INT       NOT NULL DEFAULT 0,
    CompletedAt       DATETIME2 NULL,
    UNIQUE (UserId, LessonId)
);
GO

-- ============================================================
-- TestResults
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TestResults')
CREATE TABLE TestResults (
    Id       INT IDENTITY(1,1) PRIMARY KEY,
    UserId   INT       NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
    TestId   INT       NOT NULL REFERENCES Tests(Id),
    Score    INT       NOT NULL,
    Passed   BIT       NOT NULL DEFAULT 0,
    TakenAt  DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IX_Modules_CourseId       ON Modules(CourseId);
CREATE INDEX IX_Lessons_ModuleId       ON Lessons(ModuleId);
CREATE INDEX IX_Tests_LessonId         ON Tests(LessonId);
CREATE INDEX IX_Questions_TestId       ON Questions(TestId);
CREATE INDEX IX_Answers_QuestionId     ON Answers(QuestionId);
CREATE INDEX IX_UserProgresses_UserId  ON UserProgresses(UserId);
CREATE INDEX IX_TestResults_UserId     ON TestResults(UserId);
GO

PRINT 'LMS Schema created successfully.';
GO
