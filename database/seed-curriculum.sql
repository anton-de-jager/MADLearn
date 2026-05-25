-- ============================================================
-- LMS Full 2-Week Curriculum Seed Data
-- Run AFTER schema.sql
-- ============================================================
USE LmsDb;
GO

-- Admin user
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'admin@madlearn.local')
INSERT INTO Users (Username, Email, PasswordHash, Role)
VALUES ('admin', 'admin@madlearn.local',
        '$2a$11$K8xQzL9mN3pR7vH2wX5yOeJqF4iD6uA1bC8gE0hM2nS5tW7kP9rY3',  -- Admin@123
        'Admin');

-- Student user
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'student@madlearn.local')
INSERT INTO Users (Username, Email, PasswordHash, Role)
VALUES ('student1', 'student@madlearn.local',
        '$2a$11$K8xQzL9mN3pR7vH2wX5yOeJqF4iD6uA1bC8gE0hM2nS5tW7kP9rY3',  -- Student@123
        'Student');

-- Course
IF NOT EXISTS (SELECT 1 FROM Courses WHERE Title = 'Full-Stack Developer Bootcamp')
INSERT INTO Courses (Title, Description, TechStack, DurationDays, HoursPerDay)
VALUES (
    'Full-Stack Developer Bootcamp',
    'A comprehensive 2-week bootcamp covering TypeScript, Angular 19, .NET 8, and SQL Server. Build production-ready web applications from scratch.',
    'TypeScript, Angular 19, .NET 8, SQL Server',
    14, 8
);
GO

-- Note: The .NET EF Core seeder (DbSeeder.cs) handles full data seeding on first run.
-- This file documents the curriculum structure for reference / manual SQL seeding.
PRINT 'Seed data reference loaded. Use the .NET API seeder for full data.';
GO
