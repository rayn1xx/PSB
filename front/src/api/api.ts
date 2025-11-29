import {
  AssignmentDetail,
  AssignmentListItem,
  AssignmentSubmission,
  AuthTokens,
  AuthUser,
  CalendarEvent,
  ChatChannel,
  ChatMessagesResponse,
  CourseGrades,
  CourseModuleMaterials,
  CourseOverview,
  CourseTestListItem,
  MaterialDetail,
  NotificationItem,
  NotificationSettings,
  Profile,
  StudentCourse,
  TestAttemptAnswer,
  TestAttemptResult,
  TestDetail,
} from "./types";

import {
  mockAccessToken,
  mockAssignmentDetail,
  mockAssignmentsList,
  mockCalendarEvents,
  mockChatChannels,
  mockChatMessages,
  mockCourseGrades,
  mockCourseMaterials,
  mockCourseOverview,
  mockMaterialDetail,
  mockNotificationSettings,
  mockNotifications,
  mockProfile,
  mockStudentCourses,
  mockTestAttemptResult,
  mockTestDetail,
  mockTestsList,
  mockSubmissions,
  mockRefreshToken,
} from "./mock";

// ========= БАЗОВЫЙ HTTP-ХЕЛПЕР =========

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "/api";

const AUTH_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

function getAccessToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setTokens(tokens: AuthTokens) {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } catch {
    // ignore
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  { timeoutMs = 8000 }: { timeoutMs?: number } = {}
): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const url = `${API_BASE_URL}${path}`;
  const token = getAccessToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(id);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    if (res.status === 204) {
      return undefined as T;
    }

    return (await res.json()) as T;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// ========= AUTH =========

export async function apiLogin(
  email: string,
  password: string
): Promise<{ user: AuthUser; tokens: AuthTokens }> {
  try {
    const data = await request<{
      accessToken: string;
      refreshToken: string;
      user: AuthUser;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });

    return { user: data.user, tokens: data };
  } catch (error) {
    console.warn("apiLogin failed, using mock user", error);
    const mockUser: AuthUser = {
      id: mockProfile.id,
      name: `${mockProfile.firstName} ${mockProfile.lastName}`,
      email: mockProfile.email,
      role: "student",
    };
    const tokens: AuthTokens = {
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
    };
    setTokens(tokens);
    return { user: mockUser, tokens };
  }
}

export async function apiSignup(
  name: string,
  email: string,
  password: string
): Promise<{ user: AuthUser; tokens: AuthTokens }> {
  try {
    const data = await request<{
      accessToken: string;
      refreshToken: string;
      user: AuthUser;
    }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });

    return { user: data.user, tokens: data };
  } catch (error) {
    console.warn("apiSignup failed, using mock user", error);
    const mockUser: AuthUser = {
      id: mockProfile.id,
      name,
      email,
      role: "student",
    };
    const tokens: AuthTokens = {
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
    };
    setTokens(tokens);
    return { user: mockUser, tokens };
  }
}

export async function apiMe(): Promise<AuthUser | null> {
  try {
    const data = await request<AuthUser>("/auth/me");
    return data;
  } catch (error) {
    console.warn("apiMe failed, using mock", error);
    return {
      id: mockProfile.id,
      name: `${mockProfile.firstName} ${mockProfile.lastName}`,
      email: mockProfile.email,
      role: "student",
    };
  }
}

// ========= PROFILE =========

export async function apiGetProfile(): Promise<Profile> {
  try {
    return await request<Profile>("/profile");
  } catch (error) {
    console.warn("apiGetProfile failed, using mock", error);
    return mockProfile;
  }
}

