import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Clock,
  Users,
  Play,
  FileText,
  ClipboardList,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  Circle,
  ChevronRight,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CourseDetail = () => {
  const { courseId } = useParams();

  // MOCK: В реальном приложении данные будут загружаться с бэкенда по courseId
  const course = {
    id: courseId,
    title: "Основы финтех-разработки",
    description:
      "Комплексный курс по созданию финансовых приложений с использованием современных технологий",
    instructor: "Анна Смирнова",
    progress: 65,
    duration: "8 недель",
    students: 124,
  };

  const modules = [
    {
      id: 1,
      title: "Введение в финтех",
      progress: 100,
      lessons: 5,
      completedLessons: 5,
      status: "completed",
    },
    {
      id: 2,
      title: "Архитектура финансовых систем",
      progress: 100,
      lessons: 6,
      completedLessons: 6,
      status: "completed",
    },
    {
      id: 3,
      title: "Безопасность и шифрование",
      progress: 60,
      lessons: 8,
      completedLessons: 5,
      status: "in-progress",
    },
    {
      id: 4,
      title: "Платёжные системы",
      progress: 0,
      lessons: 7,
      completedLessons: 0,
      status: "locked",
    },
  ];

  const assignments = [
    {
      id: 1,
      title: "ДЗ 3.2: Реализация API аутентификации",
      module: "Модуль 3",
      deadline: "23 декабря, 23:59",
      status: "submitted",
      grade: null,
      hasNewComments: true,
    },
    {
      id: 2,
      title: "ДЗ 2.1: Проектирование базы данных",
      module: "Модуль 2",
      deadline: "20 декабря, 23:59",
      status: "graded",
      grade: 9,
      hasNewComments: false,
    },
    {
      id: 3,
      title: "ДЗ 3.3: Тестирование безопасности",
      module: "Модуль 3",
      deadline: "26 декабря, 23:59",
      status: "not-started",
      grade: null,
      hasNewComments: false,
    },
  ];

  const upcomingEvents = [
    { date: "23 дек", title: "Дедлайн ДЗ 3.2", type: "assignment" },
    { date: "25 дек", title: "Тест по модулю 3", type: "test" },
    { date: "26 дек", title: "Дедлайн ДЗ 3.3", type: "assignment" },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; text: string; icon: any }> = {
      "not-started": { variant: "secondary", text: "Не начато", icon: Circle },
      submitted: { variant: "default", text: "Отправлено", icon: Clock },
      graded: { variant: "default", text: "Оценено", icon: CheckCircle2 },
    };

    const config = variants[status] || variants["not-started"];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6 max-w-[1400px] mx-auto">
      {/* Back Button */}
      <Link to="/">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Назад к курсам
        </Button>
      </Link>

      {/* Course Header */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-30" />
        <CardHeader className="relative">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-3xl">{course.title}</CardTitle>
              <CardDescription className="text-base">{course.description}</CardDescription>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{course.instructor}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{course.students} студентов</span>
                </div>
              </div>
            </div>

            <Button size="lg" className="gap-2 shrink-0">
              <Play className="h-4 w-4" />
              Продолжить
            </Button>
          </div>

          {/* Progress */}
          <div className="space-y-2 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Общий прогресс</span>
              <span className="font-semibold text-lg">{course.progress}%</span>
            </div>
            <Progress value={course.progress} className="h-3" />
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        {/* Main Content */}
        <div className="space-y-6">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              <TabsTrigger value="materials">Материалы</TabsTrigger>
              <TabsTrigger value="assignments">Задания</TabsTrigger>
              <TabsTrigger value="chat">Чат</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Модули курса</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {modules.map((module) => (
                    <div
                      key={module.id}
                      className={cn(
                        "group flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer",
                        module.status === "locked"
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-secondary/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg",
                            module.status === "completed" && "bg-success/20 text-success",
                            module.status === "in-progress" && "bg-primary/20 text-primary",
                            module.status === "locked" && "bg-muted"
                          )}
                        >
                          {module.status === "completed" ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <BookOpen className="h-5 w-5" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium">{module.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {module.completedLessons}/{module.lessons} уроков
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold">{module.progress}%</p>
                          <Progress value={module.progress} className="h-1 w-20" />
                        </div>
                        {module.status !== "locked" && (
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assignments Tab */}
            <TabsContent value="assignments" className="space-y-4">
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <Card
                    key={assignment.id}
                    className={cn(
                      "transition-all hover:shadow-md",
                      assignment.hasNewComments && "ring-2 ring-accent"
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{assignment.title}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{assignment.module}</span>
                            <Separator orientation="vertical" className="h-4" />
                            <Clock className="h-3 w-3" />
                            <span>{assignment.deadline}</span>
                          </div>
                        </div>
                        {getStatusBadge(assignment.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        {assignment.grade !== null && (
                          <Badge variant="secondary" className="text-base font-semibold">
                            Оценка: {assignment.grade}/10
                          </Badge>
                        )}
                        {assignment.hasNewComments && (
                          <Badge variant="default" className="bg-accent">
                            Новый комментарий
                          </Badge>
                        )}
                        <Link to={`/courses/${courseId}/assignments/${assignment.id}`}>
                          <Button variant="outline" size="sm" className="gap-2">
                            Открыть
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Materials Tab */}
            <TabsContent value="materials">
              <Card>
                <CardHeader>
                  <CardTitle>Учебные материалы</CardTitle>
                  <CardDescription>Видео, лекции и дополнительные ресурсы</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Выберите модуль для просмотра материалов
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Chat Tab */}
            <TabsContent value="chat">
              <Card>
                <CardHeader>
                  <CardTitle>Общий чат курса</CardTitle>
                  <CardDescription>Обсуждение с преподавателями и студентами</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Функция чата в разработке
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Upcoming Events */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Ближайшие события
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.map((event, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <span className="text-xs font-semibold">{event.date}</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{event.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{event.type}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Быстрые действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2">
                <BarChart3 className="h-4 w-4" />
                Журнал оценок
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <MessageSquare className="h-4 w-4" />
                Написать преподавателю
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileText className="h-4 w-4" />
                Скачать материалы
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
