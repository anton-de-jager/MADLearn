namespace LMS.Application.DTOs;
public record TestDto(int Id, int LessonId, string Title, int PassingScore, List<QuestionDto> Questions);
public record QuestionDto(int Id, int TestId, string Text, int OrderIndex, List<AnswerDto> Answers);
public record AnswerDto(int Id, int QuestionId, string Text);
public record SubmitTestDto(int TestId, List<UserAnswerDto> Answers);
public record UserAnswerDto(int QuestionId, int AnswerId);
public record TestResultDto(int Id, int TestId, string TestTitle, int Score, bool Passed, DateTime TakenAt);