export async function apiUpdateProfile(
  payload: Partial<Profile>
): Promise<Profile> {
  try {
    return await request<Profile>("/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn("apiUpdateProfile failed, using mock", error);
    // Примитивный merge с мок-профилем
    return { ...mockProfile, ...payload };
  }
}

export async function apiGetNotificationSettings(): Promise<NotificationSettings> {
  try {
    return await request<NotificationSettings>(
      "/profile/notifications-settings"
    );
  } catch (error) {
    console.warn("apiGetNotificationSettings failed, using mock", error);
    return mockNotificationSettings;
  }
}

export async function apiUpdateNotificationSettings(
  payload: NotificationSettings
): Promise<NotificationSettings> {
  try {
    await request("/profile/notifications-settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return payload;
  } catch (error) {
    console.warn("apiUpdateNotificationSettings failed, using mock", error);
    return payload;
  }
}

export async function apiChangePassword(
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  try {
    await request("/profile/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return true;
  } catch (error) {
    console.warn("apiChangePassword failed (mock: always success)", error);
    return true;
  }
}

// ========= COURSES =========

export async function apiGetStudentCourses(
  status?: "active" | "completed" | "all"
): Promise<StudentCourse[]> {
  try {
    const qs = status ? `?status=${status}` : "";
    return await request<StudentCourse[]>(`/student/courses${qs}`);
  } catch (error) {
    console.warn("apiGetStudentCourses failed, using mock", error);
    return mockStudentCourses;
  }
}

export async function apiGetCourseOverview(
  courseId: string
): Promise<CourseOverview> {
  try {
    return await request<CourseOverview>(`/courses/${courseId}/overview`);
  } catch (error) {
    console.warn("apiGetCourseOverview failed, using mock", error);
    return mockCourseOverview;
  }
}

// ========= MATERIALS =========

export async function apiGetCourseMaterials(
  courseId: string
): Promise<CourseModuleMaterials[]> {
  try {
    const res = await request<{ modules: CourseModuleMaterials[] }>(
      `/courses/${courseId}/materials`
    );
    return res.modules;
  } catch (error) {
    console.warn("apiGetCourseMaterials failed, using mock", error);
    return mockCourseMaterials;
  }
}

export async function apiGetMaterial(
  materialId: string
): Promise<MaterialDetail> {
  try {
    return await request<MaterialDetail>(`/materials/${materialId}`);
  } catch (error) {
    console.warn("apiGetMaterial failed, using mock", error);
    return mockMaterialDetail;
  }
}

export async function apiUpdateMaterialProgress(
  materialId: string,
  viewProgressPercent: number,
  completed: boolean
): Promise<boolean> {
  try {
    await request(`/materials/${materialId}/progress`, {
      method: "POST",
      body: JSON.stringify({ viewProgressPercent, completed }),
    });
    return true;
  } catch (error) {
    console.warn("apiUpdateMaterialProgress failed (mock: ignore)", error);
    return true;
  }
}

// ========= ASSIGNMENTS =========

export async function apiGetCourseAssignments(
  courseId: string
): Promise<AssignmentListItem[]> {
  try {
    return await request<AssignmentListItem[]>(
      `/courses/${courseId}/assignments`
    );
  } catch (error) {
    console.warn("apiGetCourseAssignments failed, using mock", error);
    return mockAssignmentsList;
  }
}

export async function apiGetAssignment(
  assignmentId: string
): Promise<AssignmentDetail> {
  try {
    return await request<AssignmentDetail>(`/assignments/${assignmentId}`);
  } catch (error) {
    console.warn("apiGetAssignment failed, using mock", error);
    return mockAssignmentDetail;
  }
}

export async function apiGetAssignmentSubmissions(
  assignmentId: string
): Promise<AssignmentSubmission[]> {
  try {
    return await request<AssignmentSubmission[]>(
      `/assignments/${assignmentId}/submissions`
    );
  } catch (error) {
    console.warn("apiGetAssignmentSubmissions failed, using mock", error);
    return mockSubmissions;
  }
}

export async function apiCreateAssignmentSubmission(
  assignmentId: string,
  files: File[],
  comment?: string
): Promise<AssignmentSubmission> {
  const formData = new FormData();
  if (comment) {
    formData.append("comment", comment);
  }
  for (const file of files) {
    formData.append("files[]", file);
  }

  const token = getAccessToken();

  try {
    const res = await fetch(
      `${API_BASE_URL}/assignments/${assignmentId}/submissions`,
      {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return (await res.json()) as AssignmentSubmission;
  } catch (error) {
    console.warn(
      "apiCreateAssignmentSubmission failed, using mock last submission",
      error
    );
    return mockSubmissions[mockSubmissions.length - 1];
  }
}

// ========= TESTS =========

export async function apiGetCourseTests(
  courseId: string
): Promise<CourseTestListItem[]> {
  try {
    return await request<CourseTestListItem[]>(`/courses/${courseId}/tests`);
  } catch (error) {
    console.warn("apiGetCourseTests failed, using mock", error);
    return mockTestsList;
  }
}

export async function apiGetTest(testId: string): Promise<TestDetail> {
  try {
    return await request<TestDetail>(`/tests/${testId}`);
  } catch (error) {
    console.warn("apiGetTest failed, using mock", error);
    return mockTestDetail;
  }
}

export async function apiSubmitTest(
  testId: string,
  answers: TestAttemptAnswer[]
): Promise<TestAttemptResult> {
  try {
    return await request<TestAttemptResult>(`/tests/${testId}/attempts`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    });
  } catch (error) {
    console.warn("apiSubmitTest failed, using mock", error);
    return mockTestAttemptResult;
  }
}

// ========= CHAT =========

export async function apiGetChatChannels(
  courseId: string
): Promise<ChatChannel[]> {
  try {
    return await request<ChatChannel[]>(`/courses/${courseId}/chat/channels`);
  } catch (error) {
    console.warn("apiGetChatChannels failed, using mock", error);
    return mockChatChannels;
  }
}

export async function apiGetChatMessages(
  channelId: string,
  cursor?: string
): Promise<ChatMessagesResponse> {
  try {
    const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return await request<ChatMessagesResponse>(
      `/chat/channels/${channelId}/messages${qs}`
    );
  } catch (error) {
    console.warn("apiGetChatMessages failed, using mock", error);
    return mockChatMessages;
  }
}

export async function apiSendChatMessage(
  channelId: string,
  text: string
): Promise<void> {
  try {
    await request(`/chat/channels/${channelId}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  } catch (error) {
    console.warn("apiSendChatMessage failed (mock: ignore)", error);
  }
}

// ========= GRADES =========

export async function apiGetCourseGrades(
  courseId: string
): Promise<CourseGrades> {
  try {
    return await request<CourseGrades>(`/courses/${courseId}/grades`);
  } catch (error) {
    console.warn("apiGetCourseGrades failed, using mock", error);
    return mockCourseGrades;
  }
}

// ========= CALENDAR =========

export async function apiGetCalendar(
  from: string,
  to: string
): Promise<CalendarEvent[]> {
  try {
    const qs = `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    return await request<CalendarEvent[]>(`/calendar${qs}`);
  } catch (error) {
    console.warn("apiGetCalendar failed, using mock", error);
    return mockCalendarEvents;
  }
}

// ========= NOTIFICATIONS =========

export async function apiGetNotifications(): Promise<NotificationItem[]> {
  try {
    return await request<NotificationItem[]>("/notifications");
  } catch (error) {
    console.warn("apiGetNotifications failed, using mock", error);
    return mockNotifications;
  }
}

export async function apiMarkNotificationRead(
  notificationId: string
): Promise<boolean> {
  try {
    await request(`/notifications/${notificationId}/read`, {
      method: "POST",
      body: JSON.stringify({ read: true }),
    });
    return true;
  } catch (error) {
    console.warn("apiMarkNotificationRead failed (mock: ignore)", error);
    return true;
  }
}
