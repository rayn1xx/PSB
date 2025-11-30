import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

import {
  ArrowLeft,
  FileText,
  UploadCloud,
  Paperclip,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import {
  apiGetAssignment,
  apiGetAssignmentSubmissions,
  apiCreateAssignmentSubmission,
} from "@/api/api";

import type {
  AssignmentDetail as AssignmentDetailType,
  AssignmentSubmission,
} from "@/api/types";

const statusLabel: Record<string, string> = {
  not_started: "не начато",
  in_progress: "в процессе",
  submitted: "отправлено",
  graded: "оценено",
  needs_revision: "на доработке",
  on_review: "на проверке",
};

const AssignmentDetailPage = () => {
  const { courseId, assignmentId } = useParams<{
    courseId: string;
    assignmentId: string;
  }>();

  const navigate = useNavigate();
  const { toast } = useToast();

  const [assignment, setAssignment] = useState<AssignmentDetailType | null>(
    null
  );
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assignmentId) return;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [ass, subs] = await Promise.all([
          apiGetAssignment(assignmentId),
          apiGetAssignmentSubmissions(assignmentId),
        ]);

        if (cancelled) return;

        setAssignment(ass);
        setSubmissions(Array.isArray(subs) ? subs : []);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError("Не удалось загрузить информацию о задании");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [assignmentId]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      setFiles([]);
      return;
    }
    const list = Array.from(e.target.files);
    setFiles(list);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!assignmentId) return;

    if (files.length === 0) {
      toast({
        variant: "destructive",
        title: "Файлы не выбраны",
        description: "Выберите хотя бы один файл перед отправкой.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const sub = await apiCreateAssignmentSubmission(
        assignmentId,
        files,
        comment.trim() || undefined
      );

      setSubmissions((prev) => [sub, ...prev]);
      setFiles([]);
      setComment("");

      toast({
        title: "Домашнее задание отправлено",
        description: "Файлы успешно загружены и отправлены на проверку.",
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Ошибка отправки",
        description:
          "Не удалось отправить задание. Попробуйте ещё раз чуть позже.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const currentStatusLabel = assignment?.status
    ? statusLabel[assignment.status] ?? assignment.status
    : "";

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Назад
          </Button>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                {assignment?.title ?? "Загрузка задания..."}
              </h1>
              {assignment && (
                <Badge variant="outline">{currentStatusLabel}</Badge>
              )}
            </div>

            {assignment && (
              <p className="text-sm text-muted-foreground max-w-2xl">
                Модуль: {assignment.module}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Основное содержимое */}
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)]">
        {/* Левая колонка: описание ДЗ + форма загрузки */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Описание задания</CardTitle>
              {assignment && (
                <CardDescription className="flex items-center gap-2 text-xs md:text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  Дедлайн:{" "}
                  {new Date(assignment.deadline).toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading && (
                <p className="text-sm text-muted-foreground">
                  Загружаем данные задания...
                </p>
              )}

              {error && (
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-[2px]" />
                  <span>{error}</span>
                </div>
              )}

              {assignment && (
                <>
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {assignment.description}
                  </p>

                  {assignment.teacherFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">
                        Материалы от преподавателя
                      </p>
                      <ul className="space-y-1.5">
                        {assignment.teacherFiles.map((f) => (
                          <li
                            key={f.id}
                            className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <Paperclip className="h-3.5 w-3.5 text-primary" />
                              <a
                                href={f.url}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:underline"
                              >
                                {f.name}
                              </a>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Форма загрузки файлов */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-primary" />
                Отправка домашнего задания
              </CardTitle>
              <CardDescription>
                Прикрепите один или несколько файлов с решением и при желании
                добавьте комментарий.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Файлы
                  </p>
                  <div className="flex flex-col gap-2">
                    <Input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Можно загружать любые форматы (PDF, DOCX, изображения,
                      архивы и т.д.).
                    </p>
                  </div>

                  {files.length > 0 && (
                    <div className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-2">
                      <p className="text-[11px] font-semibold text-muted-foreground mb-1">
                        Выбрано файлов: {files.length}
                      </p>
                      <ul className="space-y-0.5 max-h-28 overflow-y-auto text-[11px]">
                        {files.map((f) => (
                          <li key={f.name} className="flex items-center gap-2">
                            <Paperclip className="h-3 w-3 text-primary" />
                            <span className="truncate">{f.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Комментарий (необязательно)
                  </p>
                  <Textarea
                    placeholder="Например: основные решения в файле main.pdf, дополнительные расчёты в archive.zip"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
                  <p className="text-[11px] text-muted-foreground">
                    Нажимая кнопку «Отправить», вы отправляете текущую версию
                    решения на проверку.
                  </p>
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? "Отправка..." : "Отправить решение"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Правая колонка: отправленные работы */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Отправленные попытки
              </CardTitle>
              <CardDescription>
                История отправок этого задания и комментарии преподавателя.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {submissions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Вы ещё не отправляли это домашнее задание.
                </p>
              ) : (
                <div className="space-y-2 max-h-[460px] overflow-y-auto">
                  {submissions.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-lg border border-border bg-card px-3 py-2 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">
                          Отправлено{" "}
                          {new Date(s.createdAt).toLocaleString("ru-RU", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <Badge variant="outline">
                          {statusLabel[s.status] ?? s.status}
                        </Badge>
                      </div>

                      {s.grade != null && (
                        <p className="text-[11px] text-muted-foreground">
                          Оценка: {s.grade}
                        </p>
                      )}

                      {s.commentFromStudent && (
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold">
                            Ваш комментарий:
                          </p>
                          <p className="text-[11px] text-muted-foreground whitespace-pre-line">
                            {s.commentFromStudent}
                          </p>
                        </div>
                      )}

                      {s.files.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold">
                            Прикреплённые файлы:
                          </p>
                          <ul className="space-y-0.5">
                            {s.files.map((f) => (
                              <li
                                key={f.id}
                                className="flex items-center gap-1.5"
                              >
                                <Paperclip className="h-3 w-3 text-primary" />
                                <a
                                  href={f.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hover:underline truncate"
                                >
                                  {f.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {s.teacherComments.length > 0 && (
                        <div className="space-y-1 border-t border-dashed border-border pt-2">
                          <p className="text-[11px] font-semibold">
                            Комментарии преподавателя:
                          </p>
                          <ul className="space-y-1">
                            {s.teacherComments.map((c) => (
                              <li key={c.id} className="space-y-0.5">
                                <p className="text-[11px] font-medium">
                                  {c.author.name} ·{" "}
                                  {new Date(c.createdAt).toLocaleString(
                                    "ru-RU",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </p>
                                <p className="text-[11px] text-muted-foreground whitespace-pre-line">
                                  {c.text}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {courseId && (
            <Card>
              <CardContent className="py-3 flex items-center justify-between gap-2 text-xs">
                <p className="text-muted-foreground">
                  Вернуться к странице курса.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link to={`/courses/${courseId}`}>К курсу</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetailPage;
