using LMS.Application.DTOs;
namespace LMS.Application.Interfaces;
public interface ICourseService
{
    Task<List<CourseDto>> GetAllCoursesAsync();
    Task<CourseDto?> GetCourseByIdAsync(int id);
    Task<List<ModuleDto>> GetModulesByCourseIdAsync(int courseId);
    Task<List<LessonDto>> GetLessonsByModuleIdAsync(int moduleId);
    Task<LessonDetailDto?> GetLessonByIdAsync(int id);
}
