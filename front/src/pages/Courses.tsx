import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Clock, Users, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data
const courses = [
  {
    id: 1,
    title: "Основы финтех-разработки",
    description: "Изучите основы создания финансовых приложений",
    instructor: "Анна Смирнова",
    progress: 65,
    nextDeadline: "23 декабря",
    nextAction: "Сдать ДЗ 3.2",
    status: "active",
    modules: 8,
    completedModules: 5,
    hasNewComments: true,
  },
  {
    id: 2,
    title: "Кибербезопасность в банковской сфере",
    description: "Защита данных и транзакций",
    instructor: "Дмитрий Петров",
    progress: 40,
    nextDeadline: "25 декабря",
    nextAction: "Пройти тест 2.1",
    status: "active",
    modules: 6,
    completedModules: 2,
    hasNewComments: false,
  },
  {
    id: 3,
    title: "Agile методологии в разработке",
    description: "Управление проектами и командная работа",
    instructor: "Елена Волкова",
    progress: 100,
    nextDeadline: null,
    nextAction: null,
    status: "completed",
    modules: 5,
    completedModules: 5,
    hasNewComments: false,
  },
  {
    id: 4,
    title: "Искусственный интеллект в финансах",
    description: "ML модели для предсказания и анализа",
    instructor: "Михаил Соколов",
    progress: 15,
    nextDeadline: "30 декабря",
    nextAction: "Завершить урок 1.3",
    status: "active",
    modules: 10,
    completedModules: 1,
    hasNewComments: false,
  },
];

const Courses = () => {
  // MOCK: В реальном приложении данные будут загружаться с бэкенда
  const activeCourses = courses.filter((c) => c.status === "active");
  const completedCourses = courses.filter((c) => c.status === "completed");

  const CourseCard = ({ course }: { course: typeof courses[0] }) => (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/20",
        course.hasNewComments && "ring-2 ring-accent"
      )}
    >
      {course.hasNewComments && (
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
              {course.completedModules}/{course.modules} модулей
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Прогресс</span>
            <span className="font-semibold">{course.progress}%</span>
          </div>
          <Progress value={course.progress} className="h-2" />
        </div>

        {/* Next Action */}
        {course.nextAction && course.nextDeadline && (
          <div className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3">
            <Clock className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">{course.nextAction}</p>
              <p className="text-xs text-muted-foreground">до {course.nextDeadline}</p>
            </div>
          </div>
        )}

        {course.status === "completed" && (
          <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-success">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Курс завершён</span>
          </div>
        )}

        {/* Actions */}
        <Link to={`/courses/${course.id}`}>
          <Button className="w-full group/btn">
            {course.status === "completed" ? "Посмотреть курс" : "Продолжить обучение"}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );

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
            <div className="text-2xl font-bold">{activeCourses.length}</div>
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
            <div className="text-2xl font-bold">{completedCourses.length}</div>
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
            <div className="text-2xl font-bold">23 дек</div>
          </CardContent>
        </Card>
      </div>

      {/* Course List */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Активные ({activeCourses.length})</TabsTrigger>
          <TabsTrigger value="completed">Завершённые ({completedCourses.length})</TabsTrigger>
          <TabsTrigger value="all">Все ({courses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {activeCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {completedCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Courses;
