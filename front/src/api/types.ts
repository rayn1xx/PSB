// Общие типы

export type UserRole = "student" | "teacher" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Профиль

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  group?: string;
  university?: string;
  enrolledSince?: number;
  completedCourses?: number;
  timezone?: string;
}

export interface NotificationSettings {
  emailAssignments: boolean;
  emailTests: boolean;
  emailNews: boolean;
  inAppReminders: boolean;
}

// Курсы

export type CourseStatus = "not_started" | "in_progress" | "completed";

export interface StudentCourse {
  id: string;
  title: string;
  description: string;
  instructor: string;
  progressPercent: number;
  status: CourseStatus;
  nextDeadline: string | null; // ISO
  badges: string[];
}

export interface CourseModuleProgress {
  id: string;
  title: string;
  progressPercent: number;
  lessons: number;
  completedLessons: number;
  status: CourseStatus;
}

export interface UpcomingDeadline {
  type: "assignment" | "test" | "other";
  id: string;
  title: string;
  deadline: string; // ISO
}

export interface CourseOverview {
  id: string;
  title: string;
  description: string;
  instructor: {
    id: string;
    name: string;
  };
  progressPercent: number;
  modules: CourseModuleProgress[];
  upcomingDeadlines: UpcomingDeadline[];
}

// Материалы

export type MaterialType = "video" | "text" | "file" | "scorm";

export type MaterialStatus = "not_started" | "in_progress" | "completed";

export interface MaterialListItem {
  id: string;
  type: MaterialType;
  title: string;
  durationMinutes?: number;
  status: MaterialStatus;
  viewProgressPercent?: number;
}

export interface CourseModuleMaterials {
  id: string;
  title: string;
  items: MaterialListItem[];
}

export interface FileResource {
  id: string;
  name: string;
  url: string;
}

export interface RelatedAssignmentShort {
  id: string;
  title: string;
}

export interface MaterialDetailBase {
  id: string;
  courseId: string;
  moduleId: string;
  type: MaterialType;
  title: string;
  description?: string;
  status: MaterialStatus;
  viewProgressPercent?: number;
  relatedAssignments?: RelatedAssignmentShort[];
}

export interface VideoMaterialDetail extends MaterialDetailBase {
  type: "video";
  videoUrl: string;
  transcript?: string;
}

export interface TextMaterialDetail extends MaterialDetailBase {
  type: "text";
  content: string;
}

export interface FileMaterialDetail extends MaterialDetailBase {
  type: "file";
  files: FileResource[];
}

export interface ScormMaterialDetail extends MaterialDetailBase {
  type: "scorm";
  launchUrl: string;
}

export type MaterialDetail =
  | VideoMaterialDetail
  | TextMaterialDetail
  | FileMaterialDetail
  | ScormMaterialDetail;

// Домашки

export type AssignmentStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "graded"
  | "needs_revision";

export interface AssignmentListItem {
  id: string;
  title: string;
  module: string;
  deadline: string; // ISO
  status: AssignmentStatus;
  grade: number | null;
  hasNewComments: boolean;
}

export interface AssignmentCriteriaItem {
  id: string;
  title: string;
  max: number;
}

export interface AssignmentDetail {
  id: string;
  courseId: string;
  title: string;
  description: string;
  module: string;
  deadline: string;
  status: AssignmentStatus;
  grade: number | null;
  maxGrade: number;
  teacherFiles: FileResource[];
  criteria: AssignmentCriteriaItem[];
}

export interface TeacherComment {
  id: string;
  author: {
    id: string;
    name: string;
  };
  createdAt: string;
  text: string;
}

export interface AssignmentSubmission {
  id: string;
  createdAt: string;
  status: AssignmentStatus | "on_review";
  grade: number | null;
  commentFromStudent?: string;
  files: FileResource[];
  teacherComments: TeacherComment[];
}

// Тесты

export type TestStatus = "not_started" | "in_progress" | "completed";

export interface CourseTestListItem {
  id: string;
  title: string;
  module: string;
  deadline: string;
  status: TestStatus;
  attemptsUsed: number;
  attemptsLimit: number;
  bestScorePercent: number | null;
}

export type QuestionType = "single_choice" | "multiple_choice" | "matching";

export interface QuestionOption {
  id: string;
  text: string;
}

export interface QuestionMatchingLeft {
  id: string;
  text: string;
}

export interface QuestionMatchingRight {
  id: string;
  text: string;
}

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  text: string;
}

export interface SingleChoiceQuestion extends BaseQuestion {
  type: "single_choice";
  options: QuestionOption[];
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple_choice";
  options: QuestionOption[];
}

export interface MatchingQuestion extends BaseQuestion {
  type: "matching";
  leftItems: QuestionMatchingLeft[];
  rightItems: QuestionMatchingRight[];
}

export type TestQuestion =
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | MatchingQuestion;

export interface TestDetail {
  id: string;
  title: string;
  timeLimitMinutes?: number;
  questions: TestQuestion[];
}

export interface TestAttemptAnswerSingleOrMulti {
  questionId: string;
  selectedOptionIds: string[];
}

export interface TestAttemptAnswerMatching {
  questionId: string;
  matches: { leftId: string; rightId: string }[];
}

export type TestAttemptAnswer =
  | TestAttemptAnswerSingleOrMulti
  | TestAttemptAnswerMatching;

export interface TestAttemptResultDetail {
  questionId: string;
  correct: boolean;
}

export interface TestAttemptResult {
  attemptId: string;
  scorePercent: number;
  passed: boolean;
  details: TestAttemptResultDetail[];
}

// Чат

export interface ChatChannel {
  id: string;
  name: string;
  unreadCount: number;
}

export interface ChatMessageAuthor {
  id: string;
  name: string;
  role: UserRole;
}

export interface ChatMessage {
  id: string;
  author: ChatMessageAuthor;
  text: string;
  createdAt: string;
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
  nextCursor: string | null;
}

// Оценки

export interface GradeItem {
  id: string;
  type: "assignment" | "test";
  title: string;
  module: string;
  score: number | null;
  maxScore: number;
  status: AssignmentStatus | TestStatus | "graded";
}

export interface CourseGrades {
  courseId: string;
  totalScore: number;
  maxTotalScore: number;
  items: GradeItem[];
}

// Календарь

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: "assignment" | "test" | "lecture" | "other";
  course: string;
  entityType: "assignment" | "test" | "material" | "other";
  entityId: string;
}

// Уведомления

export interface NotificationItem {
  id: string;
  type:
    | "assignment_comment"
    | "test_graded"
    | "assignment_deadline"
    | "system"
    | string;
  title: string;
  body: string;
  entityType: "assignment" | "test" | "course" | "other";
  entityId: string;
  courseId?: string;
  createdAt: string;
  read: boolean;
}
