import {
  AssignmentDetail,
  AssignmentListItem,
  AssignmentSubmission,
  CalendarEvent,
  ChatChannel,
  ChatMessagesResponse,
  CourseGrades,
  CourseModuleMaterials,
  CourseOverview,
  CourseTestListItem,
  MaterialDetail,
  MaterialStatus,
  NotificationItem,
  NotificationSettings,
  Profile,
  StudentCourse,
  TestAttemptResult,
  TestDetail,
} from "./types";

// Простая дата "сейчас + n дней"
const addDays = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

// ==== AUTH MOCKS ====

export const mockAccessToken = "mock-access-token";
export const mockRefreshToken = "mock-refresh-token";

// ==== PROFILE MOCKS ====

export const mockProfile: Profile = {
  id: "stu_1",
  firstName: "Иван",
  lastName: "Иванов",
  email: "ivan@psb.ru",
  phone: "+7 (999) 123-45-67",
  group: "ИКБО-01-25",
  university: "МИРЭА",
  enrolledSince: 2024,
  completedCourses: 2,
  timezone: "Europe/Moscow",
};

export const mockNotificationSettings: NotificationSettings = {
  emailAssignments: true,
  emailTests: true,
  emailNews: false,
  inAppReminders: true,
};

// ==== COURSES MOCKS ====

export const mockStudentCourses: StudentCourse[] = [
  {
    id: "course_1",
    title: "Основы финтех-разработки",
    description: "Изучите основы создания финансовых приложений",
    instructor: "Анна Смирнова",
    progressPercent: 65,
    status: "in_progress",
    nextDeadline: addDays(2),
    badges: ["Хакатон ПСБ"],
  },
  {
    id: "course_2",
    title: "Безопасность и шифрование",
    description: "Основы криптографии и безопасной разработки",
    instructor: "Сергей Петров",
    progressPercent: 0,
    status: "not_started",
    nextDeadline: null,
    badges: [],
  },
];

export const mockCourseOverview: CourseOverview = {
  id: "course_1",
  title: "Основы финтех-разработки",
  description: "Полное описание курса с модулями и практикой...",
  instructor: { id: "teacher_1", name: "Анна Смирнова" },
  progressPercent: 65,
  modules: [
    {
      id: "mod_1",
      title: "Введение в финтех",
      progressPercent: 100,
      lessons: 5,
      completedLessons: 5,
      status: "completed",
    },
    {
      id: "mod_3",
      title: "Безопасность и шифрование",
      progressPercent: 60,
      lessons: 8,
      completedLessons: 5,
      status: "in_progress",
    },
  ],
  upcomingDeadlines: [
    {
      type: "assignment",
      id: "ass_1",
      title: "ДЗ 3.2: Реализация API аутентификации",
      deadline: addDays(2),
    },
    {
      type: "test",
      id: "test_1",
      title: "Тест по модулю 3",
      deadline: addDays(5),
    },
  ],
};

// ==== MATERIALS MOCKS ====

export const mockCourseMaterials: CourseModuleMaterials[] = [
  {
    id: "mod_1",
    title: "Введение в финтех",
    items: [
      {
        id: "mat_1",
        type: "video",
        title: "Знакомство с финтехом",
        durationMinutes: 12,
        status: "completed",
      },
      {
        id: "mat_2",
        type: "text",
        title: "История финтеха",
        status: "completed",
      },
    ],
  },
  {
    id: "mod_3",
    title: "Безопасность и шифрование",
    items: [
      {
        id: "mat_21",
        type: "video",
        title: "Основы шифрования",
        durationMinutes: 20,
        status: "in_progress",
        viewProgressPercent: 60,
      },
    ],
  },
];

export const mockMaterialDetail: MaterialDetail = {
  id: "mat_21",
  courseId: "course_1",
  moduleId: "mod_3",
  type: "video",
  title: "Основы шифрования",
  description: "Разбор базовых понятий шифрования...",
  videoUrl: "https://example.com/mock-video.mp4",
  transcript: "Текстовая расшифровка видео...",
  status: "in_progress" as MaterialStatus,
  viewProgressPercent: 60,
  relatedAssignments: [
    { id: "ass_1", title: "ДЗ: Реализация API аутентификации" },
  ],
};

// ==== ASSIGNMENTS MOCKS ====

export const mockAssignmentsList: AssignmentListItem[] = [
  {
    id: "ass_1",
    title: "ДЗ 3.2: Реализация API аутентификации",
    module: "Модуль 3",
    deadline: addDays(2),
    status: "submitted",
    grade: null,
    hasNewComments: true,
  },
  {
    id: "ass_2",
    title: "ДЗ 2.1: Проектирование базы данных",
    module: "Модуль 2",
    deadline: addDays(-1),
    status: "graded",
    grade: 9,
    hasNewComments: false,
  },
];

