import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  ListTodo,
  GraduationCap,
  ChevronRight,
  PlayCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import {
  apiGetCourseOverview,
  apiGetCourseMaterials,
  apiGetCourseAssignments,
  apiGetCourseTests,
  apiGetCourseGrades,
} from "@/api/api";

import type {
  CourseOverview,
  CourseModuleMaterials,
  AssignmentListItem,
  CourseTestListItem,
  CourseGrades,
} from "@/api/types";

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();

  const [overview, setOverview] = useState<CourseOverview | null>(null);
  const [materials, setMaterials] = useState<CourseModuleMaterials[]>([]);
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([]);
  const [tests, setTests] = useState<CourseTestListItem[]>([]);
  const [grades, setGrades] = useState<CourseGrades | null>(null);

  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [ov, mats, ass, tst, grd] = await Promise.all([
          apiGetCourseOverview(courseId),
          apiGetCourseMaterials(courseId),
          apiGetCourseAssignments(courseId),
          apiGetCourseTests(courseId),
          apiGetCourseGrades(courseId),
        ]);

        if (cancelled) return;

        setOverview(ov);
        setMaterials(mats);
        setAssignments(ass);
        setTests(tst);
        setGrades(grd);
        setActiveModuleId(ov.modules[0]?.id ?? null);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError("Не удалось загрузить данные курса");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const totalProgress = overview?.progressPercent ?? 0;

  const nearestDeadline = useMemo(() => {
    if (!overview) return null;
    if (!overview.upcomingDeadlines?.length) return null;
    const sorted = [...overview.upcomingDeadlines].sort(
      (a, b) => +new Date(a.deadline) - +new Date(b.deadline)
    );
    return sorted[0];
  }, [overview]);

  if (!courseId) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">
          Курс не найден. Неверный адрес.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/courses">
              <ArrowLeft className="mr-1 h-4 w-4" />К списку курсов
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {overview?.title ?? "Загрузка курса..."}
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              {overview?.description ??
                "Мы загружаем данные о курсе. Подождите немного."}
            </p>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end gap-2">
          <Badge variant={totalProgress === 100 ? "default" : "outline"}>
            {totalProgress === 100 ? "Курс завершён" : "Идёт обучение"}
          </Badge>
          <Button className="gap-2" asChild>
            <Link to={`/courses/${courseId}/learn`}>
              <PlayCircle className="h-4 w-4" />
              {totalProgress === 100
                ? "Пересмотреть материалы"
                : "Продолжить обучение"}
            </Link>
          </Button>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Прогресс по курсу
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">
                {totalProgress.toFixed(0)}%
              </span>
              {overview && (
                <span className="text-xs text-muted-foreground">
                  {
                    overview.modules.filter((m) => m.status === "completed")
                      .length
                  }{" "}
                  из {overview.modules.length} модулей
                </span>
              )}
            </div>
            <Progress value={totalProgress} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ДЗ и тесты
            </CardTitle>
            <ListTodo className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <span>Домашних заданий</span>
              <span className="font-semibold">{assignments.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Тестов</span>
              <span className="font-semibold">{tests.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Итоговый балл
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {grades ? (
              <>
                <div className="text-2xl font-bold">
                  {grades.totalScore}/{grades.maxTotalScore}
                </div>
                <p className="text-xs text-muted-foreground">
                  Сумма по всем заданиям курса
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Оценки ещё не сформированы
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Layout: left (modules) + right (deadlines/tests) */}
      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        {/* Modules & materials */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border">
            <CardTitle>Модули курса</CardTitle>
            <CardDescription>
              Открывайте модуль, чтобы увидеть уроки, ДЗ и тесты
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading && (
              <div className="p-6 text-sm text-muted-foreground">
                Загружаем структуру курса...
              </div>
            )}

            {!isLoading && overview && overview.modules.length === 0 && (
              <div className="p-6 text-sm text-muted-foreground">
                В этом курсе ещё нет модулей.
              </div>
            )}

            {!isLoading && overview && overview.modules.length > 0 && (
              <div className="divide-y divide-border">
                {overview.modules.map((mod) => {
                  const moduleMaterials =
                    materials.find((m) => m.id === mod.id)?.items ?? [];
                  const moduleAssignments = assignments.filter(
                    (a) => a.module === mod.title
                  );
                  const moduleTests = tests.filter(
                    (t) => t.module === mod.title
                  );
                  const isActive = activeModuleId === mod.id;

                  return (
                    <motion.div
                      key={mod.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setActiveModuleId((prev) =>
                            prev === mod.id ? null : mod.id
                          )
                        }
                        className={cn(
                          "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors",
                          "hover:bg-accent/30",
                          isActive && "bg-accent/40"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-xl text-primary",
                              mod.status === "completed"
                                ? "bg-primary/10"
                                : "bg-muted"
                            )}
                          >
                            {mod.status === "completed" ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <BookOpen className="h-5 w-5" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium">{mod.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {mod.completedLessons}/{mod.lessons} уроков ·{" "}
                              {moduleMaterials.length} материалов ·{" "}
                              {moduleAssignments.length} ДЗ ·{" "}
                              {moduleTests.length} тестов
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-muted-foreground">
                            Прогресс
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                              {mod.progressPercent.toFixed(0)}%
                            </span>
                            <ChevronRight
                              className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform",
                                isActive && "rotate-90"
                              )}
                            />
                          </div>
                        </div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden border-t border-border bg-muted/40"
                          >
                            <div className="grid gap-4 px-4 py-3 md:grid-cols-2">
                              {/* Materials */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                                    Материалы
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {moduleMaterials.length}
                                  </span>
                                </div>
                                {moduleMaterials.length === 0 ? (
                                  <p className="text-xs text-muted-foreground">
                                    В этом модуле пока нет материалов.
                                  </p>
                                ) : (
                                  <ul className="space-y-1.5">
                                    {moduleMaterials.map((mat) => (
                                      <li key={mat.id}>
                                        <Link
                                          to={`/courses/${courseId}/learn?material=${mat.id}`}
                                          className="flex items-center justify-between rounded-md bg-background px-2 py-1.5 text-xs shadow-sm hover:bg-accent/40 transition-colors"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span
                                              className={cn(
                                                "inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold",
                                                mat.type === "video" &&
                                                  "bg-primary/10 text-primary",
                                                mat.type === "text" &&
                                                  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
                                                mat.type === "file" &&
                                                  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
                                                mat.type === "scorm" &&
                                                  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                                              )}
                                            >
                                              {mat.type === "video" && "В"}
                                              {mat.type === "text" && "Т"}
                                              {mat.type === "file" && "F"}
                                              {mat.type === "scorm" && "S"}
                                            </span>
                                            <div>
                                              <p className="font-medium">
                                                {mat.title}
                                              </p>
                                              <p className="text-[11px] text-muted-foreground">
                                                {mat.durationMinutes
                                                  ? `${mat.durationMinutes} мин`
                                                  : "без тайминга"}
                                              </p>
                                            </div>
                                          </div>
                                          {mat.status === "completed" ? (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                          ) : (
                                            <span className="text-[11px] text-muted-foreground">
                                              {mat.status === "in_progress"
                                                ? "в процессе"
                                                : "не начато"}
                                            </span>
                                          )}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>

                              {/* Assignments & tests (без перехода пока) */}
                              <div className="space-y-3">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold uppercase text-muted-foreground">
                                      Домашние задания
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {moduleAssignments.length}
                                    </span>
                                  </div>
                                  {moduleAssignments.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                      В этом модуле нет ДЗ.
                                    </p>
                                  ) : (
                                    <ul className="space-y-1.5">
                                      {moduleAssignments.map((ass) => (
                                        <li
                                          key={ass.id}
                                          className="flex items-center justify-between rounded-md bg-background px-2 py-1.5 text-xs shadow-sm"
                                        >
                                          <div className="flex items-center gap-2">
                                            <FileText className="h-3.5 w-3.5 text-primary" />
                                            <div>
                                              <p className="font-medium">
                                                {ass.title}
                                              </p>
                                              <p className="text-[11px] text-muted-foreground">
                                                дедлайн{" "}
                                                {new Date(
                                                  ass.deadline
                                                ).toLocaleDateString("ru-RU", {
                                                  day: "2-digit",
                                                  month: "short",
                                                })}
                                              </p>
                                            </div>
                                          </div>
                                          <span className="text-[11px] text-muted-foreground">
                                            {ass.status === "graded" &&
                                            ass.grade != null
                                              ? `${ass.grade} баллов`
                                              : ass.status === "submitted"
                                              ? "отправлено"
                                              : ass.status === "needs_revision"
                                              ? "на доработке"
                                              : "не выполнено"}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold uppercase text-muted-foreground">
                                      Тесты
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {moduleTests.length}
                                    </span>
                                  </div>
                                  {moduleTests.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                      Тестов в этом модуле нет.
                                    </p>
                                  ) : (
                                    <ul className="space-y-1.5">
                                      {moduleTests.map((tst) => (
                                        <li
                                          key={tst.id}
                                          className="flex items-center justify-between rounded-md bg-background px-2 py-1.5 text-xs shadow-sm"
                                        >
                                          <div className="flex items-center gap-2">
                                            <ListTodo className="h-3.5 w-3.5 text-primary" />
                                            <div>
                                              <p className="font-medium">
                                                {tst.title}
                                              </p>
                                              <p className="text-[11px] text-muted-foreground">
                                                попыток: {tst.attemptsUsed}/
                                                {tst.attemptsLimit}
                                              </p>
                                            </div>
                                          </div>
                                          <span className="text-[11px] text-muted-foreground">
                                            {tst.bestScorePercent != null
                                              ? `${tst.bestScorePercent}%`
                                              : "ещё не пройден"}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deadlines / tests overview */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Ближайшие дедлайны
              </CardTitle>
              <CardDescription>
                Следите за тем, что нужно сделать в первую очередь.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!overview || overview.upcomingDeadlines.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Запланированных дедлайнов пока нет.
                </p>
              ) : (
                overview.upcomingDeadlines.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{d.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {d.type === "assignment"
                          ? "Домашнее задание"
                          : d.type === "test"
                          ? "Тест"
                          : "Событие"}{" "}
                        ·{" "}
                        {new Date(d.deadline).toLocaleString("ru-RU", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {nearestDeadline?.id === d.id && (
                      <Badge variant="outline">Самый близкий</Badge>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-primary" />
                Тесты по курсу
              </CardTitle>
              <CardDescription>
                Управляйте попытками и следите за результатами.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {tests.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Тестов по этому курсу пока нет.
                </p>
              ) : (
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="mb-2">
                    <TabsTrigger value="all">Все</TabsTrigger>
                    <TabsTrigger value="pending">Не пройдены</TabsTrigger>
                    <TabsTrigger value="done">Пройдены</TabsTrigger>
                  </TabsList>
                  <TabsContent value="all" className="space-y-2">
                    {tests.map((t) => (
                      <TestRow key={t.id} test={t} />
                    ))}
                  </TabsContent>
                  <TabsContent value="pending" className="space-y-2">
                    {tests
                      .filter((t) => t.status !== "completed")
                      .map((t) => (
                        <TestRow key={t.id} test={t} />
                      ))}
                  </TabsContent>
                  <TabsContent value="done" className="space-y-2">
                    {tests
                      .filter((t) => t.status === "completed")
                      .map((t) => (
                        <TestRow key={t.id} test={t} />
                      ))}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const TestRow = ({ test }: { test: CourseTestListItem }) => {
  const best = test.bestScorePercent;
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm">
      <div className="space-y-1">
        <p className="font-medium">{test.title}</p>
        <p className="text-[11px] text-muted-foreground">
          модуль {test.module} · попыток {test.attemptsUsed}/
          {test.attemptsLimit}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-[11px] text-muted-foreground">
          {best != null ? `лучший результат: ${best}%` : "ещё не проходили"}
        </span>
        <Button size="sm" variant="outline" className="gap-1">
          Пройти
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default CourseDetail;
