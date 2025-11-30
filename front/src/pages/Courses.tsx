// src/pages/Courses.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  PlayCircle,
} from "lucide-react";

import { apiGetStudentCourses } from "@/api/api";
import type { StudentCourse, CourseStatus } from "@/api/types";

const Courses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabFromUrl = searchParams.get("status");
  const [activeTab, setActiveTab] = useState<
    "all" | "in_progress" | "completed"
  >(
    tabFromUrl === "in_progress" || tabFromUrl === "completed"
      ? tabFromUrl
      : "all"
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiGetStudentCourses("all");

        // Защита от странных ответов: всегда приводим к массиву
        const normalized: StudentCourse[] = Array.isArray(data) ? data : [];

        if (!cancelled) {
          setCourses(normalized);
        }
      } catch (e) {
        console.error("load courses failed", e);
        if (!cancelled) {
          setError("Не удалось загрузить курсы");
          setCourses([]); // на всякий случай
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // синхронизация таба с query-параметром
  useEffect(() => {
    setSearchParams(activeTab === "all" ? {} : { status: activeTab }, {
      replace: true,
    });
  }, [activeTab, setSearchParams]);

  // безопасный массив, даже если кто-то вдруг поменяет тип стейта
  const safeCourses: StudentCourse[] = useMemo(
    () => (Array.isArray(courses) ? courses : []),
    [courses]
  );

  const filteredCourses = useMemo(() => {
    if (activeTab === "all") return safeCourses;

    const map: Record<"in_progress" | "completed", CourseStatus[]> = {
      in_progress: ["in_progress", "not_started"],
      completed: ["completed"],
    };

    const allowedStatuses = map[activeTab];

    return safeCourses.filter((c) => allowedStatuses.includes(c.status));
  }, [safeCourses, activeTab]);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Мои курсы</h1>
          <p className="text-sm text-muted-foreground">
            Продолжайте обучение, следите за прогрессом и дедлайнами.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/calendar">
              <CalendarDays className="mr-2 h-4 w-4" />
              Календарь дедлайнов
            </Link>
          </Button>
        </div>
      </div>

      {/* Статистика по курсам */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Всего курсов</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeCourses.length}</div>
            <p className="text-xs text-muted-foreground">
              Активные и завершённые программы.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              В процессе обучения
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                safeCourses.filter(
                  (c) =>
                    c.status === "in_progress" || c.status === "not_started"
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Курсы, над которыми вы сейчас работаете.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Завершено</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeCourses.filter((c) => c.status === "completed").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Курсы, по которым завершены все активности.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs + список курсов */}
      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Список курсов</CardTitle>
              <CardDescription>
                Выберите курс, чтобы посмотреть детали и материалы.
              </CardDescription>
            </div>
            <Tabs
              value={activeTab}
              onValueChange={(val) =>
                setActiveTab(val as "all" | "in_progress" | "completed")
              }
              className="w-full md:w-auto"
            >
              <TabsList>
                <TabsTrigger value="all">Все</TabsTrigger>
                <TabsTrigger value="in_progress">В процессе</TabsTrigger>
                <TabsTrigger value="completed">Завершённые</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <div className="p-6 text-sm text-muted-foreground">
              Загружаем ваши курсы...
            </div>
          )}

          {!isLoading && error && (
            <div className="p-6 text-sm text-destructive">{error}</div>
          )}

          {!isLoading && !error && filteredCourses.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground">
              Курсов для выбранного фильтра пока нет.
            </div>
          )}

          {!isLoading && !error && filteredCourses.length > 0 && (
            <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const CourseCard = ({ course }: { course: StudentCourse }) => {
  const isCompleted = course.status === "completed";
  const isInProgress = course.status === "in_progress";

  return (
    <Card className="flex flex-col justify-between overflow-hidden">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={isCompleted ? "default" : "outline"}>
            {isCompleted
              ? "Завершён"
              : isInProgress
              ? "В процессе"
              : "Не начат"}
          </Badge>
          {course.nextDeadline && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              {new Date(course.nextDeadline).toLocaleDateString("ru-RU", {
                day: "2-digit",
                month: "short",
              })}
            </span>
          )}
        </div>
        <CardTitle className="line-clamp-2 text-base">{course.title}</CardTitle>
        <CardDescription className="line-clamp-2 text-xs">
          {course.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pb-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <BookOpen className="h-3 w-3" />
              Прогресс
            </span>
            <span className="font-medium">
              {course.progressPercent.toFixed(0)}%
            </span>
          </div>
          <Progress value={course.progressPercent} className="h-2" />
        </div>

        {course.badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {course.badges.map((b) => (
              <Badge
                key={b}
                variant="outline"
                className="text-[10px] font-normal"
              >
                {b}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-col text-[11px] text-muted-foreground">
            <span>Преподаватель</span>
            <span className="font-medium text-foreground">
              {course.instructor}
            </span>
          </div>
          <Button asChild size="sm" className="gap-1 text-xs">
            <Link to={`/courses/${course.id}`}>
              <PlayCircle className="h-4 w-4" />
              Открыть курс
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Courses;
