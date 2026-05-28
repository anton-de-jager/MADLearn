export interface AuthResponse {
  token: string;
  username: string;
  email: string;
  role: string;
  userId: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  techStack: string;
  durationDays: number;
  hoursPerDay: number;
  moduleCount: number;
}

export interface Module {
  id: number;
  courseId: number;
  title: string;
  description: string;
  dayNumber: number;
  orderIndex: number;
  lessonCount: number;
}

export interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  content: string;
  codeExample: string | null;
  lessonType: string;
  orderIndex: number;
  estimatedMinutes: number;
  hasTest: boolean;
}

export interface LessonDetail extends Lesson {
  test: Test | null;
}

export interface Test {
  id: number;
  lessonId: number;
  title: string;
  passingScore: number;
  questions: Question[];
}

export interface Question {
  id: number;
  testId: number;
  text: string;
  orderIndex: number;
  answers: Answer[];
}

export interface Answer {
  id: number;
  questionId: number;
  text: string;
}

export interface SubmitTestDto {
  testId: number;
  answers: UserAnswerDto[];
}

export interface UserAnswerDto {
  questionId: number;
  answerId: number;
}

export interface TestResult {
  id: number;
  testId: number;
  testTitle: string;
  score: number;
  passed: boolean;
  takenAt: string;
}

export interface UserProgress {
  lessonId: number;
  lessonTitle: string;
  isCompleted: boolean;
  timeSpentMinutes: number;
  completedAt: string | null;
}

export interface ProgressSummary {
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  totalTimeSpentMinutes: number;
}

export interface UserSummary {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  completedLessons: number;
  totalTests: number;
  averageScore: number;
}

export interface UserDetail {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  progresses: UserProgress[];
  testResults: TestResult[];
}

export interface MadCloudTaskRequest {
  input: string;
  taskType: string;
}

export interface MadCloudAssistRequest {
  prompt: string;
  intent: string;
  courseId?: number | null;
  lessonId?: number | null;
}

export interface MadCloudTask {
  id: number;
  taskType: string;
  input: string;
  status: string;
  output: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface LearningPath {
  courses: LearningPathItem[];
  weakAreas: string[];
  recommendedMadCloudTask: string;
}

export interface LearningPathItem {
  courseId: number;
  courseTitle: string;
  completionPercentage: number;
  completedLessons: number;
  totalLessons: number;
  nextLessonId: number | null;
  nextLessonTitle: string | null;
  weakAreas: string[];
  recommendedAction: string;
}

export interface EvidencePack {
  learnerName: string;
  learnerEmail: string;
  completedLessons: number;
  testsTaken: number;
  averageScore: number;
  certificateReady: boolean;
  certificateStatus: string;
  evidence: EvidenceLine[];
}

export interface EvidenceLine {
  title: string;
  when: string | null;
  eventType: string;
}

export interface LearningEvent {
  type: string;
  occurredAt: string;
  title: string;
  data: Record<string, string>;
}

export interface AdminLearningInsights {
  learnerCount: number;
  atRiskLearners: AtRiskLearner[];
  courseAnalytics: CourseInsight[];
  skillsMatrix: SkillMatrix[];
  interventionQueue: Intervention[];
}

export interface AtRiskLearner {
  userId: number;
  name: string;
  email: string;
  completedLessons: number;
  averageScore: number;
  failedTests: number;
  recommendedAction: string;
}

export interface CourseInsight {
  courseId: number;
  title: string;
  completionRate: number;
  averageScore: number;
  skills: string[];
}

export interface SkillMatrix {
  skill: string;
  courseTitle: string;
  averageScore: number;
  completionRate: number;
}

export interface Intervention {
  userId: number;
  learnerName: string;
  trigger: string;
  action: string;
}
