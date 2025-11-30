import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Clock,
  Users,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { apiGetStudentCourses } from "@/api/api";
import type { StudentCourse } from "@/api/types";

const Courses = () => {
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await apiGetStudentCourses("all");
        if (!isMounted) return;
        setCourses(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const safeCourses = Array.isArray(courses) ? courses : [];
  const activeCourses = safeCourses.filter((c) => c.status === "in_progress");
  const completedCourses = safeCourses.filter((c) => c.status === "completed");

  const nearestDeadline = useMemo(() => {
    const withDeadlines = courses.filter((c) => c.nextDeadline);
    if (!withDeadlines.length) return null;
    const min = withDeadlines.reduce((acc, cur) =>
      new Date(cur.nextDeadline!) < new Date(acc.nextDeadline!) ? cur : acc
    );
    return min.nextDeadline!;
  }, [courses]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "short",
    });

  const CourseCard = ({ course }: { course: StudentCourse }) => {
    const hasNewComments = false; // этого поля нет в API – пока заглушка
    const completedModules = Math.round(course.progressPercent / 25);
    const totalModules = 4;
    const progress = course.progressPercent;
    const isCompleted = course.status === "completed";

    const nextAction =
      !isCompleted && course.nextDeadline
        ? "Сдать ближайшее задание"
        : undefined;

    const nextDeadlineLabel = course.nextDeadline
      ? formatDate(course.nextDeadline)
      : null;

    return (
      <Card
        className={cn(
          "group relative overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/20",
          hasNewComments && "ring-2 ring-accent"
        )}
      >
        {hasNewComments && (
          <div className="absolute right-4 top-4 z-10">
            <Badge variant="default" className="bg-accent">
              Новые комментарии
            </Badge>
          </div>
        )}

        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl group-hover:text-primary transition-colors">
                {course.title}
              </CardTitle>
              <CardDescription>{course.description}</CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{course.instructor}</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>
                {completedModules}/{totalModules} модулей
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Прогресс</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Next Action */}
          {nextAction && nextDeadlineLabel && (
            <div className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3">
              <Clock className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{nextAction}</p>
                <p className="text-xs text-muted-foreground">
                  до {nextDeadlineLabel}
                </p>
              </div>
            </div>
          )}

          {isCompleted && (
            <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-success">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Курс завершён</span>
            </div>
          )}

          {/* Actions */}
          <Link to={`/courses/${course.id}`}>
            <Button className="w-full group/btn">
              {isCompleted ? "Посмотреть курс" : "Продолжить обучение"}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Мои курсы</h1>
        <p className="text-muted-foreground">
          Управляйте своим обучением и отслеживайте прогресс
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Активных курсов
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "…" : activeCourses.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Завершённых курсов
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "…" : completedCourses.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ближайший дедлайн
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nearestDeadline ? formatDate(nearestDeadline) : "Нет дедлайнов"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course List */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Активные ({activeCourses.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Завершённые ({completedCourses.length})
          </TabsTrigger>
          <TabsTrigger value="all">Все ({courses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">
              Загружаем курсы...
            </div>
          ) : activeCourses.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Активные курсы пока не найдены
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">
              Загружаем курсы...
            </div>
          ) : completedCourses.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Завершённых курсов пока нет
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {completedCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">
              Загружаем курсы...
            </div>
          ) : courses.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Курсы пока не найдены
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Courses;