export const mockAssignmentDetail: AssignmentDetail = {
  id: "ass_1",
  courseId: "course_1",
  title: "ДЗ 3.2: Реализация API аутентификации",
  description:
    "Реализуйте REST API для аутентификации студентов (регистрация, логин, refresh).",
  module: "Модуль 3",
  deadline: addDays(2),
  status: "submitted",
  grade: null,
  maxGrade: 10,
  teacherFiles: [
    {
      id: "file_t1",
      name: "specification.pdf",
      url: "https://example.com/spec.pdf",
    },
  ],
  criteria: [
    { id: "crit_1", title: "Корректность API", max: 4 },
    { id: "crit_2", title: "Структура кода", max: 3 },
    { id: "crit_3", title: "Документация", max: 3 },
  ],
};

export const mockSubmissions: AssignmentSubmission[] = [
  {
    id: "sub_1",
    createdAt: addDays(-3),
    status: "graded",
    grade: 7,
    commentFromStudent: "Первая версия",
    files: [
      { id: "file_1", name: "hw_v1.zip", url: "https://example.com/hw_v1.zip" },
    ],
    teacherComments: [
      {
        id: "tc_1",
        author: { id: "teacher_1", name: "Анна Смирнова" },
        createdAt: addDays(-2),
        text: "Нужно добавить обработку ошибок.",
      },
    ],
  },
  {
    id: "sub_2",
    createdAt: addDays(-1),
    status: "submitted",
    grade: null,
    commentFromStudent: "Исправил обработку ошибок",
    files: [
      { id: "file_2", name: "hw_v2.zip", url: "https://example.com/hw_v2.zip" },
    ],
    teacherComments: [],
  },
];

// ==== TESTS MOCKS ====

export const mockTestsList: CourseTestListItem[] = [
  {
    id: "test_1",
    title: "Тест по модулю 3",
    module: "Модуль 3",
    deadline: addDays(5),
    status: "not_started",
    attemptsUsed: 0,
    attemptsLimit: 3,
    bestScorePercent: null,
  },
];

export const mockTestDetail: TestDetail = {
  id: "test_1",
  title: "Тест по модулю 3",
  timeLimitMinutes: 20,
  questions: [
    {
      id: "q1",
      type: "single_choice",
      text: "Что такое токен?",
      options: [
        { id: "o1", text: "Строка, подтверждающая аутентификацию" },
        { id: "o2", text: "Алгоритм сортировки" },
      ],
    },
    {
      id: "q2",
      type: "multiple_choice",
      text: "Выберите верные утверждения об OAuth2",
      options: [
        { id: "o1", text: "Используется для авторизации" },
        { id: "o2", text: "Это база данных" },
        { id: "o3", text: "Может работать с JWT" },
      ],
    },
  ],
};

export const mockTestAttemptResult: TestAttemptResult = {
  attemptId: "att_1",
  scorePercent: 86,
  passed: true,
  details: [
    { questionId: "q1", correct: true },
    { questionId: "q2", correct: false },
  ],
};

// ==== CHAT MOCKS ====

export const mockChatChannels: ChatChannel[] = [
  { id: "ch_general", name: "Общий чат курса", unreadCount: 2 },
  { id: "ch_homework", name: "Вопросы по ДЗ", unreadCount: 0 },
];

export const mockChatMessages: ChatMessagesResponse = {
  messages: [
    {
      id: "msg_1",
      author: { id: "teacher_1", name: "Анна", role: "teacher" },
      text: "Коллеги, не забудьте сдать ДЗ до пятницы.",
      createdAt: addDays(-1),
    },
    {
      id: "msg_2",
      author: { id: "stu_1", name: "Иван", role: "student" },
      text: "А можно продлить дедлайн?",
      createdAt: addDays(-1),
    },
  ],
  nextCursor: null,
};

// ==== GRADES MOCKS ====

export const mockCourseGrades: CourseGrades = {
  courseId: "course_1",
  totalScore: 37,
  maxTotalScore: 50,
  items: [
    {
      id: "ass_1",
      type: "assignment",
      title: "ДЗ 3.2",
      module: "Модуль 3",
      score: 7,
      maxScore: 10,
      status: "graded",
    },
    {
      id: "test_1",
      type: "test",
      title: "Тест по модулю 3",
      module: "Модуль 3",
      score: 9,
      maxScore: 10,
      status: "graded",
    },
  ],
};

// ==== CALENDAR MOCKS ====

export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: "ev_1",
    date: addDays(2),
    title: "ДЗ 3.2: API",
    type: "assignment",
    course: "Основы финтех-разработки",
    entityType: "assignment",
    entityId: "ass_1",
  },
  {
    id: "ev_2",
    date: addDays(5),
    title: "Тест по модулю 3",
    type: "test",
    course: "Основы финтех-разработки",
    entityType: "test",
    entityId: "test_1",
  },
];

// ==== NOTIFICATIONS MOCKS ====

export const mockNotifications: NotificationItem[] = [
  {
    id: "n1",
    type: "assignment_comment",
    title: "Комментарий к ДЗ",
    body: "Преподаватель оставил комментарий к ДЗ 3.2",
    entityType: "assignment",
    entityId: "ass_1",
    courseId: "course_1",
    createdAt: addDays(-1),
    read: false,
  },
  {
    id: "n2",
    type: "test_graded",
    title: "Тест оценён",
    body: "Ваш результат по тесту 9 из 10",
    entityType: "test",
    entityId: "test_1",
    courseId: "course_1",
    createdAt: addDays(-1),
    read: true,
  },
];
