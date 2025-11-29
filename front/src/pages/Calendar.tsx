import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { apiGetCalendar } from "@/api/api";
import type { CalendarEvent } from "@/api/types";

const Calendar = () => {
  // MOCK: В реальном приложении события будут загружаться с бэкенда
  const [currentDate] = useState(new Date()); // можно оставить как есть
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const start = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
        const end = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0
        );

        const from = start.toISOString().slice(0, 10);
        const to = end.toISOString().slice(0, 10);

        const data = await apiGetCalendar(from, to);
        if (!isMounted) return;
        setEvents(data);
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
  }, [currentDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const getEventsForDate = (day: number) => {
    const dateString = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((event) => event.date === dateString);
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startingDayOfWeek }, (_, i) => i);

  const getEventColor = (type: string) => {
    return type === "assignment"
      ? "bg-accent text-accent-foreground"
      : "bg-primary text-primary-foreground";
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Календарь</h1>
        <p className="text-muted-foreground">
          Отслеживайте дедлайны и важные события
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_350px]">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Декабрь 2024</CardTitle>
              <div className="flex gap-1">
                <Button variant="outline" size="icon">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Week Days */}
              <div className="grid grid-cols-7 gap-2">
                {["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"].map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-muted-foreground p-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {emptyDays.map((_, idx) => (
                  <div key={`empty-${idx}`} className="aspect-square" />
                ))}
                {days.map((day) => {
                  const dayEvents = getEventsForDate(day);
                  const isToday = day === 15; // Mock today

                  return (
                    <div
                      key={day}
                      className={cn(
                        "relative aspect-square rounded-lg border p-2 transition-colors hover:bg-secondary/50",
                        isToday && "ring-2 ring-primary"
                      )}
                    >
                      <div className="flex flex-col h-full">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isToday && "text-primary font-bold"
                          )}
                        >
                          {day}
                        </span>
                        <div className="flex-1 flex flex-col gap-1 mt-1">
                          {dayEvents.slice(0, 2).map((event, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "h-1.5 rounded-full",
                                getEventColor(event.type)
                              )}
                            />
                          ))}
                          {dayEvents.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{dayEvents.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Ближайшие события
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {events.map((event, idx) => {
                const date = new Date(event.date);
                const dateStr = date.toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "short",
                });

                return (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center min-w-[48px]">
                      <div
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-lg",
                          getEventColor(event.type)
                        )}
                      >
                        <span className="text-xs font-semibold">{dateStr}</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">
                          {event.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {event.course}
                        </Badge>
                        <span>•</span>
                        <span className="capitalize">
                          {event.type === "assignment" ? "Задание" : "Тест"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Легенда</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-accent" />
                <span className="text-sm">Домашние задания</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-sm">Тесты и экзамены</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
