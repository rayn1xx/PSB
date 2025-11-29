import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  PlayCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import {
  apiGetCourseOverview,
  apiGetCourseMaterials,
  apiGetMaterial,
  apiUpdateMaterialProgress,
} from "@/api/api";

import type {
  CourseOverview,
  CourseModuleMaterials,
  MaterialDetail,
} from "@/api/types";

// ===== type guards =====

type WithUrl = { url: string };
type WithText = { text: string };
type WithHtml = { html: string };

function hasUrl(m: MaterialDetail): m is MaterialDetail & WithUrl {
  return "url" in m && typeof (m as WithUrl).url === "string";
}

function hasText(m: MaterialDetail): m is MaterialDetail & WithText {
  return "text" in m && typeof (m as WithText).text === "string";
}

function hasHtml(m: MaterialDetail): m is MaterialDetail & WithHtml {
  return "html" in m && typeof (m as WithHtml).html === "string";
}

const CourseLearn = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [overview, setOverview] = useState<CourseOverview | null>(null);
  const [modules, setModules] = useState<CourseModuleMaterials[]>([]);
  const [currentMaterial, setCurrentMaterial] = useState<MaterialDetail | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMaterial, setLoadingMaterial] = useState(false);

  const materialIdFromQuery = searchParams.get("material") || undefined;

  // плоский список материалов из модулей (для durationMinutes и статуса)
  const flatMaterials = useMemo(
    () => modules.flatMap((m) => m.items),
    [modules]
  );

  const currentMeta = useMemo(
    () =>
      currentMaterial
        ? flatMaterials.find((m) => m.id === currentMaterial.id)
        : undefined,
    [flatMaterials, currentMaterial]
  );

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const [ov, mats] = await Promise.all([
          apiGetCourseOverview(courseId),
          apiGetCourseMaterials(courseId),
        ]);
        if (cancelled) return;
        setOverview(ov);
        setModules(mats);

        const all = mats.flatMap((m) => m.items);
        const firstTarget =
          (materialIdFromQuery &&
            all.find((m) => m.id === materialIdFromQuery)) ||
          all.find((m) => m.status === "in_progress") ||
          all.find((m) => m.status === "not_started") ||
          all[0];

        if (firstTarget) {
          await loadMaterial(firstTarget.id);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    async function loadMaterial(id: string) {
      setLoadingMaterial(true);
      try {
        const mat = await apiGetMaterial(id);
        if (!cancelled) {
          setCurrentMaterial(mat);
        }
      } finally {
        if (!cancelled) setLoadingMaterial(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const totalProgress = overview?.progressPercent ?? 0;

  const handleSelectMaterial = async (id: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("material", id);
      return next;
    });
    setLoadingMaterial(true);
    try {
      const mat = await apiGetMaterial(id);
      setCurrentMaterial(mat);
    } finally {
      setLoadingMaterial(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!currentMaterial) return;
    await apiUpdateMaterialProgress(currentMaterial.id, 100, true);
    setCurrentMaterial((prev) =>
      prev ? { ...prev, status: "completed", viewProgressPercent: 100 } : prev
    );
  };

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
    <div className="space-y-4 pb-20 md:pb-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/courses/${courseId}`}>
              <ArrowLeft className="mr-1 h-4 w-4" />К описанию курса
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {overview?.title ?? "Обучение по курсу"}
            </h1>
            <p className="text-xs text-muted-foreground max-w-xl">
              Здесь собраны все материалы курса. Выберите урок слева, чтобы
              продолжить обучение.
            </p>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end gap-2">
          <Badge variant={totalProgress === 100 ? "default" : "outline"}>
            Прогресс курса: {totalProgress.toFixed(0)}%
          </Badge>
          <Progress value={totalProgress} className="h-1.5 w-48" />
        </div>
      </div>

      {/* Layout: sidebar + content */}
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
        {/* Sidebar materials */}
        <Card className="h-full">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Структура курса
            </CardTitle>
            <CardDescription className="text-xs">
              Выберите модуль и материал для просмотра.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-xs text-muted-foreground">
                Загружаем материалы...
              </div>
            ) : modules.length === 0 ? (
              <div className="p-4 text-xs text-muted-foreground">
                В этом курсе пока нет материалов.
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-y-auto">
                {modules.map((mod) => (
                  <div key={mod.id} className="border-b border-border/60">
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/40 text-primary">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold">{mod.title}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {mod.items.length} материалов
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1 pb-2">
                      {mod.items.map((mat) => {
                        const isActive = currentMaterial?.id === mat.id;
                        return (
                          <button
                            key={mat.id}
                            type="button"
                            onClick={() => handleSelectMaterial(mat.id)}
                            className={cn(
                              "flex w-full items-center justify-between px-4 py-1.5 text-left text-xs transition-colors",
                              isActive
                                ? "bg-accent text-foreground"
                                : "hover:bg-accent/40"
                            )}
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
                                <p className="font-medium line-clamp-1">
                                  {mat.title}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {mat.durationMinutes
                                    ? `${mat.durationMinutes} мин`
                                    : "без тайминга"}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-0.5">
                              {mat.status === "completed" ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <span className="text-[11px] text-muted-foreground">
                                  {mat.status === "in_progress"
                                    ? "в процессе"
                                    : "не начато"}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Learning content */}
        <Card className="h-full">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PlayCircle className="h-4 w-4 text-primary" />
                  {currentMaterial?.title ?? "Выберите материал слева"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {currentMaterial?.type === "video" &&
                    "Видео-урок: внимательно посмотрите ролик и отметьте его как завершённый."}
                  {currentMaterial?.type === "text" &&
                    "Текстовый материал: прочитайте и переходите к следующему шагу."}
                  {currentMaterial?.type === "file" &&
                    "Файл: скачайте и изучите материал."}
                  {currentMaterial?.type === "scorm" &&
                    "Интерактивный модуль SCORM."}
                  {!currentMaterial &&
                    "Для начала обучения выберите урок в списке модулей."}
                </CardDescription>
              </div>

              {currentMaterial && (
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className="text-[10px]">
                    {currentMaterial.status === "completed"
                      ? "завершён"
                      : currentMaterial.status === "in_progress"
                      ? "в процессе"
                      : "не начат"}
                  </Badge>
                  {typeof currentMaterial.viewProgressPercent === "number" && (
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>
                        {currentMaterial.viewProgressPercent.toFixed(0)}%
                      </span>
                      <Progress
                        value={currentMaterial.viewProgressPercent}
                        className="h-1 w-24"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-full min-h-[320px]">
              {loadingMaterial && (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Загружаем материал...
                </div>
              )}

              {!loadingMaterial && !currentMaterial && (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground px-4 text-center">
                  Выберите урок в списке слева, чтобы начать обучение.
                </div>
              )}

              {!loadingMaterial && currentMaterial && (
                <div className="flex h-full flex-col gap-3 p-4">
                  {/* Основной контент */}
                  <motion.div
                    key={currentMaterial.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 space-y-3"
                  >
                    {currentMaterial.type === "video" &&
                      hasUrl(currentMaterial) && (
                        <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                          <iframe
                            src={currentMaterial.url}
                            className="h-full w-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={currentMaterial.title}
                          />
                        </div>
                      )}

                    {currentMaterial.type === "text" &&
                      (hasHtml(currentMaterial) ||
                        hasText(currentMaterial)) && (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          {hasHtml(currentMaterial) ? (
                            <div
                              dangerouslySetInnerHTML={{
                                __html: currentMaterial.html,
                              }}
                            />
                          ) : hasText(currentMaterial) ? (
                            <p>{currentMaterial.text}</p>
                          ) : null}
                        </div>
                      )}

                    {currentMaterial.type === "file" &&
                      hasUrl(currentMaterial) && (
                        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-xs">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="font-medium">
                              {currentMaterial.title}
                            </span>
                          </div>
                          <p className="text-muted-foreground">
                            Скачайте файл и изучите материал. После этого
                            отметьте урок как завершённый.
                          </p>
                          <Button size="sm" variant="outline" asChild>
                            <a
                              href={currentMaterial.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Скачать файл
                            </a>
                          </Button>
                        </div>
                      )}

                    {currentMaterial.type === "scorm" &&
                      hasUrl(currentMaterial) && (
                        <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                          <iframe
                            src={currentMaterial.url}
                            className="h-full w-full border-0"
                            title={currentMaterial.title}
                          />
                        </div>
                      )}

                    {!hasUrl(currentMaterial) &&
                      !hasHtml(currentMaterial) &&
                      !hasText(currentMaterial) && (
                        <p className="text-xs text-muted-foreground">
                          Для этого материала пока нет встроенного контента. Он
                          может быть доступен через внешние ссылки или описание.
                        </p>
                      )}
                  </motion.div>

                  {/* Панель действий */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-xs">
                    <div className="flex flex-col gap-1 text-muted-foreground">
                      {currentMeta?.durationMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {currentMeta.durationMinutes} минут
                        </span>
                      )}
                      <span>
                        Тип:{" "}
                        {currentMaterial.type === "video"
                          ? "видео"
                          : currentMaterial.type === "text"
                          ? "текст"
                          : currentMaterial.type === "file"
                          ? "файл"
                          : "интерактивный модуль"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={
                          currentMaterial.status === "completed"
                            ? "outline"
                            : "default"
                        }
                        onClick={handleMarkComplete}
                      >
                        {currentMaterial.status === "completed" ? (
                          <>
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Отмечен как завершённый
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Отметить завершённым
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Дополнительные вкладки */}
      <Tabs defaultValue="info" className="mt-2">
        <TabsList>
          <TabsTrigger value="info">О курсе</TabsTrigger>
          <TabsTrigger value="help">Как учиться</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="mt-2">
          <Card>
            <CardContent className="py-3 text-xs text-muted-foreground">
              {overview?.description ??
                "Это обучающий курс. Выполняйте материалы по очереди и следите за прогрессом."}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="help" className="mt-2">
          <Card>
            <CardContent className="py-3 text-xs text-muted-foreground space-y-1">
              <p>
                1. Выберите урок слева и внимательно изучите материал
                (видео/текст/файл).
              </p>
              <p>
                2. После выполнения отметьте урок как завершённым кнопкой
                «Отметить завершённым».
              </p>
              <p>
                3. Возвращайтесь к описанию курса, чтобы выполнять ДЗ и тесты.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseLearn;
